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
  Image,
  ScrollArea,
  Avatar,
} from "@mantine/core";
import { MarkdownViewer } from "@/components";
import "highlight.js/styles/idea.css";
import { getHotkeyHandler } from "@mantine/hooks";
import { ChatBox } from "@/components";

import {
  MessagesSquare,
  FileUp,
  Box,
  Sparkles,
  ArrowUp,
  Pause,
} from "lucide-react";
import { SelectWithIcon } from "@/components";
import React, { useEffect, useRef, useState } from "react";
import appHelper from "@/AppHelper.js";
import { useNotify } from "@/utils/notify.js";
import { ModelType } from "@/enum.ts";
import { useUserStore } from "@/stores/useUserStore.js";
import classes from "./Agent.module.scss";

const Agent = () => {
  const theme = useMantineTheme();
  const notify = useNotify();

  const { userStore, setUserStore } = useUserStore();
  const [input, setInput] = useState("");
  const [isNewChat, setIsNewChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [models, setModels] = useState([]);
  const [isWikiEnable, setIsWikiEnable] = useState(false);
  const [isThink, setIsThink] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const sessionContentRef = useRef(null);
  const sessionStopControllerRef = useRef(null);

  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, []);

  useEffect(() => {
    if (sessionContentRef.current) {
      sessionContentRef.current.scrollTo({
        top: sessionContentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    if (appHelper.getLength(messages) === 0) {
      setIsNewChat(true);
    } else {
      setIsNewChat(false);
    }
  }, [messages]);

  const initialize = async () => {
    const response = await appHelper.apiPost("/model/find-models", {
      modelType: ModelType.TextGeneration,
      tenantId: userStore.current_tenant.id,
    });
    if (!response.ok) {
      return;
    }
    setModels(response.data);
  };

  const destroy = async () => {};

  const handleSend = async () => {
    if (!input.trim() || !currentModel) return;

    setIsGenerating(true);

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    // 清空输入框
    setInput("");

    const assistantMessage = { role: "assistant", content: "" };

    // 先占位空 assistant 回复
    setMessages((prev) => [...prev, assistantMessage]);

    // 当前模型提供商
    let currentModelProvider;
    for (const model of models) {
      if (currentModel === model.name) {
        currentModelProvider = model.provider.name;
        break;
      }
    }
    sessionStopControllerRef.current = new AbortController();
    const result = await appHelper.apiFetch(
      "/session/chat",
      {
        prompt: input,
        modelName: currentModel,
        modelProvider: currentModelProvider,
      },
      sessionStopControllerRef.current?.signal,
    );

    const reader = result.response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          setIsGenerating(false);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        console.log(chunk);

        // 实时更新 assistant 的内容
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            role: "assistant",
            content: last.content + chunk,
          };
          return updated;
        });
      }
    } catch (e) {
      if (e.name === "AbortError") {
        setIsGenerating(false);
      } else {
        console.error("请求发生错误:", e);
      }
    }
  };

  const stopSend = async () => {
    sessionStopControllerRef.current.abort();
  };

  const renderChatBox = () => {
    return (
      <ScrollArea
        flex={1}
        mah={"70vh"}
        px={"sm"}
        w={"80%"}
        viewportRef={sessionContentRef}
        offsetScrollbars
        type="never"
      >
        <Stack gap="md" py="xs">
          {messages.map((msg, id) => (
            <Flex
              key={id}
              justify={msg.role === "user" ? "flex-end" : "flex-start"}
            >
              <Group align={"flex-start"}>
                {msg.role === "assistant" && (
                  <Avatar variant={"light"} color={theme.colors.violet[7]}>
                    ZE
                  </Avatar>
                )}
                <Paper
                  flex={1}
                  bg={
                    msg.role === "user" ? theme.colors.blue[5] : "transparent"
                  }
                  p={msg.role === "user" ? "xs" : 0}
                  radius="md"
                  withBorder={msg.role === "user"}
                  shadow={msg.role === "user" ? "sm" : "none"}
                  miw="20%"
                >
                  <Text
                    size="sm"
                    c={msg.role === "user" ? theme.white : theme.colors.dark[8]}
                  >
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <MarkdownViewer content={msg.content}></MarkdownViewer>
                    )}
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

  const getModelOptions = () => {
    if (appHelper.getLength(models) > 0) {
      return models.map((model) => ({
        icon: model.provider.logo ? (
          <Image src={model.provider.logo} w={20} h={20} />
        ) : null,
        title: model.display_name,
      }));
    }
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
            <Title order={1}>我是Bichon智能助手，开始聊天吧</Title>
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
                  {/*<ActionIcon variant={"subtle"} bg={theme.colors.gray[1]}>*/}
                  {/*  <FileUp size={18} color={theme.colors.gray[7]} />*/}
                  {/*</ActionIcon>*/}

                  <SelectWithIcon
                    size={"xs"}
                    options={getModelOptions()}
                    onChange={(value) => {
                      setCurrentModel(value);
                    }}
                  />
                  <Button
                    variant={isThink ? "light" : "subtle"}
                    color={isThink ? theme.colors.blue[7] : theme.black}
                    onClick={() => {
                      setIsThink(!isThink);
                    }}
                    leftSection={<Sparkles size={16} />}
                    size={"xs"}
                  >
                    <Text size={"xs"} fw={"bold"}>
                      深度思考
                    </Text>
                  </Button>
                </Group>
                <ActionIcon
                  size="lg"
                  disabled={appHelper.getLength(input) === 0 && !isGenerating}
                  variant={"light"}
                  bdrs={"lg"}
                  onClick={async () => {
                    if (isGenerating) {
                      await stopSend();
                    } else {
                      await handleSend();
                    }
                  }}
                >
                  {isGenerating ? <Pause size={24} /> : <ArrowUp size={24} />}
                </ActionIcon>
              </Group>
            </Card>
          </Popover.Target>
          <Popover.Dropdown>
            <Menu>
              <Menu.Item>
                <Text size={"xs"}>Bichon</Text>
              </Menu.Item>
            </Menu>
          </Popover.Dropdown>
        </Popover>
      </Stack>
    </Flex>
  );
};

export { Agent };
