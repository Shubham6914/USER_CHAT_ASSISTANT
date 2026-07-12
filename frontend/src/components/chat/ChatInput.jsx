import { useState, useRef, useEffect } from "react";
import useChat from "../../hooks/useChat";
import useAuth from "../../hooks/useAuth";
import { uploadDocument, getDocumentStatus } from "../../services/docService";
import { queryAssistantStream } from "../../services/chatService";

function ChatInput() {
  const { activeConversation, addMessage, updateMessage } = useChat();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadStep, setUploadStep] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
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

  /**
   * BACKEND INTEGRATION: Submit Query to Assistant & Stream Responses
   * API Endpoint: POST http://127.0.0.1:8000/api/v1/documents/query
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const messageText = message.trim();
    if (!messageText || isGenerating || isUploading || !activeConversation) {
      return;
    }

    // 1. Add user message locally
    addMessage(activeConversation.id, {
      id: Date.now(),
      role: "user",
      content: messageText,
    });

    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // 2. Add placeholder bot message with "Thinking..." status
    const botMessageId = Date.now() + 1;
    addMessage(activeConversation.id, {
      id: botMessageId,
      role: "assistant",
      content: "Thinking...",
    });

    setIsGenerating(true);
    try {
      if (!user || !user.id) {
        throw new Error("You must be logged in to send messages.");
      }

      let streamedText = "";
      let hasReceivedFirstChunk = false;

      // Call assistant query streaming API in chatService.js
      await queryAssistantStream(
        user.id,
        messageText,
        (chunk) => {
          if (!hasReceivedFirstChunk) {
            hasReceivedFirstChunk = true;
            // Clear "Thinking..." placeholder and start printing chunk
            streamedText = chunk;
          } else {
            streamedText += chunk;
          }
          // Update the message bubble content in real-time (token-by-token)
          updateMessage(activeConversation.id, botMessageId, streamedText);
        },
        (sources) => {
          // Update the message bubble state with the retrieved document sources list
          updateMessage(activeConversation.id, botMessageId, { sources: sources });
        },
        () => {
          setIsGenerating(false);
        },
        (err) => {
          // Show error in the chat bubble for transparent UX feedback
          updateMessage(
            activeConversation.id,
            botMessageId,
            `⚠️ **Query failed**: ${err.message || "An unexpected error occurred while communicating with the server."}`
          );
          setIsGenerating(false);
        }
      );
    } catch (err) {
      updateMessage(
        activeConversation.id,
        botMessageId,
        `⚠️ **Query failed**: ${err.message || "An unexpected error occurred."}`
      );
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /**
   * Maps current backend processing steps and progress values to descriptive user-facing strings
   */
  const getStepDescription = (step, progress) => {
    switch (step) {
      case "document_saved":
        return `Saving document to system... (${progress}%)`;
      case "chunking":
        return `Splitting content into text segments... (${progress}%)`;
      case "embedding":
        return `Generating semantic embeddings... (${progress}%)`;
      case "vector_store":
        return `Indexing chunks in vector storage... (${progress}%)`;
      case "completed":
        return `Indexing complete! (${progress}%)`;
      default:
        return `Processing document... (${progress}%)`;
    }
  };

  /**
   * BACKEND INTEGRATION: Upload Document File & Status Polling Loop
   * API Endpoints:
   * 1. POST http://127.0.0.1:8000/api/v1/documents/upload (Uploads document, returns document_id)
   * 2. GET http://127.0.0.1:8000/api/v1/documents/status/{document_id} (Fetches progress & processing status)
   */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user || !user.id) {
      alert("You must be logged in to upload files.");
      return;
    }

    // Validate extension (only PDF and DOC/DOCX)
    const allowedExtensions = ["pdf", "doc", "docx"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      alert("Unsupported file format. Only PDF and DOC files are supported.");
      return;
    }

    // Validate size (limit to 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert("File size exceeds the 5MB limit. Please upload a smaller file.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0); // Reset progress spinner value
    setUploadStep("document_saved");
    try {
      // 1. Submit form payload to upload endpoint
      const uploadRes = await uploadDocument(user.id, file);

      // Extract document UUID
      const documentId = uploadRes.document_id || uploadRes.id || uploadRes.doc_id || uploadRes.data?.document_id;
      if (!documentId) {
        throw new Error("No document ID returned from upload endpoint.");
      }

      // 2. Poll processing status endpoint
      const pollStatus = () => {
        return new Promise((resolve, reject) => {
          const intervalId = setInterval(async () => {
            try {
              const statusRes = await getDocumentStatus(documentId);
              
              // Progress values: [20, 40, 70, 90, 100]
              const progress = statusRes.progress ?? 0;
              const step = statusRes.current_step || statusRes.currentStep || null;
              
              setUploadProgress(progress);
              setUploadStep(step);

              if (statusRes.status === "completed" || progress >= 100) {
                clearInterval(intervalId);
                resolve(statusRes);
              } else if (statusRes.status === "failed" || statusRes.error_message) {
                clearInterval(intervalId);
                reject(new Error(statusRes.error_message || "Document processing failed."));
              }
            } catch (err) {
              clearInterval(intervalId);
              reject(err);
            }
          }, 1500); // Check status every 1.5s
        });
      };

      await pollStatus();

      // 3. Append system message notifying document processing was completed
      addMessage(activeConversation.id, {
        id: Date.now(),
        role: "assistant",
        content: `📁 **Uploaded Document**: "${file.name}" has been processed successfully (100% completed) and added to the context. You can now ask questions about it!`,
      });
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      setUploadStep(null);
      // Reset input value to allow selecting same file again
      e.target.value = "";
    }
  };

  const isDisabled = !activeConversation;
  const isInputDisabled = isDisabled || isUploading || isGenerating;

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
            
            {/* Hidden but interactive native file input */}
            <input
              type="file"
              id="doc-upload-input"
              onChange={handleFileChange}
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
              accept=".pdf,.doc,.docx"
              disabled={isInputDisabled}
            />

            {/* Expanding Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isInputDisabled}
              placeholder={
                isDisabled 
                  ? "Select a workspace chat to begin writing..." 
                  : isUploading 
                    ? getStepDescription(uploadStep, uploadProgress ?? 0)
                    : isGenerating
                      ? "NexusAI is thinking..."
                      : "Message NexusAI Assistant..."
              }
              className="
                w-full resize-none bg-transparent px-3 py-1.5 text-sm
                placeholder-slate-400 dark:placeholder-zinc-550
                text-slate-800 dark:text-zinc-100 outline-none
                disabled:cursor-not-allowed min-h-[38px] max-h-[200px]
              "
            />

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-100 dark:border-zinc-900/40">
              {/* Left attachment buttons with Tooltip */}
              <div className="relative group/tooltip animate-fade-in">
                <label
                  htmlFor="doc-upload-input"
                  className={`
                    p-2 rounded-xl text-slate-400 dark:text-zinc-500
                    hover:bg-slate-200/50 dark:hover:bg-zinc-800
                    hover:text-slate-700 dark:hover:text-zinc-350
                    transition-all flex items-center justify-center
                    ${isInputDisabled
                      ? "opacity-50 pointer-events-none cursor-not-allowed" 
                      : "cursor-pointer"}
                  `}
                  title="Add attachment"
                >
                  {isUploading ? (
                    // Small progress spinner with percentage text
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <svg className="animate-spin absolute inset-0 w-full h-full text-brand-600 dark:text-brand-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.2" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-[7px] font-extrabold text-brand-700 dark:text-brand-400 z-10 select-none">
                        {uploadProgress ?? 0}%
                      </span>
                    </div>
                  ) : (
                    // Clip icon
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  )}
                </label>
                
                {/* Tooltip */}
                <div className="
                  absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block
                  z-50 pointer-events-none whitespace-nowrap rounded-lg bg-slate-900/90
                  dark:bg-zinc-800/90 text-white text-[10px] font-semibold px-2.5 py-1.5
                  shadow-md border border-slate-700/50 dark:border-zinc-700/50 backdrop-blur-sm
                  transition-all duration-200 animate-fade-in
                ">
                  Only PDF and DOC supported (Max 5MB)
                </div>
              </div>

              {/* Right submit button */}
              <button
                type="submit"
                disabled={isInputDisabled || !message.trim()}
                className={`
                  flex items-center justify-center h-8.5 w-8.5 rounded-xl transition-all duration-200 cursor-pointer
                  ${!message.trim() || isInputDisabled
                    ? "bg-slate-100 text-slate-300 dark:bg-zinc-900 dark:text-zinc-700 cursor-not-allowed"
                    : "bg-brand-600 text-white shadow-md shadow-brand-500/10 hover:bg-brand-700 active:scale-[0.96]"}
                `}
                title={isGenerating ? "Thinking..." : "Send Message"}
              >
                {isGenerating ? (
                  // Small send button spinner
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  // Send icon arrow
                  <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Small privacy notice */}
        <p className="text-[10px] text-center mt-2.5 text-slate-400 dark:text-zinc-550 select-none">
          NexusAI Assistant can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}

export default ChatInput;