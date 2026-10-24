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
    <footer id="about" className="bg-stone-900 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center">
                <Trees className="w-5 h-5 text-emerald-200" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Swatch<span className="text-emerald-400">Net</span>
              </span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed max-w-md">
              SwatchNet empowers citizens, volunteers, and municipal teams to collaboratively
              identify, report, and eliminate local waste. Building cleaner, healthier public
              spaces through verified community action.
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-500 pt-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Civic-tech open standard initiative</span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#hero"
                  onClick={(e) => handleScrollTo(e, "#hero")}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleScrollTo(e, "#how-it-works")}
                  className="hover:text-emerald-400 transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#our-impact"
                  onClick={(e) => handleScrollTo(e, "#our-impact")}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Our Impact
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onReportClick}
                  className="text-stone-300 hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Report Garbage
                </button>
              </li>
            </ul>
          </div>

          {/* Transparency & Community */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">
              Community
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={onSignInClick}
                  className="text-stone-300 hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Volunteer Sign In
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenInfo}
                  className="text-stone-300 hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Cleaner Network
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenInfo}
                  className="text-stone-300 hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Civic Guidelines
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenInfo}
                  className="text-stone-300 hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Open Source Foundation
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {currentYear} SwatchNet. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed for cleaner communities with{" "}
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}
