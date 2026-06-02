import { forwardRef, useId } from "react";
import { cn } from "../../lib/cn.js";

const Input = forwardRef(function Input(
  { label, hint, error, className, wrapperClassName, leftIcon, rightAddon, ...rest },
  ref
) {
  const autoId = useId();
  const id = rest.id ?? autoId;
  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="text-2xs font-medium uppercase tracking-wide text-ink-muted"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-subtle">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "block w-full rounded-md border bg-surface-1 py-1.5 text-sm text-ink placeholder:text-ink-subtle transition-colors",
            "focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200",
            leftIcon ? "pl-9" : "pl-3",
            rightAddon ? "pr-12" : "pr-3",
            error ? "border-danger" : "border-surface-border",
            className
          )}
          {...rest}
        />
        {rightAddon && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-2xs text-ink-muted">
            {rightAddon}
          </div>
        )}
      </div>
      {(hint || error) && (
        <p
          className={cn(
            "text-2xs",
            error ? "text-danger" : "text-ink-muted"
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
});

export default Input;
