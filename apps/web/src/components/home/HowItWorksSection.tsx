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
      icon: <Camera className="w-6 h-6 text-emerald-800" />,
      title: "Snap & Geotag",
      description:
        "Photograph garbage anywhere in public space. SwatchNet automatically tags your location and lets you describe the issue in seconds.",
    },
    {
      stepNumber: "02",
      icon: <CheckSquare className="w-6 h-6 text-emerald-800" />,
      title: "Review & Categorize",
      description:
        "Reports are swiftly verified and categorized by urgency and debris type to ensure appropriate equipment and personnel are allocated.",
    },
    {
      stepNumber: "03",
      icon: <UserCheck className="w-6 h-6 text-emerald-800" />,
      title: "Cleaner Dispatched",
      description:
        "Local cleaners or municipal partners accept the task, track the exact coordinates, and head to the cleanup location.",
    },
    {
      stepNumber: "04",
      icon: <ShieldCheck className="w-6 h-6 text-emerald-800" />,
      title: "Resolution Verified",
      description:
        "A photo of the cleaned site is submitted. The report is resolved, giving residents transparent proof that their voice made a difference.",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-white border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 inline-block mb-3">
            Civic Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            How SwatchNet Works
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
            From the moment you spot trash on a street corner or park trail, our 4-stage process
            turns citizen reports into fast, verifiable civic action.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
          {steps.map((step, idx) => (
            <div
              key={step.stepNumber}
              className="relative bg-stone-50/80 rounded-2xl p-6 sm:p-7 border border-stone-200/90 hover:border-emerald-700/40 hover:bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Step header with number and icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 shadow-xs flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-2xl font-black text-stone-300 tracking-tight">
                    {step.stepNumber}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-stone-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Progress indicator arrow for non-last desktop items */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-stone-300">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mid-section prompt */}
        <div className="mt-12 text-center">
          <Button variant="secondary" size="md" onClick={onReportClick}>
            Start by reporting an issue near you
          </Button>
        </div>
      </div>
    </section>
  );
}
