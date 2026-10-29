import { createAuthClient } from "@neondatabase/neon-js/auth";
import { signOutAndClearNeonSession } from "./neonSession";

/** Public auth endpoint copied from Neon Console -> Auth -> Configuration. */
const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL?.trim();

/** Neon Auth's supported Better Auth client; all session cookies remain SDK-managed. */
export const authClient = neonAuthUrl ? createAuthClient(neonAuthUrl) : null;
export const isAuthConfigured = authClient !== null;

export const AUTH_CALLBACK_PATH = "/auth/callback";
export const SIGN_IN_CALLBACK_URL = typeof window !== "undefined"
  ? new URL(AUTH_CALLBACK_PATH, window.location.origin).toString()
  : AUTH_CALLBACK_PATH;

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
}

export type AuthMode = "signIn" | "signUp";

/** Neon Auth starts the official Google social OAuth flow and owns its state/cookies. */
export async function startGoogleAuth(
  mode: AuthMode,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!authClient) {
    return { ok: false, message: "Neon Auth is not configured. Set VITE_NEON_AUTH_URL." };
  }
  try {
    const callbackURL = typeof window !== "undefined"
      ? new URL(AUTH_CALLBACK_PATH, window.location.origin).toString()
      : SIGN_IN_CALLBACK_URL;
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
    if (result.error) {
      return { ok: false, message: result.error.message ?? `Google ${mode === "signUp" ? "sign-up" : "sign-in"} failed.` };
    }
    if (result.data?.url) window.location.assign(result.data.url);
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Could not start Google sign-in. Please try again.",
    };
  }
}

/** SDK session info is UI-only; the Express API verifies a fresh Neon Auth JWT. */
export async function getCurrentSessionUser(): Promise<AuthSessionUser | null> {
  if (!authClient) return null;
  try {
    const result = await authClient.getSession();
    const user = result.data?.user;
    if (result.error || !user) return null;
    return {
      id: user.id,
      email: user.email ?? "",
      name: user.name ?? user.email?.split("@")[0] ?? "SwatchNet member",
    };
  } catch {
    return null;
  }
}

/** Fetches a fresh JWT using Neon Auth's supported token endpoint. */
export async function getNeonAuthToken(): Promise<string | null> {
  if (!authClient) return null;
  try {
    const result = await authClient.token();
    if (result.error || !result.data?.token) return null;
    return result.data.token;
  } catch {
    return null;
  }
}

export async function signOutOfNeonAuth(clearLocalSession: () => void = () => undefined): Promise<void> {
  if (!authClient) {
    clearLocalSession();
    return;
  }
  await signOutAndClearNeonSession(authClient, clearLocalSession);
}
