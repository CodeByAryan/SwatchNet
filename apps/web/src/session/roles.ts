/**
 * Shared role model mirrored from the backend's validated enum
 * (`apps/api/src/db/schema.ts` → `user_role`). Roles are never chosen in the
 * UI; these constants exist only for rendering labels and route guards.
 */
export const USER_ROLES = ["user", "volunteer", "admin", "super_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Citizen",
  volunteer: "Volunteer",
  admin: "Admin",
  super_admin: "Super Admin",
};

export const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  volunteer: 1,
  admin: 2,
  super_admin: 3,
};

export const hasRoleAtLeast = (role: UserRole, minimum: UserRole): boolean =>
  ROLE_RANK[role] >= ROLE_RANK[minimum];
