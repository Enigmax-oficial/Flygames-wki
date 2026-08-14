import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import worker from './worker/index';

// Polyfill/alias console.warning to console.warn to ensure compatibility
if (!(console as any).warning) {
  (console as any).warning = console.warn;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Cloudflare D1 Database binding configuration
const D1_DATABASE_ID = 'd7f3eefe-63ff-4b62-8baf-6dc44381abab';
const D1_DATABASE_NAME = 'my-sql';

// Optional remote Cloudflare D1 REST API query executor
async function queryRemoteD1(sql: string, params: any[] = []): Promise<{ success: boolean; results?: any[]; meta?: any; error?: string }> {
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.D1_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || D1_DATABASE_ID;
  
  if (!token || !accountId || !databaseId) {
    return { 
      success: false, 
      error: 'Cloudflare D1 credentials (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID) are unconfigured.' 
    };
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.log(`[Cloudflare D1 Status] Provider response status: ${res.status}`);
      return { 
        success: false, 
        error: `Cloudflare D1 connection failure (${res.status})` 
      };
    }
    
    const data = (await res.json()) as any;
    if (!data.success) {
      const errMsg = data.errors?.map((e: any) => e.message).join(', ') || 'D1 API provider returned error';
      console.log(`[Cloudflare D1 Status] Provider message: ${errMsg}`);
      return { success: false, error: errMsg };
    }
    
    const queryResult = data.result?.[0] || { results: [], success: true };
    return {
      success: queryResult.success !== false,
      results: queryResult.results || [],
      meta: queryResult.meta || {},
    };
  } catch (err: any) {
    console.log(`[Cloudflare D1 Status] Connection notice: ${err.message}`);
    return { success: false, error: `Connection failure: ${err.message}` };
  }
}

// D1 Database binding client (binding = "mysql", database_name = "my-sql", database_id = "d7f3eefe-63ff-4b62-8baf-6dc44381abab")
const mysqlClient = {
  async exec(sql: string): Promise<void> {
    const remote = await queryRemoteD1(sql);
    if (!remote.success) {
      console.log(`[D1 Exec Info] Status: ${remote.error}`);
    }
  },
  prepare(sql: string) {
    let boundParams: any[] = [];
    return {
      bind(...args: any[]) {
        boundParams = args;
        return this;
      },
      async run(): Promise<{ success: boolean; results?: any[]; meta?: any; error?: string }> {
        return await queryRemoteD1(sql, boundParams);
      },
      async all<T = any>(): Promise<{ results: T[]; success: boolean; error?: string }> {
        const remote = await queryRemoteD1(sql, boundParams);
        return {
          results: (remote.results || []) as T[],
          success: remote.success,
          error: remote.error,
        };
      },
      async first<T = any>(key?: string): Promise<T | null> {
        const remote = await queryRemoteD1(sql, boundParams);
        const firstRow = remote.results?.[0];
        if (!firstRow) return null;
        if (key) return (firstRow as any)[key] as T;
        return firstRow as T;
      },
    };
  },
};

// Direct Worker Request Handler - routes Express requests directly to Cloudflare Worker entrypoint in-process
async function handleWorkerRequestDirectly(req: any, res: any) {
  try {
    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (Array.isArray(val)) {
        val.forEach(v => headers.append(key, v));
      } else if (typeof val === 'string') {
        headers.set(key, val);
      }
    }

    const protocol = req.secure ? 'https' : 'http';
    const host = req.get('host') || 'cloudflare-worker';
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    let body: any = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body && Object.keys(req.body).length > 0) {
        body = JSON.stringify(req.body);
      }
    }

    const webRequest = new Request(fullUrl, {
      method: req.method,
      headers: headers,
      body: body,
    });

    const env = {
      mysql: mysqlClient,
      ASSETS: null,
    };

    const webResponse = await worker.fetch(webRequest, env as any, {
      waitUntil: (promise: Promise<any>) => {
        promise.catch(err => console.log('WaitUntil note:', err));
      },
      passThroughOnException: () => {},
    } as any);

    res.status(webResponse.status);
    
    const headersToSkip = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive']);
    webResponse.headers.forEach((val, key) => {
      if (!headersToSkip.has(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });

    const responseText = await webResponse.text();
    res.send(responseText);
  } catch (err: any) {
    console.log('Worker request execution status:', err.message || err);
    res.status(500).json({ success: false, error: err.message || 'Worker Request Notice' });
  }
}

