import { forwardRef, SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, id, className = "", children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-sand-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={[
            "bg-white rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-coral-500 focus:ring-coral-500 focus:border-coral-500"
              : "border-sand-300",
            className,
          ].join(" ")}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-coral-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
