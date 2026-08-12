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
On application startup, a runtime test query is automatically executed:
```sql
SELECT 1 as one;
```
If this query fails or logs an error in the browser developer console (F12), check your network tab and verify that the host's responses to `data.sqlite` return **HTTP Status 206 (Partial Content)** for range fetches rather than **HTTP Status 200** (Full file download).

---

## ♻️ Stale Data After Rebuild (HTTP & Worker Caching)

### The Problem
When updating and redeploying the SQLite database (`data.sqlite`), client browsers or CDNs can serve stale/cached records from a previous build. This happens because:
1. **Aggressive Browser/CDN Cache:** CDNs and browser caches can cache `.sqlite` range-request responses indefinitely if the database file name stays the same.
2. **Web Worker Caching:** The `sql.js-httpvfs` worker thread caches fetched virtual filesystem pages in memory for the lifetime of the application session, ignoring newly deployed backend data.

### The Solution: Multi-Level Cache-Busting
This project utilizes a robust, automated cache-busting pipeline:
1. **Build-Time Content Hashing:** The database build pipeline (`scripts/build-db.ts`) computes a SHA-256 hash of the generated SQLite binary buffer and outputs a content-hashed database file (e.g. `data.[hash].sqlite`).
2. **Fresh Metadata Loading:** A metadata config file `data.config.json` holds the current hashed URL. This file is served with `Cache-Control: no-store, no-cache, must-revalidate` to ensure it is always fetched fresh.
3. **Dynamic Client Syncing:** The database client (`src/db/client.ts`) fetches the configuration file on startup with a query parameter cache-buster (`/data.config.json?cb=[timestamp]`). If the resolved URL differs from the currently initialized worker database, the client automatically re-initializes and hot-swaps the worker to query the new content-hashed SQLite file.
4. **Aggressive Hashed File Caching:** Since hashed database files are uniquely named per compile, the server configures them with high-performance `Cache-Control: public, max-age=31536000, immutable` headers.
