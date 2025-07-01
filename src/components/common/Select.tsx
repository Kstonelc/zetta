import { Select as SelectMT, SelectProps } from "@mantine/core";
import React, { FC } from "react";

const Select: FC<SelectProps> = ({
  size = "sm",
  searchable = false,
  clearable = false,
  allowDeselect = true,
  ...props
}) => {
  return (
    <SelectMT
      size={size}
      searchable={searchable}
      clearable={clearable}
      allowDeselect={allowDeselect}
      {...props}
    />
  );
};

export { Select };
