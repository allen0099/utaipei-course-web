import { Key } from "@react-types/shared";
import { useEffect, useMemo, useRef, useState } from "react";

import { YearSemesterItem, YmsCache } from "@/interfaces/globals.ts";
import { siteConfig } from "@/config/site.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { ItemSelector } from "@/components/selectors/itemSelector.tsx";
import { LoadingState } from "@/components/states.tsx";

export const YmsSelector = ({
  initialKey,
  onChange,
  className,
}: {
  initialKey?: string;
  onChange: (id: Key | null) => void;
  /** Width override, so a filter row can make all its selectors share it. */
  className?: string;
}) => {
  const {
    data: cache,
    loading,
    error,
    refetch,
  } = useFetchJson<YmsCache>(`${siteConfig.links.github.api}/yms.json`, {
    cache: true,
  });

  const data = useMemo<YearSemesterItem[]>(() => {
    if (!Array.isArray(cache?.data)) {
      if (cache) {
        // eslint-disable-next-line no-console
        console.error("Invalid yms.json response:", cache);
      }

      return [];
    }

    return [...cache.data].reverse();
  }, [cache]);

  // ItemSelector renders `name`; yms.json calls the same field `displayName`.
  const items = useMemo(
    () => data.map((yms) => ({ code: yms.code, name: yms.displayName })),
    [data],
  );

  // Prefer restoring a caller-provided key (e.g. from the URL) when it
  // exists in the fetched data, otherwise fall back to the API default.
  const computedDefaultKey = useMemo(() => {
    const restoredItem = initialKey
      ? data.find((item) => item.code === initialKey)
      : undefined;
    const defaultItem = restoredItem || data.find((item) => item.default);

    return defaultItem?.code ?? null;
    // `initialKey` is read once to restore the initial selection and
    // intentionally not re-applied on every change (the user's own
    // selection should win after the first render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // `null` means the user hasn't picked one yet, so the API default fills in.
  // Anything else is their own pick and always wins — a cleared field must
  // therefore never be stored here (see `onSelectionChange` below), otherwise
  // the selector silently drops back onto the default.
  const [manualKey, setManualKey] = useState<string | null>(null);
  const selectedKey = manualKey ?? computedDefaultKey;

  // The field and the page have to agree on one 學年期, so the parent is told
  // about `selectedKey` — the same value the ComboBox renders — from this one
  // place, whether it came from the user or from the fetched default. The ref
  // makes it idempotent: pages pass a fresh `onChange` on every render, and
  // re-announcing the same key would restart their fetches in a loop.
  const reportedKey = useRef<string | null>(null);

  useEffect(() => {
    if (selectedKey === null || selectedKey === reportedKey.current) {
      return;
    }

    reportedKey.current = selectedKey;
    onChange(selectedKey);
  }, [selectedKey, onChange]);

  const handleSelectionChange = (key: Key | null) => {
    // ComboBox reports `null` whenever the input is emptied — clearing it by
    // hand, but also mid-edit while retyping over the current value. The field
    // is required and every page needs a 學年期 to fetch anything, so keep the
    // current pick and let react-aria restore its text when the field blurs.
    if (key === null) {
      return;
    }

    setManualKey(key.toString());
  };

  if (error) {
    return <FetchError message="學年度資料載入失敗。" onRetry={refetch} />;
  }

  if (loading) {
    return <LoadingState label="學年度" />;
  }

  // YmsSelector is ItemSelector plus a fetch — the ComboBox tree lives in one
  // place so both selectors stay visually and behaviourally identical.
  return (
    <ItemSelector
      className={className}
      items={items}
      label="選擇學年度"
      selectedKey={selectedKey}
      onChange={handleSelectionChange}
    />
  );
};
