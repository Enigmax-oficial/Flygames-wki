import { Env, PageRecord, PageInput } from '../types';

// Helper for JSON responses with CORS headers
export function jsonResponse(data: unknown, status = 200, corsHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Helper to generate URL-safe slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

let schemaInitialized = false;

export async function ensureSchema(env: Env): Promise<void> {
  if (schemaInitialized) return;
  try {
    await env.mysql.exec(`
      CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    schemaInitialized = true;
  } catch (err) {
    console.error('Failed to ensure D1 pages table schema:', err);
  }
}

export async function handlePagesRequest(request: Request, url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  await ensureSchema(env);
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(Boolean); // e.g. ["pages"] or ["pages", "some-slug"]

  try {
    // GET /pages
    if (method === 'GET' && pathParts.length === 1) {
      const limitParam = url.searchParams.get('limit');
      const offsetParam = url.searchParams.get('offset');
      const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 1), 100);
      const offset = Math.max(parseInt(offsetParam || '0', 10) || 0, 0);

      const stmt = env.mysql.prepare(
        'SELECT id, title, slug, content, created_at, updated_at FROM pages ORDER BY updated_at DESC LIMIT ? OFFSET ?'
      ).bind(limit, offset);

      const { results, success, error } = await stmt.all<PageRecord>();
      if (!success) {
        throw new Error(error || 'Failed to query database');
      }

      return jsonResponse({ results, count: results.length, limit, offset }, 200, corsHeaders);
    }

    // GET /pages/:slug
    if (method === 'GET' && pathParts.length === 2) {
      const slug = pathParts[1];
      const stmt = env.mysql.prepare(
        'SELECT id, title, slug, content, created_at, updated_at FROM pages WHERE slug = ?'
      ).bind(slug);

      const page = await stmt.first<PageRecord>();
      if (!page) {
        return jsonResponse({ error: 'Page not found' }, 404, corsHeaders);
      }

      return jsonResponse(page, 200, corsHeaders);
    }

    // POST /pages
    if (method === 'POST' && pathParts.length === 1) {
      let body: PageInput;
      try {
        body = await request.json() as PageInput;
      } catch {
        return jsonResponse({ error: 'Invalid JSON body', field: 'body' }, 400, corsHeaders);
      }

      const title = (body.title || '').trim();
      const content = (body.content || '').trim();

      if (!title) {
        return jsonResponse({ error: 'Title is required', field: 'title' }, 400, corsHeaders);
      }
      if (!content) {
        return jsonResponse({ error: 'Content is required', field: 'content' }, 400, corsHeaders);
      }

      const slug = (body.slug || '').trim() ? generateSlug(body.slug!) : generateSlug(title);
      if (!slug) {
        return jsonResponse({ error: 'Generated slug is invalid', field: 'slug' }, 400, corsHeaders);
      }

      // Check if slug exists
      const existing = await env.mysql.prepare('SELECT id FROM pages WHERE slug = ?').bind(slug).first();
      if (existing) {
        return jsonResponse({ error: 'Slug already exists', field: 'slug' }, 409, corsHeaders);
      }

      const id = 'page_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const now = new Date().toISOString();

      const insertStmt = env.mysql.prepare(
        'INSERT INTO pages (id, title, slug, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(id, title, slug, content, now, now);

      const { success, error } = await insertStmt.run();
      if (!success) {
        throw new Error(error || 'Failed to insert page into D1');
      }

      const newPage: PageRecord = {
        id,
        title,
        slug,
        content,
        created_at: now,
        updated_at: now,
      };

      return jsonResponse(newPage, 201, corsHeaders);
    }

    // PUT /pages/:slug
    if (method === 'PUT' && pathParts.length === 2) {
      const slug = pathParts[1];
      let body: PageInput;
      try {
        body = await request.json() as PageInput;
      } catch {
        return jsonResponse({ error: 'Invalid JSON body', field: 'body' }, 400, corsHeaders);
      }

      const existing = await env.mysql.prepare('SELECT id, title, slug, content, created_at FROM pages WHERE slug = ?').bind(slug).first<PageRecord>();
      if (!existing) {
        return jsonResponse({ error: 'Page not found' }, 404, corsHeaders);
      }

      const title = body.title !== undefined ? body.title.trim() : existing.title;
      const content = body.content !== undefined ? body.content.trim() : existing.content;
      const newSlug = body.slug !== undefined && body.slug.trim() ? generateSlug(body.slug) : existing.slug;

      if (body.title !== undefined && !title) {
        return jsonResponse({ error: 'Title cannot be empty', field: 'title' }, 400, corsHeaders);
      }
      if (body.content !== undefined && !content) {
        return jsonResponse({ error: 'Content cannot be empty', field: 'content' }, 400, corsHeaders);
      }

      if (newSlug !== existing.slug) {
        const conflict = await env.mysql.prepare('SELECT id FROM pages WHERE slug = ?').bind(newSlug).first();
        if (conflict) {
          return jsonResponse({ error: 'Slug already exists', field: 'slug' }, 409, corsHeaders);
        }
      }

      const now = new Date().toISOString();
      const updateStmt = env.mysql.prepare(
        'UPDATE pages SET title = ?, slug = ?, content = ?, updated_at = ? WHERE slug = ?'
      ).bind(title, newSlug, content, now, slug);

      const { success, error } = await updateStmt.run();
      if (!success) {
        throw new Error(error || 'Failed to update page in D1');
      }

      const updatedPage: PageRecord = {
        id: existing.id,
        title,
        slug: newSlug,
        content,
        created_at: existing.created_at,
        updated_at: now,
      };

      return jsonResponse(updatedPage, 200, corsHeaders);
    }

    // DELETE /pages/:slug
    if (method === 'DELETE' && pathParts.length === 2) {
      const slug = pathParts[1];
      const existing = await env.mysql.prepare('SELECT id FROM pages WHERE slug = ?').bind(slug).first();
      if (!existing) {
        return jsonResponse({ error: 'Page not found' }, 404, corsHeaders);
      }

      const deleteStmt = env.mysql.prepare('DELETE FROM pages WHERE slug = ?').bind(slug);
      const { success, error } = await deleteStmt.run();
      if (!success) {
        throw new Error(error || 'Failed to delete page from D1');
      }

      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
  } catch (err: unknown) {
    console.error('Database or routing error in handlePagesRequest:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonResponse({ error: message }, 500, corsHeaders);
  }
}
