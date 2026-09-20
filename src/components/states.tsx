import type { ReactNode } from "react";

import { Spinner } from "@heroui/react";
import clsx from "clsx";

import { Translate, useT } from "@/i18n/language.tsx";

/** `label` 由呼叫端翻好再傳進來（t("課程資料", "course data")）。 */
const loadingText = (label: string | undefined, t: Translate) =>
  label ? t(`載入${label}中⋯`, `Loading ${label}…`) : t("載入中⋯", "Loading…");

export interface LoadingStateProps {
  /**
   * What is being loaded, already translated by the caller, e.g.
   * t("課程資料", "course data"). Rendered as「載入{label}中⋯」/ "Loading {label}…".
   */
  label?: string;
  className?: string;
}

/**
 * The single spinner treatment for the whole app. Previously this block was
 * hand-copied in ten places with a different wording and wrapper margin each
 * time.
 */
export const LoadingState = ({ label, className }: LoadingStateProps) => {
  const t = useT();

  return (
    <div
      aria-live="polite"
      className={clsx("flex items-center justify-center gap-2", className)}
    >
      <Spinner />
      <span className="text-muted">{loadingText(label, t)}</span>
    </div>
  );
};

export interface ListSkeletonProps {
  /** Announced to screen readers, e.g. "課程資料". */
  label?: string;
  rows?: number;
  className?: string;
}

/**
 * Placeholder for a list that is about to appear, shaped like the rows it will
 * be replaced by.
 *
 * A spinner is one line tall; the result table that replaces it is hundreds of
 * pixels. Everything below jumped when the data landed, and on a slow
 * connection the page looked empty rather than busy. `motion-safe:` keeps the
 * pulse off for people who asked for reduced motion.
 */
export const ListSkeleton = ({
  label,
  rows = 6,
  className,
}: ListSkeletonProps) => {
  const t = useT();

  return (
    <div
      aria-live="polite"
      className={clsx(
        "overflow-hidden rounded-lg border border-border",
        className,
      )}
      role="status"
    >
      <span className="sr-only">{loadingText(label, t)}</span>
      <div className="h-10 bg-background-secondary" />
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-t border-border/60 px-3 py-4"
        >
          <div className="size-4 shrink-0 rounded bg-surface-secondary motion-safe:animate-pulse" />
          <div className="h-3 w-12 shrink-0 rounded bg-surface-secondary motion-safe:animate-pulse" />
          <div className="h-3 flex-1 rounded bg-surface-secondary motion-safe:animate-pulse" />
          <div className="hidden h-3 w-24 rounded bg-surface-secondary motion-safe:animate-pulse sm:block" />
          <div className="hidden h-3 w-16 rounded bg-surface-secondary motion-safe:animate-pulse md:block" />
        </div>
      ))}
    </div>
  );
};

export interface NoticeProps {
  /**
   * danger for "something is wrong now", warning for "heads up", info for
   * plain explanations (why a control is disabled, that a list is truncated).
   * Those used to borrow the warning yellow, which made routine messages read
   * as if something had gone wrong.
   */
  tone?: "info" | "warning" | "danger";
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
      tone === "danger" && "border-danger/40 bg-danger/10 text-danger",
      tone === "warning" && "border-warning/40 bg-warning/10 text-warning",
      // 標準 Tailwind 色票：HeroUI v3 沒有可用的 info／數字色階 class。
      tone === "info" &&
        "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
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
