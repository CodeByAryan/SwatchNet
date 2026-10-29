import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/neonAuth.js";
import { getCurrentUser } from "../middleware/neonAuth.js";
import { requireAdmin } from "../middleware/authorization.js";
import {
  assignTask,
  cancelTask,
  getTask,
  listOpenUnassignedReports,
  listTasks,
  volunteerTaskAction,
} from "../services/tasks.js";
import { fail, ok, parsePage, parsePositiveInt, validateBody, type InferSchema } from "../utils/validation.js";
import { TASK_STATUSES, type TaskStatus } from "../db/schema.js";

export const tasksRouter = Router();

const photoUrl = z
  .string()
  .trim()
  .max(500_000)
  .refine(
    (value) => /^https?:\/\//i.test(value) || /^data:image\/(png|jpe?g|webp);base64,/i.test(value),
    "Photo must be an https URL or an inline image data URL.",
  );

const assignSchema = z
  .object({
    reportId: z.string().uuid(),
    volunteerId: z.string().uuid(),
    instructions: z.string().trim().max(1000).optional(),
  })
  .strict();

const startSchema = z
  .object({
    beforePhotoUrl: photoUrl.optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

const completeSchema = z
  .object({
    afterPhotoUrl: photoUrl,
    beforePhotoUrl: photoUrl.optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (TASK_STATUSES as readonly string[]).includes(value);
}

/**
 * Admins see every task; a Volunteer only ever sees their own.
 * The volunteer filter is pinned to the session id, not to a query parameter.
 */
tasksRouter.get("/", asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  const page = parsePage(req.query.page, 10);
  const pageSize = parsePositiveInt(req.query.pageSize, 10, 50);
  const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
  if (statusParam && !isTaskStatus(statusParam)) {
    fail(res, 400, "Unknown task status filter.");
    return;
  }

  const isStaff = user.role === "admin" || user.role === "super_admin";
  const requestedVolunteer = typeof req.query.volunteerId === "string" ? req.query.volunteerId : undefined;

  const result = await listTasks({
    page,
    pageSize,
    status: isTaskStatus(statusParam) ? statusParam : undefined,
    volunteerId: isStaff ? requestedVolunteer : user.id,
  });
  ok(res, result);
}));

/** Volunteer: open, unassigned reports they could be dispatched to (read-only). */
tasksRouter.get("/open-reports", asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  if (user.role === "user") {
    fail(res, 403, "Forbidden.");
    return;
  }
  ok(res, { items: await listOpenUnassignedReports(20) });
}));

tasksRouter.get("/:id", asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  const task = await getTask(req.params.id);
  if (!task) {
    fail(res, 404, "Task not found.");
    return;
  }
  const isStaff = user.role === "admin" || user.role === "super_admin";
  // Ownership check: a volunteer may only read their own task.
  if (!isStaff && task.volunteerId !== user.id) {
    fail(res, 403, "Forbidden.");
    return;
  }
  ok(res, { task });
}));

/** Admin/Super Admin assign a verified report to an eligible volunteer. */
tasksRouter.post("/", requireAdmin, validateBody(assignSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  const input = req.body as InferSchema<typeof assignSchema>;
  const result = await assignTask(user, input.reportId, input.volunteerId, input.instructions);

  if (!result.ok) {
    const messages: Record<string, string> = {
      report_not_found: "Report not found.",
      volunteer_not_eligible: "That user is not an eligible volunteer.",
      report_closed: "This report is already resolved or rejected.",
      already_assigned: "This report already has an active task.",
    };
    fail(res, result.error === "report_not_found" ? 404 : 409, messages[result.error ?? ""] ?? "Rejected.");
    return;
  }
  ok(res, { task: result.task ?? null }, 201);
}));

tasksRouter.post("/:id/start", validateBody(startSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  const result = await volunteerTaskAction(
    user,
    req.params.id,
    "start",
    req.body as InferSchema<typeof startSchema>,
  );
  if (!result.ok) {
    fail(res, result.error === "not_found" ? 404 : result.error === "forbidden" ? 403 : 409, messageFor(result.error));
    return;
  }
  ok(res, { task: result.task ?? null });
}));

tasksRouter.post("/:id/complete", validateBody(completeSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  const result = await volunteerTaskAction(
    user,
    req.params.id,
    "complete",
    req.body as InferSchema<typeof completeSchema>,
  );
  if (!result.ok) {
    fail(res, result.error === "not_found" ? 404 : result.error === "forbidden" ? 403 : 409, messageFor(result.error));
    return;
  }
  ok(res, { task: result.task ?? null });
}));

/** Admin/Super Admin can cancel an active task; volunteers cannot. */
tasksRouter.post("/:id/cancel", requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = getCurrentUser(req);
  const result = await cancelTask(user, req.params.id);
  if (!result.ok) {
    fail(res, result.error === "not_found" ? 404 : 409, messageFor(result.error));
    return;
  }
  ok(res, { task: result.task ?? null });
}));

function messageFor(error?: string): string {
  const messages: Record<string, string> = {
    not_found: "Task not found.",
    forbidden: "This task is not assigned to you.",
    invalid_transition: "That action is not allowed from the task's current status.",
    evidence_required: "An after-cleanup photo is required to complete the task.",
  };
  return messages[error ?? ""] ?? "Rejected.";
}
