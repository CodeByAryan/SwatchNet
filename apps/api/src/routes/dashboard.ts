import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import type { AuthenticatedRequest } from "../middleware/neonAuth.js";
import { getCurrentUser } from "../middleware/neonAuth.js";
import { requireAdmin, requireSuperAdmin } from "../middleware/authorization.js";
import { ok } from "../utils/validation.js";
import {
  getCitizenSummary,
  getOperationsStats,
  getPlatformStats,
  getVolunteerSummary,
  listRecentActivity,
  listRecentUsers,
} from "../services/stats.js";

export const dashboardRouter = Router();

/** Any signed-in user: personal summary. */
dashboardRouter.get("/me/summary", asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  const summary = await getCitizenSummary(user.id);
  ok(res, { summary });
}));

dashboardRouter.get("/volunteer", asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  if (user.role === "user") {
    res.status(403).json({ success: false, error: { message: "Forbidden." } });
    return;
  }
  const summary = await getVolunteerSummary(user.id);
  ok(res, { summary });
}));

/** Admin + Super Admin operational statistics. */
dashboardRouter.get("/operations", requireAdmin, asyncHandler(async (_req, res) => {
  const [stats, activity] = await Promise.all([getOperationsStats(), listRecentActivity(8)]);
  ok(res, { stats, activity });
}));

/** Super Admin only: platform-wide statistics and global activity. */
dashboardRouter.get("/platform", requireSuperAdmin, asyncHandler(async (_req, res) => {
  const [stats, activity, recentUsers] = await Promise.all([
    getPlatformStats(),
    listRecentActivity(15),
    listRecentUsers(5),
  ]);
  ok(res, { stats, activity, recentUsers });
}));
