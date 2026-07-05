import { Key } from "@react-types/shared";
import { useEffect, useMemo, useState } from "react";
import { ComboBox, Input, Label, ListBox, Spinner } from "@heroui/react";

import { YearSemesterItem, YmsCache } from "@/interfaces/globals.ts";
import { siteConfig } from "@/config/site.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { FetchError } from "@/components/fetch-error.tsx";

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

  const data = useMemo<YearSemesterItem[]>(
    () => (cache ? [...cache.data].reverse() : []),
    [cache],
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
    return (
      <div className="flex items-center gap-2">
        <Spinner />
        <span>載入學年度中...</span>
      </div>
    );
  }

  return (
    <ComboBox
      isRequired
      className="max-w-xs"
      selectedKey={defaultKey}
      onSelectionChange={updateDefaultKey}
    >
      <Label>選擇學年度</Label>
      <ComboBox.InputGroup>
        <Input placeholder="請選擇..." />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox>
          {data.map((yms) => (
            <ListBox.Item
              key={yms.code}
              id={yms.code}
              textValue={yms.displayName}
            >
              <Label>{yms.displayName}</Label>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
};
