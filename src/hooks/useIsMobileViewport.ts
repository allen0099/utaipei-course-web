import { useCallback, useSyncExternalStore } from "react";

/** Mirrors Tailwind's `md:` breakpoint, which the responsive layouts key off. */
const MOBILE_QUERY = "(max-width: 767px)";

const supportsMatchMedia = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function";

/**
 * Whether the viewport is below Tailwind's `md:` breakpoint.
 *
 * For the cases CSS can't express — not building a subtree at all, and
 * attributes CSS cannot set. Callers that use this to *choose* between two
 * layouts must not also hide one with `md:` classes: if the two ever
 * disagreed the result would be a blank page rather than a merely
 * mis-sized one.
 *
 * useSyncExternalStore rather than useState + useEffect so the value is read
 * fresh on every render; a change landing between first render and the
 * subscription can't leave it stale.
 */
export const useIsMobileViewport = (): boolean => {
  const subscribe = useCallback((onChange: () => void) => {
    if (!supportsMatchMedia()) return () => {};

    const query = window.matchMedia(MOBILE_QUERY);

    query.addEventListener("change", onChange);

    return () => query.removeEventListener("change", onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => supportsMatchMedia() && window.matchMedia(MOBILE_QUERY).matches,
    // Static pre-render has no viewport; desktop is the safer assumption
    // because the table degrades to horizontal scroll, while the card list
    // would simply look wrong on a wide screen.
    () => false,
  );
};
