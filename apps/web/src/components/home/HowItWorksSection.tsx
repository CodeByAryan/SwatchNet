import React from "react";
import { Camera, CheckSquare, UserCheck, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";

export interface HowItWorksSectionProps {
  onReportClick: () => void;
}

export function HowItWorksSection({ onReportClick }: HowItWorksSectionProps): React.JSX.Element {
  const steps = [
    {
      stepNumber: "01",
      icon: <Camera className="h-5 w-5 text-[#245037]" />,
      title: "Snap & Geotag",
      description:
        "Capture a photo of roadside waste or an illegal dump. SwatchNet tags the exact coordinates and lets you add essential notes in seconds.",
    },
    {
      stepNumber: "02",
      icon: <CheckSquare className="h-5 w-5 text-[#245037]" />,
      title: "Categorize & Prioritize",
      description:
        "Reports are sorted by hazard level and debris type so the proper crew, collection gear, and transport are dispatched without delay.",
    },
    {
      stepNumber: "03",
      icon: <UserCheck className="h-5 w-5 text-[#245037]" />,
      title: "Squad Assigned",
      description:
        "Volunteer cleaning circles or municipal workers accept the route, view the location pin, and arrive equipped to clean the area.",
    },
    {
      stepNumber: "04",
      icon: <ShieldCheck className="h-5 w-5 text-[#245037]" />,
      title: "Proof Verified",
      description:
        "The site is photographed once cleared. The community receives direct proof of resolution, closing the loop with open transparency.",
    },
  ];

  return (
    <section id="how-it-works" className="border-y border-[#e2e7de] bg-white py-16 md:py-24">
      <div className="section-wrap">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <span className="inline-block rounded-full border border-[#d6dfd0] bg-[#eef3e8] px-3 py-1 text-xs font-semibold text-[#1c3826]">
            Civic Process
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.035em] text-[#16241a] sm:text-4xl">
            How SwatchNet turns reports into clean streets
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#556559] sm:text-base">
            A clear four-stage accountability loop built to eliminate unaddressed reports and give
            every community member verifiable proof of progress.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.stepNumber}
              className="flex flex-col justify-between rounded-2xl border border-[#e2e7de] bg-[#fbfcf9] p-6 transition-all duration-200 hover:border-[#b8cbb4] hover:bg-white hover:shadow-[0_4px_16px_rgba(20,40,30,0.05)] sm:p-7"
            >
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#dce3d8] bg-white text-[#173d2d] shadow-xs">
                    {step.icon}
                  </div>
                  <span className="font-display text-xs font-bold tracking-wider text-[#8a988d]">
                    STEP {step.stepNumber}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-[#1d2b20]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#596a5e]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action prompt */}
        <div className="mt-12 flex justify-center text-center">
          <Button
            variant="secondary"
            size="md"
            onClick={onReportClick}
            className="group"
          >
            <span>Start with a quick report</span>
            <ArrowRight className="h-4 w-4 text-[#204a37] transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
