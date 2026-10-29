import { Router, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { APP_NAME, HealthCheckResponse } from "@swatchnet/shared";
import { getDb, isDbConfigured } from "../db/index.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const healthRouter = Router();

export interface DatabaseHealthResult {
  statusCode: 200 | 503;
  body: Record<string, unknown>;
}

/** Runs a harmless query and returns no credentials, SQL text, or provider details. */
export async function checkDatabaseHealth(check: () => Promise<unknown>): Promise<DatabaseHealthResult> {
  try {
    await check();
    const body: Record<string, unknown> = {};
    body.success = true;
    body.data = { status: "connected" };
    return { statusCode: 200, body };
  } catch {
    const body: Record<string, unknown> = {};
    body.success = false;
    body.error = { message: "Database connection failed." };
    return { statusCode: 503, body };
  }
}

// Mounted at "/api/health" in app.ts, so routes are relative to that mount point.
// Declaring "/health" here would resolve to /api/health/health and make
// /api/health fall through to the authenticated /api catch-all (401).
healthRouter.get("/", (_req: Request, res: Response) => {
  const data: HealthCheckResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: APP_NAME,
  };

  res.json({
    success: true,
    data,
  });
});

healthRouter.get("/db", asyncHandler(async (_req: Request, res: Response) => {
  if (!isDbConfigured()) {
    res.status(503).json({
      success: false,
      error: { message: "Database connection failed." },
    });
    return;
  }

  const result = await checkDatabaseHealth(async () => {
    await getDb().execute(sql`SELECT 1`);
  });
  res.status(result.statusCode).json(result.body);
}));
