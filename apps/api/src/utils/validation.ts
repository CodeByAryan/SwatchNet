import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny, z } from "zod";
import { USER_ROLES, REPORT_STATUSES, type UserRole } from "../db/schema.js";

/** Shared query/enum parsing and a zod body validator for route handlers. */

export const isValidRole = (value: unknown): value is UserRole =>
  typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);

export const isValidReportStatus = (value: unknown): value is (typeof REPORT_STATUSES)[number] =>
  typeof value === "string" && (REPORT_STATUSES as readonly string[]).includes(value);

export function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export function parsePage(value: unknown, pageSize: number): number {
  return parsePositiveInt(value, 1, 10_000);
}

/** Express helper: validate `req.body` with zod, replacing it with the parsed value. */
export function validateBody<Schema extends ZodTypeAny>(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          message: "Invalid request payload.",
          details: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

/** Standard `{ success, data }` envelope helpers. */
export function ok<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

export function fail(res: Response, status: number, message: string, code?: string): void {
  res.status(status).json({ success: false, error: { message, ...(code ? { code } : {}) } });
}

export type InferSchema<T extends ZodTypeAny> = z.infer<T>;
