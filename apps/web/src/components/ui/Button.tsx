import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer";

    const variantStyles = {
      primary:
        "bg-emerald-800 text-white hover:bg-emerald-900 active:bg-emerald-950 shadow-sm hover:shadow",
      secondary:
        "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200/80",
      outline:
        "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 active:bg-stone-100 shadow-sm",
      ghost:
        "text-stone-700 hover:text-stone-900 hover:bg-stone-100 active:bg-stone-200",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-5 py-2.5 gap-2.5 font-semibold",
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
