import React, { FC, ReactNode, useState } from "react";
import {
  Select as SelectMT,
  SelectProps,
  Image as ImageMT,
  Group,
} from "@mantine/core";

export type SelectOption = {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  group?: string;
};

export type SelectPropsMT = Omit<
  SelectProps,
  "data" | "onChange" | "renderOption"
> & {
  data?: SelectOption[];
  onChange?: (value: string | null) => void;
};

const Select: FC<SelectPropsMT> = ({
  label,
  description,
  placeholder,
  data = [],
  onChange,
  ...props
}) => {
  const [leftIcon, setLeftIcon] = useState<ReactNode>(null);

  const handleChange = (value: string | null) => {
    const selected = data.find((item) => item.value === value) ?? null;
    const icon = selected?.icon;

    setLeftIcon(
      icon ? <ImageMT src={icon} w={20} h={20} alt={selected?.label} /> : null,
    );

    onChange?.(value);
  };

  const renderOption: SelectProps["renderOption"] = ({ option }) => {
    const item = option as SelectOption;

    return (
      <Group gap="xs" flex={1}>
        {item.icon && (
          <ImageMT src={item.icon} w={20} h={20} alt={item.label} />
        )}
        {item.label}
      </Group>
    );
  };

  return (
    <SelectMT
      label={label}
      description={description}
      placeholder={placeholder}
      data={data}
      leftSection={leftIcon}
      renderOption={renderOption}
      onChange={handleChange}
      {...props}
    />
  );
};

export { Select };
