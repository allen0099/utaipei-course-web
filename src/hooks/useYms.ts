import { useCallback, useMemo } from "react";

import { YearSemesterItem, YmsCache } from "@/interfaces/globals.ts";
import { siteConfig } from "@/config/site.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";

export interface UseYmsResult {
  /** Newest 學年期 first, matching the order YmsSelector lists them in. */
  items: YearSemesterItem[];
  /**
   * The 學年期 the school is currently enrolling for, i.e. the one flagged
   * `default` in yms.json. `null` while loading and when the fetch failed —
   * callers must treat that as "unknown", never as "any semester is fine".
   */
  defaultCode: string | null;
  /** "115#1" → "115 學年度第 1 學期"; falls back to the raw code. */
  displayNameOf: (code: string | null | undefined) => string;
  loading: boolean;
}

/**
 * Shared access to yms.json.
 *
 * YmsSelector computes the default internally and only reports the *selected*
 * code back to its parent, so pages that need to know which 學年期 is the
 * current one (to gate adding courses to 我的課表) have no way to ask it. This
 * hook is that missing accessor; it goes through useFetchJson's module-level
 * cache, so sharing it with the selector costs no extra request.
 */
export const useYms = (): UseYmsResult => {
  const { data: cache, loading } = useFetchJson<YmsCache>(
    `${siteConfig.links.github.api}/yms.json`,
    { cache: true },
  );

  const items = useMemo<YearSemesterItem[]>(
    () => (Array.isArray(cache?.data) ? [...cache.data].reverse() : []),
    [cache],
  );

  const defaultCode = useMemo(
    () => items.find((item) => item.default)?.code ?? null,
    [items],
  );

  const displayNameOf = useCallback(
    (code: string | null | undefined) => {
      if (!code) return "";

      return items.find((item) => item.code === code)?.displayName ?? code;
    },
    [items],
  );

  return { items, defaultCode, displayNameOf, loading };
};
