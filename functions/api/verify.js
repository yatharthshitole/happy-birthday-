/**
 * Cloudflare Pages Function — /api/verify
 * GET (Authorization: Bearer <token>) → { valid: bool }
 */

export async function onRequestGet({ request, env }) {
  const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  const secret = env.SESSION_SECRET || "change-me-to-long-random-secret-xyz";
  const auth   = request.headers.get("Authorization") || "";
  const token  = auth.replace("Bearer ", "").trim();
  const valid  = token ? await verifyToken(token, secret) : false;
  return new Response(JSON.stringify({ valid }), { headers: cors });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

async function verifyToken(token, secret) {
  try {
    const [enc, sig] = token.split(".");
    if (!enc || !sig) return false;
    const payload = atob(enc);
    const expires = parseInt(payload.split("-")[1]);
    if (!expires || Date.now() > expires) return false;
    const expected = await hmac(payload, secret);
    return sig === expected;
  } catch { return false; }
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
