import { cn } from "../../lib/cn.js";

const tones = {
  neutral:
    "bg-surface-2 text-ink-muted ring-1 ring-inset ring-surface-border",
  accent:
    "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200 dark:bg-accent-800/40 dark:text-accent-200 dark:ring-accent-700",
  success:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700",
  warning:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700",
  danger:
    "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700",
};

export default function Badge({ tone = "neutral", withDot = false, className, children, ...rest }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-2xs font-medium",
        tones[tone],
        className
      )}
      {...rest}
    >
      {withDot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
