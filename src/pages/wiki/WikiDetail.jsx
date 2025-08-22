import {
  Flex,
  Stack,
  Text,
  Group,
  Button,
  Title,
  Card,
  ScrollArea,
  Paper,
  Badge,
  useMantineTheme,
  Image,
} from "@mantine/core";
import FatherSon from "@/assets/wiki/father-son.svg";
import { FolderUp } from "lucide-react";
import { Table } from "@/components";
import QWen from "@/assets/models/qwen.svg";
import React from "react";

const WikiDetail = () => {
  const theme = useMantineTheme();
  const columns = [
    {
      accessor: "docName",
      title: "名称",
      textAlign: "center",
      width: 200,
    },
    {
      accessor: "docSize",
      title: "大小",
      textAlign: "center",
      width: 50,
    },
    {
      accessor: "docSplitType",
      title: "分段模式",
      textAlign: "center",
      render: ({ docSplitType }) => (
        <Badge
          variant={"light"}
          size={"sm"}
          leftSection={<Image src={FatherSon} w={12} h={12} />}
        >
          {docSplitType}
        </Badge>
      ),
    },
    {
      accessor: "docStatus",
      title: "状态",
      textAlign: "center",
      width: 100,
    },
    {
      accessor: "createdAt",
      title: "上传时间",
      textAlign: "center",
    },
    {
      accessor: "option",
      title: "操作",
      textAlign: "center",
    },
  ];

  const data = [
    { docName: "react native 原理", docSplitType: "父子分段" },
    { docName: "js 面试题", docSplitType: "父子分段" },
  ];
  return (
    <Stack flex={1} h={"calc(100vh - 120px)"}>
      <Title order={3}>文档</Title>
      <Group justify={"flex-end"}>
        <Button leftSection={<FolderUp size={16} />}>导入文档</Button>
      </Group>

      <Stack flex={5} px={"md"} mih={0}>
        <Table data={data} columns={columns} />
      </Stack>
    </Stack>
  );
};

export { WikiDetail };
