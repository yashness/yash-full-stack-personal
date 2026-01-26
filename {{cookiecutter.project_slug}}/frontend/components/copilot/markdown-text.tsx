"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ComponentProps } from "react";

type MarkdownComponents = ComponentProps<typeof ReactMarkdown>["components"];

/**
 * Custom components for markdown rendering with Tailwind styles.
 */
const markdownComponents: MarkdownComponents = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mt-6 mb-4 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold mt-5 mb-3 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold mt-3 mb-2 first:mt-0">{children}</h4>
  ),

  // Paragraphs
  p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,

  // Lists
  ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Code
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={`block text-sm font-mono ${className || ""}`} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-3 p-4 bg-muted rounded-lg overflow-x-auto text-sm">
      {children}
    </pre>
  ),

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="my-3 pl-4 border-l-4 border-primary/30 text-muted-foreground italic">
      {children}
    </blockquote>
  ),

  // Tables (GFM)
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="min-w-full border border-border rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-2 text-left font-semibold text-sm">{children}</th>
  ),
  td: ({ children }) => <td className="px-4 py-2 text-sm">{children}</td>,

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  ),

  // Horizontal rule
  hr: () => <hr className="my-4 border-border" />,

  // Strong and emphasis
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,

  // Images
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt || ""}
      className="my-3 max-w-full rounded-lg border border-border"
    />
  ),
};

interface MarkdownTextProps {
  text: string;
  className?: string;
}

/**
 * Markdown text renderer component.
 * Renders markdown content with proper styling for chat messages.
 */
export function MarkdownText({ text, className = "" }: MarkdownTextProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
