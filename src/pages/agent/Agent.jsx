import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  forwardRef,
} from "react";
import {
  Stack,
  Text,
  Group,
  Flex,
  Title,
  Loader,
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
import { Global } from "@emotion/react";
import { Virtuoso } from "react-virtuoso";
import "highlight.js/styles/github.css";
import { getHotkeyHandler } from "@mantine/hooks";
import {
  MessagesSquare,
  Sparkles,
  ArrowUp,
  Pause,
  ArrowDown,
} from "lucide-react";

import appHelper from "@/AppHelper.js";
import { useNotify } from "@/utils/notify.js";
import { ModelType } from "@/enum.ts";
import { useUserStore } from "@/stores/useUserStore.js";
import { MarkdownViewer, SelectWithIcon } from "@/components";

const Agent = () => {
  const theme = useMantineTheme();
  const notify = useNotify();
  const { userStore } = useUserStore();

  // 输入框
  const [input, setInput] = useState("");

  // 消息（Virtuoso 的 data 源）
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 模型相关
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);
  const [isThink, setIsThink] = useState(false);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);

  // 滚动控制
  const virtuosoRef = useRef(null);
  const scrollerElRef = useRef(null);
  const atBottomRef = useRef(true);
  const userInteractingRef = useRef(false);
  const [showJump, setShowJump] = useState(false);

  // 流控
  const sessionStopControllerRef = useRef(null);
  const bufferRef = useRef("");
  const flushTimerRef = useRef(null);
  const currentAssistantIdRef = useRef(null);

  const isNewChat = messages.length === 0;

  // 初始化模型
  useEffect(() => {
    let mounted = true;
    (async () => {
      const response = await appHelper.apiPost("/model/find-models", {
        modelType: ModelType.TextGeneration,
        tenantId: userStore.current_tenant.id,
      });
      if (!mounted || !response?.ok) return;
      const data = response.data || [];
      setModels(data);
      if (data.length) setCurrentModel(data[0].name);
    })();
    return () => {
      mounted = false;
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      bufferRef.current = "";
      if (sessionStopControllerRef.current) {
        sessionStopControllerRef.current.abort();
        sessionStopControllerRef.current = null;
      }
    };
  }, [userStore.current_tenant.id]);

  // 模型选项
  const modelOptions = useMemo(
    () =>
      (models ?? []).map((model) => ({
        value: model.name,
        title: model.display_name,
        icon: model.provider?.logo ? (
          <Image src={model.provider.logo} w={20} h={20} />
        ) : null,
      })),
    [models],
  );

  // 底部判定
  const isAtBottomStrict = useCallback(() => {
    const el = scrollerElRef.current;
    if (!el) return true;
    const diff = el.scrollHeight - el.scrollTop - el.clientHeight;
    return diff <= 2;
  }, []);

  const recomputeOverflowAndJump = useCallback(() => {
    const el = scrollerElRef.current;
    if (!el) return;
    const overflow = el.scrollHeight - el.clientHeight > 1;
    const atBottom = isAtBottomStrict();
    atBottomRef.current = atBottom;
    setShowJump(overflow && !atBottom);
  }, [isAtBottomStrict]);

  useEffect(() => {
    const id = requestAnimationFrame(recomputeOverflowAndJump);
    return () => cancelAnimationFrame(id);
  }, [messages, recomputeOverflowAndJump]);

  useEffect(() => {
    const onResize = () => recomputeOverflowAndJump();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recomputeOverflowAndJump]);

  const cancelAutoStick = useCallback(() => {
    userInteractingRef.current = true;
  }, []);
  const allowAutoStick = useCallback(() => {
    userInteractingRef.current = false;
  }, []);

  /** ------------------ 平滑贴底 ------------------ */
  const pinToBottomSmooth = useCallback(() => {
    const el = scrollerElRef.current;
    if (!el) return;
    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
    try {
      el.scrollTo({ top: maxTop, behavior: "smooth" });
    } catch {
      el.scrollTop = maxTop;
    }
  }, []);

  // 自定义 Scroller（避免 GPU 抖动样式）
  const Scroller = useMemo(
    () =>
      forwardRef(function ScrollerImpl({ style, onScroll, ...props }, ref) {
        const handleScroll = (e) => {
          onScroll?.(e);
          userInteractingRef.current = true;
          const el = scrollerElRef.current;
          if (!el) return;
          const overflow = el.scrollHeight - el.clientHeight > 1;
          const atBottom = isAtBottomStrict();
          atBottomRef.current = atBottom;
          setShowJump(overflow && !atBottom);
        };
        return (
          <div
            className="no-scrollbar"
            {...props}
            ref={(node) => {
              scrollerElRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            style={{
              ...style,
              overscrollBehavior: "contain",
            }}
            onScroll={handleScroll}
            onWheel={cancelAutoStick}
            onTouchStart={cancelAutoStick}
            onTouchMove={cancelAutoStick}
            onTouchEnd={() => requestAnimationFrame(allowAutoStick)}
          />
        );
      }),
    [allowAutoStick, cancelAutoStick, isAtBottomStrict],
  );

  /** ------------------ 流式拼接（批量刷新） ------------------ */
  const appendToAssistantById = useCallback(
    (assistantId, textChunk) => {
      setMessages((prev) => {
        if (!assistantId || !textChunk) return prev;
        const idx = prev.findIndex((m) => m.id === assistantId);
        if (idx === -1) return prev;

        const next = [...prev];
        const current = next[idx];

        // 如果当前 content 是 React 组件（如 <Loader />），先清空再写入
        let currentContent = current.content;
        if (React.isValidElement(currentContent)) {
          currentContent = ""; // 去掉 Loader
        }

        next[idx] = {
          ...current,
          content: (currentContent || "") + textChunk,
        };

        return next;
      });

      if (atBottomRef.current && !userInteractingRef.current) {
        requestAnimationFrame(pinToBottomSmooth);
      }
    },
    [pinToBottomSmooth],
  );

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current != null) return;
    flushTimerRef.current = window.setInterval(() => {
      if (!bufferRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
        return;
      }
      const toAppend = bufferRef.current;
      bufferRef.current = "";
      appendToAssistantById(currentAssistantIdRef.current, toAppend);
    }, 200); // 较低频率，减少 UI 抖动
  }, [appendToAssistantById]);

  // 发送 / 停止
  const stopSend = useCallback(() => {
    if (sessionStopControllerRef.current) {
      sessionStopControllerRef.current.abort();
      sessionStopControllerRef.current = null;
      setIsGenerating(false);
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      bufferRef.current = "";
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (isGenerating) {
      stopSend();
      return;
    }
    if (!input.trim() || !currentModel) return;

    setIsGenerating(true);

    const userMessage = {
      role: "user",
      content: input,
    };
    const assistantId = `a_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      content: <Loader size={"xs"} mt={"xs"} />,
    };
    currentAssistantIdRef.current = assistantId;

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    userInteractingRef.current = false;
    setInput("");

    requestAnimationFrame(() => {
      if (!userInteractingRef.current) {
        virtuosoRef.current?.scrollToIndex({
          index: messagesRef.current.length + 1,
          align: "end",
          behavior: "smooth",
        });
        requestAnimationFrame(pinToBottomSmooth);
      }
      requestAnimationFrame(recomputeOverflowAndJump);
    });

    // 发送请求
    let currentModelProvider;
    for (const model of models) {
      if (currentModel === model.name) {
        currentModelProvider = model.provider?.name;
        break;
      }
    }

    sessionStopControllerRef.current = new AbortController();
    let result;
    try {
      result = await appHelper.apiFetch(
        "/session/chat",
        {
          prompt: userMessage.content,
          modelName: currentModel,
          modelProvider: currentModelProvider,
        },
        sessionStopControllerRef.current?.signal,
      );
    } catch (err) {
      setIsGenerating(false);
      console.error("请求失败:", err);
      return;
    }

    const reader = result?.response?.body?.getReader?.();
    if (!reader) {
      setIsGenerating(false);
      console.error("流读取器不可用");
      return;
    }

    const decoder = new TextDecoder("utf-8");

    try {
      // 流式读取
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          if (bufferRef.current) {
            const toAppend = bufferRef.current;
            bufferRef.current = "";
            appendToAssistantById(currentAssistantIdRef.current, toAppend);
          }
          if (flushTimerRef.current) {
            clearInterval(flushTimerRef.current);
            flushTimerRef.current = null;
          }
          setIsGenerating(false);
          requestAnimationFrame(recomputeOverflowAndJump);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        bufferRef.current += chunk;
        scheduleFlush();
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error("请求发生错误:", e);
      }
      setIsGenerating(false);
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      bufferRef.current = "";
    }
  }, [
    input,
    currentModel,
    models,
    isGenerating,
    pinToBottomSmooth,
    recomputeOverflowAndJump,
    scheduleFlush,
    stopSend,
  ]);

  /** ------------------ 跳到底部 ------------------ */
  const jumpToBottomNow = useCallback(() => {
    const lastIdx = messagesRef.current.length - 1;
    virtuosoRef.current?.scrollToIndex({
      index: Math.max(0, lastIdx),
      align: "end",
      behavior: "smooth",
    });
    requestAnimationFrame(() => {
      pinToBottomSmooth();
      setShowJump(false);
    });
  }, [pinToBottomSmooth]);

  /** ------------------ 渲染列表 ------------------ */
  const renderChatBox = () => {
    return (
      <div
        style={{
          position: "relative",
          width: "90%",
          height: "70vh",
          minHeight: 0,
        }}
      >
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: "100%", width: "100%" }}
          data={messages}
          computeItemKey={(_, msg) => msg.id}
          increaseViewportBy={{ top: 600, bottom: 900 }} // 适中缓冲，减少重排
          followOutput={
            isGenerating && atBottomRef.current && !userInteractingRef.current
              ? "smooth"
              : false
          }
          components={{ Scroller }}
          itemContent={(_, msg) => (
            <MessageItem key={msg.id} msg={msg} theme={theme} />
          )}
          // 保守的滚动寻路，避免大幅度跳动导致闪烁
          scrollSeekConfiguration={{
            enter: (v) => Math.abs(v) > 800,
            exit: (v) => Math.abs(v) < 400,
          }}
        />

        {/* 底部悬浮“跳至最新” */}
        {showJump && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: 8,
              display: "flex",
              justifyContent: "center",
              background: "transparent",
              zIndex: 9,
            }}
          >
            <ActionIcon
              variant="default"
              onClick={jumpToBottomNow}
              size="xl"
              radius="xl"
              aria-label="跳至最新"
              title="跳至最新"
            >
              <ArrowDown />
            </ActionIcon>
          </div>
        )}
      </div>
    );
  };

  /** ------------------ 渲染 ------------------ */
  return (
    <Flex p="lg" flex={1} gap="sm" style={{ minHeight: 0 }}>
      {/* 隐藏滚动条 */}
      <Global
        styles={{
          ".no-scrollbar": {
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          },
          ".no-scrollbar::-webkit-scrollbar": {
            display: "none",
            width: 0,
            height: 0,
          },
        }}
      />

      {/* 左栏 */}
      <Card maw={220} miw={200} shadow="md" withBorder h="100%">
        <Button mb="md" leftSection={<MessagesSquare size={16} />}>
          新建对话
        </Button>
        <ScrollArea h="calc(100% - 48px)">
          <Menu withinPortal>
            <Menu.Label>今天</Menu.Label>
            <Menu.Item>打招呼</Menu.Item>
          </Menu>
        </ScrollArea>
      </Card>

      <Divider orientation="vertical" />

      {/* 右侧主区域 */}
      <Stack h="100%" flex={1} align="center" justify="flex-end" mih={0}>
        {isNewChat ? (
          <Stack pos="absolute" top="20%" align="center">
            <Title order={1}>我是 Bichon 智能助手，开始聊天吧</Title>
            <Text c="dimmed">连接数据与知识，助你高效决策。</Text>
          </Stack>
        ) : (
          renderChatBox()
        )}

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isGenerating={isGenerating}
          modelOptions={modelOptions}
          currentModel={currentModel}
          setCurrentModel={setCurrentModel}
          isThink={isThink}
          setIsThink={setIsThink}
          theme={theme}
        />
      </Stack>
    </Flex>
  );
};

/** -------------------------------------------------------
 * 子组件：消息项 强 memo，避免滚动/输入导致重渲染
 * ----------------------------------------------------- */
const MessageItem = React.memo(
  ({ msg, theme }) => {
    const isUser = msg.role === "user";
    return (
      <Flex
        style={{ marginTop: 20, marginBottom: 20 }}
        justify={isUser ? "flex-end" : "flex-start"}
      >
        <Group align="flex-start" wrap="nowrap">
          {!isUser && (
            <Avatar variant="light" color={theme.colors.violet[7]}>
              ZE
            </Avatar>
          )}
          <Paper
            flex={1}
            bg={isUser ? theme.colors.blue[5] : "transparent"}
            p={isUser ? "xs" : 0}
            radius="md"
            mb="xl"
            withBorder={isUser}
            shadow="none"
            miw="20%"
            maw="80%"
          >
            {isUser ? (
              <Text size="sm" c={theme.white}>
                {msg.content}
              </Text>
            ) : appHelper.isString(msg.content) ? (
              <>
                <MarkdownViewer content={msg.content} />
              </>
            ) : (
              msg.content
            )}
          </Paper>
          {isUser && (
            <Avatar variant="light" color={theme.colors.blue[7]} mr="md">
              AD
            </Avatar>
          )}
        </Group>
      </Flex>
    );
  },
  (prev, next) =>
    prev.msg.id === next.msg.id && prev.msg.content === next.msg.content,
);

/** -------------------------------------------------------
 * 子组件：输入区域（memo，切断与列表的重渲染耦合）
 * ----------------------------------------------------- */
const ChatInput = React.memo(function ChatInput({
  input,
  setInput,
  onSend,
  isGenerating,
  modelOptions,
  currentModel,
  setCurrentModel,
  isThink,
  setIsThink,
  theme,
}) {
  const handleKeyDown = useMemo(
    () =>
      getHotkeyHandler([
        [
          "enter",
          () => {
            if (!isGenerating) onSend();
          },
        ],
        ["mod+Enter", () => onSend()],
      ]),
    [isGenerating, onSend],
  );

  return (
    <Popover
      width={220}
      opened={input.startsWith("@")}
      position="left-end"
      offset={6}
    >
      <Popover.Target>
        <Card shadow="sm" w="70%" mb="lg" withBorder radius={"xl"}>
          <Textarea
            autosize={false}
            minRows={1}
            maxRows={4}
            value={input}
            variant="unstyled"
            onKeyDown={handleKeyDown}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="@知识库或直接提问"
            w="100%"
            size="md"
            styles={{
              input: { lineHeight: 1.4 },
              textarea: { resize: "none" },
            }}
          />
          <Group justify="space-between">
            <Group gap="xs">
              <SelectWithIcon
                size="xs"
                options={modelOptions}
                onChange={setCurrentModel}
                value={currentModel}
              />
              <Button
                variant={isThink ? "light" : "subtle"}
                color={isThink ? theme.colors.blue[7] : theme.black}
                onClick={() => setIsThink((v) => !v)}
                leftSection={<Sparkles size={16} />}
                size="xs"
              >
                <Text size="xs" fw="bold">
                  深度思考
                </Text>
              </Button>
            </Group>
            <ActionIcon
              size="xl"
              variant="light"
              radius="xl"
              onClick={() => {
                onSend();
              }}
            >
              {isGenerating ? <Pause size={18} /> : <ArrowUp size={22} />}
            </ActionIcon>
          </Group>
        </Card>
      </Popover.Target>
      <Popover.Dropdown>
        <Menu>
          <Menu.Item>
            <Text size="xs">Bichon</Text>
          </Menu.Item>
        </Menu>
      </Popover.Dropdown>
    </Popover>
  );
});

export { Agent };
