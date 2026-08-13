# Troubleshooting - Cloudflare D1 & Worker Architecture

This guide covers common issues and failure modes encountered when using Cloudflare D1 and Cloudflare Workers in this project.

---

## 1. D1 Binding Mismatch or Undefined (`env.mysql`)

### Symptom
- Worker throws `TypeError: Cannot read properties of undefined (reading 'prepare')` when handling requests.
- API returns `500 Internal Server Error` with database query failures.

### Root Cause
The `wrangler.toml` file does not define the `[[d1_databases]]` binding with the exact name referenced in code (`mysql`), or local wrangler dev was started without binding emulation.

### Solution
1. Verify `wrangler.toml` contains:
   ```toml
   [[d1_databases]]
   binding = "mysql"
   database_name = "minecraft-wiki-db"
   database_id = "your-d1-database-uuid-here"
   ```
2. When running locally, ensure Wrangler is bound properly:
   ```bash
   npx wrangler dev
   ```

---

## 2. Table Not Found / Schema Not Applied (`D1_ERROR: no such table: X`)

### Symptom
- Admin panel or API returns `Failed to save page through server pipeline: D1_ERROR: no such table: pages: SQLITE_ERROR` or `no such table: X`.

### Root Cause
`D1_ERROR: no such table: X` almost always means the schema file exists in the repository but was never executed against the `--remote` database, as opposed to a code or binding bug. Simply creating the D1 database or writing `schema.sql` in the repo does not automatically create tables inside the remote Cloudflare D1 instance.

### Solution
Execute the schema setup command explicitly targeting the remote database:
- **Remote (Production)**:
  ```bash
  npx wrangler d1 execute minecraft-wiki-db --remote --file=./schema.sql
  ```
  *(Note: Replace `minecraft-wiki-db` with the `database_name` defined under `[[d1_databases]]` in `wrangler.toml` if different, e.g. `my-sql`).*

- **Verify Remote Table Provisioning**:
  ```bash
  npx wrangler d1 execute minecraft-wiki-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
  ```

- **Local Development Simulation**:
  ```bash
  npx wrangler d1 execute minecraft-wiki-db --local --file=./schema.sql
  ```

---

## 3. CORS Preflight Failures (`OPTIONS 404` or `405`)

### Symptom
- Browser console shows `Access-Control-Allow-Origin` missing or network requests failing during `POST` / `PUT` / `DELETE` operations from the admin panel frontend.

### Root Cause
The Cloudflare Worker did not intercept `OPTIONS` preflight requests or return proper CORS response headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`).

### Solution
Ensure `worker/index.ts` and `worker/routes/pages.ts` explicitly handle `OPTIONS` requests and return status `204` with correct CORS headers on every response (including errors).

---

## 4. Slug Unique Constraint Violation (`409 Conflict`)

### Symptom
- Creating a page returns `409 Slug already exists`.

### Root Cause
A page with the exact same auto-generated or user-provided slug already exists in the D1 `pages` table, violating the `UNIQUE` constraint on `slug`.

### Solution
Choose a unique title or specify a unique custom slug in the creation form.