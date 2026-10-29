import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { authenticatedApiRequest } from "../lib/authenticatedApi";
import { getCurrentSessionUser, signOutOfNeonAuth, isAuthConfigured } from "../lib/auth";
import type { UserRole } from "./roles";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  area: string | null;
  role: UserRole;
  points: number;
  createdAt: string;
}

interface SessionState {
  /** undefined = still resolving; null = signed out. */
  user: SessionUser | null | undefined;
  loading: boolean;
  error: string | null;
  /** Refreshes the profile from the backend (after role changes or bootstrap). */
  refresh: () => Promise<SessionUser | null>;
  /** Completes sign-in: syncs the profile (creating it with default role). */
  completeSignIn: () => Promise<SessionUser | null>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { message?: string; code?: string };
}

interface MeResponse {
  user: SessionUser;
}

export function SessionProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const handleExpired = () => {
      setUser(null);
      setError("Your Neon Auth session expired. Please sign in again.");
      setLoading(false);
    };
    window.addEventListener("swatchnet:session-expired", handleExpired);
    return () => {
      mounted.current = false;
      window.removeEventListener("swatchnet:session-expired", handleExpired);
    };
  }, []);

  const fetchProfile = useCallback(async (): Promise<SessionUser | null> => {
    if (!isAuthConfigured) return null;
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) return null;

    const response = await authenticatedApiRequest<ApiEnvelope<MeResponse>>("auth/me");
    if (!response.success || !response.data?.user) {
      throw new Error(response.error?.message ?? "Signed in, but no SwatchNet profile exists yet.");
    }
    return response.data.user;
  }, []);

  // Resolve the session once on mount. A 401 (no/expired token) simply means
  // signed out; anything else is surfaced as an error banner.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const profile = await fetchProfile();
        if (!active) return;
        setUser(profile);
        setError(null);
      } catch (cause) {
        if (!active) return;
        setUser(null);
        setError(cause instanceof Error ? cause.message : "Could not verify your session.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchProfile]);

  const refresh = useCallback(async (): Promise<SessionUser | null> => {
    try {
      const profile = await fetchProfile();
      if (mounted.current) {
        setUser(profile);
        setError(null);
      }
      return profile;
    } catch (cause) {
      if (mounted.current) {
        setError(cause instanceof Error ? cause.message : "Could not refresh your profile.");
      }
      return null;
    }
  }, [fetchProfile]);

  /** Called after Google returns: create/update the profile, then adopt it. */
  const completeSignIn = useCallback(
    async (): Promise<SessionUser | null> => {
      const sessionUser = await getCurrentSessionUser();
      if (!sessionUser) return null;

      // The API verifies the current Neon Auth JWT, maps the verified identity
      // to the profile, and assigns new profiles the default `user` role.
      const response = await authenticatedApiRequest<ApiEnvelope<MeResponse>>("auth/sync", {
        method: "POST",
      });

      if (!response.success || !response.data?.user) {
        throw new Error(response.error?.message ?? "Could not create your SwatchNet profile.");
      }

      if (mounted.current) {
        setUser(response.data.user);
        setError(null);
        setLoading(false);
      }
      return response.data.user;
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    await signOutOfNeonAuth(() => {
      if (mounted.current) {
        setUser(null);
        setError(null);
      }
    });
  }, []);

  const value = useMemo<SessionState>(
    () => ({ user, loading, error, refresh, completeSignIn, signOut }),
    [user, loading, error, refresh, completeSignIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside <SessionProvider>.");
  }
  return context;
}

export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "/admin/super";
    case "admin":
      return "/admin";
    case "volunteer":
      return "/volunteer";
    default:
      return "/dashboard";
  }
}
