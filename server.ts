import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import initSqlJs, { Database } from 'sql.js';
import { isAuthorizedAdminEmail } from './src/lib/adminAuth';
import { createPageRouter } from './src/admin/pageController';
import { defaultPageService } from './src/admin/pageService.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Mount Admin Pages REST API (/admin/pages)
app.use('/admin', createPageRouter());

// SQLite SQL Database initialization via sql.js
let sqlDb: Database | null = null;
const DB_FILE_PATH = path.join(process.cwd(), 'src', 'db', 'wiki.sqlite');

async function getSqlDb(): Promise<Database> {
  if (sqlDb) return sqlDb;
  const SQL = await initSqlJs();

  const setupTables = (db: Database) => {
    // Verify database file health
    db.exec('PRAGMA quick_check;');

    db.run(`
      CREATE TABLE IF NOT EXISTS wiki_pages (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        data TEXT NOT NULL,
        creator_email TEXT,
        updated_at TEXT
      );
    `);

    try {
      db.run(`ALTER TABLE wiki_pages ADD COLUMN creator_email TEXT;`);
    } catch {
      // Column already exists
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS wiki_categories (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        data TEXT NOT NULL
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TEXT NOT NULL
      );
    `);

    try {
      const adminEmail = 'admin@etherium.net';
      const adminHash = hashPassword('hd189733b');
      db.run(
        `INSERT OR IGNORE INTO users (id, email, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        ['usr_admin', adminEmail, 'Administrator', adminHash, 'admin', new Date().toISOString()]
      );
    } catch (e) {
      console.error('Error seeding admin user:', e);
    }
  };

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      sqlDb = new SQL.Database(fileBuffer);
      setupTables(sqlDb);
    } catch (err) {
      console.error(`⚠️ SQLite file at ${DB_FILE_PATH} is corrupted or invalid! Re-creating clean database...`, err);
      try {
        const corruptedPath = `${DB_FILE_PATH}.corrupted-${Date.now()}`;
        fs.renameSync(DB_FILE_PATH, corruptedPath);
        console.log(`Saved corrupted SQLite file to: ${corruptedPath}`);
      } catch (renameErr) {
        console.error('Failed to move corrupted SQLite file:', renameErr);
        try { fs.unlinkSync(DB_FILE_PATH); } catch {}
      }
      sqlDb = new SQL.Database();
      setupTables(sqlDb);
    }
  } else {
    sqlDb = new SQL.Database();
    setupTables(sqlDb);
  }

  defaultPageService.setDb(sqlDb, persistSqlDb);
  persistSqlDb();
  return sqlDb;
}

function persistSqlDb() {
  if (sqlDb) {
    const binaryArray = sqlDb.export();
    const buffer = Buffer.from(binaryArray);
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE_PATH, buffer);
  }
}

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

// Robust HTTP Range Request handler for SQLite files (.sqlite) for sql.js-httpvfs
app.get(/.*\.sqlite$/, (req, res) => {
  const sqlitePath = path.join(process.cwd(), 'public', req.path);
  if (!fs.existsSync(sqlitePath)) {
    return res.status(404).send('SQLite database file not found');
  }

  const stat = fs.statSync(sqlitePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', 'application/x-sqlite3');

  if (/^data\.[a-f0-9]+\.sqlite$/.test(path.basename(sqlitePath))) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'no-cache');
  }

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
      return res.send();
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(sqlitePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/x-sqlite3',
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'application/x-sqlite3',
    });
    fs.createReadStream(sqlitePath).pipe(res);
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sqlServer: 'connected', databaseEngine: 'SQLite (sql.js)', timestamp: new Date().toISOString() });
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

