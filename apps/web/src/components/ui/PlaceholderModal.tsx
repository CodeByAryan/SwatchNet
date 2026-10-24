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
      badge: "Feature in Development — Step 1 & 2 Complete",
      icon: <Camera className="w-6 h-6 text-emerald-800" />,
      defaultTitle: "Garbage Reporting Workflow",
      defaultDesc:
        "The photo capture, automatic GPS geotagging, and AI categorization pipeline will be connected in the upcoming feature sprint. The core monorepo foundation and design systems are established.",
      checklist: [
        "Geotagged image upload with automated validation",
        "AI classification of debris type and estimated volume",
        "Real-time dispatch to community cleaners & municipal staff",
      ],
    },
    signin: {
      badge: "Civic Portal Access",
      icon: <LogIn className="w-6 h-6 text-emerald-800" />,
      defaultTitle: "Authentication & Volunteer Portal",
      defaultDesc:
        "Secure resident, volunteer, and administrator logins with role-based access control are scheduled in the next platform release.",
      checklist: [
        "Resident profile with tracked cleanup submissions",
        "Cleaner dashboard with assigned tasks and routing",
        "Municipal administrator review console",
      ],
    },
    info: {
      badge: "Platform Roadmap",
      icon: <Info className="w-6 h-6 text-emerald-800" />,
      defaultTitle: "SwatchNet Development Update",
      defaultDesc:
        "We are currently configuring the core foundation, database models (Neon PostgreSQL + Drizzle ORM), and verified verification pipelines.",
      checklist: [
        "Open-source community reporting protocols",
        "Before-and-after photographic verification",
        "Transparent neighborhood cleanliness scores",
      ],
    },
  };

  const activeContent = contentMap[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-stone-200 p-6 sm:p-8 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            {activeContent.icon}
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-800">
              <Sparkles className="w-3 h-3" />
              {activeContent.badge}
            </span>
          </div>
        </div>

        <h3 id="modal-title" className="text-xl font-bold text-stone-900 mb-2">
          {title || activeContent.defaultTitle}
        </h3>

        <p className="text-sm text-stone-600 leading-relaxed mb-6">
          {description || activeContent.defaultDesc}
        </p>

        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Planned Integration
          </p>
          <ul className="space-y-2 text-xs text-stone-700">
            {activeContent.checklist.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <Button variant="outline" size="md" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Got it, thanks
          </Button>
        </div>
      </div>
    </div>
  );
}
