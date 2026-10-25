import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { NextFunction, Request, Response } from "express";

const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
const jwks = authBaseUrl
  ? createRemoteJWKSet(new URL(`${authBaseUrl.replace(/\/$/, "")}/.well-known/jwks.json`))
  : null;
const issuer = authBaseUrl ? new URL(authBaseUrl).origin : null;

export interface AuthenticatedRequest extends Request {
  auth?: JWTPayload;
}

/** Verify Neon Auth JWTs with the managed Auth project's public JWKS. */
export async function requireNeonAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.header("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    res.status(401).json({ success: false, error: { message: "Authentication required." } });
    return;
  }

  if (!jwks || !issuer) {
    res.status(503).json({
      success: false,
      error: { message: "Authentication is not configured." },
    });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, jwks, { issuer });
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: { message: "Invalid or expired access token." } });
  }
}
