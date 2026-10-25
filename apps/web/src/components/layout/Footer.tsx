import React from "react";
import { Trees, Shield, Heart } from "lucide-react";

export interface FooterProps {
  onReportClick: () => void;
  onSignInClick: () => void;
  onOpenInfo: () => void;
}

export function Footer({ onReportClick, onSignInClick, onOpenInfo }: FooterProps): React.JSX.Element {
  const currentYear = new Date().getFullYear();

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const elem = document.querySelector(id);
    if (elem) elem.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer id="about" className="border-t border-[#233529] bg-[#14231b] text-[#ccd7ce]">
      <div className="section-wrap py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand & Mission */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#234e38] text-white">
                <Trees className="h-5 w-5 text-[#b9d9a4]" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                Swatch<span className="text-[#84b872]">Net</span>
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[#96a99c]">
              SwatchNet empowers citizens, volunteers, and municipal teams to collaboratively
              identify, report, and eliminate local waste. Building cleaner, healthier public
              spaces through verified community action.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-[#7d9283]">
              <Shield className="h-4 w-4 text-[#75ab62]" />
              <span>Civic-tech open standard initiative</span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="mb-4 text-xs font-semibold tracking-wider text-[#e2ede4] uppercase">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#hero"
                  onClick={(e) => handleScrollTo(e, "#hero")}
                  className="transition-colors hover:text-[#90cb7b]"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleScrollTo(e, "#how-it-works")}
                  className="transition-colors hover:text-[#90cb7b]"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#our-impact"
                  onClick={(e) => handleScrollTo(e, "#our-impact")}
                  className="transition-colors hover:text-[#90cb7b]"
                >
                  Our Impact
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onReportClick}
                  className="cursor-pointer text-left text-[#ccd7ce] transition-colors hover:text-[#90cb7b]"
                >
                  Report Garbage
                </button>
              </li>
            </ul>
          </div>

          {/* Community & Guidelines */}
          <div>
            <h4 className="mb-4 text-xs font-semibold tracking-wider text-[#e2ede4] uppercase">
              Community
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={onSignInClick}
                  className="cursor-pointer text-left text-[#ccd7ce] transition-colors hover:text-[#90cb7b]"
                >
                  Volunteer Sign In
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenInfo}
                  className="cursor-pointer text-left text-[#ccd7ce] transition-colors hover:text-[#90cb7b]"
                >
                  Cleaner Network
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenInfo}
                  className="cursor-pointer text-left text-[#ccd7ce] transition-colors hover:text-[#90cb7b]"
                >
                  Civic Guidelines
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenInfo}
                  className="cursor-pointer text-left text-[#ccd7ce] transition-colors hover:text-[#90cb7b]"
                >
                  Open Source Foundation
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#233529] pt-8 text-xs text-[#7e9184] sm:flex-row">
          <p>© {currentYear} SwatchNet. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed for cleaner communities with{" "}
            <Heart className="inline h-3.5 w-3.5 fill-[#d95a53] text-[#d95a53]" />
          </p>
        </div>
      </div>
    </footer>
  );
}
