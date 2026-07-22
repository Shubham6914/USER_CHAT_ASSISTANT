import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ThemeToggle from "../components/common/ThemeToggle";
import {
  getUserDocuments,
  uploadDocument,
  getDocumentStatus,
} from "../services/docService";

function DocumentHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadStep, setUploadStep] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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
        }
      } catch (err) {
        console.error("Error polling document status:", err);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [documents]);

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

      const tempDoc = {
        doc_id: documentId,
        document_name: file.name,
        created_at: new Date().toISOString(),
        status: "processing",
        progress: 20,
      };
      setDocuments((prev) => [tempDoc, ...prev]);

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
      {/* Navigation Header */}
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
              Document Center
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">Library</span>
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Upload new files or select a document to start a dedicated chat session</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Upload Widget Header Card */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">Upload New Document</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Upload PDF, DOC, or DOCX files up to 5MB. Files are automatically chunked, embedded, and indexed into your private vector store.
            </p>
          </div>

          {/* Drag & Drop Card */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/2"
                : "border-slate-250 dark:border-zinc-800 hover:border-amber-500/60 dark:hover:border-amber-500/40 bg-[var(--bg-secondary)]/50 dark:bg-zinc-900/30"
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
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto animate-spin">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{getStepText(uploadStep, uploadProgress)}</p>
                  <div className="w-48 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress ?? 0}%` }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-zinc-150">Drag & drop your file here, or browse</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Supports PDF, DOC, DOCX files up to 5MB</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Document Library Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-zinc-150 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Your Document Library ({documents.length})
            </h2>
          </div>

          {loadingDocs ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Loading document library...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-16 px-4 border border-slate-200/60 dark:border-zinc-800/60 rounded-3xl bg-[var(--bg-secondary)]/30 space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">No documents found</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto">
                Upload your first document using the dropzone above to start asking targeted AI questions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => {
                const isCompleted = doc.status === "completed";
                const isProcessing = doc.status === "processing" || doc.status === "pending";
                const isFailed = doc.status === "failed";

                return (
                  <div
                    key={doc.doc_id}
                    className="group glass-panel rounded-3xl p-6 border border-slate-200/60 dark:border-zinc-800/80 hover:border-amber-500/40 dark:hover:border-amber-500/30 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top row: Icon and Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>

                        {/* Status Badge */}
                        {isCompleted && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                            Processed
                          </span>
                        )}
                        {isProcessing && (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 animate-pulse">
                            <span className="w-1.5 h-1.5 border border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                            {doc.progress ?? 20}%
                          </span>
                        )}
                        {isFailed && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                            Failed
                          </span>
                        )}
                      </div>

                      {/* File Details */}
                      <div>
                        <h3 className="font-extrabold text-slate-800 dark:text-zinc-150 text-base tracking-tight truncate" title={doc.document_name}>
                          {doc.document_name}
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                          Uploaded {new Date(doc.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-900">
                      {isCompleted ? (
                        <button
                          onClick={() => navigate(`/chat-with-doc/${doc.doc_id}`)}
                          className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-600 hover:text-white dark:bg-amber-500/10 dark:hover:bg-amber-600 text-amber-600 dark:text-amber-400 font-bold text-xs transition-all duration-200 cursor-pointer"
                        >
                          <span>Start Chat</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600 font-bold text-xs cursor-not-allowed text-center"
                        >
                          {isProcessing ? "Processing File..." : "Unavailable"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DocumentHub;
