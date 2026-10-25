import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl cursor-pointer select-none active:scale-[0.99]";

    const variantStyles = {
      primary:
        "bg-[#173d2d] text-white hover:bg-[#204937] active:bg-[#122e22] shadow-[0_1px_2px_rgba(23,61,45,0.18)] focus-visible:outline-[#173d2d]",
      secondary:
        "bg-[#eef4ea] text-[#1c3826] hover:bg-[#e4ede0] active:bg-[#d8e4d3] border border-[#d2dfcd] focus-visible:outline-[#54774b]",
      outline:
        "border border-[#d7ddd2] bg-white text-[#223126] hover:bg-[#f5f7f2] hover:border-[#c4cec0] active:bg-[#eef2ea] shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-visible:outline-[#54774b]",
      ghost:
        "text-[#445347] hover:text-[#173d2d] hover:bg-[#ebf0e6] active:bg-[#dfe6d9] focus-visible:outline-[#54774b]",
      danger:
        "bg-[#8a2f24] text-white hover:bg-[#73241b] active:bg-[#5e1c15] shadow-xs focus-visible:outline-[#8a2f24]",
    };

    const sizeStyles = {
      sm: "text-xs px-3.5 py-2 gap-1.5 min-h-[2.125rem]",
      md: "text-sm px-4 py-2.5 gap-2 min-h-[2.5rem]",
      lg: "text-[0.95rem] px-5 py-3 gap-2.5 min-h-[2.875rem]",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
