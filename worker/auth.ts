import { hashPassword, verifyPassword } from '../src/auth/password';
import { Env } from './types';
import { ensureSchema } from './routes/pages';
import { sendEmailVerification } from './email-service';
import { Resend } from 'resend';

interface VerificationEntry {
  code: string;
  expiresAt: number;
}


export function resolveAvatarUrl(user: { avatar_key?: string | null; google_avatar_url?: string | null; avatar_url?: string | null }): string | null {
  if (user.avatar_key) {
    return `/api/${user.avatar_key}`;
  }
  if (user.avatar_url) {
    return user.avatar_url;
  }
  if (user.google_avatar_url) {
    return user.google_avatar_url;
  }
  return null;
}

export async function cleanupExpiredVerifications(env: Env): Promise<void> {
  try {
    const nowIso = new Date().toISOString();
    await env.mysql
      .prepare("DELETE FROM email_verifications WHERE expires_at < ? OR expires_at < datetime('now')")
      .bind(nowIso)
      .run();
  } catch (err) {
    console.log('[D1 cleanup expired verifications notice]', err);
  }
}
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

function getJwtSecret(env?: Env): string {
  return (env as any)?.JWT_SECRET || (typeof process !== 'undefined' && process.env?.JWT_SECRET) || '';
}

async function getHmacKey(env?: Env): Promise<CryptoKey> {
  const secretKey = getJwtSecret(env);
  return crypto.subtle.importKey(
    'raw',
    str2ab(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createToken(payload: UserPayload, env?: Env): Promise<string> {
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
  const key = await getHmacKey(env);
  const signature = await crypto.subtle.sign('HMAC', key, str2ab(dataToSign));
  const encodedSignature = buf2base64url(signature);

  return `${dataToSign}.${encodedSignature}`;
}

export async function verifyToken(token: string, env?: Env): Promise<UserPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;

    const key = await getHmacKey(env);
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
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = request.headers.get('Cookie') || request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/token=([^;]+)/);
    if (match) return match[1].trim();
  }
  return null;
}

export async function authenticateRequest(request: Request, env?: Env): Promise<UserPayload | null> {
  const token = extractAuthToken(request);
  if (!token) return null;
  return await verifyToken(token, env);
}

