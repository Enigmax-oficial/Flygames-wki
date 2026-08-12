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

---

## 6. Windows Server / IIS Hosting

This project is fully configured for deployment on **Windows Server** (IIS / IISNode or PM2):

- **IIS Integration**: A pre-configured `web.config` file routes incoming IIS traffic directly to `dist/server.cjs` via `iisnode` and handles dynamic named pipes (`process.env.PORT`).
- **PM2 / Windows Services**: An `ecosystem.config.cjs` file is provided for running under PM2 on Windows Server (`pm2 start ecosystem.config.cjs`).
- **Cross-Platform Environment**: `cross-env` is used in npm scripts to ensure environment variables function across Windows CMD, PowerShell, and bash.


**Important CI/CD Note:** This project enforces deterministic builds in the CI environment (via inline commands in `wrangler.toml`). The build pipeline intentionally uses `bun install --frozen-lockfile` to explicitly fail the build if the lockfile drifts from `package.json`. This strictly prevents false-positive deploys utilizing a stale cache.

### When changing dependencies
Whenever you edit `package.json` (e.g., adding, removing, or updating dependencies), you **must**:
1. Run `bun install` locally to regenerate the lockfile.
2. Run `npm run verify-lockfile` locally to ensure it passes.
3. Commit the updated `bun.lock` file in the same commit as your `package.json` changes.

**Do NOT remove `--frozen-lockfile` from `wrangler.toml` to "fix" a broken build.** The correct fix is always to run `bun install` locally and commit the resulting `bun.lock`.