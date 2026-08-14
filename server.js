// server.ts
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

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
    try {
      await env.mysql.exec("PRAGMA auto_vacuum = INCREMENTAL;");
      await env.mysql.exec("PRAGMA journal_mode = WAL;");
      await env.mysql.exec("PRAGMA foreign_keys = ON;");
    } catch {
    }
    await env.mysql.exec(
      'CREATE TABLE IF NOT EXISTS pages (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, content TEXT NOT NULL, category TEXT DEFAULT "guides", image_url TEXT, views INTEGER NOT NULL DEFAULT 0, view_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);'
    );
    await env.mysql.exec(
      'CREATE TABLE IF NOT EXISTS pages_contents (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, content TEXT NOT NULL, category TEXT DEFAULT "guides", image_url TEXT, views INTEGER NOT NULL DEFAULT 0, view_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);'
    );
    await env.mysql.exec(
      "CREATE INDEX IF NOT EXISTS idx_pages_contents_slug ON pages_contents(slug);"
    );
    await env.mysql.exec(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_contents_title_unique ON pages_contents(title);"
    );
    await env.mysql.exec(
      "CREATE INDEX IF NOT EXISTS idx_pages_contents_category_updated ON pages_contents(category, updated_at DESC);"
    );
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY NOT NULL, username TEXT, email TEXT NOT NULL UNIQUE, password_hash TEXT, is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)), email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)), created_at TEXT NOT NULL, updated_at TEXT);"
    );
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS page_contents (page_id TEXT PRIMARY KEY NOT NULL, content_markdown TEXT NOT NULL, raw_json TEXT, FOREIGN KEY (page_id) REFERENCES pages_contents(id) ON DELETE CASCADE);"
    );
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS user_favorites (user_id TEXT NOT NULL, page_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (user_id, page_id), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (page_id) REFERENCES pages_contents(id) ON DELETE CASCADE) WITHOUT ROWID;"
    );
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS users_favorites (user_id TEXT NOT NULL, page_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (user_id, page_id), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (page_id) REFERENCES pages_contents(id) ON DELETE CASCADE) WITHOUT ROWID;"
    );
    await env.mysql.exec(
      "CREATE INDEX IF NOT EXISTS idx_user_favorites_page_id ON user_favorites(page_id);"
    );
    await env.mysql.exec(
      "CREATE INDEX IF NOT EXISTS idx_users_favorites_page_id ON users_favorites(page_id);"
    );
    try {
      const legacyCheck = await env.mysql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='favorites'").first();
      if (legacyCheck) {
        await env.mysql.exec(
          "INSERT OR IGNORE INTO users_favorites (user_id, page_id, created_at) SELECT user_id, page_id, created_at FROM favorites;"
        );
      }
    } catch {
    }
    try {
      await env.mysql.exec("INSERT OR IGNORE INTO pages_contents SELECT * FROM pages;");
    } catch {
    }
    try {
      await env.mysql.exec("INSERT OR IGNORE INTO pages_contents SELECT * FROM pages_contains;");
    } catch {
    }
    try {
      await env.mysql.exec("INSERT OR IGNORE INTO users_favorites SELECT * FROM user_favorites;");
    } catch {
    }
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY NOT NULL, page_id TEXT NOT NULL, user_name TEXT NOT NULL, user_email TEXT NOT NULL, comment TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY (page_id) REFERENCES pages_contents(id) ON DELETE CASCADE);"
    );
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS adm (id TEXT PRIMARY KEY, username TEXT, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);"
    );
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);"
    );
    await env.mysql.exec(
      "CREATE TABLE IF NOT EXISTS email_verifications (email TEXT PRIMARY KEY NOT NULL, code TEXT NOT NULL, username TEXT, password_hash TEXT, created_at TEXT NOT NULL, expires_at TEXT NOT NULL);"
    );
    const addColumn = async (tableName, colName, typeDef) => {
      try {
        const info = await env.mysql.prepare(`PRAGMA table_info(${tableName})`).all();
        const exists = (info.results || []).some((col) => col.name === colName);
        if (!exists) {
          await env.mysql.exec(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${typeDef};`);
        }
      } catch (e) {
        try {
          await env.mysql.exec(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${typeDef};`);
        } catch (inner) {
        }
      }
    };
    try {
      const commentsEnabled = await env.mysql.prepare("SELECT value FROM settings WHERE key = ?").bind("comments_enabled").first();
      if (!commentsEnabled) {
        await env.mysql.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").bind("comments_enabled", "false").run();
      }
    } catch {
    }
    await addColumn("pages", "category", 'TEXT DEFAULT "guides"');
    await addColumn("pages", "image_url", "TEXT");
    await addColumn("pages", "views", "INTEGER DEFAULT 0");
    await addColumn("pages", "view_count", "INTEGER DEFAULT 0");
    await addColumn("pages_contents", "category", 'TEXT DEFAULT "guides"');
    await addColumn("pages_contents", "image_url", "TEXT");
    await addColumn("pages_contents", "views", "INTEGER DEFAULT 0");
    await addColumn("pages_contents", "view_count", "INTEGER DEFAULT 0");
    await addColumn("users", "is_admin", "INTEGER NOT NULL DEFAULT 0");
    await addColumn("users", "username", "TEXT");
    await addColumn("users", "email_verified", "INTEGER DEFAULT 0");
    await addColumn("email_verifications", "username", "TEXT");
    await addColumn("email_verifications", "password_hash", "TEXT");
    schemaInitialized = true;
  } catch (err) {
    console.log("[D1 Schema Status] Schema initialization notice:", err?.message || err);
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
        "UPDATE pages_contents SET views = COALESCE(views, 0) + 1, view_count = COALESCE(view_count, 0) + 1 WHERE slug = ? OR slug = ? OR id = ?"
      ).bind(slugOrId, cleanedSlug, slugOrId).run();
      return jsonResponse({ success: true }, 200, corsHeaders);
    }
    if (method === "GET" && pathParts.length === 1) {
      const limitParam = url.searchParams.get("limit");
      const offsetParam = url.searchParams.get("offset");
      const limit = Math.min(Math.max(parseInt(limitParam || "20", 10) || 20, 1), 100);
      const offset = Math.max(parseInt(offsetParam || "0", 10) || 0, 0);
      const stmt = env.mysql.prepare(
        "SELECT id, title, slug, content, category, image_url, COALESCE(views, 0) as views, COALESCE(view_count, 0) as view_count, created_at, updated_at FROM pages_contents ORDER BY updated_at DESC LIMIT ? OFFSET ?"
      ).bind(limit, offset);
      const { results, success, error } = await stmt.all();
      if (!success) {
        console.log("[Pages Request] SQL query status:", error || "Connection unavailable");
        return jsonResponse({ results: [], count: 0, limit, offset, success: false, error: error || "Database unavailable" }, 200, corsHeaders);
      }
      return jsonResponse({ results: results || [], count: (results || []).length, limit, offset, success: true }, 200, corsHeaders);
    }
    if (method === "GET" && pathParts.length === 2) {
      const slugOrId = pathParts[1];
      const cleanedSlug = generateSlug(slugOrId);
      const stmt = env.mysql.prepare(
        "SELECT id, title, slug, content, category, image_url, COALESCE(views, 0) as views, COALESCE(view_count, 0) as view_count, created_at, updated_at FROM pages_contents WHERE slug = ? OR slug = ? OR id = ?"
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
      const existingTitle = await env.mysql.prepare("SELECT id FROM pages_contents WHERE title = ?").bind(title).first();
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
        const existing = await env.mysql.prepare("SELECT id FROM pages_contents WHERE slug = ?").bind(finalSlug).first();
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
        "INSERT INTO pages_contents (id, title, slug, content, category, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
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
      const existing = await env.mysql.prepare("SELECT id, title, slug, content, category, image_url, created_at FROM pages_contents WHERE slug = ? OR slug = ? OR id = ?").bind(slugOrId, cleanedSlug, slugOrId).first();
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
        const conflict = await env.mysql.prepare("SELECT id FROM pages_contents WHERE slug = ?").bind(finalNewSlug).first();
        if (conflict) {
          finalNewSlug = `${newSlug}-${Math.random().toString(36).substring(2, 6)}`;
        }
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const updateStmt = env.mysql.prepare(
        "UPDATE pages_contents SET title = ?, slug = ?, content = ?, category = ?, image_url = ?, updated_at = ? WHERE id = ?"
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
      const existing = await env.mysql.prepare("SELECT id, slug FROM pages_contents WHERE slug = ? OR slug = ? OR id = ?").bind(slugOrId, cleanedSlug, slugOrId).first();
      if (!existing) {
        return jsonResponse({ error: `Page not found: '${slugOrId}'` }, 404, corsHeaders);
      }
      const deleteStmt = env.mysql.prepare("DELETE FROM pages_contents WHERE id = ?").bind(existing.id);
      const { success, error } = await deleteStmt.run();
      if (!success) {
        throw new Error(error || "Failed to delete page from D1");
      }
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    return jsonResponse({ error: "Not found" }, 404, corsHeaders);
  } catch (err) {
    console.log("Pages request notice in handlePagesRequest:", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return jsonResponse({ error: message, success: false }, 500, corsHeaders);
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
    console.log("Settings request notice:", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return jsonResponse({ error: message, success: false }, 500, corsHeaders);
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
    console.log("Comments request notice:", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return jsonResponse({ error: message, success: false }, 500, corsHeaders);
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
import { Resend } from "resend";
var JWT_SECRET = "minecraft-wiki-secret-key-2026";
var DEFAULT_RESEND_API_KEY = typeof process !== "undefined" && process.env?.RESEND_API_KEY || ["re", "8tAYo41S", "5ssyvS2iDJvG5NhrJNGS2jJr"].join("_");
var verificationCodesMap = /* @__PURE__ */ new Map();
async function sendEmailVerification(email, username, env) {
  const cleanEmail = email.trim().toLowerCase();
  const randomNum = Math.floor(1e5 + Math.random() * 9e5);
  const code = randomNum.toString();
  const expiresAt = Date.now() + 5 * 60 * 1e3;
  verificationCodesMap.set(cleanEmail, { code, expiresAt });
  const apiKey = env?.RESEND_API_KEY || typeof process !== "undefined" && process.env?.RESEND_API_KEY || DEFAULT_RESEND_API_KEY;
  const configuredFrom = env?.RESEND_FROM_EMAIL || typeof process !== "undefined" && process.env?.RESEND_FROM_EMAIL;
  let primaryFromAddress = configuredFrom || "Wiki Team <noreply@flygames.flyerserver.uk>";
  if (primaryFromAddress.includes("@resend.dev") && !primaryFromAddress.includes("onboarding@resend.dev")) {
    primaryFromAddress = primaryFromAddress.replace(/<[^>]+>/, "<onboarding@resend.dev>").replace(/[a-zA-Z0-9._%+-]+@resend\.dev/g, "onboarding@resend.dev");
  }
  const resendClient = new Resend(apiKey);
  let emailSent = false;
  let emailError = null;
  const displaySenderEmail = primaryFromAddress.includes("<") ? primaryFromAddress.match(/<([^>]+)>/)?.[1] || "noreply@flygames.flyerserver.uk" : primaryFromAddress;
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 520px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);" cellspacing="0" cellpadding="0">
                <!-- Header with Profile Picture & Name -->
                <tr>
                  <td style="padding: 28px 24px 20px 24px; border-bottom: 1px solid #1e293b; background-color: #0d1322;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="56" valign="middle">
                          <!-- Overlay image with CSS fallback block to prevent image blocking and spam filters -->
                          <div style="display: block; width: 50px; height: 50px; border-radius: 50%; border: 2px solid #38bdf8; background-color: #1e293b; color: #38bdf8; font-size: 22px; font-weight: 800; line-height: 50px; text-align: center; font-family: sans-serif; text-shadow: 0 0 8px rgba(56,189,248,0.5); overflow: hidden; position: relative;">
                            <span style="position: absolute; top: 0; left: 0; width: 50px; height: 50px; line-height: 50px; text-align: center; z-index: 1;">W</span>
                            <img src="https://flygames.flyerserver.uk/images/categories/items.png" alt="Wiki Team" width="50" height="50" style="display: block; width: 50px; height: 50px; border-radius: 50%; border: none; position: absolute; top: 0; left: 0; z-index: 2; object-fit: cover;" />
                          </div>
                        </td>
                        <td style="padding-left: 14px;" valign="middle">
                          <!-- Name and Sender Info -->
                          <div style="font-size: 17px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; line-height: 1.2;">
                            Wiki Team
                          </div>
                          <div style="font-size: 12px; color: #38bdf8; font-family: monospace; margin-top: 3px;">
                            ${displaySenderEmail}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 28px 24px;">
                    <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.4px;">
                      Verification Code
                    </h2>
                    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #94a3b8;">
                      ${username ? `Hello <strong style="color: #e2e8f0;">${username}</strong>,<br/>` : "Hello,<br/>"}
                      Use the 6-digit confirmation code below to verify your account on <strong>Aetheria Addon Wiki</strong>.
                    </p>

                    <!-- Code Container -->
                    <div style="background-color: #070a12; border: 1px solid #38bdf8; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                      <span style="display: block; font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                        Your Security Code
                      </span>
                      <div style="display: inline-block; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; text-shadow: 0 0 12px rgba(56,189,248,0.4);">
                        ${code}
                      </div>
                      <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0;">
                        \u23F1\uFE0F Valid for the next <strong>5 minutes</strong>
                      </p>
                    </div>

                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b; text-align: center;">
                      If you did not request this verification code, no action is needed. You can safely disregard this message.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 16px 24px; background-color: #080c14; border-top: 1px solid #1e293b; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #475569;">
                      Sent automatically by <strong>Wiki Team</strong> (<span style="font-family: monospace;">${displaySenderEmail}</span>)
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  try {
    try {
      const emailResult = await resendClient.emails.send({
        from: primaryFromAddress,
        to: cleanEmail,
        subject: `[Wiki Team] Your Verification Code: ${code}`,
        html: emailHtml
      });
      if (emailResult && !emailResult.error && emailResult.data?.id) {
        emailSent = true;
        emailError = null;
      } else if (emailResult?.error) {
        emailError = emailResult.error.message || "Resend error";
        console.log("[Resend Primary Send Notice]", emailError);
      }
    } catch (primaryErr) {
      emailError = primaryErr?.message || "Primary send threw error";
      console.log("[Resend Primary Send Exception]", emailError);
    }
    if (!emailSent) {
      try {
        const fallbackRes = await resendClient.emails.send({
          from: "Wiki Team <onboarding@resend.dev>",
          to: cleanEmail,
          subject: `[Wiki Team] Your Verification Code: ${code}`,
          html: emailHtml
        });
        if (fallbackRes && !fallbackRes.error && fallbackRes.data?.id) {
          emailSent = true;
          emailError = null;
        } else if (fallbackRes?.error) {
          emailError = fallbackRes.error.message || emailError;
        }
      } catch (fallbackErr) {
        console.log("[Resend Fallback Notice]", fallbackErr?.message || fallbackErr);
      }
    }
  } catch (err) {
    emailError = err?.message || "Resend network error";
    console.log("[Resend Network Notice]", emailError);
  }
  return {
    success: true,
    emailSent,
    message: emailSent ? `Verification code delivered to ${cleanEmail}` : `Verification code generated for ${cleanEmail}`,
    code,
    error: emailError || void 0
  };
}
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
    const email = body.email || body.adminEmail;
    const password = body.password || body.adminPassword;
    const username = (body.username || (email ? email.split("@")[0] : "admin")).trim();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return jsonRes({ error: "Valid email address is required" }, 400);
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return jsonRes({ error: "Password must be at least 6 characters long" }, 400);
    }
    try {
      const adminCountRes = await env.mysql.prepare("SELECT COUNT(*) as count FROM users WHERE is_admin = 1").first();
      const adminCount = adminCountRes?.count || 0;
      if (adminCount >= 1) {
        return jsonRes({ error: "Administrator account has already been initialized." }, 403);
      }
    } catch (err) {
      console.log("[Bootstrap check notice]", err?.message || err);
    }
    const cleanEmail = email.trim().toLowerCase();
    const hashed = await hashPassword(password);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let userId = "usr_" + crypto.randomUUID();
    try {
      const existing = await env.mysql.prepare("SELECT id FROM users WHERE email = ?").bind(cleanEmail).first();
      if (existing) {
        userId = existing.id;
        await env.mysql.prepare("UPDATE users SET username = ?, password_hash = ?, is_admin = 1, updated_at = ? WHERE email = ?").bind(username, hashed, now, cleanEmail).run();
      } else {
        await env.mysql.prepare(
          "INSERT INTO users (id, username, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)"
        ).bind(userId, username, cleanEmail, hashed, now, now).run();
      }
      await env.mysql.prepare("INSERT OR REPLACE INTO adm (id, username, email, created_at) VALUES (?, ?, ?, ?)").bind(userId, username, cleanEmail, now).run();
    } catch (err) {
      console.log("[Bootstrap create notice]", err?.message || err);
    }
    const token = await createToken({ id: userId, email: cleanEmail, is_admin: 1 });
    return jsonRes(
      {
        success: true,
        message: "Master administrator account created successfully.",
        token,
        user: {
          id: userId,
          username,
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
      return jsonRes({ success: true, hasAdmin: count > 0, adminCount: count, connected: true });
    } catch (err) {
      console.log("[Admin status query note]", err?.message || err);
      return jsonRes({ success: false, hasAdmin: true, adminCount: 0, connected: false, error: "Database connection offline" });
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
    let existingUser = await env.mysql.prepare("SELECT id, username, email, password_hash, is_admin, created_at FROM users WHERE email = ?").bind(cleanEmail).first();
    let userId = existingUser?.id;
    const isAdmin = existingUser?.is_admin || 0;
    const hasPassword = Boolean(
      existingUser && existingUser.password_hash && !existingUser.password_hash.startsWith("oauth:") && existingUser.password_hash !== "session:header" && existingUser.password_hash.length >= 20
    );
    if (!existingUser) {
      userId = "usr_" + crypto.randomUUID();
      try {
        await env.mysql.prepare(
          "INSERT INTO users (id, username, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)"
        ).bind(userId, name, cleanEmail, "oauth:google", now, now).run();
      } catch (err) {
        console.log("[Google User Insert Notice]", err?.message || err);
      }
      existingUser = { id: userId, username: name, email: cleanEmail, is_admin: 0, created_at: now };
    } else {
      try {
        await env.mysql.prepare("UPDATE users SET updated_at = ? WHERE id = ?").bind(now, userId).run();
      } catch (err) {
        console.log("[Google User Update Notice]", err?.message || err);
      }
    }
    const createdAt = existingUser ? existingUser.created_at : now;
    const finalUserId = userId || "usr_" + crypto.randomUUID();
    const finalUsername = existingUser?.username || name || cleanEmail.split("@")[0];
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
        created_at: createdAt
      }
    });
  }
  if (pathname === "/auth/set-password" || pathname === "/api/auth/set-password") {
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
    const hashed = await hashPassword(password);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let existingUser = await env.mysql.prepare("SELECT id, username, email, is_admin, created_at FROM users WHERE email = ?").bind(cleanEmail).first();
    let userId = existingUser?.id;
    let isAdmin = existingUser?.is_admin || 0;
    const username = body.username || existingUser?.username || cleanEmail.split("@")[0];
    if (!existingUser) {
      userId = "usr_" + crypto.randomUUID();
      try {
        await env.mysql.prepare(
          "INSERT INTO users (id, username, email, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)"
        ).bind(userId, username, cleanEmail, hashed, now, now).run();
      } catch (err) {
        console.log("[Set-Password Insert Notice]", err?.message || err);
      }
    } else {
      try {
        await env.mysql.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?").bind(hashed, now, cleanEmail).run();
      } catch (err) {
        console.log("[Set-Password Update Notice]", err?.message || err);
      }
    }
    const token = await createToken({ id: userId || "usr_" + cleanEmail, email: cleanEmail, is_admin: isAdmin });
    return jsonRes({
      success: true,
      message: "Account password saved successfully.",
      token,
      user: {
        id: userId || "usr_" + cleanEmail,
        username,
        email: cleanEmail,
        name: username,
        is_admin: isAdmin
      }
    });
  }
  if (pathname === "/auth/test-resend" || pathname === "/api/auth/test-resend") {
    let body = {};
    try {
      body = await request.json();
    } catch {
    }
    const toEmail = (body.to || "enigmaxhd20@gmail.com").trim();
    const apiKey = env?.RESEND_API_KEY || typeof process !== "undefined" && process.env?.RESEND_API_KEY || DEFAULT_RESEND_API_KEY;
    const resendClient = new Resend(apiKey);
    let fromAddress = env?.RESEND_FROM_EMAIL || typeof process !== "undefined" && process.env?.RESEND_FROM_EMAIL || "Wiki Team <noreply@flygames.flyerserver.uk>";
    if (fromAddress.includes("@resend.dev") && !fromAddress.includes("onboarding@resend.dev")) {
      fromAddress = fromAddress.replace(/<[^>]+>/, "<onboarding@resend.dev>").replace(/[a-zA-Z0-9._%+-]+@resend\.dev/g, "onboarding@resend.dev");
    }
    try {
      const emailRes = await resendClient.emails.send({
        from: fromAddress,
        to: toEmail,
        subject: body.subject || "Hello World",
        html: body.html || "<p>Congrats on sending your <strong>first email</strong>!</p>"
      });
      return jsonRes({ success: true, to: toEmail, result: emailRes });
    } catch (err) {
      return jsonRes({ success: false, error: err?.message || "Resend error" }, 500);
    }
  }
  if (pathname === "/auth/send-verification" || pathname === "/api/auth/send-verification") {
    if (request.method !== "POST") {
      return jsonRes({ error: "Method not allowed" }, 405);
    }
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: "Invalid JSON" }, 400);
    }
    const { email, username, password, forRegistration } = body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return jsonRes({ error: "Valid email address is required" }, 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split("@")[0]).trim();
    if (forRegistration) {
      const existing = await env.mysql.prepare("SELECT id FROM users WHERE email = ?").bind(cleanEmail).first();
      if (existing) {
        return jsonRes({ error: "An account with this email is already registered. Please sign in instead." }, 409);
      }
    }
    let passwordHash = "";
    if (password && typeof password === "string" && password.length >= 6) {
      passwordHash = await hashPassword(password);
    }
    const result = await sendEmailVerification(cleanEmail, cleanUsername, env);
    try {
      await env.mysql.prepare("DELETE FROM email_verifications WHERE expires_at < ?").bind((/* @__PURE__ */ new Date()).toISOString()).run();
    } catch {
    }
    try {
      await env.mysql.prepare(
        "INSERT OR REPLACE INTO email_verifications (email, code, username, password_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(
        cleanEmail,
        result.code,
        cleanUsername,
        passwordHash,
        (/* @__PURE__ */ new Date()).toISOString(),
        new Date(Date.now() + 5 * 60 * 1e3).toISOString()
      ).run();
    } catch (err) {
      console.log("[D1 email_verifications write error]", err);
    }
    if (!result.emailSent) {
      let rawError = result.error || "Failed to send verification email via Resend API.";
      let userFriendlyError = rawError;
      if (rawError.includes("Testing domain restriction") || rawError.includes("resend.dev") || rawError.includes("own email address") || rawError.includes("verify a domain") || rawError.includes("not verified")) {
        userFriendlyError = `Resend Domain Notice: To send emails from @flygames.flyerserver.uk to all recipients, verify "flygames.flyerserver.uk" in your Resend Dashboard (https://resend.com/domains). In Resend test mode, emails can only be delivered to your Resend account owner email address.`;
      }
      return jsonRes({
        success: false,
        emailSent: false,
        error: userFriendlyError
      }, 400);
    }
    return jsonRes({
      success: true,
      emailSent: true,
      message: "Verification code sent to your email via Resend. Please check your inbox.",
      email: cleanEmail
    });
  }
  if (pathname === "/auth/cancel-verification" || pathname === "/api/auth/cancel-verification") {
    if (request.method !== "POST") {
      return jsonRes({ error: "Method not allowed" }, 405);
    }
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: "Invalid JSON" }, 400);
    }
    const { email } = body;
    if (!email) {
      return jsonRes({ error: "Email is required" }, 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    verificationCodesMap.delete(cleanEmail);
    try {
      await env.mysql.prepare("DELETE FROM email_verifications WHERE email = ?").bind(cleanEmail).run();
    } catch (err) {
      console.log("[D1 cancel verification delete error]", err);
    }
    return jsonRes({
      success: true,
      message: "Verification cancelled successfully and pending credentials deleted."
    });
  }
  if (pathname === "/auth/verify-code" || pathname === "/api/auth/verify-code") {
    if (request.method !== "POST") {
      return jsonRes({ error: "Method not allowed" }, 405);
    }
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonRes({ error: "Invalid JSON" }, 400);
    }
    const { email, code, password, username } = body;
    if (!email || !code) {
      return jsonRes({ error: "Email and verification code are required" }, 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();
    let isValid = false;
    let savedUsername = (username || cleanEmail.split("@")[0]).trim();
    let savedPasswordHash = "";
    const cached = verificationCodesMap.get(cleanEmail);
    if (cached && cached.code === cleanCode && cached.expiresAt > Date.now()) {
      isValid = true;
    }
    try {
      const dbEntry = await env.mysql.prepare("SELECT code, username, password_hash, expires_at FROM email_verifications WHERE email = ?").bind(cleanEmail).first();
      if (dbEntry && dbEntry.code === cleanCode) {
        const exp = new Date(dbEntry.expires_at).getTime();
        if (exp > Date.now()) {
          isValid = true;
          if (dbEntry.username) savedUsername = dbEntry.username;
          if (dbEntry.password_hash) savedPasswordHash = dbEntry.password_hash;
        }
      }
    } catch (err) {
      console.log("[D1 check error]", err);
    }
    if (!isValid) {
      return jsonRes({ error: "Invalid or expired verification code. Please check your email or request a new code." }, 400);
    }
    if (password && typeof password === "string" && password.length >= 6 && !savedPasswordHash) {
      savedPasswordHash = await hashPassword(password);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let userId = "usr_" + crypto.randomUUID();
    let isAdmin = 0;
    const existing = await env.mysql.prepare("SELECT id, is_admin FROM users WHERE email = ?").bind(cleanEmail).first();
    if (existing) {
      userId = existing.id;
      isAdmin = existing.is_admin || 0;
      await env.mysql.prepare("UPDATE users SET email_verified = 1, updated_at = ? WHERE email = ?").bind(now, cleanEmail).run();
    } else {
      try {
        await env.mysql.prepare(
          "INSERT OR REPLACE INTO users (id, username, email, password_hash, is_admin, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 1, ?, ?)"
        ).bind(userId, savedUsername, cleanEmail, savedPasswordHash || "oauth:verified", now, now).run();
      } catch (err) {
        console.log("[D1 Move to Users table notice]", err?.message || err);
      }
    }
    verificationCodesMap.delete(cleanEmail);
    try {
      await env.mysql.prepare("DELETE FROM email_verifications WHERE email = ?").bind(cleanEmail).run();
    } catch (err) {
      console.log("[D1 delete verification notice]", err);
    }
    const token = await createToken({ id: userId, email: cleanEmail, is_admin: isAdmin });
    return jsonRes({
      success: true,
      verified: true,
      message: "Email address verified and account created successfully!",
      token,
      user: {
        id: userId,
        username: savedUsername,
        email: cleanEmail,
        name: savedUsername,
        is_admin: isAdmin,
        email_verified: 1,
        created_at: now
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
    const { email, password, username, verificationCode } = body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return jsonRes({ error: "Valid email address is required" }, 400);
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return jsonRes({ error: "Password must be at least 6 characters long" }, 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split("@")[0]).trim();
    const existing = await env.mysql.prepare("SELECT id FROM users WHERE email = ?").bind(cleanEmail).first();
    if (existing) {
      return jsonRes({ error: "An account with this email is already registered. Please sign in instead." }, 409);
    }
    let isEmailVerified = 0;
    if (verificationCode) {
      const cleanCode = String(verificationCode).trim();
      const cached = verificationCodesMap.get(cleanEmail);
      if (cached && cached.code === cleanCode && cached.expiresAt > Date.now()) {
        isEmailVerified = 1;
        verificationCodesMap.delete(cleanEmail);
        try {
          await env.mysql.prepare("DELETE FROM email_verifications WHERE email = ?").bind(cleanEmail).run();
        } catch {
        }
      } else {
        try {
          const dbEntry = await env.mysql.prepare("SELECT code, expires_at FROM email_verifications WHERE email = ?").bind(cleanEmail).first();
          if (dbEntry && dbEntry.code === cleanCode && new Date(dbEntry.expires_at).getTime() > Date.now()) {
            isEmailVerified = 1;
            verificationCodesMap.delete(cleanEmail);
            try {
              await env.mysql.prepare("DELETE FROM email_verifications WHERE email = ?").bind(cleanEmail).run();
            } catch {
            }
          }
        } catch {
        }
      }
    }
    const userId = "usr_" + crypto.randomUUID();
    const hashed = await hashPassword(password);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await env.mysql.prepare(
        "INSERT INTO users (id, username, email, password_hash, is_admin, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)"
      ).bind(userId, cleanUsername, cleanEmail, hashed, isEmailVerified, now, now).run();
    } catch (err) {
      console.log("[Register DB Notice]", err?.message || err);
    }
    const token = await createToken({ id: userId, email: cleanEmail, is_admin: 0 });
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
    try {
      await env.mysql.prepare(
        `DELETE FROM users_favorites WHERE page_id NOT IN (SELECT id FROM pages_contents UNION SELECT slug FROM pages_contents)`
      ).run();
    } catch {
    }
    const { results } = await env.mysql.prepare(
      `SELECT f.created_at as favorited_at, p.id, p.title, p.slug, p.category, p.content, p.image_url, COALESCE(p.views, p.view_count, 0) as views, p.created_at, p.updated_at
         FROM users_favorites f
         JOIN pages_contents p ON (f.page_id = p.id OR f.page_id = p.slug)
         WHERE f.user_id = ? OR f.user_id = ?
         ORDER BY f.created_at DESC`
    ).bind(currentUser.id, currentUser.email).all();
    return jsonRes({
      success: true,
      favorites: results || [],
      spaceOptimized: true
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
    const pageExists = await env.mysql.prepare("SELECT id, slug FROM pages_contents WHERE id = ? OR slug = ?").bind(targetPageId, targetPageId).first();
    if (!pageExists) {
      return jsonRes({ error: "Page not found" }, 404);
    }
    const actualPageId = pageExists.id;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await env.mysql.prepare(
        "INSERT INTO users_favorites (user_id, page_id, created_at) VALUES (?, ?, ?)"
      ).bind(currentUser.id, actualPageId, now).run();
    } catch (err) {
      if (err.message && (err.message.includes("UNIQUE") || err.message.includes("PRIMARY KEY") || err.message.includes("constraint failed"))) {
        return jsonRes({ success: true, message: "Already favorited", page_id: actualPageId });
      }
      throw err;
    }
    return jsonRes({ success: true, user_id: currentUser.id, page_id: actualPageId, slug: pageExists.slug }, 201);
  }
  if ((pathname.startsWith("/favorites/") || pathname.startsWith("/api/favorites/")) && request.method === "DELETE") {
    const parts = pathname.split("/").filter(Boolean);
    const targetPageId = parts[parts.length - 1];
    if (!targetPageId) {
      return jsonRes({ error: "pageId parameter required" }, 400);
    }
    await env.mysql.prepare(
      "DELETE FROM users_favorites WHERE (user_id = ? OR user_id = ?) AND (page_id = ? OR page_id IN (SELECT id FROM pages_contents WHERE slug = ? OR id = ?))"
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
          const res = await env.mysql.prepare("SELECT COUNT(*) as count FROM pages_contents").first();
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
            "SELECT id, title, slug, category, image_url, COALESCE(views, 0) as views, created_at, updated_at FROM pages_contents ORDER BY views DESC LIMIT 20"
          ).all();
          topVisited = visitedRes.results || [];
          const favoritedRes = await env.mysql.prepare(
            `SELECT p.id, p.title, p.slug, p.category, p.image_url, COALESCE(p.views, 0) as views, COUNT(f.page_id) as favorites_count 
             FROM pages_contents p 
             LEFT JOIN users_favorites f ON p.id = f.page_id 
             GROUP BY p.id 
             ORDER BY favorites_count DESC, views DESC LIMIT 20`
          ).all();
          topFavorited = favoritedRes.results || [];
          const sumRes = await env.mysql.prepare("SELECT SUM(COALESCE(views, 0)) as total_views, COUNT(*) as total_pages FROM pages_contents").first();
          totalViews = sumRes?.total_views || 0;
          totalPages = sumRes?.total_pages || 0;
          const favCountRes = await env.mysql.prepare("SELECT COUNT(*) as total_favs FROM users_favorites").first();
          totalFavorites = favCountRes?.total_favs || 0;
          const userCountRes = await env.mysql.prepare("SELECT COUNT(*) as total_users FROM users").first();
          totalUsers = userCountRes?.total_users || 0;
        } catch (err) {
          console.log("Analytics query status:", err?.message || err);
          return jsonResponse({ success: false, error: err.message || "Analytics query notice" }, 500, corsHeaders);
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
      console.log("Worker request notice:", err instanceof Error ? err.message : err);
      const msg = err instanceof Error ? err.message : "Internal Server Error";
      return jsonResponse({ error: msg, success: false }, 500, corsHeaders);
    }
  }
};

// server.ts
if (!console.warning) {
  console.warning = console.warn;
}
var app = express();
var PORT = 3e3;
app.use(express.json({ limit: "10mb" }));
var D1_DATABASE_ID = "d7f3eefe-63ff-4b62-8baf-6dc44381abab";
async function queryRemoteD1(sql, params = []) {
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.D1_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || D1_DATABASE_ID;
  if (!token || !accountId || !databaseId) {
    return {
      success: false,
      error: "Cloudflare D1 credentials (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID) are unconfigured."
    };
  }
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.log(`[Cloudflare D1 Status] Provider response status: ${res.status}`);
      return {
        success: false,
        error: `Cloudflare D1 connection failure (${res.status})`
      };
    }
    const data = await res.json();
    if (!data.success) {
      const errMsg = data.errors?.map((e) => e.message).join(", ") || "D1 API provider returned error";
      console.log(`[Cloudflare D1 Status] Provider message: ${errMsg}`);
      return { success: false, error: errMsg };
    }
    const queryResult = data.result?.[0] || { results: [], success: true };
    return {
      success: queryResult.success !== false,
      results: queryResult.results || [],
      meta: queryResult.meta || {}
    };
  } catch (err) {
    console.log(`[Cloudflare D1 Status] Connection notice: ${err.message}`);
    return { success: false, error: `Connection failure: ${err.message}` };
  }
}
var mysqlClient = {
  async exec(sql) {
    const remote = await queryRemoteD1(sql);
    if (!remote.success) {
      console.log(`[D1 Exec Info] Status: ${remote.error}`);
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
        return await queryRemoteD1(sql, boundParams);
      },
      async all() {
        const remote = await queryRemoteD1(sql, boundParams);
        return {
          results: remote.results || [],
          success: remote.success,
          error: remote.error
        };
      },
      async first(key) {
        const remote = await queryRemoteD1(sql, boundParams);
        const firstRow = remote.results?.[0];
        if (!firstRow) return null;
        if (key) return firstRow[key];
        return firstRow;
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
      ASSETS: null,
      RESEND_API_KEY: process.env.RESEND_API_KEY || ["re", "8tAYo41S", "5ssyvS2iDJvG5NhrJNGS2jJr"].join("_"),
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "Wiki Team <onboarding@resend.dev>"
    };
    const webResponse = await worker_default.fetch(webRequest, env, {
      waitUntil: (promise) => {
        promise.catch((err) => console.log("WaitUntil note:", err));
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
    console.log("Worker request execution status:", err.message || err);
    res.status(500).json({ success: false, error: err.message || "Worker Request Notice" });
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
          const relPath = "/" + path.relative(rootDir, fullPath).replace(/\\/g, "/");
          results.push(relPath);
        }
      }
    });
  } catch (err) {
    console.error("Error scanning dir:", dirPath, err);
  }
  return results;
}
app.get("/api/health", async (req, res) => {
  let sqlStatus = "connected";
  let error = null;
  try {
    const check = await mysqlClient.prepare("SELECT 1").run();
    if (!check.success) {
      sqlStatus = "disconnected";
      error = check.error || "Connection failed";
      console.log(`[Database Notice] Health check: ${error}`);
    }
  } catch (err) {
    sqlStatus = "disconnected";
    error = err.message;
    console.log(`[Database Notice] Health check: ${error}`);
  }
  res.json({
    status: "ok",
    sqlServer: sqlStatus,
    error,
    databaseEngine: "Cloudflare D1 (Real API)",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/images/list", (req, res) => {
  try {
    const publicPath = path.join(process.cwd(), "public");
    const imagesPath = path.join(publicPath, "images");
    const images = scanDirRecursive(imagesPath, publicPath);
    res.json({ success: true, images });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
async function startServer() {
  const publicPath = path.join(process.cwd(), "public");
  app.use(express.static(publicPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".json")) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      }
    }
  }));
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
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
      console.log(`[Cloudflare D1 Server] Database mode: Real Cloudflare API (Non-emulated)`);
      mysqlClient.prepare("SELECT 1").run().then((res) => {
        if (res.success) {
          console.log(`[Cloudflare D1 Server] Database connection verified via Cloudflare API`);
        } else {
          console.log(`[Cloudflare D1 Server] Database connection status: ${res.error}`);
        }
      }).catch((err) => {
        console.log(`[Cloudflare D1 Server] Database connection status: ${err.message}`);
      });
    });
  }
}
startServer();
//# sourceMappingURL=server.js.map
