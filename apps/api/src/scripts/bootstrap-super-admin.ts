/**
 * One-time Super Admin bootstrap.
 *
 * Usage:
 *   SUPER_ADMIN_BOOTSTRAP_EMAIL=you@gmail.com SUPER_ADMIN_AUTH_USER_ID=<neon-auth-user-id> \
 *     node dist/scripts/bootstrap-super-admin.js
 *
 * The script links (or creates) the profile for the configured Neon Auth user
 * id and grants the initial Super Admin role. It refuses to run while an
 * active Super Admin already exists, so it can never create a second one. The
 * public `POST /api/auth/bootstrap-super-admin` endpoint performs the same
 * check from an authenticated session.
 *
 * `SUPER_ADMIN_AUTH_USER_ID` is the verified Neon Auth user id (`sub` claim).
 * Obtain it from Neon Auth server logs/console; never accept it from a client.
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const configDirectory = dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  resolve(configDirectory, "../../../.env"),
  resolve(configDirectory, "../../.env"),
  resolve(process.cwd(), ".env"),
];
const envPath = envCandidates.find(existsSync);
if (envPath) dotenv.config({ path: envPath });

import { getDb, isDbConfigured } from "../db/index.js";
import { users } from "../db/schema.js";
import { countSuperAdmins, getUserByAuthId, recordAudit, toPublicUser } from "../services/users.js";
import { eq } from "drizzle-orm";

async function main(): Promise<void> {
  if (!isDbConfigured()) {
    console.error("DATABASE_URL is not configured.");
    process.exit(1);
  }

  const authUserId = process.env.SUPER_ADMIN_AUTH_USER_ID?.trim();
  const tokenEmail = process.env.SUPER_ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();

  if (!authUserId || !tokenEmail) {
    console.error(
      "Set both SUPER_ADMIN_AUTH_USER_ID and SUPER_ADMIN_BOOTSTRAP_EMAIL. " +
      "SUPER_ADMIN_AUTH_USER_ID is the verified Neon Auth JWT subject.",
    );
    process.exit(1);
  }

  const existing = await countSuperAdmins();
  if (existing > 0) {
    console.error(`Refused: ${existing} active Super Admin(s) already exist. Ask them to grant access.`);
    process.exit(1);
  }

  const profile = await getUserByAuthId(authUserId, tokenEmail);
  if (!profile) {
    console.error("Could not resolve the profile for this verified user id.");
    process.exit(1);
  }

  await getDb()
    .update(users)
    .set({ role: "super_admin" })
    .where(eq(users.id, profile.id));

  await recordAudit(null, "user.bootstrap_super_admin", "user", profile.id, {
    email: profile.email,
    via: "script",
  });

  console.log(`Granted Super Admin to ${profile.email}:`);
  console.log(JSON.stringify(toPublicUser(profile), null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error("Bootstrap failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
