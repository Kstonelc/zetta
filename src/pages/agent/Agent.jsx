import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  Divider,
  Flex,
  Group,
  Image,
  Loader,
  Menu,
  Paper,
  Popover,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { Virtuoso } from "react-virtuoso";
import "highlight.js/styles/github.css";
import { useClipboard } from "@mantine/hooks";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  Globe,
  MessagesSquare,
  Pause,
  Sparkles,
  Ellipsis,
} from "lucide-react";

import appHelper from "@/AppHelper.js";
import { useNotify } from "@/utils/notify.js";
import { ConversationRole, ConversationStatus, ModelType } from "@/enum.ts";
import { useUserStore } from "@/stores/useUserStore.js";
import { MarkdownViewer, SelectWithIcon } from "@/components";

import classes from "./Agent.module.scss";

const Agent = () => {
  const theme = useMantineTheme();
  const { notify } = useNotify();
  const { userStore } = useUserStore();

  // 输入框
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState([]);
  // const [isNewChat, setIsNewChat] = useState(false);
  const messagesRef = useRef(messages);

  // 模型相关
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);
  const [isThink, setIsThink] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // 滚动控制
  const virtuosoRef = useRef(null);
  const scrollerElRef = useRef(null);
  const atBottomRef = useRef(true);
  const userInteractingRef = useRef(false);
  const [showJump, setShowJump] = useState(false);
  const [qPtr, setQPtr] = useState(-1);
  const [conversations, setConversations] = useState([]);

  // 区分程序滚动与用户滚动
  const byProgrammaticRef = useRef(false);
  // 自动跟随禁用开关
  const autoFollowDisabledRef = useRef(false);
  // 流控
  const conversationStopControllerRef = useRef(null);
  const bufferRef = useRef("");
  const flushTimerRef = useRef(null);
  const currentAssistantIdRef = useRef(null);

  const qPtrRef = useRef(qPtr);

  // 当前轮 assistant 文本快照
  const latestAssistantTextRef = useRef("");
  const latestUserTextRef = useRef("");
  const currentConversationIdRef = useRef("");

  // 单一事实源：按消息 id 累加 assistant 文本
  const assistantTextMapRef = useRef(new Map());
  const getLatestAssistantText = useCallback(() => {
    const id = currentAssistantIdRef.current;
    if (!id) return "";
    const inMap = assistantTextMapRef.current.get(id);
    if (inMap != null) return inMap;
    const msg = messagesRef.current.find((m) => m.id === id);
    if (!msg) return "";
    return typeof msg.content === "string" ? msg.content : "";
  }, []);

  // 问题（用户消息）导航
  const questionIndices = useMemo(
    () =>
      messages
        .map((m, i) => (m.role === ConversationRole.User ? i : -1))
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

  // region 初始化

  const initialize = async () => {
    // 获取模型
    let response = await appHelper.apiPost("/model/find-models", {
      modelType: ModelType.TextGeneration,
      tenantId: userStore.current_tenant.id,
    });
    if (!response.ok) return;
    const models = response.data;
    setModels(models);

    // 获取会话列表
    response = await appHelper.apiPost("/conversation/find-conversations", {
      tenantId: userStore.current_tenant.id,
      userId: userStore.id,
      conversationStatus: ConversationStatus.Active,
    });
    if (!response.ok) {
      return;
    }
    if (appHelper.getLength(response.data) > 0) {
      setConversations(response.data);
    }
    await createConversation();
  };

  const destroy = async () => {
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    bufferRef.current = "";
    if (conversationStopControllerRef.current) {
      conversationStopControllerRef.current.abort();
      conversationStopControllerRef.current = null;
    }
  };

  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, []);

  // endregion

  const autoRefreshConversationList = async () => {
    await appHelper.apiPost("/conversation/find-conversation", {
      conversationId: currentConversationIdRef.current,
    });
  };

  // 模型选项
  const modelOptions = useMemo(() => {
    const modelsOption = models.map((model) => {
      return {
        value: model.name,
        title: model.display_name,
        icon: model.provider?.logo ? (
          <Image src={model.provider.logo} w={20} h={20} />
        ) : null,
      };
    });
    // TODO 选择用户系统选择的模型
    setCurrentModel(modelsOption[0]?.title);
    return modelsOption;
  }, [models]);

  // 程序化滚动到底部
  const scrollToBottomProgrammatic = useCallback((behavior = "smooth") => {
    // scrollerElRef.current 滚动容器的 div 元素 自定义的
    const el = scrollerElRef.current;
    if (!el) return;
    byProgrammaticRef.current = true;
    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
    try {
      el.scrollTo({ top: maxTop, behavior });
    } catch {
      el.scrollTop = maxTop;
    }
    setTimeout(() => {
      byProgrammaticRef.current = false;
    }, 120);
  }, []);

  // 自定义 Scroller（只维护 atBottom/交互状态）
  const Scroller = useMemo(
    () =>
      React.forwardRef(({ style, onScroll, className, ...props }, ref) => {
        const isAtBottomNow = () => {
          const el = scrollerElRef.current;
          if (!el) return true;
          const diff = el.scrollHeight - el.scrollTop - el.clientHeight;
          return diff <= 8;
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
            style={{ ...style, scrollPaddingBottom: "24px" }}
            onWheel={markUserInteracting}
            onTouchStart={markUserInteracting}
            onPointerDown={markUserInteracting}
            onScroll={(e) => {
              onScroll?.(e);
              const el = scrollerElRef.current;
              if (!el) return;
              const diff = el.scrollHeight - el.scrollTop - el.clientHeight;
              const at = diff <= 8;
              atBottomRef.current = at;
              if (at) userInteractingRef.current = false;
            }}
          />
        );
      }),
    [],
  );

  /** 简单稳定 id 生成器 */
  const genId = (prefix = "m") =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 流式拼接：更新 Map + latestRef + UI
  const appendToAssistantById = useCallback(
    (assistantId, textChunk) => {
      if (assistantId && textChunk) {
        const map = assistantTextMapRef.current;
        const prev = map.get(assistantId) || "";
        const next = prev + textChunk;
        map.set(assistantId, next);
        latestAssistantTextRef.current = next;
      }

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
    flushTimerRef.current = setInterval(() => {
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

  // 停止：先强制冲刷，再清理，最后读取 final 文本
  const stopSend = useCallback(async () => {
    if (!conversationStopControllerRef.current) return;

    // 中止流
    conversationStopControllerRef.current.abort();
    conversationStopControllerRef.current = null;

    // 冲刷 buffer（会写入 Map & latestRef）
    if (bufferRef.current) {
      const toAppend = bufferRef.current;
      bufferRef.current = "";
      appendToAssistantById(currentAssistantIdRef.current, toAppend);
    }

    // 关定时器
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    setIsGenerating(false);

    // 取消时读取完整文本
    latestAssistantTextRef.current = getLatestAssistantText();
    await createConversationMessages();
  }, [appendToAssistantById, getLatestAssistantText]);

  const handleSend = useCallback(async () => {
    // 清空快照与 map 中当前 id（新一轮会话）
    latestAssistantTextRef.current = "";

    if (isGenerating) {
      stopSend();
      return;
    }
    if (!input.trim() || !currentModel) return;

    latestUserTextRef.current = input;

    setIsGenerating(true);
    autoFollowDisabledRef.current = false;

    const userMsgId = genId("user");
    const userMessage = {
      id: userMsgId,
      role: ConversationRole.User,
      content: input,
    };
    const assistantId = genId("assistant");
    const assistantMessage = {
      id: assistantId,
      role: ConversationRole.Assistant,
      content: <Loader size={"xs"} mt={"xs"} />,
    };
    currentAssistantIdRef.current = assistantId;
    assistantTextMapRef.current.set(assistantId, "");

    userInteractingRef.current = false;
    const nextLen = (messagesRef.current?.length ?? 0) + 2;

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

    conversationStopControllerRef.current = new AbortController();
    let result;
    try {
      result = await appHelper.apiFetch(
        "/conversation/chat",
        {
          prompt: userMessage.content,
          modelName: currentModel,
          modelProvider: currentModelProvider,
        },
        conversationStopControllerRef.current?.signal,
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
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          // 将 TextDecoder 的内部缓冲也刷出（不传 {stream:true}）
          const tail = decoder.decode();
          if (tail) bufferRef.current += tail;

          // 刷掉剩余 buffer
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

          latestAssistantTextRef.current = getLatestAssistantText();
          await createConversationMessages();
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

      // 异常/Abort 同样 flush TextDecoder 尾巴
      const tail = decoder.decode();
      if (tail) bufferRef.current += tail;

      // 刷掉剩余 buffer
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
    }
  }, [
    input,
    currentModel,
    models,
    isGenerating,
    scheduleFlush,
    stopSend,
    scrollToBottomProgrammatic,
    getLatestAssistantText,
  ]);

  /** 跳到底部（恢复自动跟随 + 强制关闭按钮） */
  const jumpToBottomNow = useCallback(() => {
    const lastIdx = messagesRef.current.length - 1;
    virtuosoRef.current?.scrollToIndex({
      index: Math.max(0, lastIdx),
      align: "end",
      behavior: "smooth",
    });
    autoFollowDisabledRef.current = false;
    userInteractingRef.current = false;
    requestAnimationFrame(() => {
      scrollToBottomProgrammatic("smooth");
      atBottomRef.current = true;
      setShowJump(false);
    });
  }, [scrollToBottomProgrammatic]);

  /** 按“问题指针”定位（会禁用自动跟随） */
  const scrollToQuestionPtr = useCallback(
    (qIdx, behavior = "smooth") => {
      if (qIdx < 0 || qIdx >= questionIndices.length) return;
      const itemIndex = questionIndices[qIdx];
      if (itemIndex == null) return;

      autoFollowDisabledRef.current = true;
      userInteractingRef.current = true;

      byProgrammaticRef.current = true;
      virtuosoRef.current?.scrollToIndex({
        index: itemIndex,
        align: "start",
        behavior,
      });
      setTimeout(() => {
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

  const createConversation = async () => {
    let response = await appHelper.apiPost("/conversation/find-conversations", {
      tenantId: userStore.current_tenant.id,
      userId: userStore.id,
      conversationStatus: ConversationStatus.Temporary,
    });
    if (!response.ok) return;

    if (appHelper.getLength(response.data) > 0) {
      notify({ type: "info", message: "当前是最新对话" });
      currentConversationIdRef.current = response.data[0].id;
      return;
    }
    response = await appHelper.apiPost("/conversation/create-conversation", {
      tenantId: userStore.current_tenant.id,
      userId: userStore.id,
    });
    if (!response.ok) {
      notify({ type: "error", message: response.message });
      return;
    }
    currentConversationIdRef.current = response.data.conversation_id;
  };

  const createConversationMessages = async () => {
    const response = await appHelper.apiPost("/conversation/create-message", {
      conversationId: currentConversationIdRef.current,
      userContent: latestUserTextRef.current,
      assistantContent: latestAssistantTextRef.current,
    });
    if (!response.ok) return;
  };

  const getConversationMessages = async (conversationId) => {
    currentConversationIdRef.current = conversationId;
    setIsLoadingMessages(true);
    const response = await appHelper.apiPost("/conversation/find-messages", {
      conversationId: conversationId,
    });
    if (!response.ok) {
      setIsLoadingMessages(false);
      return;
    }
    setIsLoadingMessages(false);
    setMessages(response.data);
  };

  return (
    <Flex p="lg" flex={1} gap="sm" style={{ minHeight: 0 }}>
      <Card maw={220} miw={200} shadow="md" withBorder h="100%">
        <Button
          mb="md"
          leftSection={<MessagesSquare size={16} />}
          onClick={async () => {
            await createConversation();
          }}
        >
          新建对话
        </Button>
        <ScrollArea h="calc(100% - 48px)">
          <Menu>
            <Menu.Label>聊天</Menu.Label>
            {conversations.map((item) => {
              return (
                <Menu.Item
                  mb={"xs"}
                  key={item.id}
                  color={theme.colors.gray[7]}
                  bg={
                    item.id === currentConversationIdRef.current
                      ? theme.colors.blue[0]
                      : ""
                  }
                  rightSection={
                    <ActionIcon
                      size={"xs"}
                      variant={"transparent"}
                      className={classes.conversationItemTools}
                    >
                      <Ellipsis size={16} />
                    </ActionIcon>
                  }
                  onClick={async () => {
                    await getConversationMessages(item.id);
                  }}
                >
                  {item.name}
                </Menu.Item>
              );
            })}
          </Menu>
        </ScrollArea>
      </Card>

      <Divider orientation="vertical" />

      <Stack h="100%" flex={1} align="center" justify="flex-end" mih={0}>
        {appHelper.getLength(messages) === 0 ? (
          <Stack pos="absolute" top="20%" align="center">
            {isLoadingMessages ? (
              <Loader size={"sm"} />
            ) : (
              <>
                <Title order={1}>我是 Bichon 智能助手，开始聊天吧</Title>
                <Text c="dimmed">连接数据与知识，助你高效决策。</Text>
              </>
            )}
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
    const isUser = msg.role === ConversationRole.User;
    const clipboard = useClipboard({ timeout: 1500 });

    const contentString = typeof msg.content === "string" ? msg.content : null;

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
          <Stack gap={"xs"} miw="20%" maw="80%">
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
              ) : contentString != null ? (
                <MarkdownViewer content={contentString} />
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
                    clipboard.copy(
                      contentString != null
                        ? contentString
                        : typeof msg.content === "string"
                          ? msg.content
                          : (() => {
                              try {
                                return JSON.stringify(msg.content);
                              } catch {
                                return String(msg.content ?? "");
                              }
                            })(),
                    );
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
  const isComposingRef = useRef(false);
  const handleTextareaKeyDown = useCallback(
    (e) => {
      const native = e.nativeEvent;
      const composing =
        native?.isComposing ||
        isComposingRef.current ||
        native?.keyCode === 229;
      if (composing) return;

      if (e.key === "Enter" && (e.shiftKey || e.altKey)) {
        return;
      }

      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (!isGenerating) onSend();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (!isGenerating) onSend();
      }
    },
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
            onKeyDown={handleTextareaKeyDown}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="@知识库或直接提问"
            w="100%"
            size="md"
            classNames={{ input: classes.input, textarea: classes.textarea }}
          />
          <Group justify="space-between">
            <Group gap="xs">
              <SelectWithIcon
                size="xs"
                options={modelOptions}
                onChange={setCurrentModel}
                defaultValue={currentModel}
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
