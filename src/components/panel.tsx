import type { ReactNode } from "react";

import clsx from "clsx";

/** Plain bordered container — the app's lightest surface, below `Card`. */
export const Panel = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={clsx("rounded-lg border border-border p-6", className)}>
    {children}
  </div>
);

/**
 * Standard page body wrapper. Every page used to repeat some variation of
 * `flex flex-col items-center py-6 md:py-8 w-full`.
 */
export const PageSection = ({
  children,
  align = "center",
  className,
}: {
  children: ReactNode;
  /** `stretch` for full-width page bodies that manage their own max width. */
  align?: "center" | "stretch";
  className?: string;
}) => (
  <section
    className={clsx(
      "flex w-full flex-col py-6 md:py-8",
      align === "center" ? "items-center" : "items-stretch",
      className,
    )}
  >
    {children}
  </section>
);

export default Panel;
