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
    await env.mysql.exec(
      'CREATE TABLE IF NOT EXISTS pages (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, content TEXT NOT NULL, image_url TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);'
    );
    await env.mysql.exec(
      'CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);'
    );
    await env.mysql.exec(
      'CREATE TABLE IF NOT EXISTS favorites (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, page_id TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE (user_id, page_id));'
    );
    await env.mysql.exec(
      'CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, page_id TEXT NOT NULL, user_name TEXT NOT NULL, user_email TEXT NOT NULL, comment TEXT NOT NULL, created_at TEXT NOT NULL);'
    );
    await env.mysql.exec(
      'CREATE TABLE IF NOT EXISTS adm (id TEXT PRIMARY KEY, username TEXT, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);'
    );
    await env.mysql.exec(
      'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);'
    );

    // Helper to check and add column
    const addColumn = async (tableName: string, colName: string, typeDef: string) => {
      try {
        const info = await env.mysql.prepare(`PRAGMA table_info(${tableName})`).all();
        const exists = (info.results || []).some((col: any) => col.name === colName);
        if (!exists) {
          await env.mysql.exec(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${typeDef};`);
        }
      } catch (e) {
        // Fallback for environments where PRAGMA might behave differently
        try {
          await env.mysql.exec(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${typeDef};`);
        } catch (inner) {
          // Ignore
        }
      }
    };

    // Initialize default settings if not exists
    const commentsEnabled = await env.mysql.prepare('SELECT value FROM settings WHERE key = ?').bind('comments_enabled').first();
    if (!commentsEnabled) {
      await env.mysql.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').bind('comments_enabled', 'false').run();
    }
    
    await addColumn('pages', 'category', 'TEXT');
    await addColumn('pages', 'image_url', 'TEXT');
    await addColumn('pages', 'views', 'INTEGER DEFAULT 0');
    await addColumn('pages', 'view_count', 'INTEGER DEFAULT 0');
    await addColumn('users', 'is_admin', 'INTEGER NOT NULL DEFAULT 0');
    await addColumn('users', 'username', 'TEXT');

    schemaInitialized = true;
  } catch (err) {
    console.error('Failed to ensure D1 pages table schema:', err);
    throw err;
  }
}

