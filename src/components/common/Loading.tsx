import {
  Box,
  LoadingOverlay as LoadingOverlayMT,
  useMantineTheme,
} from "@mantine/core";
import React, { FC } from "react";

interface LoadingProps {
  children: React.ReactNode;
  visible: boolean;
}

const Loading: FC<LoadingProps> = ({ visible = false, children }) => {
  const theme = useMantineTheme();
  return (
    <Box pos="relative">
      <LoadingOverlayMT
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
        loaderProps={{ color: theme.colors.blue[8], type: "bars", size: "sm" }}
      />
      {children}
    </Box>
  );
};

export { Loading };
