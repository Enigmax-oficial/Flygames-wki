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
