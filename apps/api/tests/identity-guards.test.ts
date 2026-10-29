import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import type { NextFunction, Response } from "express";
import {
  pickProfileFields,
  rejectClientSuppliedIdentity,
  requireNeonAuth,
  type AuthenticatedRequest,
} from "../src/middleware/neonAuth.js";
import { authRouter } from "../src/routes/auth.js";

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

describe("Neon Auth authentication middleware", () => {
  it("rejects requests with no Authorization header", async () => {
    const req = { header: () => undefined } as unknown as AuthenticatedRequest;
    const { res, state } = createRes();
    const next = mock.fn<NextFunction>();

    await requireNeonAuth(req, res, next);

    assert.equal(state.status, 401);
    assert.equal(next.mock.callCount(), 0);
  });

  it("rejects a malformed Neon Auth bearer token", async () => {
    const req = {
      header: (name: string) => (name === "authorization" ? "Bearer abc.invalid.token" : undefined),
    } as unknown as AuthenticatedRequest;
    const { res, state } = createRes();
    const next = mock.fn<NextFunction>();

    await requireNeonAuth(req, res, next);

    assert.equal(state.status, 401);
    assert.equal(next.mock.callCount(), 0);
  });
});

describe("client-supplied identity rejection", () => {
  for (const field of ["sub", "email", "userId", "user_id", "authUserId"]) {
    it(`rejects a body that tries to set "${field}"`, () => {
      const req = { body: { [field]: "attacker" }, query: {} } as unknown as AuthenticatedRequest;
      const { res, state } = createRes();
      const next = mock.fn<NextFunction>();

      rejectClientSuppliedIdentity(req, res, next);

      assert.equal(state.status, 400);
      assert.equal(next.mock.callCount(), 0);
      assert.match(JSON.stringify(state.body), new RegExp(field));
    });
  }

  it("rejects identity smuggled through the query string", () => {
    const req = { body: {}, query: { userId: "x" } } as unknown as AuthenticatedRequest;
    const { res, state } = createRes();
    rejectClientSuppliedIdentity(req, res, mock.fn<NextFunction>());
    assert.equal(state.status, 400);
  });

  it("accepts a clean body", () => {
    const req = { body: { title: "Bin overflowing" }, query: {} } as unknown as AuthenticatedRequest;
    const { res, state } = createRes();
    const next = mock.fn<NextFunction>();
    rejectClientSuppliedIdentity(req, res, next);
    assert.equal(state.status, null);
    assert.equal(next.mock.callCount(), 1);
  });
});

describe("profile field whitelist", () => {
  it("keeps only name/phone/area", () => {
    const fields = pickProfileFields({
      name: "  Aryan  ",
      phone: "123",
      area: "Ward 4",
      role: "super_admin",
      points: 9999,
      isActive: false,
    });
    assert.deepEqual(fields, { name: "Aryan", phone: "123", area: "Ward 4" });
    assert.equal("role" in fields, false);
    assert.equal("points" in fields, false);
  });

  it("ignores non-string values rather than coercing them", () => {
    const fields = pickProfileFields({ name: 42, area: { nested: true } });
    assert.deepEqual(fields, {});
  });

  it("allows clearing an optional field with null", () => {
    assert.deepEqual(pickProfileFields({ phone: null }), { phone: null });
  });
});

describe("auth router registration", () => {
  function routeTable(): string[] {
    type Layer = { route?: { path: string; methods: Record<string, boolean> } };
    const stack = (authRouter as unknown as { stack: Layer[] }).stack;
    return stack
      .filter((layer) => layer.route)
      .flatMap((layer) =>
        Object.keys(layer.route!.methods).map((method) => `${method.toUpperCase()} ${layer.route!.path}`),
      );
  }

  it("does not expose a client-writable role endpoint", () => {
    const routes = routeTable();
    assert.ok(routes.includes("GET /me"));
    assert.ok(routes.includes("PATCH /me"));
    const roleRoutes = routes.filter((route) => /role/i.test(route) && !/bootstrap-super-admin/.test(route));
    assert.deepEqual(roleRoutes, [], `unexpected role route(s): ${roleRoutes.join(", ")}`);
  });

  it("scopes the bootstrap endpoint to authenticated callers", () => {
    const layer = (authRouter as unknown as { stack: Array<{ route?: { path: string; stack: Array<{ name: string }> } }> }).stack.find(
      (entry) => entry.route?.path === "/bootstrap-super-admin",
    );
    assert.ok(layer?.route, "bootstrap route must exist");
    const handlers = layer!.route!.stack.map((handler) => handler.name);
    assert.ok(handlers.includes("requireNeonAuth"), "bootstrap must require authentication");
  });
});


