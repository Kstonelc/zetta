import {
  Stack,
  Title,
  Text,
  TextInput,
  Textarea,
  Card,
  Group,
  useMantineTheme,
} from "@mantine/core";
import { Cog } from "lucide-react";
import React from "react";

const WikiSettings = () => {
  const theme = useMantineTheme();
  return (
    <Stack>
      <Stack gap={4}>
        <Title order={4}>知识库设置</Title>
        <Text size={"xs"} c={"dimmed"}>
          可以在此配置您的知识库
        </Text>
      </Stack>
      <TextInput
        label="知识库名称"
        placeholder="请输入知识库名称"
        w={400}
      ></TextInput>
      <Textarea
        label="知识库描述"
        rows={4}
        placeholder="请输入知识库描述"
        w={400}
      ></Textarea>
      <Stack w={400}>
        <Text fw={"bold"} size={"sm"}>
          分段模式
        </Text>
        <Card withBorder>
          <Group>
            <Cog w={20} h={20} color={theme.colors.violet[6]} />
            <Stack gap={0}>
              <Text size={"sm"} fw={"bold"}>
                经典模式
              </Text>
              <Text size={"xs"} c={"dimmed"}>
                常规按照固定大小分段, 可配置分段大小和重叠大小
              </Text>
            </Stack>
          </Group>
        </Card>
      </Stack>
    </Stack>
  );
};

export { WikiSettings };
