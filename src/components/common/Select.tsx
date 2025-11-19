import { Select as SelectMT, SelectProps } from "@mantine/core";
import React, { FC, useState } from "react";

const Select: FC<SelectProps> = ({
  label,
  description,
  key,
  placeholder,
  data,
  ...props
}) => {
  const [icon, setIcon] = useState<React.ReactNode>(null);
  return (
    <SelectMT
      label={label}
      description={description}
      key={key}
      placeholder={placeholder}
      data={data}
      {...props}
    />
  );
};

export { Select };
