import React from "react";
import { Trees, Shield, Heart } from "lucide-react";

export interface FooterProps {
  onReportClick: () => void;
  onSignInClick: () => void;
  onOpenFeed: () => void;
  onOpenInfo: () => void;
}

export function Footer({
  onReportClick,
  onSignInClick,
  onOpenFeed,
  onOpenInfo,
}: FooterProps): React.JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="about" className="border-t border-[#e1e7e0] bg-[#163d32] text-[#e6f3eb]">
      <div className="section-wrap py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand & Mission */}
          <div className="space-y-4 md:col-span-2 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#248a61] text-white">
                <Trees className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                Swatch<span className="text-[#2eb07c]">Net</span>
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-[#e6f3eb]/75 sm:text-sm">
              SwatchNet empowers citizens, volunteers, and municipal teams to collaboratively
              identify, report, and eliminate local waste. Building cleaner, healthier public
              spaces through verified community action.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-[#e6f3eb]/60">
              <Shield className="h-4 w-4 text-[#2eb07c]" />
              <span>Civic-tech open standard initiative</span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div className="text-left">
            <h4 className="mb-4 text-xs font-semibold tracking-wider text-white uppercase">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-[#e6f3eb]/75">
              <li>
                <button
                  type="button"
                  onClick={onOpenFeed}
                  className="cursor-pointer transition-colors hover:text-white"
                >
                  Civic Feed & Log
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onReportClick}
                  className="cursor-pointer transition-colors hover:text-white"
                >
                  Report Garbage
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenInfo}
                  className="cursor-pointer transition-colors hover:text-white"
                >
                  Impact Standards
                </button>
              </li>
            </ul>
          </div>

          {/* Community & Guidelines */}
          <div className="text-left">
            <h4 className="mb-4 text-xs font-semibold tracking-wider text-white uppercase">
              Community
            </h4>
            <ul className="space-y-2.5 text-xs text-[#e6f3eb]/75">
              <li>
                <button
                  type="button"
                  onClick={onSignInClick}
                  className="cursor-pointer transition-colors hover:text-white"
                >
                  Volunteer Sign In
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenInfo}
                  className="cursor-pointer transition-colors hover:text-white"
                >
                  Cleaner Squad Guidelines
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenInfo}
                  className="cursor-pointer transition-colors hover:text-white"
                >
                  Open Source Architecture
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#1f4f41] pt-8 text-xs text-[#e6f3eb]/60 sm:flex-row">
          <p>© {currentYear} SwatchNet. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed for cleaner communities with{" "}
            <Heart className="inline h-3.5 w-3.5 fill-[#c94c4c] text-[#c94c4c]" />
          </p>
        </div>
      </div>
    </footer>
  );
}
