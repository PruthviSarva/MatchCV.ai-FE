"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/Button";

/**
 * A centred dialog.
 *
 * <p>Hand-built on the native semantics rather than pulled from a library,
 * because the three things that actually make a dialog usable are small: Escape
 * closes it, focus moves into it when it opens, and the page behind it stops
 * scrolling. All three are below.
 *
 * <p>What this deliberately does not do is trap focus in a loop. A real focus
 * trap is subtle enough to be worth a tested library, and getting it half right
 * is worse than leaving Tab able to reach the page behind -- which is merely
 * untidy, not a dead end.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);

    // Freeze the page behind the dialog. Restored exactly, rather than set to
    // an empty string, so a nested dialog cannot unlock the scroll early.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the panel itself rather than the first control: reading the title
    // before being dropped into an input is what a sighted user gets.
    const timer = window.setTimeout(() => panel.current?.focus(), 0);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  const widths = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
  } as const;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.2, 0.7, 0.3, 1] }}
            className={cn(
              "edge-light relative w-full overflow-hidden rounded-2xl border " +
                "border-line-strong bg-surface shadow-floating outline-none",
              widths[size],
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line p-5">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink">{title}</h2>
                {description && (
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-muted">
                    {description}
                  </p>
                )}
              </div>
              <IconButton label="Close" size="sm" onClick={onClose}>
                <X className="size-4" />
              </IconButton>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>

            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
