import { Divider, Flex, Box } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { Header } from "@/components";
import React, { useEffect } from "react";

const MainLayout = () => {
  // region 初始化

  useEffect(() => {
    initialize();
    return () => {
      onDestroy();
    };
  }, []);

  const initialize = async () => {};

  const onDestroy = async () => {};

  //endregion

  return (
    <Flex direction="column" h="100vh" flex={1}>
      <Header />
      <Divider size="xs" mt={0} mb={0} />
      <Outlet />
    </Flex>
  );
};

export { MainLayout };
