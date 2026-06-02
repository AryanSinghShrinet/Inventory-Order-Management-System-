import { Menu, Moon, Sun, Search } from "lucide-react";
import { useTheme } from "../../store/theme.jsx";

export default function Topbar({ onOpenMobileNav }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-surface-border bg-surface-1/85 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="rounded-md p-2 text-ink-muted hover:bg-surface-2 hover:text-ink lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden w-full max-w-sm sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        <input
          type="search"
          placeholder="Search products, customers, orders…"
          className="w-full rounded-md border border-surface-border bg-surface-1 py-1.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-md border border-surface-border bg-surface-1 px-2.5 py-1 text-2xs text-ink-muted md:flex">
          <kbd className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">⌘</kbd>
          <kbd className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">K</kbd>
          <span>Command palette</span>
        </div>

        <button
          type="button"
          onClick={toggle}
          className="rounded-md p-2 text-ink-muted hover:bg-surface-2 hover:text-ink"
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        <div className="flex items-center gap-2 rounded-md border border-surface-border bg-surface-1 px-2 py-1 text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-100 text-2xs font-semibold text-accent-700 dark:bg-accent-800 dark:text-accent-100">
            A
          </div>
          <span className="hidden text-ink sm:inline">Arpit</span>
        </div>
      </div>
    </header>
  );
}
