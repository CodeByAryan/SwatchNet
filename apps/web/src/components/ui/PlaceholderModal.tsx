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
}

export function PlaceholderModal({
  isOpen,
  type,
  title,
  description,
  onClose,
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
      badge: "Feature in active development",
      icon: <Camera className="h-5 w-5 text-[#245037]" />,
      defaultTitle: "Garbage Reporting Workflow",
      defaultDesc:
        "The photo capture, automatic GPS geotagging, and debris categorization pipeline will be connected in the upcoming release. Monorepo architecture and design systems are established.",
      checklist: [
        "Geotagged image upload with coordinate capture",
        "Categorization of debris volume and hazard level",
        "Direct dispatching to nearby cleaner circles & municipal crews",
      ],
    },
    signin: {
      badge: "Civic Portal Access",
      icon: <LogIn className="h-5 w-5 text-[#245037]" />,
      defaultTitle: "Authentication & Volunteer Portal",
      defaultDesc:
        "Resident submissions, cleaner task boards, and administrator review with Neon Auth are being integrated.",
      checklist: [
        "Resident profile with tracked reports and status alerts",
        "Cleaner squad dashboard with assigned cleanup routes",
        "Municipal coordinator review and resolution log",
      ],
    },
    info: {
      badge: "Platform Roadmap",
      icon: <Info className="h-5 w-5 text-[#245037]" />,
      defaultTitle: "SwatchNet Transparency & Guidelines",
      defaultDesc:
        "SwatchNet adheres to open civic principles and photographic verification for every resolved report across participating districts.",
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#122118]/70 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[#d9e2d6] bg-white p-6 sm:p-8 text-left shadow-[0_20px_50px_rgba(10,25,18,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#657769] transition-colors hover:bg-[#eef2ea] hover:text-[#173d2d]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d8e3d3] bg-[#f2f7ef]">
            {activeContent.icon}
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d2dfcd] bg-[#eef4ea] px-3 py-1 text-xs font-semibold text-[#1c3826]">
              <Sparkles className="h-3 w-3 text-[#527e46]" />
              {activeContent.badge}
            </span>
          </div>
        </div>

        <h3 id="modal-title" className="font-display text-xl font-bold tracking-tight text-[#16241a] sm:text-2xl">
          {title || activeContent.defaultTitle}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-[#56685b]">
          {description || activeContent.defaultDesc}
        </p>

        <div className="mt-5 mb-6 rounded-xl border border-[#e2e8df] bg-[#fbfcf9] p-4">
          <p className="mb-2.5 text-[11px] font-bold tracking-wider text-[#738276] uppercase">
            Planned Technical Steps
          </p>
          <ul className="space-y-2 text-xs text-[#3b4c40]">
            {activeContent.checklist.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3b6644]" />
                <span className="leading-normal">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center justify-end gap-2.5 sm:flex-row">
          <Button variant="outline" size="md" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Understood
          </Button>
        </div>
      </div>
    </div>
  );
}
