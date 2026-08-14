import { Env } from './types';
import { handlePagesRequest, handleCommentsRequest, handleSettingsRequest, jsonResponse, ensureSchema } from './routes/pages';
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
      // Auth & Admin Auth endpoints (/auth/*, /api/auth/*, /api/admin/*)
      if (
        pathname.startsWith('/auth') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/admin/verify') ||
        pathname.startsWith('/admin/verify') ||
        pathname.startsWith('/api/admin/status') ||
        pathname.startsWith('/auth/admin/status') ||
        pathname.startsWith('/api/admin/admins') ||
        pathname.startsWith('/auth/admin/list') ||
        pathname.startsWith('/api/admin/users') ||
        pathname.startsWith('/auth/admin/bootstrap') ||
        pathname.startsWith('/api/auth/admin/bootstrap')
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

      // Comments endpoints (/comments, /api/comments)
      if (
        pathname === '/comments' ||
        pathname === '/api/comments'
      ) {
        return await handleCommentsRequest(request, url, env, corsHeaders);
      }

      // Settings endpoints (/api/settings, /api/settings/*)
      if (
        pathname === '/settings' ||
        pathname === '/api/settings' ||
        pathname.startsWith('/settings/') ||
        pathname.startsWith('/api/settings/')
      ) {
        return await handleSettingsRequest(request, url, env, corsHeaders);
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

      // Admin database stats
      if (pathname === '/api/admin/database-stats' || pathname === '/admin/database-stats') {
        let pageCount = 0;
        let usersList: any[] = [];
        try {
          await ensureSchema(env);
          const res = await env.mysql.prepare('SELECT COUNT(*) as count FROM pages_contains').first<{ count: number }>();
          pageCount = res?.count || 0;
          
          const usersRes = await env.mysql.prepare('SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC').all();
          usersList = (usersRes.results || []).map((u: any) => ({
            id: u.id,
            username: u.username || u.email?.split('@')[0] || 'User',
            email: u.email,
            role: u.is_admin === 1 ? 'admin' : 'user',
            created_at: u.created_at || 'Registered'
          }));
        } catch (err: any) {
          return jsonResponse({ success: false, error: err.message || 'Failed to fetch database stats' }, 500, corsHeaders);
        }

        if (!usersList.some((u) => u.username === 'adm')) {
          usersList.unshift({
            id: 'usr_adm_default',
            username: 'adm',
            email: 'adm@wiki.local',
            role: 'admin',
            created_at: 'Initial System Admin'
          });
        }

        return jsonResponse({
          success: true,
          storedIn: 'Cloudflare D1',
          pagesCount: pageCount,
          users: usersList,
        }, 200, corsHeaders);
      }

      // Admin Data Analytics endpoint
      if (pathname === '/api/admin/analytics' || pathname === '/admin/analytics') {
        await ensureSchema(env);
        let topVisited: any[] = [];
        let topFavorited: any[] = [];
        let totalViews = 0;
        let totalFavorites = 0;
        let totalPages = 0;
        let totalUsers = 0;

        try {
          // 1. Top Visited Pages
          const visitedRes = await env.mysql.prepare(
            'SELECT id, title, slug, category, image_url, COALESCE(views, 0) as views, created_at, updated_at FROM pages_contains ORDER BY views DESC LIMIT 20'
          ).all();
          topVisited = visitedRes.results || [];

          // 2. Top Favorited Pages
          const favoritedRes = await env.mysql.prepare(
            `SELECT p.id, p.title, p.slug, p.category, p.image_url, COALESCE(p.views, 0) as views, COUNT(f.page_id) as favorites_count 
             FROM pages_contains p 
             LEFT JOIN users_favorites f ON p.id = f.page_id 
             GROUP BY p.id 
             ORDER BY favorites_count DESC, views DESC LIMIT 20`
          ).all();
          topFavorited = favoritedRes.results || [];

          // 3. Totals
          const sumRes = await env.mysql.prepare('SELECT SUM(COALESCE(views, 0)) as total_views, COUNT(*) as total_pages FROM pages_contains').first<any>();
          totalViews = sumRes?.total_views || 0;
          totalPages = sumRes?.total_pages || 0;

          const favCountRes = await env.mysql.prepare('SELECT COUNT(*) as total_favs FROM users_favorites').first<any>();
          totalFavorites = favCountRes?.total_favs || 0;

          const userCountRes = await env.mysql.prepare('SELECT COUNT(*) as total_users FROM users').first<any>();
          totalUsers = userCountRes?.total_users || 0;
        } catch (err: any) {
          console.log('Analytics query status:', err?.message || err);
          return jsonResponse({ success: false, error: err.message || 'Analytics query notice' }, 500, corsHeaders);
        }

        return jsonResponse({
          success: true,
          summary: {
            totalViews,
            totalFavorites,
            totalPages,
            totalUsers,
          },
          mostVisited: topVisited,
          mostFavorited: topFavorited,
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
      console.log('Worker request notice:', err instanceof Error ? err.message : err);
      const msg = err instanceof Error ? err.message : 'Internal Server Error';
      return jsonResponse({ error: msg, success: false }, 500, corsHeaders);
    }
  },
};
