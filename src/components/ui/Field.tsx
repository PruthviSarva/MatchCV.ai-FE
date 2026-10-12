"use client";

import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form controls.
 *
 * <p>Each one owns its own label, error text and the wiring between them --
 * the id, the `aria-describedby`, the `aria-invalid`. That plumbing is exactly
 * what gets skipped when a label is just a <span> somebody put above an input,
 * so it is not left to the call site.
 */

const CONTROL =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-ink " +
  "placeholder:text-ink-faint transition-colors duration-150 " +
  "hover:border-line-strong focus:border-[color:var(--brand)] focus:outline-none " +
  "focus:ring-4 focus:ring-[color:var(--brand)]/15 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const INVALID =
  "border-[color:var(--danger)] focus:border-[color:var(--danger)] " +
  "focus:ring-[color:var(--danger)]/15";

function Shell({
  id,
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  id: string;
  label?: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink">
            {label}
            {optional && (
              <span className="ml-1.5 font-normal text-ink-faint">optional</span>
            )}
          </label>
          {hint && <span className="text-xs text-ink-faint">{hint}</span>}
        </div>
      )}
      {children}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] text-danger"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

interface FieldProps {
  label?: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  wrapperClassName?: string;
}

export function Input({
  label,
  hint,
  error,
  optional,
  wrapperClassName,
  className,
  id: providedId,
  icon,
  ...rest
}: FieldProps & { icon?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const id = providedId ?? generated;

  return (
    <Shell
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={wrapperClassName}
    >
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
            {icon}
          </span>
        )}
        <input
          {...rest}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(CONTROL, "h-11", icon && "pl-10", error && INVALID, className)}
        />
      </div>
    </Shell>
  );
}

export function Textarea({
  label,
  hint,
  error,
  optional,
  wrapperClassName,
  className,
  id: providedId,
  ...rest
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generated = useId();
  const id = providedId ?? generated;

  return (
    <Shell
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={wrapperClassName}
    >
      <textarea
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(CONTROL, "resize-y py-3 leading-relaxed", error && INVALID, className)}
      />
    </Shell>
  );
}

export function Select({
  label,
  hint,
  error,
  optional,
  wrapperClassName,
  className,
  id: providedId,
  children,
  ...rest
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const generated = useId();
  const id = providedId ?? generated;

  return (
    <Shell
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={wrapperClassName}
    >
      <select
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          CONTROL,
          "h-11 cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.875rem_center] bg-no-repeat pr-10",
          error && INVALID,
          className,
        )}
        // The chevron is a background image rather than an absolutely
        // positioned icon, so it cannot drift out of alignment when the
        // control is resized by its container.
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2368788d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
        }}
      >
        {children}
      </select>
    </Shell>
  );
}
