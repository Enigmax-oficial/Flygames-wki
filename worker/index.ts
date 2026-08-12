import { Env } from './types';
import { handlePagesRequest, jsonResponse } from './routes/pages';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

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
      // Health check endpoint
      if (url.pathname === '/health' || url.pathname === '/api/health') {
        // Quick D1 check
        const test = await env.mysql.prepare('SELECT 1 as ok').first<{ ok: number }>();
        return jsonResponse({
          status: 'ok',
          database: test?.ok === 1 ? 'connected' : 'degraded',
          timestamp: new Date().toISOString(),
        }, 200, corsHeaders);
      }

      // Pages routes
      if (url.pathname.startsWith('/pages') || url.pathname.startsWith('/api/pages')) {
        // Normalize pathname for router (strip /api if present)
        const normalizedUrl = new URL(request.url);
        if (normalizedUrl.pathname.startsWith('/api/pages')) {
          normalizedUrl.pathname = normalizedUrl.pathname.replace('/api', '');
        }
        return await handlePagesRequest(request, normalizedUrl, env, corsHeaders);
      }

      return jsonResponse({ error: 'Endpoint not found' }, 404, corsHeaders);
    } catch (err: unknown) {
      console.error('Unhandled worker error:', err);
      const msg = err instanceof Error ? err.message : 'Internal Server Error';
      return jsonResponse({ error: msg }, 500, corsHeaders);
    }
  },
};
