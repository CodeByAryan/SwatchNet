import React, { useState } from "react";
import {
  MapPin,
  Send,
  AlertCircle,
  CheckCircle2,
  Trash2,
  UploadCloud,
  Crosshair,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/FormField";

export interface ReportSubmissionData {
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  locationName: string;
  severity: "low" | "medium" | "high" | "urgent";
}

export interface ReportSubmissionProps {
  onCancel: () => void;
  onSubmitSuccess: (data: ReportSubmissionData) => void;
}

const CATEGORY_OPTIONS = [
  { value: "roadside_litter", label: "Roadside Litter & Plastic" },
  { value: "overflowing_bin", label: "Overflowing Public Bin" },
  { value: "illegal_dumping", label: "Illegal Dump Site / Debris" },
  { value: "organic_drain_clog", label: "Organic Waste / Drain Clog" },
  { value: "construction_waste", label: "Construction & Demolition Waste" },
  { value: "hazardous_materials", label: "Hazardous / Chemical Waste" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low (Minor litter, non-blocking)" },
  { value: "medium", label: "Medium (Visible accumulation, sidewalk blocked)" },
  { value: "high", label: "High (Drainage hazard, foul odor, spread risk)" },
  { value: "urgent", label: "Urgent (Hazardous / blocking public route)" },
];

export function ReportSubmission({
  onCancel,
  onSubmitSuccess,
}: ReportSubmissionProps): React.JSX.Element {
  const [formData, setFormData] = useState<ReportSubmissionData>({
    title: "",
    description: "",
    category: "roadside_litter",
    latitude: 18.5204,
    longitude: 73.8567,
    locationName: "Riverside Park East, Ward 12",
    severity: "medium",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
          locationName: `GPS Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`,
        }));
      },
      (err) => {
        setIsLocating(false);
        setError(`Could not fetch GPS coordinates: ${err.message}. Using default ward area.`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSimulateImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Please provide an incident title.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Simulate instant safe local persistence / mock network latency
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        onSubmitSuccess(formData);
      }, 900);
    }, 700);
  };

  if (submitted) {
    return (
      <div className="section-wrap py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-[#bde3cf] bg-white p-8 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f3eb] text-[#248a61]">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#163d32]">
            Report Submitted Successfully
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#68756d]">
            Your report for <strong>{formData.title}</strong> has been logged with coordinates [
            {formData.latitude}, {formData.longitude}]. It is now queued on the civic dispatch
            registry.
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="primary" size="md" onClick={() => onSubmitSuccess(formData)}>
              View in Live Feed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-wrap py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Navigation & Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="group inline-flex items-center gap-2 text-xs font-semibold text-[#68756d] transition-colors hover:text-[#202923]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to overview</span>
          </button>
          <span className="rounded-full border border-[#e1e7e0] bg-white px-3 py-1 text-[11px] font-medium text-[#68756d]">
            Civic Report Intake
          </span>
        </div>

        <div className="rounded-2xl border border-[#e1e7e0] bg-white p-6 shadow-xs sm:p-8">
          <div className="border-b border-[#e1e7e0] pb-5">
            <h1 className="font-display text-2xl font-bold text-[#202923] sm:text-3xl">
              File a Waste & Dump Report
            </h1>
            <p className="mt-1 text-sm text-[#68756d]">
              Submit geotagged photographic proof to dispatch volunteer squads or municipal cleanup
              crews.
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#f3b6b6] bg-[#fcf0f0] p-3 text-xs text-[#c94c4c]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c94c4c]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Title */}
            <Input
              label="Incident Title"
              required
              placeholder="e.g. Broken glass and plastic debris piled near storm drain"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              helperText="Be specific about the item type and exact landmark."
            />

            {/* Category & Severity Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Waste Category"
                required
                options={CATEGORY_OPTIONS}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />

              <Select
                label="Urgency & Severity"
                required
                options={SEVERITY_OPTIONS}
                value={formData.severity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    severity: e.target.value as ReportSubmissionData["severity"],
                  })
                }
              />
            </div>

            {/* Photo Upload preview */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#202923]">
                Photo Evidence <span className="text-[#68756d]">(Recommended for verification)</span>
              </label>

              {imagePreview ? (
                <div className="relative overflow-hidden rounded-xl border border-[#e1e7e0] bg-[#f7f8f4]">
                  <img
                    src={imagePreview}
                    alt="Uploaded waste preview"
                    className="max-h-64 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-[#c94c4c] shadow-xs backdrop-blur-xs transition-colors hover:bg-white"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e1e7e0] bg-[#f7f8f4] p-6 text-center transition-colors hover:border-[#248a61] hover:bg-[#e6f3eb]/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#248a61] shadow-xs">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-[#202923]">
                    Upload or capture site photo
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#68756d]">
                    PNG, JPG, or WEBP up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleSimulateImageUpload}
                  />
                </label>
              )}
            </div>

            {/* Geolocation Section */}
            <div className="rounded-xl border border-[#e1e7e0] bg-[#f7f8f4] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#202923]">
                  Location & Coordinates
                </span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e1e7e0] bg-white px-2.5 py-1 text-xs font-medium text-[#248a61] shadow-2xs hover:bg-[#e6f3eb] disabled:opacity-50"
                >
                  <Crosshair className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
                  <span>{isLocating ? "Detecting GPS..." : "Acquire GPS Coordinates"}</span>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Area / Landmark Name"
                  value={formData.locationName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, locationName: e.target.value })
                  }
                  placeholder="e.g. Opposite Sector 4 Bus Stop"
                  icon={<MapPin className="h-4 w-4" />}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <Textarea
              label="Incident Description & Details"
              placeholder="Describe access conditions, volume estimates, proximity to drains, or known recurring dump times..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />

            {/* Action buttons */}
            <div className="flex flex-col-reverse justify-end gap-3 border-t border-[#e1e7e0] pt-5 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="group"
              >
                <span>Submit Civic Report</span>
                <Send className="h-4 w-4 text-white/80 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
