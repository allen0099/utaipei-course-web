import { useCallback, useEffect, useRef, useState } from "react";

// Module-level cache shared across all hook instances so repeatedly-fetched
// static JSON (e.g. yms.json) is only requested once per session.
const jsonCache = new Map<string, Promise<unknown>>();

const fetchJson = <T>(url: string, signal?: AbortSignal): Promise<T> => {
  return fetch(url, { signal }).then((res) => {
    if (!res.ok) {
      throw new Error(`請求失敗（HTTP ${res.status}）：${url}`);
    }

    return res.json() as Promise<T>;
  });
};

export interface UseFetchJsonResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseFetchJsonOptions {
  /** Skip fetching entirely (e.g. dependent URL not ready yet). */
  enabled?: boolean;
  /** Share the fetched result across components via a module-level cache. */
  cache?: boolean;
}

/**
 * Fetch and parse a JSON endpoint with loading/error state, request
 * cancellation on unmount/dependency change, and an optional shared
 * in-memory cache for URLs that are fetched repeatedly (e.g. yms.json).
 */
export function useFetchJson<T>(
  url: string | null | undefined,
  options: UseFetchJsonOptions = {},
): UseFetchJsonResult<T> {
  const { enabled = true, cache = false } = options;
  const shouldFetch = !!url && enabled;

  const [data, setData] = useState<T | undefined>(undefined);
  const [fetchState, setFetchState] = useState<{
    loading: boolean;
    error: Error | null;
  }>({ loading: shouldFetch, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    if (url && cache) {
      jsonCache.delete(url);
    }
    setReloadToken((token) => token + 1);
  }, [url, cache]);

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }

    const activeUrl = url as string;
    const controller = new AbortController();

    abortRef.current = controller;
    // Kicking off the request is the effect's entire purpose here (there is
    // no external system to subscribe to beforehand), so the loading flag
    // must be set synchronously as the request starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetchState({ loading: true, error: null });

    // Cached requests intentionally don't use this consumer's AbortSignal:
    // the underlying fetch is shared across every component interested in
    // this URL, so one consumer unmounting (aborting) must not cancel the
    // in-flight request for everyone else. Non-cached requests are 1:1 with
    // a single consumer, so they can be tied to its signal as usual.
    const request = cache
      ? ((jsonCache.get(activeUrl) as Promise<T> | undefined) ??
        (() => {
          const promise = fetchJson<T>(activeUrl);

          jsonCache.set(activeUrl, promise);
          promise.catch(() => jsonCache.delete(activeUrl));

          return promise;
        })())
      : fetchJson<T>(activeUrl, controller.signal);

    request
      .then((json) => {
        if (controller.signal.aborted) return;
        setData(json);
        setFetchState({ loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setFetchState({
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });

    return () => {
      controller.abort();
    };
  }, [url, shouldFetch, cache, reloadToken]);

  return {
    data,
    loading: fetchState.loading,
    error: fetchState.error,
    refetch,
  };
}
