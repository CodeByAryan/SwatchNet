import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { signOutAndClearNeonSession } from "../../web/src/lib/neonSession.js";

describe("Neon Auth logout", () => {
  it("revokes the Neon session before clearing the local profile state", async () => {
    const calls: string[] = [];
    await signOutAndClearNeonSession(
      {
        async signOut() {
          calls.push("neon-signout");
        },
      },
      () => calls.push("clear-profile"),
    );
    assert.deepEqual(calls, ["neon-signout", "clear-profile"]);
  });

  it("does not mark the browser signed out before Neon confirms logout", async () => {
    let cleared = false;
    await assert.rejects(() =>
      signOutAndClearNeonSession(
        {
          async signOut() {
            throw new Error("Neon Auth unavailable");
          },
        },
        () => {
          cleared = true;
        },
      ),
    );
    assert.equal(cleared, false);
  });

  it("does not clear the local profile when the SDK returns a sign-out error", async () => {
    let cleared = false;
    await assert.rejects(() =>
      signOutAndClearNeonSession(
        { async signOut() { return { error: { message: "Sign-out failed" } }; } },
        () => { cleared = true; },
      ),
    );
    assert.equal(cleared, false);
  });
});