export async function handlePagesRequest(request: Request, url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  await ensureSchema(env);
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(Boolean); // e.g. ["pages"] or ["pages", "some-slug"]

  try {
    // POST /pages/:slug/view (Increment page view count)
    if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'view') {
      const slugOrId = pathParts[1];
      const cleanedSlug = generateSlug(slugOrId);
      await env.mysql.prepare(
        'UPDATE pages SET views = COALESCE(views, 0) + 1, view_count = COALESCE(view_count, 0) + 1 WHERE slug = ? OR slug = ? OR id = ?'
      ).bind(slugOrId, cleanedSlug, slugOrId).run();
      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    // GET /pages
    if (method === 'GET' && pathParts.length === 1) {
      const limitParam = url.searchParams.get('limit');
      const offsetParam = url.searchParams.get('offset');
      const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 1), 100);
      const offset = Math.max(parseInt(offsetParam || '0', 10) || 0, 0);

      const stmt = env.mysql.prepare(
        'SELECT id, title, slug, content, category, image_url, COALESCE(views, 0) as views, COALESCE(view_count, 0) as view_count, created_at, updated_at FROM pages ORDER BY updated_at DESC LIMIT ? OFFSET ?'
      ).bind(limit, offset);

      const { results, success, error } = await stmt.all<PageRecord>();
      if (!success) {
        throw new Error(error || 'Failed to query database');
      }

      return jsonResponse({ results, count: results.length, limit, offset }, 200, corsHeaders);
    }

    // GET /pages/:slug
    if (method === 'GET' && pathParts.length === 2) {
      const slugOrId = pathParts[1];
      const cleanedSlug = generateSlug(slugOrId);
      const stmt = env.mysql.prepare(
        'SELECT id, title, slug, content, category, image_url, COALESCE(views, 0) as views, COALESCE(view_count, 0) as view_count, created_at, updated_at FROM pages WHERE slug = ? OR slug = ? OR id = ?'
      ).bind(slugOrId, cleanedSlug, slugOrId);

      const page = await stmt.first<PageRecord>();
      if (!page) {
        return jsonResponse({ error: `Page not found: '${slugOrId}'` }, 404, corsHeaders);
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
      const category = (body.category || 'guides').trim();
      const imageUrl = (body.image_url || body.imageUrl || '').trim();

      if (!title) {
        return jsonResponse({ error: 'Title is required', field: 'title' }, 400, corsHeaders);
      }
      if (!content) {
        return jsonResponse({ error: 'Content is required', field: 'content' }, 400, corsHeaders);
      }

      // Check if title already exists
      const existingTitle = await env.mysql.prepare('SELECT id FROM pages WHERE title = ?').bind(title).first();
      if (existingTitle) {
        return jsonResponse({ error: `A page with this title already exists: '${title}'`, field: 'title' }, 409, corsHeaders);
      }

      let slug = (body.slug || '').trim() ? generateSlug(body.slug!) : generateSlug(title);
      if (!slug) {
        slug = 'page-' + Math.random().toString(36).substring(2, 8);
      }

      // Check if slug exists, auto-suffix if conflict to prevent "Slug already exists" errors
      let finalSlug = slug;
      let counter = 1;
      while (true) {
        const existing = await env.mysql.prepare('SELECT id FROM pages WHERE slug = ?').bind(finalSlug).first();
        if (!existing) break;
        finalSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
        counter++;
        if (counter > 10) {
          finalSlug = `${slug}-${Date.now()}`;
          break;
        }
      }

      const id = 'page_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const now = new Date().toISOString();

      console.log(`[DIAGNOSTIC] INSERTing into pages: ID="${id}", TITLE="${title}", SLUG="${finalSlug}", CATEGORY="${category}", IMAGE="${imageUrl}"`);

      const insertStmt = env.mysql.prepare(
        'INSERT INTO pages (id, title, slug, content, category, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, title, finalSlug, content, category, imageUrl || null, now, now);

      let result;
      try {
        result = await insertStmt.run();
      } catch (err: any) {
        const errMsg = String(err?.message || '');
        if (errMsg.includes('UNIQUE constraint failed: pages.title') || errMsg.includes('UNIQUE constraint failed')) {
          return jsonResponse({ error: `A page with this title already exists: '${title}'`, field: 'title' }, 409, corsHeaders);
        }
        throw err;
      }
      if (!result.success) {
        const resErr = String(result.error || '');
        if (resErr.includes('UNIQUE constraint failed: pages.title') || resErr.includes('UNIQUE constraint failed')) {
          return jsonResponse({ error: `A page with this title already exists: '${title}'`, field: 'title' }, 409, corsHeaders);
        }
        throw new Error(String(result.error) || 'Failed to insert page into D1');
      }

      const newPage: PageRecord = {
        id,
        title,
        slug: finalSlug,
        content,
        category,
        image_url: imageUrl || undefined,
        created_at: now,
        updated_at: now,
      };

      return jsonResponse(newPage, 201, corsHeaders);
    }

    // PUT /pages/:slug
    if (method === 'PUT' && pathParts.length === 2) {
      const slugOrId = pathParts[1];
      const cleanedSlug = generateSlug(slugOrId);
      let body: PageInput;
      try {
        body = await request.json() as PageInput;
      } catch {
        return jsonResponse({ error: 'Invalid JSON body', field: 'body' }, 400, corsHeaders);
      }

      const existing = await env.mysql.prepare('SELECT id, title, slug, content, category, image_url, created_at FROM pages WHERE slug = ? OR slug = ? OR id = ?').bind(slugOrId, cleanedSlug, slugOrId).first<PageRecord>();
      if (!existing) {
        return jsonResponse({ error: `Page not found: '${slugOrId}'` }, 404, corsHeaders);
      }

      const title = body.title !== undefined ? body.title.trim() : existing.title;
      const content = body.content !== undefined ? body.content.trim() : existing.content;
      const category = body.category !== undefined ? body.category.trim() : (existing.category || 'guides');
      const imageUrl = body.image_url !== undefined ? body.image_url.trim() : (body.imageUrl !== undefined ? body.imageUrl.trim() : (existing.image_url || ''));
      const newSlug = body.slug !== undefined && body.slug.trim() ? generateSlug(body.slug) : existing.slug;

      if (body.title !== undefined && !title) {
        return jsonResponse({ error: 'Title cannot be empty', field: 'title' }, 400, corsHeaders);
      }
      if (body.content !== undefined && !content) {
        return jsonResponse({ error: 'Content cannot be empty', field: 'content' }, 400, corsHeaders);
      }

      let finalNewSlug = newSlug;
      if (finalNewSlug !== existing.slug) {
        const conflict = await env.mysql.prepare('SELECT id FROM pages WHERE slug = ?').bind(finalNewSlug).first();
        if (conflict) {
          finalNewSlug = `${newSlug}-${Math.random().toString(36).substring(2, 6)}`;
        }
      }

      const now = new Date().toISOString();
      const updateStmt = env.mysql.prepare(
        'UPDATE pages SET title = ?, slug = ?, content = ?, category = ?, image_url = ?, updated_at = ? WHERE id = ?'
      ).bind(title, finalNewSlug, content, category, imageUrl || null, now, existing.id);

      const { success, error } = await updateStmt.run();
      if (!success) {
        throw new Error(error || 'Failed to update page in D1');
      }

      const updatedPage: PageRecord = {
        id: existing.id,
        title,
        slug: finalNewSlug,
        content,
        category,
        image_url: imageUrl || undefined,
        created_at: existing.created_at,
        updated_at: now,
      };

      return jsonResponse(updatedPage, 200, corsHeaders);
    }

    // DELETE /pages/:slug
    if (method === 'DELETE' && pathParts.length === 2) {
      const slugOrId = pathParts[1];
      const cleanedSlug = generateSlug(slugOrId);
      const existing = await env.mysql.prepare('SELECT id, slug FROM pages WHERE slug = ? OR slug = ? OR id = ?').bind(slugOrId, cleanedSlug, slugOrId).first<PageRecord>();
      if (!existing) {
        return jsonResponse({ error: `Page not found: '${slugOrId}'` }, 404, corsHeaders);
      }

      const deleteStmt = env.mysql.prepare('DELETE FROM pages WHERE id = ?').bind(existing.id);
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

export async function handleSettingsRequest(request: Request, url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  await ensureSchema(env);
  const method = request.method;

  try {
    // GET /api/settings or /api/settings/:key
    if (method === 'GET') {
      const pathParts = url.pathname.split('/').filter(Boolean);
      const key = pathParts[2]; // e.g. /api/settings/comments_enabled

      if (key) {
        const setting = await env.mysql.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
        return jsonResponse({ success: true, key, value: setting ? setting.value : null }, 200, corsHeaders);
      }

      const { results } = await env.mysql.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
      const settingsMap = (results || []).reduce((acc: any, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      return jsonResponse({ success: true, settings: settingsMap }, 200, corsHeaders);
    }

    // POST /api/settings
    if (method === 'POST') {
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, 400, corsHeaders);
      }

      const { key, value } = body;
      if (!key || value === undefined) {
        return jsonResponse({ error: 'key and value are required' }, 400, corsHeaders);
      }

      await env.mysql.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(key, String(value)).run();
      return jsonResponse({ success: true, key, value: String(value) }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (err: unknown) {
    console.error('Settings request error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonResponse({ error: message }, 500, corsHeaders);
  }
}

export async function handleCommentsRequest(request: Request, url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  await ensureSchema(env);
  const method = request.method;

  try {
    // GET /api/comments?pageId=... or /comments?pageId=...
    if (method === 'GET') {
      const pageId = url.searchParams.get('pageId') || url.searchParams.get('page_id');
      if (!pageId) {
        return jsonResponse({ error: 'pageId query parameter required' }, 400, corsHeaders);
      }

      const { results } = await env.mysql
        .prepare('SELECT id, page_id as pageId, user_name as userName, user_email as userEmail, comment, created_at as createdAt FROM comments WHERE page_id = ? ORDER BY created_at ASC')
        .bind(pageId)
        .all();

      return jsonResponse({ success: true, comments: results || [] }, 200, corsHeaders);
    }

    // POST /api/comments or /comments
    if (method === 'POST') {
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, 400, corsHeaders);
      }

      const pageId = (body.pageId || body.page_id || '').trim();
      const userName = (body.userName || body.user_name || '').trim();
      const userEmail = (body.userEmail || body.user_email || '').trim().toLowerCase();
      const comment = (body.comment || '').trim();

      if (!pageId || !userName || !userEmail || !comment) {
        return jsonResponse({ error: 'pageId, userName, userEmail, and comment are required' }, 400, corsHeaders);
      }

      const commentId = 'cmt_' + crypto.randomUUID();
      const now = new Date().toISOString();

      await env.mysql
        .prepare('INSERT INTO comments (id, page_id, user_name, user_email, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(commentId, pageId, userName, userEmail, comment, now)
        .run();

      const newComment = {
        id: commentId,
        pageId,
        userName,
        userEmail,
        comment,
        createdAt: now,
      };

      return jsonResponse({ success: true, comment: newComment }, 201, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (err: unknown) {
    console.error('Comments request error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonResponse({ error: message }, 500, corsHeaders);
  }
}

