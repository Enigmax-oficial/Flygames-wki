import { hashPassword, verifyPassword } from '../src/auth/password';
import { Env } from './types';

const JWT_SECRET = 'minecraft-wiki-secret-key-2026';

export interface UserPayload {
  id: string;
  email: string;
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

    return { id: payload.id, email: payload.email };
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

export async function authenticateRequest(request: Request): Promise<UserPayload | null> {
  const token = extractAuthToken(request);
  if (!token) return null;
  return await verifyToken(token);
}

export async function handleAuthRequest(
  request: Request,
  url: URL,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const pathname = url.pathname;

  // Helper for JSON response
  const jsonRes = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  };

  // POST /auth/signup or /api/auth/signup
  if (pathname === '/auth/signup' || pathname === '/api/auth/signup') {
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
        'INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(userId, cleanEmail, hashed, now, now)
      .run();

    const token = await createToken({ id: userId, email: cleanEmail });

    // Explicitly return safe fields only (id, email, created_at) - never password_hash
    return jsonRes(
      {
        success: true,
        token,
        user: {
          id: userId,
          email: cleanEmail,
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
      .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string; email: string; password_hash: string }>();

    if (!user) {
      return jsonRes({ error: 'Invalid email or password' }, 401);
    }

    const isMatch = await verifyPassword(String(password), user.password_hash);
    if (!isMatch) {
      return jsonRes({ error: 'Invalid email or password' }, 401);
    }

    const token = await createToken({ id: user.id, email: user.email });

    // Explicitly return safe fields only - NO password_hash in response
    return jsonRes({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
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
  const pathname = url.pathname;

  const jsonRes = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  };

  const currentUser = await authenticateRequest(request);
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
        `SELECT f.id as favorite_id, f.created_at as favorited_at, p.id, p.title, p.slug, p.content, p.image_url, p.created_at, p.updated_at
         FROM favorites f
         JOIN pages p ON f.page_id = p.id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC`
      )
      .bind(currentUser.id)
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

    // Check page existence
    const pageExists = await env.mysql
      .prepare('SELECT id FROM pages WHERE id = ?')
      .bind(targetPageId)
      .first<{ id: string }>();

    if (!pageExists) {
      return jsonRes({ error: 'Page not found' }, 404);
    }

    const favId = 'fav_' + crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      await env.mysql
        .prepare(
          'INSERT INTO favorites (id, user_id, page_id, created_at) VALUES (?, ?, ?, ?)'
        )
        .bind(favId, currentUser.id, targetPageId, now)
        .run();
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return jsonRes({ message: 'Already favorited', favorite_id: favId });
      }
      throw err;
    }

    return jsonRes({ success: true, favorite_id: favId, page_id: targetPageId }, 201);
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
      .prepare('DELETE FROM favorites WHERE user_id = ? AND page_id = ?')
      .bind(currentUser.id, targetPageId)
      .run();

    return jsonRes({ success: true, message: 'Removed from favorites' });
  }

  return jsonRes({ error: 'Not found' }, 404);
}
