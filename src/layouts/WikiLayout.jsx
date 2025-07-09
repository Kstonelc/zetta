import { Flex, Group } from "@mantine/core";
import { Outlet } from "react-router-dom";
import React, { useEffect } from "react";
import { WikiSideBar } from "@/components";

const WikiLayout = () => {
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
    <Flex direction="column" h="100vh">
      <Group gap={0}>
        <WikiSideBar />
        <Outlet />
      </Group>
    </Flex>
  );
};

export { WikiLayout };
