/**
 * Cloudflare Pages Function — /api/login
 * POST { password } → { success, token }
 *
 * Set these in Cloudflare Pages → Settings → Environment Variables (Encrypted):
 *   PASSWORD       = the login password
 *   SESSION_SECRET = a long random string
 */

export async function onRequestPost({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  let body;
  try { body = await request.json(); } catch { body = {}; }

  const password = env.PASSWORD || "AyushLovesPayal";
  const secret   = env.SESSION_SECRET || "change-me-to-long-random-secret-xyz";

  if (!body.password) {
    return new Response(JSON.stringify({ error: "No password" }), { status: 400, headers: cors });
  }

  // Constant-time comparison
  const enc = new TextEncoder();
  const a = enc.encode(body.password);
  const b = enc.encode(password);
  let diff = a.length !== b.length ? 1 : 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= a[i] ^ b[i];

  if (diff !== 0) {
    return new Response(JSON.stringify({ success: false }), { status: 401, headers: cors });
  }

  const token = await createToken(secret);
  return new Response(JSON.stringify({ success: true, token }), { status: 200, headers: cors });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// ── Token helpers ──────────────────────────────────────────────
async function createToken(secret) {
  const expires = Date.now() + 12 * 60 * 60 * 1000; // 12 hours
  const payload = `bp-${expires}`;
  const sig = await hmac(payload, secret);
  return btoa(payload) + "." + sig;
}

async function hmac(payload, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
