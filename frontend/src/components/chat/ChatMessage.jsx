import { useState } from "react";

/**
 * Modern Stateful Code Block Component with Copy to Clipboard support
 */
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-zinc-950 text-zinc-300 font-mono text-xs shadow-md">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800/50 text-[10px] uppercase font-bold tracking-wider text-zinc-400 select-none">
        <span>{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-850 text-zinc-300 hover:text-white transition-all cursor-pointer font-sans text-[10px]"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-2 4h10m-5-5v10" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto select-text leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}

function ChatMessage({ role, content, sources }) {
  const isUser = role === "user";

  /**
   * Premium Markdown Formatter converting text blocks, code blocks, lists, and inline tags.
   */
  const renderFormattedContent = (text) => {
    if (!text) return null;

    // 1. Split to parse code blocks (```code```)
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Code Block Rendering
      if (part.startsWith("```") && part.endsWith("```")) {
        const fullBlock = part.slice(3, -3).trim();
        const lines = fullBlock.split("\n");
        let language = "";
        let code = fullBlock;
        if (lines.length > 0 && /^[a-zA-Z0-9_#-]+$/.test(lines[0])) {
          language = lines[0];
          code = lines.slice(1).join("\n");
        }

        return (
          <CodeBlock key={`code-${index}`} language={language} code={code} />
        );
      }

      // 2. Parse inline and block elements line-by-line
      const lines = part.split("\n");
      let listItems = [];
      let listType = null; // 'ul' | 'ol'
      let paragraphLines = [];
      const renderedElements = [];

      // Helper to flush accumulated lists
      const flushList = (key) => {
        if (listItems.length > 0) {
          const Tag = listType === "ol" ? "ol" : "ul";
          const listClass = listType === "ol" 
            ? "list-decimal list-outside pl-6 space-y-2 my-4 text-[15px] leading-7" 
            : "list-disc list-outside pl-6 space-y-2 my-4 text-[15px] leading-7";
          renderedElements.push(
            <Tag key={key} className={listClass}>
              {listItems}
            </Tag>
          );
          listItems = [];
          listType = null;
        }
      };

      // Helper to flush paragraph lines
      const flushParagraph = (key) => {
        if (paragraphLines.length > 0) {
          renderedElements.push(
            <p key={key} className="leading-7 mb-4 last:mb-0 text-[15px] text-slate-800 dark:text-zinc-200 font-normal">
              {paragraphLines.map((line, idx) => (
                <span key={idx}>
                  {idx > 0 && " "}
                  {parseInlineStyles(line)}
                </span>
              ))}
            </p>
          );
          paragraphLines = [];
        }
      };

      // Helper to parse inline styles: **bold** and *italics*
      // (Explicitly ignoring underscores like '_' and '__' to preserve raw python tokens)
      const parseInlineStyles = (lineText) => {
        if (!lineText) return "";
        
        // Escape HTML
        let html = lineText
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        // Bold: **text**
        html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');

        // Italics: *text*
        html = html.replace(/\*([\s\S]+?)\*/g, '<em class="italic text-slate-700 dark:text-zinc-300">$1</em>');

        // Inline Code: `code`
        html = html.replace(/`([\s\S]+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-brand-600 dark:text-brand-400 font-mono text-[13px] border border-slate-200/50 dark:border-zinc-700/50 font-medium">$1</code>');

        return <span dangerouslySetInnerHTML={{ __html: html }} />;
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Handle empty lines (paragraph breaks)
        if (!trimmed) {
          flushList(`list-flush-${index}-${i}`);
          flushParagraph(`p-flush-${index}-${i}`);
          renderedElements.push(<div key={`empty-${index}-${i}`} className="h-3" />);
          continue;
        }

        // Headings: H1, H2, H3
        if (trimmed.startsWith("# ")) {
          flushList(`list-flush-${index}-${i}`);
          flushParagraph(`p-flush-${index}-${i}`);
          renderedElements.push(
            <h1 key={`h1-${index}-${i}`} className="text-2xl font-extrabold text-slate-900 dark:text-white mt-6 mb-3 tracking-tight leading-tight">
              {parseInlineStyles(trimmed.slice(2))}
            </h1>
          );
        } else if (trimmed.startsWith("## ")) {
          flushList(`list-flush-${index}-${i}`);
          flushParagraph(`p-flush-${index}-${i}`);
          renderedElements.push(
            <h2 key={`h2-${index}-${i}`} className="text-xl font-bold text-slate-900 dark:text-white mt-5 mb-2.5 tracking-tight">
              {parseInlineStyles(trimmed.slice(3))}
            </h2>
          );
        } else if (trimmed.startsWith("### ")) {
          flushList(`list-flush-${index}-${i}`);
          flushParagraph(`p-flush-${index}-${i}`);
          renderedElements.push(
            <h3 key={`h3-${index}-${i}`} className="text-lg font-semibold text-slate-800 dark:text-zinc-200 mt-4.5 mb-2">
              {parseInlineStyles(trimmed.slice(4))}
            </h3>
          );
        }
        // Unordered lists: * or -
        else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          flushParagraph(`p-flush-${index}-${i}`);
          if (listType && listType !== "ul") {
            flushList(`list-flush-${index}-${i}`);
          }
          listType = "ul";
          const bulletContent = trimmed.slice(2);
          listItems.push(
            <li key={`li-${index}-${i}`} className="text-slate-800 dark:text-zinc-200">
              {parseInlineStyles(bulletContent)}
            </li>
          );
        }
        // Ordered lists: 1. or 2. etc.
        else if (/^\d+\.\s+/.test(trimmed)) {
          flushParagraph(`p-flush-${index}-${i}`);
          if (listType && listType !== "ol") {
            flushList(`list-flush-${index}-${i}`);
          }
          listType = "ol";
          const listMatch = trimmed.match(/^\d+\.\s+(.*)/);
          const listContent = listMatch ? listMatch[1] : trimmed;
          listItems.push(
            <li key={`li-${index}-${i}`} className="text-slate-800 dark:text-zinc-200">
              {parseInlineStyles(listContent)}
            </li>
          );
        }
        // Regular paragraphs (consecutive text line grouping)
        else {
          flushList(`list-flush-${index}-${i}`);
          paragraphLines.push(line);
        }
      }

      // Flush any trailing elements
      flushList(`list-flush-end-${index}`);
      flushParagraph(`p-flush-end-${index}`);

      return renderedElements;
    });
  };

  return (
    <div
      className={`
        flex items-start gap-4 w-full animate-fade-in py-1
        ${isUser ? "flex-row-reverse" : "flex-row"}
      `}
    >
      {/* Avatar */}
      <div
        className={`
          w-9 h-9 rounded-2xl shrink-0 flex items-center justify-center font-bold text-xs select-none shadow-sm border
          ${isUser 
            ? "bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800" 
            : "bg-brand-600 text-white border-brand-700 shadow-md shadow-brand-500/10"}
        `}
      >
        {isUser ? (
          "U"
        ) : (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] space-y-1.5`}>
        <span className={`text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase select-none ${isUser ? "text-right" : "text-left"}`}>
          {isUser ? "User" : "NexusAI Assistant"}
        </span>
        <div
          className={`
            rounded-2xl px-5 py-4 border transition-all duration-200
            ${isUser
              ? "bg-brand-600 border-brand-700 text-white rounded-tr-none shadow-sm shadow-brand-600/5"
              : "bg-[var(--bg-chat-bubble-assistant)] dark:bg-zinc-900 border-slate-200/70 dark:border-zinc-800/80 text-slate-800 dark:text-zinc-200 rounded-tl-none"}
          `}
        >
          <div className="break-words">
            {content === "Thinking..." ? (
              <div className="flex items-center space-x-1.5 py-2 select-none">
                <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-500 animate-bounce" />
              </div>
            ) : (
              renderFormattedContent(content)
            )}
          </div>
        </div>

        {/* Perplexity-style Sources citations block */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-3 space-y-2 animate-fade-in select-none">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Sources & Citations
            </span>
            <div className="flex flex-wrap gap-2">
              {sources.map((src, sIdx) => {
                const pageNum = src.page_number || src.metadata?.page_number;
                const textSnippet = src.text || "";
                return (
                  <div
                    key={sIdx}
                    className="
                      group/src relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border
                      bg-slate-100/50 dark:bg-zinc-900/40 border-slate-200/60 dark:border-zinc-800/80
                      text-[11px] font-semibold text-slate-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400
                      hover:border-brand-500/40 dark:hover:border-brand-500/30 hover:bg-white dark:hover:bg-zinc-900
                      transition-all duration-200 cursor-pointer shadow-sm
                    "
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500/80 dark:bg-brand-500/70" />
                    <span>
                      {pageNum ? `Page ${pageNum}` : `Source ${sIdx + 1}`}
                    </span>
                    
                    {/* Floating Hover Card (Perplexity-style) */}
                    <div className="
                      absolute bottom-full left-0 mb-2.5 hidden group-hover/src:block z-50
                      w-72 max-h-48 overflow-y-auto p-3.5 rounded-2xl border
                      bg-slate-900/95 dark:bg-zinc-950/95 text-white shadow-xl
                      border-slate-850 dark:border-zinc-800 backdrop-blur-sm
                      transition-all duration-200 pointer-events-auto select-text animate-fade-in
                      scrollbar-thin scrollbar-thumb-zinc-700
                    ">
                      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800 dark:border-zinc-850 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        <span>Citation Content</span>
                        {pageNum && <span className="text-brand-400">Page {pageNum}</span>}
                      </div>
                      <p className="text-[11px] leading-relaxed text-zinc-200 font-normal break-words whitespace-pre-line">
                        {textSnippet}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;