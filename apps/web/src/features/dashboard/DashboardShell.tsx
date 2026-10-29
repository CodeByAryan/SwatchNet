import React, { useEffect, useRef, useState } from "react";
import { Menu, X, LogOut, UserCircle2, ChevronDown, Trees } from "lucide-react";
import { useSession, dashboardPathForRole } from "../../session/SessionProvider";
import { ROLE_LABELS, type UserRole } from "../../session/roles";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Rendered badge count (e.g. pending queue size). */
  badge?: number;
}

export interface DashboardShellProps {
  title: string;
  subtitle?: string;
  nav: DashboardNavItem[];
  children: React.ReactNode;
  /** Role shown in the sidebar footer chip. */
  role: UserRole;
}

function useCurrentPath(): string {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return path;
}

function navigate(href: string): void {
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0 });
}

/**
 * Shared dashboard chrome: responsive sidebar (drawer on mobile), page header,
 * and a profile menu with secure sign-out. Used by all four role dashboards.
 */
export function DashboardShell({
  title,
  subtitle,
  nav,
  children,
  role,
}: DashboardShellProps): React.JSX.Element {
  const { user, signOut } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentPath = useCurrentPath();

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const isActive = (href: string): boolean =>
    currentPath === href || currentPath.startsWith(`${href}/`);

  const initials = (user?.name ?? "?")
    .split(/\s+/)
    .map((part: string) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navList = (
    <nav aria-label="Dashboard navigation" className="flex flex-1 flex-col gap-1 p-3">
      {nav.map((item) => (
        <button
          key={item.href}
          type="button"
          onClick={() => navigate(item.href)}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={`flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-semibold transition-colors ${isActive(item.href)
              ? "bg-[#163d32] text-white"
              : "text-[#cfe0d6] hover:bg-[#1f4f41] hover:text-white"
            }`}
        >
          <span className="flex items-center gap-3">
            <span className="shrink-0 opacity-90">{item.icon}</span>
            {item.label}
          </span>
          {typeof item.badge === "number" && item.badge > 0 && (
            <span className="rounded-full bg-[#248a61] px-2 py-0.5 text-[11px] font-bold text-white">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#248a61] text-white">
        <Trees className="h-4.5 w-4.5" strokeWidth={2} />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-lg font-bold leading-none text-white">
          Swatch<span className="text-[#2eb07c]">Net</span>
        </span>
        <span className="mt-1 text-[9px] font-semibold uppercase leading-none tracking-[0.14em] text-[#9db8aa]">
          {ROLE_LABELS[role]} workspace
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f7f8f4] text-[#202923]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#163d32] lg:flex">
        {brand}
        {navList}
        <div className="border-t border-[#1f4f41] p-4">
          <a
            href="/"
            className="text-xs font-semibold text-[#9db8aa] transition-colors hover:text-white"
          >
            ← Public site
          </a>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#163d32] shadow-xl">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white/80 hover:bg-[#1f4f41]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navList}
            <div className="border-t border-[#1f4f41] p-4">
              <a href="/" className="text-xs font-semibold text-[#9db8aa] hover:text-white">
                ← Public site
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-[#e1e7e0] bg-white/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#202923] hover:bg-[#f7f8f4] lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-display text-base font-bold text-[#202923] sm:text-lg">
                  {title}
                </h1>
                {subtitle && (
                  <p className="hidden truncate text-xs text-[#68756d] sm:block">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#f7f8f4]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6f3eb] text-xs font-bold text-[#163d32]">
                  {initials || <UserCircle2 className="h-5 w-5" />}
                </span>
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="max-w-[10rem] truncate text-xs font-bold text-[#202923]">
                    {user?.name ?? "Signed in"}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#248a61]">
                    {ROLE_LABELS[role]}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 text-[#68756d]" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border-[#e1e7e0] bg-white shadow-lg"
                >
                  <div className="border-b border-[#e1e7e0] px-4 py-3">
                    <p className="truncate text-sm font-bold text-[#202923]">{user?.name}</p>
                    <p className="truncate text-xs text-[#68756d]">{user?.email}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#248a61]">
                      {ROLE_LABELS[role]}
                      {typeof user?.points === "number" && user.points > 0 && ` · ${user.points} pts`}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(dashboardPathForRole(role));
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-[#202923] hover:bg-[#f7f8f4]"
                  >
                    <UserCircle2 className="h-4 w-4 text-[#68756d]" /> Profile & settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut();
                      window.location.assign("/");
                    }}
                    className="flex w-full items-center gap-2 border-t border-[#e1e7e0] px-4 py-2.5 text-left text-sm font-semibold text-[#c94c4c] hover:bg-[#fcf0f0]"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

/** Reusable building blocks shared by the four dashboards. */
export function SummaryCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "amber" | "blue" | "green" | "red";
  icon?: React.ReactNode;
}): React.JSX.Element {
  const tones = {
    default: "border-[#e1e7e0] bg-white",
    amber: "border-[#f4d399] bg-[#fdf5e8]",
    blue: "border-[#bad4eb] bg-[#edf4fa]",
    green: "border-[#bde3cf] bg-[#e6f3eb]",
    red: "border-[#f3b6b6] bg-[#fcf0f0]",
  } as const;

  return (
    <div className={`rounded-xl border p-4 shadow-xs ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756d]">{label}</span>
        {icon && <span className="text-[#68756d]">{icon}</span>}
      </div>
      <div className="mt-1.5 font-display text-2xl font-bold text-[#202923]">{value}</div>
      {hint && <p className="mt-0.5 text-xs text-[#68756d]">{hint}</p>}
    </div>
  );
}

export function DashboardError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border-[#f3b6b6] bg-[#fcf0f0] p-4 text-sm text-[#9a3434]"
    >
      <p className="font-semibold">Something went wrong.</p>
      <p className="mt-0.5 text-xs">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-lg border-[#f3b6b6] bg-white px-3 py-1.5 text-xs font-semibold text-[#9a3434] hover:bg-white/60"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-dashed border-[#e1e7e0] bg-white p-10 text-center">
      {icon && <div className="mx-auto mb-2 text-[#94a199]">{icon}</div>}
      <p className="text-sm font-semibold text-[#202923]">{title}</p>
      {description && <p className="mt-1 text-xs text-[#68756d]">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10" role="status" aria-label={label}>
      <span className="h-6 w-6 animate-spin rounded-full border-4 border-[#e1e7e0] border-t-[#248a61]" />
      <span className="text-sm text-[#68756d]">{label}</span>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border-[#e1e7e0] bg-white px-3 py-1.5 text-xs font-semibold text-[#202923] disabled:opacity-40"
      >
        ← Previous
      </button>
      <span className="text-xs text-[#68756d]">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border-[#e1e7e0] bg-white px-3 py-1.5 text-xs font-semibold text-[#202923] disabled:opacity-40"
      >
        Next →
      </button>
    </nav>
  );
}
