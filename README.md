# Mini SQL Server over HTTP Range Requests

A lightweight, serverless, client-side SQLite query engine that runs SQL queries against a static `.sqlite` file hosted on any static HTTP host (such as GitHub Pages, AWS S3, Cloudflare Pages, or Netlify). Inspired by `sql.js-httpvfs`.

Instead of downloading the entire database or hosting an active backend database process, the client lazily fetches only the specific SQLite database pages required for a query using standard **HTTP Range Requests** (`Range: bytes=start-end`).

---

## Architecture & File Structure

```
├── scripts/
│   └── build-db.ts        # Node.js script that compiles source data into dataset.sqlite & config.json
├── public/
│   └── db/
│     ├── dataset.sqlite   # Static SQLite database asset
│     └── config.json      # Auto-generated configuration (page size, URL, indexes, size)
├── src/
│   └── db/
│       ├── types.ts       # Database schema interfaces, config types, and query stats
│       ├── client.ts      # Browser-side HTTP Range VFS query client with caching and fallback
│       └── repository.ts  # Type-safe DAO/Repository layer wrapping SQL queries (no ORM)
└── README.md              # Documentation and deployment instructions
```

---

## How It Works

1. **Static Pre-compilation**: The build pipeline runs `scripts/build-db.ts` to transform seed data, CSVs, or JSON arrays into a single `.sqlite` file with B-Tree indexes on frequently queried columns (e.g. `date`, `category`).
2. **HTTP Range Requests**: When executing queries in the browser, `RangeVirtualFileSystem` in `src/db/client.ts` calculates the SQLite page offset (4096-byte chunks) needed for index lookups and row fetches.
3. **Chunk Caching**: Fetched pages are cached in memory so subsequent queries hit the local cache without network requests.
4. **Graceful Fallback**: If a host or CDN does not support HTTP Range Requests (`206 Partial Content`), the engine automatically falls back to downloading the full `.sqlite` file in a non-blocking background stream.

---

## How to Regenerate the SQLite Database

To build or update the SQLite file and config:

```bash
# Run the database pre-compilation script
npm run build:db
```

This updates:
- `public/db/dataset.sqlite`
- `public/db/config.json`

---

## Deployment Instructions

Because the database file is just a static file asset in `public/db/`:

1. Run the build script to generate static production assets:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` or `public/` directory to any static web host:
   - **GitHub Pages**: Ensure CORS and standard GET range requests are allowed.
   - **AWS S3 / CloudFront**: Enable `Accept-Ranges: bytes` in S3 metadata.
   - **Cloudflare Pages / Netlify / Vercel**: Works out of the box for byte range requests.

---

## Type-Safe Query Layer Example

```typescript
import { defaultDailyRecordRepository } from './src/db/repository';

// 1. Query records by date
const { rows, stats, executionTimeMs } = await defaultDailyRecordRepository.getRecordsByDate('2026-02-15');
console.log('Records for 2026-02-15:', rows);
console.log('Bytes requested over HTTP Range:', stats.bytesRequested);

// 2. Query category breakdown
const breakdown = await defaultDailyRecordRepository.getCategoryBreakdown();
console.log('Category totals:', breakdown.rows);
```
