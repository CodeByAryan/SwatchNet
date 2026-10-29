import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateVolunteerAction } from "../src/services/tasks.js";
import type { CleanupTask } from "../src/db/schema.js";

function task(overrides: Partial<CleanupTask> = {}): Pick<CleanupTask, "volunteerId" | "status" | "afterPhotoUrl"> {
  return {
    volunteerId: "volunteer-a",
    status: "assigned",
    afterPhotoUrl: null,
    ...overrides,
  } as Pick<CleanupTask, "volunteerId" | "status" | "afterPhotoUrl">;
}

describe("volunteer task ownership", () => {
  it("rejects a volunteer acting on another volunteer's task", () => {
    assert.equal(evaluateVolunteerAction("volunteer-b", task(), "start"), "forbidden");
    assert.equal(evaluateVolunteerAction("volunteer-b", task({ status: "in_progress" }), "complete", "https://img/x.jpg"), "forbidden");
  });

  it("rejects an admin (or anyone else) who is not the assignee", () => {
    assert.equal(evaluateVolunteerAction("admin-user", task(), "start"), "forbidden");
  });

  it("rejects a missing task", () => {
    assert.equal(evaluateVolunteerAction("volunteer-a", undefined, "start"), "not_found");
  });

  it("lets the assignee start an assigned task", () => {
    assert.equal(evaluateVolunteerAction("volunteer-a", task(), "start"), null);
  });

  it("rejects starting a task that is already in progress or done", () => {
    assert.equal(evaluateVolunteerAction("volunteer-a", task({ status: "in_progress" }), "start"), "invalid_transition");
    assert.equal(evaluateVolunteerAction("volunteer-a", task({ status: "completed" }), "start"), "invalid_transition");
    assert.equal(evaluateVolunteerAction("volunteer-a", task({ status: "cancelled" }), "start"), "invalid_transition");
  });

  it("requires after-cleanup photo evidence to complete", () => {
    assert.equal(evaluateVolunteerAction("volunteer-a", task({ status: "in_progress" }), "complete"), "evidence_required");
    assert.equal(evaluateVolunteerAction("volunteer-a", task({ status: "in_progress" }), "complete", "   "), "evidence_required");
  });

  it("accepts an existing stored photo as evidence", () => {
    assert.equal(
      evaluateVolunteerAction(
        "volunteer-a",
        task({ status: "in_progress", afterPhotoUrl: "https://cdn/after.jpg" }),
        "complete",
      ),
      null,
    );
  });

  it("accepts new evidence supplied in the request", () => {
    assert.equal(
      evaluateVolunteerAction("volunteer-a", task({ status: "in_progress" }), "complete", "https://cdn/new.jpg"),
      null,
    );
  });

  it("rejects completing a cancelled task", () => {
    assert.equal(
      evaluateVolunteerAction("volunteer-a", task({ status: "cancelled" }), "complete", "https://cdn/new.jpg"),
      "invalid_transition",
    );
  });
});
