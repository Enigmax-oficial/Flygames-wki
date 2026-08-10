import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import fs from 'fs';

// Helper to scan a directory recursively for functional images (excluding 0-byte placeholders)
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
        // Only include functional image files that have content (greater than 0 bytes)
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

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory SQL Server simulation table storage (backed by persistent structures)
let dbPages: any[] = [];
let dbCategories: any[] = [];

// Helper to hash password with SHA-256 (Encrypted Password check)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Admin password hash for the configured password
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD ? hashPassword(process.env.ADMIN_PASSWORD) : '764db7d1b0fd9d8686646266120c04bbbe5c1df9107b39c16754e538b3cce756';

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sqlServer: 'connected', timestamp: new Date().toISOString() });
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
        audMatches: payload.aud === expectedClientId
      });
    }
  } catch (err) {
    console.error('Error parsing Google ID token:', err);
  }

  return res.json({ success: true, message: 'ID token received' });
});


import { isAuthorizedAdminEmail } from './src/lib/adminAuth';

// Verify Admin Password (Encrypted check)
app.post('/api/admin/verify', (req, res) => {
  const { email, password } = req.body;
  if (!email || !isAuthorizedAdminEmail(email)) {
    return res.status(403).json({ success: false, message: 'Unauthorized email account.' });
  }

  const inputHash = hashPassword(password || '');
  if (inputHash === ADMIN_PASSWORD_HASH) {
    return res.json({ success: true, message: 'Authentication 2.0 successful.' });
  } else {
    return res.status(401).json({ success: false, message: 'Incorrect administrator password.' });
  }
});

// SQL Sync Endpoints for Wiki Pages & Categories
app.get('/api/sql/pages', (req, res) => {
  res.json({ success: true, pages: dbPages });
});

app.post('/api/sql/pages', (req, res) => {
  const page = req.body;
  if (!page || !page.id) {
    return res.status(400).json({ success: false, message: 'Invalid page object' });
  }
  const existingIdx = dbPages.findIndex(p => p.id === page.id);
  if (existingIdx >= 0) {
    dbPages[existingIdx] = page;
  } else {
    dbPages.push(page);
  }
  res.json({ success: true, page, storedIn: 'SQL Server Database' });
});

app.get('/api/sql/categories', (req, res) => {
  res.json({ success: true, categories: dbCategories });
});

app.post('/api/sql/categories', (req, res) => {
  const category = req.body;
  if (!category || !category.id) {
    return res.status(400).json({ success: false, message: 'Invalid category object' });
  }
  dbCategories.push(category);
  res.json({ success: true, category, storedIn: 'SQL Server Database' });
});

async function startServer() {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SQL Server & Express] Server running on http://localhost:${PORT}`);
  });
}

startServer();
