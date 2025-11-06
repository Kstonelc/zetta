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

  // 区分程序滚动与用户滚动
  const byProgrammaticRef = useRef(false);
  // 自动跟随禁用开关
  const autoFollowDisabledRef = useRef(false);

  // SSE/流控制
  const conversationStopControllerRef = useRef(null);
  const bufferRef = useRef("");
  const flushTimerRef = useRef(null);
  const currentAssistantIdRef = useRef(null);

  // 消息快照
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

  const isMac =
    typeof navigator !== "undefined" &&
    (/Mac/.test(navigator.platform) || /Mac OS/.test(navigator.userAgent));

  const BOTTOM_EPS = isMac ? 4 : 2; // 底部阈值（px）
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
    // 向上取整 + 右侧不等式，吞掉 0.5~1px 抖动
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
      el.scrollTo({ top: maxTop, behavior: "smooth" });
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

  // 合并后的"渲染后到底"处理（只执行一次）
  useLayoutEffect(() => {
    const mode = afterRenderScrollRef.current;
    if (mode === "none") return;

    const el = scrollerElRef.current;
    if (!el) return;

    // 先 reset，防止重复
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
  }, [messages]);

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
      return [];
    }
    setConversations(response.data);
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

  // 流式拼接：更新 Map + latestRef + UI（并且输出期间自动丝滑跟随）
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

      // 生成期间且在底部：直接跟随，不触发 showJump 变化
      if (!userInteractingRef.current && !autoFollowDisabledRef.current) {
        if (!isReallyAtBottom()) {
          requestAnimationFrame(() => {
            smoothScrollToBottom();
          });
        }
      }
    },
    [smoothScrollToBottom, isReallyAtBottom],
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

  // 停止：冲刷并保存
  const stopSend = useCallback(async () => {
    if (!conversationStopControllerRef.current) return;

    conversationStopControllerRef.current.abort();
    conversationStopControllerRef.current = null;

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
  }, [appendToAssistantById, getLatestAssistantText]);

  // 发送：保持顺序追加，但把“新问题”顶到可视区顶部
  const handleSend = useCallback(async () => {
    latestAssistantTextRef.current = "";

    if (isGenerating) {
      stopSend();
      return;
    }
    if (!input.trim() || !currentModel) return;

    latestUserTextRef.current = input;

    setIsGenerating(true);

    // 发送后不要自动跟随（让历史内容被顶上去）
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

    // 此场景不需要渲染后“硬到底”
    afterRenderScrollRef.current = "none";
    // 显示“跳至最新”按钮
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
    // 创建空的 done之后更新
    const assistant_message_id = await createConversationMessages();
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

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          const tail = decoder.decode();
          if (tail) bufferRef.current += tail;

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
          // await createConversationMessages();
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

      const tail = decoder.decode();
      if (tail) bufferRef.current += tail;

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
    appendToAssistantById,
    getLatestAssistantText,
  ]);

  // 跳到底部（恢复自动跟随 + 强制关闭按钮）
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

    // 设置消息
    setMessages(response.data);

    // 关键：不使用 afterRenderScrollRef，直接手动滚动
    // 等待足够的时间让 Virtuoso 完成渲染
    setTimeout(() => {
      const lastIdx = Math.max(0, response.data.length - 1);

      // 先让 Virtuoso 跳转到最后一项
      virtuosoRef.current?.scrollToIndex({
        index: lastIdx,
        align: "end",
        behavior: "auto",
      });

      // 少量重试，期间仍在抑制窗口
      const scrollAttempts = [80, 160, 260, 420];
      scrollAttempts.forEach((delay) => {
        setTimeout(() => {
          hardScrollToBottomNow();
        }, delay);
      });

      // 最后重置标志位（抑制窗口会自然结束）
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
          }}
        >
          新建对话
        </Button>
        <ScrollArea h="calc(100% - 48px)">
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
          <>
            {isLoadingMessages && (
              <div className={classes.topThinLoader} aria-hidden />
            )}
            {renderChatBox()}
          </>
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
