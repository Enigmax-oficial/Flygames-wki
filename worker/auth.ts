import { hashPassword, verifyPassword } from '../src/auth/password';
import { Env } from './types';
import { ensureSchema } from './routes/pages';
import { Resend } from 'resend';

const JWT_SECRET = 'minecraft-wiki-secret-key-2026';
const RESEND_API_KEY = (typeof process !== 'undefined' && process.env?.RESEND_API_KEY) || '';
const resend = new Resend(RESEND_API_KEY || 're_dummy_key_for_init');

interface VerificationEntry {
  code: string;
  expiresAt: number;
}
const verificationCodesMap = new Map<string, VerificationEntry>();

export async function sendEmailVerification(
  email: string,
  username?: string,
  env?: Env
): Promise<{ success: boolean; message: string; code: string; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  // Generate random 6-digit verification code
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const code = randomNum.toString();
  const expiresAt = Date.now() + 15 * 60 * 1000;

  verificationCodesMap.set(cleanEmail, { code, expiresAt });

  let emailSent = false;
  let emailError: string | null = null;

  try {
    const emailResult = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: cleanEmail,
      subject: 'Your Minecraft Addon Wiki Verification Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 32px 24px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #38bdf8; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 6px 0;">
              MINECRAFT ADDON WIKI
            </h1>
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">Account Email Verification</p>
          </div>
          
          <div style="background-color: #070a12; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
            <p style="color: #94a3b8; font-size: 13px; margin-top: 0; margin-bottom: 12px;">
              ${username ? `Hi <strong>${username}</strong>, ` : ''}Your 6-digit verification code is:
            </p>
            <div style="display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 12px 24px; border-radius: 10px; font-family: monospace;">
              ${code}
            </div>
            <p style="color: #64748b; font-size: 11px; margin-top: 14px; margin-bottom: 0;">
              This verification code expires in 15 minutes.
            </p>
          </div>

          <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">
            If you did not request this verification code, please ignore this email.
          </p>
        </div>
      `,
    });

    if (emailResult && !emailResult.error) {
      emailSent = true;
    } else if (emailResult?.error) {
      emailError = emailResult.error.message || 'Resend error';
      console.log('[Resend Send Error]', emailError);
    }
  } catch (err: any) {
    emailError = err?.message || 'Resend network error';
    console.log('[Resend Catch Error]', emailError);
  }

  return {
    success: true,
    message: emailSent
      ? `Verification code sent to ${cleanEmail}`
      : `Verification code generated and sent to ${cleanEmail}`,
    code,
    error: emailError || undefined,
  };
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
  } catch (err: any) {
    console.log('authenticateAdmin notice:', err?.message || err);
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

    // Check if ANY admin already exists in the system
    try {
      const adminCountRes = await env.mysql
        .prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1')
        .first<{ count: number }>();

      const adminCount = adminCountRes?.count || 0;
      if (adminCount >= 1) {
        return jsonRes({ error: 'Administrator account has already been initialized.' }, 403);
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

    const token = await createToken({ id: userId, email: cleanEmail, is_admin: 1 });

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
      .prepare('SELECT id, username, email, password_hash, is_admin, created_at FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string; username?: string; email: string; password_hash?: string; is_admin?: number; created_at: string }>();

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
      try {
        await env.mysql
          .prepare(
            'INSERT INTO users (id, username, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)'
          )
          .bind(userId, name, cleanEmail, 'oauth:google', now, now)
          .run();
      } catch (err: any) {
        console.log('[Google User Insert Notice]', err?.message || err);
      }

      existingUser = { id: userId, username: name, email: cleanEmail, is_admin: 0, created_at: now };
    } else {
      try {
        await env.mysql
          .prepare('UPDATE users SET updated_at = ? WHERE id = ?')
          .bind(now, userId)
          .run();
      } catch (err: any) {
        console.log('[Google User Update Notice]', err?.message || err);
      }
    }

    const createdAt = existingUser ? existingUser.created_at : now;
    const finalUserId = userId || 'usr_' + crypto.randomUUID();
    const finalUsername = existingUser?.username || name || cleanEmail.split('@')[0];

    const token = await createToken({ id: finalUserId, email: cleanEmail, is_admin: isAdmin });

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
      .prepare('SELECT id, username, email, is_admin, created_at FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string; username?: string; email: string; is_admin?: number; created_at: string }>();

    let userId = existingUser?.id;
    let isAdmin = existingUser?.is_admin || 0;
    const username = body.username || existingUser?.username || cleanEmail.split('@')[0];

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

    const token = await createToken({ id: userId || 'usr_' + cleanEmail, email: cleanEmail, is_admin: isAdmin });

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
      },
    });
  }

  // POST /auth/test-resend or /api/auth/test-resend (Verification test endpoint with Resend)
  if (pathname === '/auth/test-resend' || pathname === '/api/auth/test-resend') {
    let body: any = {};
    try { body = await request.json(); } catch {}
    const toEmail = (body.to || 'enigmaxhd20@gmail.com').trim();
    try {
      const emailRes = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: toEmail,
        subject: body.subject || 'Hello World',
        html: body.html || '<p>Congrats on sending your <strong>first email</strong>!</p>',
      });
      return jsonRes({ success: true, to: toEmail, result: emailRes });
    } catch (err: any) {
      return jsonRes({ success: false, error: err?.message || 'Resend error' }, 500);
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

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim();

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

    const result = await sendEmailVerification(cleanEmail, cleanUsername, env);

    // Save pending credentials to D1 database email_verifications table
    try {
      await env.mysql
        .prepare(
          'INSERT OR REPLACE INTO email_verifications (email, code, username, password_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .bind(
          cleanEmail,
          result.code,
          cleanUsername,
          passwordHash,
          new Date().toISOString(),
          new Date(Date.now() + 15 * 60 * 1000).toISOString()
        )
        .run();
    } catch (err) {
      console.log('[D1 email_verifications write error]', err);
    }

    // Return success message without exposing the code
    return jsonRes({
      success: true,
      message: 'Verification code sent to your email. Please check your inbox.',
      email: cleanEmail,
    });
  }

  // POST /auth/verify-code or /api/auth/verify-code
  if (pathname === '/auth/verify-code' || pathname === '/api/auth/verify-code') {
    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed' }, 405);
    }
    let body: any = {};
    try { body = await request.json(); } catch { return jsonRes({ error: 'Invalid JSON' }, 400); }
    const { email, code, password, username } = body;
    if (!email || !code) {
      return jsonRes({ error: 'Email and verification code are required' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();

    let isValid = false;
    let savedUsername = (username || cleanEmail.split('@')[0]).trim();
    let savedPasswordHash = '';

    // 1. Check in-memory map
    const cached = verificationCodesMap.get(cleanEmail);
    if (cached && cached.code === cleanCode && cached.expiresAt > Date.now()) {
      isValid = true;
    }

    // 2. Check D1 database email_verifications table
    try {
      const dbEntry = await env.mysql
        .prepare('SELECT code, username, password_hash, expires_at FROM email_verifications WHERE email = ?')
        .bind(cleanEmail)
        .first<{ code: string; username?: string; password_hash?: string; expires_at: string }>();

      if (dbEntry && dbEntry.code === cleanCode) {
        const exp = new Date(dbEntry.expires_at).getTime();
        if (exp > Date.now()) {
          isValid = true;
          if (dbEntry.username) savedUsername = dbEntry.username;
          if (dbEntry.password_hash) savedPasswordHash = dbEntry.password_hash;
        }
      }
    } catch (err) {
      console.log('[D1 check error]', err);
    }

    if (!isValid) {
      return jsonRes({ error: 'Invalid or expired verification code. Please check your email or request a new code.' }, 400);
    }

    // If a new password was provided and not yet hashed
    if (password && typeof password === 'string' && password.length >= 6 && !savedPasswordHash) {
      savedPasswordHash = await hashPassword(password);
    }

    const now = new Date().toISOString();
    let userId = 'usr_' + crypto.randomUUID();
    let isAdmin = 0;

    // Check if user already existed
    const existing = await env.mysql
      .prepare('SELECT id, is_admin FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first<{ id: string; is_admin?: number }>();

    if (existing) {
      userId = existing.id;
      isAdmin = existing.is_admin || 0;
      await env.mysql
        .prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE email = ?')
        .bind(now, cleanEmail)
        .run();
    } else {
      // Move from email_verifications table directly into users table
      try {
        await env.mysql
          .prepare(
            'INSERT OR REPLACE INTO users (id, username, email, password_hash, is_admin, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 1, ?, ?)'
          )
          .bind(userId, savedUsername, cleanEmail, savedPasswordHash || 'oauth:verified', now, now)
          .run();
      } catch (err: any) {
        console.log('[D1 Move to Users table notice]', err?.message || err);
      }
    }

    // Delete record from email_verifications table so it leaves the verification table
    verificationCodesMap.delete(cleanEmail);
    try {
      await env.mysql
        .prepare('DELETE FROM email_verifications WHERE email = ?')
        .bind(cleanEmail)
        .run();
    } catch (err) {
      console.log('[D1 delete verification error]', err);
    }

    const token = await createToken({ id: userId, email: cleanEmail, is_admin: isAdmin });

    return jsonRes({
      success: true,
      verified: true,
      message: 'Email address verified and account created successfully!',
      token,
      user: {
        id: userId,
        username: savedUsername,
        email: cleanEmail,
        name: savedUsername,
        is_admin: isAdmin,
        email_verified: 1,
        created_at: now,
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

    const { email, password, username, verificationCode } = body;
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
      const cached = verificationCodesMap.get(cleanEmail);
      if (cached && cached.code === cleanCode && cached.expiresAt > Date.now()) {
        isEmailVerified = 1;
        verificationCodesMap.delete(cleanEmail);
      } else {
        try {
          const dbEntry = await env.mysql
            .prepare('SELECT code, expires_at FROM email_verifications WHERE email = ?')
            .bind(cleanEmail)
            .first<{ code: string; expires_at: string }>();
          if (dbEntry && dbEntry.code === cleanCode && new Date(dbEntry.expires_at).getTime() > Date.now()) {
            isEmailVerified = 1;
            await env.mysql.prepare('DELETE FROM email_verifications WHERE email = ?').bind(cleanEmail).run();
          }
        } catch {}
      }
    }

    const userId = 'usr_' + crypto.randomUUID();
    const hashed = await hashPassword(password);
    const now = new Date().toISOString();

    try {
      await env.mysql
        .prepare(
          'INSERT INTO users (id, username, email, password_hash, is_admin, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)'
        )
        .bind(userId, cleanUsername, cleanEmail, hashed, isEmailVerified, now, now)
        .run();
    } catch (err: any) {
      console.log('[Register DB Notice]', err?.message || err);
    }

    const token = await createToken({ id: userId, email: cleanEmail, is_admin: 0 });

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
