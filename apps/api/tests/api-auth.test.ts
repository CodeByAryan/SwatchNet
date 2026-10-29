import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../src/app.js";
import { checkDatabaseHealth } from "../src/routes/health.js";

type HealthResponse = { success: boolean; data?: Record<string, string> };
type ErrorResponse = { success: boolean; error?: Record<string, string> };

describe("public database health result", () => {
  it("returns only connected status on a successful check", async () => {
    const result = await checkDatabaseHealth(async () => undefined);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, { success: true, data: { status: "connected" } });
  });

  it("returns a generic failure without leaking query or connection details", async () => {
    const result = await checkDatabaseHealth(async () => {
      throw new Error("password=secret host=private.neon.tech SELECT 1");
    });
    assert.equal(result.statusCode, 503);
    assert.deepEqual(result.body, { success: false, error: { message: "Database connection failed." } });
    assert.doesNotMatch(JSON.stringify(result.body), /secret|private\.neon|SELECT/i);
  });
});

describe("Express authentication boundary", () => {
  const app = createApp();
  let server: ReturnType<typeof app.listen>;
  let baseUrl = "";

  before(async () => {
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port.");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    if (!server?.listening) return;
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("keeps the liveness health endpoint public and accessible via /api/health, /api/health/health, and /health", async () => {
    for (const path of ["/api/health", "/api/health/health", "/health"]) {
      const response = await fetch(`${baseUrl}${path}`, { headers: { Connection: "close" } });
      assert.equal(response.status, 200, `${path} should return 200`);
      const payload = await response.json() as HealthResponse & { status?: string };
      assert.equal(payload.success, true);
      assert.equal(payload.status, "ok", `${path} should expose top-level status ok`);
      assert.equal(payload.data?.status, "ok", `${path} should expose data.status ok`);
    }
  });

  it("keeps the database health check public (never requires authentication)", async () => {
    for (const path of ["/api/health/db", "/api/health/health/db", "/health/db"]) {
      const response = await fetch(`${baseUrl}${path}`, { headers: { Connection: "close" } });
      // Depending on whether DATABASE_URL is configured/reachable in this test environment,
      // the status must be either 200 (connected) or 503 (connection failed) — NEVER 401 Unauthorized.
      assert.ok(
        response.status === 200 || response.status === 503,
        `${path} should return 200 or 503, got ${response.status}`,
      );
      assert.notEqual(response.status, 401, `${path} must never require authentication`);
      const payload = await response.json() as Record<string, unknown>;
      assert.ok(typeof payload.success === "boolean");
    }
  });

  it("rejects an unauthenticated protected API request", async () => {
    const response = await fetch(`${baseUrl}/api/reports`, { headers: { Connection: "close" } });
    assert.equal(response.status, 401);
    const payload = await response.json() as ErrorResponse;
    assert.equal(payload.success, false);
    assert.match(payload.error?.message ?? "", /Authentication required/i);
  });
});
