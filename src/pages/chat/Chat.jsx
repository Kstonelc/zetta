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

import classes from "./Chat.module.scss";

/**
 * ===== 可扩展的分区阶段面板（显示搜索、本地检索、RAG 等阶段） =====
 */
const SectionPanel = ({ sections, theme, isSectionVisible }) => {
  const names = Object.keys(sections || {});

  if (appHelper.getLength(names) === 0) return null;

  return (
    <Transition
      mounted={isSectionVisible}
      transition="pop"
      duration={200}
      timingFunction="ease-out"
    >
      {(styles) => (
        <Stack
          w="100%"
          align="center"
          style={{
            position: "absolute",
            top: 0,
            zIndex: 999,
            ...styles,
          }}
        >
          {names.map((name) => {
            const s = sections[name];
            const statusColor =
              s.status === "done"
                ? theme.colors.green[5]
                : s.status === "error"
                  ? theme.colors.red[5]
                  : theme.colors.blue[5];
            return (
              <Card key={name} withBorder padding="xs" radius="md">
                <Group justify="space-between" align="center">
                  <Group gap="xs" align="center">
                    <Badge
                      size="sm"
                      variant={s.status === "error" ? "filled" : "light"}
                      color={statusColor}
                    >
                      {s.logs &&
                        appHelper.getLength(s.logs) > 0 &&
                        s.logs.join(" ")}
                    </Badge>
                    {Array.isArray(s.icons) &&
                      s.icons
                        .slice(0, 5)
                        .map((src, i) => (
                          <Image
                            key={i}
                            w={"20"}
                            h={"20"}
                            src={src}
                            radius="xl"
                          />
                        ))}
                  </Group>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}
    </Transition>
  );
};

const Chat = () => {
  const theme = useMantineTheme();
  const { notify } = useNotify();
  const { userStore } = useUserStore();

  // ===== 输入框 =====
  const [input, setInput] = useState("");

  // ===== 消息与引用 =====
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef(messages);

  // ===== 模型相关 =====
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);
  const [isDeepThink, setIsDeepThink] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // ===== 生成状态 =====
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // ===== 分区阶段状态（仅本轮渲染） =====
  const [sections, setSections] = useState({});
  const resetSections = useCallback(() => setSections({}), []);
  const upSection = useCallback((name, patch) => {
    setSections((prev) => {
      const cur = prev?.[name] ?? {
        status: "idle",
        logs: [],
        icons: [],
      };
      const next = {
        ...cur,
        ...patch,
        logs: patch?.logs ?? cur.logs,
        icons: patch?.icons
          ? [...(cur.icons ?? []), ...patch.icons]
          : (cur.icons ?? []),
      };
      return { ...prev, [name]: next };
    });
  }, []);
  const [isSectionVisible, setIsSectionVisible] = useState(false);

  // ===== 滚动/列表 =====
  const virtuosoRef = useRef(null);
  const scrollerElRef = useRef(null);
  const atBottomRef = useRef(true);
  const userInteractingRef = useRef(false);
  const [showJump, setShowJump] = useState(false);

  // ===== 问题导航 =====
  const [qPtr, setQPtr] = useState(-1);
  const qPtrRef = useRef(qPtr);

  // ===== 会话列表 =====
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // 区分程序滚动与用户滚动
  const byProgrammaticRef = useRef(false);
  // 自动跟随禁用开关
  const autoFollowDisabledRef = useRef(false);

  // ==== 平滑跟随会话（核心优化）====
  const followRef = useRef({
    active: false,
    raf: 0,
    startTs: 0,
    lastHeight: 0,
  });

  const isFollowActive = () => followRef.current.active;

  const stopFollowSession = useCallback(() => {
    const f = followRef.current;
    if (f.raf) cancelAnimationFrame(f.raf);
    f.raf = 0;
    f.active = false;
  }, []);

  const suppressUiUntilRef = useRef(0);
  const SUPPRESS_MS = 600;
  const inSuppressWindow = () => performance.now() < suppressUiUntilRef.current;
  const suppress = (ms = SUPPRESS_MS) => {
    suppressUiUntilRef.current = performance.now() + ms;
  };

  const startFollowSession = useCallback(() => {
    const el = scrollerElRef.current;
    if (!el) return;

    // 进入抑制窗口，避免按钮闪烁；标记程序滚动
    suppress(250);
    byProgrammaticRef.current = true;
    autoFollowDisabledRef.current = false;
    userInteractingRef.current = false;

    // 初始化会话
    const f = followRef.current;
    stopFollowSession();
    f.active = true;
    f.startTs = performance.now();
    f.lastHeight = el.scrollHeight;

    // 立即把视图放到靠近底部，减少虚拟化影响
    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
    try {
      el.scrollTo({ top: maxTop, behavior: "auto" });
    } catch {
      el.scrollTop = maxTop;
    }

    // rAF 平滑跟随
    const step = () => {
      if (!f.active) return;
      const el2 = scrollerElRef.current;
      if (!el2) {
        stopFollowSession();
        return;
      }

      const target = Math.max(0, el2.scrollHeight - el2.clientHeight);
      const cur = el2.scrollTop;
      const dist = target - cur;

      const curHeight = el2.scrollHeight;
      const heightChanged = curHeight !== f.lastHeight;
      f.lastHeight = curHeight;

      if (Math.abs(dist) > 0.5 || heightChanged) {
        const maxStep = 48; // px/frame 上限
        const minStep = 8;
        const stepPx = Math.min(
          maxStep,
          Math.max(minStep, Math.abs(dist) * 0.18),
        );
        el2.scrollTop = cur + Math.sign(dist) * stepPx;
      } else {
        el2.scrollTop = target;
      }

      f.raf = requestAnimationFrame(step);
    };

    f.raf = requestAnimationFrame(step);

    requestAnimationFrame(() => {
      byProgrammaticRef.current = false;
    });
  }, [stopFollowSession]);

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

  // 当生成结束或用户手动滚动时，停止跟随会话
  useEffect(() => {
    if (!isGenerating) {
      stopFollowSession();
    }
  }, [isGenerating, stopFollowSession]);

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
    if (appHelper.getLength(questionIndices) === 0) setQPtr(-1);
    else setQPtr(appHelper.getLength(questionIndices) - 1);
  }, [appHelper.getLength(questionIndices)]);

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
    stopFollowSession();
  };

  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, []); // eslint-disable-line

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
          if (byProgrammaticRef.current || inSuppressWindow()) return;
          if (isFollowActive()) stopFollowSession();
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
    [stopFollowSession],
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
    },
    [],
  );

  // ===== 事件处理器注册表（可扩展） =====
  const handlers = useMemo(() => {
    return {
      thinking: (evt) => {
        const delta = evt.delta ?? "";
        appendToAssistantField(
          currentAssistantIdRef.current,
          "thinking",
          delta,
        );
      },
      answer: (evt) => {
        const delta = evt.delta ?? "";
        appendToAssistantField(currentAssistantIdRef.current, "content", delta);
      },
      done: () => {
        setIsGenerating(false);
        latestAssistantTextRef.current = getLatestAssistantText();
        // 把所有 running 的 section 标记 done
        setSections((prev) =>
          Object.fromEntries(
            Object.entries(prev).map(([k, v]) => [
              k,
              v.status === "running" ? { ...v, status: "done" } : v,
            ]),
          ),
        );
      },
      // Web 搜索阶段
      search_begin: (evt) => {
        // example: {type: 'search_begin', delta: '正在搜索....', section: 'search:web'}
        const name = evt.section || "search:web";
        setIsSectionVisible(true);
        upSection(name, { status: "running", logs: [String(evt.delta ?? "")] });
      },
      search_done: (evt) => {
        const name = evt.section || "search:web";
        const icons = Array.isArray(evt.delta) ? evt.delta : [];
        upSection(name, { status: "done", icons, logs: ["搜索完成"] });
        setTimeout(() => {
          setIsSectionVisible(false);
        }, 5000);
      },
      search_error: (evt) => {
        const name = evt.section || "search:web";
        upSection(name, {
          status: "error",
          logs: [String(evt.delta ?? "联网搜索失败")],
        });
      },
    };
  }, [appendToAssistantField, getLatestAssistantText, upSection]);

  const handleUnknown = useCallback(
    (evt) => {
      const name = evt.section || "misc";
      const summary = `[${evt.type}] ${typeof evt.delta === "string" ? evt.delta : JSON.stringify(evt.delta ?? "")}`;
      upSection(name, { status: "running", logs: [summary] });
    },
    [upSection],
  );

  // 停止：终止流
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

    // 开新一轮：清空分区面板
    resetSections();

    latestUserTextRef.current = input;

    setIsGenerating(true);

    // 发送后不要自动跟随（让历史被顶上去）
    autoFollowDisabledRef.current = true;
    userInteractingRef.current = true;

    // 基于当前长度计算“用户消息”的索引位置
    const baseLen = appHelper.getLength(messagesRef.current) ?? 0;

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
      content: <Loader size={"xs"} mt={6} />,
      thinking: "",
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
          // 根据 UI 开关，服务端可选启用联网/深度思考
          isOnline: isOnline,
          isDeepThink: isDeepThink,
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

        // 按行消费（每行一个 JSON）
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
              console.warn("JSON parse fail on line:", e);
              continue;
            }

            const evt = {
              type: obj?.type,
              delta: obj?.delta,
              section: obj?.section,
            };

            console.log("当前事件类型", evt.type);
            const fn = handlers[evt.type];
            if (fn) fn(evt);
            else handleUnknown(evt);
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
    handlers,
    handleUnknown,
    resetSections,
    isOnline,
    isDeepThink,
  ]);

  // 跳到底部（恢复自动跟随 + 关闭按钮）
  const jumpToBottomNow = useCallback(async () => {
    suppress(800);

    const lastIdx = appHelper.getLength(messagesRef.current) - 1;
    virtuosoRef.current?.scrollToIndex({
      index: Math.max(0, lastIdx),
      align: "end",
      behavior: "auto",
    });

    autoFollowDisabledRef.current = false;
    userInteractingRef.current = false;

    startFollowSession();

    setShowJump(false);
  }, [startFollowSession]);

  // region 问题导航定位（禁用自动跟随）
  const scrollToQuestionPtr = useCallback(
    (qIdx, behavior = "smooth") => {
      if (qIdx < 0 || qIdx >= appHelper.getLength(questionIndices)) return;
      const itemIndex = questionIndices[qIdx];
      if (itemIndex == null) return;

      stopFollowSession();

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
    [questionIndices, stopFollowSession],
  );

  const goPrevQuestion = useCallback(() => {
    if (appHelper.getLength(questionIndices) === 0) return;
    const nextPtr = qPtrRef.current <= 0 ? 0 : qPtrRef.current - 1;
    setQPtr(nextPtr);
    scrollToQuestionPtr(nextPtr);
  }, [appHelper.getLength(questionIndices), scrollToQuestionPtr]);

  const goNextQuestion = useCallback(() => {
    if (appHelper.getLength(questionIndices) === 0) return;
    const last = appHelper.getLength(questionIndices) - 1;
    const nextPtr = qPtrRef.current >= last ? last : qPtrRef.current + 1;
    setQPtr(nextPtr);
    scrollToQuestionPtr(nextPtr);
  }, [appHelper.getLength(questionIndices), scrollToQuestionPtr]);

  //endregion

  //region 数据获取

  const renderChatBox = () => {
    return (
      <div className={classes.agentChatWrap}>
        <SectionPanel
          sections={sections}
          theme={theme}
          isSectionVisible={isSectionVisible}
        />
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: "100%", width: "100%" }}
          data={messages}
          computeItemKey={(_, msg) => msg.id}
          increaseViewportBy={{ top: 400, bottom: 600 }}
          defaultItemHeight={160}
          components={{
            Scroller,
            Footer: () => <div style={{ height: 24 }} />,
          }}
          // 当处于“跟随会话”时，禁用 Virtuoso 的 followOutput，避免双重平滑引起抖动
          followOutput={
            isFollowActive()
              ? false
              : isGenerating &&
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
        {appHelper.getLength(questionIndices) > 0 && (
          <Stack gap="4" className={classes.agentQnav}>
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
          </Stack>
        )}
      </div>
    );
  };

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

    // 切换会话前，停止任何跟随会话
    stopFollowSession();

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
      const lastIdx = Math.max(0, appHelper.getLength(withThinking) - 1);

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

  //endregion

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
                    style={{
                      borderRadius: 8,
                    }}
                    rightSection={
                      <ActionIcon
                        className={classes.conversationItemTools}
                        variant={"subtle"}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        color={
                          active ? theme.colors.blue[1] : theme.colors.gray[8]
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
                    bg={active ? theme.colors.blue[6] : ""}
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

      <Stack h="100%" flex={1} align="center" justify="flex-start" mih={0}>
        {/* 阶段分区面板：展示搜索/本地检索/RAG 等 */}
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
          isDeepThink={isDeepThink}
          setIsDeepThink={setIsDeepThink}
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
        mt={20}
        mb={20}
        justify={isUser ? "flex-end" : "flex-start"}
        w="100%"
      >
        <Group
          align="flex-start"
          wrap="nowrap"
          w={"100%"}
          gap={"xs"}
          // 根据 isUser 切换行方向
          style={{
            flexDirection: isUser ? "row-reverse" : "row",
          }}
        >
          {/* 头像：左右通过 row-reverse 自动换位，无需两段条件渲染 */}
          <Avatar
            variant="light"
            color={isUser ? theme.colors.blue[7] : theme.colors.violet[7]}
          >
            {isUser ? "AD" : "BI"}
          </Avatar>

          {/* 消息容器（纵向） */}
          <Stack
            gap="xs"
            miw="20%"
            maw="80%"
            align={isUser ? "flex-end" : "flex-start"}
          >
            {/* 助手思考块：仅助手且靠左 */}
            {!isUser && thinkingString && (
              <Paper
                p="xs"
                radius="md"
                withBorder
                miw={300}
                maw="60%"
                bg={theme.colors.gray[0]}
                align={"flex-start"}
                style={{
                  borderStyle: "dashed",
                }}
              >
                <Group
                  gap="xs"
                  align="center"
                  justify="space-between"
                  wrap="nowrap"
                  mih={24}
                >
                  <Group gap={6} align="center" wrap="nowrap" miw={0}>
                    <Badge variant="light" color="grape" size="xs">
                      思考过程
                    </Badge>
                    <Text
                      size="xs"
                      c="dimmed"
                      style={{ whiteSpace: "nowrap", lineHeight: 1 }}
                    >
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
                <Collapse in={showThinking} keepMounted>
                  <MarkdownViewer content={thinkingString} />
                </Collapse>
              </Paper>
            )}

            {/* 主消息气泡：用户靠右、助手靠左 */}
            <Paper
              p={isUser ? "xs" : 4}
              radius="md"
              withBorder={isUser}
              maw={"100%"}
              bg={isUser ? theme.colors.blue[5] : "transparent"}
              style={{
                alignSelf: isUser ? "flex-end" : "flex-start",
                wordBreak: "break-word",
              }}
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

            {/* 工具条：跟随消息侧 */}
            <Group
              justify={isUser ? "flex-end" : "flex-start"}
              className={classes.messageTools}
              w={"100%"}
            >
              <Tooltip
                label={clipboard.copied ? "已复制" : "复制答案"}
                withArrow
              >
                <ActionIcon
                  variant="subtle"
                  size="sm"
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
  isDeepThink,
  setIsDeepThink,
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
      offset={12}
    >
      <Popover.Target>
        <Stack w="70%" gap={"xs"} style={{ position: "absolute", bottom: 10 }}>
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
            />
            <Group justify="space-between">
              <Group gap="xs">
                <SelectWithIcon
                  size="xs"
                  options={modelOptions}
                  onChange={setCurrentModel}
                  value={currentModel}
                />
                {/*<Button*/}
                {/*  variant={isOnline ? "light" : "subtle"}*/}
                {/*  color={isOnline ? theme.colors.blue[7] : theme.colors.gray[7]}*/}
                {/*  onClick={() => setIsOnline((v) => !v)}*/}
                {/*  leftSection={<Globe size={16} />}*/}
                {/*  radius={"xl"}*/}
                {/*  size="xs"*/}
                {/*>*/}
                {/*  <Text size="xs" fw="bold">*/}
                {/*    联网搜索*/}
                {/*  </Text>*/}
                {/*</Button>*/}
                <Button
                  variant={isDeepThink ? "light" : "subtle"}
                  color={
                    isDeepThink ? theme.colors.blue[7] : theme.colors.gray[7]
                  }
                  onClick={() => {
                    setIsDeepThink((v) => !v);
                  }}
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

export { Chat };
