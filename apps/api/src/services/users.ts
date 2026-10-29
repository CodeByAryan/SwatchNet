import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { auditLog, DEFAULT_USER_ROLE, users, type User, type UserRole } from "../db/schema.js";
import { config } from "../config/index.js";

export type { User };

/** Serialised profile returned to clients (never includes auth secrets). */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  area: string | null;
  role: UserRole;
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    area: user.area,
    role: user.role,
    points: user.points,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function findUserById(id: string): Promise<User | undefined> {
  const [row] = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
  return row;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const [row] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return row;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    ((error as { code?: string }).code === "23505" ||
      (error as { cause?: { code?: string } }).cause?.code === "23505")
  );
}

/**
 * Returns the profile linked to a verified Neon Auth identity, creating it
 * with the default `user` role if this is the first authenticated request.
 *
 * Identity comes only from verified Neon Auth JWT claims (`sub`, email, name).
 * A client-supplied role is never read here.
 */
export async function getUserByAuthId(
  authUserId: string,
  tokenEmail?: string,
  tokenName?: string,
): Promise<User | undefined> {
  const db = getDb();
  const [linked] = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (linked) return linked;

  const email = tokenEmail?.trim().toLowerCase();
  if (!email) {
    // Without an email there is nothing to key a profile on. Fail closed.
    return undefined;
  }

  // Do not silently link an existing application account based on an email
  // claim. Email is not the stable Neon Auth identity. Existing profiles must
  // be backfilled by a controlled admin procedure that verifies ownership.
  const [emailCollision] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (emailCollision) return undefined;

  try {
    const [created] = await db
      .insert(users)
      .values({
        authUserId,
        email,
        name: tokenName?.trim() || email.split("@")[0],
        role: DEFAULT_USER_ROLE,
      })
      .returning();
    return created;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    // Concurrent first requests: the other request won the insert.
    const [raced] = await db
      .select()
      .from(users)
      .where(or(eq(users.authUserId, authUserId), eq(users.email, email)))
      .limit(1);
    return raced;
  }
}

/** Updates only the whitelisted profile fields. Role/points are not touchable. */
export async function updateUserProfile(
  userId: string,
  fields: { name?: string | null; phone?: string | null; area?: string | null },
): Promise<User | undefined> {
  const patch: Partial<Pick<User, "name" | "phone" | "area">> = {};
  if (fields.name !== undefined && fields.name !== null && fields.name.trim()) {
    patch.name = fields.name.trim().slice(0, 120);
  }
  if (fields.phone !== undefined) {
    patch.phone = fields.phone === null ? null : fields.phone.trim().slice(0, 32) || null;
  }
  if (fields.area !== undefined) {
    patch.area = fields.area === null ? null : fields.area.trim().slice(0, 120) || null;
  }
  if (Object.keys(patch).length === 0) return findUserById(userId);

  const [updated] = await getDb()
    .update(users)
    .set(patch)
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

export async function getFirstSuperAdminId(): Promise<string | null> {
  const [row] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "super_admin"))
    .limit(1);
  return row?.id ?? null;
}

export async function countSuperAdmins(): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(users)
    .where(and(eq(users.role, "super_admin"), eq(users.isActive, true)));
  return row?.value ?? 0;
}

/** Number of active Super Admins needed to keep the platform administrable. */
export const MINIMUM_SUPER_ADMINS = 1;

/**
 * Pure authorization decision for a role change — no I/O, so every rule is
 * unit-testable. Returns `null` when the change is allowed.
 *
 *  - Nobody can change their own role.
 *  - Only a Super Admin may grant or revoke `admin` / `super_admin`.
 *  - An Admin may only move accounts between `user` and `volunteer`, and may
 *    not modify an account that is already admin-level.
 *  - The last active Super Admin can never be demoted.
 */
export function evaluateRoleChange(
  actor: User,
  target: User | undefined,
  nextRole: UserRole,
  activeSuperAdmins: number,
): RoleChangeError | null {
  if (actor.id === target?.id) return "self_change";
  if (!target) return "not_found";

  const privileged: UserRole[] = ["admin", "super_admin"];

  if (actor.role !== "super_admin") {
    // Admins are limited to the operational roles.
    if (privileged.includes(nextRole)) return "admin_cannot_assign_privileged";
    if (privileged.includes(target.role)) return "admin_cannot_modify_privileged";
  }

  if (target.role === nextRole) return "already_super_admin";

  if (
    target.role === "super_admin" &&
    nextRole !== "super_admin" &&
    activeSuperAdmins <= MINIMUM_SUPER_ADMINS
  ) {
    return "last_super_admin";
  }

  return null;
}

export type RoleChangeError =
  | "not_found"
  | "self_change"
  | "admin_cannot_assign_privileged"
  | "admin_cannot_modify_privileged"
  | "last_super_admin"
  | "already_super_admin";

