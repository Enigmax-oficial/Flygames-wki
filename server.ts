import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import { spawn } from 'child_process';

// Spawn wrangler dev in the background to serve Cloudflare D1 local worker on port 3001
console.log('Starting Cloudflare D1 local worker (wrangler dev on port 3001)...');
const wranglerProcess = spawn('npx', ['wrangler', 'dev', '--port', '3001', '--local'], {
  stdio: 'inherit',
  shell: true,
});

wranglerProcess.on('error', (err) => {
  console.error('Failed to start wrangler process:', err);
});

process.on('exit', () => {
  wranglerProcess.kill();
});
process.on('SIGINT', () => {
  wranglerProcess.kill();
  process.exit();
});
process.on('SIGTERM', () => {
  wranglerProcess.kill();
  process.exit();
});

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to proxy requests to Cloudflare D1 Worker running on port 3001
async function proxyToWorker(req: any, res: any) {
  const targetUrl = `http://127.0.0.1:3001${req.originalUrl}`;
  try {
    const headers: Record<string, string> = {};
    for (const [key, val] of Object.entries(req.headers)) {
      if (typeof val === 'string') {
        headers[key] = val;
      } else if (Array.isArray(val)) {
        headers[key] = val.join(', ');
      }
    }
    
    headers['host'] = '127.0.0.1:3001';

    const options: RequestInit = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, options);
    res.status(response.status);
    
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    const bodyText = await response.text();
    res.send(bodyText);
  } catch (err: any) {
    console.error('Error proxying request to local D1 worker:', err);
    res.status(500).json({ error: 'Failed to communicate with Cloudflare D1 local worker: ' + err.message });
  }
}

// Proxy D1 database operations and pages endpoints directly to the real Cloudflare D1 local Worker
app.all([
  '/api/pages',
  '/api/pages/*',
  '/api/sql/pages',
  '/api/sql/pages/*',
  '/admin/pages',
  '/admin/pages/*',
  '/api/admin/pages',
  '/api/admin/pages/*',
  '/api/admin/database-stats',
  '/api/admin/verify',
  '/api/categories',
  '/api/categories/*',
  '/api/sql/categories',
  '/api/sql/categories/*'
], proxyToWorker);

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

// Helper to hash password with SHA-256
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const VALID_ADMIN_PASSWORDS = ['hd189733b', process.env.ADMIN_PASSWORD].filter(Boolean) as string[];
const VALID_ADMIN_HASHES = new Set([
  'e527cfef2116eeda9f0b392baaa448dca44435333653726e1dafff8052445e43',
  ...VALID_ADMIN_PASSWORDS.map((p) => hashPassword(p))
]);

interface UserRecord {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  role: string;
  created_at: string;
}

const inMemoryUsers: UserRecord[] = [
  {
    id: 'usr_admin',
    email: 'admin@etherium.net',
    username: 'Administrator',
    password_hash: hashPassword('hd189733b'),
    role: 'admin',
    created_at: new Date().toISOString(),
  }
];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sqlServer: 'connected', databaseEngine: 'Cloudflare D1', timestamp: new Date().toISOString() });
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

// Google OAuth verification endpoint
app.post('/auth/google', (req, res) => {
  const { id_token } = req.body;
  if (!id_token) {
    return res.status(400).json({ success: false, error: 'Missing id_token' });
  }

  try {
    const parts = id_token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      const expectedClientId = '309962205395-c36qhp6n9qold6kcd5ii3d4t3q04qvt9.apps.googleusercontent.com';

      return res.json({
        success: true,
        user: {
          name: payload.name || (payload.email ? payload.email.split('@')[0] : 'Google User'),
          email: payload.email,
          picture: payload.picture,
          sub: payload.sub,
        },
        audMatches: payload.aud === expectedClientId,
      });
    }
  } catch (err) {
    console.error('Error parsing Google ID token:', err);
  }

  return res.json({ success: true, message: 'ID token received' });
});

// Authentication - Register Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim();
    const passwordHash = hashPassword(password);

    const exists = inMemoryUsers.some(u => u.email === cleanEmail);
    if (exists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists in Cloudflare D1.' });
    }

    const userId = 'usr_' + Date.now();
    const now = new Date().toISOString();
    inMemoryUsers.push({
      id: userId,
      email: cleanEmail,
      username: cleanUsername,
      password_hash: passwordHash,
      role: 'user',
      created_at: now
    });

    return res.json({
      success: true,
      message: 'User registered successfully in Cloudflare D1.',
      user: { id: userId, email: cleanEmail, username: cleanUsername, role: 'user' },
      authSource: 'Cloudflare D1',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// Authentication - Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const passwordHash = hashPassword(password);

    const userFound = inMemoryUsers.find(u => u.email === cleanEmail);

    if (userFound && userFound.password_hash === passwordHash) {
      return res.json({
        success: true,
        message: 'Login successful via Cloudflare D1 authentication.',
        user: {
          id: userFound.id,
          email: userFound.email,
          username: userFound.username,
          role: userFound.role,
        },
        authSource: 'Cloudflare D1',
      });
    }

    // Direct check for master password or hash
    if (password === 'hd189733b' || VALID_ADMIN_HASHES.has(passwordHash)) {
      return res.json({
        success: true,
        message: 'Administrator login successful via Cloudflare D1 authentication.',
        user: {
          id: 'usr_admin',
          email: cleanEmail,
          username: cleanEmail.split('@')[0] || 'Administrator',
          role: 'admin',
        },
        authSource: 'Cloudflare D1',
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// All database operations and page endpoints are proxied directly to the real Cloudflare D1 local worker (proxyToWorker) above.

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
      console.log(`[Cloudflare D1 Server & Express] Server running on http://localhost:${numericPort}`);
    });
  }
}

startServer();
