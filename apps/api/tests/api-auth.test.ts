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

  it("keeps the liveness health endpoint public", async () => {
    const response = await fetch(`${baseUrl}/api/health`, { headers: { Connection: "close" } });
    assert.equal(response.status, 200);
    const payload = await response.json() as HealthResponse;
    assert.equal(payload.success, true);
    assert.equal(payload.data?.status, "ok");
  });

  it("rejects an unauthenticated protected API request", async () => {
    const response = await fetch(`${baseUrl}/api/reports`, { headers: { Connection: "close" } });
    assert.equal(response.status, 401);
    const payload = await response.json() as ErrorResponse;
    assert.equal(payload.success, false);
    assert.match(payload.error?.message ?? "", /Authentication required/i);
  });
});