export async function requireAdmin(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  }
): Promise<{ user: UserPayload; errorResponse: null } | { user: null; errorResponse: Response }> {
  const token = extractAuthToken(request);
  if (!token) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Authentication required.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  const userPayload = await verifyToken(token, env);
  if (!userPayload || !userPayload.id) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  // Direct re-check of is_admin directly from users table in D1
  try {
    const dbUser = await env.mysql
      .prepare('SELECT id, email, is_admin FROM users WHERE id = ? OR email = ?')
      .bind(userPayload.id, userPayload.email)
      .first<{ id: string; email: string; is_admin?: number }>();

    if (dbUser && dbUser.is_admin === 1) {
      return {
        user: { id: dbUser.id, email: dbUser.email, is_admin: 1 },
        errorResponse: null,
      };
    }
    if (dbUser && dbUser.is_admin !== 1) {
      return {
        user: null,
        errorResponse: new Response(
          JSON.stringify({ success: false, error: 'Forbidden: Administrator privileges required.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        ),
      };
    }

    // Fallback to cryptographically verified JWT claim if user row is not yet in D1 (e.g. local dev / unconfigured D1 credentials)
    if (userPayload.is_admin === 1) {
      return {
        user: { id: userPayload.id, email: userPayload.email, is_admin: 1 },
        errorResponse: null,
      };
    }

    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Administrator privileges required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  } catch (err: any) {
    if (userPayload.is_admin === 1) {
      return {
        user: { id: userPayload.id, email: userPayload.email, is_admin: 1 },
        errorResponse: null,
      };
    }
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Authorization error: Database query failed.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }
}

export async function authenticateAdmin(request: Request, env: Env): Promise<UserPayload | null> {
  const result = await requireAdmin(request, env);
  return result.user;
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

  // POST /auth/admin/bootstrap or /api/auth/admin/bootstrap (Sensible First Admin Setup)
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

    const email = body.email || body.adminEmail;
    const password = body.password || body.adminPassword;
    const username = (body.username || (email ? email.split('@')[0] : 'admin')).trim();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonRes({ error: 'Valid email address is required' }, 400);
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return jsonRes({ error: 'Password must be at least 6 characters long' }, 400);
    }

    // Check if ANY admin already exists in the system (check both adm table and users table)
    try {
      const admCountRes = await env.mysql
        .prepare('SELECT COUNT(*) as count FROM adm')
        .first<{ count: number }>();
      const userAdminCountRes = await env.mysql
        .prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1')
        .first<{ count: number }>();

      const adminCount = (admCountRes?.count || 0) + (userAdminCountRes?.count || 0);
      if (adminCount > 0) {
        return jsonRes({ error: 'Administrator account has already been initialized. Bootstrap is locked.' }, 403);
      }
    } catch (err: any) {
      console.log('[Bootstrap check notice]', err?.message || err);
    }

    const cleanEmail = email.trim().toLowerCase();
    const hashed = await hashPassword(password);
    const now = new Date().toISOString();

    // Check if user already exists in users table
    let userId: string = 'usr_' + crypto.randomUUID();
    try {
      const existing = await env.mysql
        .prepare('SELECT id FROM users WHERE email = ?')
        .bind(cleanEmail)
        .first<{ id: string }>();

      if (existing) {
        userId = existing.id;
        await env.mysql
          .prepare('UPDATE users SET username = ?, password_hash = ?, is_admin = 1, updated_at = ? WHERE email = ?')
          .bind(username, hashed, now, cleanEmail)
          .run();
      } else {
        await env.mysql
          .prepare(
            'INSERT INTO users (id, username, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)'
          )
          .bind(userId, username, cleanEmail, hashed, now, now)
          .run();
      }

      await env.mysql
        .prepare('INSERT OR REPLACE INTO adm (id, username, email, created_at) VALUES (?, ?, ?, ?)')
        .bind(userId, username, cleanEmail, now)
        .run();
    } catch (err: any) {
      console.log('[Bootstrap create notice]', err?.message || err);
    }

    const token = await createToken({ id: userId, email: cleanEmail, is_admin: 1 }, env);

    return jsonRes(
      {
        success: true,
        message: 'Master administrator account created successfully.',
        token,
        user: {
          id: userId,
          username,
          email: cleanEmail,
          is_admin: 1,
          created_at: now,
        },
      },
      201
    );
  }

  // POST /auth/update-profile or /api/auth/update-profile
  if (pathname === '/auth/update-profile' || pathname === '/api/auth/update-profile') {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }
    const userPayload = await authenticateRequest(request, env);
    if (!userPayload) {
      return jsonRes({ error: 'Unauthorized' }, 401);
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: 'Invalid JSON body' }, 400);
    }

    const { username, avatarUrl } = body;
    const now = new Date().toISOString();

    try {
      // Fetch existing user to preserve google_avatar_url if just removing custom photo
      const existing = await env.mysql
        .prepare('SELECT avatar_key, avatar_url, google_avatar_url FROM users WHERE id = ? OR email = ?')
        .bind(userPayload.id, userPayload.email)
        .first<any>();

      let finalAvatarUrl: string | null = avatarUrl !== undefined ? (avatarUrl || null) : null;
      let finalAvatarKey: string | null = null;
      let finalGoogleAvatarUrl: string | null = existing?.google_avatar_url || null;
      let shouldUpdateAvatar = avatarUrl !== undefined;

      if (shouldUpdateAvatar && avatarUrl) {
        // If the URL is a Google profile photo (contains googleusercontent or google)
        if (avatarUrl.includes('googleusercontent.com') || avatarUrl.includes('google')) {
          const conflict = await env.mysql
            .prepare('SELECT id FROM users WHERE (google_avatar_url = ? OR avatar_url = ?) AND id != ?')
            .bind(avatarUrl, avatarUrl, userPayload.id)
            .first<any>();
          if (conflict) {
            return jsonRes({ error: 'This profile photo belongs to another user account and cannot be used.' }, 403);
          }

          finalGoogleAvatarUrl = avatarUrl;
          finalAvatarUrl = null;
          finalAvatarKey = null;
        } else if (avatarUrl.startsWith('/api/avatars/') || avatarUrl.startsWith('avatars/')) {
          finalAvatarKey = avatarUrl.replace(/^\/api\//, '');
          finalAvatarUrl = null;
        } else {
          // Check if custom URL is associated with another user account
          const conflict = await env.mysql
            .prepare('SELECT id FROM users WHERE (avatar_url = ? OR google_avatar_url = ?) AND id != ?')
            .bind(avatarUrl, avatarUrl, userPayload.id)
            .first<any>();
          if (conflict) {
            return jsonRes({ error: 'This profile photo belongs to another user account and cannot be used.' }, 403);
          }

          finalAvatarKey = null;
          finalAvatarUrl = avatarUrl;
        }
      } else if (shouldUpdateAvatar && avatarUrl === null) {
        // Specifically removing custom avatar, keep existing google_avatar_url if any
        finalAvatarUrl = null;
        finalAvatarKey = null;
      }

      if (username !== undefined && shouldUpdateAvatar) {
        await env.mysql
          .prepare('UPDATE users SET username = ?, avatar_url = ?, avatar_key = ?, google_avatar_url = ?, updated_at = ? WHERE id = ? OR email = ?')
          .bind(username.trim(), finalAvatarUrl, finalAvatarKey, finalGoogleAvatarUrl, now, userPayload.id, userPayload.email)
          .run();
      } else if (username !== undefined) {
        await env.mysql
          .prepare('UPDATE users SET username = ?, updated_at = ? WHERE id = ? OR email = ?')
          .bind(username.trim(), now, userPayload.id, userPayload.email)
          .run();
      } else if (shouldUpdateAvatar) {
        await env.mysql
          .prepare('UPDATE users SET avatar_url = ?, avatar_key = ?, google_avatar_url = ?, updated_at = ? WHERE id = ? OR email = ?')
          .bind(finalAvatarUrl, finalAvatarKey, finalGoogleAvatarUrl, now, userPayload.id, userPayload.email)
          .run();
      }

      const returnedAvatarUrl = shouldUpdateAvatar 
        ? resolveAvatarUrl({ avatar_key: finalAvatarKey, avatar_url: finalAvatarUrl, google_avatar_url: finalGoogleAvatarUrl })
        : undefined;

      return jsonRes({
        success: true,
        message: 'Profile updated successfully.',
        username: username !== undefined ? username.trim() : undefined,
        avatarUrl: returnedAvatarUrl,
        googleAvatarUrl: finalGoogleAvatarUrl,
      });
    } catch (err: any) {
      console.log('[Update profile error]', err);
      return jsonRes({ error: err?.message || 'Failed to update profile in database' }, 500);
    }
  }

  // POST /api/admin/verify-google or /auth/admin/verify-google
  if (pathname === '/api/admin/verify-google' || pathname === '/auth/admin/verify-google') {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: 'Invalid JSON body' }, 400);
    }
    const { email } = body;
    if (!email || typeof email !== 'string') {
      return jsonRes({ error: 'Email is required' }, 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    const adminCheck = await env.mysql
      .prepare('SELECT * FROM adm WHERE email = ?')
      .bind(cleanEmail)
      .first<any>();

    if (!adminCheck) {
      return jsonRes({ success: false, error: 'Email not authorized as administrator. Only registered administrators can access.' }, 403);
    }
    return jsonRes({ success: true, admin: adminCheck });
  }

  // POST /auth/admin/create, /api/auth/admin/create, /api/admin/users/create
  if (
    pathname === '/auth/admin/create' ||
    pathname === '/api/auth/admin/create' ||
    pathname === '/api/admin/users/create'
  ) {
    const adminAuth = await requireAdmin(request, env, corsHeaders);
    if (adminAuth.errorResponse) return adminAuth.errorResponse;

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

    let userId = existing?.id || ('usr_' + crypto.randomUUID());
    if (existing) {
      await env.mysql
        .prepare('UPDATE users SET username = ?, password_hash = ?, is_admin = 1, updated_at = ? WHERE email = ?')
        .bind(cleanUsername, hashed, now, cleanEmail)
        .run();
    } else {
      await env.mysql
        .prepare(
          'INSERT INTO users (id, username, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)'
        )
        .bind(userId, cleanUsername, cleanEmail, hashed, now, now)
        .run();
    }

    await env.mysql
      .prepare('INSERT OR REPLACE INTO adm (id, username, email, created_at) VALUES (?, ?, ?, ?)')
      .bind(userId, cleanUsername, cleanEmail, now)
      .run();

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

  // GET /api/admin/status, /auth/admin/status
  if (pathname === '/api/admin/status' || pathname === '/auth/admin/status') {
    try {
      const res = await env.mysql
        .prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1')
        .first<{ count: number }>();
      const count = res?.count || 0;
      return jsonRes({ success: true, hasAdmin: count > 0, adminCount: count, connected: true });
    } catch (err: any) {
      console.log('[Admin status query note]', err?.message || err);
      return jsonRes({ success: false, hasAdmin: true, adminCount: 0, connected: false, error: 'Database connection offline' });
    }
  }

  // GET /api/admin/email-config-check, /auth/admin/email-config-check - Secret binding diagnostic endpoint
  if (
    pathname === '/api/admin/email-config-check' ||
    pathname === '/auth/admin/email-config-check'
  ) {
    const adminAuth = await requireAdmin(request, env, corsHeaders);
    if (adminAuth.errorResponse) return adminAuth.errorResponse;

    const apiKey = (env as any)?.RESEND_API_KEY || (typeof process !== 'undefined' && process.env?.RESEND_API_KEY) || '';
    const fromEmail = (env as any)?.RESEND_FROM_EMAIL || (typeof process !== 'undefined' && process.env?.RESEND_FROM_EMAIL) || null;

    return jsonRes({
      hasApiKey: Boolean(apiKey),
      apiKeyPrefix: apiKey ? apiKey.slice(0, 5) : null,
      fromAddress: fromEmail || '(using default fallback)',
    });
  }

  // GET /api/admin/admins, /auth/admin/list
  if (
    pathname === '/api/admin/admins' ||
    pathname === '/auth/admin/list' ||
    pathname === '/api/admin/users'
  ) {
    const adminAuth = await requireAdmin(request, env, corsHeaders);
    if (adminAuth.errorResponse) return adminAuth.errorResponse;

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

      return jsonRes({ success: true, admins: adminList });
    } catch (err: any) {
      return jsonRes({ success: false, error: err?.message || 'Failed to fetch administrators' }, 500);
    }
  }

  // GET /api/admin/all-users - Retrieve all registered users
  if (pathname === '/api/admin/all-users' || pathname === '/auth/admin/all-users') {
    const adminAuth = await requireAdmin(request, env, corsHeaders);
    if (adminAuth.errorResponse) return adminAuth.errorResponse;

    try {
      const { results } = await env.mysql
        .prepare('SELECT id, username, email, is_admin, email_verified, created_at, updated_at FROM users ORDER BY created_at DESC')
        .all();

      const userList = (results || []).map((u: any) => ({
        id: u.id,
        username: u.username || u.email?.split('@')[0] || 'User',
        email: u.email,
        role: u.is_admin === 1 ? 'admin' : 'user',
        is_admin: u.is_admin || 0,
        email_verified: Boolean(u.email_verified),
        created_at: u.created_at || new Date().toISOString(),
      }));

      return jsonRes({ success: true, users: userList });
    } catch (err: any) {
      return jsonRes({ success: false, error: err?.message || 'Failed to list users' }, 500);
    }
  }

  // POST /api/admin/make-admin - Promote user to administrator
  if (pathname === '/api/admin/make-admin' || pathname === '/auth/admin/make-admin') {
    const adminAuth = await requireAdmin(request, env, corsHeaders);
    if (adminAuth.errorResponse) return adminAuth.errorResponse;

    if (request.method !== 'POST') return jsonRes({ error: 'Method not allowed' }, 405);
    let body: any = {};
    try { body = await request.json(); } catch {}
    const { userId, email } = body;
    if (!userId && !email) return jsonRes({ error: 'userId or email is required' }, 400);

    try {
      const now = new Date().toISOString();
      if (userId) {
        await env.mysql.prepare('UPDATE users SET is_admin = 1, updated_at = ? WHERE id = ?').bind(now, userId).run();
      } else if (email) {
        await env.mysql.prepare('UPDATE users SET is_admin = 1, updated_at = ? WHERE email = ?').bind(now, email.toLowerCase().trim()).run();
      }
      return jsonRes({ success: true, message: 'User granted administrator privileges successfully.' });
    } catch (err: any) {
      return jsonRes({ error: err?.message || 'Failed to update user role' }, 500);
    }
  }

  // POST /api/admin/revoke-admin - Demote administrator to normal user
  if (pathname === '/api/admin/revoke-admin' || pathname === '/auth/admin/revoke-admin') {
    const adminAuth = await requireAdmin(request, env, corsHeaders);
    if (adminAuth.errorResponse) return adminAuth.errorResponse;

    if (request.method !== 'POST') return jsonRes({ error: 'Method not allowed' }, 405);
    let body: any = {};
    try { body = await request.json(); } catch {}
    const { userId, email } = body;
    if (!userId && !email) return jsonRes({ error: 'userId or email is required' }, 400);

    // Prevent caller from revoking their own administrator privileges
    if ((userId && userId === adminAuth.user.id) || (email && email.toLowerCase().trim() === adminAuth.user.email.toLowerCase())) {
      return jsonRes({ error: 'Cannot revoke your own administrator privileges.' }, 400);
    }

    try {
      const now = new Date().toISOString();
      if (userId) {
        await env.mysql.prepare('UPDATE users SET is_admin = 0, updated_at = ? WHERE id = ?').bind(now, userId).run();
      } else if (email) {
        await env.mysql.prepare('UPDATE users SET is_admin = 0, updated_at = ? WHERE email = ?').bind(now, email.toLowerCase().trim()).run();
      }
      return jsonRes({ success: true, message: 'Administrator privileges revoked successfully.' });
    } catch (err: any) {
      return jsonRes({ error: err?.message || 'Failed to revoke administrator role' }, 500);
    }
  }

  // POST /api/admin/delete-user - Delete a user from database
  if (pathname === '/api/admin/delete-user' || pathname === '/auth/admin/delete-user') {
    const adminAuth = await requireAdmin(request, env, corsHeaders);
    if (adminAuth.errorResponse) return adminAuth.errorResponse;

    if (request.method !== 'POST') return jsonRes({ error: 'Method not allowed' }, 405);
    let body: any = {};
    try { body = await request.json(); } catch {}
    const { userId, email } = body;
    if (!userId && !email) return jsonRes({ error: 'userId or email is required' }, 400);

    // Prevent caller from deleting their own active administrator account
    if ((userId && userId === adminAuth.user.id) || (email && email.toLowerCase().trim() === adminAuth.user.email.toLowerCase())) {
      return jsonRes({ error: 'Cannot delete your own active administrator account.' }, 400);
    }

    try {
      if (userId) {
        await env.mysql.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
        await env.mysql.prepare('DELETE FROM adm WHERE id = ?').bind(userId).run();
      } else if (email) {
        const clean = email.toLowerCase().trim();
        await env.mysql.prepare('DELETE FROM users WHERE email = ?').bind(clean).run();
        await env.mysql.prepare('DELETE FROM adm WHERE email = ?').bind(clean).run();
      }
      return jsonRes({ success: true, message: 'User account removed successfully.' });
    } catch (err: any) {
      return jsonRes({ error: err?.message || 'Failed to delete user' }, 500);
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
    let picture = '';

    if (idToken) {
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) {
            b64 += '=';
          }
          const payloadStr = atob(b64);
          const payload = JSON.parse(payloadStr);
          if (!email) email = payload.email;
          name = payload.name || (email ? email.split('@')[0] : 'Google User');
          picture = payload.picture || '';
          console.log(`[DEBUG_AVATAR] Parsed Google Identity JWT Claim: pictureURL is "${picture}"`);
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
      .prepare('SELECT id, username, email, password_hash, is_admin, created_at, avatar_url, avatar_key, google_avatar_url FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string; username?: string; email: string; password_hash?: string; is_admin?: number; created_at: string; avatar_url?: string; avatar_key?: string; google_avatar_url?: string }>();

    let userId = existingUser?.id;
    const isAdmin = existingUser?.is_admin || 0;
    const hasPassword = Boolean(
      existingUser &&
      existingUser.password_hash &&
      !existingUser.password_hash.startsWith('oauth:') &&
      existingUser.password_hash !== 'session:header' &&
      existingUser.password_hash.length >= 20
    );

    if (!existingUser) {
      userId = 'usr_' + crypto.randomUUID();
      const defaultGooglePic = picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || cleanEmail)}&background=1a73e8&color=fff`;
      
      console.log(`[DEBUG_AVATAR] Brand new user signup detection. Saving google_avatar_url directly: "${defaultGooglePic}"`);

      try {
        console.log(`[DEBUG_AVATAR] Executing SQL INSERT with google_avatar_url: "${defaultGooglePic}" for user ID: "${userId}"`);
        await env.mysql
          .prepare(
            'INSERT INTO users (id, username, email, password_hash, is_admin, created_at, updated_at, avatar_url, avatar_key, google_avatar_url) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)'
          )
          .bind(userId, name, cleanEmail, 'oauth:google', now, now, null, null, defaultGooglePic)
          .run();

        // SELECT verify
        const verificationSelect = await env.mysql
          .prepare('SELECT id, email, avatar_key, avatar_url, google_avatar_url FROM users WHERE id = ?')
          .bind(userId)
          .first<{ id: string; email: string; avatar_key?: string; avatar_url?: string; google_avatar_url?: string }>();
        console.log(`[DEBUG_AVATAR] INSERT row verification from D1:`, JSON.stringify(verificationSelect));
      } catch (err: any) {
        console.log('[Google User Insert Notice]', err?.message || err);
      }

      existingUser = { 
        id: userId!, 
        username: name, 
        email: cleanEmail, 
        is_admin: 0, 
        created_at: now, 
        avatar_url: undefined,
        avatar_key: undefined,
        google_avatar_url: defaultGooglePic
      } as any;
    } else {
      try {
        const resolvedPic = picture || existingUser.google_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(existingUser.username || name || cleanEmail)}&background=1a73e8&color=fff`;
        console.log(`[DEBUG_AVATAR] Updating/ensuring Google picture for older user ID: "${existingUser.id}" to: "${resolvedPic}"`);
        await env.mysql
          .prepare('UPDATE users SET updated_at = ?, google_avatar_url = ? WHERE id = ?')
          .bind(now, resolvedPic, userId)
          .run();
        existingUser.google_avatar_url = resolvedPic;
      } catch (err: any) {
        console.log('[Google User Update Notice]', err?.message || err);
      }
    }

    const createdAt = existingUser ? existingUser.created_at : now;
    const finalUserId = userId || 'usr_' + crypto.randomUUID();
    const finalUsername = existingUser?.username || name || cleanEmail.split('@')[0];
    
    // Resolve safe avatar_url using our priority-based resolveAvatarUrl helper
    const finalAvatarUrl = resolveAvatarUrl(existingUser || { avatar_url: null, avatar_key: null, google_avatar_url: null });

    const token = await createToken({ id: finalUserId, email: cleanEmail, is_admin: isAdmin }, env);

    return jsonRes({
      success: true,
      token,
      requiresPasswordSetup: !hasPassword,
      user: {
        id: finalUserId,
        email: cleanEmail,
        username: finalUsername,
        name: finalUsername,
        is_admin: isAdmin,
        created_at: createdAt,
        avatar_url: finalAvatarUrl,
        google_avatar_url: existingUser?.google_avatar_url || picture || null,
      },
    });
  }

  // POST /auth/set-password or /api/auth/set-password
  if (pathname === '/auth/set-password' || pathname === '/api/auth/set-password') {
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
    const hashed = await hashPassword(password);
    const now = new Date().toISOString();

    let existingUser = await env.mysql
      .prepare('SELECT id, username, email, is_admin, created_at, avatar_url, avatar_key, google_avatar_url FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string; username?: string; email: string; is_admin?: number; created_at: string; avatar_url?: string; avatar_key?: string; google_avatar_url?: string }>();

    let userId = existingUser?.id;
    let isAdmin = existingUser?.is_admin || 0;
    const username = body.username || existingUser?.username || cleanEmail.split('@')[0];
    const finalAvatarUrl = resolveAvatarUrl(existingUser || { avatar_url: null, avatar_key: null, google_avatar_url: null });

    if (!existingUser) {
      userId = 'usr_' + crypto.randomUUID();
      try {
        await env.mysql
          .prepare(
            'INSERT INTO users (id, username, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)'
          )
          .bind(userId, username, cleanEmail, hashed, now, now)
          .run();
      } catch (err: any) {
        console.log('[Set-Password Insert Notice]', err?.message || err);
      }
    } else {
      try {
        await env.mysql
          .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?')
          .bind(hashed, now, cleanEmail)
          .run();
      } catch (err: any) {
        console.log('[Set-Password Update Notice]', err?.message || err);
      }
    }

    const token = await createToken({ id: userId || 'usr_' + cleanEmail, email: cleanEmail, is_admin: isAdmin }, env);

    return jsonRes({
      success: true,
      message: 'Account password saved successfully.',
      token,
      user: {
        id: userId || 'usr_' + cleanEmail,
        username,
        email: cleanEmail,
        name: username,
        is_admin: isAdmin,
        avatar_url: finalAvatarUrl,
      },
    });
  }

  // POST /auth/test-resend or /api/auth/test-resend (Verification test endpoint with Resend)
  if (pathname === '/auth/test-resend' || pathname === '/api/auth/test-resend') {
    let body: any = {};
    try { body = await request.json(); } catch {}
    const toEmail = (body.to || 'enigmaxhd20@gmail.com').trim();
    const apiKey = (env as any)?.RESEND_API_KEY || (typeof process !== 'undefined' && process.env?.RESEND_API_KEY) || '';
    if (!apiKey) {
      return jsonRes({ success: false, error: 'RESEND_API_KEY is not configured.' }, 500);
    }
    const resendClient = new Resend(apiKey);
    try {
      const emailRes = await resendClient.emails.send({
        from: (env as any)?.RESEND_FROM_EMAIL || (typeof process !== 'undefined' && process.env?.RESEND_FROM_EMAIL) || 'Wiki Team <wkiteam@noreply.flyerserver.uk>',
        to: toEmail,
        subject: body.subject || 'Hello World',
        html: body.html || '<p>Congrats on sending your <strong>first email</strong>!</p>',
      });
      return jsonRes({ success: true, to: toEmail, result: emailRes });
    } catch (err: any) {
      return jsonRes({ success: false, error: err?.message || 'Resend error' }, 500);
    }
  }

function generateVerificationUserId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let str = '';
  for (let i = 0; i < 14; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `${str}${digits}`;
}

function isPasswordStrong(password: string): { strong: boolean; error?: string } {
  if (password.length < 8) {
    return { strong: false, error: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { strong: false, error: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { strong: false, error: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { strong: false, error: 'Password must contain at least one number.' };
  }
  return { strong: true };
}

  // GET /auth/verification-info or /api/auth/verification-info
  if (pathname === '/auth/verification-info' || pathname === '/api/auth/verification-info') {
    const userId = url.searchParams.get('id') || url.searchParams.get('userId') || '';
    if (!userId) {
      return jsonRes({ success: false, error: 'User ID is required' }, 400);
    }
    // Clean up expired verification records
    await cleanupExpiredVerifications(env);
    try {
      const entry = await env.mysql
        .prepare('SELECT email, username, temp_user_id, expires_at FROM email_verifications WHERE temp_user_id = ? OR email = ?')
        .bind(userId, userId)
        .first<{ email: string; username?: string; temp_user_id: string; expires_at: string }>();

      if (entry) {
        const exp = new Date(entry.expires_at).getTime();
        if (exp > Date.now()) {
          return jsonRes({
            success: true,
            email: entry.email,
            username: entry.username || entry.email.split('@')[0],
            userId: entry.temp_user_id || userId,
          });
        }
      }
      return jsonRes({ success: false, error: 'Verification session expired or not found' }, 404);
    } catch (err: any) {
      return jsonRes({ success: false, error: err?.message || 'Database error' }, 500);
    }
  }

  // POST /auth/send-verification or /api/auth/send-verification
  if (pathname === '/auth/send-verification' || pathname === '/api/auth/send-verification') {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }
    let body: any = {};
    try { body = await request.json(); } catch { return jsonRes({ error: 'Invalid JSON' }, 400); }
    const { email, username, password, forRegistration } = body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonRes({ error: 'Valid email address is required' }, 400);
    }

    // Clean up expired verification records automatically
    await cleanupExpiredVerifications(env);

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim();

    // Password strength check
    if (password && typeof password === 'string') {
      const strength = isPasswordStrong(password);
      if (!strength.strong) {
        return jsonRes({ success: false, error: strength.error }, 400);
      }
    }

    // If for registration, prevent duplicate account registration
    if (forRegistration) {
      const existing = await env.mysql
        .prepare('SELECT id FROM users WHERE email = ?')
        .bind(cleanEmail)
        .first<{ id: string }>();
      if (existing) {
        return jsonRes({ error: 'An account with this email is already registered. Please sign in instead.' }, 409);
      }
    }

    let passwordHash = '';
    if (password && typeof password === 'string' && password.length >= 6) {
      passwordHash = await hashPassword(password);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const tempUserId = generateVerificationUserId();

    // Trigger email and await confirmation
    const emailResult = await sendEmailVerification(cleanEmail, cleanUsername, env, code);
    if (!emailResult.success || !emailResult.emailSent) {
      console.error('Email sending failed:', emailResult.error);
      return jsonRes(
        {
          success: false,
          error: 'Failed to send verification email. Please try again.',
          debug: emailResult.error || 'Unknown email service error',
        },
        500
      );
    }

    // Save pending credentials to D1 database email_verifications table with 5-minute expiration
    try {
      await env.mysql
        .prepare(
          'INSERT OR REPLACE INTO email_verifications (email, code, username, password_hash, created_at, expires_at, temp_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          cleanEmail,
          code,
          cleanUsername,
          passwordHash,
          new Date().toISOString(),
          new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          tempUserId
        )
        .run();
    } catch (err) {
      console.log('[D1 email_verifications write error]', err);
    }

    return jsonRes({
      success: true,
      emailSent: true,
      message: 'Verification code generated and sent.',
      email: cleanEmail,
      userId: tempUserId,
    });
  }

  // POST /auth/cancel-verification or /api/auth/cancel-verification
  if (pathname === '/auth/cancel-verification' || pathname === '/api/auth/cancel-verification') {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }
    let email = '';
    try {
      const rawText = await request.text();
      if (rawText) {
        const parsed = JSON.parse(rawText);
        email = parsed.email || '';
      }
    } catch {
      // Ignored if empty body
    }

    // Clean up expired verification records
    await cleanupExpiredVerifications(env);

    if (email) {
      try {
        await env.mysql
          .prepare('DELETE FROM email_verifications WHERE email = ?')
          .bind(email.trim().toLowerCase())
          .run();
      } catch (err) {
        console.log('[Cancel verification delete error]', err);
      }
    }
    return jsonRes({ success: true });
  }

  // POST /auth/verify-code or /api/auth/verify-code
  if (pathname === '/auth/verify-code' || pathname === '/api/auth/verify-code') {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }
    let body: any = {};
    try { body = await request.json(); } catch { return jsonRes({ error: 'Invalid JSON' }, 400); }
    const { email, code, password, username, avatarUrl, userId: requestUserId } = body;
    if ((!email && !requestUserId) || !code) {
      return jsonRes({ error: 'Email or User ID and verification code are required' }, 400);
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = String(code).trim();

    // Clean up expired email_verifications records automatically
    await cleanupExpiredVerifications(env);

    let isValid = false;
    let savedUsername = (username || cleanEmail.split('@')[0]).trim();
    let savedPasswordHash = '';
    let resolvedEmail = cleanEmail;
    let resolvedTempUserId = requestUserId || '';

    // 1. Check D1 database email_verifications table
    try {
      const dbEntry = await env.mysql
        .prepare('SELECT email, code, username, password_hash, expires_at, temp_user_id FROM email_verifications WHERE email = ? OR temp_user_id = ?')
        .bind(cleanEmail, requestUserId || cleanEmail)
        .first<{ email: string; code: string; username?: string; password_hash?: string; expires_at: string; temp_user_id?: string }>();

      if (dbEntry && dbEntry.code === cleanCode) {
        const exp = new Date(dbEntry.expires_at).getTime();
        if (exp > Date.now()) {
          isValid = true;
          resolvedEmail = dbEntry.email || cleanEmail;
          resolvedTempUserId = dbEntry.temp_user_id || requestUserId || '';
          if (dbEntry.username) savedUsername = dbEntry.username;
          if (dbEntry.password_hash) savedPasswordHash = dbEntry.password_hash;
        }
      }
    } catch (err) {
      console.log('[D1 check error]', err);
    }

    if (!isValid || !resolvedEmail) {
      return jsonRes({ error: 'Invalid or expired verification code. Please check your email or request a new code.' }, 400);
    }

    // If a new password was provided and not yet hashed
    if (password && typeof password === 'string' && password.length >= 6 && !savedPasswordHash) {
      savedPasswordHash = await hashPassword(password);
    }

    const now = new Date().toISOString();
    let userId = resolvedTempUserId || 'usr_' + crypto.randomUUID();
    let isAdmin = 0;

    // Check if user already existed
    const existing = await env.mysql
      .prepare('SELECT id, username, is_admin, avatar_url, avatar_key, google_avatar_url FROM users WHERE email = ?')
      .bind(resolvedEmail)
      .first<{ id: string; username?: string; is_admin?: number; avatar_url?: string; avatar_key?: string; google_avatar_url?: string }>();

    if (existing) {
      userId = existing.id;
      isAdmin = existing.is_admin || 0;
      if (avatarUrl) {
        await env.mysql
          .prepare('UPDATE users SET email_verified = 1, avatar_url = ?, updated_at = ? WHERE email = ?')
          .bind(avatarUrl, now, cleanEmail)
          .run();
      } else {
        await env.mysql
          .prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE email = ?')
          .bind(now, cleanEmail)
          .run();
      }
    } else {
      // Move from email_verifications table directly into users table
      try {
        await env.mysql
          .prepare(
            'INSERT OR REPLACE INTO users (id, username, email, password_hash, is_admin, email_verified, created_at, updated_at, avatar_url) VALUES (?, ?, ?, ?, 0, 1, ?, ?, ?)'
          )
          .bind(userId, savedUsername, cleanEmail, savedPasswordHash || 'oauth:verified', now, now, avatarUrl || null)
          .run();
      } catch (err: any) {
        console.log('[D1 Move to Users table notice]', err?.message || err);
      }
    }

    // Invalidate the record in email_verifications table after a 3-second delay
    setTimeout(async () => {
      try {
        await env.mysql
          .prepare('DELETE FROM email_verifications WHERE email = ?')
          .bind(cleanEmail)
          .run();
      } catch (err) {
        console.log('[D1 delayed delete verification notice]', err);
      }
    }, 3000);

    const token = await createToken({ id: userId, email: cleanEmail, is_admin: isAdmin }, env);
    const finalUserRecord = await env.mysql
      .prepare('SELECT id, username, email, is_admin, avatar_url, avatar_key, google_avatar_url FROM users WHERE id = ?')
      .bind(userId)
      .first<any>();

    const finalResolvedAvatar = finalUserRecord ? resolveAvatarUrl(finalUserRecord) : (avatarUrl || null);
    const finalUsername = finalUserRecord?.username || savedUsername;

    return jsonRes({
      success: true,
      verified: true,
      message: 'Email address verified and account created successfully!',
      token,
      user: {
        id: userId,
        username: finalUsername,
        name: finalUsername,
        email: cleanEmail,
        is_admin: isAdmin,
        email_verified: 1,
        created_at: now,
        avatar_url: finalResolvedAvatar,
        google_avatar_url: finalUserRecord?.google_avatar_url || null,
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

    const { email, password, username, verificationCode, avatarUrl } = body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonRes({ error: 'Valid email address is required' }, 400);
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return jsonRes({ error: 'Password must be at least 6 characters long' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim();

    // Check if user exists in database to prevent duplicates
    const existing = await env.mysql
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string }>();

    if (existing) {
      return jsonRes({ error: 'An account with this email is already registered. Please sign in instead.' }, 409);
    }

    // If verificationCode is provided, verify it
    let isEmailVerified = 0;
    if (verificationCode) {
      const cleanCode = String(verificationCode).trim();
      try {
        const dbEntry = await env.mysql
          .prepare('SELECT code, expires_at FROM email_verifications WHERE email = ?')
          .bind(cleanEmail)
          .first<{ code: string; expires_at: string }>();
        if (dbEntry && dbEntry.code === cleanCode && new Date(dbEntry.expires_at).getTime() > Date.now()) {
          isEmailVerified = 1;
          setTimeout(async () => {
            try {
              await env.mysql.prepare('DELETE FROM email_verifications WHERE email = ?').bind(cleanEmail).run();
            } catch {}
          }, 3000);
        }
      } catch {}
    }

    const userId = 'usr_' + crypto.randomUUID();
    const hashed = await hashPassword(password);
    const now = new Date().toISOString();

    try {
      await env.mysql
        .prepare(
          'INSERT INTO users (id, username, email, password_hash, is_admin, email_verified, created_at, updated_at, avatar_url) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)'
        )
        .bind(userId, cleanUsername, cleanEmail, hashed, isEmailVerified, now, now, avatarUrl || null)
        .run();
    } catch (err: any) {
      console.log('[Register DB Notice]', err?.message || err);
    }

    const token = await createToken({ id: userId, email: cleanEmail, is_admin: 0 }, env);

    // Explicitly return safe fields only (id, username, email, created_at) - never password_hash
    return jsonRes(
      {
        success: true,
        token,
        user: {
          id: userId,
          username: cleanUsername,
          email: cleanEmail,
          is_admin: 0,
          email_verified: isEmailVerified,
          created_at: now,
          avatar_url: avatarUrl || null,
        },
      },
      201
    );
  }

  // POST /auth/check-email or /api/auth/check-email
  if (pathname === '/auth/check-email' || pathname === '/api/auth/check-email') {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }
    let body: any = {};
    try { body = await request.json(); } catch { return jsonRes({ error: 'Invalid JSON body' }, 400); }
    const { email } = body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonRes({ error: 'Valid email address is required' }, 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    try {
      const existing = await env.mysql
        .prepare('SELECT id, username, email, avatar_url, avatar_key, google_avatar_url FROM users WHERE email = ?')
        .bind(cleanEmail)
        .first<any>();

      if (existing) {
        return jsonRes({
          exists: true,
          email: cleanEmail,
          username: existing.username,
          avatarUrl: resolveAvatarUrl(existing),
        });
      }
      return jsonRes({
        exists: false,
        email: cleanEmail,
      });
    } catch (err: any) {
      return jsonRes({ exists: false, email: cleanEmail });
    }
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
      .prepare('SELECT id, username, email, password_hash, is_admin, avatar_url, avatar_key, google_avatar_url FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string; username?: string; email: string; password_hash: string; is_admin?: number; avatar_url?: string; avatar_key?: string; google_avatar_url?: string }>();

    if (!user) {
      return jsonRes({ error: 'Invalid email or password' }, 401);
    }

    const isMatch = await verifyPassword(String(password), user.password_hash);
    if (!isMatch) {
      return jsonRes({ error: 'Invalid email or password' }, 401);
    }

    const isAdmin = user.is_admin || 0;
    const token = await createToken({ id: user.id, email: user.email, is_admin: isAdmin }, env);
    const resolvedAvatar = resolveAvatarUrl(user);
    const finalUsername = user.username || cleanEmail.split('@')[0];

    // Explicitly return safe fields only - NO password_hash in response
    return jsonRes({
      success: true,
      token,
      user: {
        id: user.id,
        username: finalUsername,
        name: finalUsername,
        email: user.email,
        is_admin: isAdmin,
        avatar_url: resolvedAvatar,
        google_avatar_url: user.google_avatar_url || null,
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

    // Lookup registered user in D1 database by email, username, or id
    let user: any = null;
    try {
      user = await env.mysql
        .prepare('SELECT id, username, email, password_hash, is_admin, avatar_url, avatar_key, google_avatar_url FROM users WHERE email = ? OR LOWER(username) = ? OR id = ?')
        .bind(identifier, identifier, identifier)
        .first<{ id: string; username?: string; email: string; password_hash: string; is_admin: number; avatar_url?: string; avatar_key?: string; google_avatar_url?: string }>();
    } catch {
      // fallback without username column if not present yet
      user = await env.mysql
        .prepare('SELECT id, email, password_hash, is_admin, avatar_url, avatar_key, google_avatar_url FROM users WHERE email = ? OR id = ?')
        .bind(identifier, identifier)
        .first<{ id: string; email: string; password_hash: string; is_admin: number; avatar_url?: string; avatar_key?: string; google_avatar_url?: string }>();
    }

    if (!user) {
      return jsonRes({ success: false, message: 'Invalid administrator credentials.' }, 401);
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return jsonRes({ success: false, message: 'Invalid administrator credentials.' }, 401);
    }

    if (user.is_admin !== 1) {
      return jsonRes({ success: false, message: 'Account does not have administrator privileges.' }, 403);
    }

    const token = await createToken({ id: user.id, email: user.email, is_admin: 1 }, env);

    return jsonRes({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username || user.email?.split('@')[0] || 'Admin',
        email: user.email,
        is_admin: 1,
        avatar_url: resolveAvatarUrl(user),
      },
      message: 'Administrator authentication successful.',
    });
  }

  // POST /auth/cancel-verification or /api/auth/cancel-verification
  if (pathname === '/auth/cancel-verification' || pathname === '/api/auth/cancel-verification') {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }
    let body: any = {};
    try {
      body = await request.json();
    } catch {}
    const email = body.email;
    if (email && typeof email === 'string') {
      const cleanEmail = email.trim().toLowerCase();
      try {
        await env.mysql
          .prepare('DELETE FROM email_verifications WHERE email = ?')
          .bind(cleanEmail)
          .run();
        await env.mysql
          .prepare('DELETE FROM users WHERE email = ? AND email_verified = 0')
          .bind(cleanEmail)
          .run();
      } catch (err) {
        console.log('[Cancel Verification DB notice]', err);
      }
    }
    return jsonRes({ success: true, message: 'Verification cancelled and pending account removed.' });
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
        `SELECT f.created_at as favorited_at, p.id, p.title, p.slug, p.category, p.content, p.image_url, COALESCE(p.views, p.view_count, 0) as views, p.created_at, p.updated_at
         FROM user_favorites f
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
    const now = new Date().toISOString();

    try {
      await env.mysql
        .prepare(
          'INSERT INTO user_favorites (user_id, page_id, created_at) VALUES (?, ?, ?)'
        )
        .bind(currentUser.id, actualPageId, now)
        .run();
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes('UNIQUE') ||
          err.message.includes('PRIMARY KEY') ||
          err.message.includes('constraint failed'))
      ) {
        return jsonRes({ success: true, message: 'Already favorited', page_id: actualPageId });
      }
      throw err;
    }

    return jsonRes({ success: true, user_id: currentUser.id, page_id: actualPageId, slug: pageExists.slug }, 201);
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
        'DELETE FROM user_favorites WHERE (user_id = ? OR user_id = ?) AND (page_id = ? OR page_id IN (SELECT id FROM pages WHERE slug = ? OR id = ?))'
      )
      .bind(currentUser.id, currentUser.email, targetPageId, targetPageId, targetPageId)
      .run();

    return jsonRes({ success: true, message: 'Removed from favorites' });
  }

  return jsonRes({ error: 'Not found' }, 404);
}
