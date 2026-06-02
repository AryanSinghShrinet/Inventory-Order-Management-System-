import { cn } from "../../lib/cn.js";
import Button from "./Button.jsx";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-md rounded-lg border border-surface-border bg-surface-1 p-5 shadow-pop",
          "animate-fade-in"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md",
              tone === "danger"
                ? "bg-red-50 text-danger dark:bg-red-900/30"
                : "bg-amber-50 text-warning dark:bg-amber-900/30"
            )}
          >
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-xs text-ink-muted">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
