import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/neonAuth.js";
import { getCurrentUser } from "../middleware/neonAuth.js";
import { requireAdmin } from "../middleware/authorization.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  listApplications,
  listApplicationsForUser,
  reviewApplication,
  submitApplication,
} from "../services/applications.js";
import { APPLICATION_STATUSES, type ApplicationStatus } from "../db/schema.js";
import { fail, ok, parsePage, parsePositiveInt, validateBody, type InferSchema } from "../utils/validation.js";

export const applicationsRouter = Router();

const applySchema = z
  .object({
    motivation: z.string().trim().min(20).max(2000),
    area: z.string().trim().max(120).optional(),
    availability: z.string().trim().max(120).optional(),
  })
  .strict();

const reviewSchema = z
  .object({
    decision: z.enum(["approved", "rejected"]),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && (APPLICATION_STATUSES as readonly string[]).includes(value);
}

/** The caller's own application history. */
applicationsRouter.get("/mine", asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  ok(res, { items: await listApplicationsForUser(user.id) });
}));

/**
 * Apply to become a volunteer. This never grants the role: an Admin or Super
 * Admin must review and approve the application.
 */
applicationsRouter.post("/", validateBody(applySchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  const result = await submitApplication(user, req.body as InferSchema<typeof applySchema>);
  if (!result.ok) {
    const messages: Record<string, string> = {
      already_volunteer: "Only citizen accounts can apply to become volunteers.",
      pending_exists: "You already have a pending volunteer application.",
      not_eligible: "Your account is not eligible to apply.",
    };
    fail(res, result.error === "already_volunteer" ? 403 : 409, messages[result.error ?? ""] ?? "Rejected.");
    return;
  }
  ok(res, { application: result.application ?? null }, 201);
}));

/** Admin + Super Admin review queue. */
applicationsRouter.get("/", requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const page = parsePage(req.query.page, 10);
  const pageSize = parsePositiveInt(req.query.pageSize, 10, 50);
  const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
  if (statusParam && !isApplicationStatus(statusParam)) {
    fail(res, 400, "Unknown application status filter.");
    return;
  }
  ok(
    res,
    await listApplications({
      page,
      pageSize,
      status: isApplicationStatus(statusParam) ? statusParam : undefined,
    }),
  );
}));

applicationsRouter.patch(
  "/:id",
  requireAdmin,
  validateBody(reviewSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = getCurrentUser(req);
    const { decision, note } = req.body as InferSchema<typeof reviewSchema>;
    const result = await reviewApplication(user, req.params.id, decision, note);
    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: "Application not found.",
        already_reviewed: "This application has already been reviewed.",
        role_change_failed: "The applicant's role could not be updated.",
      };
      fail(res, result.error === "not_found" ? 404 : 409, messages[result.error ?? ""] ?? "Rejected.");
      return;
    }
    ok(res, { reviewed: true });
  }),
);
