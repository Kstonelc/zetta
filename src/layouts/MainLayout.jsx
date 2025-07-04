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
      <div
        style={{
          paddingLeft: 32,
          paddingRight: 32,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <Outlet />
      </div>
    </Stack>
  );
};

export { MainLayout };
