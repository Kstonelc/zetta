import { FC } from "react";
import { TextareaProps, Textarea as TextAreaMT } from "@mantine/core";
import React from "react";

const TextArea: FC<TextareaProps> = ({
  size = "sm",
  variant = "filled",
  placeholder = "",
  label = "",
  description = "",
  required = false,
  ...props
}) => {
  return (
    <TextAreaMT
      label={label}
      variant={variant}
      description={description}
      required={required}
      placeholder={placeholder}
      autosize
      minRows={3}
      maxRows={5}
      {...props}
    />
  );
};

export { TextArea };
