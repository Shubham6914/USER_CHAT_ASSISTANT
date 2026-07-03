function ChatMessage({ role, content }) {
  const isUser = role === "user";

  const renderFormattedContent = (text) => {
    if (!text) return null;
    
    // Basic split to parse code blocks (```code```)
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
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
          <div key={index} className="my-3.5 overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-[10px] uppercase font-bold tracking-wider text-slate-400 select-none">
              <span>{language || "code"}</span>
              <span className="text-[9px] text-slate-500">Read Only</span>
            </div>
            <pre className="p-4 overflow-x-auto select-text"><code>{code}</code></pre>
          </div>
        );
      }
      
      // Split by newlines for paragraph spacing
      return part.split("\n").map((line, lIndex) => {
        if (!line.trim()) return <div key={`${index}-${lIndex}`} className="h-2" />;
        return <p key={`${index}-${lIndex}`} className="leading-relaxed mb-2 last:mb-0 text-sm">{line}</p>;
      });
    });
  };

  return (
    <div
      className={`
        flex items-start gap-3.5 w-full animate-fade-in
        ${isUser ? "flex-row-reverse" : "flex-row"}
      `}
    >
      {/* Avatar */}
      <div
        className={`
          w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs select-none shadow-sm
          ${isUser 
            ? "bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300/40 dark:border-zinc-700/40" 
            : "bg-brand-600 text-white shadow-md shadow-brand-500/10"}
        `}
      >
        {isUser ? (
          "U"
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] space-y-1`}>
        <span className={`text-[10px] font-semibold tracking-wide text-slate-400 dark:text-zinc-500 uppercase select-none ${isUser ? "text-right" : "text-left"}`}>
          {isUser ? "User" : "Assistant"}
        </span>
        <div
          className={`
            rounded-2xl px-4 py-3 shadow-sm border
            ${isUser
              ? "bg-brand-600 border-brand-700 text-white rounded-tr-none shadow-brand-600/5"
              : "bg-[var(--bg-chat-bubble-assistant)] dark:bg-zinc-900 border-slate-200/60 dark:border-zinc-800/80 text-slate-800 dark:text-zinc-150 rounded-tl-none"}
          `}
        >
          <div className="break-words">
            {renderFormattedContent(content)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;