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
        className={`flex flex-col items-center justify-center border border-[#d8e0d4] bg-[#eef3ea] p-6 text-center select-none text-[#5c6e60] ${className}`}
      >
        {fallbackIcon || <ImageOff className="mb-2 h-7 w-7 text-[#7a8c7f]" />}
        <span className="text-xs font-semibold text-[#3a4c3e]">{fallbackText}</span>
        {alt && alt !== fallbackText && (
          <span className="mt-1 line-clamp-1 max-w-[220px] text-[11px] text-[#718275]">
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
