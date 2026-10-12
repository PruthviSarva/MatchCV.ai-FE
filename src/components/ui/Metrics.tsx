"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn, clamp, scoreTone } from "@/lib/utils";

/**
 * A match score, drawn as a ring.
 *
 * <p>The ring is one circle with a dash pattern rather than an arc path: the
 * stroke can then be animated by transitioning a single number, and the shape
 * stays perfectly round at any size.
 *
 * <p>The number is inside the ring and the words are under it, because the
 * colour of the ring is a second encoding of the same fact and must never be
 * the only one.
 */
export function ScoreRing({
  score,
  size = 120,
  thickness = 9,
  showLabel = true,
  className,
}: {
  score: number;
  size?: number;
  thickness?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const safe = clamp(Math.round(score), 0, 100);
  const tone = scoreTone(safe);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth={thickness}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tone.color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - safe / 100) }}
            transition={{ duration: 1.1, ease: [0.2, 0.7, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-semibold tabular-nums leading-none"
            style={{ fontSize: size * 0.28, color: tone.color }}
          >
            {safe}
            <span className="text-[0.5em] align-super">%</span>
          </span>
        </div>
      </div>
      {showLabel && (
        <p className="text-[0.8125rem] font-medium" style={{ color: tone.color }}>
          {tone.label}
        </p>
      )}
    </div>
  );
}

/** A horizontal meter. Used for the monthly allowance. */
export function Meter({
  value,
  max,
  tone = "brand",
  className,
}: {
  value: number;
  max: number;
  tone?: "brand" | "warn" | "danger";
  className?: string;
}) {
  const percent = max <= 0 ? 0 : clamp((value / max) * 100, 0, 100);
  const colors = {
    brand: "var(--brand)",
    warn: "var(--warn)",
    danger: "var(--danger)",
  } as const;

  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: colors[tone] }}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
      />
    </div>
  );
}

/**
 * One number with a label. The unit of every dashboard on this site.
 *
 * <p>`tabular-nums` on the value so a row of these does not jitter when the
 * numbers change width.
 */
export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "neutral",
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "brand" | "warn" | "danger";
  className?: string;
}) {
  const accents = {
    neutral: "text-ink-muted",
    brand: "text-brand",
    warn: "text-warn",
    danger: "text-danger",
  } as const;

  return (
    <div
      className={cn(
        "edge-light relative overflow-hidden rounded-2xl border border-line bg-surface p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.8125rem] font-medium text-ink-muted">{label}</p>
        {icon && <span className={cn("shrink-0", accents[tone])}>{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
