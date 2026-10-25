import { authClient } from "./auth";

/** Call a protected same-origin API endpoint with a fresh Neon Auth JWT. */
export async function authenticatedApiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!authClient) {
    throw new Error("VITE_NEON_AUTH_URL is not configured.");
  }

  const client = authClient;
  if (!client) {
    throw new Error("VITE_NEON_AUTH_URL is not configured.");
  }

  const { data, error } = await client.token();
  if (error || !data?.token) {
    throw new Error("A valid Neon Auth session is required.");
  }

  const normalizedPath = path.replace(/^\/+/, "");
  const response = await fetch(`/api/${normalizedPath}`, {
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
