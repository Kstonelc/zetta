import { TextInput as TextInputMT, TextInputProps } from "@mantine/core";
import React from "react";
import { FC } from "react";

const TextInput: FC<TextInputProps> = ({
  size = "sm",
  variant = "filled",
  placeholder = "",
  label = "",
  description = "",
  required = false,
  ...props
}) => {
  return (
    <TextInputMT
      label={label}
      variant={variant}
      description={description}
      required={required}
      placeholder={placeholder}
      {...props}
    />
  );
};

export { TextInput };
