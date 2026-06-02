import Button from "./Button.jsx";

export default function EmptyState({ title, hint, actionLabel, onAction, illustration }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-surface-border bg-surface-1 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-accent-600">
        {illustration ?? <DefaultIllustration />}
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {hint && <p className="mt-1 max-w-sm text-xs text-ink-muted">{hint}</p>}
      {actionLabel && onAction && (
        <Button size="md" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function DefaultIllustration() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M6 11l10-6 10 6v10l-10 6-10-6V11z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6 11l10 6 10-6M16 17v10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
