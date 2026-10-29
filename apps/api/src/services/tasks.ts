import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "../db/index.js";
import {
  cleanupTasks,
  reports,
  users,
  type CleanupTask,
  type TaskStatus,
  type User,
} from "../db/schema.js";
import { config } from "../config/index.js";
import { assignVolunteerToReport, updateReportStatus } from "./reports.js";
import { recordAudit, findUserById } from "./users.js";

const volunteerUser = alias(users, "task_volunteer");
const taskReport = reports;

export interface TaskListItem {
  id: string;
  status: TaskStatus;
  instructions: string | null;
  notes: string | null;
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  pointsAwarded: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  volunteerId: string;
  volunteerName: string;
  report: {
    id: string;
    title: string;
    category: string;
    status: string;
    latitude: number;
    longitude: number;
    locationName: string | null;
  };
}

function toListItem(
  task: CleanupTask,
  volunteerName: string,
  report: Pick<
    typeof taskReport.$inferSelect,
    "id" | "title" | "category" | "status" | "latitude" | "longitude" | "locationName"
  >,
): TaskListItem {
  return {
    id: task.id,
    status: task.status,
    instructions: task.instructions,
    notes: task.notes,
    beforePhotoUrl: task.beforePhotoUrl,
    afterPhotoUrl: task.afterPhotoUrl,
    pointsAwarded: task.pointsAwarded,
    createdAt: task.createdAt.toISOString(),
    startedAt: task.startedAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    volunteerId: task.volunteerId,
    volunteerName,
    report: {
      id: report.id,
      title: report.title,
      category: report.category,
      status: report.status,
      latitude: report.latitude,
      longitude: report.longitude,
      locationName: report.locationName,
    },
  };
}

export interface TaskListQuery {
  page: number;
  pageSize: number;
  status?: TaskStatus;
  volunteerId?: string;
}

