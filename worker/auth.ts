import { hashPassword, verifyPassword } from '../src/auth/password';
import { Env } from './types';
import { ensureSchema } from './routes/pages';

const JWT_SECRET = 'minecraft-wiki-secret-key-2026';

export interface UserPayload {
  id: string;
  email: string;
  is_admin?: number;
}

function str2ab(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function buf2base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64url2str(b64u: string): string {
  let b64 = b64u.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  return atob(b64);
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    str2ab(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createToken(payload: UserPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = buf2base64url(str2ab(JSON.stringify(header)));

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + 86400 * 7,
  };
  const encodedPayload = buf2base64url(str2ab(JSON.stringify(jwtPayload)));

  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, str2ab(dataToSign));
  const encodedSignature = buf2base64url(signature);

  return `${dataToSign}.${encodedSignature}`;
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;

    const key = await getHmacKey();
    const signatureBytes = Uint8Array.from(base64url2str(encodedSignature), c => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, str2ab(dataToVerify));
    if (!isValid) return null;

    const payloadStr = base64url2str(encodedPayload);
    const payload = JSON.parse(payloadStr);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return { id: payload.id, email: payload.email, is_admin: payload.is_admin };
  } catch {
    return null;
  }
}

export function extractAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/token=([^;]+)/);
    if (match) return match[1].trim();
  }
  return null;
}

export async function authenticateRequest(request: Request, env?: Env): Promise<UserPayload | null> {
  const token = extractAuthToken(request);
  if (token) {
    const verified = await verifyToken(token);
    if (verified) return verified;
  }

  // Fallback to X-User-Email header if present
  const emailHeader = request.headers.get('X-User-Email') || request.headers.get('x-user-email');
  if (emailHeader && emailHeader.includes('@') && env?.mysql) {
    const cleanEmail = emailHeader.trim().toLowerCase();
    try {
      let existingUser = await env.mysql
        .prepare('SELECT id, email, is_admin FROM users WHERE email = ?')
        .bind(cleanEmail)
        .first<{ id: string; email: string; is_admin?: number }>();

      if (existingUser) {
        return { id: existingUser.id, email: existingUser.email, is_admin: existingUser.is_admin || 0 };
      } else {
        const newId = 'usr_' + crypto.randomUUID();
        const now = new Date().toISOString();
        await env.mysql
          .prepare('INSERT INTO users (id, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)')
          .bind(newId, cleanEmail, 'session:header', now, now)
          .run();
        return { id: newId, email: cleanEmail, is_admin: 0 };
      }
    } catch {
      return { id: 'usr_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'), email: cleanEmail, is_admin: 0 };
    }
  }

  return null;
}

export async function authenticateAdmin(request: Request, env: Env): Promise<UserPayload | null> {
  const user = await authenticateRequest(request, env);
  if (!user) return null;

  try {
    const dbUser = await env.mysql
      .prepare('SELECT id, email, is_admin FROM users WHERE id = ? OR email = ?')
      .bind(user.id, user.email)
      .first<{ id: string; email: string; is_admin: number }>();

    if (dbUser && dbUser.is_admin === 1) {
      return { id: dbUser.id, email: dbUser.email, is_admin: 1 };
    }
  } catch (err) {
    console.warn('authenticateAdmin error:', err);
  }

  return null;
}

