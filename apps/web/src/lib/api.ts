const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

/** Configurable API URL; defaults to the Vite proxy path during local development. */
export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const normalizedPath = path.replace(/^\/+/, "");
  const response = await fetch(`${API_BASE_URL}/${normalizedPath}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}
