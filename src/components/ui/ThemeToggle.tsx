"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Switches between the two themes.
 *
 * <p>Shows the icon of the theme it will switch *to*, with a label that says
 * so. A toggle that shows its current state leaves people guessing what
 * pressing it does.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={cn(
        "flex size-9 items-center justify-center rounded-xl border border-line " +
          "bg-surface-2 text-ink-muted transition-colors hover:border-line-strong " +
          "hover:text-ink",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </button>
  );
}
