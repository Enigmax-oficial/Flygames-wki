-- ============================================================================
-- SQLITE / CLOUDFLARE D1 OPTIMIZED DATABASE SCHEMA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PRAGMAS (Performance, Concurrency, and Space Management)
-- Note: PRAGMA auto_vacuum must be executed BEFORE table creation on new databases.
-- ----------------------------------------------------------------------------
PRAGMA auto_vacuum = INCREMENTAL;
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- ----------------------------------------------------------------------------
-- 2. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
  avatar_url TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- 3. PAGES TABLE (Core metadata & fast indexed browsing)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'guides',
  image_url TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_title_unique ON pages(title);
CREATE INDEX IF NOT EXISTS idx_pages_category_updated ON pages(category, updated_at DESC);

-- Optional secondary table to isolate heavy markdown bodies/raw AST if queried separately
CREATE TABLE IF NOT EXISTS page_contents (
  page_id TEXT PRIMARY KEY NOT NULL,
  content_markdown TEXT NOT NULL,
  raw_json TEXT,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 4. USER_FAVORITES TABLE (Composite Primary Key & WITHOUT ROWID)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, page_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
) WITHOUT ROWID;

-- Index for "All users who favorited Page X" / favorite aggregation counts
-- Note: No index on (user_id) is created because the composite PK (user_id, page_id)
-- already provides an index for any query filtering by user_id.
CREATE INDEX IF NOT EXISTS idx_user_favorites_page_id ON user_favorites(page_id);

-- Backward compatibility view (maps legacy 'favorites' queries seamlessly)
CREATE VIEW IF NOT EXISTS favorites AS
  SELECT user_id, page_id, created_at FROM user_favorites;

-- ----------------------------------------------------------------------------
-- 5. COMMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY NOT NULL,
  page_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_page ON comments(page_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. SETTINGS & AUTH AUXILIARY TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_verifications (
  email TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL,
  username TEXT,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

-- ============================================================================
-- 7. DISK RECLAMATION & VACUUM MAINTENANCE SCRIPT
-- ============================================================================
-- NOTE ON SPACE MANAGEMENT (PRAGMA auto_vacuum = INCREMENTAL):
-- When rows are deleted or updated, SQLite marks database pages as "free"
-- on an internal freelist instead of continuously resizing the file on disk.
--
-- 1. Routine Maintenance (Non-blocking incremental compaction):
--    PRAGMA incremental_vacuum(100); -- Reclaims up to 100 pages from freelist
--
-- 2. Full Maintenance (Run after bulk deletes or page migrations):
--    PRAGMA incremental_vacuum;     -- Truncates all freelist pages back to OS
--    VACUUM;                        -- Fully defragments and rebuilds database
-- ============================================================================
