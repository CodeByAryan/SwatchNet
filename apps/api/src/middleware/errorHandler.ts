import { Request, Response, NextFunction } from "express";

/**
 * Express 4 does not forward rejected promises from async handlers to the error
 * middleware. This wrapper does, so a database outage returns a clean 500
 * envelope instead of an unhandled rejection (or a Render instance restart).
 */
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV !== "production";
  const rawStatus = (err as unknown as { status?: unknown }).status;
  const status = typeof rawStatus === "number" ? rawStatus : 500;

  if (res.headersSent) {
    return;
  }

  // Never leak internals (SQL text, connection strings) to clients in production.
  console.error("[API Error]", err.message);

  res.status(status).json({
    success: false,
    error: {
      message: status >= 500 && !isDev ? "Internal server error" : err.message || "Internal server error",
      ...(isDev && status >= 500 ? { stack: err.stack } : {}),
    },
  });
}
