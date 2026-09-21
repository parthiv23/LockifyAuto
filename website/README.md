# Lumora website

Marketing site for Lumora. Same layout as `frontend/`: Vite + React + TypeScript.

Does not talk to the Lockify API. The app lives in `frontend/` + `backend/`.

## Run locally

From the **repo root**:

```powershell
npm install
npm run dev:website
```

Or from this folder:

```powershell
cd website
npm install
npm run dev
```

Open **http://localhost:5174**

## Build

From the **repo root**:

```powershell
npm run build:website
```

Or from this folder:

```powershell
cd website
npm run build
```

Output: `website/dist/`

Preview the production build:

```powershell
cd website
npm run preview
```

Preview URL: **http://localhost:4174**

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Vite dev server (port 5174) |
| `npm run build` | Production static build |
| `npm run preview` | Serve the `dist/` build |
| `npm run check` | TypeScript check (`tsc --noEmit`) |

## Deploy

Host `website/dist` as a static site (Netlify, Vercel, Cloudflare Pages, etc.).

| Setting | Value |
|---------|--------|
| Base directory | `website` |
| Build command | `npm run build` |
| Publish directory | `dist` |
