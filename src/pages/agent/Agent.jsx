import { WikiDetailEdit } from "@/pages/index.js";
import {
  Stack,
  Text,
  Group,
  Flex,
  Select,
  Title,
  ActionIcon,
  Textarea,
  useMantineTheme,
  Menu,
  Card,
  Button,
  Paper,
  Divider,
  ScrollArea,
  Avatar,
} from "@mantine/core";
import { ChatBox } from "@/components";

import classes from "./Agent.module.scss";
import { MessagesSquare, FileUp, Box, Sparkles, ArrowUp } from "lucide-react";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import React, { useRef, useState } from "react";

const Agent = () => {
  const theme = useMantineTheme();
  const [input, setInput] = useState("");
  const [isNewChat, setIsNewChat] = useState(false);
  const [messages, setMessages] = useState([
    { role: "user", content: "你好!" },
    {
      role: "assistant",
      content:
        "你好，我是 AI，有什么可以帮你？你好，我是 AI，有什么可以帮你？你好，我是好，我是 AI，有什么可以帮你？你好，好，我是 AI，有什么可以帮你？你好，好，我是 AI，有什么可以帮你？你好，好，我是 AI，有什么可以帮你？你好，好，我是 AI，有什么可以帮你？你好，？ AI，有什么可以帮你？ AI，有什么可以帮你？ AI，有什么可以帮你？ AI，有什么可以帮你？",
    },
  ]);

  const chatContentRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // 模拟 AI 回复
    setTimeout(() => {
      const botReply = { role: "assistant", content: "收到！" };
      setMessages((prev) => [...prev, botReply]);
    }, 600);
  };
  const renderChatBox = () => {
    return (
      <ScrollArea
        flex={1}
        mah={"70vh"}
        px={"sm"}
        w={"80%"}
        viewportRef={chatContentRef}
        offsetScrollbars
        type="never"
      >
        <Stack gap="md" py="xs">
          {messages.map((msg, idx) => (
            <Flex
              key={idx}
              justify={msg.role === "user" ? "flex-end" : "flex-start"}
            >
              <Group>
                {msg.role === "assistant" && (
                  <Avatar variant={"light"} color={theme.colors.violet[7]}>
                    ZE
                  </Avatar>
                )}
                <Paper
                  bg={
                    msg.role === "user"
                      ? theme.colors.blue[5]
                      : theme.colors.gray[1]
                  }
                  p="sm"
                  radius="md"
                  withBorder
                  shadow="xs"
                  maw="80%"
                >
                  <Text
                    size="sm"
                    c={msg.role === "user" ? theme.white : theme.colors.dark[8]}
                  >
                    {msg.content}
                  </Text>
                </Paper>
                {msg.role === "user" && (
                  <Avatar variant={"light"} color={theme.colors.blue[7]}>
                    AD
                  </Avatar>
                )}
              </Group>
            </Flex>
          ))}
        </Stack>
      </ScrollArea>
    );
  };

  return (
    <Flex p={"lg"} flex={1} gap={"sm"}>
      <Card maw={220} miw={200} shadow={"md"} withBorder={true} h={"100%"}>
        <Button mb={"md"} leftSection={<MessagesSquare size={16} />}>
          新建对话
        </Button>
        <ScrollArea>
          <Menu>
            <Menu.Label>今天</Menu.Label>
            <Menu.Item>打招呼</Menu.Item>
          </Menu>
        </ScrollArea>
      </Card>
      <Divider orientation={"vertical"} />
      <Stack h={"100%"} flex={1} align={"center"} justify={"flex-end"}>
        {isNewChat ? (
          <Stack pos={"absolute"} top={"20%"} align={"center"}>
            <Title order={1}>我是Zetta智能助手，开始聊天吧</Title>
            <Text c={"dimmed"}>连接数据与知识，助你高效决策。</Text>
          </Stack>
        ) : (
          renderChatBox()
        )}
        <Card shadow={"sm"} w={"70%"} mb={"lg"} withBorder>
          <Textarea
            autosize
            minRows={1}
            maxRows={4}
            value={input}
            variant={"unstyled"}
            onChange={(e) => setInput(e.currentTarget.value)}
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
                maw={200}
                withCheckIcon={true}
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
                data={["DeepSeek", "Qwen"]}
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
            <ActionIcon
              size="lg"
              variant={"light"}
              bdrs={"lg"}
              onClick={() => {
                handleSend();
              }}
            >
              <ArrowUp size={24} />
            </ActionIcon>
          </Group>
        </Card>
      </Stack>
    </Flex>
  );
};

export { Agent };
