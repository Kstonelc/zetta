import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";

import {
  Box,
  Group,
  Text,
  ActionIcon,
  Paper,
  Anchor,
  useMantineTheme,
  Tooltip,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { Copy, Check } from "lucide-react";

import "highlight.js/styles/default.css";
// @ts-ignore
import classes from "./MarkdownViewer.module.scss";

export type MarkdownViewerProps = {
  content: string;
  className?: string;
  /** 是否允许原始 HTML（默认 false，避免 XSS） */
  allowHtml?: boolean;
  /** 代码块头部吸顶的偏移量（可不传，默认为 0，通过 Virtuoso 容器也可覆盖） */
  stickyTopPx?: number;
};

/** 从 className 中归一化出语言标识 */
function normalizeLang(className?: string): string | null {
  if (!className) return null;
  const match =
    className.match(/language-([\w+-]+)/) ||
    className.match(/lang-([\w+-]+)/) ||
    className.match(/\b([\w+-]+)\b/);
  const lang = match?.[1]?.toLowerCase() || null;
  if (!lang || lang === "text" || lang === "plaintext" || lang === "none")
    return null;
  return lang;
}

/** 提取 React 节点中的纯文本（用于复制） */
function extractText(node: any): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText((node as any).props?.children);
  }
  return "";
}

/** 仅负责“内联代码”的渲染（非代码块） */
const InlineCode: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  const rawText = useMemo(
    () => extractText(children).replace(/\n$/, ""),
    [children],
  );
  return (
    <Box
      component="span"
      className={`${classes.inlineCode} ${className || ""}`}
    >
      {rawText}
    </Box>
  );
};

/** 完整的“代码块卡片”：Header（语言 + 复制） + 内容区域（<pre><code/>） */
const CodeCard: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  const clipboard = useClipboard({ timeout: 1500 });
  const rawText = useMemo(
    () => extractText(children).replace(/\n$/, ""),
    [children],
  );
  const lang = normalizeLang(className) ?? "text";

  return (
    <Paper radius="md" className={classes.codeCard} data-md-code-card>
      <Group
        justify="space-between"
        align="center"
        className={classes.codeHeader}
      >
        <Text className={classes.codeLang} tt="uppercase">
          {lang}
        </Text>
        <Tooltip label={clipboard.copied ? "已复制" : "复制代码"} withArrow>
          <ActionIcon
            variant="subtle"
            className={classes.codeCopy}
            onClick={() => clipboard.copy(rawText)}
            aria-label="复制代码"
          >
            {clipboard.copied ? <Check size={16} /> : <Copy size={16} />}
          </ActionIcon>
        </Tooltip>
      </Group>

      <Box component="pre" className={classes.codePre}>
        <Box component="code" className={`${classes.code} ${className || ""}`}>
          {children}
        </Box>
      </Box>
    </Paper>
  );
};

/** 捕获 react-markdown 产出的 <pre><code/>，替换为 CodeCard 结构 */
const PreBlock: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const onlyChild = React.Children.only(children) as any;
  const className: string | undefined = onlyChild?.props?.className;
  const codeChildren = onlyChild?.props?.children;
  return <CodeCard className={className}>{codeChildren}</CodeCard>;
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className,
  allowHtml = false,
  stickyTopPx = 0,
}) => {
  const theme = useMantineTheme();

  // 仅通过 CSS 变量注入主题与吸顶偏移；具体样式在 module.scss 中
  const cssVars: React.CSSProperties = {
    // @ts-ignore
    ["--md-fg"]: theme.colors.dark[9],
    // @ts-ignore
    ["--md-muted"]: theme.colors.gray[7],
    // @ts-ignore
    ["--md-border"]: theme.colors.gray[3],
    // @ts-ignore
    ["--md-bg"]: theme.colors.gray[0],
    // @ts-ignore
    ["--md-bg-strong"]: theme.colors.gray[1],
    // @ts-ignore
    ["--md-link"]: theme.colors.blue[7],

    ["--md-font-size"]: "13px",
    ["--md-radius"]: "12px",
    ["--md-spacing-xs"]: "8px",
    ["--md-spacing-sm"]: "12px",

    ["--md-code-sticky-top"]: `${stickyTopPx}px`,
  };

  // @ts-ignore
  const CodeRenderer: any = ({ inline, className, children }) => {
    return inline ? (
      <InlineCode className={className}>{children}</InlineCode>
    ) : (
      // 非内联（即代码块）不在这里渲染，由 <pre> -> PreBlock 捕获并交给 CodeCard
      <></>
    );
  };

  const components: Components = {
    /** 捕获 <pre> => 用CodeCard 渲染 */
    pre: PreBlock,

    /** 内联代码：非代码块场景（inline === true） */
    code: CodeRenderer,

    /** 链接统一新开页 */
    a: ({ href, children }) => (
      <Anchor href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </Anchor>
    ),

    /** 表格：包容器+原生 table，配合 CSS 完成斑马纹等 */
    table: ({ children }) => (
      <Box component="div" className={classes.tableContainer}>
        <Box component="table" className={classes.table}>
          {children}
        </Box>
      </Box>
    ),
    thead: ({ children }) => (
      <Box component="thead" className={classes.thead}>
        {children}
      </Box>
    ),
    tbody: ({ children }) => (
      <Box component="tbody" className={classes.tbody}>
        {children}
      </Box>
    ),
    tr: ({ children }) => (
      <Box component="tr" className={classes.tr}>
        {children}
      </Box>
    ),
    th: ({ children }) => (
      <Box component="th" className={classes.th}>
        {children}
      </Box>
    ),
    td: ({ children }) => (
      <Box component="td" className={classes.td}>
        {children}
      </Box>
    ),
  };

  return (
    <Box className={`${classes.root} ${className || ""}`} style={cssVars}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={
          [
            [rehypeHighlight as any, { detect: true, ignoreMissing: true }],
          ] as any
        }
        skipHtml={!allowHtml}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export { MarkdownViewer };
