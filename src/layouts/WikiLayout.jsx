import { Flex, Group, Title, ScrollArea } from "@mantine/core";
import { Outlet } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { WikiSideBar } from "@/components";
import { useParams } from "react-router-dom";

const WikiLayout = ({ wikiId }) => {
  // region 初始化

  useEffect(() => {
    initialize();
    return () => {
      onDestroy();
    };
  }, []);

  const initialize = async () => {
    console.log("知识库", wikiId);
  };

  const onDestroy = async () => {};

  //endregion

  return (
    <Group
      gap={0}
      wrap="nowrap"
      style={{ overflow: "hidden" }}
      h={"calc(100vh - 66px)"}
    >
      <WikiSideBar wikiId={wikiId} />
      <ScrollArea p={"lg"} direction={"column"} h={"100%"} w={"100%"}>
        <Outlet />
      </ScrollArea>
    </Group>
  );
};

export { WikiLayout };
