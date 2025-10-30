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

import "highlight.js/styles/default.css";
import "./markdown-unified.css";

export type MarkdownViewerProps = {
  content: string;
  className?: string;
  allowHtml?: boolean;
};

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

function extractText(node: any): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText((node as any).props?.children);
  }
  return "";
}

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

  if (inline || !lang) {
    return (
      <Box
        component="span"
        style={{
          fontWeight: 600,
          display: "inline-block",
          verticalAlign: "baseline",
          background: theme.colors.gray[2],
          borderRadius: 4,
          padding: "0 4px",
        }}
      >
        {rawText}
      </Box>
    );
  }

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
        px="xs"
        py={6}
        style={{
          borderBottom: `1px solid ${theme.colors.gray[3]}`,
          background: theme.colors.gray[0],
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

      <Box component="pre" m={0} p="xs" style={{ overflowX: "auto" }}>
        <Box
          component="code"
          className={className}
          style={{
            display: "block",
            fontSize: "inherit",
            lineHeight: 1.4,
          }}
        >
          {children}
        </Box>
      </Box>
    </Paper>
  );
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className,
  allowHtml = false,
}) => {
  const theme = useMantineTheme();
  const border = theme.colors.gray[3];
  const headBg = theme.colors.gray[1];

  // @ts-ignore
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

    /** ------- ✅ 表格渲染支持（带自适应滚动与样式） ------- */
    table: ({ children }) => (
      <Box
        className="md-table-container"
        style={{
          overflowX: "hidden",
          margin: "12px 0",
          borderRadius: 8,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: theme.colors.gray[3],
        }}
      >
        <Box
          component="table"
          className="md-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: `1px solid ${border}`,
          }}
        >
          {children}
        </Box>
      </Box>
    ),
    thead: ({ children }) => (
      <Box component="thead" style={{ background: headBg }}>
        {children}
      </Box>
    ),
    tbody: ({ children }) => <Box component="tbody">{children}</Box>,
    tr: ({ children }) => <Box component="tr">{children}</Box>,
    th: ({ children }) => (
      <Box
        component="th"
        style={{
          textAlign: "left",
          padding: "8px 10px",
          borderBottom: `1px solid ${border}`,
          borderRight: `1px solid ${border}`,
          fontWeight: 700,
          position: "sticky",
          top: 0, // 如果外层容器有固定高度 + overflow，可粘性表头
          zIndex: 1,
          background: headBg,
        }}
      >
        {children}
      </Box>
    ),
    td: ({ children }) => (
      <Box
        component="td"
        style={{
          padding: "8px 10px",
          borderBottom: `1px solid ${border}`,
          borderRight: `1px solid ${border}`,
          verticalAlign: "top",
        }}
      >
        {children}
      </Box>
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
