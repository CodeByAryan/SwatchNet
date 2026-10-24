import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";
import { config } from "../config/index.js";

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!config.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Please set DATABASE_URL in your environment variables."
    );
  }

  if (!_db) {
    const sql = neon(config.databaseUrl);
    _db = drizzle(sql, { schema });
  }

  return _db;
}

export function isDbConfigured(): boolean {
  return Boolean(config.databaseUrl && config.databaseUrl.trim().length > 0);
}

export { schema };
