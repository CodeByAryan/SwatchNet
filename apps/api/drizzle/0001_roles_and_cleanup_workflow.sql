-- ---------------------------------------------------------------------------
-- SwatchNet 0001: role model + cleanup workflow
--
-- Non-destructive by design: no table is dropped and no column is removed.
-- Existing rows are preserved and mapped to the closest new value.
-- Re-runnable: every statement is guarded with IF [NOT] EXISTS because
-- `drizzle-kit migrate` cannot help if an earlier partial run already applied
-- some of these DDL statements.
-- ---------------------------------------------------------------------------

-- 1. Role enum (user < volunteer < admin < super_admin) ----------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE "public"."user_role" AS ENUM ('user', 'volunteer', 'admin', 'super_admin');
  END IF;
END $$;
--> statement-breakpoint

-- Map the legacy app role name to the new default role name.
UPDATE "users" SET "role" = 'user' WHERE "role" = 'citizen';
--> statement-breakpoint

-- 2. Status enums ------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE "public"."report_status" AS ENUM ('submitted', 'in_progress', 'resolved', 'rejected');
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cleanup_task_status') THEN
    CREATE TYPE "public"."cleanup_task_status" AS ENUM ('assigned', 'in_progress', 'completed', 'cancelled');
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'volunteer_application_status') THEN
    CREATE TYPE "public"."volunteer_application_status" AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;
--> statement-breakpoint

-- 3. users: auth identity link, profile fields, points, active flag ----------
-- `auth_user_id` is added nullably so existing rows survive, then a unique
-- index enforces one profile per Neon Auth account.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_user_id" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "area" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "points" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_user_id_unique" ON "users" USING btree ("auth_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_auth_user_id_idx" ON "users" USING btree ("auth_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");
--> statement-breakpoint

-- Convert the role column to the validated enum. The USING cast fails loudly
-- (rolling back the migration) rather than silently discarding an invalid role.
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."user_role";
--> statement-breakpoint

-- 4. reports: optional assignee + display location ---------------------------
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "assigned_volunteer_id" uuid;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "location_name" text;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_assigned_volunteer_id_users_id_fk') THEN
    ALTER TABLE "reports" ADD CONSTRAINT "reports_assigned_volunteer_id_users_id_fk"
      FOREIGN KEY ("assigned_volunteer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "status" SET DATA TYPE "public"."report_status" USING "status"::"public"."report_status";
--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "status" SET DEFAULT 'submitted'::"public"."report_status";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_reporter_id_idx" ON "reports" USING btree ("reporter_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_assigned_volunteer_id_idx" ON "reports" USING btree ("assigned_volunteer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_created_at_idx" ON "reports" USING btree ("created_at");
--> statement-breakpoint

-- 5. cleanup tasks ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "cleanup_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "report_id" uuid NOT NULL,
  "volunteer_id" uuid NOT NULL,
  "assigned_by_id" uuid,
  "status" "cleanup_task_status" DEFAULT 'assigned' NOT NULL,
  "instructions" text,
  "before_photo_url" text,
  "after_photo_url" text,
  "notes" text,
  "points_awarded" integer DEFAULT 0 NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cleanup_tasks_report_id_reports_id_fk') THEN
    ALTER TABLE "cleanup_tasks" ADD CONSTRAINT "cleanup_tasks_report_id_reports_id_fk"
      FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cleanup_tasks_volunteer_id_users_id_fk') THEN
    ALTER TABLE "cleanup_tasks" ADD CONSTRAINT "cleanup_tasks_volunteer_id_users_id_fk"
      FOREIGN KEY ("volunteer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cleanup_tasks_assigned_by_id_users_id_fk') THEN
    ALTER TABLE "cleanup_tasks" ADD CONSTRAINT "cleanup_tasks_assigned_by_id_users_id_fk"
      FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cleanup_tasks_volunteer_idx" ON "cleanup_tasks" USING btree ("volunteer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cleanup_tasks_report_idx" ON "cleanup_tasks" USING btree ("report_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cleanup_tasks_status_idx" ON "cleanup_tasks" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cleanup_tasks_one_active_per_report"
  ON "cleanup_tasks" USING btree ("report_id") WHERE status in ('assigned', 'in_progress');
--> statement-breakpoint

-- 6. volunteer applications --------------------------------------------------
CREATE TABLE IF NOT EXISTS "volunteer_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "motivation" text NOT NULL,
  "area" text,
  "availability" text,
  "status" "volunteer_application_status" DEFAULT 'pending' NOT NULL,
  "reviewed_by_id" uuid,
  "review_note" text,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'volunteer_applications_user_id_users_id_fk') THEN
    ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'volunteer_applications_reviewed_by_id_users_id_fk') THEN
    ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_reviewed_by_id_users_id_fk"
      FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_applications_user_idx" ON "volunteer_applications" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_applications_status_idx" ON "volunteer_applications" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "volunteer_applications_one_pending_per_user"
  ON "volunteer_applications" USING btree ("user_id") WHERE status = 'pending';
--> statement-breakpoint

-- 7. audit log ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_id" uuid,
  "action" text NOT NULL,
  "target_type" text,
  "target_id" text,
  "detail" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_log_actor_id_users_id_fk') THEN
    ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk"
      FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");
