# SwatchNet
SwatchNet is a community-driven civic cleanliness and reporting platform.

## Architecture
This pnpm monorepo uses React + TypeScript + Vite for the frontend, Node.js + Express + TypeScript for the API, and Neon PostgreSQL with Drizzle ORM. Deploy the frontend to Vercel and the API separately to Render; the API connects to the existing Neon database and Neon Auth.

```text
apps/web/     React + Vite frontend
apps/api/     Express API, Neon/Drizzle database access
apps/api/src/server.ts Express entrypoint for local development and Render
packages/shared/ shared types and validation
```

## Local development
1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env` and set the actual Neon `DATABASE_URL`, `VITE_NEON_AUTH_URL`, and matching server-only `NEON_AUTH_BASE_URL`.
3. Start the app with `pnpm dev`. Vite proxies same-origin `/api/*` requests to `http://localhost:5000` by default. Set `API_PROXY_TARGET` if the local API uses another address.
4. Run `pnpm typecheck` and `pnpm build` to validate the workspace.

Do not put `DATABASE_URL`, signing keys, or other server secrets in `VITE_*` variables. `VITE_NEON_AUTH_URL` is a public Auth endpoint, not a secret.

## Deploy frontend to Vercel
Create a Vercel project connected to this repository, set **Root Directory** to the repository root (`.`), **Framework Preset** to Vite, **Build Command** to `pnpm --filter @swatchnet/web run build`, and **Output Directory** to `dist`. Vite is configured to emit the frontend build to the repository-root `dist` directory expected by Vercel. The Vercel config is static frontend-only; API requests go directly to the separate Render service.

Set `VITE_API_BASE_URL` in Vercel to `https://<your-render-service>.onrender.com/api`. Set public build variables `VITE_NEON_AUTH_URL` and, if used, `VITE_GOOGLE_MAPS_API_KEY`. No API rewrite or Vercel Function is configured.

## Deploy backend to Render
Use a Render **Web Service** from the same repository with **Root Directory** set to the repository root, **Build Command** `pnpm install --frozen-lockfile && pnpm --filter @swatchnet/shared run typecheck && pnpm --filter @swatchnet/api run build`, and **Start Command** `pnpm --filter @swatchnet/api run start`. Set auto-deploy paths to `apps/api/**`, `packages/shared/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `render.yaml`. The `render.yaml` Blueprint records these settings. The root install preserves the pnpm lockfile and workspace dependency links; the exact install and API build commands were verified locally. Select a currently available compute plan in Render; the Blueprint intentionally omits a plan value rather than assume account availability.

Set `NODE_ENV=production`, `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and `CORS_ORIGIN` in Render. Set `CORS_ORIGIN` to the Vercel production origin and any allowed Preview origins (comma-separated). Render supplies `PORT`; the app listens on it and uses 5000 as the local default. Never expose `DATABASE_URL` or server secrets through a `VITE_` variable.

## Environment variables
| Platform | Name | Purpose |
| --- | --- | --- |
| Render | `DATABASE_URL` | Existing Neon PostgreSQL URL used by Drizzle |
| Render | `NEON_AUTH_BASE_URL` | Server-only Neon Auth base URL for JWKS verification |
| Render | `CORS_ORIGIN` | Exact allowed frontend origins, comma-separated |
| Render | `NODE_ENV` | Set to `production` |
| Vercel | `VITE_API_BASE_URL` | Render API origin plus `/api`, e.g. `https://swatchnet-api.onrender.com/api` |
| Vercel | `VITE_NEON_AUTH_URL` | Public Neon Auth URL used by the React SDK |
| Vercel | `VITE_GOOGLE_MAPS_API_KEY` | Optional public Maps key; domain-restrict it |

Keep `NEON_AUTH_BASE_URL` and `VITE_NEON_AUTH_URL` pointed at the same Neon Auth branch. Do not add migrations to either build/start command. The existing schema, migrations, and data are untouched.

### Neon Auth setup
Enable Managed Better Auth for the Neon project/branch. Use the current Neon React SDK client at `apps/web/src/lib/auth.ts`. Browser sign-in continues to use Neon Auth's secure session cookie. For API bearer-token requests, the client helper calls `authClient.token()`; enable Neon's JWT plugin in the Auth configuration to make this token endpoint available. Express validates the token signature, issuer, and audience (both Neon JWT claims are checked against the Neon Auth origin) against `<NEON_AUTH_BASE_URL>/.well-known/jwks.json` using `jose`. The API fails closed if the Auth URL is not configured. Protected API route example: `GET /api/auth/me`. Add trusted production and preview origins in Neon's Auth configuration as required. The existing sign-in UI remains an informational placeholder and has not been switched to a real sign-in flow.

### Verify after deployment
- Open the Vercel frontend URL and confirm the SwatchNet app loads.
- Open `https://<render-host>/api/health` and check for success JSON.
- Open `https://<render-host>/api/health/db` to verify the existing Neon connection.
- `GET https://<render-host>/api/auth/me` requires `Authorization: Bearer <Neon Auth JWT>`; without a valid token it returns 401.
- Check a browser API request succeeds cross-origin from the Vercel frontend.

Deployment is not considered successful until these deployed endpoints are checked. No deployment was initiated by these repository changes.