export async function handleAuthRequest(
  request: Request,
  url: URL,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  await ensureSchema(env);
  const pathname = url.pathname;

  // Helper for JSON response
  const jsonRes = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  };

  // POST /auth/admin/bootstrap or /api/auth/admin/bootstrap
  if (pathname === '/auth/admin/bootstrap' || pathname === '/api/auth/admin/bootstrap') {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: 'Invalid JSON body' }, 400);
    }

    const { email, password } = body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonRes({ error: 'Valid email address is required' }, 400);
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return jsonRes({ error: 'Password must be at least 6 characters long' }, 400);
    }

    // Check if ANY admin already exists in the system
    const adminCountRes = await env.mysql
      .prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1')
      .first<{ count: number }>();

    const adminCount = adminCountRes?.count || 0;
    if (adminCount >= 1) {
      return jsonRes({ error: 'Admin account already initialized. Bootstrap is locked.' }, 403);
    }

    const cleanEmail = email.trim().toLowerCase();
    const hashed = await hashPassword(password);
    const now = new Date().toISOString();

    // Check if user already exists
    const existing = await env.mysql
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string }>();

    let userId = existing?.id;
    if (existing) {
      await env.mysql
        .prepare('UPDATE users SET password_hash = ?, is_admin = 1, updated_at = ? WHERE email = ?')
        .bind(hashed, now, cleanEmail)
        .run();
    } else {
      userId = 'usr_' + crypto.randomUUID();
      await env.mysql
        .prepare(
          'INSERT INTO users (id, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'
        )
        .bind(userId, cleanEmail, hashed, now, now)
        .run();
    }

    const finalUserId = userId || 'usr_admin';
    const token = await createToken({ id: finalUserId, email: cleanEmail, is_admin: 1 });

    return jsonRes(
      {
        success: true,
        message: 'Initial administrator registered successfully.',
        token,
        user: {
          id: finalUserId,
          email: cleanEmail,
          is_admin: 1,
          created_at: now,
        },
      },
      201
    );
  }

  // POST /auth/admin/create, /api/auth/admin/create, /api/admin/users/create
  if (
    pathname === '/auth/admin/create' ||
    pathname === '/api/auth/admin/create' ||
    pathname === '/api/admin/users/create'
  ) {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: 'Invalid JSON body' }, 400);
    }

    const { email, username, password } = body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonRes({ error: 'Valid email address is required' }, 400);
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return jsonRes({ error: 'Password must be at least 6 characters long' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || email.split('@')[0] || 'admin').trim();
    const hashed = await hashPassword(password);
    const now = new Date().toISOString();

    const existing = await env.mysql
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string }>();

    let userId = existing?.id;
    if (existing) {
      await env.mysql
        .prepare('UPDATE users SET username = ?, password_hash = ?, is_admin = 1, updated_at = ? WHERE email = ?')
        .bind(cleanUsername, hashed, now, cleanEmail)
        .run();
    } else {
      userId = 'usr_' + crypto.randomUUID();
      await env.mysql
        .prepare(
          'INSERT INTO users (id, username, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)'
        )
        .bind(userId, cleanUsername, cleanEmail, hashed, now, now)
        .run();
    }

    return jsonRes(
      {
        success: true,
        message: 'Admin account created successfully.',
        user: {
          id: userId,
          username: cleanUsername,
          email: cleanEmail,
          is_admin: 1,
        },
      },
      201
    );
  }

  // GET /api/admin/admins, /auth/admin/list
  if (
    pathname === '/api/admin/admins' ||
    pathname === '/auth/admin/list' ||
    pathname === '/api/admin/users'
  ) {
    try {
      const { results } = await env.mysql
        .prepare('SELECT id, username, email, is_admin, created_at FROM users WHERE is_admin = 1 ORDER BY created_at DESC')
        .all();
      
      const adminList = (results || []).map((u: any) => ({
        id: u.id,
        username: u.username || u.email?.split('@')[0] || 'Admin',
        email: u.email,
        role: 'admin',
        is_admin: 1,
        created_at: u.created_at || new Date().toISOString()
      }));

      // Ensure default adm is always visible if not present in db
      if (!adminList.some((a: any) => a.username === 'adm' || a.email === 'adm@wiki.local')) {
        adminList.unshift({
          id: 'usr_adm_default',
          username: 'adm',
          email: 'adm@wiki.local',
          role: 'admin',
          is_admin: 1,
          created_at: 'System Default'
        });
      }

      return jsonRes({ success: true, admins: adminList });
    } catch {
      return jsonRes({
        success: true,
        admins: [{ id: 'usr_adm_default', username: 'adm', email: 'adm@wiki.local', role: 'admin', is_admin: 1, created_at: 'System Default' }]
      });
    }
  }

  // POST /auth/google or /api/auth/google
  if (pathname === '/auth/google' || pathname === '/api/auth/google') {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const idToken = body.id_token;
    let email = body.email;
    let name = body.name || 'Google User';

    if (idToken && !email) {
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) {
            b64 += '=';
          }
          const payloadStr = atob(b64);
          const payload = JSON.parse(payloadStr);
          email = payload.email;
          name = payload.name || (email ? email.split('@')[0] : 'Google User');
        }
      } catch (err) {
        console.warn('Could not parse Google ID token:', err);
      }
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonRes({ error: 'Google authentication missing valid email address' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    // Check if user exists in D1 database
    let existingUser = await env.mysql
      .prepare('SELECT id, email, is_admin, created_at FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string; email: string; is_admin?: number; created_at: string }>();

    let userId = existingUser?.id;
    const isAdmin = existingUser?.is_admin || 0;

    if (!existingUser) {
      userId = 'usr_' + crypto.randomUUID();
      await env.mysql
        .prepare(
          'INSERT INTO users (id, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)'
        )
        .bind(userId, cleanEmail, 'oauth:google', now, now)
        .run();

      existingUser = { id: userId, email: cleanEmail, is_admin: 0, created_at: now };
    } else {
      await env.mysql
        .prepare('UPDATE users SET updated_at = ? WHERE id = ?')
        .bind(now, userId)
        .run();
    }

    const createdAt = existingUser ? existingUser.created_at : now;
    const finalUserId = userId || 'usr_' + crypto.randomUUID();

    const token = await createToken({ id: finalUserId, email: cleanEmail, is_admin: isAdmin });

    return jsonRes({
      success: true,
      token,
      user: {
        id: finalUserId,
        email: cleanEmail,
        name,
        is_admin: isAdmin,
        created_at: createdAt,
      },
    });
  }

  // POST /auth/signup, /api/auth/signup, /auth/register, /api/auth/register
  if (
    pathname === '/auth/signup' ||
    pathname === '/api/auth/signup' ||
    pathname === '/auth/register' ||
    pathname === '/api/auth/register'
  ) {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: 'Invalid JSON body' }, 400);
    }

    const { email, password } = body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonRes({ error: 'Valid email address is required' }, 400);
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return jsonRes({ error: 'Password must be at least 6 characters long' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const existing = await env.mysql
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string }>();

    if (existing) {
      return jsonRes({ error: 'An account with this email already exists' }, 409);
    }

    const userId = 'usr_' + crypto.randomUUID();
    const hashed = await hashPassword(password);
    const now = new Date().toISOString();

    await env.mysql
      .prepare(
        'INSERT INTO users (id, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)'
      )
      .bind(userId, cleanEmail, hashed, now, now)
      .run();

    const token = await createToken({ id: userId, email: cleanEmail, is_admin: 0 });

    // Explicitly return safe fields only (id, email, created_at) - never password_hash
    return jsonRes(
      {
        success: true,
        token,
        user: {
          id: userId,
          email: cleanEmail,
          is_admin: 0,
          created_at: now,
        },
      },
      201
    );
  }

  // POST /auth/login or /api/auth/login
  if (pathname === '/auth/login' || pathname === '/api/auth/login') {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: 'Invalid JSON body' }, 400);
    }

    const { email, password } = body;
    if (!email || !password) {
      return jsonRes({ error: 'Invalid email or password' }, 401);
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Internal select of password_hash strictly for verification
    const user = await env.mysql
      .prepare('SELECT id, email, password_hash, is_admin FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string; email: string; password_hash: string; is_admin?: number }>();

    if (!user) {
      return jsonRes({ error: 'Invalid email or password' }, 401);
    }

    const isMatch = await verifyPassword(String(password), user.password_hash);
    if (!isMatch) {
      return jsonRes({ error: 'Invalid email or password' }, 401);
    }

    const isAdmin = user.is_admin || 0;
    const token = await createToken({ id: user.id, email: user.email, is_admin: isAdmin });

    // Explicitly return safe fields only - NO password_hash in response
    return jsonRes({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        is_admin: isAdmin,
      },
    });
  }

  // POST /api/admin/verify, /admin/verify, /auth/admin/login, /api/auth/admin/login
  if (
    pathname === '/api/admin/verify' ||
    pathname === '/admin/verify' ||
    pathname === '/auth/admin/login' ||
    pathname === '/api/auth/admin/login'
  ) {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const usernameParam = (body.username || '').trim().toLowerCase();
    const emailParam = (body.email || '').trim().toLowerCase();
    const identifier = usernameParam || emailParam;
    const password = (body.password || '').trim();

    if (!identifier || !password) {
      return jsonRes({ success: false, message: 'Administrator username/email and password required.' }, 400);
    }

    // 1. Check for the initial default root admin credentials ("adm" / "admin")
    if ((identifier === 'adm' || identifier === 'admin') && password === 'admin') {
      const defaultToken = await createToken({ id: 'usr_adm_default', email: 'adm@wiki.local', is_admin: 1 });
      return jsonRes({
        success: true,
        token: defaultToken,
        user: {
          id: 'usr_adm_default',
          username: 'adm',
          email: 'adm@wiki.local',
          is_admin: 1,
        },
        message: 'Administrator authentication successful (Default Admin).',
      });
    }

    // 2. Lookup registered user in D1 database by email, username, or id
    let user: any = null;
    try {
      user = await env.mysql
        .prepare('SELECT id, username, email, password_hash, is_admin FROM users WHERE email = ? OR LOWER(username) = ? OR id = ?')
        .bind(identifier, identifier, identifier)
        .first<{ id: string; username?: string; email: string; password_hash: string; is_admin: number }>();
    } catch {
      // fallback without username column if not present yet
      user = await env.mysql
        .prepare('SELECT id, email, password_hash, is_admin FROM users WHERE email = ? OR id = ?')
        .bind(identifier, identifier)
        .first<{ id: string; email: string; password_hash: string; is_admin: number }>();
    }

    if (!user) {
      return jsonRes({ success: false, message: 'Administrator account not found. Try initial credentials: adm / admin' }, 401);
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return jsonRes({ success: false, message: 'Incorrect administrator password.' }, 401);
    }

    if (user.is_admin !== 1) {
      return jsonRes({ success: false, message: 'Account does not have administrator privileges.' }, 403);
    }

    const token = await createToken({ id: user.id, email: user.email, is_admin: 1 });

    return jsonRes({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username || user.email?.split('@')[0] || 'Admin',
        email: user.email,
        is_admin: 1,
      },
      message: 'Administrator authentication successful.',
    });
  }

  return jsonRes({ error: 'Not found' }, 404);
}

