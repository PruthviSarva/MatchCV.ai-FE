import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "warn" | "danger" | "info" | "violet";

const TONES: Record<Tone, string> = {
  neutral: "border-line bg-surface-2 text-ink-muted",
  brand: "border-brand-line bg-brand-soft text-brand",
  warn: "border-[color:var(--warn)]/30 bg-warn-soft text-warn",
  danger: "border-[color:var(--danger)]/30 bg-danger-soft text-danger",
  info: "border-[color:var(--info)]/30 bg-info-soft text-info",
  violet: "border-[color:var(--violet)]/30 bg-[color:var(--violet)]/10 text-violet",
};

/**
 * A small status pill.
 *
 * <p>`dot` draws a filled circle in the current colour. Colour alone can carry
 * a status for most people and for nobody who cannot distinguish the hues, so
 * every badge in this app also says what it means in words -- the dot is
 * emphasis, never the message.
 */
export function Badge({
  tone = "neutral",
  dot = false,
  icon,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 " +
          "text-[0.6875rem] font-semibold uppercase tracking-[0.04em]",
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {icon}
      {children}
    </span>
  );
}

/** Lowercase, for things that are labels rather than statuses -- skills, tech. */
export function Chip({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border border-line bg-surface-2 " +
          "px-2.5 py-1 text-[0.8125rem] text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
