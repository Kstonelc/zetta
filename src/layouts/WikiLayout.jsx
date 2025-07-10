import { Flex, Group, Title, ScrollArea } from "@mantine/core";
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
    <Group
      gap={0}
      wrap="nowrap"
      style={{ overflow: "hidden" }}
      h={"calc(100vh - 66px)"}
    >
      <WikiSideBar />
      <ScrollArea p={"lg"} direction={"column"} h={"100%"} w={"100%"}>
        <Outlet />
      </ScrollArea>
    </Group>
  );
};

export { WikiLayout };
