import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "../../lib/cn.js";

export default function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.aside
            className={cn(
              "absolute right-0 top-0 flex h-full flex-col bg-surface-1 shadow-pop",
              size === "md" && "w-full max-w-md",
              size === "lg" && "w-full max-w-xl",
              size === "sm" && "w-full max-w-sm"
            )}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: [0.22, 0.61, 0.36, 1], duration: 0.22 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-surface-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-ink">
                  {title}
                </h2>
                {description && (
                  <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
                aria-label="Close drawer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {footer && (
              <div className="border-t border-surface-border bg-surface-2/40 px-5 py-3">
                {footer}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
