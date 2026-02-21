import { forwardRef, InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-sand-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "bg-white rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors",
            "placeholder:text-sand-400",
            "focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-coral-500 focus:ring-coral-500 focus:border-coral-500"
              : "border-sand-300",
            className,
          ].join(" ")}
          {...props}
        />
        {error && <p className="text-xs text-coral-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
