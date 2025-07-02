import React, { FC, useEffect } from "react";
import {
  Text,
  Modal as ModalMT,
  ModalProps,
  Stack,
  useMantineTheme,
} from "@mantine/core";

interface CustomModalProps extends ModalProps {
  opened: boolean;
  onClose: () => void;
  description?: string;
}

const Modal: FC<CustomModalProps> = ({
  opened,
  onClose,
  children,
  title,
  fullScreen = false,
  description,
  ...props
}) => {
  const theme = useMantineTheme();
  return (
    <ModalMT
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      transitionProps={{ transition: "fade-down", duration: 200 }}
      radius={"md"}
      fullScreen={fullScreen}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      styles={{
        close: {
          backgroundColor: theme.colors.gray[1],
        },
      }}
      closeButtonProps={{ size: "xl", radius: "md" }}
      {...props}
    >
      <Stack gap="md">
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
        {children}
      </Stack>
    </ModalMT>
  );
};

export { Modal };
