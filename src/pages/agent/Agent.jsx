import { WikiDetailEdit } from "@/pages/index.js";
import {
  Stack,
  Text,
  Group,
  Flex,
  Select,
  Title,
  ActionIcon,
  Popover,
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
import ReactMarkdown from "react-markdown";
import { getHotkeyHandler } from "@mantine/hooks";
import { ChatBox } from "@/components";

import classes from "./Agent.module.scss";
import {
  MessagesSquare,
  FileUp,
  Box,
  Sparkles,
  ArrowUp,
  BookOpen,
} from "lucide-react";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import React, { useEffect, useRef, useState } from "react";
import appHelper from "@/AppHelper.js";
import { useNotify } from "@/utils/notify.js";

const Agent = () => {
  const theme = useMantineTheme();
  const notify = useNotify();

  const [input, setInput] = useState("");
  const [isNewChat, setIsNewChat] = useState(false);
  const [messages, setMessages] = useState([
    { role: "user", content: "你好!" },
    {
      role: "assistant",
      content: "你好，我是 AI，有什么可以帮你？",
    },
  ]);
  const [isWikiEnable, setIsWikiEnable] = useState(false);

  const chatContentRef = useRef(null);

  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTo({
        top: chatContentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    // 清空输入框
    setInput("");

    const assistantMessage = { role: "assistant", content: "" };

    // 先占位空 assistant 回复
    setMessages((prev) => [...prev, assistantMessage]);

    const result = await appHelper.apiFetch("/conversation/send-message", {
      prompt: input,
    });

    const reader = result.response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // 实时更新 assistant 的内容
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = {
          role: "assistant",
          content: last.content + chunk,
        };
        console.log("updated", updated);
        return updated;
      });
    }
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
          {messages.map((msg, id) => (
            <Flex
              key={id}
              justify={msg.role === "user" ? "flex-end" : "flex-start"}
            >
              <Group justify={msg.role === "user" ? "flex-end" : "flex-start"}>
                {msg.role === "assistant" && (
                  <Avatar variant={"light"} color={theme.colors.violet[7]}>
                    ZE
                  </Avatar>
                )}
                <Paper
                  flex={1}
                  bg={
                    msg.role === "user"
                      ? theme.colors.blue[5]
                      : theme.colors.gray[1]
                  }
                  px={"xs"}
                  radius="md"
                  withBorder
                  shadow="xs"
                  maw="70%"
                >
                  <Text
                    size="sm"
                    c={msg.role === "user" ? theme.white : theme.colors.dark[8]}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
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
        <Popover
          width={200}
          opened={isWikiEnable}
          position="left-end"
          offset={5}
        >
          <Popover.Target>
            <Card shadow={"sm"} w={"70%"} mb={"lg"} withBorder>
              <Textarea
                autosize
                onKeyDown={getHotkeyHandler([
                  ["enter", () => handleSend()],
                  ["mod+Enter", () => handleSend()],
                ])}
                minRows={1}
                maxRows={4}
                value={input}
                variant={"unstyled"}
                onChange={(e) => {
                  const inputValue = e.currentTarget.value;
                  if (inputValue.length === 1 && inputValue[0] === "@") {
                    setIsWikiEnable(true);
                  } else if (inputValue.length === 0) {
                    setIsWikiEnable(false);
                  }
                  setInput(inputValue);
                }}
                placeholder={"@知识库或直接提问"}
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
                    leftSection={
                      <Sparkles size={16} color={theme.colors.yellow[3]} />
                    }
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
                  onClick={async () => {
                    await handleSend();
                  }}
                >
                  <ArrowUp size={24} />
                </ActionIcon>
              </Group>
            </Card>
          </Popover.Target>
          <Popover.Dropdown>
            <Menu>
              <Menu.Item>
                <Text size={"xs"}>Zetta</Text>
              </Menu.Item>
            </Menu>
          </Popover.Dropdown>
        </Popover>
      </Stack>
    </Flex>
  );
};

export { Agent };