export async function listTasks(query: TaskListQuery): Promise<{
  items: TaskListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const conditions = [];
  if (query.status) conditions.push(eq(cleanupTasks.status, query.status));
  if (query.volunteerId) conditions.push(eq(cleanupTasks.volunteerId, query.volunteerId));
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [totalRow]] = await Promise.all([
    getDb()
      .select({ task: cleanupTasks, volunteerName: volunteerUser.name, report: taskReport })
      .from(cleanupTasks)
      .innerJoin(volunteerUser, eq(cleanupTasks.volunteerId, volunteerUser.id))
      .innerJoin(taskReport, eq(cleanupTasks.reportId, taskReport.id))
      .where(where)
      .orderBy(desc(cleanupTasks.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    getDb().select({ value: count() }).from(cleanupTasks).where(where),
  ]);

  const total = totalRow?.value ?? 0;
  return {
    items: rows.map((row) => toListItem(row.task, row.volunteerName, row.report)),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getTask(id: string): Promise<TaskListItem | null> {
  const [row] = await getDb()
    .select({ task: cleanupTasks, volunteerName: volunteerUser.name, report: taskReport })
    .from(cleanupTasks)
    .innerJoin(volunteerUser, eq(cleanupTasks.volunteerId, volunteerUser.id))
    .innerJoin(taskReport, eq(cleanupTasks.reportId, taskReport.id))
    .where(eq(cleanupTasks.id, id))
    .limit(1);
  return row ? toListItem(row.task, row.volunteerName, row.report) : null;
}

export async function getRawTask(id: string): Promise<CleanupTask | undefined> {
  const [row] = await getDb().select().from(cleanupTasks).where(eq(cleanupTasks.id, id)).limit(1);
  return row;
}

export type AssignError =
  | "report_not_found"
  | "volunteer_not_eligible"
  | "report_closed"
  | "already_assigned";

/**
 * Assigns a report to an eligible (active, role=volunteer) user. Enforced on the
 * server: the caller supplies ids, eligibility is re-checked here.
 */
export async function assignTask(
  actor: User,
  reportId: string,
  volunteerId: string,
  instructions?: string,
): Promise<{ ok: boolean; error?: AssignError; task?: TaskListItem }> {
  const [report] = await getDb().select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) return { ok: false, error: "report_not_found" };
  if (report.status === "resolved" || report.status === "rejected") {
    return { ok: false, error: "report_closed" };
  }

  const volunteer = await findUserById(volunteerId);
  if (!volunteer || !volunteer.isActive || volunteer.role !== "volunteer") {
    return { ok: false, error: "volunteer_not_eligible" };
  }

  const [existing] = await getDb()
    .select({ id: cleanupTasks.id })
    .from(cleanupTasks)
    .where(
      and(
        eq(cleanupTasks.reportId, reportId),
        inArray(cleanupTasks.status, ["assigned", "in_progress"]),
      ),
    )
    .limit(1);
  if (existing) return { ok: false, error: "already_assigned" };

  const [task] = await getDb()
    .insert(cleanupTasks)
    .values({
      reportId,
      volunteerId,
      assignedById: actor.id,
      instructions: instructions?.trim() || null,
      status: "assigned",
    })
    .returning();

  await assignVolunteerToReport(reportId, volunteerId);
  if (report.status === "submitted") await updateReportStatus(reportId, "in_progress");
  await recordAudit(actor.id, "task.assigned", "cleanup_task", task.id, {
    reportId,
    volunteerId,
  });

  return { ok: true, task: (await getTask(task.id)) ?? undefined };
}

export type TaskActionError =
  | "not_found"
  | "forbidden"
  | "invalid_transition"
  | "evidence_required";

/**
 * Pure ownership/transition check for a volunteer acting on their own task.
 * Extracted so the rule is unit-testable and impossible to bypass from the UI.
 */
export function evaluateVolunteerAction(
  actorId: string,
  task: Pick<CleanupTask, "volunteerId" | "status" | "afterPhotoUrl"> | undefined,
  action: "start" | "complete",
  afterPhotoUrl?: string | null,
): TaskActionError | null {
  if (!task) return "not_found";
  if (task.volunteerId !== actorId) return "forbidden";

  if (action === "start") {
    return task.status === "assigned" ? null : "invalid_transition";
  }

  if (task.status !== "assigned" && task.status !== "in_progress") {
    return "invalid_transition";
  }
  const evidence = afterPhotoUrl?.trim() || task.afterPhotoUrl;
  return evidence ? null : "evidence_required";
}

export interface TaskActionResult {
  ok: boolean;
  error?: TaskActionError;
  task?: TaskListItem;
}

/**
 * Volunteer transitions. Ownership is verified against the stored `volunteerId`;
 * the client cannot act on someone else's task even by passing its id.
 */
export async function volunteerTaskAction(
  actor: User,
  taskId: string,
  action: "start" | "complete",
  payload?: {
    beforePhotoUrl?: string | null;
    afterPhotoUrl?: string | null;
    notes?: string | null;
  },
): Promise<TaskActionResult> {
  const task = await getRawTask(taskId);
  const denied = evaluateVolunteerAction(actor.id, task, action, payload?.afterPhotoUrl);
  if (denied) return { ok: false, error: denied };
  if (!task) return { ok: false, error: "not_found" }; // unreachable; narrows the type

  if (action === "start") {
    const [updated] = await getDb()
      .update(cleanupTasks)
      .set({
        status: "in_progress",
        startedAt: new Date(),
        beforePhotoUrl: payload?.beforePhotoUrl ?? task.beforePhotoUrl,
        notes: payload?.notes ?? task.notes,
      })
      .where(and(eq(cleanupTasks.id, taskId), eq(cleanupTasks.status, "assigned")))
      .returning();
    if (!updated) return { ok: false, error: "invalid_transition" };

    await updateReportStatus(task.reportId, "in_progress");
    await recordAudit(actor.id, "task.started", "cleanup_task", taskId);
    return { ok: true, task: (await getTask(taskId)) ?? undefined };
  }

  const afterPhotoUrl = (payload?.afterPhotoUrl?.trim() || task.afterPhotoUrl) as string;
  const points = config.cleanupPoints;
  const [updated] = await getDb()
    .update(cleanupTasks)
    .set({
      status: "completed",
      completedAt: new Date(),
      startedAt: task.startedAt ?? new Date(),
      afterPhotoUrl,
      beforePhotoUrl: payload?.beforePhotoUrl ?? task.beforePhotoUrl,
      notes: payload?.notes ?? task.notes,
      pointsAwarded: points,
    })
    .where(eq(cleanupTasks.id, taskId))
    .returning();
  if (!updated) return { ok: false, error: "invalid_transition" };

  await updateReportStatus(task.reportId, "resolved");
  await assignVolunteerToReport(task.reportId, task.volunteerId);

  // Points are derived on the server; the client cannot send them.
  await getDb()
    .update(users)
    .set({ points: sql`${users.points} + ${points}` })
    .where(eq(users.id, task.volunteerId));

  await recordAudit(actor.id, "task.completed", "cleanup_task", taskId, { points });
  return { ok: true, task: (await getTask(taskId)) ?? undefined };
}

export async function cancelTask(actor: User, taskId: string): Promise<TaskActionResult> {
  const task = await getRawTask(taskId);
  if (!task) return { ok: false, error: "not_found" };
  if (task.status === "completed" || task.status === "cancelled") {
    return { ok: false, error: "invalid_transition" };
  }

  await getDb()
    .update(cleanupTasks)
    .set({ status: "cancelled" })
    .where(eq(cleanupTasks.id, taskId));
  await assignVolunteerToReport(task.reportId, null);
  await updateReportStatus(task.reportId, "submitted");
  await recordAudit(actor.id, "task.cancelled", "cleanup_task", taskId);
  return { ok: true, task: (await getTask(taskId)) ?? undefined };
}

export async function getTaskCounts(volunteerId?: string): Promise<Record<TaskStatus | "total", number>> {
  const rows = await getDb()
    .select({ status: cleanupTasks.status, value: count() })
    .from(cleanupTasks)
    .where(volunteerId ? eq(cleanupTasks.volunteerId, volunteerId) : undefined)
    .groupBy(cleanupTasks.status);

  const counts: Record<TaskStatus | "total", number> = {
    assigned: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  };
  for (const row of rows) {
    counts[row.status] = row.value;
    counts.total += row.value;
  }
  return counts;
}

/** Unassigned, open reports a volunteer could pick up. */
export async function listOpenUnassignedReports(limit = 20) {
  return getDb()
    .select({
      id: reports.id,
      title: reports.title,
      category: reports.category,
      status: reports.status,
      latitude: reports.latitude,
      longitude: reports.longitude,
      locationName: reports.locationName,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .leftJoin(
      cleanupTasks,
      and(
        eq(cleanupTasks.reportId, reports.id),
        inArray(cleanupTasks.status, ["assigned", "in_progress"]),
      ),
    )
    .where(and(eq(reports.status, "submitted"), sql`${cleanupTasks.id} IS NULL`))
    .orderBy(desc(reports.createdAt))
    .limit(limit);
}
