import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  uuid,
  doublePrecision,
  integer,
  index,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Platform roles. `super_admin` is intentionally NOT self-service: it can only
 * be granted by an existing Super Admin (or by the documented bootstrap script).
 */
export const USER_ROLES = ["user", "volunteer", "admin", "super_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Role assigned to every brand-new account by the trusted backend. */
export const DEFAULT_USER_ROLE: UserRole = "user";

export const userRoleEnum = pgEnum("user_role", USER_ROLES);

export const REPORT_STATUSES = [
  "submitted",
  "in_progress",
  "resolved",
  "rejected",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const reportStatusEnum = pgEnum("report_status", REPORT_STATUSES);

export const TASK_STATUSES = ["assigned", "in_progress", "completed", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const taskStatusEnum = pgEnum("cleanup_task_status", TASK_STATUSES);

export const APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const applicationStatusEnum = pgEnum("volunteer_application_status", APPLICATION_STATUSES);

/**
 * Application user profile. `auth_user_id` stores the stable Neon Auth user id
 * (`sub`); a row is created on first verified request with role `user`. The role
 * is never populated from client input.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Matches the verified Neon Auth JWT `sub` claim. */
    authUserId: text("auth_user_id"),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    /** Public, non-sensitive profile text (area / ward). */
    area: text("area"),
    role: userRoleEnum("role").notNull().default(DEFAULT_USER_ROLE),
    /** Community points awarded for completed cleanups. */
    points: integer("points").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("users_role_idx").on(table.role),
    index("users_auth_user_id_idx").on(table.authUserId),
    uniqueIndex("users_auth_user_id_unique").on(table.authUserId),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    status: reportStatusEnum("status").notNull().default("submitted"),
    /** Optional assigned volunteer (single active assignee). */
    assignedVolunteerId: uuid("assigned_volunteer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    locationName: text("location_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("reports_status_idx").on(table.status),
    index("reports_reporter_id_idx").on(table.reporterId),
    index("reports_assigned_volunteer_id_idx").on(table.assignedVolunteerId),
    index("reports_created_at_idx").on(table.createdAt),
  ],
);

export const cleanupTasks = pgTable(
  "cleanup_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    volunteerId: uuid("volunteer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedById: uuid("assigned_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: taskStatusEnum("status").notNull().default("assigned"),
    instructions: text("instructions"),
    beforePhotoUrl: text("before_photo_url"),
    afterPhotoUrl: text("after_photo_url"),
    notes: text("notes"),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("cleanup_tasks_volunteer_idx").on(table.volunteerId),
    index("cleanup_tasks_report_idx").on(table.reportId),
    index("cleanup_tasks_status_idx").on(table.status),
    uniqueIndex("cleanup_tasks_one_active_per_report")
      .on(table.reportId)
      .where(sql`status in ('assigned', 'in_progress')`),
  ],
);

export const volunteerApplications = pgTable(
  "volunteer_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    motivation: text("motivation").notNull(),
    area: text("area"),
    availability: text("availability"),
    status: applicationStatusEnum("status").notNull().default("pending"),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewNote: text("review_note"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("volunteer_applications_user_idx").on(table.userId),
    index("volunteer_applications_status_idx").on(table.status),
    uniqueIndex("volunteer_applications_one_pending_per_user")
      .on(table.userId)
      .where(sql`status = 'pending'`),
  ],
);

/** Append-only audit trail for privileged actions (role changes, assignments). */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("audit_log_created_at_idx").on(table.createdAt)],
);

// Relations are declared with explicit relation names because reports and
// cleanup_tasks each reference `users` more than once.

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type CleanupTask = typeof cleanupTasks.$inferSelect;
export type NewCleanupTask = typeof cleanupTasks.$inferInsert;
export type VolunteerApplication = typeof volunteerApplications.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
