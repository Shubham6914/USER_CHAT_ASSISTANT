import { useState, useRef, useEffect } from "react";
import useChat from "../../hooks/useChat";

function ChatInput() {
  const { activeConversation, addMessage } = useChat();
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  // Auto-expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    if (!activeConversation) {
      return;
    }

    /**
     * User Message
     */
    addMessage(activeConversation.id, {
      id: Date.now(),
      role: "user",
      content: message.trim(),
    });

    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAttachmentClick = () => {
    // UI-only attachment feature
    alert("File upload integration: TODO");
  };

  const isDisabled = !activeConversation;

  return (
    <div className="border-t border-slate-200/80 dark:border-zinc-800/80 p-4 md:p-6 bg-[var(--bg-primary)] dark:bg-zinc-950 transition-colors duration-200">
      <div className="max-w-3xl mx-auto relative">
        <form onSubmit={handleSubmit} className="relative">
          {/* Main Input Card Container */}
          <div className={`
            relative flex flex-col rounded-2xl border bg-[var(--bg-secondary)]/50 dark:bg-zinc-900/35
            transition-all duration-200 w-full p-2.5 gap-2
            ${isDisabled 
              ? "border-slate-200 dark:border-zinc-800 opacity-60 cursor-not-allowed" 
              : "border-slate-200 dark:border-zinc-800/80 focus-within:border-brand-500 dark:focus-within:border-brand-500/50 focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:bg-[var(--bg-secondary)] dark:focus-within:bg-zinc-900/60"}
          `}>
            {/* Expanding Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isDisabled}
              placeholder={isDisabled ? "Select a workspace chat to begin writing..." : "Message GenAI Assistant..."}
              className="
                w-full resize-none bg-transparent px-3 py-1.5 text-sm
                placeholder-slate-400 dark:placeholder-zinc-500
                text-slate-800 dark:text-zinc-100 outline-none
                disabled:cursor-not-allowed min-h-[38px] max-h-[200px]
              "
            />

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-100 dark:border-zinc-900/40">
              {/* Left attachment buttons */}
              <button
                type="button"
                onClick={handleAttachmentClick}
                disabled={isDisabled}
                className="
                  p-2 rounded-xl text-slate-400 dark:text-zinc-500
                  hover:bg-slate-200/50 dark:hover:bg-zinc-800
                  hover:text-slate-700 dark:hover:text-zinc-350
                  transition-all disabled:opacity-50 disabled:hover:bg-transparent
                  disabled:cursor-not-allowed cursor-pointer
                "
                title="Add attachment"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              {/* Right submit button */}
              <button
                type="submit"
                disabled={isDisabled || !message.trim()}
                className={`
                  flex items-center justify-center h-8.5 w-8.5 rounded-xl transition-all duration-200 cursor-pointer
                  ${!message.trim() || isDisabled
                    ? "bg-slate-100 text-slate-300 dark:bg-zinc-900 dark:text-zinc-700 cursor-not-allowed"
                    : "bg-brand-600 text-white shadow-md shadow-brand-500/10 hover:bg-brand-700 active:scale-[0.96]"}
                `}
                title="Send Message"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </form>

        {/* Small privacy notice */}
        <p className="text-[10px] text-center mt-2.5 text-slate-400 dark:text-zinc-550 select-none">
          GenAI Assistant can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}

export default ChatInput;