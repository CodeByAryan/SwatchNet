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
    <header className="sticky top-0 z-40 border-b border-[#e5e9e2] bg-[#fbfcf9]/95 backdrop-blur-md">
      <div className="section-wrap">
        <div className="flex h-[4.5rem] items-center justify-between sm:h-[5rem]">
          {/* Logo / Wordmark */}
          <a
            href="#hero"
            onClick={(e) => handleLinkClick(e, "#hero")}
            className="group flex min-h-11 items-center gap-3 rounded-lg focus:outline-none"
            aria-label="SwatchNet Home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173d2d] text-white transition-colors group-hover:bg-[#244d39]">
              <Trees className="h-5 w-5 text-[#c8ddb5]" strokeWidth={1.8} />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-[1.2rem] font-bold leading-none tracking-[-0.045em] text-[#1d2922]">
                Swatch<span className="text-[#54774b]">Net</span>
              </span>
              <span className="mt-1 text-[9px] font-semibold uppercase leading-none tracking-[0.15em] text-[#718075]">
                Civic cleanliness
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="rounded-md py-2 text-[13px] font-medium text-[#59675d] transition-colors hover:text-[#173d2d]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs (Desktop) */}
          <div className="hidden items-center gap-2.5 md:flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignInClick}
              className="text-[#34463a] hover:bg-[#eef2ea] hover:text-[#173d2d]"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onReportClick}
              className="group rounded-lg px-4"
            >
              <span>Report Garbage</span>
              <ArrowRight className="h-4 w-4 text-[#cde2bf] transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#34463a] transition-colors hover:bg-[#eef2ea] hover:text-[#173d2d]"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-[#e5e9e2] bg-[#fbfcf9] px-4 pb-5 pt-2 shadow-md md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[#46544a] transition-colors hover:bg-[#eef2ea] hover:text-[#173d2d]"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-[#e5e9e2] pt-4">
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
