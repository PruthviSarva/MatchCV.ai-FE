/**
 * Small helpers shared across components. Nothing here talks to the API or
 * holds state -- if it needs either, it belongs somewhere else.
 */

/**
 * Joins class names, dropping anything falsy.
 *
 * <p>Deliberately not `clsx` + `tailwind-merge`. Those earn their weight when
 * components forward conflicting utilities into each other; here every
 * component owns its own classes and takes an optional `className` that is
 * appended last, which CSS resolves by source order anyway.
 */
export function cn(...parts: unknown[]): string {
  // Takes `unknown` rather than a union of string and falsy values so that
  // `icon && "pl-10"` type-checks when `icon` is a ReactNode -- a node is not
  // assignable to that union, and widening it here is better than making every
  // call site write `Boolean(icon) && ...`. Anything that is not a non-empty
  // string is dropped, so a stray node can never leak into the class list.
  return parts
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ");
}

/** "12 Oct 2026" -- unambiguous in every locale, unlike a numeric date. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * "3 hours ago", and plain dates once something is older than a week.
 *
 * <p>Relative time stops being useful past a few days -- "47 days ago" is
 * harder to place than the date itself.
 */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  const then = new Date(iso).getTime();
  const seconds = Math.round((Date.now() - then) / 1000);

  if (seconds < 45) {
    return "just now";
  }

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
  ];

  let value = seconds;
  for (const [unit, step] of units) {
    if (Math.abs(value) < step) {
      return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
        -Math.round(value),
        unit,
      );
    }
    value /= step;
  }
  return formatDate(iso);
}

/** Up to two letters for an avatar. Falls back to the email when there is no name. */
export function initials(name: string | undefined, email?: string): string {
  const source = name?.trim() || email?.trim() || "?";
  const words = source.split(/[\s@._-]+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Rough word count, for the job-description field's live feedback. */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * How a match score should read.
 *
 * <p>The bands are generous at the top because the score measures coverage of
 * a posting's stated requirements, and no honest resume covers all of them --
 * anything above the seventies is a genuinely strong fit.
 */
export function scoreTone(score: number): {
  label: string;
  color: string;
  tint: string;
} {
  if (score >= 75) {
    return { label: "Strong match", color: "var(--brand)", tint: "var(--brand-soft)" };
  }
  if (score >= 50) {
    return { label: "Partial match", color: "var(--warn)", tint: "var(--warn-soft)" };
  }
  return { label: "Weak match", color: "var(--danger)", tint: "var(--danger-soft)" };
}

/** "2.4k characters" rather than "2431 characters" in tight spaces. */
export function compactNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
