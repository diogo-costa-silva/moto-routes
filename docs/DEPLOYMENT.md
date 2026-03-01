# Deployment Guide — Vercel

Moto Routes deploys to Vercel from the `frontend/` subdirectory.

---

## Step 0 — GitHub Setup (Prerequisite)

The repo must be on GitHub before Vercel can import it.

1. Go to https://github.com/new
2. Owner: `YOUR_GITHUB_USERNAME`, Name: `moto-routes`, visibility: **Public**
3. Leave "Add a README file", ".gitignore", and "license" all **unchecked** — the repo already has these locally
4. Click **Create repository**
5. If you manage multiple GitHub accounts via the CLI, switch to the right one first:
   ```bash
   gh auth switch --user YOUR_GITHUB_USERNAME
   ```
6. Add the remote and push:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/moto-routes.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 1 — Import into Vercel

1. Go to https://vercel.com/new
2. Search for `moto-routes` in the repository list and click **Import**
3. Set **Team** to your Vercel team and **Project Name** to `moto-routes`

---

## Step 2 — Environment Variables

Before clicking Deploy, expand **Environment Variables** and add exactly these three variables. Do **not** add `SUPABASE_SERVICE_KEY` — that is a server-side secret used only by the Python pipeline and must never be exposed to the browser build.

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_MAPBOX_ACCESS_TOKEN` | Mapbox public token | `pk.eyJ1IjoiLi4uIn0...` |

These are the same `VITE_*` values from `frontend/.env`. Never commit `.env` to the repo.

Click **Deploy**.

> The first deploy will fail if the Root Directory is not yet set — that is fixed in the next step.

---

## Step 3 — Set Root Directory (Critical)

Vercel needs to know that the app lives inside `frontend/`, not at the repo root. This setting is **not** available during the initial import wizard — you must set it after the project is created.

1. Go to **Project Settings → Build and Deployment**
2. Find **Root Directory** and set it to `frontend`
3. Click **Save**
4. Trigger a redeploy (either push a commit or use the **Redeploy** button in the Deployments tab)

---

## How the Build Works

With Root Directory set to `frontend/`, Vercel runs `npm install` and `npm run build` inside that directory. The output goes to `frontend/dist/` (Vite's default).

The `frontend/vercel.json` handles the rest — it tells Vercel where the output is and rewrites all routes to `index.html` so that React Router's BrowserRouter works on direct URL access:

```json
{
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The root-level `vercel.json` is no longer needed for builds once Root Directory is set to `frontend/` in Vercel settings. The `frontend/vercel.json` handles everything.

---

## Step 4 — Supabase Auth Configuration

After the deploy succeeds and you have the production URL (e.g., `https://moto-routes.vercel.app`):

1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and select the project
2. Go to **Authentication → URL Configuration**
3. Set **Site URL** to `https://moto-routes.vercel.app`
4. Under **Redirect URLs**, add:
   - `https://moto-routes.vercel.app`
   - `http://localhost:5174` (keep this for local development)
5. Save changes

Without this step, Google OAuth will redirect to `localhost` instead of production and authentication will fail.

---

## Post-Deploy Verification Checklist

- [ ] Home page loads at production URL
- [ ] Direct navigation works (e.g., `/routes`, `/journeys`, `/destinations`)
- [ ] Page refresh on any route does not 404 (SPA rewrite is working)
- [ ] Map renders correctly (Mapbox token is valid)
- [ ] Route list loads from Supabase
- [ ] Language switcher toggles PT/EN
- [ ] Sign in with email works
- [ ] Sign in with Google works (requires Supabase config above)
- [ ] Profile page accessible when logged in
- [ ] Favourites toggle works

---

## Custom Domain

1. Vercel Dashboard → your project → **Settings → Domains**
2. Click **Add Domain** and enter your domain
3. Follow the DNS instructions (CNAME or A record)
4. Vercel provisions SSL automatically
5. After the domain is active, update the Supabase Site URL and Redirect URLs to match the new domain

---

## Troubleshooting

**404 on direct URL access** — `frontend/vercel.json` is missing or does not contain the `rewrites` array. The file must exist inside the `frontend/` directory (not only at the repo root).

**Build fails: `dist` directory not found** — `outputDirectory` in `frontend/vercel.json` must be `"dist"`, not `"build"`. Vite always outputs to `dist`.

**Build fails: module not found** — `VITE_*` environment variables are missing in the Vercel dashboard. Add them under Project Settings → Environment Variables and redeploy.

**Google OAuth redirects to localhost** — Supabase Site URL is still set to `http://localhost:5174`. Update it to the production URL (see Step 4 above).

**Map blank / no tiles** — `VITE_MAPBOX_ACCESS_TOKEN` is missing or invalid in Vercel environment variables.

**Wrong GitHub account used** — If the import picked up the wrong account, run `gh auth switch --user YOUR_GITHUB_USERNAME` before pushing, then disconnect and reconnect the repository in Vercel.
