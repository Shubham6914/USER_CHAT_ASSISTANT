import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/common/ThemeToggle";
import { ChatContext } from "../context/ChatContext";

function Study() {
  const navigate = useNavigate();
  const { startStudySession } = useContext(ChatContext);

  const [activeTab, setActiveTab] = useState("youtube"); // youtube | research
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [researchTopic, setResearchTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const prompt = `Please explain and generate Master Teacher study notes for this YouTube video: ${youtubeUrl.trim()}`;

    // Navigate to live chat window and trigger real backend API stream
    navigate("/chat");
    startStudySession(prompt, "YouTube Study Session");
  };

  const handleResearchSubmit = async (e) => {
    e.preventDefault();
    if (!researchTopic.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const prompt = `Please create a detailed research outline and comprehensive study guide for this topic: ${researchTopic.trim()}`;

    // Navigate to live chat window and trigger real backend API stream
    navigate("/chat");
    startStudySession(prompt, `Research: ${researchTopic.trim()}`);
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
              Study & Research AI
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">Live AI Assistant</span>
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Extract interactive study notes from YouTube tutorials or generate research guides</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Study Hub Layout */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center">
        <div className="space-y-8">

          {/* Hero Welcome Card */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Master Teacher Mode Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
              Turn YouTube Videos into Master Study Guides
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Paste any YouTube video link or search topic. Our AI agent will extract timestamps, construct cheat sheets, and generate interactive quizzes in live chat.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="max-w-md mx-auto flex rounded-2xl bg-slate-100 dark:bg-zinc-900/50 p-1 border border-slate-200/40 dark:border-zinc-900">
            <button
              onClick={() => setActiveTab("youtube")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                activeTab === "youtube"
                  ? "bg-[var(--bg-primary)] dark:bg-zinc-800 text-brand-600 dark:text-zinc-100 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube Link Analyzer
            </button>
            <button
              onClick={() => setActiveTab("research")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                activeTab === "research"
                  ? "bg-[var(--bg-primary)] dark:bg-zinc-800 text-brand-600 dark:text-zinc-100 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 113.536 0V21h2v-2.243a5 5 0 013.536 0z" />
              </svg>
              Research Outline Helper
            </button>
          </div>

          {/* Form Card */}
          <div className="max-w-2xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 shadow-lg">
            {activeTab === "youtube" ? (
              <form onSubmit={handleYoutubeSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Paste Youtube Video Link</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 dark:text-zinc-500">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </span>
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900/50 text-sm placeholder-slate-400 outline-none focus:border-emerald-500 transition-colors"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !youtubeUrl.trim()}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Launching AI Study Session...</span>
                  ) : (
                    <>
                      <span>Extract Video Insights & Start Chat</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResearchSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Research Subject / Topic</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 dark:text-zinc-500">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={researchTopic}
                      onChange={(e) => setResearchTopic(e.target.value)}
                      placeholder="e.g. Distributed Consensus Algorithms in Blockchain"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900/50 text-sm placeholder-slate-400 outline-none focus:border-emerald-500 transition-colors"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !researchTopic.trim()}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Generating Study Guide...</span>
                  ) : (
                    <>
                      <span>Generate Study Guide & Start Chat</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Quick Features List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/60 text-center space-y-1">
              <span className="text-lg">⏱️</span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Timestamp Anchors</h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Chapters mapped with exact video timestamps</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/60 text-center space-y-1">
              <span className="text-lg">📝</span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Cheat Sheets</h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">High-yield summary notes & code snippets</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/60 text-center space-y-1">
              <span className="text-lg">❓</span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Interactive Quizzes</h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Collapsible self-assessment questions</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Study;
