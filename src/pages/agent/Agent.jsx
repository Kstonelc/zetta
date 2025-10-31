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
  Tooltip,
} from "@mantine/core";
import { Virtuoso } from "react-virtuoso";
import "highlight.js/styles/github.css";
import { getHotkeyHandler, useClipboard } from "@mantine/hooks";
import {
  MessagesSquare,
  Sparkles,
  ArrowUp,
  Pause,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Copy,
  Globe,
} from "lucide-react";

import appHelper from "@/AppHelper.js";
import { useNotify } from "@/utils/notify.js";
import { ModelType } from "@/enum.ts";
import { useUserStore } from "@/stores/useUserStore.js";
import { MarkdownViewer, SelectWithIcon } from "@/components";

import classes from "./Agent.module.scss";

const Agent = () => {
  const theme = useMantineTheme();
  const notify = useNotify();
  const { userStore } = useUserStore();

  // 输入框
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState([]);
  const [isNewChat, setIsNewChat] = useState(true);
  const messagesRef = useRef(messages);

  // 模型相关
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);
  const [isThink, setIsThink] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);

  // 滚动控制
  const virtuosoRef = useRef(null);
  const scrollerElRef = useRef(null);
  const atBottomRef = useRef(true);
  const userInteractingRef = useRef(false);
  const [showJump, setShowJump] = useState(false);
  const [qPtr, setQPtr] = useState(-1);

  // 区分程序滚动与用户滚动
  const byProgrammaticRef = useRef(false);
  // 全局“禁用自动跟随”开关
  // 只有点击“跳至最新”或发送新消息时复位为 false。
  const autoFollowDisabledRef = useRef(false);
  // 流控
  const sessionStopControllerRef = useRef(null);
  const bufferRef = useRef("");
  const flushTimerRef = useRef(null);
  const currentAssistantIdRef = useRef(null);

  const qPtrRef = useRef(qPtr);

  // 问题（用户消息）导航
  const questionIndices = useMemo(
    () =>
      messages
        .map((m, i) => (m.role === "user" ? i : -1))
        .filter((i) => i >= 0),
    [messages],
  );
  useEffect(() => {
    qPtrRef.current = qPtr;
  }, [qPtr]);
  useEffect(() => {
    if (questionIndices.length === 0) setQPtr(-1);
    else setQPtr(questionIndices.length - 1);
  }, [questionIndices.length]);

  useEffect(() => {
    messagesRef.current = messages;
    if (appHelper.getLength(messagesRef.current) === 0) {
      setIsNewChat(true);
    } else {
      if (isNewChat) {
        setIsNewChat(false);
      }
    }
  }, [messages]);

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

  // 程序化滚动到底部（区分用户/程序）
  const scrollToBottomProgrammatic = useCallback((behavior = "smooth") => {
    const el = scrollerElRef.current;
    if (!el) return;
    byProgrammaticRef.current = true;
    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
    try {
      el.scrollTo({ top: maxTop, behavior });
    } catch {
      el.scrollTop = maxTop;
    }
    window.setTimeout(() => {
      byProgrammaticRef.current = false;
    }, 120);
  }, []);

  // 自定义 Scroller
  const Scroller = useMemo(
    () =>
      React.forwardRef(({ style, onScroll, className, ...props }, ref) => {
        const isAtBottomNow = () => {
          const el = scrollerElRef.current;
          if (!el) return true;
          const diff = el.scrollHeight - el.scrollTop - el.clientHeight;
          return diff <= 2;
        };

        const markUserInteracting = () => {
          if (byProgrammaticRef.current) return;
          const at = isAtBottomNow();
          userInteractingRef.current = !at;
        };

        return (
          <div
            data-virtuoso-scroller="true"
            className={`${classes.noScrollbar} ${className ?? ""}`}
            {...props}
            ref={(node) => {
              scrollerElRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            style={style}
            onWheel={markUserInteracting}
            onTouchStart={markUserInteracting}
            onPointerDown={markUserInteracting}
            onScroll={(e) => {
              onScroll?.(e);
              const el = scrollerElRef.current;
              if (!el) return;
              const at = isAtBottomNow();
              atBottomRef.current = at;
              if (at) userInteractingRef.current = false;
              const overflow = el.scrollHeight - el.clientHeight > 1;
              setShowJump(overflow && !at);
            }}
          />
        );
      }),
    [],
  );

  /** 简单稳定 id 生成器 */
  const genId = (prefix = "m") =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 流式拼接（批量刷新 & 首帧去 Loader）, 仅当未被用户打断 且 未禁用自动跟随 时，才“兜底贴底”
  const appendToAssistantById = useCallback(
    (assistantId, textChunk) => {
      setMessages((prev) => {
        if (!assistantId || !textChunk) return prev;
        const idx = prev.findIndex((m) => m.id === assistantId);
        if (idx === -1) return prev;

        const next = [...prev];
        const current = next[idx];

        let currentContent = current.content;
        if (React.isValidElement(currentContent)) currentContent = "";

        next[idx] = {
          ...current,
          content: (currentContent || "") + textChunk,
        };
        return next;
      });

      if (!userInteractingRef.current && !autoFollowDisabledRef.current) {
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

    // 发送新消息 -> 重新允许自动跟随
    autoFollowDisabledRef.current = false;

    const userMsgId = genId("u");
    const userMessage = { id: userMsgId, role: "user", content: input };
    const assistantId = genId("a");
    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      content: <Loader size={"xs"} mt={"xs"} />,
    };
    currentAssistantIdRef.current = assistantId;

    userInteractingRef.current = false;
    const nextLen = messagesRef.current.length + 2;

    flushSync(() => {
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    });

    virtuosoRef.current?.scrollToIndex({
      index: Math.max(0, nextLen - 1),
      align: "end",
      behavior: "auto",
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

  /** 跳到底部（恢复自动跟随） */
  const jumpToBottomNow = useCallback(() => {
    const lastIdx = messagesRef.current.length - 1;
    virtuosoRef.current?.scrollToIndex({
      index: Math.max(0, lastIdx),
      align: "end",
      behavior: "smooth",
    });
    // 只有用户主动“回到最新”，才恢复自动跟随
    autoFollowDisabledRef.current = false;
    userInteractingRef.current = false;
    requestAnimationFrame(() => {
      scrollToBottomProgrammatic("smooth");
      setShowJump(false);
    });
  }, [scrollToBottomProgrammatic]);

  /** 按“问题指针”定位（会禁用自动跟随） */
  const scrollToQuestionPtr = useCallback(
    (qIdx, behavior = "smooth") => {
      if (qIdx < 0 || qIdx >= questionIndices.length) return;
      const itemIndex = questionIndices[qIdx];
      if (itemIndex == null) return;

      // 点击问题导航 -> 禁用自动跟随，并标记为用户交互
      autoFollowDisabledRef.current = true;
      userInteractingRef.current = true;

      byProgrammaticRef.current = true;
      virtuosoRef.current?.scrollToIndex({
        index: itemIndex,
        align: "start",
        behavior,
      });
      window.setTimeout(() => {
        byProgrammaticRef.current = false;
      }, 120);

      setShowJump(true);
    },
    [questionIndices],
  );

  const goPrevQuestion = useCallback(() => {
    if (questionIndices.length === 0) return;
    const nextPtr = qPtrRef.current <= 0 ? 0 : qPtrRef.current - 1;
    setQPtr(nextPtr);
    scrollToQuestionPtr(nextPtr);
  }, [questionIndices.length, scrollToQuestionPtr]);

  const goNextQuestion = useCallback(() => {
    if (questionIndices.length === 0) return;
    const last = questionIndices.length - 1;
    const nextPtr = qPtrRef.current >= last ? last : qPtrRef.current + 1;
    setQPtr(nextPtr);
    scrollToQuestionPtr(nextPtr);
  }, [questionIndices.length, scrollToQuestionPtr]);

  const renderChatBox = () => {
    return (
      <div className={classes.agentChatWrap}>
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: "100%", width: "100%" }}
          data={messages}
          computeItemKey={(_, msg) => msg.id}
          increaseViewportBy={{ top: 800, bottom: 1000 }}
          defaultItemHeight={160}
          components={{ Scroller, ScrollSeekPlaceholder }}
          /** 仅当：生成中 && 在底部 && 未被用户打断 && 未被“禁用自动跟随” 才跟随 */
          followOutput={
            isGenerating &&
            atBottomRef.current &&
            !userInteractingRef.current &&
            !autoFollowDisabledRef.current
              ? "smooth"
              : false
          }
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

        {/* 底部“跳至最新” */}
        {showJump && (
          <div className={classes.agentJumpLatest}>
            <ActionIcon
              variant="default"
              onClick={jumpToBottomNow}
              size="xl"
              radius="xl"
              aria-label="跳至最新"
            >
              <ArrowDown />
            </ActionIcon>
          </div>
        )}

        {/* 右侧中部：问题导航 */}
        {questionIndices.length > 0 && (
          <div className={classes.agentQnav}>
            <Tooltip label="上一个问题">
              <ActionIcon
                size="lg"
                variant="default"
                onClick={goPrevQuestion}
                aria-label="上一个问题"
              >
                <ChevronUp />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="下一个问题">
              <ActionIcon
                size="lg"
                variant="default"
                onClick={goNextQuestion}
                aria-label="下一个问题"
              >
                <ChevronDown />
              </ActionIcon>
            </Tooltip>
          </div>
        )}
      </div>
    );
  };

  return (
    <Flex p="lg" flex={1} gap="sm" style={{ minHeight: 0 }}>
      <Card maw={220} miw={200} shadow="md" withBorder h="100%">
        <Button
          mb="md"
          leftSection={<MessagesSquare size={16} />}
          onClick={() => {
            setIsNewChat(true);
          }}
        >
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
          isOnline={isOnline}
          setIsOnline={setIsOnline}
          theme={theme}
        />
      </Stack>
    </Flex>
  );
};

/** 消息项（强 memo） */
const MessageItem = React.memo(
  ({ msg, theme }) => {
    const isUser = msg.role === "user";
    const clipboard = useClipboard({ timeout: 1500 });
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
          <Stack gap={"xs"} mb="xl" miw="20%" maw="80%">
            <Paper
              flex={1}
              bg={isUser ? theme.colors.blue[5] : "transparent"}
              p={isUser ? "xs" : 0}
              radius="md"
              withBorder={isUser}
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
            <Group justify="flex-start" className={classes.messageTools}>
              <Tooltip label={clipboard.copied ? "已复制" : "复制"} withArrow>
                <ActionIcon
                  variant={"subtle"}
                  size={"sm"}
                  onClick={() => {
                    clipboard.copy(msg.content);
                  }}
                  color={theme.colors.gray[6]}
                >
                  <Copy size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Stack>
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

/** 寻路占位骨架 */
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
        className={classes.vSkeleton}
        style={{ height: 20, width: "50%", marginBottom: 12 }}
      />
      <div
        className={classes.vSkeleton}
        style={{ height: 16, width: "85%", marginBottom: 8 }}
      />
      <div className={classes.vSkeleton} style={{ height: 16, width: "66%" }} />
    </div>
  );
};

/** 输入区 */
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
  isOnline,
  setIsOnline,
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
            classes={{
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
                variant={isOnline ? "light" : "subtle"}
                color={isOnline ? theme.colors.blue[7] : theme.colors.gray[7]}
                onClick={() => setIsOnline((v) => !v)}
                leftSection={<Globe size={16} />}
                radius={"xl"}
                size="xs"
              >
                <Text size="xs" fw="bold">
                  联网搜索
                </Text>
              </Button>
              <Button
                variant={isThink ? "light" : "subtle"}
                color={isThink ? theme.colors.blue[7] : theme.colors.gray[7]}
                onClick={() => setIsThink((v) => !v)}
                leftSection={<Sparkles size={16} />}
                radius={"xl"}
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
              aria-label={isGenerating ? "停止" : "发送"}
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
