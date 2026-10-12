import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The panel everything sits in.
 *
 * <p>`edge-light` adds the hairline that is brighter along the top than the
 * bottom. On a near-black canvas a flat border reads as a drawn rectangle;
 * the gradient is what makes it read as a raised surface catching light.
 */
export function Card({
  className,
  children,
  interactive = false,
  glow = false,
}: {
  className?: string;
  children: ReactNode;
  /** Lifts and brightens on hover. For cards that are themselves a link. */
  interactive?: boolean;
  /** A brand-tinted halo. For the one card on a screen that is the point. */
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "edge-light relative rounded-2xl border border-line bg-surface",
        glow && "shadow-[0_0_0_1px_var(--brand-line),0_20px_60px_-30px_var(--brand)]",
        interactive &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong " +
            "hover:bg-surface-2 hover:shadow-[0_18px_40px_-24px_rgb(0_0_0/0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 p-5 pb-0", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-brand">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-[0.9375rem] font-semibold text-ink">{title}</h2>
          {description && (
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-muted">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

/** A footer separated by a rule, for the actions that close a card out. */
export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-line px-5 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The heading above a group of cards. */
export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink sm:text-[1.375rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