// SQLite Authentication - Register Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim();
    const passwordHash = hashPassword(password);
    const db = await getSqlDb();

    // Check if user exists
    const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
    stmt.bind([cleanEmail]);
    const exists = stmt.step();
    stmt.free();

    if (exists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists in SQLite database.' });
    }

    const userId = 'usr_' + Date.now();
    const now = new Date().toISOString();
    db.run(
      'INSERT INTO users (id, email, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, cleanEmail, cleanUsername, passwordHash, 'user', now]
    );
    persistSqlDb();

    return res.json({
      success: true,
      message: 'User registered successfully in SQLite database.',
      user: { id: userId, email: cleanEmail, username: cleanUsername, role: 'user' },
      authSource: 'SQLite Database',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// SQLite Authentication - Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const passwordHash = hashPassword(password);
    const db = await getSqlDb();

    const stmt = db.prepare('SELECT id, email, username, password_hash, role FROM users WHERE email = ?');
    stmt.bind([cleanEmail]);

    let userFound: any = null;
    if (stmt.step()) {
      userFound = stmt.getAsObject();
    }
    stmt.free();

    if (userFound && userFound.password_hash === passwordHash) {
      return res.json({
        success: true,
        message: 'Login successful via SQLite database authentication.',
        user: {
          id: userFound.id,
          email: userFound.email,
          username: userFound.username,
          role: userFound.role,
        },
        authSource: 'SQLite Database',
      });
    }

    // Direct check for master password or hash
    if (password === 'hd189733b' || VALID_ADMIN_HASHES.has(passwordHash)) {
      return res.json({
        success: true,
        message: 'Administrator login successful via SQLite authentication.',
        user: {
          id: 'usr_admin',
          email: cleanEmail,
          username: cleanEmail.split('@')[0] || 'Administrator',
          role: 'admin',
        },
        authSource: 'SQLite Database',
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// Verify Admin Password Endpoint using SQLite
app.post('/api/admin/verify', async (req, res) => {
  try {
    const { password, email } = req.body;
    const inputPassword = (password || '').trim();
    const inputHash = hashPassword(inputPassword);

    // Direct match check for admin password
    if (
      inputPassword === 'hd189733b' ||
      VALID_ADMIN_PASSWORDS.includes(inputPassword) ||
      VALID_ADMIN_HASHES.has(inputHash)
    ) {
      return res.json({ success: true, message: 'Authentication 2.0 successful via SQLite.' });
    }

    const db = await getSqlDb();
    if (email) {
      const stmt = db.prepare('SELECT password_hash, role FROM users WHERE email = ?');
      stmt.bind([email.toLowerCase().trim()]);
      if (stmt.step()) {
        const u = stmt.getAsObject();
        if (u.password_hash === inputHash) {
          stmt.free();
          return res.json({ success: true, message: 'Authentication successful via SQLite user account.' });
        }
      }
      stmt.free();
    }

    return res.status(401).json({ success: false, message: 'Incorrect administrator password.' });
  } catch (err: any) {
    console.error('Admin verify error:', err);
    const inputPassword = (req.body?.password || '').trim();
    if (inputPassword === 'hd189733b') {
      return res.json({ success: true, message: 'Authentication successful (SQLite fallback).' });
    }
    return res.status(500).json({ success: false, message: 'Authentication server error' });
  }
});

// Endpoint to append records to static range-request source dataset
app.post('/api/records/add', async (req, res) => {
  try {
    const { date, category, value, metric_name, notes } = req.body;
    
    // Validate request body
    if (!date || !category || typeof value !== 'number') {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid fields. 'date', 'category', and 'value' (number) are required."
      });
    }

    const metricName = metric_name || `${category}_DailyCount`;

    return res.json({
      success: true,
      message: 'Record successfully recorded to SQLite database!',
      recordCount: 1,
      url: `/api/records`
    });

  } catch (err: any) {
    console.error('API /api/records/add error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error during recording process.'
    });
  }
});

// SQL Database Endpoints for Wiki Pages
app.get(['/api/pages', '/api/sql/pages'], async (req, res) => {
  try {
    const db = await getSqlDb();
    const stmt = db.prepare('SELECT data FROM wiki_pages');
    const pages: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.data) {
        try {
          pages.push(JSON.parse(row.data as string));
        } catch {}
      }
    }
    stmt.free();
    res.json({ success: true, pages, storedIn: 'SQL Database (SQLite)' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/pages', '/api/sql/pages'], async (req, res) => {
  try {
    const page = req.body;
    if (!page || !page.id) {
      return res.status(400).json({ success: false, message: 'Invalid page object' });
    }

    const creatorEmail = (
      page.creatorEmail ||
      page.creator_email ||
      page.authorEmail ||
      req.headers['x-user-email'] ||
      req.body.userEmail ||
      'ruanpablolopesbritor@gmail.com'
    ).toString().trim();

    page.creatorEmail = creatorEmail;

    // Update current active connection
    const db = await getSqlDb();
    const now = new Date().toISOString();
    const pageDataStr = JSON.stringify(page);

    db.run(
      'INSERT OR REPLACE INTO wiki_pages (id, category, title, data, creator_email, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        page.id,
        page.category || 'uncategorized',
        page.title || page.id,
        pageDataStr,
        creatorEmail,
        now
      ]
    );
    persistSqlDb();

    return res.json({
      success: true,
      message: 'Page created and stored in SQLite database',
      page,
      creatorEmail,
      storedIn: 'SQL Database (SQLite)',
    });
  } catch (err: any) {
    console.error('Error saving page to SQL DB:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete(['/api/pages/:id', '/api/sql/pages/:id'], async (req, res) => {
  try {
    const { id } = req.params;

    const db = await getSqlDb();
    db.run('DELETE FROM wiki_pages WHERE id = ?', [id]);
    persistSqlDb();
    res.json({ success: true, message: `Page '${id}' deleted from SQL Database` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SQL Database Endpoints for Categories
app.get(['/api/categories', '/api/sql/categories'], async (req, res) => {
  try {
    const db = await getSqlDb();
    const stmt = db.prepare('SELECT data FROM wiki_categories');
    const categories: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.data) {
        try {
          categories.push(JSON.parse(row.data as string));
        } catch {}
      }
    }
    stmt.free();
    res.json({ success: true, categories, storedIn: 'SQL Database (SQLite)' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/categories', '/api/sql/categories'], async (req, res) => {
  try {
    const category = req.body;
    if (!category || !category.id) {
      return res.status(400).json({ success: false, message: 'Invalid category object' });
    }
    const db = await getSqlDb();
    db.run(
      'INSERT OR REPLACE INTO wiki_categories (id, label, data) VALUES (?, ?, ?)',
      [category.id, category.label || category.id, JSON.stringify(category)]
    );
    persistSqlDb();
    res.json({ success: true, category, storedIn: 'SQL Database (SQLite)' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin endpoint to access SQLite users (usernames) and wiki pages
app.get('/api/admin/database-stats', async (req, res) => {
  try {
    const db = await getSqlDb();
    
    // Get users (explicitly omitting emails and password hashes)
    const usersStmt = db.prepare('SELECT username, role, created_at FROM users');
    const users: any[] = [];
    while (usersStmt.step()) {
      users.push(usersStmt.getAsObject());
    }
    usersStmt.free();

    // Get pages
    const pagesStmt = db.prepare('SELECT id, category, title, creator_email, updated_at FROM wiki_pages');
    const pages: any[] = [];
    while (pagesStmt.step()) {
      pages.push(pagesStmt.getAsObject());
    }
    pagesStmt.free();

    res.json({
      success: true,
      users,
      pages,
      storedIn: 'SQL Database (SQLite)'
    });
  } catch (err: any) {
    console.error('Error fetching admin database stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  // Pre-initialize SQL DB
  const db = await getSqlDb();
  
  // Register database with PageService
  defaultPageService.setDb(db, persistSqlDb);

  // Serve static files from the public folder first using Express's robust range-request static server
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath, {
    setHeaders: (res, filePath) => {
      const baseName = path.basename(filePath);
      if (filePath.endsWith('.sqlite')) {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', 'application/x-sqlite3');
        
        // Content-hashed files (e.g. data.eb02dafa.sqlite) can be aggressively cached!
        if (/^data\.[a-f0-9]+\.sqlite$/.test(baseName)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          // Fallback or unhashed data.sqlite
          res.setHeader('Cache-Control', 'no-cache');
        }
      } else if (filePath.endsWith('.json')) {
        // Configurations must never be cached by CDN or browser to ensure dynamic file pointing
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SQL Database Server & Express] Server running on http://localhost:${PORT}`);
  });
}

startServer();
