# LockifyAuto — Deploy frontend & backend separately

The repo is split into two apps:

| Folder | Role | Default local URL |
|--------|------|-------------------|
| `frontend/` | React + Vite UI | http://localhost:5173 |
| `backend/` | Express REST API | http://localhost:5000 |
| `shared/` | Zod schemas/types (used by both) | — |

## Local development

1. Copy env for the API:

   ```powershell
   copy backend\.env.example backend\.env
   ```

   Fill in `MONGO_URI`, `MONGO_DB_NAME`, `JWT_SECRET`.

   **Separate dev DB for testing:** copy `backend/.env.development.example` to `backend/.env.development` and set `MONGO_DB_NAME=lumora_dev` (same cluster URI, different database). Production (Render) keeps `MONGO_DB_NAME=lumora`.

2. Install and run both (from repo root):

   ```powershell
   npm install
   npm run dev
   ```

   - Backend: port **5000**
   - Frontend: port **5173** (proxies `/api` → backend)

3. Open **http://localhost:5173**

Optional: run in two terminals:

```powershell
npm run dev:backend
npm run dev:frontend
```

## Deploy backend (API)

Host any Node platform (Render, Railway, Fly.io, etc.).

### Render (Web Service)

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |

If build fails with `esbuild: not found`, Render skipped devDependencies (`NODE_ENV=production` during install). This repo keeps `esbuild` in **dependencies** so the build works. Alternatively use:

`NPM_CONFIG_PRODUCTION=false npm install && npm run build`

**Environment variables** (Render dashboard → Environment):

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | your Atlas connection string |
| `MONGO_DB_NAME` | `lumora` |
| `JWT_SECRET` | strong random secret |

Do not set `PORT` — Render injects it automatically.

**Critical:** `MONGO_URI` is required. If MongoDB is missing or unreachable, the API **will not start** (no in-memory fallback). After adding env vars, open **Logs** and confirm:

```text
[storage] Connected to MongoDB
```

Optional: use the included `render.yaml` blueprint (repo root → **New Blueprint** on Render).

### Other hosts

| Setting | Value |
|---------|--------|
| Root directory | `backend` (or monorepo with build command below) |
| Build command | `npm install && npm run build` |
| Start command | `npm run start` |
| Port | `5000` (or platform `PORT`) |

**Environment variables:**

- `MONGO_URI`
- `MONGO_DB_NAME`
- `JWT_SECRET`
- `PORT` (often set by the host)

**Monorepo build from repository root:**

```bash
npm install
npm run build:backend
cd backend && npm run start
```

Note your public API URL, e.g. `https://lockify-api.onrender.com` (no trailing slash).

### MongoDB Atlas

- Allow network access for your host (or `0.0.0.0/0` with strong credentials).
- Use the connection string in `MONGO_URI`.
- **Free (M0) clusters pause after 30 days with zero connections.** Paid Atlas does not. To stay on free, keep a real DB ping happening (see keep-alive below).

### Keep Atlas awake (bi-weekly ping + EmailJS)

A GitHub Action pings Mongo **directly** (not via Render) on the **1st and 15th at 08:17 UTC** (1:47 PM IST) and emails **parthivshah293@gmail.com** with:

- that a health ping was sent
- whether Mongo is **awake** or **not awake**
- the **next ping date and time** (IST and UTC)

**1. EmailJS template**

1. Sign up at [https://www.emailjs.com](https://www.emailjs.com).
2. Add an email service (Gmail is fine).
3. Create a template. Set **To email** to `{{to_email}}`.
4. Use an **HTML** template (not plain text). Colors only work in inline `style` attributes.

   Variables:
   - `{{green}}` = `#16a34a` (always)
   - `{{red}}` = `#dc2626` (always)
   - `{{status_color}}` = green when Mongo is awake, red when it is not

   Body example:

```html
<h2>Lumora Mongo ping</h2>
<p>Hi {{to_name}},</p>
<p>A health ping was sent to MongoDB Atlas.</p>
<p>
  Status:
  <strong style="color: {{status_color}};">{{mongo_status}}</strong>
</p>
<p>Ping time: {{ping_at}}</p>
<p>Next ping: {{next_ping_at}}</p>
<p>{{message}}</p>
```

   Or use the two colors yourself, e.g. `style="color: {{green}};"` / `style="color: {{red}};"`.

5. Account → **General** → copy Public Key. Enable **Use Private Key** (needed for GitHub Actions) and copy the private key.
6. Account → **Security** → allow API requests from **non-browser applications**.
7. Copy **Service ID** and **Template ID**.

**2. GitHub secrets**

Repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Value |
|--------|--------|
| `MONGO_URI` | same Atlas URI as production |
| `EMAILJS_SERVICE_ID` | from EmailJS |
| `EMAILJS_TEMPLATE_ID` | from EmailJS |
| `EMAILJS_PUBLIC_KEY` | EmailJS public key |
| `EMAILJS_PRIVATE_KEY` | EmailJS private key |

**3. Atlas Network Access**

Allow `0.0.0.0/0` so GitHub-hosted runners can connect. Merge the workflow onto the **default branch**, then **Actions** → **Mongo health ping** → **Run workflow** to test a mail immediately.

Schedule: `.github/workflows/mongo-health-ping.yml` (`17 8 1,15 * *`). GitHub can delay scheduled jobs.

Each run **commits** `.github/last-mongo-ping.txt`. That push counts as repo activity, so GitHub will not auto-disable the schedule after 60 idle days. You will see a bot commit twice a month; that is expected.

If branch protection blocks the bot from pushing to `main`, allow GitHub Actions to write, or the 60-day disable can return.

**Zero babysitting:** upgrade Atlas off the Free tier so it never auto-pauses.

---

## Deploy frontend (UI)

Host as a **static site** (Netlify, Vercel, Cloudflare Pages, etc.).

| Setting | Value |
|---------|--------|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `dist` |

**Required environment variable** (after backend is live):

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://lockify-api.onrender.com` |

Without `VITE_API_URL`, the built app calls `/api` on the frontend domain and login/API will fail.

### Netlify (from repo root)

`netlify.toml` is already configured with `base = "frontend"`.

1. Connect the Git repo on Netlify.
2. Site settings → Environment variables → add `VITE_API_URL` = your backend URL.
3. Deploy.

### Vercel

1. Import project; set **Root Directory** to `frontend`.
2. Build: `npm run build`, output: `dist`.
3. Add `VITE_API_URL` in Environment Variables.
4. Deploy.

---

## Deploy order

1. Deploy **backend** first and confirm it responds (e.g. `POST /api/auth/login` returns JSON, not HTML).
2. Set `VITE_API_URL` on the frontend host to that backend URL.
3. Deploy **frontend**.

---

## Production checklist

- [ ] Backend env: `MONGO_URI`, `MONGO_DB_NAME`, `JWT_SECRET` (strong secret)
- [ ] Frontend env: `VITE_API_URL` = backend origin (HTTPS)
- [ ] MongoDB allows connections from the backend host
- [ ] Keep-alive: GitHub secrets `MONGO_URI` + EmailJS keys; test **Mongo health ping** workflow
- [ ] Test register/login on the live frontend URL

---

## Remove legacy `client/` folder

If `client/` still exists next to `frontend/` (copy from migration), close editors using it and delete:

```powershell
Remove-Item -Recurse -Force client
```

The app now lives only under `frontend/` and `backend/`.
