import { createAuthClient } from "@neondatabase/neon-js/auth";

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL;

// Build output is also used in environments without auth configured, so fail
// closed only when an auth operation is actually attempted.
export const authClient = neonAuthUrl ? createAuthClient(neonAuthUrl) : null;
