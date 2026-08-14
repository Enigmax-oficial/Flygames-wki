"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_fs = __toESM(require("fs"), 1);
var import_node_sqlite = require("node:sqlite");

// worker/routes/pages.ts
function jsonResponse(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
function generateSlug(title) {
  return title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var schemaInitialized = false;
async function ensureSchema(env) {
  if (schemaInitialized) return;
  try {
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS pages (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, content TEXT NOT NULL, image_url TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);"
    );
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);"
    );
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS favorites (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, page_id TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE (user_id, page_id));"
    );
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, page_id TEXT NOT NULL, user_name TEXT NOT NULL, user_email TEXT NOT NULL, comment TEXT NOT NULL, created_at TEXT NOT NULL);"
    );
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS adm (id TEXT PRIMARY KEY, username TEXT, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);"
    );
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);"
    );
    const commentsEnabled = await env.mysql.prepare("SELECT value FROM settings WHERE key = ?").bind("comments_enabled").first();
    if (!commentsEnabled) {
      await env.mysql.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").bind("comments_enabled", "false").run();
    }
    try {
      await env.mysql.exec("ALTER TABLE pages ADD COLUMN category TEXT;");
    } catch (e) {
    }
    try {
      await env.mysql.exec("ALTER TABLE pages ADD COLUMN image_url TEXT;");
    } catch (e) {
    }
    try {
      await env.mysql.exec("ALTER TABLE pages ADD COLUMN views INTEGER DEFAULT 0;");
    } catch (e) {
    }
    try {
      await env.mysql.exec("ALTER TABLE pages ADD COLUMN view_count INTEGER DEFAULT 0;");
    } catch (e) {
    }
    try {
      await env.mysql.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;");
    } catch (e) {
    }
    try {
      await env.mysql.exec("ALTER TABLE users ADD COLUMN username TEXT;");
    } catch (e) {
    }
    schemaInitialized = true;
  } catch (err) {
    console.error("Failed to ensure D1 pages table schema:", err);
    throw err;
  }
}
async function handlePagesRequest(request, url, env, corsHeaders) {
  await ensureSchema(env);
  const method = request.method;
  const pathParts = url.pathname.split("/").filter(Boolean);
  try {
    if (method === "POST" && pathParts.length === 3 && pathParts[2] === "view") {
      const slugOrId = pathParts[1];
      const cleanedSlug = generateSlug(slugOrId);
      await env.mysql.prepare(
        "UPDATE pages SET views = COALESCE(views, 0) + 1, view_count = COALESCE(view_count, 0) + 1 WHERE slug = ? OR slug = ? OR id = ?"
      ).bind(slugOrId, cleanedSlug, slugOrId).run();
      return jsonResponse({ success: true }, 200, corsHeaders);
    }
    if (method === "GET" && pathParts.length === 1) {
      const limitParam = url.searchParams.get("limit");
      const offsetParam = url.searchParams.get("offset");
      const limit = Math.min(Math.max(parseInt(limitParam || "20", 10) || 20, 1), 100);
      const offset = Math.max(parseInt(offsetParam || "0", 10) || 0, 0);
      const stmt = env.mysql.prepare(
        "SELECT id, title, slug, content, category, image_url, COALESCE(views, 0) as views, COALESCE(view_count, 0) as view_count, created_at, updated_at FROM pages ORDER BY updated_at DESC LIMIT ? OFFSET ?"
      ).bind(limit, offset);
      const { results, success, error } = await stmt.all();
      if (!success) {
        throw new Error(error || "Failed to query database");
      }
      return jsonResponse({ results, count: results.length, limit, offset }, 200, corsHeaders);
    }
    if (method === "GET" && pathParts.length === 2) {
      const slugOrId = pathParts[1];
      const cleanedSlug = generateSlug(slugOrId);
      const stmt = env.mysql.prepare(
        "SELECT id, title, slug, content, category, image_url, COALESCE(views, 0) as views, COALESCE(view_count, 0) as view_count, created_at, updated_at FROM pages WHERE slug = ? OR slug = ? OR id = ?"
      ).bind(slugOrId, cleanedSlug, slugOrId);
      const page = await stmt.first();
      if (!page) {
        return jsonResponse({ error: `Page not found: '${slugOrId}'` }, 404, corsHeaders);
      }
      return jsonResponse(page, 200, corsHeaders);
    }
    if (method === "POST" && pathParts.length === 1) {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON body", field: "body" }, 400, corsHeaders);
      }
      const title = (body.title || "").trim();
      const content = (body.content || "").trim();
      const category = (body.category || "guides").trim();
      const imageUrl = (body.image_url || body.imageUrl || "").trim();
      if (!title) {
        return jsonResponse({ error: "Title is required", field: "title" }, 400, corsHeaders);
      }
      if (!content) {
        return jsonResponse({ error: "Content is required", field: "content" }, 400, corsHeaders);
      }
      const existingTitle = await env.mysql.prepare("SELECT id FROM pages WHERE title = ?").bind(title).first();
      if (existingTitle) {
        return jsonResponse({ error: `A page with this title already exists: '${title}'`, field: "title" }, 409, corsHeaders);
      }
      let slug = (body.slug || "").trim() ? generateSlug(body.slug) : generateSlug(title);
      if (!slug) {
        slug = "page-" + Math.random().toString(36).substring(2, 8);
      }
      let finalSlug = slug;
      let counter = 1;
      while (true) {
        const existing = await env.mysql.prepare("SELECT id FROM pages WHERE slug = ?").bind(finalSlug).first();
        if (!existing) break;
        finalSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
        counter++;
        if (counter > 10) {
          finalSlug = `${slug}-${Date.now()}`;
          break;
        }
      }
      const id = "page_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      console.log(`[DIAGNOSTIC] INSERTing into pages: ID="${id}", TITLE="${title}", SLUG="${finalSlug}", CATEGORY="${category}", IMAGE="${imageUrl}"`);
      const insertStmt = env.mysql.prepare(
        "INSERT INTO pages (id, title, slug, content, category, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(id, title, finalSlug, content, category, imageUrl || null, now, now);
      let result;
      try {
        result = await insertStmt.run();
      } catch (err) {
        const errMsg = String(err?.message || "");
        if (errMsg.includes("UNIQUE constraint failed: pages.title") || errMsg.includes("UNIQUE constraint failed")) {
          return jsonResponse({ error: `A page with this title already exists: '${title}'`, field: "title" }, 409, corsHeaders);
        }
        throw err;
      }
      if (!result.success) {
        const resErr = String(result.error || "");
        if (resErr.includes("UNIQUE constraint failed: pages.title") || resErr.includes("UNIQUE constraint failed")) {
          return jsonResponse({ error: `A page with this title already exists: '${title}'`, field: "title" }, 409, corsHeaders);
        }
        throw new Error(String(result.error) || "Failed to insert page into D1");
      }
      const newPage = {
        id,
        title,
        slug: finalSlug,
        content,
        category,
        image_url: imageUrl || void 0,
        created_at: now,
        updated_at: now
      };
      return jsonResponse(newPage, 201, corsHeaders);
    }
    if (method === "PUT" && pathParts.length === 2) {
      const slugOrId = pathParts[1];
      const cleanedSlug = generateSlug(slugOrId);
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON body", field: "body" }, 400, corsHeaders);
      }
      const existing = await env.mysql.prepare("SELECT id, title, slug, content, category, image_url, created_at FROM pages WHERE slug = ? OR slug = ? OR id = ?").bind(slugOrId, cleanedSlug, slugOrId).first();
      if (!existing) {
        return jsonResponse({ error: `Page not found: '${slugOrId}'` }, 404, corsHeaders);
      }
      const title = body.title !== void 0 ? body.title.trim() : existing.title;
      const content = body.content !== void 0 ? body.content.trim() : existing.content;
      const category = body.category !== void 0 ? body.category.trim() : existing.category || "guides";
      const imageUrl = body.image_url !== void 0 ? body.image_url.trim() : body.imageUrl !== void 0 ? body.imageUrl.trim() : existing.image_url || "";
      const newSlug = body.slug !== void 0 && body.slug.trim() ? generateSlug(body.slug) : existing.slug;
      if (body.title !== void 0 && !title) {
        return jsonResponse({ error: "Title cannot be empty", field: "title" }, 400, corsHeaders);
      }
      if (body.content !== void 0 && !content) {
        return jsonResponse({ error: "Content cannot be empty", field: "content" }, 400, corsHeaders);
      }
      let finalNewSlug = newSlug;
      if (finalNewSlug !== existing.slug) {
        const conflict = await env.mysql.prepare("SELECT id FROM pages WHERE slug = ?").bind(finalNewSlug).first();
        if (conflict) {
          finalNewSlug = `${newSlug}-${Math.random().toString(36).substring(2, 6)}`;
        }
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const updateStmt = env.mysql.prepare(
        "UPDATE pages SET title = ?, slug = ?, content = ?, category = ?, image_url = ?, updated_at = ? WHERE id = ?"
      ).bind(title, finalNewSlug, content, category, imageUrl || null, now, existing.id);
      const { success, error } = await updateStmt.run();
      if (!success) {
        throw new Error(error || "Failed to update page in D1");
      }
      const updatedPage = {
        id: existing.id,
        title,
        slug: finalNewSlug,
        content,
        category,
        image_url: imageUrl || void 0,
        created_at: existing.created_at,
        updated_at: now
      };
      return jsonResponse(updatedPage, 200, corsHeaders);
    }
    if (method === "DELETE" && pathParts.length === 2) {
      const slugOrId = pathParts[1];
      const cleanedSlug = generateSlug(slugOrId);
      const existing = await env.mysql.prepare("SELECT id, slug FROM pages WHERE slug = ? OR slug = ? OR id = ?").bind(slugOrId, cleanedSlug, slugOrId).first();
      if (!existing) {
        return jsonResponse({ error: `Page not found: '${slugOrId}'` }, 404, corsHeaders);
      }
      const deleteStmt = env.mysql.prepare("DELETE FROM pages WHERE id = ?").bind(existing.id);
      const { success, error } = await deleteStmt.run();
      if (!success) {
        throw new Error(error || "Failed to delete page from D1");
      }
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    return jsonResponse({ error: "Not found" }, 404, corsHeaders);
  } catch (err) {
    console.error("Database or routing error in handlePagesRequest:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return jsonResponse({ error: message }, 500, corsHeaders);
  }
}
async function handleSettingsRequest(request, url, env, corsHeaders) {
  await ensureSchema(env);
  const method = request.method;
  try {
    if (method === "GET") {
      const pathParts = url.pathname.split("/").filter(Boolean);
      const key = pathParts[2];
      if (key) {
        const setting = await env.mysql.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
        return jsonResponse({ success: true, key, value: setting ? setting.value : null }, 200, corsHeaders);
      }
      const { results } = await env.mysql.prepare("SELECT key, value FROM settings").all();
      const settingsMap = (results || []).reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      return jsonResponse({ success: true, settings: settingsMap }, 200, corsHeaders);
    }
    if (method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
      }
      const { key, value } = body;
      if (!key || value === void 0) {
        return jsonResponse({ error: "key and value are required" }, 400, corsHeaders);
      }
      await env.mysql.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind(key, String(value)).run();
      return jsonResponse({ success: true, key, value: String(value) }, 200, corsHeaders);
    }
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  } catch (err) {
    console.error("Settings request error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return jsonResponse({ error: message }, 500, corsHeaders);
  }
}
async function handleCommentsRequest(request, url, env, corsHeaders) {
  await ensureSchema(env);
  const method = request.method;
  try {
    if (method === "GET") {
      const pageId = url.searchParams.get("pageId") || url.searchParams.get("page_id");
      if (!pageId) {
        return jsonResponse({ error: "pageId query parameter required" }, 400, corsHeaders);
      }
      const { results } = await env.mysql.prepare("SELECT id, page_id as pageId, user_name as userName, user_email as userEmail, comment, created_at as createdAt FROM comments WHERE page_id = ? ORDER BY created_at ASC").bind(pageId).all();
      return jsonResponse({ success: true, comments: results || [] }, 200, corsHeaders);
    }
    if (method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
      }
      const pageId = (body.pageId || body.page_id || "").trim();
      const userName = (body.userName || body.user_name || "").trim();
      const userEmail = (body.userEmail || body.user_email || "").trim().toLowerCase();
      const comment = (body.comment || "").trim();
      if (!pageId || !userName || !userEmail || !comment) {
        return jsonResponse({ error: "pageId, userName, userEmail, and comment are required" }, 400, corsHeaders);
      }
      const commentId = "cmt_" + crypto.randomUUID();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await env.mysql.prepare("INSERT INTO comments (id, page_id, user_name, user_email, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(commentId, pageId, userName, userEmail, comment, now).run();
      const newComment = {
        id: commentId,
        pageId,
        userName,
        userEmail,
        comment,
        createdAt: now
      };
      return jsonResponse({ success: true, comment: newComment }, 201, corsHeaders);
    }
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  } catch (err) {
    console.error("Comments request error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return jsonResponse({ error: message }, 500, corsHeaders);
  }
}

// src/auth/password.ts
function bufToHex(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}
function hexToBuf(hex) {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let c = 0;
  for (let i = 0; i < a.length; i++) {
    c |= a[i] ^ b[i];
  }
  return c === 0;
}
var ITERATIONS = 1e5;
var KEY_LEN_BITS = 256;
async function hashPassword(password) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(password);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    KEY_LEN_BITS
  );
  const saltHex = bufToHex(salt);
  const hashHex = bufToHex(derivedBits);
  return `${saltHex}:${hashHex}`;
}
async function verifyPassword(password, stored) {
  try {
    const parts = stored.split(":");
    if (parts.length !== 2) {
      return false;
    }
    const saltHex = parts[0];
    const storedHashHex = parts[1];
    const salt = hexToBuf(saltHex);
    const storedHashBytes = hexToBuf(storedHashHex);
    const enc = new TextEncoder();
    const passwordBuffer = enc.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: ITERATIONS,
        hash: "SHA-256"
      },
      keyMaterial,
      KEY_LEN_BITS
    );
    const computedHashBytes = new Uint8Array(derivedBits);
    return timingSafeEqual(computedHashBytes, storedHashBytes);
  } catch {
    return false;
  }
}

