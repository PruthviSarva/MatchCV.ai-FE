"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ states */

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("size-4 animate-spin text-ink-muted", className)}
      aria-hidden
    />
  );
}

/** The whole-screen state while the session is being resolved. */
export function FullPageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <div className="pulse-ring absolute inset-0 rounded-2xl" aria-hidden />
        <div className="relative flex size-12 items-center justify-center rounded-2xl border border-brand-line bg-brand-soft">
          <Loader2 className="size-5 animate-spin text-brand" aria-hidden />
        </div>
      </div>
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}

/**
 * A grey block standing in for content that has not arrived.
 *
 * <p>Sized by the caller to match what will replace it. A skeleton that is a
 * different shape from the real thing makes the page jump when data lands,
 * which is worse than having shown a spinner.
 */
export function Skeleton({ className }: { className?: string }) {
  // A span made block-level rather than a div, because a skeleton stands in
  // for whatever has not loaded yet and that is sometimes a number inside a
  // <p>. A div there is invalid HTML and React reports it as a hydration
  // error; a span is valid in both positions and renders identically.
  return <span className={cn("shimmer block rounded-lg", className)} aria-hidden />;
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <span className={cn("block space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3.5", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------- empty */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed " +
          "border-line px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <span className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-ink-faint">
          {icon}
        </span>
      )}
      <p className="text-[0.9375rem] font-semibold text-ink">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ errors */

/**
 * An inline failure message.
 *
 * <p>`role="alert"` so a screen reader is told about a failure that appeared
 * after the page settled -- which is every failure a form produces.
 */
export function ErrorNote({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-start gap-3 rounded-xl border border-[color:var(--danger)]/25 " +
          "bg-danger-soft px-4 py-3 text-sm text-danger",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
      {action}
    </div>
  );
}
