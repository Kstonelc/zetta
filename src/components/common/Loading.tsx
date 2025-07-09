import {
  Box,
  LoadingOverlay as LoadingOverlayMT,
  useMantineTheme,
} from "@mantine/core";
import React, { FC } from "react";

interface LoadingProps {
  visible: boolean;
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' ,
  children: React.ReactNode;
}

const Loading: FC<LoadingProps> = ({ visible = false, size = "sm", children  }) => {
  const theme = useMantineTheme();
  return (
    <Box pos="relative">
      <LoadingOverlayMT
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
        loaderProps={{ color: theme.colors.blue[8], type: "bars", size: size }}
      />
      {children}
    </Box>
  );
};

export { Loading };
