import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "brand";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    // Base design system styles: crisp radius, consistent height, visible focus outline
    const baseStyles =
      "inline-flex items-center justify-center font-semibold tracking-[-0.01em] transition-all duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer select-none active:scale-[0.985]";

    const variantStyles = {
      // Emerald action button (Primary CTA)
      primary:
        "bg-[#248a61] text-white hover:bg-[#1e7452] active:bg-[#186043] shadow-xs focus-visible:outline-[#248a61]",
      // Deep Forest Green (Brand action)
      brand:
        "bg-[#163d32] text-white hover:bg-[#1f4f41] active:bg-[#0f2c24] shadow-xs focus-visible:outline-[#163d32]",
      // Soft Mint subtle button
      secondary:
        "bg-[#e6f3eb] text-[#163d32] hover:bg-[#d8ecdf] active:bg-[#c9e4d2] border border-[#c4e0ce] focus-visible:outline-[#248a61]",
      // Pure White card button with soft border
      outline:
        "border border-[#e1e7e0] bg-white text-[#202923] hover:bg-[#f7f8f4] hover:border-[#cfd8ce] active:bg-[#eef1eb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus-visible:outline-[#248a61]",
      // Ghost flat button
      ghost:
        "text-[#68756d] hover:text-[#202923] hover:bg-[#e6f3eb]/60 active:bg-[#e6f3eb] focus-visible:outline-[#248a61]",
      // Danger / Red destructive action
      danger:
        "bg-[#c94c4c] text-white hover:bg-[#b33f3f] active:bg-[#9a3434] shadow-xs focus-visible:outline-[#c94c4c]",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5 min-h-[2rem]",
      md: "text-sm px-4 py-2.5 gap-2 min-h-[2.5rem]",
      lg: "text-base px-5 py-3 gap-2.5 min-h-[2.875rem]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
