import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV !== "production";

  res.status(500).json({
    success: false,
    error: {
      message: err.message || "Internal server error",
      ...(isDev ? { stack: err.stack } : {}),
    },
  });
}