// Run database operations, auth, comments, and favorites endpoints directly inside the Cloudflare Worker in-process
app.all([
  '/auth*',
  '/api/auth*',
  '/favorites*',
  '/api/favorites*',
  '/comments*',
  '/api/comments*',
  '/api/pages*',
  '/api/sql/pages*',
  '/admin/pages*',
  '/api/admin/pages*',
  '/api/admin/database-stats',
  '/api/admin/analytics',
  '/admin/analytics',
  '/api/admin/verify*',
  '/admin/verify*',
  '/api/admin/status*',
  '/auth/admin/status*',
  '/api/admin/admins*',
  '/auth/admin/list*',
  '/api/admin/users*',
  '/auth/admin/bootstrap*',
  '/api/auth/admin/bootstrap*',
  '/api/categories*',
  '/api/sql/categories*',
  '/api/settings*'
], handleWorkerRequestDirectly);

// Helper to scan a directory recursively for functional images
function scanDirRecursive(dirPath: string, rootDir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dirPath)) return results;
  try {
    const list = fs.readdirSync(dirPath);
    list.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(scanDirRecursive(fullPath, rootDir));
      } else {
        if (/\.(png|jpe?g|gif|svg|webp)$/i.test(file) && stat.size > 0) {
          const relPath = '/' + path.relative(rootDir, fullPath).replace(/\\/g, '/');
          results.push(relPath);
        }
      }
    });
  } catch (err) {
    console.error('Error scanning dir:', dirPath, err);
  }
  return results;
}

// API Health Check
app.get('/api/health', async (req, res) => {
  let sqlStatus = 'connected';
  let error = null;
  try {
    const check = await mysqlClient.prepare('SELECT 1').run();
    if (!check.success) {
      sqlStatus = 'disconnected';
      error = check.error || 'Connection failed';
      console.log(`[Database Notice] Health check: ${error}`);
    }
  } catch (err: any) {
    sqlStatus = 'disconnected';
    error = err.message;
    console.log(`[Database Notice] Health check: ${error}`);
  }
  res.json({ 
    status: 'ok', 
    sqlServer: sqlStatus, 
    error,
    databaseEngine: 'Cloudflare D1 (Real API)', 
    timestamp: new Date().toISOString() 
  });
});

// Endpoint to list all functional wiki image assets
app.get('/api/images/list', (req, res) => {
  try {
    const publicPath = path.join(process.cwd(), 'public');
    const imagesPath = path.join(publicPath, 'images');
    const images = scanDirRecursive(imagesPath, publicPath);
    res.json({ success: true, images });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// All database operations and page endpoints are executed directly inside the real Cloudflare D1 database via REST query interface in-process.

async function startServer() {
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.json')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      }
    }
  }));

  // Vite middleware setup for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const effectivePort = process.env.PORT || PORT;

  // Support Windows Server IISNode named pipes or standard TCP ports
  if (typeof effectivePort === 'string' && (effectivePort.startsWith('\\\\.\\pipe\\') || effectivePort.includes('pipe'))) {
    app.listen(effectivePort, () => {
      console.log(`[Cloudflare D1 Server & Express] Server running on Windows IISNode named pipe: ${effectivePort}`);
    });
  } else {
    const numericPort = typeof effectivePort === 'string' ? parseInt(effectivePort, 10) || 3000 : effectivePort;
    app.listen(numericPort, '0.0.0.0', () => {
      console.log(`[Cloudflare D1 Server & Express] Server running on port ${numericPort}`);
      console.log(`[Cloudflare D1 Server] Database mode: Real Cloudflare API (Non-emulated)`);
      mysqlClient.prepare('SELECT 1').run().then(res => {
        if (res.success) {
          console.log(`[Cloudflare D1 Server] Database connection verified via Cloudflare API`);
        } else {
          console.log(`[Cloudflare D1 Server] Database connection status: ${res.error}`);
        }
      }).catch(err => {
        console.log(`[Cloudflare D1 Server] Database connection status: ${err.message}`);
      });
    });
  }
}

startServer();
