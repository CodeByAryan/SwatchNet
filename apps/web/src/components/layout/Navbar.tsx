import React, { useState } from "react";
import { Trees, Menu, X, ArrowRight, LogOut } from "lucide-react";
import { Button } from "../ui/Button";
import type { SessionUser } from "../../session/SessionProvider";

export interface NavbarProps {
  currentTab: "home" | "feed" | "report" | "cleaner";
  onTabChange: (tab: "home" | "feed" | "report" | "cleaner") => void;
  apiStatus?: "connected" | "connecting" | "offline";
  onSignInClick: () => void;
  onSignUpClick: () => void;
  user?: SessionUser;
  /** Clears the Neon Auth session; the navbar only renders sign-out when signed in. */
  onSignOut?: () => Promise<void>;
}

export function Navbar({
  currentTab,
  onTabChange,
  apiStatus = "connected",
  onSignInClick,
  onSignUpClick,
  user,
  onSignOut,
}: NavbarProps): React.JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const signOut = onSignOut ?? (async () => undefined);

  const navLinks = [
    { label: "Overview", tab: "home" as const },
    { label: "Public Feed", tab: "feed" as const },
    { label: "Cleaner Squad", tab: "cleaner" as const },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#e1e7e0] bg-[#ffffff]/95 backdrop-blur-md">
      <div className="section-wrap">
        <div className="flex h-16 items-center justify-between sm:h-[4.5rem]">
          {/* Logo / Wordmark */}
          <button
            type="button"
            onClick={() => {
              onTabChange("home");
              setMobileMenuOpen(false);
            }}
            className="group flex min-h-11 items-center gap-3 rounded-lg text-left focus:outline-none"
            aria-label="SwatchNet Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#163d32] text-white shadow-2xs transition-colors group-hover:bg-[#1f4f41]">
              <Trees className="h-4 w-4 text-[#e6f3eb]" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold leading-none tracking-[-0.03em] text-[#202923]">
                Swatch<span className="text-[#248a61]">Net</span>
              </span>
              <span className="mt-1 text-[9px] font-semibold uppercase leading-none tracking-[0.14em] text-[#68756d]">
                Civic Accountability
              </span>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => onTabChange(link.tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${currentTab === link.tab
                    ? "bg-[#e6f3eb] text-[#163d32]"
                    : "text-[#68756d] hover:bg-[#f7f8f4] hover:text-[#202923]"
                  }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Action CTAs (Desktop) */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Live Backend Connection indicator */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e1e7e0] bg-[#f7f8f4] px-2.5 py-1 text-[11px] font-medium text-[#68756d]"
              title="API Service Health"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${apiStatus === "connected"
                    ? "bg-[#248a61]"
                    : apiStatus === "connecting"
                      ? "bg-[#d99a35] animate-pulse"
                      : "bg-[#c94c4c]"
                  }`}
              />
              <span className="capitalize">{apiStatus === "connected" ? "Live" : apiStatus}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onSignInClick}
            >
              Sign in
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={onSignUpClick}
              className="group"
            >
              <span>Get started</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#202923] hover:bg-[#f7f8f4]"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-[#e1e7e0] bg-white px-4 pb-5 pt-3 shadow-md md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onTabChange(link.tab);
                }}
                className={`flex min-h-11 items-center rounded-lg px-3 text-left text-sm font-semibold transition-colors ${currentTab === link.tab
                    ? "bg-[#e6f3eb] text-[#163d32]"
                    : "text-[#68756d] hover:bg-[#f7f8f4] hover:text-[#202923]"
                  }`}
              >
                {link.label}
              </button>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-[#e1e7e0] pt-4">
              {user ? (
                <>
                  <span className="px-1 text-xs text-[#68756d]">
                    Signed in as <strong className="text-[#202923]">{user.name}</strong>
                  </span>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.location.assign(
                        user.role === "super_admin" ? "/admin/super" : user.role === "admin" ? "/admin" : user.role === "volunteer" ? "/volunteer" : "/dashboard",
                      );
                    }}
                    className="w-full justify-center"
                  >
                    Open my dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await signOut();
                      window.location.assign("/");
                    }}
                    className="w-full justify-center"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignInClick();
                    }}
                    className="w-full justify-center"
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignUpClick();
                    }}
                    className="w-full justify-center"
                  >
                    Get started
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignUpClick();
                }}
                className="w-full justify-center"
              >
                Report Waste Now
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
