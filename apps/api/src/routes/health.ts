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

// Mounted at "/api/health" (and "/health") in app.ts.
// Supporting both "/" and "/health" ensures compatibility whether a client calls
// /api/health, /api/health/health (earlier mount), or root /health.
healthRouter.get(["/", "/health"], (_req: Request, res: Response) => {
  const data: HealthCheckResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: APP_NAME,
  };

  res.json({
    success: true,
    status: "ok",
    data,
  });
});

healthRouter.get(["/db", "/health/db"], asyncHandler(async (_req: Request, res: Response) => {
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
