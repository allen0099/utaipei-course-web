import { useCallback, useSyncExternalStore } from "react";

const supportsMatchMedia = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function";

/**
 * Whether a media query currently matches.
 *
 * For the cases CSS can't express — not building a subtree at all, and
 * attributes CSS cannot set. Callers that use this to *choose* between two
 * layouts must not also hide one with responsive classes: if the two ever
 * disagreed the result would be a blank page rather than a merely mis-sized
 * one.
 *
 * useSyncExternalStore rather than useState + useEffect so the value is read
 * fresh on every render; a change landing between first render and the
 * subscription can't leave it stale.
 */
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!supportsMatchMedia()) return () => {};

      const list = window.matchMedia(query);

      list.addEventListener("change", onChange);

      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => supportsMatchMedia() && window.matchMedia(query).matches,
    // Static pre-render has no viewport, so nothing matches.
    () => false,
  );
};
