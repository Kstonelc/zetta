import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import { flushSync } from "react-dom";
import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  Flex,
  Center,
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
  Transition,
  useMantineTheme,
  Badge,
  Collapse,
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
  Eye,
  EyeOff,
} from "lucide-react";

import appHelper from "@/AppHelper.js";
import { useNotify } from "@/utils/notify.js";
import { ConversationRole, ConversationStatus, ModelType } from "@/enum.ts";
import { useUserStore } from "@/stores/useUserStore.js";
import { MarkdownViewer, SelectWithIcon, Loading } from "@/components";

import classes from "./Agent.module.scss";

const Agent = () => {
  const theme = useMantineTheme();
  const { notify } = useNotify();
  const { userStore } = useUserStore();

  // 输入框
  const [input, setInput] = useState("");

  // 消息与引用
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef(messages);

  // 模型相关
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);
  const [isThink, setIsThink] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // 滚动/列表
  const virtuosoRef = useRef(null);
  const scrollerElRef = useRef(null);
  const atBottomRef = useRef(true);
  const userInteractingRef = useRef(false);
  const [showJump, setShowJump] = useState(false);

  // 问题导航
  const [qPtr, setQPtr] = useState(-1);
  const qPtrRef = useRef(qPtr);

  // 会话列表
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // 区分程序滚动与用户滚动
  const byProgrammaticRef = useRef(false);
  // 自动跟随禁用开关
  const autoFollowDisabledRef = useRef(false);

  // SSE/流控制
  const conversationStopControllerRef = useRef(null);
  const currentAssistantIdRef = useRef(null);

  // 分行解析缓冲
  const lineBufRef = useRef("");

  // 消息快照
  const latestAssistantTextRef = useRef("");
  const latestUserTextRef = useRef("");
  const currentConversationIdRef = useRef("");

  // 单一事实源：按消息 id 累加 assistant 的“答案区”文本
  const assistantTextMapRef = useRef(new Map());
  const getLatestAssistantText = useCallback(() => {
    const id = currentAssistantIdRef.current;
    if (!id) return "";
    const inMap = assistantTextMapRef.current.get(id);
    if (inMap != null) return inMap;
    const msg = messagesRef.current.find((m) => m.id === id);
    if (!msg) return "";
    return appHelper.isString(msg.content) ? msg.content : "";
  }, []);

  const isMac =
    typeof navigator !== "undefined" &&
    (/Mac/.test(navigator.platform) || /Mac OS/.test(navigator.userAgent));

  const BOTTOM_EPS = isMac ? 4 : 6; // 底部阈值（px）
  // none | auto | smooth
  const afterRenderScrollRef = useRef("none");

  // UI 抑制窗口：在受控滚动期间屏蔽按钮闪烁
  const SUPPRESS_MS = 600;
  const suppressUiUntilRef = useRef(0);
  const inSuppressWindow = () => performance.now() < suppressUiUntilRef.current;
  const suppress = (ms = SUPPRESS_MS) => {
    suppressUiUntilRef.current = performance.now() + ms;
  };

  const isReallyAtBottom = useCallback(() => {
    const el = scrollerElRef.current;
    if (!el) return true;
    const top = Math.ceil(el.scrollTop);
    const height = Math.ceil(el.clientHeight);
    const scrollH = Math.ceil(el.scrollHeight);
    return top + height >= scrollH - BOTTOM_EPS;
  }, []);

  const hardScrollToBottomNow = useCallback(() => {
    const el = scrollerElRef.current;
    if (!el) return;
    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
    try {
      el.scrollTo({ top: maxTop, behavior: "auto" });
    } catch {
      el.scrollTop = maxTop;
    }
  }, []);

  const smoothScrollToBottom = useCallback(() => {
    const el = scrollerElRef.current;
    if (!el) return;
    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
    try {
      el.scrollTo({ top: maxTop, behavior: "smooth" });
    } catch {
      el.scrollTop = maxTop;
    }
  }, []);

  // 渲染后到底（只执行一次）
  useLayoutEffect(() => {
    const mode = afterRenderScrollRef.current;
    if (mode === "none") return;

    const el = scrollerElRef.current;
    if (!el) return;

    // reset，防止重复
    afterRenderScrollRef.current = "none";

    const run = async () => {
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );

      const toBottom = (behavior) => {
        const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
        try {
          el.scrollTo({ top: maxTop, behavior });
        } catch {
          el.scrollTop = maxTop;
        }
      };

      byProgrammaticRef.current = true;
      userInteractingRef.current = false;
      autoFollowDisabledRef.current = false;
      setShowJump(false);

      if (mode === "auto") {
        toBottom("auto");
        byProgrammaticRef.current = false;
        atBottomRef.current = true;
        return;
      }

      // smooth：多帧追随 + 尺寸监听，2.5s 上限
      let ro = null;
      let inProgress = true;
      const smoothToBottom = () => toBottom("smooth");

      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => {
          if (inProgress) smoothToBottom();
        });
        ro.observe(el);
      }

      const MAX_WAIT_MS = 2500;
      const START = performance.now();
      let lastH = -1;

      smoothToBottom();

      while (performance.now() - START < MAX_WAIT_MS) {
        await new Promise((r) => requestAnimationFrame(r));
        const curH = el.scrollHeight;
        const changed = curH !== lastH;
        lastH = curH;
        if (!changed && isReallyAtBottom()) break;
        smoothToBottom();
      }

      inProgress = false;
      ro?.unobserve(el);
      byProgrammaticRef.current = false;
      atBottomRef.current = true;
    };

    run();
  }, [messages, isReallyAtBottom]);

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

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // region 初始化/销毁

  const initialize = async () => {
    // 获取模型
    let response = await appHelper.apiPost("/model/find-models", {
      modelType: ModelType.TextGeneration,
      tenantId: userStore.current_tenant.id,
    });
    if (!response.ok) return;
    setModels(response.data);

    // 获取会话列表
    const list = await getConversations();
    if (appHelper.getLength(list) > 0) {
      await getConversationMessages(list[0].id);
    } else {
      await createConversation();
      const fresh = await getConversations();
      if (appHelper.getLength(fresh) > 0) {
        await getConversationMessages(fresh[0].id);
      }
    }
  };

  const destroy = async () => {
    if (conversationStopControllerRef.current) {
      conversationStopControllerRef.current.abort();
      conversationStopControllerRef.current = null;
    }
    lineBufRef.current = "";
  };

  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // endregion

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

  const getConversations = async () => {
    setIsLoadingConversations(true);
    const response = await appHelper.apiPost(
      "/conversation/find-conversations",
      {
        tenantId: userStore.current_tenant.id,
        userId: userStore.id,
        conversationStatus: [
          ConversationStatus.Active,
          ConversationStatus.Temporary,
        ],
      },
    );
    if (!response.ok) {
      setIsLoadingConversations(false);
      return [];
    }
    setConversations(response.data);
    setIsLoadingConversations(false);
    return response.data;
  };

  // 自定义 Scroller（仅维护 atBottom/交互状态）
  const Scroller = useMemo(
    () =>
      React.forwardRef(({ style, onScroll, className, ...props }, ref) => {
        const isAtBottomNow = () => {
          const el = scrollerElRef.current;
          if (!el) return true;
          const diff = el.scrollHeight - el.scrollTop - el.clientHeight;
          return diff <= BOTTOM_EPS;
        };

        const markUserInteracting = () => {
          if (byProgrammaticRef.current || inSuppressWindow()) return;
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
            style={{ ...style }}
            onWheel={markUserInteracting}
            onTouchStart={markUserInteracting}
            onPointerDown={markUserInteracting}
            onScroll={(e) => {
              onScroll?.(e);
              const el = scrollerElRef.current;
              if (!el) return;

              // 程序滚动或抑制窗口：不更新任何与 UI 相关的状态
              if (byProgrammaticRef.current || inSuppressWindow()) return;

              const diff = el.scrollHeight - el.clientHeight - el.scrollTop;
              const at = diff <= BOTTOM_EPS;
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

  // 简单稳定 id 生成器
  const genId = (prefix = "m") =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  /** 分区增量：将文本片段追加到 assistant 消息的指定字段（content/thinking） */
  const appendToAssistantField = useCallback(
    (assistantId, field /* 'content' | 'thinking' */, textChunk) => {
      if (!assistantId || !textChunk) return;

      if (field === "content") {
        const map = assistantTextMapRef.current;
        const prev = map.get(assistantId) || "";
        const next = prev + textChunk;
        map.set(assistantId, next);
        latestAssistantTextRef.current = next;
      }

      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === assistantId);
        if (idx === -1) return prev;
        const next = [...prev];
        const current = next[idx];

        const safeContent = appHelper.isString(current.content)
          ? current.content
          : "";
        const safeThinking = appHelper.isString(current.thinking)
          ? current.thinking
          : "";

        next[idx] = {
          ...current,
          content: field === "content" ? safeContent + textChunk : safeContent,
          thinking:
            field === "thinking" ? safeThinking + textChunk : safeThinking,
        };
        return next;
      });

      // 生成期间且在底部：直接跟随，不触发 showJump 变化
      if (!userInteractingRef.current && !autoFollowDisabledRef.current) {
        if (!isReallyAtBottom()) {
          requestAnimationFrame(() => {
            smoothScrollToBottom();
          });
        }
      }
    },
    [isReallyAtBottom, smoothScrollToBottom],
  );

  // 停止：终止流（前端只负责停止；末尾 flush 由行缓冲保证）
  const stopSend = useCallback(async () => {
    if (!conversationStopControllerRef.current) return;

    conversationStopControllerRef.current.abort();
    conversationStopControllerRef.current = null;

    setIsGenerating(false);
    latestAssistantTextRef.current = getLatestAssistantText();
  }, [getLatestAssistantText]);

  // 发送：顺序追加 + “新问题”顶到可视区顶部
  const handleSend = useCallback(async () => {
    latestAssistantTextRef.current = "";

    if (isGenerating) {
      await stopSend();
      return;
    }
    if (!input.trim() || !currentModel) return;

    latestUserTextRef.current = input;

    setIsGenerating(true);

    // 发送后不要自动跟随（让历史被顶上去）
    autoFollowDisabledRef.current = true;
    userInteractingRef.current = true;

    // 基于当前长度计算“用户消息”的索引位置
    const baseLen = messagesRef.current?.length ?? 0;

    // 组装消息
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
      thinking: "", // 思考区
    };
    currentAssistantIdRef.current = assistantId;
    assistantTextMapRef.current.set(assistantId, "");

    // 立刻把消息刷入，随后滚动
    flushSync(() => {
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    });

    setInput("");

    // 把“新问题”顶到可视区顶部
    byProgrammaticRef.current = true;
    const userIndex = baseLen; // 新用户消息的实际索引
    virtuosoRef.current?.scrollToIndex({
      index: userIndex,
      align: "start",
      behavior: "auto",
    });
    requestAnimationFrame(() => {
      byProgrammaticRef.current = false;
    });

    afterRenderScrollRef.current = "none";
    setShowJump(true);

    // 模型提供商
    let currentModelProvider;
    for (const model of models) {
      if (currentModel === model.name) {
        currentModelProvider = model.provider?.name;
        break;
      }
    }

    conversationStopControllerRef.current = new AbortController();

    // 先创建空的消息，得到 assistant_message_id
    const assistant_message_id = await createConversationMessages();

    // 发起流式请求（text/plain; 每行一个 JSON）
    let result;
    try {
      result = await appHelper.apiFetch(
        "/conversation/chat",
        {
          promptText: userMessage.content,
          modelName: currentModel,
          modelProvider: currentModelProvider,
          assistantMessageId: assistant_message_id,
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
    lineBufRef.current = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        const text = done
          ? decoder.decode()
          : decoder.decode(value, { stream: true });
        if (text) lineBufRef.current += text;

        // 尽量按行消费（每行一个 JSON）
        let lastNL = lineBufRef.current.lastIndexOf("\n");
        if (lastNL >= 0) {
          const full = lineBufRef.current.slice(0, lastNL);
          const rest = lineBufRef.current.slice(lastNL + 1);
          lineBufRef.current = rest;

          const lines = full.split("\n");
          for (const raw of lines) {
            const s = raw.trim();
            if (!s) continue;
            let obj = null;
            try {
              obj = JSON.parse(s);
            } catch (e) {
              // 后端异常行/半行保护（极少见，已按行输出基本不会触发）
              console.warn("JSON parse fail on line:", e);
              continue;
            }

            const t = obj?.type;
            if (t === "thinking") {
              const delta = obj?.delta ?? "";
              if (delta) {
                appendToAssistantField(
                  currentAssistantIdRef.current,
                  "thinking",
                  delta,
                );
              }
            } else if (t === "answer") {
              const delta = obj?.delta ?? "";
              if (delta) {
                appendToAssistantField(
                  currentAssistantIdRef.current,
                  "content",
                  delta,
                );
              }
            } else if (t === "done") {
              // 结束
              setIsGenerating(false);
              latestAssistantTextRef.current = getLatestAssistantText();
            } else {
            }
          }
        }

        if (done) break;
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error("请求发生错误:", e);
      }
      setIsGenerating(false);
    }
  }, [
    input,
    currentModel,
    models,
    isGenerating,
    stopSend,
    appendToAssistantField,
    getLatestAssistantText,
  ]);

  // 跳到底部（恢复自动跟随 + 关闭按钮）
  const jumpToBottomNow = useCallback(async () => {
    suppress(); // 抑制滚动期间的 UI 抖动
    const lastIdx = messagesRef.current.length - 1;
    virtuosoRef.current?.scrollToIndex({
      index: Math.max(0, lastIdx),
      align: "end",
      behavior: "auto",
    });
    autoFollowDisabledRef.current = false;
    userInteractingRef.current = false;
    hardScrollToBottomNow();
    setShowJump(false);
  }, [hardScrollToBottomNow]);

  // 问题导航定位（禁用自动跟随）
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
          components={{
            Scroller,
            Footer: () => <div style={{ height: 24 }} />,
          }}
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
          atBottomStateChange={() => {
            if (byProgrammaticRef.current || inSuppressWindow()) return;
            const at = isReallyAtBottom();
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

        {/* 底部"跳至最新" */}
        <Transition
          mounted={showJump && !inSuppressWindow()}
          transition="pop"
          duration={200}
          timingFunction="ease-out"
        >
          {(styles) => (
            <div style={styles} className={classes.agentJumpLatest}>
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
        </Transition>

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
      conversationStatus: [ConversationStatus.Temporary],
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
    setMessages([]);
    currentConversationIdRef.current = response.data.conversation_id;
  };

  const createConversationMessages = async () => {
    const response = await appHelper.apiPost("/conversation/create-message", {
      conversationId: currentConversationIdRef.current,
      userContent: latestUserTextRef.current,
      assistantContent: "",
    });
    if (!response.ok) return;
    await getConversations();
    return response.data.assistant_message_id;
  };

  const getConversationMessages = async (conversationId) => {
    if (conversationId === currentConversationIdRef.current) return;

    currentConversationIdRef.current = conversationId;
    setIsLoadingMessages(true);
    const response = await appHelper.apiPost("/conversation/find-messages", {
      conversationId: conversationId,
    });
    setIsLoadingMessages(false);
    if (!response.ok) return;

    // 切换会话：进入抑制窗口 + 标记程序滚动
    suppress(800);
    byProgrammaticRef.current = true;
    userInteractingRef.current = false;
    autoFollowDisabledRef.current = false;
    atBottomRef.current = true;
    setShowJump(false);

    // 兼容旧数据：补齐 thinking 字段
    const withThinking = (response.data || []).map((m) =>
      m.role === ConversationRole.Assistant
        ? { thinking: "", content: "", ...m }
        : m,
    );

    setMessages(withThinking);

    // 不使用 afterRenderScrollRef，直接手动滚动
    setTimeout(() => {
      const lastIdx = Math.max(0, withThinking.length - 1);

      virtuosoRef.current?.scrollToIndex({
        index: lastIdx,
        align: "end",
        behavior: "auto",
      });

      const scrollAttempts = [80, 160, 260, 420];
      scrollAttempts.forEach((delay) => {
        setTimeout(() => {
          hardScrollToBottomNow();
        }, delay);
      });

      setTimeout(() => {
        byProgrammaticRef.current = false;
        atBottomRef.current = true;
        setShowJump(false);
      }, 520);
    }, 40);
  };

  return (
    <Flex p="lg" flex={1} gap="sm" style={{ minHeight: 0 }}>
      <Card maw={220} miw={200} shadow="md" withBorder h="100%">
        <Button
          mb="md"
          leftSection={<MessagesSquare size={16} />}
          onClick={async () => {
            await createConversation();
            await getConversations();
          }}
        >
          新建对话
        </Button>
        <ScrollArea h="calc(100% - 48px)">
          <Loading visible={isLoadingConversations} size={"sm"}>
            <Menu w={"100%"}>
              <Menu.Label>聊天</Menu.Label>
              {conversations.map((item) => {
                const active = item.id === currentConversationIdRef.current;
                return (
                  <Menu.Item
                    mb={"xs"}
                    key={item.id}
                    rightSection={
                      <ActionIcon
                        variant={"subtle"}
                        color={
                          active ? theme.colors.gray[0] : theme.colors.gray[8]
                        }
                      >
                        <Ellipsis size={16} />
                      </ActionIcon>
                    }
                    onClick={async () => {
                      await getConversationMessages(item.id);
                    }}
                    variant={"light"}
                    color={active ? theme.white : theme.colors.gray[8]}
                    bg={active ? theme.colors.blue[5] : "transparent"}
                  >
                    <Text size={"xs"}>
                      {item.name && appHelper.getLength(item.name) > 8
                        ? item.name.slice(0, 9) + "..."
                        : item.name}
                    </Text>
                  </Menu.Item>
                );
              })}
            </Menu>
          </Loading>
        </ScrollArea>
      </Card>

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
    const contentString = appHelper.isString(msg.content) ? msg.content : null;
    const thinkingString = appHelper.isString(msg.thinking) ? msg.thinking : "";

    const [showThinking, setShowThinking] = useState(false);

    return (
      <Flex
        style={{ marginTop: 20, marginBottom: 20 }}
        justify={isUser ? "flex-end" : "flex-start"}
      >
        <Group align="flex-start" wrap="nowrap">
          {!isUser && (
            <Avatar variant="light" color={theme.colors.violet[7]}>
              BI
            </Avatar>
          )}
          <Stack gap={"xs"} miw="20%" maw="80%">
            {!isUser && thinkingString && (
              <Paper
                p="xs"
                radius="md"
                withBorder
                maw={"60%"}
                bg={theme.colors.gray[0]}
                style={{ borderStyle: "dashed" }}
              >
                <Group gap="xs" align="center">
                  <Group gap={6} align="center">
                    <Badge variant="light" color="grape" size="xs">
                      思考过程
                    </Badge>
                    <Text size="xs" c="dimmed">
                      中间推理
                    </Text>
                  </Group>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => setShowThinking((v) => !v)}
                    aria-label={showThinking ? "收起思考" : "展开思考"}
                    color={theme.colors.gray[7]}
                    title={showThinking ? "收起" : "展开"}
                  >
                    {showThinking ? <EyeOff size={16} /> : <Eye size={16} />}
                  </ActionIcon>
                </Group>
                <Collapse in={showThinking}>
                  <div style={{ marginTop: 6 }}>
                    <MarkdownViewer content={thinkingString} />
                  </div>
                </Collapse>
              </Paper>
            )}

            {/* 主内容（答案区或用户消息） */}
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

            {/* 工具条 */}
            <Group justify="flex-start" className={classes.messageTools}>
              <Tooltip
                label={clipboard.copied ? "已复制" : "复制答案"}
                withArrow
              >
                <ActionIcon
                  variant={"subtle"}
                  size={"sm"}
                  onClick={() => {
                    clipboard.copy(
                      contentString != null
                        ? contentString
                        : appHelper.isString(msg.content)
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
    prev.msg.id === next.msg.id &&
    prev.msg.content === next.msg.content &&
    (prev.msg.thinking || "") === (next.msg.thinking || ""),
);

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
        <Stack w="70%" gap={"xs"}>
          <Card shadow="sm" withBorder radius={"xl"}>
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
          <Center>
            <Text size={"xs"}>AI也会犯错, 请检查重要信息</Text>
          </Center>
        </Stack>
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
