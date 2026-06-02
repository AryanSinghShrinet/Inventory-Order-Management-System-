import { cn } from "../../lib/cn.js";

export default function Card({ className, children, ...rest }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-surface-border bg-surface-1 shadow-card",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-surface-border px-5 py-4",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }) {
  return (
    <h3
      className={cn(
        "text-sm font-semibold tracking-tight text-ink",
        className
      )}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardSubtitle({ className, children, ...rest }) {
  return (
    <p className={cn("text-xs text-ink-muted", className)} {...rest}>
      {children}
    </p>
  );
}

export function CardBody({ className, children, ...rest }) {
  return (
    <div className={cn("px-5 py-4", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-surface-border bg-surface-2/40 px-5 py-3",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
