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
    <section className="bg-white py-16 md:py-24">
      <div className="section-wrap">
        <div className="relative overflow-hidden rounded-3xl border border-[#163d32] bg-[#163d32] p-8 text-white shadow-[0_8px_32px_rgba(22,61,50,0.18)] sm:p-12 lg:p-16">
          {/* Subtle soft gradient light wash */}
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-80 w-80 rounded-full bg-[#248a61]/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#1f4f41]/40 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-3xl space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#248a61]/50 bg-[#1f4f41] px-3.5 py-1 text-xs font-semibold text-[#e6f3eb]">
              <Sparkles className="h-3.5 w-3.5 text-[#2eb07c]" />
              Civic Action
            </div>

            <h2 className="font-display text-3xl font-extrabold tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl lg:leading-[1.15]">
              Cleaner neighborhoods begin with a single verified report.
            </h2>

            <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#e6f3eb]/80 sm:text-base">
              Whether you are walking your dog, commuting, or organizing a weekend community cleanup,
              SwatchNet gives you direct tools to turn concern into recorded progress.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Button
                variant="primary"
                size="lg"
                onClick={onReportClick}
                className="group w-full sm:w-auto bg-[#248a61] hover:bg-[#1e7452]"
              >
                <span>Report Garbage Now</span>
                <ArrowRight className="h-4 w-4 text-white/90 transition-transform group-hover:translate-x-0.5" />
              </Button>

              <button
                type="button"
                onClick={onSignInClick}
                className="inline-flex min-h-[2.875rem] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#248a61]/60 bg-[#1f4f41] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#276453] sm:w-auto"
              >
                <UserPlus className="h-4 w-4 text-[#2eb07c]" />
                <span>Join as a Volunteer Cleaner</span>
              </button>
            </div>

            <p className="pt-2 text-xs text-[#e6f3eb]/70">
              Open civic architecture for residents, community groups, and municipal partners.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
