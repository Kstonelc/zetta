import React from "react";
import { Flex, Title, Button, Group, Text, Stack, Box } from "@mantine/core";
import { Send } from "lucide-react";
import { TipTapEditor } from "@/components";

const WikiDetailEdit = () => {
  return (
    <Flex direction={"column"} gap={"md"}>
      <Group justify="space-between">
        <Stack gap={"sm"}>
          <Title order={2}>富文本编辑器介绍</Title>
          <Text size={"sm"} c={"dimmed"}>
            最后编辑: 2024年1月10日 • 字数: 245
          </Text>
        </Stack>
        <Button leftSection={<Send size={16} />}>发布</Button>
      </Group>
      <TipTapEditor />
    </Flex>
  );
};

export { WikiDetailEdit };
