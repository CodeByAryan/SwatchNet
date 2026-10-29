import { Router, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { APP_NAME, HealthCheckResponse } from "@swatchnet/shared";
import { getDb, isDbConfigured } from "../db/index.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const healthRouter = Router();

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
  const timestamp = new Date().toISOString();

  if (!isDbConfigured()) {
    return res.status(503).json({
      success: false,
      data: {
        status: "unconfigured",
        timestamp,
        database: "neon-postgres",
      },
      error: {
        message: "Database is not configured. DATABASE_URL environment variable is missing.",
        code: "DB_NOT_CONFIGURED",
      },
    });
  }

  try {
    const db = getDb();
    // Harmless connectivity test query
    await db.execute(sql`SELECT 1`);

    return res.json({
      success: true,
      data: {
        status: "connected",
        timestamp,
        database: "neon-postgres",
      },
    });
  } catch (error) {
    // Log the error internally for server administrators without exposing credentials to caller
    console.error("[Database Health Check Error]", error instanceof Error ? error.message : "Unknown error");

    // Return a strictly safe error response without connection details, hostnames, passwords, or full trace
    return res.status(503).json({
      success: false,
      data: {
        status: "unreachable",
        timestamp,
        database: "neon-postgres",
      },
      error: {
        message: "Database connection check failed.",
        code: "DB_CONNECTION_FAILED",
      },
    });
  }
}));
