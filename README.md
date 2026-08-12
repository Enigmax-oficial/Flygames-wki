# Minecraft Addon Wiki - Cloudflare D1 & Worker Architecture

This project uses **Cloudflare D1** (serverless SQLite at the edge) accessed via a **Cloudflare Worker** as the single source of truth for both reads and writes. This eliminates the legacy static file rebuild/redeploy pipeline and provides a live, zero-latency database API.

---

## Architecture & File Structure

```
├── worker/
│   ├── index.ts           # Cloudflare Worker entry point, CORS & routing
│   ├── types.ts           # TypeScript interfaces (Env, PageRecord, etc.)
│   └── routes/
│       └── pages.ts       # REST handlers for GET, POST, PUT, DELETE /pages
├── schema.sql             # SQL DDL for the pages table and indexes
├── wrangler.toml          # Cloudflare Worker configuration & D1 database binding
└── README.md              # Documentation and setup instructions
```

---

## 1. Environment & D1 Configuration (`wrangler.toml`)

The Worker binds to Cloudflare D1 via the `mysql` binding name (maintaining compatibility with existing configuration):

```toml
name = "minecraft-addon-wiki-worker"
main = "worker/index.ts"
compatibility_date = "2026-03-01"

[[d1_databases]]
binding = "mysql"
database_name = "minecraft-wiki-db"
database_id = "your-d1-database-uuid-here"
```

---

## 2. Database Schema & Setup

To initialize or update the D1 database schema:

### Local Development (Wrangler Local D1)
```bash
npx wrangler d1 execute minecraft-wiki-db --local --file=./schema.sql
```

### Remote Production D1 Deployment
```bash
npx wrangler d1 execute minecraft-wiki-db --remote --file=./schema.sql
```

### Migrations (Optional)
If using Wrangler migrations:
```bash
npx wrangler d1 migrations create minecraft-wiki-db create_pages_table
# Add SQL statements to the generated migration file in migrations/
npx wrangler d1 migrations apply minecraft-wiki-db --remote
```

---

## 3. Worker API Endpoints

- `GET /pages` — List pages with query parameters `?limit=` (default 20, max 100) and `?offset=`, sorted by `updated_at DESC`.
- `GET /pages/:slug` — Fetch a single page by slug (404 if not found).
- `POST /pages` — Create a new page. Body requires `title` and `content`. Automatically generates a URL-safe `slug` if not provided. Returns `409` if the slug already exists.
- `PUT /pages/:slug` — Partial update of a page by slug.
- `DELETE /pages/:slug` — Delete a page by slug (`204 No Content` on success).

---

## 4. Development & Deployment

1. **Local Worker Preview**:
   ```bash
   npx wrangler dev
   ```
2. **Deploy Worker to Cloudflare Edge**:
   ```bash
   npx wrangler deploy
   ```
