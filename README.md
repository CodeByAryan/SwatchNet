# SwatchNet
SwatchNet is a community-driven civic cleanliness and reporting platform.

## Architecture
This pnpm monorepo uses React + TypeScript + Vite for the frontend, Node.js + Express + TypeScript for the API, Neon PostgreSQL with Drizzle ORM, and Neon Auth for authentication. Deploy the frontend to Vercel and the API separately to Render; Neon Auth identities map to profiles in the existing Neon database.

```text
apps/web/     React + Vite frontend
apps/api/     Express API, Neon/Drizzle database access
apps/api/src/server.ts Express entrypoint for local development and Render
packages/shared/ shared types and validation
```

## Local development
1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env` and set the actual Neon `DATABASE_URL`, `VITE_NEON_AUTH_URL`, and matching server-only `NEON_AUTH_BASE_URL` from Neon Console.
3. Start the app with `pnpm dev`. Vite proxies same-origin `/api/*` requests to `http://localhost:5000` by default. Set `API_PROXY_TARGET` if the local API uses another address.
4. Run `pnpm typecheck` and `pnpm build` to validate the workspace.

Do not put `DATABASE_URL`, signing keys, or other server secrets in `VITE_*` variables. `VITE_NEON_AUTH_URL` is a public Auth endpoint, not a secret.

## Deploy frontend to Vercel
Create a Vercel project connected to this repository, set **Root Directory** to the repository root (`.`), **Framework Preset** to Vite, **Build Command** to `pnpm --filter @swatchnet/web run build`, and **Output Directory** to `dist`. Vite is configured to emit the frontend build to the repository-root `dist` directory expected by Vercel. The Vercel config is static frontend-only; API requests go directly to the separate Render service.

Set `VITE_API_BASE_URL` in Vercel to `https://swatchnet.onrender.com/api`. Set `VITE_NEON_AUTH_URL` to the Neon Auth base URL and, if used, `VITE_GOOGLE_MAPS_API_KEY`. Vercel's SPA rewrite serves deep links; API requests go directly to Render.

## Deploy backend to Render
Use a Render **Web Service** from the same repository with **Root Directory** set to the repository root, **Build Command** `pnpm install --frozen-lockfile && pnpm --filter @swatchnet/shared run typecheck && pnpm --filter @swatchnet/api run build`, and **Start Command** `pnpm --filter @swatchnet/api run start`. Set auto-deploy paths to `apps/api/**`, `packages/shared/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `render.yaml`. The `render.yaml` Blueprint records these settings. The root install preserves the pnpm lockfile and workspace dependency links; the exact install and API build commands were verified locally. Select a currently available compute plan in Render; the Blueprint intentionally omits a plan value rather than assume account availability.

Set `NODE_ENV=production`, `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and `CORS_ORIGIN` in Render, plus optionally `SUPER_ADMIN_BOOTSTRAP_EMAIL` (see bootstrap) and `CLEANUP_POINTS`. Set `CORS_ORIGIN` to the Vercel production origin and any allowed Preview origins (comma-separated). Render supplies `PORT`; the app listens on it and uses 5000 as the local default. Never expose `DATABASE_URL` or server secrets through a `VITE_` variable.

## Environment variables
| Platform | Name | Purpose |
| --- | --- | --- |
| Render | `DATABASE_URL` | Existing Neon PostgreSQL URL used by Drizzle |

| Render | `NEON_AUTH_BASE_URL` | Server-side Neon Auth endpoint used to verify JWTs; same URL as Vercel's `VITE_NEON_AUTH_URL` |
| Render | `CORS_ORIGIN` | Exact allowed frontend origins, comma-separated, no trailing slash (e.g. `https://swatchnet.vercel.app`) |
| Render | `NODE_ENV` | Set to `production` |
| Vercel | `VITE_API_BASE_URL` | Render API origin plus `/api`: `https://swatchnet.onrender.com/api` |
| Vercel | `VITE_NEON_AUTH_URL` | Public Neon Auth base URL copied from Neon Console |
| Vercel | `VITE_GOOGLE_MAPS_API_KEY` | Optional public Maps key; domain-restrict it |
| Render | `SUPER_ADMIN_BOOTSTRAP_EMAIL` | Optional, one-time: Google account allowed to claim the first Super Admin. Remove after use |
| Render | `CLEANUP_POINTS` | Optional: points per verified cleanup (default `10`) |



Google OAuth client credentials are **not** environment variables in this repo. Configure them in Neon Console; do not expose or commit them. Do not add migrations to either build/start command. The existing schema, migrations, and data are untouched.

> `VITE_*` variables are compiled into the public JS bundle. Never place a secret there.

## Roles and dashboards

Four roles, stored in the database as the Postgres enum `user_role`:

| Role | Dashboard | Can |
| --- | --- | --- |
| `user` | `/dashboard` | Report garbage, track own reports, apply to volunteer, view points |
| `volunteer` | `/volunteer` | See own assigned tasks, start/complete them with photo evidence, earn points |
| `admin` | `/admin` | Review reports, assign tasks, review volunteer applications, view operations stats |
| `super_admin` | `/admin/super` | Everything admins can, plus user/role management, platform stats, global activity |

Routing table (`apps/web/src/App.tsx`):

| Path | Guard |
| --- | --- |
| `/auth/signin`, `/auth/signup` | `PublicOnlyRoute` — signed-in users bounce to their dashboard |
| `/dashboard/*` | `ProtectedRoute minimumRole="user"` |
| `/volunteer/*` | `ProtectedRoute minimumRole="volunteer"` |
| `/admin/*` | `ProtectedRoute minimumRole="admin"`; `/admin/super/*` additionally requires `super_admin` |

There is exactly **one** login page and **one** signup page for every role. Neither has
any role picker, and neither shows usernames or credentials. After Google returns, the
client asks the backend for `GET /api/auth/me` and routes to `dashboardPathForRole()`.

### Role management rules (enforced server-side)

All rules live in `apps/api/src/services/users.ts` → `evaluateRoleChange`, and are
unit-tested. The UI only mirrors them.

* New accounts always get `user`; a role in the request body is ignored.
* Nobody can change their own role; `PATCH /api/auth/me` accepts only `name`, `phone`, `area`.
* Only a Super Admin may grant or revoke `admin` / `super_admin`.
* An Admin may only move accounts between `user` and `volunteer`.
* The last active Super Admin can never be demoted or deactivated.

### Secure initial Super Admin bootstrap

The first public registrant is never a Super Admin. Use one of these two controlled paths:

**Option A — one-time endpoint (recommended).**

1. Set `SUPER_ADMIN_BOOTSTRAP_EMAIL` on Render to the exact Google account you control.
2. Sign in once with that Google account from the frontend.
3. Call the endpoint with your own session token:
   ```bash
   curl -X POST https://<render-host>/api/auth/bootstrap-super-admin \
        -H "Authorization: Bearer <your-neon-auth-jwt>"
   ```
4. Remove `SUPER_ADMIN_BOOTSTRAP_EMAIL` from Render and redeploy.

The endpoint refuses to run once any active Super Admin exists, so leaving the variable
set is not a standing privilege escalation.

**Option B — server-side script.**

```bash
SUPER_ADMIN_BOOTSTRAP_EMAIL=you@gmail.com \
SUPER_ADMIN_AUTH_USER_ID=<neon-auth-user-id> \
  pnpm --filter @swatchnet/api run bootstrap:super-admin
```

`SUPER_ADMIN_AUTH_USER_ID` is the verified Neon Auth user ID (`sub` claim). Obtain it from the Neon Auth account/session; never use a browser-supplied role/ID as proof. Run the script after `pnpm db:migrate` from a machine holding `DATABASE_URL`. It refuses if a Super Admin already exists.

## Database migrations

`0001_roles_and_cleanup_workflow.sql` is additive and re-runnable. It maps the legacy
`citizen` role to `user` and converts the role/status columns to validated enums.



```bash
pnpm db:generate   # regenerate the snapshot after editing schema.ts
pnpm db:migrate    # apply pending migrations to DATABASE_URL
```

Nothing in the build or start command runs migrations, so deploys never touch data.

## Testing

```bash
pnpm test          # @swatchnet/api unit tests (node:test + tsx)
pnpm typecheck     # all workspaces
pnpm build         # production build (API tsc + Vite)
```

`apps/api/tests/` covers the authorization rules directly: role guards, client-supplied
identity rejection, the profile field whitelist, the role-change policy, volunteer
task ownership, report record access, and request validation.

## Authentication
SwatchNet uses the official Neon Auth SDK (`@neondatabase/neon-js`) for one shared
Google login/signup flow. Neon Auth owns the browser session cookie and OAuth state.

- `apps/web/src/lib/auth.ts` creates the Neon Auth client from
  `VITE_NEON_AUTH_URL`, starts `signIn.social({ provider: "google" })`, reads sessions,
  fetches API JWTs with the SDK token endpoint, and signs out with Neon Auth.
- `GoogleAuthButton.tsx` provides the shared Google action with loading, cancellation,
  and error states. There are no role-specific login/signup pages or role selectors.
- `apps/api/src/middleware/neonAuth.ts` validates every protected API request's bearer
  JWT against the Neon Auth project's published JWKS, checking signature, issuer,
  audience, expiry and subject. It then resolves the local user profile by verified
  JWT subject; roles are loaded from Neon PostgreSQL, never from the browser.
- New profiles receive the default `user` role server-side. Existing profiles are not
  silently linked by email; their Neon Auth ID must be securely verified/backfilled.

### Neon Console configuration
1. In Neon Console, open the project/branch's **Auth → Configuration** and copy the
   exact Auth base URL. Set it as `VITE_NEON_AUTH_URL` in Vercel and
   `NEON_AUTH_BASE_URL` in Render.
2. In **Auth → Configuration → OAuth providers**, enable Google and paste the Google
   OAuth client ID/secret. Keep the secret only in Neon Console.
3. In Google Cloud Console, use the exact authorized redirect URI shown by Neon for
   that Auth project/branch (commonly the Neon Auth callback URL; copy rather than
   reconstruct it). Add the Vercel and local JavaScript origins if the Console asks.
4. In Neon Auth, enable the JWT plugin if required by your branch/configuration so the
   SDK `token()` endpoint is available. The API validates JWTs against the Auth URL's
   published JWKS. Never copy private signing keys into the app.
5. Add the Vercel frontend origin to Render's `CORS_ORIGIN`; retain the existing
   Render API URL as `VITE_API_BASE_URL` in Vercel.

No Neon Auth secrets are stored in Vite variables or source code. Exact redirect URI
and project URL are environment-specific and must be copied from Neon Console.

The shared auth pages are Google-only. The backend fails closed when Neon Auth is not
configured. Real Google OAuth requires the Console setup above and has not been
exercised by automated tests.

### Verify after deployment
- Open the Vercel frontend URL and confirm the SwatchNet app loads.
- Open `https://<render-host>/api/health` and check for success JSON (public, no token needed — Render's `healthCheckPath`).
- Open `https://<render-host>/api/health/db` to verify the existing Neon connection.
- `GET https://<render-host>/api/auth/me` requires `Authorization: Bearer <Neon Auth JWT>`; without a valid token it returns 401.
- Check a browser API request succeeds cross-origin from the Vercel frontend.

Deployment is not considered successful until these deployed endpoints are checked. No deployment was initiated by these repository changes.
