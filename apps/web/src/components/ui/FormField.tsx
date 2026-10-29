import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, icon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#202923]">
            {label}
            {props.required && <span className="ml-1 text-[#c94c4c]">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#68756d]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-[#202923] placeholder-[#94a199] transition-colors focus:border-[#248a61] focus:ring-1 focus:ring-[#248a61] focus:outline-none disabled:bg-[#f7f8f4] disabled:text-[#68756d] ${
              icon ? "pl-9" : ""
            } ${
              error
                ? "border-[#c94c4c] focus:border-[#c94c4c] focus:ring-[#c94c4c]"
                : "border-[#e1e7e0] hover:border-[#cfd8ce]"
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#c94c4c]">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#68756d]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = "", id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-[#202923]">
            {label}
            {props.required && <span className="ml-1 text-[#c94c4c]">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-[#202923] placeholder-[#94a199] transition-colors focus:border-[#248a61] focus:ring-1 focus:ring-[#248a61] focus:outline-none disabled:bg-[#f7f8f4] disabled:text-[#68756d] ${
            error
              ? "border-[#c94c4c] focus:border-[#c94c4c] focus:ring-[#c94c4c]"
              : "border-[#e1e7e0] hover:border-[#cfd8ce]"
          } ${className}`}
          rows={3}
          {...props}
        />
        {error && <p className="text-xs text-[#c94c4c]">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#68756d]">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, className = "", id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-[#202923]">
            {label}
            {props.required && <span className="ml-1 text-[#c94c4c]">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-[#202923] transition-colors focus:border-[#248a61] focus:ring-1 focus:ring-[#248a61] focus:outline-none disabled:bg-[#f7f8f4] disabled:text-[#68756d] ${
            error
              ? "border-[#c94c4c] focus:border-[#c94c4c] focus:ring-[#c94c4c]"
              : "border-[#e1e7e0] hover:border-[#cfd8ce]"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[#c94c4c]">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#68756d]">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