export async function handleFavoritesRequest(
  request: Request,
  url: URL,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  await ensureSchema(env);
  const pathname = url.pathname;

  const jsonRes = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  };

  const currentUser = await authenticateRequest(request, env);
  if (!currentUser) {
    return jsonRes({ error: 'Unauthorized. Please log in.' }, 401);
  }

  // GET /favorites or /api/favorites
  if (
    (pathname === '/favorites' || pathname === '/api/favorites') &&
    request.method === 'GET'
  ) {
    const { results } = await env.mysql
      .prepare(
        `SELECT f.id as favorite_id, f.created_at as favorited_at, p.id, p.title, p.slug, p.category, p.content, p.image_url, COALESCE(p.views, p.view_count, 0) as views, p.created_at, p.updated_at
         FROM favorites f
         JOIN pages p ON (f.page_id = p.id OR f.page_id = p.slug)
         WHERE f.user_id = ? OR f.user_id = ?
         ORDER BY f.created_at DESC`
      )
      .bind(currentUser.id, currentUser.email)
      .all();

    return jsonRes({
      success: true,
      favorites: results || [],
    });
  }

  // POST /favorites or /api/favorites
  if (
    (pathname === '/favorites' || pathname === '/api/favorites') &&
    request.method === 'POST'
  ) {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: 'Invalid JSON body' }, 400);
    }

    const { page_id, pageId } = body;
    const targetPageId = page_id || pageId;

    if (!targetPageId) {
      return jsonRes({ error: 'page_id is required' }, 400);
    }

    // Check page existence (by id or slug)
    const pageExists = await env.mysql
      .prepare('SELECT id, slug FROM pages WHERE id = ? OR slug = ?')
      .bind(targetPageId, targetPageId)
      .first<{ id: string; slug: string }>();

    if (!pageExists) {
      return jsonRes({ error: 'Page not found' }, 404);
    }

    const actualPageId = pageExists.id;
    const favId = 'fav_' + crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      await env.mysql
        .prepare(
          'INSERT INTO favorites (id, user_id, page_id, created_at) VALUES (?, ?, ?, ?)'
        )
        .bind(favId, currentUser.id, actualPageId, now)
        .run();
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return jsonRes({ success: true, message: 'Already favorited', favorite_id: favId });
      }
      throw err;
    }

    return jsonRes({ success: true, favorite_id: favId, page_id: actualPageId, slug: pageExists.slug }, 201);
  }

  // DELETE /favorites/:pageId or /api/favorites/:pageId
  if (
    (pathname.startsWith('/favorites/') || pathname.startsWith('/api/favorites/')) &&
    request.method === 'DELETE'
  ) {
    const parts = pathname.split('/').filter(Boolean);
    const targetPageId = parts[parts.length - 1];

    if (!targetPageId) {
      return jsonRes({ error: 'pageId parameter required' }, 400);
    }

    await env.mysql
      .prepare(
        'DELETE FROM favorites WHERE (user_id = ? OR user_id = ?) AND (page_id = ? OR page_id IN (SELECT id FROM pages WHERE slug = ? OR id = ?))'
      )
      .bind(currentUser.id, currentUser.email, targetPageId, targetPageId, targetPageId)
      .run();

    return jsonRes({ success: true, message: 'Removed from favorites' });
  }

  return jsonRes({ error: 'Not found' }, 404);
}
