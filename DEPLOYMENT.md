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
- [ ] Test register/login on the live frontend URL

---

## Remove legacy `client/` folder

If `client/` still exists next to `frontend/` (copy from migration), close editors using it and delete:

```powershell
Remove-Item -Recurse -Force client
```

The app now lives only under `frontend/` and `backend/`.
