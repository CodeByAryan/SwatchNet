import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Vercel injects environment variables at runtime; local dotenv discovery
// is only needed when running the API from the monorepo.
const configDirectory = dirname(fileURLToPath(import.meta.url));
const envCandidates = process.env.VERCEL === "1" ? [] : [
  resolve(configDirectory, "../../../.env"),
  resolve(configDirectory, "../../.env"),
  resolve(process.cwd(), "../../.env"),
  resolve(process.cwd(), ".env"),
];
const envPath = envCandidates.find(existsSync);

if (envPath) {
  dotenv.config({ path: envPath });
}



export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
};
