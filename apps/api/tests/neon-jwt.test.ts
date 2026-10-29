import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, SignJWT } from "jose";
import { verifyNeonAuthJwt } from "../src/middleware/neonAuth.js";

describe("Neon Auth JWT verification", () => {
  it("accepts a correctly signed Neon Auth JWT with expected issuer/audience", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const token = await new SignJWT({ email: "citizen@example.com", name: "Citizen" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setSubject("neon-user-123")
      .setIssuer("https://auth.example.test")
      .setAudience("https://auth.example.test")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const payload = await verifyNeonAuthJwt(token, publicKey, "https://auth.example.test");
    assert.equal(payload.sub, "neon-user-123");
    assert.equal(payload.email, "citizen@example.com");
  });

  it("rejects a JWT with the wrong audience", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256" })
      .setSubject("neon-user")
      .setIssuer("https://auth.example.test")
      .setAudience("wrong-audience")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    await assert.rejects(() => verifyNeonAuthJwt(token, publicKey, "https://auth.example.test"));
  });

  it("rejects a forged signature", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const { privateKey: attackerKey } = await generateKeyPair("RS256");
    const token = await new SignJWT({ email: "victim@example.com" })
      .setProtectedHeader({ alg: "RS256" })
      .setSubject("forged-id")
      .setIssuer("https://auth.example.test")
      .setAudience("https://auth.example.test")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(attackerKey);

    await assert.rejects(() => verifyNeonAuthJwt(token, publicKey, "https://auth.example.test"));
  });

  it("rejects an expired JWT", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256" })
      .setSubject("neon-user")
      .setIssuer("https://auth.example.test")
      .setAudience("https://auth.example.test")
      .setIssuedAt(1)
      .setExpirationTime(2)
      .sign(privateKey);

    await assert.rejects(() => verifyNeonAuthJwt(token, publicKey, "https://auth.example.test"));
  });
});
