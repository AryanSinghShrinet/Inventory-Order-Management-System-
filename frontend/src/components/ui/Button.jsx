import { forwardRef } from "react";
import { cn } from "../../lib/cn.js";

const variants = {
  primary:
    "bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 focus-visible:ring-accent-200 disabled:bg-accent-300",
  secondary:
    "bg-surface-1 text-ink border border-surface-border hover:bg-surface-2 active:bg-surface-3 focus-visible:ring-accent-200",
  ghost:
    "bg-transparent text-ink hover:bg-surface-2 active:bg-surface-3 focus-visible:ring-accent-200",
  danger:
    "bg-danger text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-200",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-10 px-4 text-sm",
  icon: "h-9 w-9 p-0",
};

const Button = forwardRef(function Button(
  { as = "button", className, variant = "primary", size = "md", type = "button", ...rest },
  ref
) {
  const Tag = as;
  return (
    <Tag
      ref={ref}
      type={Tag === "button" ? type : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 ease-out-soft focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    />
  );
});

export default Button;
