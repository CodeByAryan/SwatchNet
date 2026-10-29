import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { startGoogleAuth } from "../../lib/auth";

type GoogleAuthStatus = "idle" | "redirecting" | "cancelled" | "error";

export interface GoogleAuthButtonProps {
  /** "signIn" and "signUp" use the same Google flow; copy differs for clarity. */
  mode: "signIn" | "signUp";
  label?: string;
  /** Called when the user cancels and focus returns to this page unchanged. */
  onCancelled?: () => void;
  disabled?: boolean;
}

function GoogleGlyph({ className = "" }: { className?: string }): React.JSX.Element {
  // Official Google "G" mark, rendered inline so no third-party script is loaded.
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  mode,
  label,
  onCancelled,
  disabled = false,
}: GoogleAuthButtonProps): React.JSX.Element {
  const [status, setStatus] = useState<GoogleAuthStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const isWaiting = status === "redirecting";
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleCancelled = () => {
    setStatus("cancelled");
    onCancelled?.();
  };

  const handleClick = async () => {
    setMessage(null);
    setStatus("redirecting");
    const result = await startGoogleAuth(mode);

    // If the redirect is already under way, this component is being torn down.
    if (!mounted.current) return;

    if (result.ok) {
      // Neon Auth's social sign-in API owns state, cookies and redirect handling.
      return;
    }
    setStatus("error");
    setMessage(result.message);
  };

  const defaultLabel = mode === "signUp" ? "Sign up with Google" : "Continue with Google";
  const buttonLabel = isWaiting
    ? "Redirecting to Google\u2026"
    : status === "error" || status === "cancelled"
      ? `Try ${mode === "signUp" ? "signing up" : "signing in"} with Google again`
      : label ?? defaultLabel;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isWaiting}
        aria-busy={isWaiting}
        className="inline-flex w-full min-h-[2.75rem] cursor-pointer items-center justify-center gap-3 rounded-lg border-[#d7ded6] bg-white px-4 py-2.5 text-sm font-semibold text-[#2b3730] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[#b9c5b8] hover:bg-[#f9faf7] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#248a61] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isWaiting ? (
          <svg
            className="h-4 w-4 animate-spin text-[#248a61]"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          <GoogleGlyph className="h-[1.125rem] w-[1.125rem] shrink-0" />
        )}
        <span>{buttonLabel}</span>
      </button>

      {isWaiting && (
        <p className="text-center text-xs text-[#68756d]" aria-live="polite">
          A Google window should open. Changed your mind?{" "}
          <button
            type="button"
            onClick={handleCancelled}
            className="cursor-pointer font-semibold text-[#248a61] underline underline-offset-2 hover:text-[#163d32]"
          >
            Cancel
          </button>
        </p>
      )}

      {status === "cancelled" && !message && (
        <p className="flex items-start gap-1.5 text-xs text-[#68756d]" role="status">
          <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Google sign-in was cancelled. Nothing changed on your account.</span>
        </p>
      )}

      {message && (
        <p className="flex items-start gap-1.5 text-xs text-[#c94c4c]" role="alert">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
