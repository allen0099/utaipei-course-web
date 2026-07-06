import { Key } from "@react-types/shared";
import { ComboBox, Input, Label, ListBox } from "@heroui/react";

type ItemElement = {
  code: string;
  name: string;
};

type SelectorProps<T extends ItemElement> = {
  items: T[];
  label: string;
  placeholder?: string;
  selectedKey?: Key | null;
  onChange: (id: Key | null) => void;
};

export const ItemSelector = (props: SelectorProps<any>) => {
  const { items, label, placeholder, selectedKey, onChange } = props;
  // Derived directly from props; no need to mirror it into state.
  const disabled = items.length === 0;

  return (
    <ComboBox
      isRequired
      className="max-w-xs"
      isDisabled={disabled}
      selectedKey={selectedKey}
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
