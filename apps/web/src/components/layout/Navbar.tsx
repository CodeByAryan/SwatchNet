import React, { useState } from "react";
import { Trees, Menu, X, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";

export interface NavbarProps {
  onReportClick: () => void;
  onSignInClick: () => void;
}

export function Navbar({ onReportClick, onSignInClick }: NavbarProps): React.JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Our Impact", href: "#our-impact" },
    { label: "About", href: "#about" },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo / Wordmark */}
          <a
            href="#hero"
            onClick={(e) => handleLinkClick(e, "#hero")}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            aria-label="SwatchNet Home"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs group-hover:bg-emerald-900 transition-colors">
              <Trees className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-stone-900 leading-none">
                Swatch<span className="text-emerald-800">Net</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-500 mt-0.5">
                Civic Cleanliness
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-sm font-medium text-stone-600 hover:text-emerald-800 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignInClick}
              className="text-stone-700 hover:text-emerald-900"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onReportClick}
              className="group"
            >
              <span>Report Garbage</span>
              <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-white px-4 pt-3 pb-6 shadow-lg animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-3" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="px-3 py-2 text-base font-medium text-stone-700 hover:text-emerald-800 hover:bg-stone-50 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-stone-200 flex flex-col gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignInClick();
                }}
                className="w-full justify-center"
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onReportClick();
                }}
                className="w-full justify-center"
              >
                Report Garbage
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
