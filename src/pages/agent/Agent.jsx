import { WikiDetailEdit } from "@/pages/index.js";
import {
  Stack,
  Text,
  Group,
  Flex,
  Select,
  Title,
  ActionIcon,
  TextInput,
  useMantineTheme,
  Menu,
  Card,
  Button,
  Paper,
  Divider,
  ScrollArea,
} from "@mantine/core";
import { ChatBox } from "@/components";

import classes from "./Agent.module.scss";
import { MessagesSquare, FileUp, Box, Sparkles, ArrowUp } from "lucide-react";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";

const Agent = () => {
  const theme = useMantineTheme();

  return (
    <Flex p={"lg"} flex={1} gap={"sm"}>
      <Card maw={300} miw={200} shadow={"md"} withBorder={true} h={"100%"}>
        <Button mb={"md"} leftSection={<MessagesSquare size={16} />}>
          新建对话
        </Button>
        <ScrollArea>
          <Menu width={200}>
            <Menu.Label>今天</Menu.Label>
            <Menu.Item>新对话</Menu.Item>
          </Menu>
        </ScrollArea>
      </Card>
      <Divider orientation={"vertical"} />
      <Stack h={"100%"} flex={1} align={"center"} justify={"flex-end"}>
        <Title
          order={1}
          style={{
            position: "absolute",
            top: "30%",
          }}
        >
          我是Zetta智能助手，开始聊天吧
        </Title>
        <Card shadow={"sm"} w={"70%"} mb={"xl"} withBorder>
          <TextInput
            variant={"unstyled"}
            placeholder={"请输入你的问题"}
            w={"100%"}
            size={"md"}
            mb={"xs"}
          />
          <Group justify={"space-between"}>
            <Group>
              <ActionIcon variant={"subtle"} bg={theme.colors.gray[1]}>
                <FileUp size={18} color={theme.colors.gray[7]} />
              </ActionIcon>
              <Select
                maw={120}
                leftSectionPointerEvents="none"
                leftSection={
                  <Box
                    size={16}
                    color={theme.colors.gray[7]}
                    style={{
                      marginTop: 2,
                    }}
                  />
                }
                data={["Deepseek", "Qwen"]}
                size={"xs"}
              ></Select>
              <Button
                variant="gradient"
                leftSection={<Sparkles size={16} />}
                size={"xs"}
                gradient={{ from: "grape", to: "cyan", deg: 90 }}
              >
                深度思考
              </Button>
            </Group>
            <ActionIcon size="lg" variant={"light"} bdrs={"lg"}>
              <ArrowUp size={24} />
            </ActionIcon>
          </Group>
        </Card>
      </Stack>
    </Flex>
  );
};

export { Agent };
