import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  ReceiptText,
  X,
  Boxes,
} from "lucide-react";

import { cn } from "../../lib/cn.js";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/orders", label: "Orders", icon: ReceiptText },
];

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-surface-border bg-surface-1 transition-transform duration-200 ease-out-soft lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-surface-border px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-3 text-accent-600">
              <Boxes className="h-4.5 w-4.5" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Stockwise</p>
              <p className="text-2xs text-ink-muted">Inventory & Orders</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent-50 text-accent-700 dark:bg-accent-800/40 dark:text-accent-200"
                    : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                )
              }
            >
              <item.icon className="h-4 w-4" strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mx-3 mt-auto rounded-lg border border-surface-border bg-surface-2 p-4 text-xs text-ink-muted">
          <p className="font-medium text-ink">Live API</p>
          <p className="mt-1 break-all font-mono text-2xs leading-relaxed opacity-80">
            {import.meta.env.VITE_API_URL || "http://localhost:8000"}
          </p>
        </div>
      </aside>
    </>
  );
}
