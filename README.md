# SwatchNet
SwatchNet is a community-driven civic cleanliness and reporting platform.

## Architecture
This pnpm monorepo uses React + TypeScript + Vite for the frontend, Node.js + Express + TypeScript for the API, and Neon PostgreSQL with Drizzle ORM. A single Vercel project serves the static Vite app and the Express API from one public domain.

```text
apps/web/     React + Vite frontend
apps/api/     Express API, Neon/Drizzle database access
api/index.ts  Vercel Function entrypoint which exports the Express app
packages/shared/ shared types and validation
```

## Local development
1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env` and set the actual Neon `DATABASE_URL`, `VITE_NEON_AUTH_URL`, and matching server-only `NEON_AUTH_BASE_URL`.
3. Start the app with `pnpm dev`. Vite proxies same-origin `/api/*` requests to `http://localhost:5000` by default. Set `API_PROXY_TARGET` if the local API uses another address.
4. Run `pnpm typecheck` and `pnpm build` to validate the workspace.

Do not put `DATABASE_URL`, signing keys, or other server secrets in `VITE_*` variables. `VITE_NEON_AUTH_URL` is a public Auth endpoint, not a secret.

## Deploy to one Vercel project
The repository root must be the Vercel project root (do not set `apps/web` as the Root Directory). The root `vercel.json` runs the Vite production build into `apps/web/dist`, exposes `/api/*` through the Express function in `api/index.ts`, and rewrites frontend paths to the SPA entrypoint. The Express app is exported as a Vercel Function; it does not rely on a persistent listener, local storage, or `express.static()`. The function config includes `apps/api/src/**` in the bundle, as this monorepo keeps the API implementation outside the root `api/` folder.

### Vercel project settings
- **Framework Preset:** Vite (or Other if Vercel does not detect the monorepo config)
- **Root Directory:** `.` (repository root)
- **Install Command:** `pnpm install --frozen-lockfile` (or use the detected pnpm install command)
- **Build Command:** leave as configured by `vercel.json`: `pnpm --filter @swatchnet/web build`
- **Output Directory:** `apps/web/dist` (configured in `vercel.json`)
- **Development Command:** optional; use `pnpm dev` for the workspace, or `vercel dev` for local Vercel routing
- Use one project/domain for both web and API; no separate API hosting project is required.

### Environment variables
Set these in **Vercel → Project → Settings → Environment Variables**, for Production and Preview as appropriate, then redeploy:

| Name | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Server-only | Neon PostgreSQL connection string used by Drizzle |
| `NEON_AUTH_BASE_URL` | Server-only | Neon Managed Auth Base URL. Used only to build the Auth JWKS URL and validate JWT issuer |
| `VITE_NEON_AUTH_URL` | Public frontend build | Same Neon Auth Base URL, used by the official React SDK |
| `GEMINI_API_KEY` | Server-only, only if needed | Existing external API placeholder; do not expose with a `VITE_` prefix |
| `VITE_GOOGLE_MAPS_API_KEY` | Public frontend build, only if needed | Existing client-side Maps placeholder; restrict the key to the app's domain in the provider console |

Keep `NEON_AUTH_BASE_URL` and `VITE_NEON_AUTH_URL` pointed at the same branch's Auth Base URL. Do not set the local-only `API_PROXY_TARGET` in Vercel; production browser calls use same-origin `/api` URLs. No database migrations are run by the build or deployment. Existing tables/data and the committed Drizzle migration are preserved.

### Neon Auth setup
Enable Managed Better Auth for the Neon project/branch. Use the current Neon React SDK client at `apps/web/src/lib/auth.ts`. Browser sign-in continues to use Neon Auth's secure session cookie. For API bearer-token requests, the client helper calls `authClient.token()`; enable Neon's JWT plugin in the Auth configuration to make this token endpoint available. Express validates token signature and issuer against `<NEON_AUTH_BASE_URL>/.well-known/jwks.json` using `jose`. Protected API route example: `GET /api/auth/me`. Add trusted production and preview origins in Neon's Auth configuration as required. The existing sign-in UI remains an informational placeholder and has not been switched to a real sign-in flow.

### Verify after deployment
- Open `/` and confirm the SwatchNet app loads.
- Open `/api/health` and expect JSON `{ "success": true, ... }`.
- Open `/api/health/db` to verify the server-side database connection.
- `GET /api/auth/me` requires `Authorization: Bearer <Neon Auth JWT>`; without a valid token it returns 401.

Deployment is not considered successful until these endpoints are checked on the deployed Vercel URL. This repository setup does not itself create a Vercel project or deploy it.
