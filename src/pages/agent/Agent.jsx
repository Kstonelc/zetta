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

  // —— “保证到底”系统（支持瞬时到底/丝滑到底） —— //
  const BOTTOM_EPS = 2; // 底部阈值（px）
  const pendingScrollOnceRef = useRef(false);
  const scrollOnceBehaviorRef = useRef("smooth"); // "auto" | "smooth"
  const smoothBottomInProgressRef = useRef(false);
  const heightRORef = useRef(null); // ResizeObserver

  // 首次加载 + 刷新后点击
  const needHardBottomAfterLoadRef = useRef(false);

  const isReallyAtBottom = useCallback(() => {
    const el = scrollerElRef.current;
    if (!el) return true;
    const diff = el.scrollHeight - el.clientHeight - el.scrollTop;
    return diff <= BOTTOM_EPS;
  }, []);

  const hardScrollToBottomNow = useCallback(() => {
    const el = scrollerElRef.current;
    if (!el) return;
    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
    // 无动画立即到底
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

  /**
   * 统一的一次性“滚到底”：
   * - behavior === "auto": 瞬间到底（无动画、无监听）
   * - behavior === "smooth": 丝滑到底（监听高度增加，持续追随）
   */
  const scrollToBottomOnce = useCallback(
    async (behavior = "auto") => {
      const el = scrollerElRef.current;
      if (!el) {
        pendingScrollOnceRef.current = true;
        scrollOnceBehaviorRef.current = behavior;
        return;
      }

      byProgrammaticRef.current = true;
      userInteractingRef.current = false;
      autoFollowDisabledRef.current = false;
      setShowJump(false);

      // 等 Virtuoso/DOM 初帧布局
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );

      const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);

      // 直接到底：不做任何“持续追随”，确保不抖、不反弹
      if (behavior === "auto") {
        try {
          el.scrollTo({ top: maxTop, behavior: "auto" });
        } catch {
          el.scrollTop = maxTop;
        }
        byProgrammaticRef.current = false;
        atBottomRef.current = true;
        setShowJump(false);
        return;
      }

      // 丝滑到底：在内容持续增长时平滑追随
      const smoothToBottom = () => {
        const _maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
        try {
          el.scrollTo({ top: _maxTop, behavior: "smooth" });
        } catch {
          el.scrollTop = _maxTop;
        }
      };

      smoothBottomInProgressRef.current = true;

      // 监听高度变化：只要在“丝滑到底”期间，scrollHeight 增加就继续 smooth 到底
      if (!heightRORef.current && typeof ResizeObserver !== "undefined") {
        heightRORef.current = new ResizeObserver(() => {
          if (!smoothBottomInProgressRef.current) return;
          smoothToBottom();
        });
      }
      heightRORef.current?.observe(el);

      const MAX_WAIT_MS = 2500;
      const START = performance.now();
      let lastH = -1;

      // 先走一次
      smoothToBottom();

      while (performance.now() - START < MAX_WAIT_MS) {
        // 等一帧，观察是否稳定
        await new Promise((r) => requestAnimationFrame(r));

        const curH = el.scrollHeight;
        const heightChanged = curH !== lastH;
        lastH = curH;

        if (!heightChanged && isReallyAtBottom()) break;

        // 仍未稳定：再发起一次 smooth（避免浏览器合并/丢弃之前动画）
        smoothToBottom();
      }

      smoothBottomInProgressRef.current = false;
      heightRORef.current?.unobserve(el);

      byProgrammaticRef.current = false;
      atBottomRef.current = true;
      setShowJump(false);
    },
    [isReallyAtBottom],
  );

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

  // 首次数据渲染完成后，如有待滚标记则“按指定行为”到底
  useLayoutEffect(() => {
    if (!pendingScrollOnceRef.current) return;
    if (!scrollerElRef.current) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        pendingScrollOnceRef.current = false;
        await scrollToBottomOnce(scrollOnceBehaviorRef.current);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // 触发时机：getConversationMessages 设置 needHardBottomAfterLoadRef = true
  // 实现：在 messages 变化后，进行多帧重试的硬到底（防止 Virtuoso/图片懒载导致的高度后置变化）
  useLayoutEffect(() => {
    if (!needHardBottomAfterLoadRef.current) return;
    let cancelled = false;

    const attempt = (left = 8) => {
      if (cancelled) return;
      const el = scrollerElRef.current;
      if (!el) {
        if (left > 0) requestAnimationFrame(() => attempt(left - 1));
        return;
      }
      // 多次尝试，等高度稳定
      hardScrollToBottomNow();
      if (left > 0) {
        // 等待一帧再试，覆盖图片/代码块渲染后的高度增长
        requestAnimationFrame(() => attempt(left - 1));
      } else {
        // 最后一击后清理状态
        needHardBottomAfterLoadRef.current = false;
        atBottomRef.current = true;
        setShowJump(false);
      }
    };

    // 双 RAF 让 Virtuoso 完整挂载后再开始尝试
    requestAnimationFrame(() => requestAnimationFrame(() => attempt(8)));

    return () => {
      cancelled = true;
    };
  }, [messages, hardScrollToBottomNow]);

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
      currentConversationIdRef.current = response.data?.[0]?.id;
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
    // 清理 RO
    try {
      const el = scrollerElRef.current;
      el && heightRORef.current?.unobserve(el);
    } catch {}
    heightRORef.current = null;
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
            style={{ ...style }}
            onWheel={markUserInteracting}
            onTouchStart={markUserInteracting}
            onPointerDown={markUserInteracting}
            onScroll={(e) => {
              onScroll?.(e);
              const el = scrollerElRef.current;
              if (!el) return;
              if (byProgrammaticRef.current) return;

              const diff = el.scrollHeight - el.scrollTop - el.clientHeight;
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

      if (!userInteractingRef.current && !autoFollowDisabledRef.current) {
        requestAnimationFrame(() => {
          smoothScrollToBottom();
        });
      }
    },
    [smoothScrollToBottom],
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
    await createConversationMessages();
  }, [appendToAssistantById, getLatestAssistantText]);

  const handleSend = useCallback(async () => {
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

    // 发送时：仍旧允许“丝滑到底”
    virtuosoRef.current?.scrollToIndex({
      index: Math.max(0, nextLen - 1),
      align: "end",
      behavior: "smooth",
    });
    scrollOnceBehaviorRef.current = "smooth";
    await scrollToBottomOnce("smooth");

    setInput("");

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
    scrollToBottomOnce,
    getLatestAssistantText,
  ]);

  // 跳到底部（恢复自动跟随 + 强制关闭按钮）
  const jumpToBottomNow = useCallback(async () => {
    const lastIdx = messagesRef.current.length - 1;
    virtuosoRef.current?.scrollToIndex({
      index: Math.max(0, lastIdx),
      align: "end",
      behavior: "auto",
    });
    autoFollowDisabledRef.current = false;
    userInteractingRef.current = false;
    await scrollToBottomOnce("auto");
  }, [scrollToBottomOnce]);

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
            ScrollSeekPlaceholder,
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
          atBottomStateChange={(_at) => {
            if (byProgrammaticRef.current) return;
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

    // 点击菜单：直接到底（无 smooth），并开启硬到底保护（刷新后首击）
    pendingScrollOnceRef.current = true; // 常规一次滚动
    scrollOnceBehaviorRef.current = "auto";
    needHardBottomAfterLoadRef.current = true; // 强化多帧重试
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
          <Menu withinPortal>
            <Menu.Label>聊天</Menu.Label>
            {conversations.map((item) => {
              return (
                <Menu.Item
                  mb={"xs"}
                  variant={"light"}
                  color={
                    item.id === currentConversationIdRef.current
                      ? theme.white
                      : theme.colors.gray[8]
                  }
                  bg={
                    item.id === currentConversationIdRef.current
                      ? theme.colors.blue[5]
                      : "transparent"
                  }
                  key={item.id}
                  onClick={async () => {
                    // 点击左侧列表：期望“瞬时到底”，关闭按钮与交互状态
                    setShowJump(false);
                    atBottomRef.current = true;
                    userInteractingRef.current = false;
                    autoFollowDisabledRef.current = false;

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
