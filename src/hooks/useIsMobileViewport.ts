import { useMediaQuery } from "@/hooks/useMediaQuery.ts";

/** Mirrors Tailwind's `md:` breakpoint, which the responsive layouts key off. */
const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Whether the viewport is below Tailwind's `md:` breakpoint. See
 * useMediaQuery for when to reach for this instead of a responsive class.
 *
 * Static pre-render reports `false`: desktop is the safer assumption because
 * the table degrades to horizontal scroll, while the card list would simply
 * look wrong on a wide screen.
 */
export const useIsMobileViewport = (): boolean => useMediaQuery(MOBILE_QUERY);
