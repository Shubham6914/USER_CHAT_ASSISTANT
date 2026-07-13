import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useChat from "../../hooks/useChat";
import useAuth from "../../hooks/useAuth";
import ConversationItem from "./ConversationItem";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    conversations,
    activeConversationId,
    selectConversation,
    createConversation,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState("");

  const handleConversationClick = (id) => {
    selectConversation(id);
    if (onClose) {
      onClose(); // Close sidebar on mobile after choosing a conversation
    }
  };

  const handleNewChatClick = () => {
    createConversation();
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Filter conversations based on search
  const filteredConversations = conversations?.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 lg:static lg:flex
          w-72 h-full flex-col shrink-0
          border-r border-slate-200/80 dark:border-zinc-800/80
          bg-[var(--bg-secondary)] dark:bg-zinc-950
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header Section */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
                NexusAI
              </h2>
              <p className="text-[10px] text-brand-600 dark:text-brand-500 font-semibold tracking-wider uppercase">
                Assistant Pro
              </p>
            </div>
          </div>

          {/* Close Menu Button on Mobile */}
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-900 lg:hidden text-slate-500 hover:text-slate-700 dark:text-zinc-400 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar Controls */}
        <div className="p-4 flex flex-col gap-3">
          {/* New Chat Button */}
          <button
            onClick={handleNewChatClick}
            type="button"
            className="
              flex items-center justify-center gap-2
              w-full rounded-xl border border-dashed
              border-slate-350 dark:border-zinc-800
              hover:border-brand-500 dark:hover:border-brand-500/50
              bg-[var(--bg-primary)]/50 hover:bg-brand-50/20 dark:bg-zinc-900/20 dark:hover:bg-brand-500/5
              text-slate-800 dark:text-zinc-200 hover:text-brand-600 dark:hover:text-brand-400
              px-4 py-2.5 text-sm font-semibold
              transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]
            "
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Chat</span>
          </button>

          {/* Search Conversations Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-zinc-500 pointer-events-none">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="
                w-full rounded-xl border border-slate-200 dark:border-zinc-800/80
                bg-[var(--bg-primary)] dark:bg-zinc-900/30
                pl-9 pr-4 py-2 text-xs
                placeholder-slate-400 dark:placeholder-zinc-500
                text-slate-800 dark:text-zinc-200
                outline-none transition-all duration-200
                focus:border-brand-500 dark:focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5
              "
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-1">
          {filteredConversations && filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversationId === conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-zinc-650">
              {searchQuery ? "No matches found" : "No active chats"}
            </div>
          )}
        </div>

        {/* User Profile Section at Bottom */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-900/50 bg-[var(--bg-primary)]/50 dark:bg-zinc-950/20">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/settings"
              className="flex items-center gap-2.5 min-w-0 hover:bg-slate-100 dark:hover:bg-zinc-800/60 p-1.5 -m-1.5 rounded-xl transition-all duration-200 cursor-pointer group"
              title="View Profile"
            >
              {/* Profile Avatar */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-150 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {user?.name || "GenAI User"}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                  {user?.email}
                </p>
              </div>
            </Link>

            {/* Profile Settings Controls */}
            <div className="flex items-center gap-1">
              {/* Settings button */}
              <Link
                to="/settings"
                className="
                  p-2 rounded-xl text-slate-500 dark:text-zinc-400
                  hover:bg-slate-205 dark:hover:bg-zinc-800
                  hover:text-slate-700 dark:hover:text-zinc-200
                  transition-colors cursor-pointer
                "
                title="Settings"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                type="button"
                className="
                  p-2 rounded-xl text-slate-500 dark:text-zinc-400
                  hover:bg-red-50 dark:hover:bg-red-950/20
                  hover:text-red-600 dark:hover:text-red-400
                  transition-colors cursor-pointer
                "
                title="Log Out"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;