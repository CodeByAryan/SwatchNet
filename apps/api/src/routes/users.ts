import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/neonAuth.js";
import { getCurrentUser } from "../middleware/neonAuth.js";
import { requireAdmin, requireSuperAdmin } from "../middleware/authorization.js";
import {
  changeUserRole,
  findUserById,
  listEligibleVolunteers,
  listUsers,
  setUserActive,
  toPublicUser,
} from "../services/users.js";
import { USER_ROLES, type UserRole } from "../db/schema.js";
import { fail, isValidRole, ok, parsePage, parsePositiveInt, validateBody } from "../utils/validation.js";

export const usersRouter = Router();

const roleChangeSchema = z
  .object({ role: z.enum(USER_ROLES) })
  .strict();

const activeSchema = z.object({ isActive: z.boolean() }).strict();



/**
 * Super Admin: paginated directory with search + role filter.
 * `requireSuperAdmin` reads the role from the database, not the token/body.
 */
usersRouter.get("/", requireSuperAdmin, asyncHandler(async (req, res) => {
  const page = parsePage(req.query.page, 20);
  const pageSize = parsePositiveInt(req.query.pageSize, 20, 100);
  const rawRole = typeof req.query.role === "string" ? req.query.role : undefined;
  if (rawRole && !isValidRole(rawRole)) {
    fail(res, 400, "Unknown role filter.");
    return;
  }
  const roleParam: UserRole | undefined = isValidRole(rawRole) ? rawRole : undefined;

  const result = await listUsers({
    page,
    pageSize,
    search: typeof req.query.search === "string" ? req.query.search.trim() : undefined,
    role: roleParam,
    isActive:
      req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
  });
  ok(res, result);
}));

/** Admin + Super Admin: volunteers eligible for assignment. */
usersRouter.get("/volunteers", requireAdmin, asyncHandler(async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
  ok(res, { items: await listEligibleVolunteers(search) });
}));

usersRouter.get("/:id", requireAdmin, asyncHandler(async (req, res) => {
  const user = await findUserById(req.params.id);
  if (!user) {
    fail(res, 404, "User not found.");
    return;
  }
  ok(res, { user: toPublicUser(user) });
}));

/**
 * Super Admin only. Policy (self-change, Admin scope, last Super Admin) lives in
 * `changeUserRole` so it cannot be bypassed from a client.
 * A client-supplied role is accepted only *after* the caller is confirmed as a
 * Super Admin; it can never be used to prove authorization.
 */
usersRouter.patch(
  "/:id/role",
  requireSuperAdmin,
  validateBody(roleChangeSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = getCurrentUser(req);
    const { role } = req.body as z.infer<typeof roleChangeSchema>;
    const result = await changeUserRole(actor, req.params.id, role);

    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : result.error === "self_change" ? 400 : 403;
      const messages: Record<string, string> = {
        not_found: "User not found.",
        self_change: "You cannot change your own role.",
        admin_cannot_assign_privileged: "Admins cannot grant privileged roles.",
        admin_cannot_modify_privileged: "Admins cannot modify privileged accounts.",
        last_super_admin: "The last Super Admin cannot be demoted.",
        already_super_admin: "That user already has this role.",
      };
      fail(res, status, messages[result.error ?? ""] ?? "Role change rejected.", result.error);
      return;
    }

    ok(res, { user: result.user ? toPublicUser(result.user) : null });
  }),
);

usersRouter.patch(
  "/:id/status",
  requireSuperAdmin,
  validateBody(activeSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = getCurrentUser(req);
    const { isActive } = req.body as z.infer<typeof activeSchema>;
    const result = await setUserActive(actor, req.params.id, isActive);
    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : result.error === "self_change" ? 400 : 403;
      const messages: Record<string, string> = {
        not_found: "User not found.",
        self_change: "You cannot deactivate your own account.",
        last_super_admin: "The last active Super Admin cannot be deactivated.",
        forbidden: "Forbidden.",
      };
      fail(res, status, messages[result.error ?? ""] ?? "Rejected.");
      return;
    }
    ok(res, { user: result.user ?? null });
  }),
);


