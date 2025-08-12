import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";

const MarkDownViewer = () => {
  return (
    <ReactMarkdown
      children={markdown}
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeHighlight, rehypeKatex]} // or rehype-mathjax
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <pre className="code-block">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          ) : (
            <code className="inline-code" {...props}>
              {children}
            </code>
          );
        },
      }}
    />
  );
};

export { MarkDownViewer };
