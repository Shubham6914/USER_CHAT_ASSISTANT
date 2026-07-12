import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import useChat from "../../hooks/useChat";

function ChatWindow() {
  const { activeConversation } = useChat();
  const messagesEndRef = useRef(null);

  const lastMessageContent = activeConversation?.messages?.[activeConversation.messages.length - 1]?.content;

  // Auto Scroll to Bottom on message list size or stream text updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages?.length, lastMessageContent]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:p-8 space-y-6 bg-[var(--bg-primary)] dark:bg-zinc-950/20">
      {!activeConversation ? (
        // No conversation selected empty state
        <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)] dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 flex items-center justify-center text-slate-400 dark:text-zinc-500 shadow-sm">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">No active workspace</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-550 max-w-xs">
              Select an existing chat from the history sidebar or create a new one to start writing.
            </p>
          </div>
        </div>
      ) : activeConversation.messages.length === 0 ? (
        // Active conversation, but no messages yet empty state
        <div className="h-full flex flex-col justify-center max-w-2xl mx-auto space-y-8 animate-fade-in px-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-5 tracking-tight">
              What can I help with?
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
              Our advanced generative AI model can help brainstorm ideas, code programs, or debug systems.
            </p>
          </div>

          {/* Quick Start Suggestions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-[var(--bg-secondary)] dark:bg-zinc-900/40 shadow-sm hover:border-brand-500 dark:hover:border-brand-500/50 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between group">
              <span className="text-xs font-bold text-slate-850 dark:text-zinc-200">
                Design a database schema
              </span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                "Create a simple PostgreSQL schema for an online bookstore..."
              </p>
              <div className="mt-3 flex justify-end">
                <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-[var(--bg-secondary)] dark:bg-zinc-900/40 shadow-sm hover:border-brand-500 dark:hover:border-brand-500/50 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between group">
              <span className="text-xs font-bold text-slate-855 dark:text-zinc-200">
                Explain RAG Architecture
              </span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                "What is Retrieval-Augmented Generation and how does it optimize LLMs?"
              </p>
              <div className="mt-3 flex justify-end">
                <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-[var(--bg-secondary)] dark:bg-zinc-900/40 shadow-sm hover:border-brand-500 dark:hover:border-brand-500/50 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between group">
              <span className="text-xs font-bold text-slate-855 dark:text-zinc-200">
                Optimize CSS variables
              </span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                "Write clean custom styling setup for light/dark theme toggles..."
              </p>
              <div className="mt-3 flex justify-end">
                <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-[var(--bg-secondary)] dark:bg-zinc-900/40 shadow-sm hover:border-brand-500 dark:hover:border-brand-500/50 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between group">
              <span className="text-xs font-bold text-slate-855 dark:text-zinc-200">
                Code an API endpoint
              </span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                "Create a Python FastAPI router handling user signin and registrations..."
              </p>
              <div className="mt-3 flex justify-end">
                <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Regular messages display
        <div className="max-w-3xl mx-auto space-y-6">
          {activeConversation.messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              sources={message.sources}
            />
          ))}
          {/* Scrolling Anchor */}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}

export default ChatWindow;