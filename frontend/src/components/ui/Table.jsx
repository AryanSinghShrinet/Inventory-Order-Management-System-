import { cn } from "../../lib/cn.js";

export function Table({ className, children, ...rest }) {
  return (
    <div className="overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-card">
      <div className="overflow-x-auto">
        <table className={cn("min-w-full text-sm", className)} {...rest}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function THead({ children, className }) {
  return (
    <thead
      className={cn(
        "sticky top-0 z-10 border-b border-surface-border bg-surface-2/70 text-left text-2xs font-semibold uppercase tracking-wide text-ink-muted backdrop-blur",
        className
      )}
    >
      {children}
    </thead>
  );
}

export function TBody({ children, className }) {
  return <tbody className={cn("divide-y divide-surface-border", className)}>{children}</tbody>;
}

export function TR({ className, children, ...rest }) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-surface-2/60",
        className
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TH({ className, children, ...rest }) {
  return (
    <th className={cn("px-4 py-2.5 font-semibold", className)} {...rest}>
      {children}
    </th>
  );
}

export function TD({ className, children, ...rest }) {
  return (
    <td className={cn("px-4 py-3 align-middle text-sm", className)} {...rest}>
      {children}
    </td>
  );
}

export function TEmpty({ colSpan, title, hint, action }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-14 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-ink">{title}</p>
          {hint && <p className="text-xs text-ink-muted">{hint}</p>}
          {action}
        </div>
      </td>
    </tr>
  );
}
