import React from "react";
import { ArrowRight, MapPin, Camera, ShieldCheck, CheckCircle2 } from "lucide-react";
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
    <section id="hero" className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24">
      {/* Background soft ambient tint */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headlines & Actions */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-200/60 text-xs font-semibold text-emerald-900">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Community Civic Waste Initiative
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.15]">
              Spot waste. <br />
              Report in seconds. <br />
              <span className="text-emerald-800 underline decoration-emerald-500/40 decoration-4 underline-offset-4">
                Keep our neighborhoods clean.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl font-normal">
              SwatchNet connects observant residents with dedicated neighborhood cleaners and
              municipal crews. Capture an issue with your camera and watch verified action turn
              neglected spaces into clean public environments.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={onReportClick}
                className="group"
              >
                <span>Report Garbage</span>
                <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={onHowItWorksClick}
              >
                How It Works
              </Button>
            </div>

            {/* Micro Highlights */}
            <div className="pt-4 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Geotagged instant uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Direct cleaner coordination</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Photographic proof of resolution</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Image Card */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-stone-200 bg-white group">
                <SafeImage
                  src="https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80"
                  alt="Volunteers in green vests gathering plastic waste in an urban community park"
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-102 transition-transform duration-500"
                  fallbackText="Community Cleaners in Action"
                />

                {/* Overlay Badge */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-xl px-3.5 py-2 shadow-md border border-stone-200/80 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-emerald-800" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-stone-400 leading-none">
                      Active Area
                    </p>
                    <p className="text-xs font-semibold text-stone-800 leading-tight mt-0.5">
                      Riverside Community Park
                    </p>
                  </div>
                </div>

                {/* Floating Bottom Card: Real-time report simulation */}
                <div className="absolute bottom-4 right-4 left-4 bg-white/95 backdrop-blur-md rounded-xl p-3.5 shadow-lg border border-stone-200/80">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0">
                        <Camera className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-stone-900 leading-tight">
                          Report #042 Verified
                        </p>
                        <p className="text-[11px] text-stone-500 leading-tight mt-0.5">
                          Assigned to Green Ward Team
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      En Route
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative accent element */}
              <div
                className="absolute -bottom-4 -left-4 w-24 h-24 bg-emerald-700/10 rounded-full blur-2xl -z-10"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
