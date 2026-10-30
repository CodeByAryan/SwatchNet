import { getNeonAuthTokenResult, signOutOfNeonAuth } from "./auth";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

/**
 * Fetches a fresh JWT through the supported Neon Auth SDK token endpoint.
 * The API verifies the signature with the Neon Auth project's public JWKS.
 */
export async function authenticatedApiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const auth = await getNeonAuthTokenResult();
  if (auth.status !== "ok") {
    // Only a missing session is the user's to fix. A misconfigured build or an
    // unreachable auth service must not tell a signed-in user to sign in again.
    if (auth.status === "unconfigured") {
      throw new Error("Neon Auth is not configured for this build. Set VITE_NEON_AUTH_URL and rebuild.");
    }
    if (auth.status === "unreachable") {
      throw new Error("Could not reach Neon Auth. Check your connection and try again.");
    }
    throw new Error("A valid Neon Auth session is required. Please sign in again.");
  }
  const token = auth.token;

  const normalizedPath = path.replace(/^\/+/, "");
  const response = await fetch(`${API_BASE_URL}/${normalizedPath}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      await signOutOfNeonAuth().catch(() => undefined);
      window.dispatchEvent(new Event("swatchnet:session-expired"));
    }
    let message = `API request failed (${response.status})`;
    let code: string | undefined;
    try {
      const payload = (await response.json()) as { error?: { message?: string; code?: string } };
      message = payload.error?.message ?? message;
      code = payload.error?.code;
    } catch {
      // Keep the generic HTTP status message if this was not a JSON response.
    }
    const error = new Error(message) as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = code;
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
