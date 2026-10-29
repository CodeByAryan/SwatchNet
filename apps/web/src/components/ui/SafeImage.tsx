import React, { useState } from "react";
import { ImageOff } from "lucide-react";

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string;
  fallbackIcon?: React.ReactNode;
}

export function SafeImage({
  src,
  alt = "",
  className = "",
  fallbackText = "Image unavailable",
  fallbackIcon,
  ...props
}: SafeImageProps): React.JSX.Element {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt || fallbackText}
        className={`flex flex-col items-center justify-center border border-[#e1e7e0] bg-[#f7f8f4] p-6 text-center select-none text-[#68756d] ${className}`}
      >
        {fallbackIcon || <ImageOff className="mb-2 h-6 w-6 text-[#94a199]" />}
        <span className="text-xs font-semibold text-[#202923]">{fallbackText}</span>
        {alt && alt !== fallbackText && (
          <span className="mt-1 line-clamp-1 max-w-[220px] text-[11px] text-[#94a199]">
            {alt}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
      {...props}
    />
  );
}
