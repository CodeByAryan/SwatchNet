import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Load local env files for developer runs; Render injects its dashboard values.
const configDirectory = dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  resolve(configDirectory, "../../../.env"),
  resolve(configDirectory, "../../.env"),
  resolve(process.cwd(), "../../.env"),
  resolve(process.cwd(), ".env"),
];
const envPath = envCandidates.find(existsSync);

if (envPath) {
  dotenv.config({ path: envPath });
}

/** Normalises `https://host/path/` -> `https://host/path` (no trailing slash). */
function trimTrailingSlash(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : undefined;
}

const neonAuthBaseUrl = trimTrailingSlash(process.env.NEON_AUTH_BASE_URL);

function parseAllowedEmails(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Neon Auth's public base URL is used for server-side session JWT verification. */
export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,

  neonAuthBaseUrl,
  corsOrigins: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
  /**
   * One-time bootstrap configuration: the Google account(s) that may claim the
   * initial Super Admin role through `POST /api/auth/bootstrap`. Server-only,
   * never sent to the browser. Removing the value disables the endpoint.
   */
  superAdminBootstrapEmails: parseAllowedEmails(process.env.SUPER_ADMIN_BOOTSTRAP_EMAIL),
  /** Community points awarded when a volunteer completes a cleanup task. */
  cleanupPoints: Number(process.env.CLEANUP_POINTS) || 10,
};

export const isProduction = config.nodeEnv === "production";
