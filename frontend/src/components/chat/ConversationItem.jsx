import { useState } from "react";
import useChat from "../../hooks/useChat";

function ConversationItem({
  conversation,
  isActive,
  onClick,
}) {
  const { updateConversationTitle, deleteConversation } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);

  const handleEditStart = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleEditSave = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    if (editTitle.trim() && editTitle !== conversation.title) {
      updateConversationTitle(conversation.id, editTitle.trim());
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete "${conversation.title}"?`)) {
      deleteConversation(conversation.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        group
        relative
        flex
        items-center
        gap-3
        px-3.5
        py-3
        rounded-xl
        cursor-pointer
        transition-all
        duration-200
        text-sm
        font-medium
        ${isActive
          ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 font-semibold"
          : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/60 hover:text-slate-900 dark:hover:text-zinc-200"}
      `}
    >
      {/* Chat Icon */}
      <svg
        className={`w-4 h-4 shrink-0 transition-colors ${
          isActive
            ? "text-brand-600 dark:text-brand-500"
            : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-400"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>

      {/* Title */}
      <div className="flex-1 truncate pr-8">
        {isEditing ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={(e) => e.key === "Enter" && handleEditSave(e)}
            className="w-full bg-white dark:bg-zinc-950 border border-slate-350 dark:border-zinc-800 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span>{conversation.title}</span>
        )}
      </div>

      {/* Action buttons (Visible on hover) */}
      {!isEditing && (
        <div className="absolute right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={handleEditStart}
            type="button"
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
            title="Rename Chat"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          
          <button
            onClick={handleDeleteClick}
            type="button"
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"
            title="Delete Chat"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default ConversationItem;
