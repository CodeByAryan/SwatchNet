import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/neonAuth.js";
import {
  getCurrentUser,
  pickProfileFields,
  requireNeonAuth,
  UPDATABLE_PROFILE_FIELDS,
} from "../middleware/neonAuth.js";
import {
  bootstrapSuperAdmin,
  findUserById,
  toPublicUser,
  updateUserProfile,
} from "../services/users.js";
import { fail, ok, validateBody } from "../utils/validation.js";

export const authRouter = Router();

const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().max(32).nullable().optional(),
    area: z.string().trim().max(120).nullable().optional(),
  })
  .strict();

/**
 * Returns the caller's profile and server-side role. Identity comes exclusively
 * from the verified Neon Auth token; the role comes exclusively from the database.
 * Client-supplied ids or roles are never echoed back.
 */
authRouter.get("/me", requireNeonAuth, (req: AuthenticatedRequest, res) => {
  ok(res, { user: toPublicUser(getCurrentUser(req)) });
});

/**
 * Called by the client after Neon Auth establishes a Google-backed session.
 * Ensures the profile row exists (default role `user`) and returns it. Identity
 * comes from the verified Neon Auth token, never from this body.
 */
authRouter.post("/sync", requireNeonAuth, validateBody(profileUpdateSchema.partial()), asyncHandler(async (req, res) => {
  const current = getCurrentUser(req as AuthenticatedRequest);
  const fields = pickProfileFields(req.body);
  const updated =
    Object.keys(fields).length > 0 ? await updateUserProfile(current.id, fields) : current;
  ok(res, { user: toPublicUser(updated ?? current) });
}));

authRouter.patch("/me", requireNeonAuth, validateBody(profileUpdateSchema.partial()), asyncHandler(async (req, res) => {
  const current = getCurrentUser(req as AuthenticatedRequest);
  const fields = pickProfileFields(req.body);
  const updated = await updateUserProfile(current.id, fields);
  if (!updated) {
    fail(res, 404, "Profile not found.");
    return;
  }
  ok(res, { user: toPublicUser(updated) });
}));

/**
 * One-time Super Admin bootstrap. Requires an authenticated session whose
 * verified email is listed in SUPER_ADMIN_BOOTSTRAP_EMAIL, and succeeds only
 * while no active Super Admin exists.
 */
authRouter.post("/bootstrap-super-admin", requireNeonAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const current = getCurrentUser(req);
  const result = await bootstrapSuperAdmin(current);
  if (!result.ok) {
    const messages: Record<string, string> = {
      not_configured: "Super Admin bootstrap is not configured for this deployment.",
      not_allowed: "This account is not the configured bootstrap account.",
      already_bootstrapped: "A Super Admin already exists. Ask them to grant access.",
    };
    fail(res, 403, messages[result.error ?? ""] ?? "Bootstrap is not available.");
    return;
  }
  const refreshed = await findUserById(current.id);
  ok(res, { user: toPublicUser(refreshed ?? current) });
}));

/** Field names the client may send on profile updates (used by the profile form). */
authRouter.get("/profile-fields", requireNeonAuth, (_req, res) => {
  ok(res, { fields: UPDATABLE_PROFILE_FIELDS });
});
