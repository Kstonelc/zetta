import React from "react";
import {
  Flex,
  Title,
  Button,
  Group,
  Text,
  Stack,
  Box,
  useMantineTheme,
} from "@mantine/core";
import { Send } from "lucide-react";
import { TipTapEditor } from "@/components";

const WikiDetailEdit = () => {
  const theme = useMantineTheme();
  return (
    <Stack gap={"sm"}>
      <Group
        justify="space-between"
        pos={"absolute"}
        w={"98%"}
        p={"xs"}
        bg={theme.white}
        style={{
          left: theme.spacing.xs,
          top: 0,
          zIndex: 100,
        }}
      >
        <Stack gap={"sm"}>
          <Title order={2}>富文本编辑器介绍</Title>
          <Text size={"sm"} c={"dimmed"}>
            最后编辑: 2024年1月10日 • 字数: 245
          </Text>
        </Stack>
        <Button leftSection={<Send size={16} />}>发布</Button>
      </Group>
      <TipTapEditor />
    </Stack>
  );
};

export { WikiDetailEdit };
