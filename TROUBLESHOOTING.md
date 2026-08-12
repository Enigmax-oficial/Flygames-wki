# Troubleshooting sql.js-httpvfs & SQLite HTTP Range Requests

This guide documents the server configurations required for serverless client-side SQLite querying via HTTP Range Requests (`sql.js-httpvfs`). If range requests are misconfigured, the query engine will fail to fetch pages incrementally.

---

## 🚀 Key Deployment Requirements

### 1. HTTP Range Requests (`Accept-Ranges`)
The static file server hosting `data.sqlite` **must** announce support for partial content fetches using byte-range headers.
*   **Header to Expect:** The server response header for GET/HEAD requests to `.sqlite` files must include:
    ```http
    Accept-Ranges: bytes
    ```
*   **Testing with curl:**
    ```bash
    curl -I http://your-static-host.com/data.sqlite
    ```
    Ensure `Accept-Ranges: bytes` is present in the output.

---

### 2. Disable Content Compression (Gzip / Brotli)
Static hosts often compress text/binary assets by default to save bandwidth. However, **compressing `.sqlite` files completely breaks byte-range seeking** because the browser cannot seek to a specific uncompressed byte offset without decompressing the entire stream from the beginning.
*   **Configure your host (e.g., Netlify, Vercel, Cloudflare, NGINX)** to serve `.sqlite` or `.sqlite3` files without `Content-Encoding: gzip` or `Content-Encoding: br`.
*   **Checking with curl:**
    ```bash
    curl -I -H "Accept-Encoding: gzip, deflate, br" http://your-static-host.com/data.sqlite
    ```
    Ensure **no** `Content-Encoding` header (like `gzip` or `br`) is returned.

---

### 3. Cross-Origin Resource Sharing (CORS)
If the frontend static site is hosted on a different domain or port from the SQLite database file:
*   The database host server must respond with wildcard or origin-specific CORS headers:
    ```http
    Access-Control-Allow-Origin: *
    Access-Control-Allow-Headers: Range
    Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges
    ```
*   Without `Access-Control-Expose-Headers: Content-Range, Accept-Ranges`, the client's Web Worker will be unable to read these crucial headers.

---

## 🛠️ Static Host Recipes

### Netlify (`_headers` file)
Create or append to your `public/_headers` file:
```http
/data.sqlite
  Accept-Ranges: bytes
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Headers: Range
  Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges
```

### Cloudflare Pages
By default, Cloudflare Pages supports HTTP Range Requests out of the box and does not compress SQLite files. If CORS is needed, add a `_headers` file to your build directory:
```http
/data.sqlite
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Headers: Range
  Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges
```

### AWS S3 & CloudFront
1.  **S3 Metadata:** Ensure the database file's `Content-Type` is set to `application/x-sqlite3` or `application/octet-stream` and **not** compressed.
2.  **S3 CORS Configuration:**
    ```json
    [
      {
        "AllowedHeaders": ["Range"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["Content-Range", "Content-Length", "Accept-Ranges"]
      }
    ]
    ```
3.  **CloudFront Behavior:** Ensure the CloudFront Cache Policy is configured to **Forward the `Range` Header** to S3, otherwise CloudFront will strip it and serve full files instead.

---

## 🩺 Startup Runtime Self-Check
On application startup, a highly robust three-phase database health verification is executed:
1.  **Integrity Check (`PRAGMA integrity_check;`):** Confirms that the physical structure of the SQLite database is uncorrupted and readable by the client-side WebAssembly SQLite engine.
2.  **Schema Verification (`sqlite_master` lookup):** Queries the metadata system table to ensure that the core data table (`daily_records`) exists. This prevents a false success on empty, uninitialized, or defaulted databases.
3.  **Row Count Validation (`SELECT COUNT(*) as count FROM daily_records;`):** Asserts that the table is populated with records (count > 0).

These three checks prevent any false successes where a simple, trivial query (like `SELECT 1`) would succeed on an empty, corrupt, or missing database.

If any of these checks fail or log an error in the browser developer console (F12), check the browser console and network tab to verify:
- The host is properly serving the database file with **HTTP Status 206 (Partial Content)** for range requests.
- The correct content-hashed sqlite URL in `/data.config.json` is reachable.
- The SQLite binary asset `/data.[hash].sqlite` is not corrupted.

---

## ⚡ Write-Through Asynchronous Database Recording Flow

### The Challenge
Because the database file is served directly via **HTTP Range Requests** to the browser's WebAssembly SQLite engine, it is mathematically **read-only** at the browser client. Range requests fetch byte ranges from a static file (e.g., hosted on S3 or a CDN) but cannot execute `INSERT`, `UPDATE`, or `DELETE` mutations back to that hosted file.

### The Architectural Solution
To handle dynamic writes safely and cleanly, this project implements a strict **Write-Through Asynchronous Pipeline**:

```
[Browser Client]
       │
       ▼ (Sends HTTP POST /api/records/add)
[Node.js Server-Side API or CLI tool]
       │
       ├─► 1. Acquires a sequential file lock (example/source-data.json.lock)
       ├─► 2. Validates properties against DailyRecord schema
       ├─► 3. Appends row cleanly to the source file (example/source-data.json)
       ├─► 4. Releases file lock
       ├─► 5. Triggers build compile: tsx scripts/build-db.ts
       │      └─► Compiles a brand new SQLite database public/data.[hash].sqlite
       │      └─► Updates public/data.config.json with the new Build Hash
       └─► 6. Executes deployment script (e.g., uploading to S3/CDN)
```

### Expected Propagation Delay
Because of this sequential, reliable build-and-deploy pipeline, updates are **not immediate**:
1. **Append & SQLite Compilation:** ~1-2 seconds.
2. **CDN Upload & Deployment:** Varies depending on host speed (typically 1-5 seconds on AWS S3/Netlify, or instant locally).
3. **Client Hot-Swap Syncing:** The browser client checks the configuration on a regular basis or on reload. Once the configuration file on the server updates, the client detects the new build hash and instantly hot-swaps to the fresh, content-hashed dataset.

---
