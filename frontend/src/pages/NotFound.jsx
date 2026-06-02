import { Link } from "react-router-dom";
import Button from "../components/ui/Button.jsx";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-lg border border-dashed border-surface-border bg-surface-1 px-6 py-16 text-center">
      <p className="font-mono text-6xl font-semibold text-ink-subtle">404</p>
      <h1 className="mt-3 text-base font-semibold text-ink">Page not found</h1>
      <p className="mt-1 text-sm text-ink-muted">
        The page you were looking for has moved or no longer exists.
      </p>
      <Link to="/dashboard" className="mt-5">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
