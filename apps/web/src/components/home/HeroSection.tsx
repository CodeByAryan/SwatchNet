import React from "react";
import { ArrowRight, MapPin, Camera, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import { SafeImage } from "../ui/SafeImage";

export interface HeroSectionProps {
  onReportClick: () => void;
  onExploreFeedClick: () => void;
  onHowItWorksClick?: () => void;
}

export function HeroSection({
  onReportClick,
  onExploreFeedClick,
  onHowItWorksClick,
}: HeroSectionProps): React.JSX.Element {
  return (
    <section id="hero" className="relative overflow-hidden py-12 md:py-20 lg:py-24">
      {/* Editorial ambient radial glow */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-full max-w-4xl -translate-x-1/2 bg-[radial-gradient(circle,_rgba(36,138,97,0.08)_0%,_transparent_70%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="section-wrap relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Value Proposition */}
          <div className="space-y-6 text-left lg:col-span-7">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#bde3cf] bg-[#e6f3eb] px-3.5 py-1.5 text-xs font-semibold text-[#163d32]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#248a61]" />
              Civic Cleanliness & Environmental Accountability
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.035em] text-[#202923] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.12]">
              Spot waste. <br />
              Report in seconds. <br />
              <span className="text-[#163d32]">
                Restore shared civic spaces.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="max-w-2xl text-base leading-relaxed text-[#68756d] sm:text-lg">
              SwatchNet connects residents, neighborhood cleanup volunteers, and municipal teams.
              Capture photos, tag GPS locations, and track verified before-and-after resolutions on a
              transparent civic log.
            </p>

            {/* Main Action Group */}
            <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center">
              <Button
                variant="primary"
                size="lg"
                onClick={onReportClick}
                className="group px-6 shadow-xs"
              >
                <span>Report Garbage Now</span>
                <ArrowRight className="h-4 w-4 text-white/90 transition-transform group-hover:translate-x-0.5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={onExploreFeedClick}
                className="border-[#e1e7e0] text-[#202923] hover:bg-white"
              >
                <span>Explore Live Civic Feed</span>
              </Button>

              {onHowItWorksClick && (
                <button
                  type="button"
                  onClick={onHowItWorksClick}
                  className="text-xs font-semibold text-[#68756d] hover:text-[#202923] sm:ml-2"
                >
                  How it works →
                </button>
              )}
            </div>

            {/* Principles row */}
            <div className="grid grid-cols-1 gap-3 border-t border-[#e1e7e0] pt-6 sm:grid-cols-3 sm:gap-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#248a61]" />
                <span className="text-xs font-medium text-[#202923]">
                  Geotagged photographic records
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#248a61]" />
                <span className="text-xs font-medium text-[#202923]">
                  Direct cleaner squad routing
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#248a61]" />
                <span className="text-xs font-medium text-[#202923]">
                  Proof-verified before and after
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Environmental Image and Live Report Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Primary Image Container */}
              <div className="group relative overflow-hidden rounded-2xl border border-[#e1e7e0] bg-white shadow-xs">
                <SafeImage
                  src="https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80"
                  alt="Volunteers organizing community waste cleanup in an urban park"
                  className="h-80 w-full object-cover transition-transform duration-500 group-hover:scale-101 sm:h-96"
                  fallbackText="Community Cleaners in Action"
                />

                {/* Status chip over image */}
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl border border-white/90 bg-white/95 px-3 py-1.5 shadow-xs backdrop-blur-md">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#e6f3eb]">
                    <MapPin className="h-3.5 w-3.5 text-[#248a61]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#68756d]">
                      Pilot Ward
                    </p>
                    <p className="text-xs font-bold text-[#202923]">
                      Riverside Community Park
                    </p>
                  </div>
                </div>

                {/* Status card docked at bottom */}
                <div className="absolute right-4 bottom-4 left-4 rounded-xl border border-white/90 bg-white/95 p-3.5 shadow-sm backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#163d32] text-white">
                        <Camera className="h-4 w-4 text-[#e6f3eb]" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#202923]">
                          Incident #042 Logged
                        </p>
                        <p className="text-[11px] text-[#68756d]">
                          Assigned to Green Ward Team
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bde3cf] bg-[#e6f3eb] px-2.5 py-1 text-[11px] font-semibold text-[#163d32]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#248a61]" />
                      Dispatched
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
