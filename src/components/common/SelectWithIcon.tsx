import {
  Combobox,
  Group,
  Input,
  InputBase,
  Text,
  useCombobox,
} from "@mantine/core";
import React, { ReactNode, useEffect, useState } from "react";

interface Item {
  icon: ReactNode;
  title: string;
  description: string;
}

interface Props {
  options?: Item[];
  placeholder?: string;
  leftSection?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  defaultValue?: string;
  onChange?: (value: string) => void;
}

function SelectOption({ icon, title, description }: Item) {
  return (
    <Group>
      <Text fz={20}>{icon}</Text>
      <div>
        <Text size={"sm"} fw={"bold"}>
          {title}
        </Text>
        <Text size={"xs"} c={"dimmed"}>
          {description}
        </Text>
      </div>
    </Group>
  );
}

const SelectWithIcon = ({
  options = [],
  placeholder = "请选择",
  leftSection,
  size = "sm",
  defaultValue,
  onChange,
}: Props) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [value, setValue] = useState<string | null>(null);
  const selectedOption = options.find((item) => item.title === value);

  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  const selectOptions = options.map((item) => (
    <Combobox.Option value={item.title} key={item.title}>
      <SelectOption {...item} />
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        setValue(val);
        if (onChange) {
          onChange(val);
        }
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          size={size}
          leftSection={leftSection}
          pointer
          miw={180}
          rightSection={<Combobox.Chevron />}
          onClick={() => combobox.toggleDropdown()}
          rightSectionPointerEvents="none"
          multiline
        >
          {selectedOption ? (
            <SelectOption {...selectedOption} />
          ) : (
            <Input.Placeholder>{placeholder}</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>{selectOptions}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export { SelectWithIcon };
