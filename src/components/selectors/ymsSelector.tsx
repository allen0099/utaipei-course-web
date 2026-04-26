import { Key } from "@react-types/shared";
import { useEffect, useState } from "react";
import { ComboBox, Input, Label, ListBox } from "@heroui/react";

import { YearSemesterItem } from "@/interfaces/globals.ts";
import { siteConfig } from "@/config/site.ts";

export const YmsSelector = ({
  onChange,
}: {
  onChange: (id: Key | null) => void;
}) => {
  const [data, setData] = useState<YearSemesterItem[]>([]);
  const [defaultKey, setDefaultKey] = useState<string>("");

  useEffect(() => {
    fetch(`${siteConfig.links.github.api}/yms.json`)
      .then((res) => res.json())
      .then((data: YearSemesterItem[]) => {
        data.reverse();

        setData(data);

        const defaultItem = data.find((item) => item.default);

        if (defaultItem) {
          updateDefaultKey(defaultItem.code);
        }
      });
  }, []);

  const updateDefaultKey = (key: Key | null) => {
    setDefaultKey(key?.toString() || "");
    onChange(key);
  };

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