export interface RoleChangeResult {
  ok: boolean;
  error?: RoleChangeError;
  user?: User;
}

/**
 * Server-side role-assignment policy. Every rule is enforced here rather than
 * in the UI so a crafted request cannot bypass it.
 *
 *  - Nobody can change their own role.
 *  - Only a Super Admin may grant or revoke `admin` / `super_admin`.
 *  - An Admin may only move accounts between `user` and `volunteer`, and may
 *    not modify an account that is already admin-level.
 *  - The last active Super Admin can never be demoted.
 */
export async function changeUserRole(
  actor: User,
  targetUserId: string,
  nextRole: UserRole,
): Promise<RoleChangeResult> {
  const target = await findUserById(targetUserId);
  const activeSuperAdmins = await countSuperAdmins();

  const denied = evaluateRoleChange(actor, target, nextRole, activeSuperAdmins);
  if (denied) return { ok: false, error: denied };
  if (!target) return { ok: false, error: "not_found" }; // unreachable; narrows the type

  const [updated] = await getDb()
    .update(users)
    .set({ role: nextRole })
    .where(eq(users.id, targetUserId))
    .returning();

  await recordAudit(actor.id, "user.role_changed", "user", targetUserId, {
    from: target.role,
    to: nextRole,
  });

  return { ok: true, user: updated };
}

export async function recordAudit(
  actorId: string | null,
  action: string,
  targetType: string | null,
  targetId: string | null,
  detail?: unknown,
): Promise<void> {
  try {
    await getDb()
      .insert(auditLog)
      .values({
        actorId,
        action,
        targetType,
        targetId,
        detail: detail === undefined ? null : JSON.stringify(detail),
      });
  } catch (error) {
    // Auditing must never break the primary operation, but it must be visible.
    console.error("[Audit] failed to record event:", error instanceof Error ? error.message : "unknown");
  }
}

/**
 * One-time Super Admin bootstrap.
 *
 * The caller must (a) be an authenticated Google account whose verified email
 * is listed in the server-only `SUPER_ADMIN_BOOTSTRAP_EMAIL` setting, and
 * (b) there must be no active Super Admin yet. The endpoint can never be used to
 * add a second Super Admin, so it stays safe if the env var is left configured.
 */
export async function bootstrapSuperAdmin(user: User): Promise<{ ok: boolean; error?: string }> {
  if (config.superAdminBootstrapEmails.length === 0) {
    return { ok: false, error: "not_configured" };
  }
  if (!config.superAdminBootstrapEmails.includes(user.email.toLowerCase())) {
    return { ok: false, error: "not_allowed" };
  }
  if ((await countSuperAdmins()) > 0) {
    return { ok: false, error: "already_bootstrapped" };
  }

  const [updated] = await getDb()
    .update(users)
    .set({ role: "super_admin" })
    .where(eq(users.id, user.id))
    .returning();

  if (updated) {
    await recordAudit(updated.id, "user.bootstrap_super_admin", "user", updated.id, {
      email: updated.email,
    });
  }
  return { ok: true };
}

export interface UserListQuery {
  page: number;
  pageSize: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export async function listUsers(query: UserListQuery): Promise<{
  items: PublicUser[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const db = getDb();
  const conditions = [];
  if (query.search) {
    const term = `%${query.search}%`;
    conditions.push(or(ilike(users.name, term), ilike(users.email, term)));
  }
  if (query.role) conditions.push(eq(users.role, query.role));
  if (query.isActive !== undefined) conditions.push(eq(users.isActive, query.isActive));
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ value: count() }).from(users).where(where),
  ]);

  return {
    items: rows.map(toPublicUser),
    total: totalRow?.value ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function setUserActive(
  actor: User,
  targetUserId: string,
  isActive: boolean,
): Promise<{ ok: boolean; error?: string; user?: PublicUser }> {
  if (actor.id === targetUserId) return { ok: false, error: "self_change" };
  const target = await findUserById(targetUserId);
  if (!target) return { ok: false, error: "not_found" };

  if (actor.role !== "super_admin") {
    return { ok: false, error: "forbidden" };
  }
  if (!isActive && target.role === "super_admin" && (await countSuperAdmins()) <= 1) {
    return { ok: false, error: "last_super_admin" };
  }

  const [updated] = await getDb()
    .update(users)
    .set({ isActive })
    .where(eq(users.id, targetUserId))
    .returning();

  await recordAudit(actor.id, isActive ? "user.activated" : "user.deactivated", "user", targetUserId);
  return { ok: true, user: updated ? toPublicUser(updated) : undefined };
}

/** Eligible volunteers for task assignment (active, role volunteer). */
export async function listEligibleVolunteers(search?: string): Promise<PublicUser[]> {
  const searchCondition = search
    ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
    : undefined;
  const rows = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.role, "volunteer"), eq(users.isActive, true), searchCondition))
    .orderBy(users.name)
    .limit(200);
  return rows.map(toPublicUser);
}
