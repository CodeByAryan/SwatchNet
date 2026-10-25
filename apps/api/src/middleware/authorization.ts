import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./neonAuth.js";

/** Require a role assigned by the verified backend identity, never request data. */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const role = typeof req.auth?.role === "string" ? req.auth.role : undefined;

    if (!role || !roles.includes(role)) {
      res.status(403).json({ success: false, error: { message: "Forbidden." } });
      return;
    }

    next();
  };
}
