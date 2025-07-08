import { Divider, Flex } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { Header } from "@/components";
import React from "react";

const MainLayout = () => {
  return (
    <Flex direction="column" h="100vh">
      <Header />
      <Divider
        size="xs"
        style={{
          marginTop: 0,
          marginBottom: 0,
        }}
      />
      <Outlet />
    </Flex>
  );
};

export { MainLayout };
