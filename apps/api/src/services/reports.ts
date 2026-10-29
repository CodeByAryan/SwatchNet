import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "../db/index.js";
import {
  cleanupTasks,
  reports,
  users,
  type CleanupTask,
  type Report,
  type ReportStatus,
} from "../db/schema.js";

// Subquery aliases so one report row can carry both the reporter and assignee.
const volunteer = alias(users, "volunteer");
const reporter = alias(users, "reporter");

export interface ReportListItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  locationName: string | null;
  reporterId: string;
  reporterName: string;
  assignedVolunteerId: string | null;
  assignedVolunteerName: string | null;
  activeTaskId: string | null;
  activeTaskStatus: CleanupTask["status"] | null;
  resolvedPhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportListQuery {
  page: number;
  pageSize: number;
  status?: ReportStatus;
  search?: string;
  reporterId?: string;
  assignedVolunteerId?: string;
  category?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function activeTaskJoin() {
  return and(
    eq(cleanupTasks.reportId, reports.id),
    or(eq(cleanupTasks.status, "assigned"), eq(cleanupTasks.status, "in_progress")),
  );
}

/** Builds the shared select used by every report listing endpoint. */
function baseQuery() {
  const db = getDb();
  return db
    .select({
      report: reports,
      reporterName: reporter.name,
      volunteerName: volunteer.name,
      taskId: cleanupTasks.id,
      taskStatus: cleanupTasks.status,
      afterPhotoUrl: cleanupTasks.afterPhotoUrl,
    })
    .from(reports)
    .innerJoin(reporter, eq(reports.reporterId, reporter.id))
    .leftJoin(volunteer, eq(reports.assignedVolunteerId, volunteer.id))
    .leftJoin(cleanupTasks, activeTaskJoin());
}

type BaseRow = Awaited<ReturnType<typeof baseQuery>>[number];

function toListItem(row: BaseRow): ReportListItem {
  const report = row.report;
  return {
    id: report.id,
    title: report.title,
    description: report.description,
    category: report.category,
    status: report.status,
    latitude: report.latitude,
    longitude: report.longitude,
    locationName: report.locationName,
    reporterId: report.reporterId,
    reporterName: row.reporterName ?? "Resident",
    assignedVolunteerId: report.assignedVolunteerId,
    assignedVolunteerName: row.volunteerName ?? null,
    activeTaskId: row.taskId ?? null,
    activeTaskStatus: row.taskStatus ?? null,
    resolvedPhotoUrl: row.afterPhotoUrl ?? null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export async function listReports(query: ReportListQuery): Promise<Paginated<ReportListItem>> {
  const conditions: (SQL | undefined)[] = [];
  if (query.status) conditions.push(eq(reports.status, query.status));
  if (query.reporterId) conditions.push(eq(reports.reporterId, query.reporterId));
  if (query.assignedVolunteerId) {
    conditions.push(eq(reports.assignedVolunteerId, query.assignedVolunteerId));
  }
  if (query.category) conditions.push(eq(reports.category, query.category));
  if (query.search) {
    const term = `%${query.search}%`;
    conditions.push(or(ilike(reports.title, term), ilike(reports.locationName, term)));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [totalRow]] = await Promise.all([
    baseQuery()
      .where(where)
      .orderBy(desc(reports.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    getDb().select({ value: count() }).from(reports).where(where),
  ]);

  const total = totalRow?.value ?? 0;
  return {
    items: rows.map(toListItem),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getReport(id: string): Promise<ReportListItem | null> {
  const rows = await baseQuery().where(eq(reports.id, id)).limit(1);
  return rows[0] ? toListItem(rows[0]) : null;
}

export async function getRawReport(id: string): Promise<Report | undefined> {
  const [row] = await getDb().select().from(reports).where(eq(reports.id, id)).limit(1);
  return row;
}

export interface CreateReportInput {
  title: string;
  description?: string;
  category: string;
  latitude: number;
  longitude: number;
  locationName?: string;
}

export async function createReport(reporterId: string, input: CreateReportInput): Promise<Report> {
  const [created] = await getDb()
    .insert(reports)
    .values({
      reporterId,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      latitude: input.latitude,
      longitude: input.longitude,
      locationName: input.locationName ?? null,
      status: "submitted",
    })
    .returning();
  return created;
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
): Promise<Report | undefined> {
  const [updated] = await getDb()
    .update(reports)
    .set({ status })
    .where(eq(reports.id, reportId))
    .returning();
  return updated;
}

export async function assignVolunteerToReport(
  reportId: string,
  volunteerId: string | null,
): Promise<void> {
  await getDb()
    .update(reports)
    .set({ assignedVolunteerId: volunteerId })
    .where(eq(reports.id, reportId));
}

/** Aggregate counters for the dashboard summary cards (real data only). */
export async function getReportCounts(): Promise<Record<ReportStatus | "total", number>> {
  const rows = await getDb()
    .select({ status: reports.status, value: count() })
    .from(reports)
    .groupBy(reports.status);

  const counts: Record<ReportStatus | "total", number> = {
    submitted: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
    total: 0,
  };
  for (const row of rows) {
    counts[row.status] = row.value;
    counts.total += row.value;
  }
  return counts;
}

export async function getReportCountsForReporter(
  reporterId: string,
): Promise<Record<ReportStatus | "total", number>> {
  const rows = await getDb()
    .select({ status: reports.status, value: count() })
    .from(reports)
    .where(eq(reports.reporterId, reporterId))
    .groupBy(reports.status);

  const counts: Record<ReportStatus | "total", number> = {
    submitted: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
    total: 0,
  };
  for (const row of rows) {
    counts[row.status] = row.value;
    counts.total += row.value;
  }
  return counts;
}

export async function listRecentPublicActivity(limit = 8): Promise<ReportListItem[]> {
  const page = await listReports({ page: 1, pageSize: limit });
  return page.items;
}
