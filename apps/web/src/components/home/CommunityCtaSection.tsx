import React from "react";
import { ArrowRight, Sparkles, UserPlus } from "lucide-react";
import { Button } from "../ui/Button";

export interface CommunityCtaSectionProps {
  onReportClick: () => void;
  onSignInClick: () => void;
}

export function CommunityCtaSection({
  onReportClick,
  onSignInClick,
}: CommunityCtaSectionProps): React.JSX.Element {
  return (
    <section className="py-16 md:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-emerald-900 text-white overflow-hidden shadow-xl p-8 sm:p-12 lg:p-16 border border-emerald-800">
          {/* Subtle decorative background pattern */}
          <div
            className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-emerald-800/40 blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 -mb-12 -ml-12 w-72 h-72 rounded-full bg-emerald-700/20 blur-2xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-700/70 text-xs font-semibold text-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              Join the Neighborhood Movement
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              A cleaner neighborhood begins with a single photo.
            </h2>

            <p className="text-sm sm:text-base text-emerald-100/90 max-w-xl mx-auto leading-relaxed font-normal">
              Whether you are walking your dog, commuting through your block, or organizing a weekend
              civic cleanup squad, SwatchNet gives you the direct tools to make an immediate impact.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={onReportClick}
                className="w-full sm:w-auto bg-white text-emerald-950 hover:bg-stone-100 border-none group"
              >
                <span>Report Garbage Now</span>
                <ArrowRight className="w-4 h-4 text-emerald-800 group-hover:translate-x-1 transition-transform" />
              </Button>

              <button
                type="button"
                onClick={onSignInClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold text-white hover:bg-emerald-800/80 border border-emerald-700/80 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-emerald-300" />
                <span>Join as a Volunteer Cleaner</span>
              </button>
            </div>

            <p className="text-xs text-emerald-200/70 pt-2">
              Free and open platform for residents, civic volunteers, and neighborhood associations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
