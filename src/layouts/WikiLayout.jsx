import { Flex, Group, Title, ScrollArea } from "@mantine/core";
import { Outlet, useParams } from "react-router-dom";
import React, { useEffect, useMemo } from "react";
import { WikiSideBar } from "@/components";

const WikiLayout = () => {
  const { wikiId } = useParams();

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

  // region 组件渲染

  const renderWikiSideBar = useMemo(() => {
    return <WikiSideBar wikiId={wikiId} />;
  }, [wikiId]);

  // endregion

  return (
    <Group
      gap={0}
      wrap="nowrap"
      style={{ overflow: "hidden" }}
      h={"calc(100vh - 66px)"}
    >
      {renderWikiSideBar}
      <ScrollArea p={"lg"} direction={"column"} h={"100%"} w={"100%"}>
        <Outlet />
      </ScrollArea>
    </Group>
  );
};

export { WikiLayout };