// worker/auth.ts
var JWT_SECRET = "minecraft-wiki-secret-key-2026";
function str2ab(str) {
  return new TextEncoder().encode(str);
}
function buf2base64url(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64url2str(b64u) {
  let b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }
  return atob(b64);
}
async function getHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    str2ab(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
async function createToken(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = buf2base64url(str2ab(JSON.stringify(header)));
  const now = Math.floor(Date.now() / 1e3);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + 86400 * 7
  };
  const encodedPayload = buf2base64url(str2ab(JSON.stringify(jwtPayload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, str2ab(dataToSign));
  const encodedSignature = buf2base64url(signature);
  return `${dataToSign}.${encodedSignature}`;
}
async function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;
    const key = await getHmacKey();
    const signatureBytes = Uint8Array.from(base64url2str(encodedSignature), (c) => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, str2ab(dataToVerify));
    if (!isValid) return null;
    const payloadStr = base64url2str(encodedPayload);
    const payload = JSON.parse(payloadStr);
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return { id: payload.id, email: payload.email, is_admin: payload.is_admin };
  } catch {
    return null;
  }
}
function extractAuthToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/token=([^;]+)/);
    if (match) return match[1].trim();
  }
  return null;
}
async function authenticateRequest(request, env) {
  const token = extractAuthToken(request);
  if (token) {
    const verified = await verifyToken(token);
    if (verified) return verified;
  }
  const emailHeader = request.headers.get("X-User-Email") || request.headers.get("x-user-email");
  if (emailHeader && emailHeader.includes("@") && env?.mysql) {
    const cleanEmail = emailHeader.trim().toLowerCase();
    try {
      let existingUser = await env.mysql.prepare("SELECT id, email, is_admin FROM users WHERE email = ?").bind(cleanEmail).first();
      if (existingUser) {
        return { id: existingUser.id, email: existingUser.email, is_admin: existingUser.is_admin || 0 };
      } else {
        const newId = "usr_" + crypto.randomUUID();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await env.mysql.prepare("INSERT INTO users (id, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)").bind(newId, cleanEmail, "session:header", now, now).run();
        return { id: newId, email: cleanEmail, is_admin: 0 };
      }
    } catch {
      return { id: "usr_" + cleanEmail.replace(/[^a-zA-Z0-9]/g, "_"), email: cleanEmail, is_admin: 0 };
    }
  }
  return null;
}
async function handleAuthRequest(request, url, env, corsHeaders) {
  await ensureSchema(env);
  const pathname = url.pathname;
  const jsonRes = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  };
  if (pathname === "/auth/admin/bootstrap" || pathname === "/api/auth/admin/bootstrap") {
    if (request.method !== "POST") {
      return jsonRes({ error: "Method not allowed" }, 405);
    }
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: "Invalid JSON body" }, 400);
    }
    const { username, password, email, adminPassword } = body;
    if (username !== "adm" || password !== "admin") {
      return jsonRes({ error: 'Bootstrap credentials invalid. Use user "adm" and password "admin".' }, 401);
    }
    const targetEmail = email || body.email;
    const targetPassword = adminPassword || body.password;
    if (!targetEmail || typeof targetEmail !== "string" || !targetEmail.includes("@")) {
      return jsonRes({ error: "Valid email address is required" }, 400);
    }
    if (!targetPassword || typeof targetPassword !== "string" || targetPassword.length < 6) {
      return jsonRes({ error: "Password must be at least 6 characters long" }, 400);
    }
    const adminCountRes = await env.mysql.prepare("SELECT COUNT(*) as count FROM users WHERE is_admin = 1").first();
    const adminCount = adminCountRes?.count || 0;
    if (adminCount >= 1) {
      return jsonRes({ error: "Admin account already initialized. This page can only be used once." }, 403);
    }
    const cleanEmail = targetEmail.trim().toLowerCase();
    const hashed = await hashPassword(targetPassword);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = await env.mysql.prepare("SELECT id FROM users WHERE email = ?").bind(cleanEmail).first();
    let userId = existing?.id;
    if (existing) {
      await env.mysql.prepare("UPDATE users SET password_hash = ?, is_admin = 1, updated_at = ? WHERE email = ?").bind(hashed, now, cleanEmail).run();
    } else {
      userId = "usr_" + crypto.randomUUID();
      await env.mysql.prepare(
        "INSERT INTO users (id, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)"
      ).bind(userId, cleanEmail, hashed, now, now).run();
    }
    const finalUserId = userId || "usr_admin";
    const cleanUsername = cleanEmail.split("@")[0] || "admin";
    await env.mysql.prepare("INSERT OR REPLACE INTO adm (id, username, email, created_at) VALUES (?, ?, ?, ?)").bind(finalUserId, cleanUsername, cleanEmail, now).run();
    const token = await createToken({ id: finalUserId, email: cleanEmail, is_admin: 1 });
    return jsonRes(
      {
        success: true,
        message: "Initial administrator registered successfully.",
        token,
        user: {
          id: finalUserId,
          email: cleanEmail,
          is_admin: 1,
          created_at: now
        }
      },
      201
    );
  }
  if (pathname === "/api/admin/verify-google" || pathname === "/auth/admin/verify-google") {
    if (request.method !== "POST") {
      return jsonRes({ error: "Method not allowed" }, 405);
    }
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: "Invalid JSON body" }, 400);
    }
    const { email } = body;
    if (!email || typeof email !== "string") {
      return jsonRes({ error: "Email is required" }, 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    const adminCheck = await env.mysql.prepare("SELECT * FROM adm WHERE email = ?").bind(cleanEmail).first();
    if (!adminCheck) {
      return jsonRes({ success: false, error: "Email not authorized as administrator. Only registered administrators can access." }, 403);
    }
    return jsonRes({ success: true, admin: adminCheck });
  }
  if (pathname === "/auth/admin/create" || pathname === "/api/auth/admin/create" || pathname === "/api/admin/users/create") {
    if (request.method !== "POST") {
      return jsonRes({ error: "Method not allowed" }, 405);
    }
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: "Invalid JSON body" }, 400);
    }
    const { email, username, password } = body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return jsonRes({ error: "Valid email address is required" }, 400);
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return jsonRes({ error: "Password must be at least 6 characters long" }, 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || email.split("@")[0] || "admin").trim();
    const hashed = await hashPassword(password);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = await env.mysql.prepare("SELECT id FROM users WHERE email = ?").bind(cleanEmail).first();
    let userId = existing?.id || "usr_" + crypto.randomUUID();
    if (existing) {
      await env.mysql.prepare("UPDATE users SET username = ?, password_hash = ?, is_admin = 1, updated_at = ? WHERE email = ?").bind(cleanUsername, hashed, now, cleanEmail).run();
    } else {
      await env.mysql.prepare(
        "INSERT INTO users (id, username, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)"
      ).bind(userId, cleanUsername, cleanEmail, hashed, now, now).run();
    }
    await env.mysql.prepare("INSERT OR REPLACE INTO adm (id, username, email, created_at) VALUES (?, ?, ?, ?)").bind(userId, cleanUsername, cleanEmail, now).run();
    return jsonRes(
      {
        success: true,
        message: "Admin account created successfully.",
        user: {
          id: userId,
          username: cleanUsername,
          email: cleanEmail,
          is_admin: 1
        }
      },
      201
    );
  }
  if (pathname === "/api/admin/status" || pathname === "/auth/admin/status") {
    try {
      const res = await env.mysql.prepare("SELECT COUNT(*) as count FROM users WHERE is_admin = 1").first();
      const count = res?.count || 0;
      return jsonRes({ success: true, hasAdmin: count > 0, adminCount: count });
    } catch {
      return jsonRes({ success: true, hasAdmin: false, adminCount: 0 });
    }
  }
  if (pathname === "/api/admin/admins" || pathname === "/auth/admin/list" || pathname === "/api/admin/users") {
    try {
      const { results } = await env.mysql.prepare("SELECT id, username, email, is_admin, created_at FROM users WHERE is_admin = 1 ORDER BY created_at DESC").all();
      const adminList = (results || []).map((u) => ({
        id: u.id,
        username: u.username || u.email?.split("@")[0] || "Admin",
        email: u.email,
        role: "admin",
        is_admin: 1,
        created_at: u.created_at || (/* @__PURE__ */ new Date()).toISOString()
      }));
      if (!adminList.some((a) => a.username === "adm" || a.email === "adm@wiki.local")) {
        adminList.unshift({
          id: "usr_adm_default",
          username: "adm",
          email: "adm@wiki.local",
          role: "admin",
          is_admin: 1,
          created_at: "System Default"
        });
      }
      return jsonRes({ success: true, admins: adminList });
    } catch {
      return jsonRes({
        success: true,
        admins: [{ id: "usr_adm_default", username: "adm", email: "adm@wiki.local", role: "admin", is_admin: 1, created_at: "System Default" }]
      });
    }
  }
  if (pathname === "/auth/google" || pathname === "/api/auth/google") {
    let body = {};
    try {
      body = await request.json();
    } catch {
    }
    const idToken = body.id_token;
    let email = body.email;
    let name = body.name || "Google User";
    if (idToken && !email) {
      try {
        const parts = idToken.split(".");
        if (parts.length === 3) {
          let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          while (b64.length % 4) {
            b64 += "=";
          }
          const payloadStr = atob(b64);
          const payload = JSON.parse(payloadStr);
          email = payload.email;
          name = payload.name || (email ? email.split("@")[0] : "Google User");
        }
      } catch (err) {
        console.warn("Could not parse Google ID token:", err);
      }
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return jsonRes({ error: "Google authentication missing valid email address" }, 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let existingUser = await env.mysql.prepare("SELECT id, email, is_admin, created_at FROM users WHERE email = ?").bind(cleanEmail).first();
    let userId = existingUser?.id;
    const isAdmin = existingUser?.is_admin || 0;
    if (!existingUser) {
      userId = "usr_" + crypto.randomUUID();
      await env.mysql.prepare(
        "INSERT INTO users (id, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)"
      ).bind(userId, cleanEmail, "oauth:google", now, now).run();
      existingUser = { id: userId, email: cleanEmail, is_admin: 0, created_at: now };
    } else {
      await env.mysql.prepare("UPDATE users SET updated_at = ? WHERE id = ?").bind(now, userId).run();
    }
    const createdAt = existingUser ? existingUser.created_at : now;
    const finalUserId = userId || "usr_" + crypto.randomUUID();
    const token = await createToken({ id: finalUserId, email: cleanEmail, is_admin: isAdmin });
    return jsonRes({
      success: true,
      token,
      user: {
        id: finalUserId,
        email: cleanEmail,
        name,
        is_admin: isAdmin,
        created_at: createdAt
      }
    });
  }
  if (pathname === "/auth/signup" || pathname === "/api/auth/signup" || pathname === "/auth/register" || pathname === "/api/auth/register") {
    if (request.method !== "POST") {
      return jsonRes({ error: "Method not allowed" }, 405);
    }
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: "Invalid JSON body" }, 400);
    }
    const { email, password } = body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return jsonRes({ error: "Valid email address is required" }, 400);
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return jsonRes({ error: "Password must be at least 6 characters long" }, 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = await env.mysql.prepare("SELECT id FROM users WHERE email = ?").bind(cleanEmail).first();
    if (existing) {
      return jsonRes({ error: "An account with this email already exists" }, 409);
    }
    const userId = "usr_" + crypto.randomUUID();
    const hashed = await hashPassword(password);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.mysql.prepare(
      "INSERT INTO users (id, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)"
    ).bind(userId, cleanEmail, hashed, now, now).run();
    const token = await createToken({ id: userId, email: cleanEmail, is_admin: 0 });
    return jsonRes(
      {
        success: true,
        token,
        user: {
          id: userId,
          email: cleanEmail,
          is_admin: 0,
          created_at: now
        }
      },
      201
    );
  }
  if (pathname === "/auth/login" || pathname === "/api/auth/login") {
    if (request.method !== "POST") {
      return jsonRes({ error: "Method not allowed" }, 405);
    }
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: "Invalid JSON body" }, 400);
    }
    const { email, password } = body;
    if (!email || !password) {
      return jsonRes({ error: "Invalid email or password" }, 401);
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const user = await env.mysql.prepare("SELECT id, email, password_hash, is_admin FROM users WHERE email = ?").bind(cleanEmail).first();
    if (!user) {
      return jsonRes({ error: "Invalid email or password" }, 401);
    }
    const isMatch = await verifyPassword(String(password), user.password_hash);
    if (!isMatch) {
      return jsonRes({ error: "Invalid email or password" }, 401);
    }
    const isAdmin = user.is_admin || 0;
    const token = await createToken({ id: user.id, email: user.email, is_admin: isAdmin });
    return jsonRes({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        is_admin: isAdmin
      }
    });
  }
  if (pathname === "/api/admin/verify" || pathname === "/admin/verify" || pathname === "/auth/admin/login" || pathname === "/api/auth/admin/login") {
    if (request.method !== "POST") {
      return jsonRes({ error: "Method not allowed" }, 405);
    }
    let body = {};
    try {
      body = await request.json();
    } catch {
    }
    const usernameParam = (body.username || "").trim().toLowerCase();
    const emailParam = (body.email || "").trim().toLowerCase();
    const identifier = usernameParam || emailParam;
    const password = (body.password || "").trim();
    if (!identifier || !password) {
      return jsonRes({ success: false, message: "Administrator username/email and password required." }, 400);
    }
    if ((identifier === "adm" || identifier === "admin") && password === "admin") {
      const defaultToken = await createToken({ id: "usr_adm_default", email: "adm@wiki.local", is_admin: 1 });
      return jsonRes({
        success: true,
        token: defaultToken,
        user: {
          id: "usr_adm_default",
          username: "adm",
          email: "adm@wiki.local",
          is_admin: 1
        },
        message: "Administrator authentication successful (Default Admin)."
      });
    }
    let user = null;
    try {
      user = await env.mysql.prepare("SELECT id, username, email, password_hash, is_admin FROM users WHERE email = ? OR LOWER(username) = ? OR id = ?").bind(identifier, identifier, identifier).first();
    } catch {
      user = await env.mysql.prepare("SELECT id, email, password_hash, is_admin FROM users WHERE email = ? OR id = ?").bind(identifier, identifier).first();
    }
    if (!user) {
      return jsonRes({ success: false, message: "Administrator account not found. Try initial credentials: adm / admin" }, 401);
    }
    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return jsonRes({ success: false, message: "Incorrect administrator password." }, 401);
    }
    if (user.is_admin !== 1) {
      return jsonRes({ success: false, message: "Account does not have administrator privileges." }, 403);
    }
    const token = await createToken({ id: user.id, email: user.email, is_admin: 1 });
    return jsonRes({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username || user.email?.split("@")[0] || "Admin",
        email: user.email,
        is_admin: 1
      },
      message: "Administrator authentication successful."
    });
  }
  return jsonRes({ error: "Not found" }, 404);
}
async function handleFavoritesRequest(request, url, env, corsHeaders) {
  await ensureSchema(env);
  const pathname = url.pathname;
  const jsonRes = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  };
  const currentUser = await authenticateRequest(request, env);
  if (!currentUser) {
    return jsonRes({ error: "Unauthorized. Please log in." }, 401);
  }
  if ((pathname === "/favorites" || pathname === "/api/favorites") && request.method === "GET") {
    const { results } = await env.mysql.prepare(
      `SELECT f.id as favorite_id, f.created_at as favorited_at, p.id, p.title, p.slug, p.category, p.content, p.image_url, COALESCE(p.views, p.view_count, 0) as views, p.created_at, p.updated_at
         FROM favorites f
         JOIN pages p ON (f.page_id = p.id OR f.page_id = p.slug)
         WHERE f.user_id = ? OR f.user_id = ?
         ORDER BY f.created_at DESC`
    ).bind(currentUser.id, currentUser.email).all();
    return jsonRes({
      success: true,
      favorites: results || []
    });
  }
  if ((pathname === "/favorites" || pathname === "/api/favorites") && request.method === "POST") {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: "Invalid JSON body" }, 400);
    }
    const { page_id, pageId } = body;
    const targetPageId = page_id || pageId;
    if (!targetPageId) {
      return jsonRes({ error: "page_id is required" }, 400);
    }
    const pageExists = await env.mysql.prepare("SELECT id, slug FROM pages WHERE id = ? OR slug = ?").bind(targetPageId, targetPageId).first();
    if (!pageExists) {
      return jsonRes({ error: "Page not found" }, 404);
    }
    const actualPageId = pageExists.id;
    const favId = "fav_" + crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await env.mysql.prepare(
        "INSERT INTO favorites (id, user_id, page_id, created_at) VALUES (?, ?, ?, ?)"
      ).bind(favId, currentUser.id, actualPageId, now).run();
    } catch (err) {
      if (err.message && err.message.includes("UNIQUE constraint failed")) {
        return jsonRes({ success: true, message: "Already favorited", favorite_id: favId });
      }
      throw err;
    }
    return jsonRes({ success: true, favorite_id: favId, page_id: actualPageId, slug: pageExists.slug }, 201);
  }
  if ((pathname.startsWith("/favorites/") || pathname.startsWith("/api/favorites/")) && request.method === "DELETE") {
    const parts = pathname.split("/").filter(Boolean);
    const targetPageId = parts[parts.length - 1];
    if (!targetPageId) {
      return jsonRes({ error: "pageId parameter required" }, 400);
    }
    await env.mysql.prepare(
      "DELETE FROM favorites WHERE (user_id = ? OR user_id = ?) AND (page_id = ? OR page_id IN (SELECT id FROM pages WHERE slug = ? OR id = ?))"
    ).bind(currentUser.id, currentUser.email, targetPageId, targetPageId, targetPageId).run();
    return jsonRes({ success: true, message: "Removed from favorites" });
  }
  return jsonRes({ error: "Not found" }, 404);
}

