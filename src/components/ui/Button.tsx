import { ButtonHTMLAttributes } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

const variantClasses = {
  primary: "btn-glow bg-ocean-600 hover:bg-ocean-700 text-white",
  secondary: "bg-sand-100 hover:bg-sand-200 text-sand-800 border border-sand-300",
  danger: "btn-glow-accent bg-coral-600 hover:bg-coral-700 text-white",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
}
