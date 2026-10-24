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
        className={`flex flex-col items-center justify-center bg-stone-100 text-stone-500 border border-stone-200 p-6 text-center select-none ${className}`}
      >
        {fallbackIcon || <ImageOff className="w-8 h-8 mb-2 text-stone-400" />}
        <span className="text-xs font-medium text-stone-600">{fallbackText}</span>
        {alt && alt !== fallbackText && (
          <span className="text-[11px] text-stone-400 mt-1 line-clamp-1 max-w-[200px]">
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
