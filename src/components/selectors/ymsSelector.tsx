import { Key } from "@react-types/shared";
import { useEffect, useState } from "react";
import { ComboBox, Input, Label, ListBox } from "@heroui/react";

import { YearSemesterItem, YmsCache } from "@/interfaces/globals.ts";
import { siteConfig } from "@/config/site.ts";

export const YmsSelector = ({
  initialKey,
  onChange,
}: {
  initialKey?: string;
  onChange: (id: Key | null) => void;
}) => {
  const [data, setData] = useState<YearSemesterItem[]>([]);
  const [defaultKey, setDefaultKey] = useState<string>("");

  const updateDefaultKey = (key: Key | null) => {
    setDefaultKey(key?.toString() || "");
    onChange(key);
  };

  useEffect(() => {
    fetch(`${siteConfig.links.github.api}/yms.json`)
      .then((res) => res.json())
      .then((cache: YmsCache) => {
        const data = cache.data.reverse();

        setData(data);

        // Prefer restoring a caller-provided key (e.g. from the URL) when it
        // exists in the fetched data, otherwise fall back to the API default.
        const restoredItem = initialKey
          ? data.find((item) => item.code === initialKey)
          : undefined;
        const defaultItem = restoredItem || data.find((item) => item.default);

        if (defaultItem) {
          updateDefaultKey(defaultItem.code);
        }
      });
    // Only re-run when the fetched data source changes; `initialKey` is read
    // once on mount to restore the initial selection and intentionally not
    // re-applied on every change (the user's own selection should win after
    // the first render). `updateDefaultKey` is stable in behavior across
    // renders (it only wraps setState + the onChange callback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
