import { and, count, desc, eq, gte } from "drizzle-orm";
import { getDb } from "../db/index.js";
import {
  auditLog,
  cleanupTasks,
  reports,
  users,
  volunteerApplications,
  type UserRole,
} from "../db/schema.js";
import { getReportCounts, getReportCountsForReporter } from "./reports.js";
import { getTaskCounts } from "./tasks.js";
import { toPublicUser } from "./users.js";

/** Every number below is computed from the database; nothing is hardcoded. */
export interface PlatformStats {
  users: { total: number; byRole: Record<UserRole, number>; newLast7Days: number };
  reports: { total: number; submitted: number; inProgress: number; resolved: number; rejected: number };
  tasks: { total: number; assigned: number; inProgress: number; completed: number; cancelled: number };
  applications: { pending: number };
  activityToday: number;
}

const emptyRoles = (): Record<UserRole, number> => ({
  user: 0,
  volunteer: 0,
  admin: 0,
  super_admin: 0,
});

export async function getPlatformStats(): Promise<PlatformStats> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [roleRows, newUsers, reportCounts, taskCounts, [pendingApplications], [activityToday]] =
    await Promise.all([
      getDb().select({ role: users.role, value: count() }).from(users).groupBy(users.role),
      getDb().select({ value: count() }).from(users).where(gte(users.createdAt, weekAgo)),
      getReportCounts(),
      getTaskCounts(),
      getDb()
        .select({ value: count() })
        .from(volunteerApplications)
        .where(eq(volunteerApplications.status, "pending")),
      getDb()
        .select({ value: count() })
        .from(auditLog)
        .where(gte(auditLog.createdAt, dayAgo)),
    ]);

  const byRole = emptyRoles();
  let total = 0;
  for (const row of roleRows) {
    byRole[row.role] = row.value;
    total += row.value;
  }

  return {
    users: { total, byRole, newLast7Days: newUsers[0]?.value ?? 0 },
    reports: {
      total: reportCounts.total,
      submitted: reportCounts.submitted,
      inProgress: reportCounts.in_progress,
      resolved: reportCounts.resolved,
      rejected: reportCounts.rejected,
    },
    tasks: {
      total: taskCounts.total,
      assigned: taskCounts.assigned,
      inProgress: taskCounts.in_progress,
      completed: taskCounts.completed,
      cancelled: taskCounts.cancelled,
    },
    applications: { pending: pendingApplications?.value ?? 0 },
    activityToday: activityToday?.value ?? 0,
  };
}

export interface CitizenSummary {
  reports: { total: number; submitted: number; inProgress: number; resolved: number; rejected: number };
  points: number;
  pendingApplications: number;
}

export async function getCitizenSummary(userId: string): Promise<CitizenSummary> {
  const [reportCounts, [pointsRow], [pending]] = await Promise.all([
    getReportCountsForReporter(userId),
    getDb().select({ points: users.points }).from(users).where(eq(users.id, userId)).limit(1),
    getDb()
      .select({ value: count() })
      .from(volunteerApplications)
      .where(
        and(eq(volunteerApplications.userId, userId), eq(volunteerApplications.status, "pending")),
      ),
  ]);

  return {
    reports: {
      total: reportCounts.total,
      submitted: reportCounts.submitted,
      inProgress: reportCounts.in_progress,
      resolved: reportCounts.resolved,
      rejected: reportCounts.rejected,
    },
    points: pointsRow?.points ?? 0,
    pendingApplications: pending?.value ?? 0,
  };
}

export interface ActivityEntry {
  id: string;
  action: string;
  actorName: string | null;
  targetType: string | null;
  targetId: string | null;
  detail: string | null;
  createdAt: string;
}

export async function listRecentActivity(limit = 10): Promise<ActivityEntry[]> {
  const rows = await getDb()
    .select({ entry: auditLog, actorName: users.name })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.actorId, users.id))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.entry.id,
    action: row.entry.action,
    actorName: row.actorName ?? null,
    targetType: row.entry.targetType,
    targetId: row.entry.targetId,
    detail: row.entry.detail,
    createdAt: row.entry.createdAt.toISOString(),
  }));
}

export async function listRecentUsers(limit = 5) {
  const rows = await getDb().select().from(users).orderBy(desc(users.createdAt)).limit(limit);
  return rows.map(toPublicUser);
}

/** Operational overview for Admins. */
export async function getOperationsStats() {
  const [reportCounts, taskCounts, [pendingApplications]] = await Promise.all([
    getReportCounts(),
    getTaskCounts(),
    getDb()
      .select({ value: count() })
      .from(volunteerApplications)
      .where(eq(volunteerApplications.status, "pending")),
  ]);

  const [volunteerRow] = await getDb()
    .select({ value: count() })
    .from(users)
    .where(and(eq(users.role, "volunteer"), eq(users.isActive, true)));

  return {
    reports: reportCounts,
    tasks: taskCounts,
    pendingApplications: pendingApplications?.value ?? 0,
    activeVolunteers: volunteerRow?.value ?? 0,
  };
}

/** Volunteer's own performance summary. */
export async function getVolunteerSummary(userId: string) {
  const [taskCounts, [pointsRow], [completedRow]] = await Promise.all([
    getTaskCounts(userId),
    getDb().select({ points: users.points }).from(users).where(eq(users.id, userId)).limit(1),
    getDb()
      .select({ value: count() })
      .from(cleanupTasks)
      .where(and(eq(cleanupTasks.volunteerId, userId), eq(cleanupTasks.status, "completed"))),
  ]);

  return {
    tasks: taskCounts,
    points: pointsRow?.points ?? 0,
    completed: completedRow?.value ?? 0,
  };
}
