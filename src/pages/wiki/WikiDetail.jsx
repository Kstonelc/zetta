import {
  Flex,
  Stack,
  Text,
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
    { accessorKey: "name", header: "Name" },
    { accessorKey: "age", header: "Age" },
  ];

  const data = [
    { name: "Alice", age: 22 },
    { name: "Bob", age: 30 },
  ];
  return (
    <Stack flex={1} h={"calc(100vh - 120px)"}>
      <Title order={3}>文档</Title>
      <Flex direction={"row"} flex={1} mih={0}>
        <Stack flex={1}>
          <Card shadow={"sm"} withBorder={true} h={"100%"}>
            <Text fw={"bold"} size={"lg"}>
              分类管理
            </Text>
            <ScrollArea>
              <Text mt={"md"}>目录1</Text>
              <Text>目录2</Text>
              <Text>目录3</Text>
            </ScrollArea>
          </Card>
        </Stack>
        <Stack flex={5} px={"md"} mih={0}>
          <Table />
          {/*<ScrollArea flex={1} h={"100%"}>*/}
          {/*  <Table />*/}
          {/*</ScrollArea>*/}
        </Stack>
      </Flex>
    </Stack>
  );
};

export { WikiDetail };
