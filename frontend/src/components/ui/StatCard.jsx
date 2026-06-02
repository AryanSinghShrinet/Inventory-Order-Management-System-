import { cn } from "../../lib/cn.js";
import Card from "./Card.jsx";

const toneRing = {
  default: "ring-surface-border",
  accent: "ring-accent-100 dark:ring-accent-800",
  success: "ring-emerald-100 dark:ring-emerald-900",
  warning: "ring-amber-100 dark:ring-amber-900",
  danger: "ring-red-100 dark:ring-red-900",
};

const toneIcon = {
  default: "bg-surface-2 text-ink-muted",
  accent: "bg-accent-50 text-accent-600 dark:bg-accent-800/40 dark:text-accent-200",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
  danger: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",
};

export default function StatCard({ label, value, delta, icon: Icon, tone = "default", hint }) {
  return (
    <Card className={cn("ring-1 ring-inset", toneRing[tone])}>
      <div className="flex items-start gap-4 p-5">
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md",
              toneIcon[tone]
            )}
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-medium uppercase tracking-wide text-ink-muted">
            {label}
          </p>
          <p className="num mt-1.5 text-2xl font-semibold tracking-tight text-ink">
            {value}
          </p>
          {(delta || hint) && (
            <p className="mt-1 text-2xs text-ink-muted">
              {delta}
              {delta && hint ? " · " : ""}
              {hint}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
