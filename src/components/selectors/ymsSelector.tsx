import { Key } from "@react-types/shared";
import { useEffect, useMemo, useState } from "react";

import { YearSemesterItem, YmsCache } from "@/interfaces/globals.ts";
import { siteConfig } from "@/config/site.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { ItemSelector } from "@/components/selectors/itemSelector.tsx";
import { LoadingState } from "@/components/states.tsx";

export const YmsSelector = ({
  initialKey,
  onChange,
}: {
  initialKey?: string;
  onChange: (id: Key | null) => void;
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

    return defaultItem?.code || "";
    // `initialKey` is read once to restore the initial selection and
    // intentionally not re-applied on every change (the user's own
    // selection should win after the first render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const [manualKey, setManualKey] = useState<string | null>(null);
  const defaultKey = manualKey ?? computedDefaultKey;

  const updateDefaultKey = (key: Key | null) => {
    setManualKey(key?.toString() || "");
    onChange(key);
  };

  useEffect(() => {
    if (computedDefaultKey) {
      onChange(computedDefaultKey);
    }
    // Only notify the parent when the computed default itself changes (i.e.
    // once the yms.json fetch resolves); this mirrors the previous behavior
    // without setting local state from inside the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedDefaultKey]);

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
      items={items}
      label="選擇學年度"
      selectedKey={defaultKey}
      onChange={updateDefaultKey}
    />
  );
};
