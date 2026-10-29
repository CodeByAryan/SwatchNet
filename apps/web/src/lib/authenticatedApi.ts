import { getNeonAuthToken, signOutOfNeonAuth } from "./auth";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

/**
 * Fetches a fresh JWT through the supported Neon Auth SDK token endpoint.
 * The API verifies the signature with the Neon Auth project's public JWKS.
 */
export async function authenticatedApiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getNeonAuthToken();
  if (!token) {
    throw new Error("A valid Neon Auth session is required. Please sign in again.");
  }

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
