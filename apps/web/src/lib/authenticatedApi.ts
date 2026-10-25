import { authClient } from "./auth";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

/** Call a protected API endpoint with a fresh Neon Auth JWT. */
export async function authenticatedApiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const client = authClient;
  if (!client) {
    throw new Error("VITE_NEON_AUTH_URL is not configured.");
  }

  const { data, error } = await client.token();
  if (error || !data?.token) {
    throw new Error("A valid Neon Auth session is required.");
  }

  const normalizedPath = path.replace(/^\/+/, "");
  const response = await fetch(`${API_BASE_URL}/${normalizedPath}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${data.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}