// worker/index.ts
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    try {
      if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/admin/verify") || pathname.startsWith("/admin/verify") || pathname.startsWith("/api/admin/status") || pathname.startsWith("/auth/admin/status") || pathname.startsWith("/api/admin/admins") || pathname.startsWith("/auth/admin/list") || pathname.startsWith("/api/admin/users") || pathname.startsWith("/auth/admin/bootstrap") || pathname.startsWith("/api/auth/admin/bootstrap")) {
        return await handleAuthRequest(request, url, env, corsHeaders);
      }
      if (pathname === "/favorites" || pathname.startsWith("/favorites/") || pathname === "/api/favorites" || pathname.startsWith("/api/favorites/")) {
        return await handleFavoritesRequest(request, url, env, corsHeaders);
      }
      if (pathname === "/comments" || pathname === "/api/comments") {
        return await handleCommentsRequest(request, url, env, corsHeaders);
      }
      if (pathname === "/settings" || pathname === "/api/settings" || pathname.startsWith("/settings/") || pathname.startsWith("/api/settings/")) {
        return await handleSettingsRequest(request, url, env, corsHeaders);
      }
      if (pathname === "/health" || pathname === "/api/health") {
        let dbStatus = "degraded";
        try {
          const test = await env.mysql.prepare("SELECT 1 as ok").first();
          if (test?.ok === 1) dbStatus = "connected";
        } catch {
        }
        return jsonResponse({
          status: "ok",
          database: dbStatus,
          engine: "Cloudflare D1",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }, 200, corsHeaders);
      }
      if (pathname === "/api/admin/database-stats" || pathname === "/admin/database-stats") {
        let pageCount = 0;
        let usersList = [];
        try {
          await ensureSchema(env);
          const res = await env.mysql.prepare("SELECT COUNT(*) as count FROM pages").first();
          pageCount = res?.count || 0;
          const usersRes = await env.mysql.prepare("SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC").all();
          usersList = (usersRes.results || []).map((u) => ({
            id: u.id,
            username: u.username || u.email?.split("@")[0] || "User",
            email: u.email,
            role: u.is_admin === 1 ? "admin" : "user",
            created_at: u.created_at || "Registered"
          }));
        } catch (err) {
          return jsonResponse({ success: false, error: err.message || "Failed to fetch database stats" }, 500, corsHeaders);
        }
        if (!usersList.some((u) => u.username === "adm")) {
          usersList.unshift({
            id: "usr_adm_default",
            username: "adm",
            email: "adm@wiki.local",
            role: "admin",
            created_at: "Initial System Admin"
          });
        }
        return jsonResponse({
          success: true,
          storedIn: "Cloudflare D1",
          pagesCount: pageCount,
          users: usersList
        }, 200, corsHeaders);
      }
      if (pathname === "/api/admin/analytics" || pathname === "/admin/analytics") {
        await ensureSchema(env);
        let topVisited = [];
        let topFavorited = [];
        let totalViews = 0;
        let totalFavorites = 0;
        let totalPages = 0;
        let totalUsers = 0;
        try {
          const visitedRes = await env.mysql.prepare(
            "SELECT id, title, slug, category, image_url, COALESCE(views, 0) as views, created_at, updated_at FROM pages ORDER BY views DESC LIMIT 20"
          ).all();
          topVisited = visitedRes.results || [];
          const favoritedRes = await env.mysql.prepare(
            `SELECT p.id, p.title, p.slug, p.category, p.image_url, COALESCE(p.views, 0) as views, COUNT(f.id) as favorites_count 
             FROM pages p 
             LEFT JOIN favorites f ON p.id = f.page_id 
             GROUP BY p.id 
             ORDER BY favorites_count DESC, views DESC LIMIT 20`
          ).all();
          topFavorited = favoritedRes.results || [];
          const sumRes = await env.mysql.prepare("SELECT SUM(COALESCE(views, 0)) as total_views, COUNT(*) as total_pages FROM pages").first();
          totalViews = sumRes?.total_views || 0;
          totalPages = sumRes?.total_pages || 0;
          const favCountRes = await env.mysql.prepare("SELECT COUNT(*) as total_favs FROM favorites").first();
          totalFavorites = favCountRes?.total_favs || 0;
          const userCountRes = await env.mysql.prepare("SELECT COUNT(*) as total_users FROM users").first();
          totalUsers = userCountRes?.total_users || 0;
        } catch (err) {
          console.error("Analytics query error:", err);
          return jsonResponse({ success: false, error: err.message || "Analytics query failed" }, 500, corsHeaders);
        }
        return jsonResponse({
          success: true,
          summary: {
            totalViews,
            totalFavorites,
            totalPages,
            totalUsers
          },
          mostVisited: topVisited,
          mostFavorited: topFavorited
        }, 200, corsHeaders);
      }
      if (pathname === "/api/images/list" || pathname === "/images/list") {
        return jsonResponse({
          success: true,
          images: []
        }, 200, corsHeaders);
      }
      if (pathname.startsWith("/pages") || pathname.startsWith("/api/pages") || pathname.startsWith("/admin/pages") || pathname.startsWith("/api/admin/pages") || pathname.startsWith("/api/sql/pages")) {
        const normalizedUrl = new URL(request.url);
        let path2 = normalizedUrl.pathname;
        if (path2.startsWith("/api/sql/pages")) {
          path2 = path2.replace("/api/sql", "");
        } else if (path2.startsWith("/api/admin/pages")) {
          path2 = path2.replace("/api/admin", "");
        } else if (path2.startsWith("/admin/pages")) {
          path2 = path2.replace("/admin", "");
        } else if (path2.startsWith("/api/pages")) {
          path2 = path2.replace("/api", "");
        }
        normalizedUrl.pathname = path2;
        return await handlePagesRequest(request, normalizedUrl, env, corsHeaders);
      }
      if (pathname.startsWith("/api/categories") || pathname.startsWith("/api/sql/categories")) {
        return jsonResponse({
          success: true,
          categories: [],
          storedIn: "Cloudflare D1"
        }, 200, corsHeaders);
      }
      if (pathname.startsWith("/api/")) {
        return jsonResponse({ error: "Endpoint not found", path: pathname }, 404, corsHeaders);
      }
      if (env.ASSETS) {
        let assetRes = await env.ASSETS.fetch(request);
        if (assetRes.status === 404 && request.method === "GET" && !pathname.includes(".")) {
          const indexUrl = new URL("/index.html", request.url);
          assetRes = await env.ASSETS.fetch(new Request(indexUrl, request));
        }
        return assetRes;
      }
      return jsonResponse({ error: "Endpoint not found" }, 404, corsHeaders);
    } catch (err) {
      console.error("Unhandled worker error:", err);
      const msg = err instanceof Error ? err.message : "Internal Server Error";
      return jsonResponse({ error: msg }, 500, corsHeaders);
    }
  }
};

