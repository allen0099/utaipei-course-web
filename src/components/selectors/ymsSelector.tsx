import { Key } from "@react-types/shared";
import { useEffect, useState } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";

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
    <Autocomplete
      isRequired
      className="max-w-xs"
      isVirtualized={false} // Disable virtualization so we can scroll to the selected item
      label="選擇學年度"
      placeholder="請選擇..."
      selectedKey={defaultKey}
      variant="bordered"
      onSelectionChange={updateDefaultKey}
    >
      {data.map((yms) => (
        <AutocompleteItem key={yms.code}>{yms.displayName}</AutocompleteItem>
      ))}
    </Autocomplete>
  );
};
