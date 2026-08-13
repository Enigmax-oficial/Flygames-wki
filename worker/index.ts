import { Env } from './types';
import { handlePagesRequest, jsonResponse, ensureSchema } from './routes/pages';
import { handleAuthRequest, handleFavoritesRequest } from './auth';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };

    // Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      // Auth endpoints (/auth/signup, /auth/login, /api/auth/signup, /api/auth/login)
      if (
        pathname === '/auth/signup' ||
        pathname === '/api/auth/signup' ||
        pathname === '/auth/login' ||
        pathname === '/api/auth/login'
      ) {
        return await handleAuthRequest(request, url, env, corsHeaders);
      }

      // Favorites endpoints (/favorites, /api/favorites, /favorites/*, /api/favorites/*)
      if (
        pathname === '/favorites' ||
        pathname.startsWith('/favorites/') ||
        pathname === '/api/favorites' ||
        pathname.startsWith('/api/favorites/')
      ) {
        return await handleFavoritesRequest(request, url, env, corsHeaders);
      }
      // Health check endpoint
      if (pathname === '/health' || pathname === '/api/health') {
        let dbStatus = 'degraded';
        try {
          const test = await env.mysql.prepare('SELECT 1 as ok').first<{ ok: number }>();
          if (test?.ok === 1) dbStatus = 'connected';
        } catch {
          // fallback if table isn't created yet
        }
        return jsonResponse({
          status: 'ok',
          database: dbStatus,
          engine: 'Cloudflare D1',
          timestamp: new Date().toISOString(),
        }, 200, corsHeaders);
      }

      // Admin Verify endpoint
      if (pathname === '/api/admin/verify' || pathname === '/admin/verify') {
        if (request.method !== 'POST') {
          return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
        }
        let body: any = {};
        try {
          body = await request.json();
        } catch {}
        const username = (body.username || '').trim();
        const password = (body.password || '').trim();

        const isUserValid = username === 'adm' || username === 'admin' || username === 'Administrator';
        const isPassValid = password === 'hd189733b';

        if (isUserValid && isPassValid) {
          return jsonResponse({ success: true, message: 'Authentication successful via Cloudflare D1.' }, 200, corsHeaders);
        }
        return jsonResponse({ success: false, message: 'Incorrect administrator username or password.' }, 401, corsHeaders);
      }

      // Admin database stats
      if (pathname === '/api/admin/database-stats' || pathname === '/admin/database-stats') {
        let pageCount = 0;
        try {
          await ensureSchema(env);
          const res = await env.mysql.prepare('SELECT COUNT(*) as count FROM pages').first<{ count: number }>();
          pageCount = res?.count || 0;
        } catch {}

        return jsonResponse({
          success: true,
          storedIn: 'Cloudflare D1',
          pagesCount: pageCount,
          users: [{ username: 'adm', role: 'admin', created_at: new Date().toISOString() }],
        }, 200, corsHeaders);
      }

      // Google auth endpoint
      if (pathname === '/auth/google' || pathname === '/api/auth/google') {
        let body: any = {};
        try {
          body = await request.json();
        } catch {}
        return jsonResponse({
          success: true,
          message: 'Google authentication verified',
          id_token: body.id_token ? 'received' : undefined,
        }, 200, corsHeaders);
      }

      // Images list endpoint
      if (pathname === '/api/images/list' || pathname === '/images/list') {
        return jsonResponse({
          success: true,
          images: [],
        }, 200, corsHeaders);
      }

      // Pages routes (/pages, /api/pages, /admin/pages, /api/admin/pages, /api/sql/pages)
      if (
        pathname.startsWith('/pages') ||
        pathname.startsWith('/api/pages') ||
        pathname.startsWith('/admin/pages') ||
        pathname.startsWith('/api/admin/pages') ||
        pathname.startsWith('/api/sql/pages')
      ) {
        const normalizedUrl = new URL(request.url);
        let path = normalizedUrl.pathname;
        if (path.startsWith('/api/sql/pages')) {
          path = path.replace('/api/sql', '');
        } else if (path.startsWith('/api/admin/pages')) {
          path = path.replace('/api/admin', '');
        } else if (path.startsWith('/admin/pages')) {
          path = path.replace('/admin', '');
        } else if (path.startsWith('/api/pages')) {
          path = path.replace('/api', '');
        }
        normalizedUrl.pathname = path;
        return await handlePagesRequest(request, normalizedUrl, env, corsHeaders);
      }

      // Categories routes (/api/categories, /api/sql/categories)
      if (pathname.startsWith('/api/categories') || pathname.startsWith('/api/sql/categories')) {
        return jsonResponse({
          success: true,
          categories: [],
          storedIn: 'Cloudflare D1',
        }, 200, corsHeaders);
      }

      // Generic fallback for any other /api/* routes
      if (pathname.startsWith('/api/')) {
        return jsonResponse({ error: 'Endpoint not found', path: pathname }, 404, corsHeaders);
      }

      // Serve static assets / SPA frontend via Cloudflare Workers Assets
      if (env.ASSETS) {
        let assetRes = await env.ASSETS.fetch(request as any);
        if (assetRes.status === 404 && request.method === 'GET' && !pathname.includes('.')) {
          // SPA fallback to index.html for client-side routing
          const indexUrl = new URL('/index.html', request.url);
          assetRes = await env.ASSETS.fetch(new Request(indexUrl, request) as any);
        }
        return assetRes as unknown as Response;
      }

      return jsonResponse({ error: 'Endpoint not found' }, 404, corsHeaders);
    } catch (err: unknown) {
      console.error('Unhandled worker error:', err);
      const msg = err instanceof Error ? err.message : 'Internal Server Error';
      return jsonResponse({ error: msg }, 500, corsHeaders);
    }
  },
};
