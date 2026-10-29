import { and, count, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "../db/index.js";
import {
  users,
  volunteerApplications,
  type ApplicationStatus,
  type User,
  type VolunteerApplication,
} from "../db/schema.js";
import { changeUserRole, findUserById, recordAudit } from "./users.js";

const applicant = alias(users, "applicant");

export interface ApplicationView {
  id: string;
  status: ApplicationStatus;
  motivation: string;
  area: string | null;
  availability: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  applicant: { id: string; name: string; email: string; role: string };
}

export function toApplicationView(
  application: VolunteerApplication,
  user: { id: string; name: string; email: string; role: string },
): ApplicationView {
  return {
    id: application.id,
    status: application.status,
    motivation: application.motivation,
    area: application.area,
    availability: application.availability,
    reviewNote: application.reviewNote,
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
    createdAt: application.createdAt.toISOString(),
    applicant: user,
  };
}

/** A user's own application history (newest first). */
export async function listApplicationsForUser(userId: string): Promise<ApplicationView[]> {
  const [row] = await getDb().select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row) return [];
  const rows = await getDb()
    .select()
    .from(volunteerApplications)
    .where(eq(volunteerApplications.userId, userId))
    .orderBy(desc(volunteerApplications.createdAt));
  return rows.map((application) =>
    toApplicationView(application, {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    }),
  );
}

export type ApplyError = "already_volunteer" | "pending_exists" | "not_eligible";

export async function submitApplication(
  actor: User,
  input: { motivation: string; area?: string; availability?: string },
): Promise<{ ok: boolean; error?: ApplyError; application?: ApplicationView }> {
  if (actor.role !== "user") return { ok: false, error: "already_volunteer" };

  const [pending] = await getDb()
    .select({ id: volunteerApplications.id })
    .from(volunteerApplications)
    .where(
      and(
        eq(volunteerApplications.userId, actor.id),
        eq(volunteerApplications.status, "pending"),
      ),
    )
    .limit(1);
  if (pending) return { ok: false, error: "pending_exists" };

  const [created] = await getDb()
    .insert(volunteerApplications)
    .values({
      userId: actor.id,
      motivation: input.motivation.trim(),
      area: input.area?.trim() || actor.area,
      availability: input.availability?.trim() || null,
      status: "pending",
    })
    .returning();

  await recordAudit(actor.id, "volunteer_application.submitted", "volunteer_application", created.id);
  return {
    ok: true,
    application: toApplicationView(created, {
      id: actor.id,
      name: actor.name,
      email: actor.email,
      role: actor.role,
    }),
  };
}

export interface ApplicationListQuery {
  page: number;
  pageSize: number;
  status?: ApplicationStatus;
}

export async function listApplications(query: ApplicationListQuery): Promise<{
  items: ApplicationView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const where = query.status ? eq(volunteerApplications.status, query.status) : undefined;
  const [rows, [totalRow]] = await Promise.all([
    getDb()
      .select({ application: volunteerApplications, applicant })
      .from(volunteerApplications)
      .innerJoin(applicant, eq(volunteerApplications.userId, applicant.id))
      .where(where)
      .orderBy(desc(volunteerApplications.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    getDb().select({ value: count() }).from(volunteerApplications).where(where),
  ]);

  const total = totalRow?.value ?? 0;
  return {
    items: rows.map((row) =>
      toApplicationView(row.application, {
        id: row.applicant.id,
        name: row.applicant.name,
        email: row.applicant.email,
        role: row.applicant.role,
      }),
    ),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export type ReviewError = "not_found" | "already_reviewed" | "role_change_failed";

/**
 * Approving an application promotes the applicant to `volunteer` — this is the
 * only path into the volunteer role, and it is executed by an Admin or Super
 * Admin. Rejecting never changes the role.
 */
export async function reviewApplication(
  actor: User,
  applicationId: string,
  decision: "approved" | "rejected",
  note?: string,
): Promise<{ ok: boolean; error?: ReviewError }> {
  const [application] = await getDb()
    .select()
    .from(volunteerApplications)
    .where(eq(volunteerApplications.id, applicationId))
    .limit(1);
  if (!application) return { ok: false, error: "not_found" };
  if (application.status !== "pending") return { ok: false, error: "already_reviewed" };

  const applicantUser = await findUserById(application.userId);
  if (!applicantUser) return { ok: false, error: "not_found" };

  if (decision === "approved" && applicantUser.role !== "volunteer") {
    // The same policy gate used by role management: an Admin cannot promote an
    // admin, and nobody can promote themselves.
    if (applicantUser.id === actor.id) return { ok: false, error: "role_change_failed" };
    if (applicantUser.role !== "user") return { ok: false, error: "role_change_failed" };
    const promoted = await changeUserRole(actor, applicantUser.id, "volunteer");
    if (!promoted.ok) return { ok: false, error: "role_change_failed" };
  }

  await getDb()
    .update(volunteerApplications)
    .set({
      status: decision,
      reviewedById: actor.id,
      reviewNote: note?.trim() || null,
      reviewedAt: new Date(),
    })
    .where(eq(volunteerApplications.id, applicationId));

  await recordAudit(actor.id, `volunteer_application.${decision}`, "volunteer_application", applicationId);
  return { ok: true };
}
