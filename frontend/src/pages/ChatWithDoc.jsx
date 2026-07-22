import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ThemeToggle from "../components/common/ThemeToggle";
import ChatMessage from "../components/chat/ChatMessage";
import {
  getUserDocuments,
  uploadDocument,
  getDocumentStatus,
} from "../services/docService";
import {
  getChats,
  createChat,
  loadChatMessages,
  saveUserMessage,
  createAssistantPlaceholder,
  completeAssistantMessage,
  failAssistantMessage,
  queryAssistantStream,
} from "../services/chatService";

function ChatWithDoc() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadStep, setUploadStep] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const chatBottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch user's documents
  const fetchDocs = async (silent = false) => {
    if (!silent) setLoadingDocs(true);
    try {
      const data = await getUserDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      if (!silent) setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // Poll processing files
  useEffect(() => {
    const processingDocs = documents.filter(
      (d) => d.status === "processing" || d.status === "pending"
    );
    if (processingDocs.length === 0) return;

    const intervalId = setInterval(async () => {
      try {
        const updatedDocs = await Promise.all(
          processingDocs.map(async (doc) => {
            const statusRes = await getDocumentStatus(doc.doc_id);
            return {
              doc_id: doc.doc_id,
              status: statusRes.status,
              progress: statusRes.progress,
            };
          })
        );

        let hasChanges = false;
        const newDocs = documents.map((doc) => {
          const update = updatedDocs.find((u) => u.doc_id === doc.doc_id);
          if (update && (update.status !== doc.status || update.progress !== doc.progress)) {
            hasChanges = true;
            return { ...doc, status: update.status, progress: update.progress };
          }
          return doc;
        });

        if (hasChanges) {
          setDocuments(newDocs);
          // If the currently selected document just finished processing, update it in state too
          if (selectedDocument) {
            const currentUpdate = updatedDocs.find((u) => u.doc_id === selectedDocument.doc_id);
            if (currentUpdate) {
              setSelectedDocument((prev) => ({
                ...prev,
                status: currentUpdate.status,
                progress: currentUpdate.progress,
              }));
            }
          }
        }
      } catch (err) {
        console.error("Error polling document status:", err);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [documents, selectedDocument]);

  // Auto-scroll chat message thread
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isGenerating]);

  // Auto-resize chat textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [chatInput]);

  // Handle document upload
  const processUpload = async (file) => {
    if (!user || !user.id) {
      alert("You must be logged in to upload documents.");
      return;
    }

    const allowedExtensions = ["pdf", "doc", "docx"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      alert("Unsupported format. Only PDF, DOC, and DOCX files are allowed.");
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStep("document_saved");

    try {
      const uploadRes = await uploadDocument(user.id, file);
      const documentId = uploadRes.doc_id || uploadRes.document_id;
      if (!documentId) {
        throw new Error("Failed to retrieve document reference from server.");
      }

      // Add temporary document in state
      const tempDoc = {
        doc_id: documentId,
        document_name: file.name,
        created_at: new Date().toISOString(),
        status: "processing",
        progress: 20,
      };
      setDocuments((prev) => [tempDoc, ...prev]);

      // Poll status loop for the local loader
      const poll = () => {
        return new Promise((resolve, reject) => {
          const timer = setInterval(async () => {
            try {
              const statusRes = await getDocumentStatus(documentId);
              const progress = statusRes.progress ?? 0;
              const step = statusRes.current_step || null;

              setUploadProgress(progress);
              setUploadStep(step);

              if (statusRes.status === "completed" || progress >= 100) {
                clearInterval(timer);
                resolve(statusRes);
              } else if (statusRes.status === "failed") {
                clearInterval(timer);
                reject(new Error(statusRes.error_message || "Ingestion pipeline failure."));
              }
            } catch (err) {
              clearInterval(timer);
              reject(err);
            }
          }, 1500);
        });
      };

      await poll();
      // Sync list
      await fetchDocs(true);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
      await fetchDocs(true);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      setUploadStep(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileBrowse = (e) => {
    if (e.target.files && e.target.files[0]) {
      processUpload(e.target.files[0]);
      e.target.value = "";
    }
  };

  // Launch chat scoped to selected document
  const startChat = async (doc) => {
    if (doc.status !== "completed") return;
    setSelectedDocument(doc);
    setMessagesLoading(true);
    setChatMessages([]);
    try {
      const chatsRes = await getChats();
      const docChatTitle = `[Doc] ${doc.document_name}`;
      let activeChat = chatsRes.chats.find(
        (c) => c.chat_title === docChatTitle && !c.is_archived
      );

      if (!activeChat) {
        activeChat = await createChat(docChatTitle);
      }

      setActiveChatId(activeChat.chat_id);

      const messagesRes = await loadChatMessages(activeChat.chat_id);
      const mappedMessages = messagesRes.messages.map((m) => ({
        id: m.message_id,
        role: m.role ? m.role.toLowerCase() : "user",
        content: m.content,
        status: m.status,
        sources: m.meta_data?.sources || null,
      }));
      setChatMessages(mappedMessages);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !activeChatId || !selectedDocument || isGenerating) return;

    setChatInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsGenerating(true);
    const chatId = activeChatId;
    const docId = selectedDocument.doc_id;

    try {
      // 1. Save user message in DB
      const userMsgRes = await saveUserMessage(chatId, text);
      const userMessage = {
        id: userMsgRes.message_id,
        role: "user",
        content: userMsgRes.content,
      };
      setChatMessages((prev) => [...prev, userMessage]);

      // 2. Create assistant message placeholder (status: PENDING)
      const placeholderRes = await createAssistantPlaceholder(
        chatId,
        userMsgRes.message_id
      );
      const assistantMessageId = placeholderRes.message_id;
      const assistantPlaceholder = {
        id: assistantMessageId,
        role: "assistant",
        content: "Thinking...",
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

      // 3. Call query stream with document ID parameter
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
        [docId] // Filter scope: single-document list parameter
      );
    } catch (err) {
      console.error("Error in message flow:", err);
      alert(`Message error: ${err.message}`);
      setIsGenerating(false);
    }
  };

  const getStepText = (step, progress) => {
    switch (step) {
      case "document_saved":
        return `Saving file... (${progress}%)`;
      case "chunking":
        return `Splitting sections... (${progress}%)`;
      case "embedding":
        return `Embedding text... (${progress}%)`;
      case "vector_store":
        return `Indexing vector space... (${progress}%)`;
      case "completed":
        return `Completed! (${progress}%)`;
      default:
        return `Processing document... (${progress}%)`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] dark:bg-zinc-950 transition-colors duration-200">
      {/* Immersive Header */}
      <header className="sticky top-0 z-40 h-16 px-6 border-b border-slate-200/80 dark:border-zinc-900/50 bg-[var(--bg-secondary)]/85 dark:bg-zinc-950/85 backdrop-blur-md flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-500 hover:text-slate-700 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5">
              Document Q&A Hub
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">Sandbox</span>
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Query and analyze specific files in an isolated scope</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Split pane body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* LEFT PANEL: Document Library */}
        <div className="w-full lg:w-96 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-zinc-900/50 bg-[var(--bg-secondary)]/30 dark:bg-zinc-950/30 overflow-y-auto p-5 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Upload New Document</h2>
            
            {/* File Ingestion Card */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                dragActive
                  ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/2"
                  : "border-slate-200 dark:border-zinc-800/85 hover:border-brand-500/50 dark:hover:border-zinc-800 bg-[var(--bg-secondary)]/50 dark:bg-zinc-905/10"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileBrowse}
                disabled={isUploading}
              />
              
              {isUploading ? (
                <div className="space-y-3 py-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto animate-spin">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{getStepText(uploadStep, uploadProgress)}</p>
                    <div className="w-36 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full mx-auto overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress ?? 0}%` }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-zinc-250">Drop file or click to browse</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Supports PDF, DOC, DOCX up to 5MB</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Document List */}
          <div className="flex-1 flex flex-col space-y-2">
            <h2 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Your Documents</h2>
            {loadingDocs ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Loading Library...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 px-4 border border-slate-200/50 dark:border-zinc-900/50 rounded-2xl bg-[var(--bg-secondary)]/20">
                <span className="text-xs text-slate-400 dark:text-zinc-500">No documents found. Upload your first file to get started.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const isSelected = selectedDocument?.doc_id === doc.doc_id;
                  const isCompleted = doc.status === "completed";
                  const isProcessing = doc.status === "processing" || doc.status === "pending";
                  const isFailed = doc.status === "failed";
                  
                  return (
                    <div
                      key={doc.doc_id}
                      onClick={() => isCompleted && startChat(doc)}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                        isCompleted ? "cursor-pointer" : "opacity-80"
                      } ${
                        isSelected
                          ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/2 shadow-sm"
                          : "border-slate-250/60 dark:border-zinc-900/80 bg-[var(--bg-secondary)] dark:bg-zinc-900/35 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 hover:border-slate-300 dark:hover:border-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* File icon */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-brand-500 text-white"
                            : "bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-zinc-400"
                        }`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate pr-1" title={doc.document_name}>
                            {doc.document_name}
                          </p>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500">
                            {new Date(doc.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isCompleted && (
                          <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isSelected 
                              ? "bg-brand-500/20 text-brand-600 dark:text-brand-400"
                              : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          }`}>
                            Active
                          </div>
                        )}
                        {isProcessing && (
                          <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-[9px] font-semibold animate-pulse">
                            <span className="w-1.5 h-1.5 border border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                            {doc.progress ?? 20}%
                          </div>
                        )}
                        {isFailed && (
                          <div className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-455 text-[9px] font-semibold" title="Failed to process document">
                            Error
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Chat Workspace */}
        <div className="flex-1 flex flex-col min-w-0 relative bg-[var(--bg-primary)] dark:bg-zinc-900/10">
          {!selectedDocument ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-505 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-150 tracking-tight">Select a document to begin Q&A</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  Click on any processed document from your library on the left, or upload a new file, to start a context-isolated chat session.
                </p>
              </div>
            </div>
          ) : (
            /* Active Chat interface */
            <>
              {/* Scoped Chat Header */}
              <div className="h-14 border-b border-slate-200/80 dark:border-zinc-900/50 bg-[var(--bg-secondary)]/50 dark:bg-zinc-950/20 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider select-none shrink-0">Chatting with:</span>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate" title={selectedDocument.document_name}>
                    {selectedDocument.document_name}
                  </h3>
                </div>
                
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--bg-secondary)]/30 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-[10px] font-bold flex items-center gap-1 hover:bg-slate-50/50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close Doc
                </button>
              </div>

              {/* Chat Messages scroll area */}
              <div className="flex-1 overflow-y-auto px-4 py-6 md:p-8 space-y-6">
                {messagesLoading ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 space-y-2">
                    <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-400 dark:text-zinc-500">Loading conversation history...</span>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center max-w-xl mx-auto space-y-6 text-center animate-fade-in px-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9v6.75m1.5-6.75v6.75m1.5-6.75v6.75m1.5-6.75v6.75m1.5-6.75v6.75m-9-3.75h12" />
                      </svg>
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="text-lg font-extrabold text-slate-900 dark:text-zinc-150 tracking-tight">
                        Start Document Scoped Chat
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                        Ask any questions about this document. The model will formulate answers based solely on semantic contexts extracted from this file.
                      </p>
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

              {/* Chat Input form bar */}
              <div className="border-t border-slate-200/80 dark:border-zinc-800/80 p-4 md:p-6 bg-[var(--bg-primary)] dark:bg-zinc-950 transition-colors duration-200">
                <div className="max-w-3xl mx-auto relative">
                  <form onSubmit={handleSendMessage} className="relative">
                    <div className={`
                      relative flex flex-col rounded-2xl border bg-[var(--bg-secondary)]/50 dark:bg-zinc-900/35
                      transition-all duration-200 w-full p-2.5 gap-2
                      ${messagesLoading || isGenerating 
                        ? "border-slate-200 dark:border-zinc-800 opacity-60 cursor-not-allowed" 
                        : "border-slate-200 dark:border-zinc-800/80 focus-within:border-brand-500 dark:focus-within:border-brand-500/50 focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:bg-[var(--bg-secondary)] dark:focus-within:bg-zinc-900/60"}
                    `}>
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        disabled={messagesLoading || isGenerating}
                        placeholder={
                          isGenerating 
                            ? "Waiting for stream response..." 
                            : `Ask a question about "${selectedDocument.document_name}"...`
                        }
                        className="w-full bg-transparent resize-none border-0 p-1.5 focus:ring-0 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-550 text-xs sm:text-sm focus:outline-none min-h-[28px] max-h-[150px] leading-relaxed"
                      />

                      <div className="flex items-center justify-between px-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md font-semibold select-none">
                            Scoped Search
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={!chatInput.trim() || isGenerating || messagesLoading}
                          className={`
                            flex items-center justify-center w-8 h-8 rounded-xl cursor-pointer transition-all duration-200
                            ${!chatInput.trim() || isGenerating || messagesLoading
                              ? "bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600"
                              : "bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/15 active:scale-95"}
                          `}
                          title="Send Query"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatWithDoc;
