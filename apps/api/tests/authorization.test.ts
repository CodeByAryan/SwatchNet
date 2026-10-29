import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";
import {
  requireRole,
  requireMinimumRole,
  requireAdmin,
  requireSuperAdmin,
  requireVolunteer,
} from "../src/middleware/authorization.js";
import {
  hasRoleAtLeast,
  isRole,
  ROLE_RANK,
  type AuthenticatedRequest,
} from "../src/middleware/neonAuth.js";
import { users } from "./helpers/testAuth.js";

/** Minimal Express response double that records the status/body it would send. */
function createRes() {
  const state: { status: number | null; body: unknown } = { status: null, body: null };
  const res = {
    status(code: number) {
      state.status = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload;
      return this;
    },
  } as unknown as Response;
  return { res, state };
}

function run(middleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void, user?: ReturnType<typeof users.citizen>) {
  const req = { currentUser: user } as AuthenticatedRequest;
  const { res, state } = createRes();
  const next = mock.fn<NextFunction>();
  middleware(req, res, next);
  return { state, next };
}

describe("role model", () => {
  it("validates only the four known roles", () => {
    assert.equal(isRole("user"), true);
    assert.equal(isRole("volunteer"), true);
    assert.equal(isRole("admin"), true);
    assert.equal(isRole("super_admin"), true);
    assert.equal(isRole("citizen"), false);
    assert.equal(isRole("SUPER_ADMIN"), false);
    assert.equal(isRole("owner"), false);
    assert.equal(isRole(null), false);
    assert.equal(isRole(undefined), false);
  });

  it("ranks roles user < volunteer < admin < super_admin", () => {
    assert.ok(ROLE_RANK.user < ROLE_RANK.volunteer);
    assert.ok(ROLE_RANK.volunteer < ROLE_RANK.admin);
    assert.ok(ROLE_RANK.admin < ROLE_RANK.super_admin);
    assert.equal(hasRoleAtLeast(users.volunteer(), "admin"), false);
    assert.equal(hasRoleAtLeast(users.admin(), "volunteer"), true);
    assert.equal(hasRoleAtLeast(users.superAdmin(), "super_admin"), true);
  });
});

describe("role guards", () => {
  it("rejects unauthenticated requests with 401", () => {
    const { state, next } = run(requireRole("admin"));
    assert.equal(state.status, 401);
    assert.equal(next.mock.callCount(), 0);
  });

  it("rejects a deactivated account even if a role is present", () => {
    const inactive = users.admin("off@example.com");
    inactive.isActive = false;
    const { state, next } = run(requireRole("admin"), inactive);
    assert.equal(state.status, 401);
    assert.equal(next.mock.callCount(), 0);
  });

  it("allows a citizen through a user-level guard", () => {
    const { state, next } = run(requireMinimumRole("user"), users.citizen());
    assert.equal(state.status, null);
    assert.equal(next.mock.callCount(), 1);
  });

  it("blocks a citizen from admin routes", () => {
    const { state, next } = run(requireAdmin, users.citizen());
    assert.equal(state.status, 403);
    assert.equal(next.mock.callCount(), 0);
  });

  it("blocks a volunteer from admin and super-admin routes", () => {
    assert.equal(run(requireAdmin, users.volunteer()).state.status, 403);
    assert.equal(run(requireSuperAdmin, users.volunteer()).state.status, 403);
  });

  it("blocks an admin from Super Admin-only routes", () => {
    const { state, next } = run(requireSuperAdmin, users.admin());
    assert.equal(state.status, 403);
    assert.equal(next.mock.callCount(), 0);
  });

  it("allows an admin into the admin workspace", () => {
    const { next } = run(requireAdmin, users.admin());
    assert.equal(next.mock.callCount(), 1);
  });

  it("allows a Super Admin into both admin and super-admin workspaces", () => {
    assert.equal(run(requireAdmin, users.superAdmin()).next.mock.callCount(), 1);
    assert.equal(run(requireSuperAdmin, users.superAdmin()).next.mock.callCount(), 1);
  });

  it("blocks citizens from volunteer-only routes", () => {
    const { state } = run(requireVolunteer, users.citizen());
    assert.equal(state.status, 403);
  });

  it("denies a role that is not in the allow-list", () => {
    const { state } = run(requireRole("super_admin"), users.admin());
    assert.equal(state.status, 403);
    assert.match(JSON.stringify(state.body), /Forbidden/);
  });
});
