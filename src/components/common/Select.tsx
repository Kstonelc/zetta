import { Select as MantineSelect, SelectProps } from "@mantine/core";
import React, { FC } from "react";

export interface CustomSelectProps extends SelectProps {
  label?: string;
  placeholder?: string;
  data: Array<string | { value: string; label: string; [key: string]: any }>;
  searchable?: boolean;
  clearable?: boolean;
  allowDeselect?: boolean;
}

const Select: FC<CustomSelectProps> = ({
  label,
  placeholder,
  data,
  value,
  onChange,
  searchable = false,
  clearable = false,
  allowDeselect = true,
  ...props
}) => {
  return (
    <MantineSelect
      label={label}
      placeholder={placeholder}
      data={data}
      value={value}
      onChange={onChange as SelectProps["onChange"]}
      searchable={searchable}
      clearable={clearable}
      allowDeselect={allowDeselect}
      {...props}
    />
  );
};

export { Select };
