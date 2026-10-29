import React, { useEffect } from "react";
import { X, Info, Sparkles, LogIn, Camera } from "lucide-react";
import { Button } from "./Button";

export type ModalType = "report" | "signin" | "info" | null;

export interface PlaceholderModalProps {
  isOpen: boolean;
  type: ModalType;
  title?: string;
  description?: string;
  onClose: () => void;
  onNavigateToReport?: () => void;
  onNavigateToAuth?: () => void;
}

export function PlaceholderModal({
  isOpen,
  type,
  title,
  description,
  onClose,
  onNavigateToReport,
  onNavigateToAuth,
}: PlaceholderModalProps): React.JSX.Element | null {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !type) return null;

  const contentMap = {
    report: {
      badge: "Intake Workflow",
      icon: <Camera className="h-5 w-5 text-[#248a61]" />,
      defaultTitle: "Civic Waste Reporting",
      defaultDesc:
        "Submit photographic proof and exact GPS coordinates to dispatch verified volunteer squads and municipal crews.",
      actionLabel: "Open Report Form",
      actionHandler: onNavigateToReport,
      checklist: [
        "Geotagged image evidence upload",
        "Categorization of debris volume and hazard priority",
        "Direct dispatching to nearby cleaner circles & municipal crews",
      ],
    },
    signin: {
      badge: "Civic Portal Access",
      icon: <LogIn className="h-5 w-5 text-[#248a61]" />,
      defaultTitle: "Authentication & Volunteer Portal",
      defaultDesc:
        "Resident submissions, cleaner task boards, and administrator review with Neon Auth are available in the workspace.",
      actionLabel: "Go to Sign In",
      actionHandler: onNavigateToAuth,
      checklist: [
        "Resident profile with tracked reports and status alerts",
        "Cleaner squad dashboard with assigned cleanup routes",
        "Municipal coordinator review and resolution log",
      ],
    },
    info: {
      badge: "Standards & Verification",
      icon: <Info className="h-5 w-5 text-[#248a61]" />,
      defaultTitle: "SwatchNet Transparency & Guidelines",
      defaultDesc:
        "SwatchNet adheres to open civic principles and photographic verification for every resolved report across participating districts.",
      actionLabel: "Close",
      actionHandler: onClose,
      checklist: [
        "Open-source community reporting protocols",
        "Double-photo verification benchmark (before & after)",
        "Zero simulated statistics policy",
      ],
    },
  };

  const activeContent = contentMap[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#163d32]/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[#e1e7e0] bg-white p-6 sm:p-8 text-left shadow-[0_20px_50px_rgba(22,61,50,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#68756d] transition-colors hover:bg-[#f7f8f4] hover:text-[#202923]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e1e7e0] bg-[#e6f3eb]">
            {activeContent.icon}
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bde3cf] bg-[#e6f3eb] px-2.5 py-0.5 text-xs font-semibold text-[#163d32]">
              <Sparkles className="h-3 w-3 text-[#248a61]" />
              {activeContent.badge}
            </span>
          </div>
        </div>

        <h3 id="modal-title" className="font-display text-xl font-bold tracking-tight text-[#202923] sm:text-2xl">
          {title || activeContent.defaultTitle}
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-[#68756d] sm:text-sm">
          {description || activeContent.defaultDesc}
        </p>

        <div className="mt-5 mb-6 rounded-xl border border-[#e1e7e0] bg-[#f7f8f4] p-4">
          <p className="mb-2 text-[10px] font-bold tracking-wider text-[#68756d] uppercase">
            Standards & Specifications
          </p>
          <ul className="space-y-2 text-xs text-[#202923]">
            {activeContent.checklist.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#248a61]" />
                <span className="leading-normal">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center justify-end gap-2.5 sm:flex-row">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Dismiss
          </Button>
          {activeContent.actionHandler && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                activeContent.actionHandler?.();
              }}
              className="w-full sm:w-auto"
            >
              {activeContent.actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
