import type { User, UserRole } from "../../src/db/schema.js";

/** A profile row shaped exactly like a Drizzle `users` select result. */
export function makeUser(overrides: Partial<User> & { email: string; role: UserRole }): User {
  const now = new Date("2026-01-01T00:00:00.000Z");
  return {
    // Stable per email so a fixture keeps the same identity across calls while
    // different users never collide (role checks compare ids).
    id: overrides.id ?? `id-${overrides.email}`,
    authUserId: overrides.authUserId ?? `auth-${overrides.email}`,
    name: overrides.name ?? overrides.email.split("@")[0],
    email: overrides.email,
    phone: overrides.phone ?? null,
    area: overrides.area ?? null,
    points: overrides.points ?? 0,
    isActive: overrides.isActive ?? true,
    role: overrides.role,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

export const users = {
  citizen: (email = "citizen@example.com") => makeUser({ email, role: "user" }),
  volunteer: (email = "volunteer@example.com") => makeUser({ email, role: "volunteer" }),
  admin: (email = "admin@example.com") => makeUser({ email, role: "admin" }),
  superAdmin: (email = "super@example.com") => makeUser({ email, role: "super_admin" }),
};

/** Builds a fixture by platform role name (kept separate from the `users` object above). */
export function userWithRole(role: UserRole, email: string): User {
  const factory = users[role === "user" ? "citizen" : role === "super_admin" ? "superAdmin" : role];
  return factory(email);
}
