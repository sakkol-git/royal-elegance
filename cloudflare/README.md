Cloudflare deployment guide for Royal Elegance

This project uses Next.js (pinned to 15.5.2) and OpenNext to produce a Cloudflare Pages-compatible build.

What I changed for Cloudflare
- Added `open-next` as a devDependency.
- Updated `package.json` scripts:
  - `build` -> `next build && npx open-next build`
  - `cf:build` -> `npx open-next build`

Required environment variables (set these in Cloudflare Pages > Settings > Environment variables)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (only if server-side scripts need elevated access)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY (if server-side Stripe usage)
- NEXT_PUBLIC_APP_URL (your deployed site URL, e.g. https://royal-elegance.pages.dev)
- Any KHQR or third-party API keys used by server routes

Cloudflare Pages settings (recommended)
- Framework preset: "None" (we run CLI build)
- Build command: npm run cf:build
- Build output directory: leave default (OpenNext produces Pages-compatible output)
- Node version: 18.x or 20.x (match your local environment)

How to build locally (quick checks)
1. Install dependencies:
   npm install --legacy-peer-deps
2. Run Next build and OpenNext build (this may take several minutes):
   npm run build

How to run locally for development
- Use Next dev for local development:
  npm run dev

Deploying to Cloudflare Pages
1. Push your repo to GitHub (or connect your GitHub repo to Cloudflare Pages).
2. In Cloudflare Pages, create a new project and connect the repository.
3. Configure the environment variables listed above.
4. Set the build command to `npm run cf:build`.
5. Start the deployment — Cloudflare will run the build and deploy the site.

Why you may see a "build loop" (and how to fix it)

- Cause: If you configure Cloudflare Pages to run a deploy command that itself calls `wrangler deploy` (or any command that triggers a Pages deployment), Pages will perform a deploy which triggers the repository webhook and starts another Pages build — this creates a loop.
- Example problematic setup (DO NOT do this in Pages settings):
  - Build command: `npm run build`
  - Deploy command: `npx wrangler deploy`

  In that case, the Pages build runs `npx wrangler deploy`, which issues a new Pages deployment and so on.

Fixes (choose one)

1) Let Pages handle the build and deploy (recommended)
  - In Cloudflare Pages settings, set the Build command to `npm run build` (or `npm run cf:build`) and remove any custom deploy command. Pages will build and then publish the site itself — do not call `wrangler` from within the Pages build.

2) Self-deploy from CI (recommended if you want manual control)
  - Keep Pages build disabled (or use a different deploy flow) and run `npx wrangler deploy` from your CI (GitHub Actions, GitLab CI) outside of Pages build steps. This avoids Pages re-triggering itself.

3) If you must run Wrangler from a build environment, use the guarded script
  - Use the provided `wrangler:deploy-guarded` npm script which will skip running Wrangler when it detects it's inside a Pages build (Pages exposes environment variables like `CF_PAGES`):

```bash
# set these in CI or locally
export CF_API_TOKEN="<your-token>"
export CF_PAGES_PROJECT="royal-elegance"

# guarded deploy (safe to run outside Pages; will skip inside Pages builds)
npm run wrangler:deploy-guarded
```

When Pages is doing the build, the guard prevents `npx wrangler deploy` from executing and avoids the loop.

Recommended Pages settings

- Build command: `npm run build` (our `build` now runs OpenNext to produce `.open-next`)
- Do NOT set a custom deploy command that calls `wrangler`.
- If you want to deploy from CI, run `npm run cf:deploy` or `npm run wrangler:deploy-guarded` there and keep Pages configured only to build (or disable automatic builds for that repo/project).

Optional: deploy via Wrangler CLI

If you prefer to run the Pages deployment yourself (or from CI) instead of letting
Cloudflare Pages run the build, you can use Wrangler to deploy the generated
`.open-next` output. A convenience script has been added to `package.json`:

- `npm run cf:deploy` — runs the OpenNext build and then runs a Wrangler Pages
  deploy command. It expects the environment variable `CF_PAGES_PROJECT` to be
  set (your Pages project name) and a Cloudflare API token available as
  `CF_API_TOKEN` in the environment.

Example usage (locally or in CI) — set env vars and run:

```bash
# set these in your CI provider or locally (do not commit tokens)
export CF_API_TOKEN="<your-token>"
export CF_PAGES_PROJECT="royal-elegance"

# build + deploy
npm run cf:deploy
```

Notes on token & permissions

- Create an API token in the Cloudflare Dashboard with the minimum required
  scopes for Pages and Workers (Pages: Edit / Workers: Scripts: Edit). Use the
  token in the environment variable `CF_API_TOKEN`.
- If you need a `wrangler.toml` for other Wrangler commands, copy
  `wrangler.example.toml` to `wrangler.toml` and fill in your `account_id`.

Alternatively, you can use a JSONC-based Wrangler config `wrangler.jsonc` that
declares an `assets.directory` (useful when uploading a folder of files such as
OpenNext output). A template `wrangler.jsonc` is included in the repo — edit
it to set your `account_id` or set `CF_ACCOUNT_ID` in the environment. If you
prefer to avoid a committed file, don't commit `wrangler.jsonc` and instead
pass the assets directory explicitly using CLI flags (example below).

CLI example without committing config file:

```bash
# build
npm run cf:build

# deploy the generated .open-next folder
npx wrangler deploy --assets=./.open-next --name=royal-elegance
```


Notes and troubleshooting
- OpenNext v3+ is used here. If you see runtime errors after deployment, check Cloudflare Functions logs and ensure server-side environment variables are present.
- If you prefer the older @cloudflare/next-on-pages adapter, it was previously added but is deprecated; OpenNext is the recommended path.
- If your app depends on Next 16 features, consider testing thoroughly as we pinned Next to 15.5.2 for compatibility with OpenNext.

If you want, I can:
- Run a full `npm run build` here and fix any build-time errors.
- Revert the Next version to 16 and provide a migration plan using other Cloudflare approaches (e.g., build via Vercel or container-based deployment).

---
Generated by the local dev assistant to prepare Cloudflare deployment.
