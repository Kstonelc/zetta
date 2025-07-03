import React, { FC, useEffect } from "react";
import {
  Text,
  Modal as ModalMT,
  useMantineColorScheme,
  ModalProps,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import { ColorScheme } from "@/enum";

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
  const { colorScheme } = useMantineColorScheme();
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
          backgroundColor:
            colorScheme === ColorScheme.light
              ? theme.colors.gray[0]
              : theme.colors.gray[8],
        },
      }}
      closeButtonProps={{ size: "lg", radius: "md" }}
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
