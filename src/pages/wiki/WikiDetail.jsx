import {
  Flex,
  Stack,
  Text,
  Button,
  Title,
  Card,
  ScrollArea,
  Paper,
  useMantineTheme,
} from "@mantine/core";
import { Table } from "@/components";

const WikiDetail = () => {
  const theme = useMantineTheme();
  const columns = [
    {
      accessor: "docName",
      title: "名称",
      textAlign: "center",
      width: 100,
    },
    {
      accessor: "docSplitType",
      title: "分段模式",
      textAlign: "center",
    },
  ];

  const data = [
    { docName: "11111", docSplitType: "父子分段" },
    { docName: "22222", docSplitType: "父子分段" },
  ];
  return (
    <Stack flex={1} h={"calc(100vh - 120px)"}>
      <Title order={3}>文档</Title>

      <Stack flex={5} px={"md"} mih={0}>
        <Table data={data} columns={columns} />
      </Stack>
    </Stack>
  );
};

export { WikiDetail };
