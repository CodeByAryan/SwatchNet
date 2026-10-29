import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/neonAuth.js";
import { getCurrentUser } from "../middleware/neonAuth.js";
import { requireAdmin } from "../middleware/authorization.js";
import {
  createReport,
  getRawReport,
  getReport,
  listReports,
  updateReportStatus,
} from "../services/reports.js";
import { recordAudit } from "../services/users.js";
import {
  fail,
  isValidReportStatus,
  ok,
  parsePage,
  parsePositiveInt,
  validateBody,
  type InferSchema,
} from "../utils/validation.js";
import { REPORT_STATUSES } from "../db/schema.js";

export const reportsRouter = Router();

const createReportSchema = z
  .object({
    title: z.string().trim().min(4).max(160),
    description: z.string().trim().max(4000).optional(),
    category: z.string().trim().min(2).max(64),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    locationName: z.string().trim().max(200).optional(),
  })
  .strict();

const statusSchema = z.object({ status: z.enum(REPORT_STATUSES) }).strict();

function parseStatusFilter(value: unknown): (typeof REPORT_STATUSES)[number] | undefined {
  return isValidReportStatus(value) ? value : undefined;
}

/**
 * Public cleanup progress: authenticated users only (the whole /api surface is
 * behind auth), but no role restriction. Returns reporter names, never emails.
 */
reportsRouter.get("/", asyncHandler(async (req, res) => {
  const page = parsePage(req.query.page, 10);
  const pageSize = parsePositiveInt(req.query.pageSize, 10, 50);
  const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
  if (statusParam && !isValidReportStatus(statusParam)) {
    fail(res, 400, "Unknown status filter.");
    return;
  }
  const result = await listReports({
    page,
    pageSize,
    status: parseStatusFilter(statusParam),
    search: typeof req.query.search === "string" ? req.query.search.trim() : undefined,
    category: typeof req.query.category === "string" ? req.query.category : undefined,
  });
  ok(res, result);
}));

/** The caller's own reports, including private details. Ownership is from the session. */
reportsRouter.get("/mine", asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  const page = parsePage(req.query.page, 10);
  const pageSize = parsePositiveInt(req.query.pageSize, 10, 50);
  const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
  const result = await listReports({
    page,
    pageSize,
    status: parseStatusFilter(statusParam),
    reporterId: user.id,
    search: typeof req.query.search === "string" ? req.query.search.trim() : undefined,
  });
  ok(res, result);
}));

reportsRouter.get("/:id", asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  const report = await getReport(req.params.id);
  if (!report) {
    fail(res, 404, "Report not found.");
    return;
  }

  // Owners and staff see the full record. Everyone else sees the public view,
  // which omits the reporter id.
  const isOwner = report.reporterId === user.id;
  const isStaff = user.role === "admin" || user.role === "super_admin";
  if (!isOwner && !isStaff) {
    const { reporterId: _reporterId, ...publicView } = report;
    ok(res, { report: publicView, canManage: false });
    return;
  }
  ok(res, { report, canManage: isStaff });
}));

reportsRouter.post("/", validateBody(createReportSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  const input = req.body as InferSchema<typeof createReportSchema>;

  const created = await createReport(user.id, input);
  await recordAudit(user.id, "report.created", "report", created.id);
  const view = await getReport(created.id);
  ok(res, { report: view }, 201);
}));

/** Staff-only status changes used by the Admin verification queue. */
reportsRouter.patch(
  "/:id/status",
  requireAdmin,
  validateBody(statusSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = getCurrentUser(req);
    const existing = await getRawReport(req.params.id);
    if (!existing) {
      fail(res, 404, "Report not found.");
      return;
    }
    const { status } = req.body as InferSchema<typeof statusSchema>;
    await updateReportStatus(existing.id, status);
    await recordAudit(user.id, "report.status_changed", "report", existing.id, {
      from: existing.status,
      to: status,
    });
    ok(res, { report: await getReport(existing.id) });
  }),
);
