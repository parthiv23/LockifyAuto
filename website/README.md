# Lumora website

Marketing site for Lumora. Vite + React + TypeScript.

This site does **not** store passwords. The real app lives in `frontend/` + `backend/`. **Open Lumora**, **Create account**, and **Forgot password** go to:

- https://lumora0.netlify.app/login
- https://lumora0.netlify.app/register
- https://lumora0.netlify.app/forgot-password

## Run locally

From the **repo root**:

```powershell
npm install
npm run dev:website
```

Open **http://localhost:5174**. CTAs open the live app.

## Environment

Copy `.env.example` to `.env.development` if needed. Vite already ships a development default:

| Variable | Default |
|----------|---------|
| `VITE_APP_URL` | `https://lumora0.netlify.app` |

## Build

From the **repo root**:

```powershell
npm run build:website
```

Production builds read `website/.env.production` (`VITE_APP_URL=https://lumora0.netlify.app`). Output: `website/dist/`

Preview: `npm run preview` in `website/` → **http://localhost:4174**

## Deploy

Host `website/dist` as a **separate** static site from the app. `netlify.toml` in this folder is ready for a second Netlify site.

| Setting | Value |
|---------|--------|
| Base directory | `website` |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Env | `VITE_APP_URL=https://lumora0.netlify.app` |

SPA fallback: `public/_redirects` rewrites `/*` → `/index.html`.
