var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

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
__name(jsonResponse, "jsonResponse");
function generateSlug(title) {
  return title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
__name(generateSlug, "generateSlug");
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
    schemaInitialized = true;
  } catch (err) {
    console.error("Failed to ensure D1 pages table schema:", err);
    throw err;
  }
}
__name(ensureSchema, "ensureSchema");
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
__name(handlePagesRequest, "handlePagesRequest");

// src/auth/password.ts
function bufToHex(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}
__name(bufToHex, "bufToHex");
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
__name(hexToBuf, "hexToBuf");
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
__name(timingSafeEqual, "timingSafeEqual");
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
__name(hashPassword, "hashPassword");
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
__name(verifyPassword, "verifyPassword");

// worker/auth.ts
var JWT_SECRET = "minecraft-wiki-secret-key-2026";
function str2ab(str) {
  return new TextEncoder().encode(str);
}
__name(str2ab, "str2ab");
function buf2base64url(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(buf2base64url, "buf2base64url");
function base64url2str(b64u) {
  let b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }
  return atob(b64);
}
__name(base64url2str, "base64url2str");
async function getHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    str2ab(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
__name(getHmacKey, "getHmacKey");
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
__name(createToken, "createToken");
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
    return { id: payload.id, email: payload.email };
  } catch {
    return null;
  }
}
__name(verifyToken, "verifyToken");
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
__name(extractAuthToken, "extractAuthToken");
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
      let existingUser = await env.mysql.prepare("SELECT id, email FROM users WHERE email = ?").bind(cleanEmail).first();
      if (existingUser) {
        return { id: existingUser.id, email: existingUser.email };
      } else {
        const newId = "usr_" + crypto.randomUUID();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await env.mysql.prepare("INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").bind(newId, cleanEmail, "session:header", now, now).run();
        return { id: newId, email: cleanEmail };
      }
    } catch {
      return { id: "usr_" + cleanEmail.replace(/[^a-zA-Z0-9]/g, "_"), email: cleanEmail };
    }
  }
  return null;
}
__name(authenticateRequest, "authenticateRequest");
async function handleAuthRequest(request, url, env, corsHeaders) {
  const pathname = url.pathname;
  const jsonRes = /* @__PURE__ */ __name((data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }, "jsonRes");
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
    let existingUser = await env.mysql.prepare("SELECT id, email, created_at FROM users WHERE email = ?").bind(cleanEmail).first();
    let userId = existingUser?.id;
    if (!existingUser) {
      userId = "usr_" + crypto.randomUUID();
      await env.mysql.prepare(
        "INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(userId, cleanEmail, "oauth:google", now, now).run();
      existingUser = { id: userId, email: cleanEmail, created_at: now };
    } else {
      await env.mysql.prepare("UPDATE users SET updated_at = ? WHERE id = ?").bind(now, userId).run();
    }
    const createdAt = existingUser ? existingUser.created_at : now;
    const finalUserId = userId || "usr_" + crypto.randomUUID();
    const token = await createToken({ id: finalUserId, email: cleanEmail });
    return jsonRes({
      success: true,
      token,
      user: {
        id: finalUserId,
        email: cleanEmail,
        name,
        created_at: createdAt
      }
    });
  }
  if (pathname === "/auth/signup" || pathname === "/api/auth/signup") {
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
      "INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(userId, cleanEmail, hashed, now, now).run();
    const token = await createToken({ id: userId, email: cleanEmail });
    return jsonRes(
      {
        success: true,
        token,
        user: {
          id: userId,
          email: cleanEmail,
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
    const user = await env.mysql.prepare("SELECT id, email, password_hash FROM users WHERE email = ?").bind(cleanEmail).first();
    if (!user) {
      return jsonRes({ error: "Invalid email or password" }, 401);
    }
    const isMatch = await verifyPassword(String(password), user.password_hash);
    if (!isMatch) {
      return jsonRes({ error: "Invalid email or password" }, 401);
    }
    const token = await createToken({ id: user.id, email: user.email });
    return jsonRes({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  }
  return jsonRes({ error: "Not found" }, 404);
}
__name(handleAuthRequest, "handleAuthRequest");
async function handleFavoritesRequest(request, url, env, corsHeaders) {
  const pathname = url.pathname;
  const jsonRes = /* @__PURE__ */ __name((data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }, "jsonRes");
  const currentUser = await authenticateRequest(request, env);
  if (!currentUser) {
    return jsonRes({ error: "Unauthorized. Please log in." }, 401);
  }
  if ((pathname === "/favorites" || pathname === "/api/favorites") && request.method === "GET") {
    const { results } = await env.mysql.prepare(
      `SELECT f.id as favorite_id, f.created_at as favorited_at, p.id, p.title, p.slug, p.content, p.image_url, p.created_at, p.updated_at
         FROM favorites f
         JOIN pages p ON f.page_id = p.id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC`
    ).bind(currentUser.id).all();
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
    const pageExists = await env.mysql.prepare("SELECT id FROM pages WHERE id = ? OR slug = ?").bind(targetPageId, targetPageId).first();
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
        return jsonRes({ message: "Already favorited", favorite_id: favId });
      }
      throw err;
    }
    return jsonRes({ success: true, favorite_id: favId, page_id: targetPageId }, 201);
  }
  if ((pathname.startsWith("/favorites/") || pathname.startsWith("/api/favorites/")) && request.method === "DELETE") {
    const parts = pathname.split("/").filter(Boolean);
    const targetPageId = parts[parts.length - 1];
    if (!targetPageId) {
      return jsonRes({ error: "pageId parameter required" }, 400);
    }
    await env.mysql.prepare("DELETE FROM favorites WHERE user_id = ? AND (page_id = ? OR page_id IN (SELECT id FROM pages WHERE slug = ?))").bind(currentUser.id, targetPageId, targetPageId).run();
    return jsonRes({ success: true, message: "Removed from favorites" });
  }
  return jsonRes({ error: "Not found" }, 404);
}
__name(handleFavoritesRequest, "handleFavoritesRequest");

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
      if (pathname === "/auth/signup" || pathname === "/api/auth/signup" || pathname === "/auth/login" || pathname === "/api/auth/login" || pathname === "/auth/google" || pathname === "/api/auth/google") {
        return await handleAuthRequest(request, url, env, corsHeaders);
      }
      if (pathname === "/favorites" || pathname.startsWith("/favorites/") || pathname === "/api/favorites" || pathname.startsWith("/api/favorites/")) {
        return await handleFavoritesRequest(request, url, env, corsHeaders);
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
      if (pathname === "/api/admin/verify" || pathname === "/admin/verify") {
        if (request.method !== "POST") {
          return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
        }
        let body = {};
        try {
          body = await request.json();
        } catch {
        }
        const username = (body.username || "").trim();
        const password = (body.password || "").trim();
        const email = (body.email || "").trim().toLowerCase();
        const isUserValid = username === "adm" || username === "admin" || username === "Administrator";
        const isPassValid = password === "hd189733b";
        const isEmailValid = email === "ruanpablolopesbritor@gmail.com" || email === "ruanpablolopesbritoruan@gmail.com";
        if (isUserValid && isPassValid || isEmailValid) {
          return jsonResponse({ success: true, message: "Authentication successful via Cloudflare D1." }, 200, corsHeaders);
        }
        return jsonResponse({ success: false, message: "Incorrect administrator username or password." }, 401, corsHeaders);
      }
      if (pathname === "/api/admin/database-stats" || pathname === "/admin/database-stats") {
        let pageCount = 0;
        try {
          await ensureSchema(env);
          const res = await env.mysql.prepare("SELECT COUNT(*) as count FROM pages").first();
          pageCount = res?.count || 0;
        } catch {
        }
        return jsonResponse({
          success: true,
          storedIn: "Cloudflare D1",
          pagesCount: pageCount,
          users: [{ username: "adm", role: "admin", created_at: (/* @__PURE__ */ new Date()).toISOString() }]
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
        let path = normalizedUrl.pathname;
        if (path.startsWith("/api/sql/pages")) {
          path = path.replace("/api/sql", "");
        } else if (path.startsWith("/api/admin/pages")) {
          path = path.replace("/api/admin", "");
        } else if (path.startsWith("/admin/pages")) {
          path = path.replace("/admin", "");
        } else if (path.startsWith("/api/pages")) {
          path = path.replace("/api", "");
        }
        normalizedUrl.pathname = path;
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

// ../../root/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../root/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-DjYoTE/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../root/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-DjYoTE/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
