import React from "react";
import { Clock, Eye, Users2, Sparkles, AlertCircle } from "lucide-react";
import { SafeImage } from "../ui/SafeImage";

export function OurImpactSection(): React.JSX.Element {
  const impactGoals = [
    {
      icon: <Clock className="w-5 h-5 text-emerald-800" />,
      title: "Rapid Civic Response",
      description:
        "Designed to reduce the time between garbage discovery and disposal from weeks of bureaucratic delays to hours of coordinated community response.",
    },
    {
      icon: <Eye className="w-5 h-5 text-emerald-800" />,
      title: "100% Photographic Proof",
      description:
        "Every completed cleanup requires geotagged photographic confirmation. Citizens can visually verify that their reported issues are actually resolved.",
    },
    {
      icon: <Users2 className="w-5 h-5 text-emerald-800" />,
      title: "Community Ownership",
      description:
        "Empowers local residents, volunteer groups, and municipal staff to work together openly, building long-term pride in shared public environments.",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-800" />,
      title: "Cleaner Ecosystems",
      description:
        "Prevents storm-drain clogging, reduces microplastic runoff into waterways, and halts illegal dumping hotspots before they expand into hazards.",
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
    <section id="our-impact" className="py-16 md:py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 inline-block mb-3">
            Civic Mission & Goals
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            The Impact We Are Building
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
            SwatchNet is built to deliver measurable environmental accountability. Rather than
            unverified estimates, our platform focuses on rigorous proof and community empowerment.
          </p>
        </div>

        {/* 4 Platform Goals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {impactGoals.map((goal, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200 shadow-xs hover:border-emerald-700/30 transition-all flex gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                {goal.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 mb-1.5">
                  {goal.title}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {goal.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Highlight Image & Metrics Dashboard Placeholder */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Visual Showcase */}
          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full">
            <SafeImage
              src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1000&q=80"
              alt="Community recycling and waste collection effort"
              className="w-full h-full object-cover min-h-[260px]"
              fallbackText="Environmental Cleanup Operations"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent flex items-end p-6">
              <p className="text-white text-xs font-medium">
                Photo verification benchmark: Every site inspected before and after clearing
              </p>
            </div>
          </div>

          {/* Metrics & Transparency Note */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-stone-900">
                  Target Operating Benchmarks
                </h3>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  Platform Standards
                </span>
              </div>
              <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                As the platform rolls out across initial pilot neighborhoods, live operational
                statistics will stream here. Below are the verified accountability targets our
                software enforces.
              </p>

              {/* Benchmark Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-6">
                {metricPlaceholders.map((metric, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 text-left"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                      {metric.label}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight block">
                      {metric.value}
                    </span>
                    <span className="text-[11px] font-medium text-stone-500 mt-1 block">
                      {metric.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Transparency Notice */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/50 text-xs text-stone-600">
              <AlertCircle className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <span>
                <strong>Zero fake statistics policy:</strong> Live municipal cleanup figures,
                active volunteer counts, and weight totals will only be published when connected to
                verified database entries.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