// server.ts
if (!console.warning) {
  console.warning = console.warn;
}
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
var D1_DATABASE_ID = "d7f3eefe-63ff-4b62-8baf-6dc44381abab";
var D1_DATABASE_NAME = "my-sql";
async function queryRemoteD1IfAvailable(sql, params = []) {
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.D1_TOKEN;
  let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId || accountId === D1_DATABASE_ID) {
    accountId = "83e4738d-6bb8-4ca3-7d90-e4c68b0ddfab";
  }
  if (!token) return null;
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${D1_DATABASE_ID}/query`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params })
    });
    if (!res.ok) {
      if (res.status !== 404 && res.status !== 403) {
        const errText = await res.text();
        console.warn(`[Cloudflare D1 REST API] Response status ${res.status}: ${errText}. Falling back to local persistent D1 database engine.`);
      }
      return null;
    }
    const data = await res.json();
    if (!data.success) {
      const errMsg = data.errors?.map((e) => e.message).join(", ") || "Unknown D1 API error";
      console.warn(`[Cloudflare D1 REST API] Remote query error: ${errMsg}. Falling back to local persistent D1 database engine.`);
      return null;
    }
    const queryResult = data.result?.[0] || { results: [], success: true };
    return {
      success: queryResult.success !== false,
      results: queryResult.results || [],
      meta: queryResult.meta || {}
    };
  } catch (err) {
    console.warn(`[Cloudflare D1 REST API] Network error: ${err.message}. Falling back to local persistent D1 database engine.`);
    return null;
  }
}
var dbPath = import_path.default.join(process.cwd(), ".d1_data.sqlite");
var sqlite = new import_node_sqlite.DatabaseSync(dbPath);
try {
  sqlite.exec("PRAGMA journal_mode = WAL;");
  console.log("[SQLite] Journal mode set to WAL");
} catch (err) {
  console.warn(`[SQLite] Failed to set journal mode to WAL: ${err.message}`);
}
var mysqlClient = {
  async exec(sql) {
    const remote = await queryRemoteD1IfAvailable(sql);
    if (remote) {
      if (!remote.success) throw new Error(remote.error || "Failed to execute query on Cloudflare D1");
      return;
    }
    try {
      sqlite.exec(sql);
    } catch (err) {
      console.error(`[SQLite Exec Error] ${err.message} | SQL: ${sql}`);
      throw err;
    }
  },
  prepare(sql) {
    let boundParams = [];
    return {
      bind(...args) {
        boundParams = args;
        return this;
      },
      async run() {
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
              database_name: D1_DATABASE_NAME
            }
          };
        } catch (err) {
          console.error(`[SQLite Run Error] ${err.message} | SQL: ${sql}`);
          return {
            success: false,
            results: [],
            error: err.message
          };
        }
      },
      async all() {
        const remote = await queryRemoteD1IfAvailable(sql, boundParams);
        if (remote) {
          return {
            results: remote.results || [],
            success: remote.success,
            error: remote.error
          };
        }
        try {
          const stmt = sqlite.prepare(sql);
          const rows = stmt.all(...boundParams);
          return {
            results: rows || [],
            success: true
          };
        } catch (err) {
          console.error(`[SQLite All Error] ${err.message} | SQL: ${sql}`);
          return {
            results: [],
            success: false,
            error: err.message
          };
        }
      },
      async first(key) {
        const remote = await queryRemoteD1IfAvailable(sql, boundParams);
        if (remote) {
          const firstRow = remote.results?.[0];
          if (!firstRow) return null;
          if (key) return firstRow[key];
          return firstRow;
        }
        try {
          const stmt = sqlite.prepare(sql);
          const row = stmt.get(...boundParams);
          if (!row) return null;
          if (key) {
            return row[key];
          }
          return row;
        } catch (err) {
          console.error(`[SQLite First Error] ${err.message} | SQL: ${sql}`);
          throw err;
        }
      }
    };
  }
};
async function handleWorkerRequestDirectly(req, res) {
  try {
    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (Array.isArray(val)) {
        val.forEach((v) => headers.append(key, v));
      } else if (typeof val === "string") {
        headers.set(key, val);
      }
    }
    const protocol = req.secure ? "https" : "http";
    const host = req.get("host") || "cloudflare-worker";
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;
    let body = void 0;
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.body && Object.keys(req.body).length > 0) {
        body = JSON.stringify(req.body);
      }
    }
    const webRequest = new Request(fullUrl, {
      method: req.method,
      headers,
      body
    });
    const env = {
      mysql: mysqlClient,
      ASSETS: null
    };
    const webResponse = await worker_default.fetch(webRequest, env, {
      waitUntil: (promise) => {
        promise.catch((err) => console.error("Error in waitUntil:", err));
      },
      passThroughOnException: () => {
      }
    });
    res.status(webResponse.status);
    const headersToSkip = /* @__PURE__ */ new Set(["content-encoding", "content-length", "transfer-encoding", "connection", "keep-alive"]);
    webResponse.headers.forEach((val, key) => {
      if (!headersToSkip.has(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });
    const responseText = await webResponse.text();
    res.send(responseText);
  } catch (err) {
    console.error("Worker request execution error:", err);
    res.status(500).json({ success: false, error: err.message || "Worker Execution Error" });
  }
}
app.all([
  "/auth*",
  "/api/auth*",
  "/favorites*",
  "/api/favorites*",
  "/comments*",
  "/api/comments*",
  "/api/pages*",
  "/api/sql/pages*",
  "/admin/pages*",
  "/api/admin/pages*",
  "/api/admin/database-stats",
  "/api/admin/analytics",
  "/admin/analytics",
  "/api/admin/verify*",
  "/admin/verify*",
  "/api/admin/status*",
  "/auth/admin/status*",
  "/api/admin/admins*",
  "/auth/admin/list*",
  "/api/admin/users*",
  "/auth/admin/bootstrap*",
  "/api/auth/admin/bootstrap*",
  "/api/categories*",
  "/api/sql/categories*",
  "/api/settings*"
], handleWorkerRequestDirectly);
function scanDirRecursive(dirPath, rootDir) {
  let results = [];
  if (!import_fs.default.existsSync(dirPath)) return results;
  try {
    const list = import_fs.default.readdirSync(dirPath);
    list.forEach((file) => {
      const fullPath = import_path.default.join(dirPath, file);
      const stat = import_fs.default.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(scanDirRecursive(fullPath, rootDir));
      } else {
        if (/\.(png|jpe?g|gif|svg|webp)$/i.test(file) && stat.size > 0) {
          const relPath = "/" + import_path.default.relative(rootDir, fullPath).replace(/\\/g, "/");
          results.push(relPath);
        }
      }
    });
  } catch (err) {
    console.error("Error scanning dir:", dirPath, err);
  }
  return results;
}
app.get("/api/health", (req, res) => {
  let sqlStatus = "connected";
  let error = null;
  try {
    sqlite.prepare("SELECT 1").get();
  } catch (err) {
    sqlStatus = "disconnected";
    error = err.message;
    console.error(`[Database Error] Health check failed: ${error}`);
  }
  res.json({
    status: "ok",
    sqlServer: sqlStatus,
    error,
    databaseEngine: "Cloudflare D1",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/images/list", (req, res) => {
  try {
    const publicPath = import_path.default.join(process.cwd(), "public");
    const imagesPath = import_path.default.join(publicPath, "images");
    const images = scanDirRecursive(imagesPath, publicPath);
    res.json({ success: true, images });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
async function startServer() {
  const publicPath = import_path.default.join(process.cwd(), "public");
  app.use(import_express.default.static(publicPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".json")) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      }
    }
  }));
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const effectivePort = process.env.PORT || PORT;
  if (typeof effectivePort === "string" && (effectivePort.startsWith("\\\\.\\pipe\\") || effectivePort.includes("pipe"))) {
    app.listen(effectivePort, () => {
      console.log(`[Cloudflare D1 Server & Express] Server running on Windows IISNode named pipe: ${effectivePort}`);
    });
  } else {
    const numericPort = typeof effectivePort === "string" ? parseInt(effectivePort, 10) || 3e3 : effectivePort;
    app.listen(numericPort, "0.0.0.0", () => {
      console.log(`[Cloudflare D1 Server & Express] Server running on port ${numericPort}`);
      try {
        sqlite.prepare("SELECT 1").get();
        console.log(`[Cloudflare D1 Server] Database connection verified: ${dbPath}`);
      } catch (err) {
        console.error(`[Cloudflare D1 Server] Database connection FAILED: ${err.message}`);
      }
    });
  }
}
startServer();
//# sourceMappingURL=server.cjs.map
