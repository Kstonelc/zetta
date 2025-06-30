import { Divider, Stack } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { Header } from "@/components";
import React from "react";

const MainLayout = () => {
  return (
    <Stack>
      <Header />
      <Divider
        size="xs"
        style={{
          marginTop: -15,
        }}
      />
      <Outlet />
    </Stack>
  );
};

export { MainLayout };
