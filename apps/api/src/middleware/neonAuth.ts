import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey, type KeyInput } from "jose";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config/index.js";
import { getUserByAuthId, type User } from "../services/users.js";
import type { UserRole } from "../db/schema.js";

const neonAuthBaseUrl = config.neonAuthBaseUrl;
const neonAuthIssuer = neonAuthBaseUrl ? new URL(neonAuthBaseUrl).origin : undefined;
const neonJwks = neonAuthBaseUrl
  ? createRemoteJWKSet(new URL(`${neonAuthBaseUrl}/.well-known/jwks.json`))
  : null;

/** Verified Neon Auth identity claims and the server-resolved application profile. */
export interface AuthenticatedRequest extends Request {
  auth?: JWTPayload;
  currentUser?: User;
}

export const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  volunteer: 1,
  admin: 2,
  super_admin: 3,
};

export function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(ROLE_RANK, value);
}

export function hasRoleAtLeast(user: User, minimum: UserRole): boolean {
  return ROLE_RANK[user.role] >= ROLE_RANK[minimum];
}

export async function verifyNeonAuthJwt(
  token: string,
  key: KeyInput | JWTVerifyGetKey,
  issuer: string,
  audience = issuer,
): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, key, {
    issuer,
    audience,
    algorithms: ["RS256", "EdDSA", "ES256"],
  });
  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new Error("Neon Auth JWT does not contain a subject.");
  }
  return payload;
}

export async function attachCurrentUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const sub = req.auth?.sub;
  if (typeof sub !== "string" || !sub) {
    res.status(401).json({ success: false, error: { message: "Invalid access token." } });
    return;
  }

  try {
    const email = typeof req.auth?.email === "string" ? req.auth.email : undefined;
    const name = typeof req.auth?.name === "string" ? req.auth.name : undefined;
    const user = await getUserByAuthId(sub, email, name);
    if (!user || !user.isActive) {
      res.status(403).json({
        success: false,
        error: { message: "This account is not active or its profile is not linked.", code: "ACCOUNT_INACTIVE" },
      });
      return;
    }
    req.currentUser = user;
    next();
  } catch (error) {
    console.error("[Auth] profile lookup failed:", error instanceof Error ? error.message : "unknown");
    res.status(503).json({ success: false, error: { message: "Account service temporarily unavailable." } });
  }
}

/**
 * Verifies Neon Auth JWTs against the JWKS for the configured Neon Auth project.
 * The token is obtained by the official Neon Auth client (`authClient.token()`);
 * identity/role fields in request JSON are never trusted.
 */
export async function requireNeonAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.header("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    res.status(401).json({ success: false, error: { message: "Authentication required." } });
    return;
  }
  if (!neonJwks || !neonAuthIssuer) {
    res.status(503).json({ success: false, error: { message: "Neon Auth is not configured." } });
    return;
  }

  try {
    const payload = await verifyNeonAuthJwt(token, neonJwks, neonAuthIssuer);
    if (typeof payload.sub !== "string" || !payload.sub) {
      res.status(401).json({ success: false, error: { message: "Invalid access token." } });
      return;
    }
    req.auth = payload;
    await attachCurrentUser(req, res, next);
  } catch (error) {
    if (res.headersSent) return;
    const expired = error instanceof Error && error.name === "JWTExpired";
    res.status(401).json({
      success: false,
      error: {
        message: expired ? "Your session has expired. Please sign in again." : "Invalid or expired access token.",
        code: expired ? "SESSION_EXPIRED" : "INVALID_TOKEN",
      },
    });
  }
}

export function getCurrentUser(req: AuthenticatedRequest): User {
  const user = req.currentUser;
  if (!user) throw new Error("Authenticated route reached without a resolved user profile.");
  return user;
}

const identityFields = new Set(["sub", "email", "userId", "user_id", "authUserId"]);

export function rejectClientSuppliedIdentity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const body = req.body as Record<string, unknown> | undefined;
  const query = req.query as Record<string, unknown> | undefined;
  const spoofedField = [...identityFields].find(
    (field) =>
      (body && Object.prototype.hasOwnProperty.call(body, field)) ||
      (query && Object.prototype.hasOwnProperty.call(query, field)),
  );
  if (spoofedField) {
    res.status(400).json({
      success: false,
      error: { message: `"${spoofedField}" must not be supplied; it is derived from your session.` },
    });
    return;
  }
  next();
}

export const UPDATABLE_PROFILE_FIELDS = ["name", "phone", "area"] as const;

export function pickProfileFields(
  body: unknown,
): Partial<Record<(typeof UPDATABLE_PROFILE_FIELDS)[number], string | null>> {
  const out: Partial<Record<(typeof UPDATABLE_PROFILE_FIELDS)[number], string | null>> = {};
  if (!body || typeof body !== "object") return out;
  const record = body as Record<string, unknown>;
  for (const field of UPDATABLE_PROFILE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(record, field)) continue;
    const value = record[field];
    if (value === null) out[field] = null;
    else if (typeof value === "string") out[field] = value.trim();
  }
  return out;
}
