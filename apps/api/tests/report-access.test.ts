import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { USER_ROLES, REPORT_STATUSES } from "../src/db/schema.js";
import { validateBody, parsePositiveInt, parsePage, isValidRole, isValidReportStatus } from "../src/utils/validation.js";
import type { Request, Response } from "express";

/**
 * Mirrors the report access decision implemented in `routes/reports.ts`:
 * owners and staff read the full record, everyone else gets the public view.
 */
function reportAccess(actor: { id: string; role: string }, report: { reporterId: string }) {
  const isOwner = report.reporterId === actor.id;
  const isStaff = actor.role === "admin" || actor.role === "super_admin";
  return { fullRecord: isOwner || isStaff, canManage: isStaff };
}

describe("report record access", () => {
  const report = { reporterId: "owner-1" };

  it("gives the owner the full record but no staff powers", () => {
    assert.deepEqual(reportAccess({ id: "owner-1", role: "user" }, report), {
      fullRecord: true,
      canManage: false,
    });
  });

  it("denies another citizen the full record", () => {
    assert.deepEqual(reportAccess({ id: "someone-else", role: "user" }, report), {
      fullRecord: false,
      canManage: false,
    });
  });

  it("denies a volunteer another user's private record", () => {
    assert.equal(reportAccess({ id: "volunteer-1", role: "volunteer" }, report).fullRecord, false);
  });

  it("lets admins and Super Admins read and manage any report", () => {
    assert.deepEqual(reportAccess({ id: "admin-1", role: "admin" }, report), {
      fullRecord: true,
      canManage: true,
    });
    assert.deepEqual(reportAccess({ id: "super-1", role: "super_admin" }, report), {
      fullRecord: true,
      canManage: true,
    });
  });
});

describe("request validation helpers", () => {
  function run(schema: z.ZodTypeAny, body: unknown) {
    const req = { body } as Request;
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
    let passed = false;
    validateBody(schema)(req, res, () => {
      passed = true;
    });
    return { state, passed, body: req.body as unknown };
  }

  it("accepts a valid role enum and rejects unknown values", () => {
    assert.equal(isValidRole("super_admin"), true);
    assert.equal(isValidRole("citizen"), false);
    const schema = z.object({ role: z.enum(USER_ROLES) }).strict();
    assert.equal(run(schema, { role: "admin" }).passed, true);
    assert.equal(run(schema, { role: "root" }).passed, false);
  });

  it("rejects a payload that carries an extra field such as a client role", () => {
    const schema = z.object({ name: z.string() }).strict();
    const result = run(schema, { name: "Aryan", role: "super_admin" });
    assert.equal(result.passed, false);
    assert.equal(result.state.status, 400);
  });

  it("validates report status filters", () => {
    for (const status of REPORT_STATUSES) assert.equal(isValidReportStatus(status), true);
    assert.equal(isValidReportStatus("deleted"), false);
    assert.equal(isValidReportStatus(undefined), false);
  });

  it("clamps pagination to safe bounds", () => {
    assert.equal(parsePage("0", 20), 1);
    assert.equal(parsePage("-5", 20), 1);
    assert.equal(parsePage("3", 20), 3);
    assert.equal(parsePositiveInt("1000", 20, 100), 100);
    assert.equal(parsePositiveInt(undefined, 20, 100), 20);
  });
});
