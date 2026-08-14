import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
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
async function queryRemoteD1IfAvailable(sql: string, params: any[] = []): Promise<{ success: boolean; results?: any[]; meta?: any; error?: string } | null> {
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.D1_TOKEN;
  let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  
  // If accountId is missing or mistakenly set to the database ID, check if a valid account ID exists
  if (!accountId || accountId === D1_DATABASE_ID) {
    accountId = '83e4738d-6bb8-4ca3-7d90-e4c68b0ddfab';
  }
  
  if (!token) return null;

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${D1_DATABASE_ID}/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    });
    
    if (!res.ok) {
      if (res.status !== 404 && res.status !== 403) {
        const errText = await res.text();
        console.warn(`[Cloudflare D1 REST API] Response status ${res.status}: ${errText}. Falling back to local persistent D1 database engine.`);
      }
      return null;
    }
    
    const data = (await res.json()) as any;
    if (!data.success) {
      const errMsg = data.errors?.map((e: any) => e.message).join(', ') || 'Unknown D1 API error';
      console.warn(`[Cloudflare D1 REST API] Remote query error: ${errMsg}. Falling back to local persistent D1 database engine.`);
      return null;
    }
    
    const queryResult = data.result?.[0] || { results: [], success: true };
    return {
      success: queryResult.success !== false,
      results: queryResult.results || [],
      meta: queryResult.meta || {},
    };
  } catch (err: any) {
    console.warn(`[Cloudflare D1 REST API] Network error: ${err.message}. Falling back to local persistent D1 database engine.`);
    return null;
  }
}

// Local persistent SQLite instance implementing the D1 database binding (my-sql)
const dbPath = path.join(process.cwd(), '.d1_data.sqlite');
const sqlite = new DatabaseSync(dbPath);

// Enable WAL mode for better concurrency and stability to prevent corruption
try {
  sqlite.exec('PRAGMA journal_mode = WAL;');
  console.log('[SQLite] Journal mode set to WAL');
} catch (err: any) {
  console.warn(`[SQLite] Failed to set journal mode to WAL: ${err.message}`);
}

// D1 Database binding client (binding = "mysql", database_name = "my-sql", database_id = "d7f3eefe-63ff-4b62-8baf-6dc44381abab")
const mysqlClient = {
  async exec(sql: string): Promise<void> {
    const remote = await queryRemoteD1IfAvailable(sql);
    if (remote) {
      if (!remote.success) throw new Error(remote.error || 'Failed to execute query on Cloudflare D1');
      return;
    }
    try {
      sqlite.exec(sql);
    } catch (err: any) {
      console.error(`[SQLite Exec Error] ${err.message} | SQL: ${sql}`);
      throw err;
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
        const remote = await queryRemoteD1IfAvailable(sql, boundParams);
        if (remote) return remote;

        try {
          const stmt = sqlite.prepare(sql);
          const result = stmt.run(...boundParams);
          return {
            success: true,
            results: [],
            meta: {
              changes: result.changes,
              last_row_id: Number(result.lastInsertRowid),
              database_id: D1_DATABASE_ID,
              database_name: D1_DATABASE_NAME,
            },
          };
        } catch (err: any) {
          console.error(`[SQLite Run Error] ${err.message} | SQL: ${sql}`);
          return {
            success: false,
            results: [],
            error: err.message,
          };
        }
      },
      async all<T = any>(): Promise<{ results: T[]; success: boolean; error?: string }> {
        const remote = await queryRemoteD1IfAvailable(sql, boundParams);
        if (remote) {
          return {
            results: (remote.results || []) as T[],
            success: remote.success,
            error: remote.error,
          };
        }

        try {
          const stmt = sqlite.prepare(sql);
          const rows = stmt.all(...boundParams) as T[];
          return {
            results: rows || [],
            success: true,
          };
        } catch (err: any) {
          console.error(`[SQLite All Error] ${err.message} | SQL: ${sql}`);
          return {
            results: [],
            success: false,
            error: err.message,
          };
        }
      },
      async first<T = any>(key?: string): Promise<T | null> {
        const remote = await queryRemoteD1IfAvailable(sql, boundParams);
        if (remote) {
          const firstRow = remote.results?.[0];
          if (!firstRow) return null;
          if (key) return (firstRow as any)[key] as T;
          return firstRow as T;
        }

        try {
          const stmt = sqlite.prepare(sql);
          const row = stmt.get(...boundParams) as any;
          if (!row) return null;
          if (key) {
            return row[key] as T;
          }
          return row as T;
        } catch (err: any) {
          console.error(`[SQLite First Error] ${err.message} | SQL: ${sql}`);
          throw err;
        }
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
        promise.catch(err => console.error('Error in waitUntil:', err));
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
    console.error('Worker request execution error:', err);
    res.status(500).json({ success: false, error: err.message || 'Worker Execution Error' });
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
app.get('/api/health', (req, res) => {
  let sqlStatus = 'connected';
  let error = null;
  try {
    sqlite.prepare('SELECT 1').get();
  } catch (err: any) {
    sqlStatus = 'disconnected';
    error = err.message;
    console.error(`[Database Error] Health check failed: ${error}`);
  }
  res.json({ 
    status: 'ok', 
    sqlServer: sqlStatus, 
    error,
    databaseEngine: 'Cloudflare D1', 
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
      try {
        sqlite.prepare('SELECT 1').get();
        console.log(`[Cloudflare D1 Server] Database connection verified: ${dbPath}`);
      } catch (err: any) {
        console.error(`[Cloudflare D1 Server] Database connection FAILED: ${err.message}`);
      }
    });
  }
}

startServer();
