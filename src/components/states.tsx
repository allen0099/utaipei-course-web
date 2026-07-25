import type { ReactNode } from "react";

import { Spinner } from "@heroui/react";
import clsx from "clsx";

export interface LoadingStateProps {
  /** What is being loaded, e.g. "課程資料". Rendered as「載入{label}中⋯」. */
  label?: string;
  className?: string;
}

/**
 * The single spinner treatment for the whole app. Previously this block was
 * hand-copied in ten places with a different wording and wrapper margin each
 * time.
 */
export const LoadingState = ({ label, className }: LoadingStateProps) => (
  <div
    aria-live="polite"
    className={clsx("flex items-center justify-center gap-2", className)}
  >
    <Spinner />
    <span className="text-muted">{label ? `載入${label}中⋯` : "載入中⋯"}</span>
  </div>
);

export interface NoticeProps {
  /** danger for "something is wrong now", warning for "heads up". */
  tone?: "warning" | "danger";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The inline callout used for 衝堂 warnings, 學年期 mismatches and similar
 * page-level notices, so they don't each invent their own border and padding.
 */
export const Notice = ({
  tone = "warning",
  icon,
  children,
  className,
}: NoticeProps) => (
  <div
    className={clsx(
      "flex items-start gap-2 rounded-lg border p-3 text-sm",
      tone === "danger"
        ? "border-danger/40 bg-danger/10 text-danger"
        : "border-warning/40 bg-warning/10 text-warning",
      className,
    )}
  >
    {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
    <span>{children}</span>
  </div>
);

export interface EmptyStateProps {
  /** One short line saying what is missing or what to do next. */
  title: ReactNode;
  /** Optional second line with the how/why. */
  description?: ReactNode;
  /** Optional call to action (a link or button). */
  action?: ReactNode;
  className?: string;
}

/**
 * Shared treatment for "nothing here yet" and "nothing matched" — including the
 * idle state before the user has picked a filter. Keeping these in one place
 * stops each page inventing its own size, colour and spacing.
 */
export const EmptyState = ({
  title,
  description,
  action,
  className,
}: EmptyStateProps) => (
  <div className={clsx("flex flex-col items-center gap-2 py-8", className)}>
    <p className="text-center text-muted">{title}</p>
    {description && (
      <p className="max-w-md text-center text-sm text-muted">{description}</p>
    )}
    {action}
  </div>
);
