# 🌷 Birthday Website — Payal from Ayush
### Secured by Yatharth 😎

Premium romantic birthday website built with HTML/CSS/JS + Cloudflare Pages Functions.
Deployed directly from GitHub. No separate Worker needed.

---

## 📁 Repo Structure

```
/
├── public/
│   ├── index.html          ← The entire website
│   ├── assets/
│   │   ├── img1.jpg        ← "Ayu Love Payal" hero image  ← YOU ADD THIS
│   │   ├── img2.jpg        ← Payal's photos               ← YOU ADD THESE
│   │   ├── img3.jpg
│   │   ├── img4.jpg
│   │   ├── img5.jpg
│   │   ├── img6.jpg
│   │   ├── img7.jpg
│   │   └── song.mp3        ← Birthday song                ← YOU ADD THIS
│   ├── _headers            ← Blocks direct /assets/* access
│   └── _redirects          ← Redirects /assets/* to 403
├── functions/
│   └── api/
│       ├── login.js        ← POST /api/login  (password check)
│       ├── verify.js       ← GET  /api/verify (token check)
│       └── media.js        ← GET  /api/media  (secure file proxy)
├── wrangler.toml
└── README.md
```

---

## 🚀 Step-by-Step Deployment

### Step 1 — Add Your Files to the Repo

In your GitHub repo, add your media inside `public/assets/`:

```
public/assets/img1.jpg   ← hero image ("Ayu Love Payal")
public/assets/img2.jpg
public/assets/img3.jpg
public/assets/img4.jpg
public/assets/img5.jpg
public/assets/img6.jpg
public/assets/img7.jpg
public/assets/song.mp3
```

> **Note:** The `/assets/` folder is technically in the public repo, BUT:
> - `_redirects` returns 403 for direct `/assets/*` URLs
> - The actual image/audio data is only delivered through `/api/media`
>   after successful login (token verified server-side)
> - So even if someone sees the HTML source, they can't get the files

---

### Step 2 — Connect GitHub to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. Choose **Pages** → **Connect to Git**
3. Authorize GitHub, select your repo
4. Configure build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `public`
5. Click **Save and Deploy**

Cloudflare will auto-detect the `functions/` folder and deploy them as Pages Functions.

---

### Step 3 — Set Environment Variables (Secrets)

In Cloudflare Dashboard → your Pages project → **Settings** → **Environment Variables**:

| Variable | Value | Type |
|---|---|---|
| `PASSWORD` | `AyushLovesPayal` (or your choice) | **Secret** (encrypted) |
| `SESSION_SECRET` | Any long random string like `xK9mP2qR7vN4wL8jT3` | **Secret** (encrypted) |

Click **Add variable** for each, toggle **Encrypt** → Save.

Then **redeploy** once (Deployments → Retry deployment) so Functions pick up the secrets.

---

### Step 4 — Done! 🎉

Your site will be live at: `https://birthday-payal.pages.dev`

Every push to `main` branch auto-deploys via Cloudflare Pages CI/CD.

---

## 🔐 Security Model

```
Browser              Cloudflare Pages         public/assets/
   │                       │                       │
   │── POST /api/login ───>│                       │
   │   { password }        │ Verifies password      │
   │<── { token } ─────────│ (server-side only)     │
   │                       │                       │
   │── GET /api/media ─────>│                       │
   │   ?key=img1            │── reads file ─────────>│
   │   Bearer <token>       │<── blob ──────────────│
   │<── proxied blob ───────│                       │
   │                       │                       │
   │── GET /assets/img1.jpg >│                       │
   │   (direct attempt)     │ → 403 Forbidden       │
```

**What's protected:**
- ✅ Password verified server-side only (Pages Function)
- ✅ Token is HMAC-SHA256 signed, expires in 12 hours
- ✅ Images/audio served only through authenticated `/api/media` proxy
- ✅ Direct `/assets/*` access blocked by `_redirects` → 403
- ✅ No secrets in HTML, JS, DevTools, or network requests
- ✅ Inspect Element reveals nothing useful

---

## 🛠️ Local Development

```bash
npm install -g wrangler

# Run locally (Pages + Functions together)
wrangler pages dev public --compatibility-date=2024-09-23

# Set local secrets in .dev.vars file:
echo 'PASSWORD=AyushLovesPayal' >> .dev.vars
echo 'SESSION_SECRET=local-dev-secret' >> .dev.vars
```

Then open `http://localhost:8788`

---

## 💛 Made with love by Ayush, for Payal
### Secured by Yatharth — Crack if you can 😎
