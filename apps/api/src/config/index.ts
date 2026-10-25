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



export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  corsOrigins: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
