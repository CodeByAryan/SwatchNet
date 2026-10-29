import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./neonAuth.js";
import { hasRoleAtLeast, isRole } from "./neonAuth.js";
import type { UserRole } from "../db/schema.js";

/**
 * Require the caller's stored role (resolved from the database by
 * `requireNeonAuth`) to be one of `roles`. Roles in the request body, query or
 * frontend state are never consulted.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.currentUser;
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: { message: "Authentication required." } });
      return;
    }
    if (!isRole(user.role) || !roles.includes(user.role)) {
      res.status(403).json({ success: false, error: { message: "Forbidden." } });
      return;
    }
    next();
  };
}

/** Require at least the given role in the user < volunteer < admin < super_admin ladder. */
export function requireMinimumRole(minimum: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.currentUser;
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: { message: "Authentication required." } });
      return;
    }
    if (!hasRoleAtLeast(user, minimum)) {
      res.status(403).json({ success: false, error: { message: "Forbidden." } });
      return;
    }
    next();
  };
}

/** Shorthand guards used across routers. */
export const requireAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.currentUser) {
    res.status(401).json({ success: false, error: { message: "Authentication required." } });
    return;
  }
  next();
};

export const requireSuperAdmin = requireRole("super_admin");
export const requireAdmin = requireMinimumRole("admin");
export const requireVolunteer = requireMinimumRole("volunteer");
