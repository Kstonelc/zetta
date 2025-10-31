import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { flushSync } from "react-dom";
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

/** 简单稳定 id 生成器 */
const genId = (prefix = "m") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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

  // 区分程序滚动与用户滚动
  const byProgrammaticRef = useRef(false);
  const lastProgrammaticAtRef = useRef(0);

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

  /** ------------------ 程序化滚动到底部（区分用户/程序） ------------------ */
  const scrollToBottomProgrammatic = useCallback((behavior = "smooth") => {
    const el = scrollerElRef.current;
    if (!el) return;
    byProgrammaticRef.current = true;
    lastProgrammaticAtRef.current = Date.now();

    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
    try {
      el.scrollTo({ top: maxTop, behavior });
    } catch {
      el.scrollTop = maxTop;
    }
    // 放行窗口，避免把程序滚动误判为用户交互
    window.setTimeout(() => {
      byProgrammaticRef.current = false;
    }, 120);
  }, []);

  /** ------------------ 自定义 Scroller：维护 atBottom / 用户交互 ------------------ */
  const Scroller = useMemo(
    () =>
      React.forwardRef(({ style, onScroll, className, ...props }, ref) => {
        const isAtBottomNow = () => {
          const el = scrollerElRef.current;
          if (!el) return true;
          const diff = el.scrollHeight - el.scrollTop - el.clientHeight;
          return diff <= 2;
        };

        // 标记“用户开始交互”
        const markUserInteracting = () => {
          // 程序滚动不算用户交互
          if (byProgrammaticRef.current) return;
          // 只有当不在底部时才认为打断自动跟随
          const at = isAtBottomNow();
          userInteractingRef.current = !at;
        };

        return (
          <div
            data-virtuoso-scroller="true"
            className={`no-scrollbar ${className ?? ""}`}
            {...props}
            ref={(node) => {
              scrollerElRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            style={{
              ...style,
              overscrollBehavior: "contain",
              backfaceVisibility: "hidden",
              WebkitFontSmoothing: "antialiased",
            }}
            onWheel={markUserInteracting}
            onTouchStart={markUserInteracting}
            onPointerDown={markUserInteracting}
            onScroll={(e) => {
              onScroll?.(e);
              const el = scrollerElRef.current;
              if (!el) return;

              const at = isAtBottomNow();
              atBottomRef.current = at;

              // 滚回底部 -> 恢复自动跟随
              if (at) {
                userInteractingRef.current = false;
              }

              const overflow = el.scrollHeight - el.clientHeight > 1;
              setShowJump(overflow && !at);
            }}
          />
        );
      }),
    [],
  );

  /** ------------------ 流式拼接（批量刷新 & 首帧去 Loader） ------------------ */
  const appendToAssistantById = useCallback(
    (assistantId, textChunk) => {
      setMessages((prev) => {
        if (!assistantId || !textChunk) return prev;
        const idx = prev.findIndex((m) => m.id === assistantId);
        if (idx === -1) return prev;

        const next = [...prev];
        const current = next[idx];

        // 首帧如果是 <Loader/>，先清空
        let currentContent = current.content;
        if (React.isValidElement(currentContent)) {
          currentContent = "";
        }

        next[idx] = {
          ...current,
          content: (currentContent || "") + textChunk,
        };
        return next;
      });

      // 若未被用户打断，则兜底一次
      if (!userInteractingRef.current) {
        requestAnimationFrame(() => scrollToBottomProgrammatic("auto"));
      }
    },
    [scrollToBottomProgrammatic],
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
    }, 120);
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

    const userMsgId = genId("u");
    const userMessage = {
      id: userMsgId,
      role: "user",
      content: input,
    };
    const assistantId = genId("a");
    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      content: <Loader size={"xs"} mt={"xs"} />, // 占位，首帧会被清空
    };
    currentAssistantIdRef.current = assistantId;

    // 立即同步添加消息，随后瞬时滚到底部（不等待异步渲染）
    userInteractingRef.current = false;
    const nextLen = messagesRef.current.length + 2;

    flushSync(() => {
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    });

    virtuosoRef.current?.scrollToIndex({
      index: Math.max(0, nextLen - 1),
      align: "end",
      behavior: "auto", // 立刻到位
    });
    scrollToBottomProgrammatic("auto");

    setInput("");

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
      notify.error?.("发送失败，请稍后重试");
      return;
    }

    const reader = result?.response?.body?.getReader?.();
    if (!reader) {
      setIsGenerating(false);
      console.error("流读取器不可用");
      notify.error?.("服务异常：流不可用");
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
    scheduleFlush,
    stopSend,
    notify,
    scrollToBottomProgrammatic,
  ]);

  /** ------------------ 跳到底部（恢复自动跟随） ------------------ */
  const jumpToBottomNow = useCallback(() => {
    const lastIdx = messagesRef.current.length - 1;
    virtuosoRef.current?.scrollToIndex({
      index: Math.max(0, lastIdx),
      align: "end",
      behavior: "smooth",
    });
    // 用户主动回到最新，等价于恢复自动跟随
    userInteractingRef.current = false;
    requestAnimationFrame(() => {
      scrollToBottomProgrammatic("smooth");
      setShowJump(false);
    });
  }, [scrollToBottomProgrammatic]);

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
          increaseViewportBy={{ top: 800, bottom: 1000 }}
          defaultItemHeight={160}
          components={{
            Scroller,
            ScrollSeekPlaceholder,
          }}
          followOutput={
            isGenerating && atBottomRef.current && !userInteractingRef.current
              ? "smooth"
              : false
          }
          /** 只有高速才切骨架，速度降下来立刻恢复真实渲染 */
          scrollSeekConfiguration={{
            enter: (v) => Math.abs(v) > 1400,
            exit: (v) => Math.abs(v) < 900,
          }}
          atBottomStateChange={(at) => {
            atBottomRef.current = at;
            if (at) userInteractingRef.current = false;
            const el = scrollerElRef.current;
            const overflow = !!el && el.scrollHeight - el.clientHeight > 1;
            setShowJump(overflow && !at);
          }}
          itemContent={(_, msg) => (
            <MessageItem key={msg.id} msg={msg} theme={theme} />
          )}
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
      {/* 隐藏滚动条（全内核覆盖） + GPU 合成/隔离 + 骨架样式 */}
      <Global
        styles={{
          ".no-scrollbar, [data-virtuoso-scroller='true']": {
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE/Edge legacy
            // 白屏优化：将滚动容器置于合成层，隔离绘制
            willChange: "transform",
            contain: "strict",
            transform: "translateZ(0)",
          },
          ".no-scrollbar::-webkit-scrollbar, [data-virtuoso-scroller='true']::-webkit-scrollbar":
            {
              display: "none", // WebKit
              width: 0,
              height: 0,
              background: "transparent",
            },
          // 骨架占位样式
          ".v-skeleton": {
            borderRadius: 6,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.12), rgba(0,0,0,0.06))",
            backgroundSize: "200px 100%",
            animation: "v-shimmer 1.2s infinite linear",
          },
          "@keyframes v-shimmer": {
            "0%": { backgroundPosition: "-200px 0" },
            "100%": { backgroundPosition: "200px 0" },
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
 * 子组件：消息项（强 memo）
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
              <MarkdownViewer content={msg.content} />
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

/** 滚动寻路占位骨架，避免高速滚动时重渲染造成白屏 */
const ScrollSeekPlaceholder = ({ height, ...rest }) => {
  return (
    <div
      {...rest}
      style={{
        height: height ?? 140,
        padding: 12,
      }}
    >
      <div
        className="v-skeleton"
        style={{ height: 20, width: "50%", marginBottom: 12 }}
      />
      <div
        className="v-skeleton"
        style={{ height: 16, width: "85%", marginBottom: 8 }}
      />
      <div className="v-skeleton" style={{ height: 16, width: "66%" }} />
    </div>
  );
};

/** -------------------------------------------------------
 * 子组件：输入区域（memo）
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
        ["enter", () => (!isGenerating ? onSend() : undefined)],
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
              onClick={() => onSend()}
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
