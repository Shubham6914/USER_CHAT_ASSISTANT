import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ThemeToggle from "../components/common/ThemeToggle";
import ChatMessage from "../components/chat/ChatMessage";
import { getUserDocuments } from "../services/docService";
import {
  getChats,
  createChat,
  deleteChat,
  loadChatMessages,
  saveUserMessage,
  createAssistantPlaceholder,
  completeAssistantMessage,
  failAssistantMessage,
  queryAssistantStream,
} from "../services/chatService";

function DocChatSession() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [document, setDocument] = useState(null);
  const [loadingDocInfo, setLoadingDocInfo] = useState(true);

  // Chat state
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const chatBottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Sample prompt suggestions for document Q&A
  const samplePrompts = [
    "Provide a detailed executive summary of this document.",
    "What are the core topics and main takeaways covered?",
    "Extract all important dates, deadlines, and key figures.",
    "List any specific requirements, action items, or policies."
  ];

  // Load target document metadata & setup chat thread
  useEffect(() => {
    const initSession = async () => {
      if (!docId) {
        navigate("/chat-with-doc");
        return;
      }

      setLoadingDocInfo(true);
      setMessagesLoading(true);

      try {
        // 1. Fetch user's documents to find the active document object
        const docsRes = await getUserDocuments();
        const foundDoc = (docsRes.documents || []).find((d) => d.doc_id === docId);

        if (!foundDoc) {
          console.error("Document not found:", docId);
          alert("Selected document was not found in your library.");
          navigate("/chat-with-doc");
          return;
        }

        setDocument(foundDoc);
        setLoadingDocInfo(false);

        // 2. Fetch or create backend chat session
        const chatsRes = await getChats();
        const docChatTitle = `[Doc] ${foundDoc.document_name}`;
        let activeChat = (chatsRes.chats || []).find(
          (c) => c.chat_title === docChatTitle && !c.is_archived
        );

        if (!activeChat) {
          activeChat = await createChat(docChatTitle);
        }

        setActiveChatId(activeChat.chat_id);

        // 3. Load chat history
        const messagesRes = await loadChatMessages(activeChat.chat_id);
        const mappedMessages = (messagesRes.messages || []).map((m) => ({
          id: m.message_id,
          role: m.role ? m.role.toLowerCase() : "user",
          content: m.content,
          status: m.status,
          sources: m.meta_data?.sources || null,
        }));
        setChatMessages(mappedMessages);
      } catch (err) {
        console.error("Failed to initialize document chat session:", err);
      } finally {
        setLoadingDocInfo(false);
        setMessagesLoading(false);
      }
    };

    initSession();
  }, [docId, navigate]);

  // Auto-scroll message list
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isGenerating]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [chatInput]);

  const handleSendMessage = async (textToSend) => {
    const text = typeof textToSend === "string" ? textToSend.trim() : chatInput.trim();
    if (!text || !activeChatId || !docId || isGenerating) return;

    setChatInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsGenerating(true);
    const chatId = activeChatId;

    try {
      // 1. Save user message in DB
      const userMsgRes = await saveUserMessage(chatId, text);
      const userMessage = {
        id: userMsgRes.message_id,
        role: "user",
        content: userMsgRes.content,
      };
      setChatMessages((prev) => [...prev, userMessage]);

      // 2. Create assistant message placeholder
      const placeholderRes = await createAssistantPlaceholder(
        chatId,
        userMsgRes.message_id
      );
      const assistantMessageId = placeholderRes.message_id;
      const assistantPlaceholder = {
        id: assistantMessageId,
        role: "assistant",
        content: "Searching document & analyzing content...",
      };
      setChatMessages((prev) => [...prev, assistantPlaceholder]);

      let streamedText = "";
      let hasReceivedFirstChunk = false;
      let sourcesList = null;

      const updateMessageState = (updates) => {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? { ...m, ...updates } : m))
        );
      };

      // 3. Call query stream with document_ids parameter
      await queryAssistantStream(
        user.id,
        text,
        chatId,
        (chunk) => {
          if (!hasReceivedFirstChunk) {
            hasReceivedFirstChunk = true;
            streamedText = chunk;
          } else {
            streamedText += chunk;
          }
          updateMessageState({ content: streamedText });
        },
        (sources) => {
          sourcesList = sources;
          updateMessageState({ sources });
        },
        async () => {
          try {
            await completeAssistantMessage(
              assistantMessageId,
              streamedText,
              sourcesList ? { sources: sourcesList } : null
            );
          } catch (e) {
            console.error("Failed to complete assistant message in database:", e);
          }
          setIsGenerating(false);
        },
        async (err) => {
          try {
            await failAssistantMessage(assistantMessageId, streamedText, {
              error: err.message || "Unknown error",
            });
          } catch (e) {
            console.error("Failed to fail assistant message in database:", e);
          }
          updateMessageState({
            content: `⚠️ **Query failed**: ${err.message || "An unexpected error occurred while communicating with the server."}`,
          });
          setIsGenerating(false);
        },
        [docId] // Filter scope
      );
    } catch (err) {
      console.error("Error sending message:", err);
      alert(`Message error: ${err.message}`);
      setIsGenerating(false);
    }
  };

  // Delete ONLY the chat session (preserving the vector document file)
  const handleDeleteChatSession = async () => {
    if (!activeChatId || isDeletingChat) return;

    setIsDeletingChat(true);
    try {
      // 1. Delete backend chat session
      await deleteChat(activeChatId);

      // 2. Create fresh new chat session for this document
      const docChatTitle = `[Doc] ${document.document_name}`;
      const newChat = await createChat(docChatTitle);

      setActiveChatId(newChat.chat_id);
      setChatMessages([]);
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Failed to delete document chat session:", err);
      alert(`Failed to delete chat session: ${err.message}`);
    } finally {
      setIsDeletingChat(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Determine file extension badge color
  const getDocBadge = (filename) => {
    const ext = filename?.split('.').pop()?.toUpperCase() || 'DOC';
    if (ext === 'PDF') return { label: 'PDF', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    if (ext === 'TXT') return { label: 'TXT', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    if (ext === 'DOC' || ext === 'DOCX') return { label: 'DOC', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    return { label: ext, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
  };

  const badge = getDocBadge(document?.document_name);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-primary)] dark:bg-zinc-950 transition-colors duration-200">
      {/* Workspace Header */}
      <header className="sticky top-0 z-40 h-16 px-4 md:px-6 border-b border-slate-200/80 dark:border-zinc-900/50 bg-[var(--bg-secondary)]/90 dark:bg-zinc-950/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <button
            onClick={() => navigate("/chat-with-doc")}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-500 hover:text-slate-700 dark:text-zinc-400 transition-colors cursor-pointer shrink-0"
            title="Back to Documents Library"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="min-w-0 flex items-center gap-2.5">
            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${badge.color} shrink-0`}>
              {badge.label}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <h1 className="text-sm font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={document?.document_name}>
                  {document?.document_name || "Document Workspace"}
                </h1>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 hidden sm:block">Dedicated Document Intelligence Workspace</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--bg-primary)] text-slate-600 dark:text-zinc-300"
            title="Toggle Document Info Sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </button>

          {/* Delete Chat Session Button */}
          {activeChatId && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Delete chat session (Document will be preserved)"
            >
              <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3 12.75h3m-3 3h3m-6-1.5h.008v.008H9v-.008zm0-3h.008v.008H9v-.008zm-3-6h6m6 0a3.375 3.375 0 003.375-3.375v-1.5m0 0a3.375 3.375 0 00-3.375-3.375H8.25" />
              </svg>
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}

          <ThemeToggle />
        </div>
      </header>

      {/* Main Split-Screen Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Document Metadata & Quick Prompts */}
        <aside className={`
          w-full md:w-80 border-r border-slate-200/80 dark:border-zinc-900/80 bg-[var(--bg-secondary)]/50 dark:bg-zinc-950/60 flex flex-col shrink-0 transition-all duration-200
          ${isSidebarOpen ? "block fixed inset-0 top-16 z-30 md:static md:z-0 bg-[var(--bg-primary)] dark:bg-zinc-950" : "hidden md:flex"}
        `}>
          <div className="p-5 space-y-6 overflow-y-auto flex-1">
            {/* Document Overview Card */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900/40 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3h7.5m-7.5-6h7.5" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate" title={document?.document_name}>
                    {document?.document_name || "Loading..."}
                  </h2>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                    {formatFileSize(document?.file_size_bytes)}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-50 dark:bg-zinc-900/60 p-2 rounded-lg">
                  <span className="text-slate-400 dark:text-zinc-500 block">Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Indexed & Ready</span>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/60 p-2 rounded-lg">
                  <span className="text-slate-400 dark:text-zinc-500 block">Scope</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">Isolated Vector</span>
                </div>
              </div>
            </div>

            {/* Quick Suggestion Prompts */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Suggested Q&A Prompts
              </span>
              <div className="space-y-2">
                {samplePrompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsSidebarOpen(false);
                      handleSendMessage(promptText);
                    }}
                    disabled={isGenerating || messagesLoading}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-[var(--bg-primary)] dark:bg-zinc-900/30 hover:border-amber-500/50 hover:bg-amber-500/5 text-xs text-slate-700 dark:text-zinc-300 transition-all cursor-pointer disabled:opacity-50"
                  >
                    💡 {promptText}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Session Control Card */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900/20 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Session Control
              </span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Clearing your chat deletes conversation history while keeping your document file saved.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer"
              >
                Delete Chat Conversation
              </button>
            </div>
          </div>
        </aside>

        {/* Right Q&A Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg-primary)] dark:bg-zinc-950">
          {/* Active Message Container */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:p-8 space-y-6">
            {messagesLoading ? (
              <div className="h-full flex flex-col items-center justify-center py-20 space-y-3">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Loading document conversation...</span>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="h-full flex flex-col justify-center max-w-xl mx-auto space-y-6 text-center animate-fade-in px-4 py-12">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3h7.5m-7.5-6h7.5" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
                    Chat with "{document?.document_name}"
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Ask questions, request summaries, or extract key data points. Every answer is retrieved directly from vector chunks of this document!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-md mx-auto pt-2">
                  {samplePrompts.slice(0, 2).map((promptText, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(promptText)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--bg-secondary)]/60 dark:bg-zinc-900/40 hover:border-amber-500/50 hover:bg-amber-500/5 text-xs text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
                    >
                      💡 {promptText}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {chatMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    sources={message.sources}
                  />
                ))}
                <div ref={chatBottomRef} />
              </div>
            )}
          </div>

          {/* Sticky Bottom Input Bar */}
          <div className="border-t border-slate-200/80 dark:border-zinc-900/80 p-4 md:p-6 bg-[var(--bg-primary)] dark:bg-zinc-950 transition-colors shrink-0">
            <div className="max-w-3xl mx-auto relative">
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
                <div className={`
                  relative flex flex-col rounded-2xl border bg-[var(--bg-secondary)]/50 dark:bg-zinc-900/35
                  transition-all duration-200 w-full p-2.5 gap-2
                  ${messagesLoading || isGenerating
                    ? "border-slate-200 dark:border-zinc-800 opacity-60 cursor-not-allowed"
                    : "border-slate-200 dark:border-zinc-800/80 focus-within:border-amber-500 dark:focus-within:border-amber-500/50 focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:bg-[var(--bg-secondary)] dark:focus-within:bg-zinc-900/60"}
                `}>
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={messagesLoading || isGenerating}
                    placeholder={
                      isGenerating
                        ? "Searching document & generating answer..."
                        : `Ask anything about "${document?.document_name || "this document"}"...`
                    }
                    className="w-full bg-transparent resize-none border-0 p-1.5 focus:ring-0 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-550 text-xs sm:text-sm focus:outline-none min-h-[32px] max-h-[150px] leading-relaxed"
                  />

                  <div className="flex items-center justify-between px-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-semibold select-none">
                        Document Scoped Context
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isGenerating || messagesLoading}
                      className={`
                        flex items-center justify-center w-8 h-8 rounded-xl cursor-pointer transition-all duration-200
                        ${!chatInput.trim() || isGenerating || messagesLoading
                          ? "bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600"
                          : "bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-500/20 active:scale-95"}
                      `}
                      title="Send Question"
                    >
                      {isGenerating ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* Modal: Delete Chat Session Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-primary)] dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                Delete Document Chat Conversation?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                This will delete your conversation history for <span className="font-semibold text-slate-800 dark:text-zinc-200">"{document?.document_name}"</span>.
                <br /><br />
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Note:</span> The document file itself will <span className="underline">NOT</span> be deleted and will remain in your library.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingChat}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChatSession}
                disabled={isDeletingChat}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                {isDeletingChat ? "Deleting..." : "Delete Chat Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocChatSession;
