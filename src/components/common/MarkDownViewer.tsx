// MarkdownViewer.tsx
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

// 使用 GitHub 风格高亮
import "highlight.js/styles/default.css";

// ✅ 统一 Markdown 样式
import "./markdown-unified.css";

export type MarkdownViewerProps = {
  content: string;
  className?: string;
  allowHtml?: boolean;
};

/** 规范化语言名；将 text/plain 视为无语言（返回 null） */
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

/** 递归提取纯文本（用于复制用的原文） */
function extractText(node: any): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText((node as any).props?.children);
  }
  return "";
}

/** 代码块渲染组件 */
const CodeBlock: React.FC<{
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}> = ({ inline, className, children }) => {
  const theme = useMantineTheme();
  const clipboard = useClipboard({ timeout: 1500 });
  const rawText = useMemo(
    () => extractText(children).replace(/\n$/, ""),
    [children],
  );
  const lang = normalizeLang(className);

  // 行内代码或 text → 不换行，加粗显示
  if (inline || !lang) {
    return (
      <Box
        component="span"
        style={{
          fontFamily: theme.fontFamilyMonospace,
          fontWeight: 600,
          display: "inline-block",
          verticalAlign: "baseline",
          background: "rgba(0,0,0,0.04)",
          borderRadius: 4,
          padding: "0 4px",
        }}
      >
        {rawText}
      </Box>
    );
  }

  // 有语言 → 显示语言和复制按钮 + 保留高亮
  return (
    <Paper
      withBorder
      radius="md"
      className="markdown-codeblock"
      style={{ overflow: "hidden", margin: "12px 0" }}
    >
      <Group
        justify="space-between"
        align="center"
        px="sm"
        py={6}
        style={{
          borderBottom: `1px solid ${
            theme.colorScheme === "dark"
              ? theme.colors.dark[4]
              : theme.colors.gray[3]
          }`,
          background:
            theme.colorScheme === "dark"
              ? theme.colors.dark[6]
              : theme.colors.gray[0],
        }}
      >
        <Text fw={600} fz={12} tt="uppercase" c="dimmed">
          {lang}
        </Text>

        <Tooltip label={clipboard.copied ? "已复制" : "复制代码"} withArrow>
          <ActionIcon variant="subtle" onClick={() => clipboard.copy(rawText)}>
            {clipboard.copied ? <Check size={16} /> : <Copy size={16} />}
          </ActionIcon>
        </Tooltip>
      </Group>

      <Box component="pre" m={0} p="sm" style={{ overflowX: "auto" }}>
        <Box
          component="code"
          className={className}
          style={{
            display: "block",
            fontFamily: theme.fontFamilyMonospace,
            fontSize: "inherit",
            lineHeight: 1.6,
          }}
        >
          {children}
        </Box>
      </Box>
    </Paper>
  );
};

/** 主体组件 */
const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className,
  allowHtml = false,
}) => {
  const components: Components = {
    code: ({ inline, className, children, ...props }) => (
      <CodeBlock inline={inline} className={className} {...props}>
        {children}
      </CodeBlock>
    ),
    a: ({ href, children }) => (
      <Anchor href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </Anchor>
    ),
  };

  return (
    <Box className={`markdown-unified ${className || ""}`}>
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
