import {
  Combobox,
  Group,
  Input,
  InputBase,
  Text,
  useCombobox,
} from "@mantine/core";
import React, { ReactNode, useState } from "react";

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
}

function SelectOption({ icon, title, description }: Item) {
  return (
    <Group>
      <Text fz={20}>{icon}</Text>
      <div>
        <Text fz="sm" fw={500}>
          {title}
        </Text>
        <Text fz="xs" opacity={0.6}>
          {description}
        </Text>
      </div>
    </Group>
  );
}

const SelectOptionComponent = ({
  options = [],
  placeholder = "Please Pick Up",
  leftSection,
  size = "sm",
}: Props) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [value, setValue] = useState<string | null>(null);
  const selectedOption = options.find((item) => item.title === value);

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
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          size={size}
          w={200}
          leftSection={leftSection}
          pointer
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

export { SelectOptionComponent };
