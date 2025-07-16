import React, { FC, useEffect } from "react";
import {
  Text,
  Drawer as DrawerMT,
  useMantineColorScheme,
  DrawerProps,
  Stack,
  useMantineTheme,
  ScrollArea,
} from "@mantine/core";
import { ColorScheme } from "@/enum";

interface CustomDrawerProps extends DrawerProps {
  description?: string;
}

const Drawer: FC<CustomDrawerProps> = ({
  opened,
  onClose,
  children,
  title,
  description,
  ...props
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  return (
    <DrawerMT
      offset={8}
      opened={opened}
      onClose={onClose}
      position="right"
      title={<Text fw={"bold"}>{title}</Text>}
      radius={"md"}
      styles={{
        close: {
          backgroundColor:
            colorScheme === ColorScheme.light
              ? theme.colors.gray[0]
              : theme.colors.gray[8],
        },
      }}
      scrollAreaComponent={ScrollArea.Autosize}
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
    </DrawerMT>
  );
};

export { Drawer };
