import {
  Button,
  Card,
  Flex,
  Group,
  Image,
  Stack,
  Switch,
  Text,
  Badge,
  TextInput,
  Select,
  useMantineTheme,
} from "@mantine/core";
import { Drawer } from "@/components/index.js";
import React, { useEffect, useRef, useState } from "react";
import { useNotify } from "@/utils/notify";
import { MessageSquareDot, ArrowDownUp, Scissors, Save } from "lucide-react";
import { ModelType } from "@/enum";

const ModelGlobalSetting = ({ modelProviders, opened, onUpdated, onClose }) => {
  const theme = useMantineTheme();
  const { notify } = useNotify();
  const textModelsRef = useRef(new Set());
  const embeddingModelsRef = useRef(new Set());
  const rerankModelsRef = useRef(new Set());

  //region 初始化
  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, [modelProviders]);

  const initialize = async () => {
    console.log("数据", modelProviders);
    groupModelsByCapability(modelProviders);
  };
  const destroy = async () => {};
  //endregion

  //region 方法

  const groupModelsByCapability = (modelProviders) => {
    for (const provider of modelProviders) {
      for (const model of provider.models) {
        if (model.types.includes("TextGeneration")) {
          textModelsRef.current.add(model.name);
        }
        if (model.types.includes("TextEmbedding")) {
          embeddingModelsRef.current.add(model.name);
        }
        if (model.types.includes("ReRank")) {
          rerankModelsRef.current.add(model.name);
        }
      }
    }
  };

  //endregion
  return (
    <Drawer
      title={"系统配置"}
      description={"配置全局AI模型设置，包括文本生成、切割以及重新排序等"}
      opened={opened}
      onClose={onClose}
    >
      <Select
        searchable
        data={[...textModelsRef.current]}
        label={
          <Group gap={"xs"} align={"center"}>
            <MessageSquareDot
              size={16}
              color={theme.colors.blue[8]}
            ></MessageSquareDot>
            <Text size={"sm"}>文本模型</Text>
          </Group>
        }
      ></Select>
      <Select
        searchable
        data={[...embeddingModelsRef.current]}
        label={
          <Group gap={"xs"} align={"center"}>
            <Scissors size={16} color={theme.colors.yellow[8]} />
            <Text size={"sm"}>Embedding模型</Text>
          </Group>
        }
      ></Select>
      <Select
        searchable
        data={[...rerankModelsRef.current]}
        label={
          <Group gap={"xs"} align={"center"}>
            <ArrowDownUp size={16} color={theme.colors.violet[8]} />
            <Text size={"sm"}>Rerank模型</Text>
          </Group>
        }
      ></Select>
      <Group justify={"flex-end"}>
        <Button variant={"subtle"} onClick={onClose}>
          取消
        </Button>
        <Button leftSection={<Save size={16} />}>保存</Button>
      </Group>
    </Drawer>
  );
};

export { ModelGlobalSetting };
