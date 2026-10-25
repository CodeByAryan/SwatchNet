import { createAuthClient } from "@neondatabase/neon-js/auth";

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL;

// Neon Auth's SDK manages its own session cookie behavior.
export const authClient = neonAuthUrl ? createAuthClient(neonAuthUrl) : null;
