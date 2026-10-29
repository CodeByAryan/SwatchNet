import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateRoleChange, MINIMUM_SUPER_ADMINS } from "../src/services/users.js";
import { USER_ROLES } from "../src/db/schema.js";
import { userWithRole, users } from "./helpers/testAuth.js";

describe("evaluateRoleChange — pure authorization policy", () => {
  it("blocks a user from changing their own role", () => {
    const self = users.citizen("me@example.com");
    assert.equal(evaluateRoleChange(self, self, "admin", 1), "self_change");
  });

  it("blocks a Super Admin from demoting themselves", () => {
    const me = users.superAdmin("super@example.com");
    assert.equal(evaluateRoleChange(me, me, "admin", 3), "self_change");
  });

  it("returns not_found for a missing target", () => {
    assert.equal(evaluateRoleChange(users.superAdmin(), undefined, "admin", 1), "not_found");
  });

  it("prevents an Admin from promoting anyone to admin", () => {
    const actor = users.admin();
    const target = users.citizen("promote-me@example.com");
    assert.equal(evaluateRoleChange(actor, target, "admin", 1), "admin_cannot_assign_privileged");
  });

  it("prevents an Admin from promoting anyone to super_admin", () => {
    const actor = users.admin();
    const target = users.citizen("promote-me@example.com");
    assert.equal(
      evaluateRoleChange(actor, target, "super_admin", 1),
      "admin_cannot_assign_privileged",
    );
  });

  it("prevents an Admin from modifying an existing admin account", () => {
    const actor = users.admin("admin1@example.com");
    const target = users.admin("admin2@example.com");
    assert.equal(evaluateRoleChange(actor, target, "user", 1), "admin_cannot_modify_privileged");
  });

  it("prevents an Admin from touching a Super Admin account", () => {
    const actor = users.admin();
    const target = users.superAdmin();
    assert.equal(evaluateRoleChange(actor, target, "volunteer", 2), "admin_cannot_modify_privileged");
  });

  it("allows an Admin to approve a citizen as a volunteer", () => {
    const actor = users.admin();
    const target = users.citizen("app@example.com");
    assert.equal(evaluateRoleChange(actor, target, "volunteer", 1), null);
  });

  it("allows a Super Admin to grant the admin role", () => {
    const actor = users.superAdmin();
    const target = users.citizen("new-admin@example.com");
    assert.equal(evaluateRoleChange(actor, target, "admin", 1), null);
  });

  it("allows a Super Admin to grant the super_admin role when others exist", () => {
    const actor = users.superAdmin("super1@example.com");
    const target = users.admin("admin@example.com");
    assert.equal(evaluateRoleChange(actor, target, "super_admin", 1), null);
  });

  it("never removes the last Super Admin", () => {
    const actor = users.superAdmin("super1@example.com");
    const target = users.superAdmin("super2@example.com");
    assert.equal(evaluateRoleChange(actor, target, "admin", MINIMUM_SUPER_ADMINS), "last_super_admin");
    assert.equal(evaluateRoleChange(actor, target, "user", 0), "last_super_admin");
  });

  it("allows demoting a Super Admin once another active one remains", () => {
    const actor = users.superAdmin("super1@example.com");
    const target = users.superAdmin("super2@example.com");
    assert.equal(evaluateRoleChange(actor, target, "admin", 2), null);
  });

  it("rejects a no-op role change", () => {
    const actor = users.superAdmin();
    const target = users.admin("admin@example.com");
    assert.equal(evaluateRoleChange(actor, target, "admin", 1), "already_super_admin");
  });

  it("covers every role pair without throwing", () => {
    for (const actorRole of USER_ROLES) {
      for (const targetRole of USER_ROLES) {
        for (const nextRole of USER_ROLES) {
          const actor = userWithRole(actorRole, `actor-${actorRole}@example.com`);
          const target = userWithRole(targetRole, `target-${targetRole}@example.com`);
          const result = evaluateRoleChange(actor, target, nextRole, 2);
          assert.ok(result === null || typeof result === "string");
        }
      }
    }
  });
});
