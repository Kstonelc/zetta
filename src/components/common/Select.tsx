import React, { FC } from "react";
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
  label = "",
  description = "",
  placeholder,
  data = [],
  onChange,
  ...props
}) => {
  const { value, defaultValue, ...rest } = props;

  const currentValue = (value ?? defaultValue ?? null) as string | null;

  const selected = data.find((item) => item.value === currentValue) ?? null;
  const leftIcon = selected?.icon ? (
    <ImageMT src={selected.icon} w={20} h={20} alt={selected.label} />
  ) : null;

  const handleChange = (next: string | null) => {
    onChange?.(next);
  };

  const renderOption: SelectProps["renderOption"] = ({ option }) => {
    const item = option as SelectOption;

    return (
      <Group gap="xs" flex={1} wrap="nowrap">
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
      value={value}
      defaultValue={defaultValue}
      leftSection={leftIcon}
      renderOption={renderOption}
      onChange={handleChange}
      {...rest}
    />
  );
};

export { Select };
