import React from "react";

export type StatusVariant = "pending" | "completed" | "rejected" | "info" | "neutral";

export interface StatusBadgeProps {
  status: "submitted" | "in_progress" | "resolved" | "rejected" | string;
  size?: "sm" | "md";
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = "md",
  showDot = true,
  className = "",
}: StatusBadgeProps): React.JSX.Element {
  let label = status;
  let bgClass = "bg-[#f7f8f4]";
  let textClass = "text-[#68756d]";
  let borderClass = "border-[#e1e7e0]";
  let dotClass = "bg-[#68756d]";

  switch (status) {
    case "submitted":
    case "pending":
      label = "Pending Review";
      bgClass = "bg-[#fdf5e8]";
      textClass = "text-[#946215]";
      borderClass = "border-[#f4d399]";
      dotClass = "bg-[#d99a35]";
      break;
    case "in_progress":
    case "dispatched":
      label = "In Progress";
      bgClass = "bg-[#edf4fa]";
      textClass = "text-[#275b85]";
      borderClass = "border-[#bad4eb]";
      dotClass = "bg-[#3a75a4]";
      break;
    case "resolved":
    case "approved":
    case "completed":
      label = "Completed";
      bgClass = "bg-[#e6f3eb]";
      textClass = "text-[#163d32]";
      borderClass = "border-[#bde3cf]";
      dotClass = "bg-[#248a61]";
      break;
    case "rejected":
    case "failed":
      label = "Rejected";
      bgClass = "bg-[#fcf0f0]";
      textClass = "text-[#9e2f2f]";
      borderClass = "border-[#f3b6b6]";
      dotClass = "bg-[#c94c4c]";
      break;
    default:
      label = status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
      break;
  }

  const sizeClasses = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${bgClass} ${textClass} ${borderClass} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}
