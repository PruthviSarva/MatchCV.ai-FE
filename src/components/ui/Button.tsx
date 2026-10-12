"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "glass";
type Size = "sm" | "md" | "lg";

/**
 * Every clickable thing in the app.
 *
 * <p>The variants are a closed set on purpose. A component that takes an
 * arbitrary className for its colours stops being a design decision and
 * becomes a div, and within a week there are four slightly different greens.
 */
const VARIANTS: Record<Variant, string> = {
  // The one green button on a screen. Its glow is what the eye lands on, so
  // there should never be two competing for the same attention.
  primary:
    "bg-brand text-on-brand shadow-[0_8px_30px_-10px_var(--brand)] hover:bg-brand-strong " +
    "hover:shadow-[0_10px_34px_-8px_var(--brand)] active:translate-y-px",
  secondary:
    "bg-surface-2 text-ink border border-line-strong hover:bg-surface-3 " +
    "hover:border-line-strong active:translate-y-px",
  ghost: "text-ink-muted hover:text-ink hover:bg-surface-2",
  danger:
    "bg-danger-soft text-danger border border-[color:var(--danger)]/30 hover:bg-danger " +
    "hover:text-white active:translate-y-px",
  // Sits on top of the aurora without blocking it.
  glass:
    "bg-white/5 text-ink border border-line-strong backdrop-blur-xl hover:bg-white/10 " +
    "active:translate-y-px",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[0.8125rem] gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-13 px-7 text-[0.9375rem] gap-2.5 rounded-xl",
};

const BASE =
  "relative inline-flex select-none items-center justify-center font-semibold " +
  "whitespace-nowrap transition-all duration-150 " +
  "disabled:pointer-events-none disabled:opacity-45";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  /** Swaps the label for a spinner and blocks the click. */
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  fullWidth,
  className,
  children,
  disabled,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        icon
      )}
      {children}
      {!loading && iconRight}
    </button>
  );
}

/**
 * The same thing, as a link.
 *
 * <p>Separate from Button rather than a polymorphic `as` prop: navigation and
 * actions are genuinely different elements, and the typing needed to make one
 * component be both costs more than the duplication below saves.
 */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  fullWidth,
  className,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
    >
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}

/** A square button for a single icon. Needs a label, since there is no text. */
export function IconButton({
  label,
  size = "md",
  variant = "ghost",
  className,
  children,
  ...rest
}: CommonProps & { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const box = size === "sm" ? "size-8 rounded-lg" : "size-10 rounded-xl";
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={cn(
        BASE.replace("px-5", ""),
        VARIANTS[variant],
        box,
        "p-0",
        className,
      )}
    >
      {children}
    </button>
  );
}
