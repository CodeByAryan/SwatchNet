import React from "react";
import { ArrowRight, MapPin, Camera, ShieldCheck, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";
import { SafeImage } from "../ui/SafeImage";

export interface HeroSectionProps {
  onReportClick: () => void;
  onHowItWorksClick: () => void;
}

export function HeroSection({
  onReportClick,
  onHowItWorksClick,
}: HeroSectionProps): React.JSX.Element {
  return (
    <section id="hero" className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24">
      {/* Subtle organic light wash */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-full max-w-4xl -translate-x-1/2 bg-[radial-gradient(circle,_rgba(101,139,87,0.12)_0%,_transparent_70%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="section-wrap relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left: Value Proposition */}
          <div className="space-y-6 text-left lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d6dfd0] bg-[#eef3e8] px-3.5 py-1.5 text-xs font-semibold text-[#1c3826]">
              <span className="h-2 w-2 rounded-full bg-[#4c7542]" />
              Civic Cleanliness & Waste Accountability
            </div>

            <h1 className="font-display text-4xl font-extrabold tracking-[-0.04em] text-[#16241a] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.12]">
              Spot waste. <br />
              Report in seconds. <br />
              <span className="text-[#204a37]">
                Restore our shared spaces.
              </span>
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-[#505f54] sm:text-lg">
              SwatchNet connects residents, neighborhood cleanup volunteers, and municipal teams.
              Take a photo, tag the location, and track verified before-and-after resolutions on a
              transparent civic log.
            </p>

            {/* Main Action Group */}
            <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center">
              <Button
                variant="primary"
                size="lg"
                onClick={onReportClick}
                className="group px-6 shadow-[0_2px_8px_rgba(23,61,45,0.2)]"
              >
                <span>Report Garbage Now</span>
                <ArrowRight className="h-4 w-4 text-[#cde2bf] transition-transform group-hover:translate-x-0.5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={onHowItWorksClick}
                className="group border-[#ced8ca] text-[#293a2e] hover:bg-[#f2f6ee]"
              >
                <span>Explore the 4-Step Process</span>
                <ChevronDown className="h-4 w-4 text-[#657769] transition-transform group-hover:translate-y-0.5" />
              </Button>
            </div>

            {/* Principles row */}
            <div className="grid grid-cols-1 gap-3 border-t border-[#e3e8df] pt-6 sm:grid-cols-3 sm:gap-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3b6644]" />
                <span className="text-xs font-medium text-[#46574a]">
                  Geotagged photographic records
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3b6644]" />
                <span className="text-xs font-medium text-[#46574a]">
                  Direct cleaner squad routing
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3b6644]" />
                <span className="text-xs font-medium text-[#46574a]">
                  Proof-verified before and after
                </span>
              </div>
            </div>
          </div>

          {/* Right: Operational Visual Preview */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Primary Image Container */}
              <div className="group relative overflow-hidden rounded-2xl border border-[#d9e1d4] bg-white shadow-[0_8px_24px_rgba(20,40,30,0.06)]">
                <SafeImage
                  src="https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80"
                  alt="Volunteers in green vests gathering plastic waste in an urban community park"
                  className="h-80 w-full object-cover transition-transform duration-700 group-hover:scale-102 sm:h-96"
                  fallbackText="Community Cleaners in Action"
                />

                {/* Status chip over image */}
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl border border-white/80 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-md">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#eaf2e5]">
                    <MapPin className="h-3.5 w-3.5 text-[#245037]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#738276]">
                      Pilot Ward
                    </p>
                    <p className="text-xs font-semibold text-[#1f2e24]">
                      Riverside Community Park
                    </p>
                  </div>
                </div>

                {/* Status card docked at bottom */}
                <div className="absolute right-4 bottom-4 left-4 rounded-xl border border-white/80 bg-white/95 p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#173d2d] text-white">
                        <Camera className="h-4 w-4 text-[#c8ddb5]" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#1a281e]">
                          Incident #042 Logged
                        </p>
                        <p className="text-[11px] text-[#637266]">
                          Assigned to Green Ward Team
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#cbe1be] bg-[#edf6e8] px-2.5 py-1 text-[11px] font-semibold text-[#1c472f]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#306846]" />
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
