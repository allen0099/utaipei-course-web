import { Key } from "@react-types/shared";
import { ComboBox, Input, Label, ListBox } from "@heroui/react";

type ItemElement = {
  code: string;
  name: string;
};

/**
 * Width for selectors sitting in a page's filter row: they share the row
 * equally so the row fills the page's content measure. Left at their intrinsic
 * width they occupy roughly two thirds of it, leaving a conspicuous empty
 * column down the right-hand side.
 */
export const FILTER_FIELD_CLASS = "w-full md:flex-1";

type SelectorProps<T extends ItemElement> = {
  items: T[];
  label: string;
  placeholder?: string;
  selectedKey?: Key | null;
  onChange: (id: Key | null) => void;
  className?: string;
};

export const ItemSelector = (props: SelectorProps<any>) => {
  const { items, label, placeholder, selectedKey, onChange, className } = props;
  // Derived directly from props; no need to mirror it into state.
  const disabled = items.length === 0;

  return (
    <ComboBox
      isRequired
      // Full width on phones — capping at 320px inside a centred column left
      // long 系所 names truncated with no way to widen. From md up the width
      // goes back to intrinsic (`w-auto`): forcing 100% there makes every
      // selector exactly 320px, and three of them no longer fit on one row.
      className={className ?? "w-full md:w-auto md:max-w-xs"}
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
