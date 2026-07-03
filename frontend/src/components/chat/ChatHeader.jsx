import { Link } from "react-router-dom";
import useChat from "../../hooks/useChat";
import ThemeToggle from "../common/ThemeToggle";

function ChatHeader({ onMenuToggle }) {
  const { activeConversation } = useChat();

  return (
    <header className="h-16 px-4 border-b border-slate-200/80 dark:border-zinc-800/80 bg-[var(--bg-secondary)] dark:bg-zinc-950 flex items-center justify-between z-30 transition-colors duration-200">
      {/* Left side: Mobile Toggle & Active title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          type="button"
          className="p-2 -ml-1 rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--bg-secondary)] dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-500 hover:text-slate-750 dark:text-zinc-400 lg:hidden cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="text-sm font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
          {activeConversation ? activeConversation.title : "NexusAI Workspace"}
        </h1>
      </div>

      {/* Right side: Global controls */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Settings Shortcut Button */}
        <Link
          to="/settings"
          className="
            flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 dark:border-zinc-800
            bg-[var(--bg-secondary)] dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900
            hover:text-slate-700 dark:hover:text-zinc-200 transition-all duration-200 cursor-pointer
          "
          title="Settings Page"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

export default ChatHeader;