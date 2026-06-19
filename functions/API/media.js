/**
 * Cloudflare Pages Function — /api/media
 * GET ?key=img1|img2...|song  (Authorization: Bearer <token>)
 *
 * Proxies assets from /public/assets/ but ONLY after token verification.
 * The browser never knows the real file path.
 */

const ASSET_MAP = {
  img1: "/assets/img1.jpg",
  img2: "/assets/img2.jpg",
  img3: "/assets/img3.jpg",
  img4: "/assets/img4.jpg",
  img5: "/assets/img5.jpg",
  img6: "/assets/img6.jpg",
  img7: "/assets/img7.jpg",
  song: "/assets/song.mp3",
};

const MIME_MAP = {
  img1: "image/jpeg", img2: "image/jpeg", img3: "image/jpeg",
  img4: "image/jpeg", img5: "image/jpeg", img6: "image/jpeg",
  img7: "image/jpeg", song: "audio/mpeg",
};

export async function onRequestGet({ request, env, params }) {
  const secret = env.SESSION_SECRET || "change-me-to-long-random-secret-xyz";

  // 1. Auth check
  const auth  = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token || !(await verifyToken(token, secret))) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Key lookup
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key || !ASSET_MAP[key]) {
    return new Response("Not found", { status: 404 });
  }

  // 3. Fetch the asset from the Pages site itself
  //    On Cloudflare Pages, ASSETS binding lets us fetch static files.
  const assetPath = ASSET_MAP[key];

  try {
    // Use ASSETS binding if available (Cloudflare Pages)
    if (env.ASSETS) {
      const assetUrl = new URL(assetPath, request.url).href;
      const assetResp = await env.ASSETS.fetch(assetUrl);
      if (!assetResp.ok) return new Response("Asset not found", { status: 404 });

      return new Response(assetResp.body, {
        status: 200,
        headers: {
          "Content-Type": MIME_MAP[key],
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Fallback: fetch from origin URL
    const origin = new URL(request.url).origin;
    const resp = await fetch(`${origin}${assetPath}`);
    if (!resp.ok) return new Response("Asset not found", { status: 404 });

    return new Response(resp.body, {
      status: 200,
      headers: {
        "Content-Type": MIME_MAP[key],
        "Cache-Control": "private, no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response("Error fetching asset", { status: 500 });
  }
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

// ── Token verification ─────────────────────────────────────────
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
