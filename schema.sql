CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_title_unique ON pages(title);
CREATE INDEX IF NOT EXISTS idx_pages_updated ON pages(updated_at DESC);
