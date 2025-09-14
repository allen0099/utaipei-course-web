import { Key } from "@react-types/shared";
import { useEffect, useState } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";

type ItemElement = {
  code: string;
  name: string;
};

type SelectorProps<T extends ItemElement> = {
  items: T[];
  label: string;
  placeholder?: string;
  onChange: (id: Key | null) => void;
};

export const ItemSelector = (props: SelectorProps<any>) => {
  const { items, label, placeholder, onChange } = props;
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (items.length > 0) {
      setDisabled(false);
    } else setDisabled(true);
  }, [items]);

  return (
    <Autocomplete
      isRequired
      className="max-w-xs"
      isDisabled={disabled}
      isVirtualized={false} // Disable virtualization so we can scroll to the selected item
      label={label}
      placeholder={placeholder || "請選擇..."}
      variant="bordered"
      onSelectionChange={onChange}
    >
      {items.map((item) => (
        <AutocompleteItem key={item.code}>{item.name}</AutocompleteItem>
      ))}
    </Autocomplete>
  );
};
