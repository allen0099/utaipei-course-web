import { Key } from "@react-types/shared";
import { useEffect, useState } from "react";
import { ComboBox, Input, Label, ListBox } from "@heroui/react";

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
    <ComboBox
      isRequired
      className="max-w-xs"
      isDisabled={disabled}
      onSelectionChange={onChange}
    >
      <Label>{label}</Label>
      <ComboBox.InputGroup>
        <Input placeholder={placeholder || "請選擇..."} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox>
          {items.map((item) => (
            <ListBox.Item key={item.code} id={item.code} textValue={item.name}>
              <Label>{item.name}</Label>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
};
