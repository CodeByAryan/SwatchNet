import React from "react";
import { Clock, Eye, Users2, Sparkles, AlertCircle } from "lucide-react";
import { SafeImage } from "../ui/SafeImage";

export function OurImpactSection(): React.JSX.Element {
  const impactGoals = [
    {
      icon: <Clock className="h-5 w-5 text-[#248a61]" />,
      title: "Rapid Civic Response",
      description:
        "Designed to reduce the time between garbage discovery and disposal from weeks of bureaucratic delay to hours of coordinated neighborhood response.",
    },
    {
      icon: <Eye className="h-5 w-5 text-[#248a61]" />,
      title: "100% Photographic Proof",
      description:
        "Every completed cleanup requires geotagged photographic confirmation. Citizens can visually inspect the cleared space and trust the outcome.",
    },
    {
      icon: <Users2 className="h-5 w-5 text-[#248a61]" />,
      title: "Community Ownership",
      description:
        "Connects local residents, volunteer squads, and municipal staff into an open, communicative group with shared pride in neighborhood cleanliness.",
    },
    {
      icon: <Sparkles className="h-5 w-5 text-[#248a61]" />,
      title: "Healthier Ecosystems",
      description:
        "Prevents drain blockages, decreases plastic runoff into urban waterways, and resolves illegal dumping hotspots before they turn into civic hazards.",
    },
  ];

  const metricPlaceholders = [
    {
      label: "Target Response Time",
      value: "< 24 Hours",
      status: "Benchmark Goal",
    },
    {
      label: "Verification Standard",
      value: "Double Photo",
      status: "Before & After",
    },
    {
      label: "Community Transparency",
      value: "100% Open",
      status: "Public Reporting",
    },
    {
      label: "Coverage Readiness",
      value: "Multi-Ward",
      status: "Configurable Zones",
    },
  ];

  return (
    <section id="our-impact" className="bg-[#f7f8f4] py-16 md:py-24">
      <div className="section-wrap">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <span className="inline-block rounded-full border border-[#bde3cf] bg-[#e6f3eb] px-3 py-1 text-xs font-semibold text-[#163d32]">
            Mission & Architecture
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] text-[#202923] sm:text-4xl">
            The civic impact we are engineering
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#68756d] sm:text-base">
            SwatchNet is designed around verifiable environmental accountability. Rather than
            simulating speculative figures, we measure success through rigorous proof and clear
            standards.
          </p>
        </div>

        {/* 4 Platform Goals Cards */}
        <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
          {impactGoals.map((goal, idx) => (
            <div
              key={idx}
              className="subtle-card flex gap-4 p-6 transition-all hover:border-[#cfd8ce] hover:shadow-xs sm:p-7 text-left"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e1e7e0] bg-[#e6f3eb]">
                {goal.icon}
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#202923]">
                  {goal.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#68756d]">
                  {goal.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Highlight Image & Metrics Dashboard Placeholder */}
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#e1e7e0] bg-white shadow-xs lg:grid-cols-12">
          {/* Visual Showcase */}
          <div className="relative min-h-[260px] lg:col-span-5 lg:min-h-full">
            <SafeImage
              src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1000&q=80"
              alt="Community recycling and waste collection effort"
              className="h-full min-h-[260px] w-full object-cover"
              fallbackText="Environmental Cleanup Operations"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#163d32]/90 via-transparent to-transparent p-6">
              <p className="text-xs font-medium text-white/95">
                Verification standard: Every site inspected and logged before and after clearing
              </p>
            </div>
          </div>

          {/* Metrics & Transparency Note */}
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7 text-left">
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg font-bold text-[#202923]">
                  Target Operating Benchmarks
                </h3>
                <span className="rounded-full border border-[#bde3cf] bg-[#e6f3eb] px-2.5 py-0.5 text-[11px] font-semibold text-[#163d32]">
                  Platform Standards
                </span>
              </div>
              <p className="mb-6 text-xs leading-relaxed text-[#68756d]">
                As SwatchNet deploys across participating pilot wards, verified metrics will stream
                here. Below are the service benchmarks our software workflow is built to deliver.
              </p>

              {/* Benchmark Cards */}
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {metricPlaceholders.map((metric, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#e1e7e0] bg-[#f7f8f4] p-4 text-left"
                  >
                    <span className="mb-1 block text-[10px] font-semibold tracking-wider text-[#68756d] uppercase">
                      {metric.label}
                    </span>
                    <span className="block font-display text-xl font-extrabold tracking-tight text-[#163d32] sm:text-2xl">
                      {metric.value}
                    </span>
                    <span className="mt-1 block text-[11px] font-medium text-[#248a61]">
                      {metric.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Transparency Notice */}
            <div className="flex items-start gap-2.5 rounded-xl border border-[#f4d399] bg-[#fdf5e8] p-3.5 text-xs text-[#946215]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#d99a35]" />
              <span>
                <strong>Zero simulated data policy:</strong> Cleanup totals, municipal response
                averages, and volunteer counts will only be published when linked to authentic
                database entries.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
