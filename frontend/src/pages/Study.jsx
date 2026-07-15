import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/common/ThemeToggle";

function Study() {
  const [activeTab, setActiveTab] = useState("youtube"); // youtube | research
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [researchTopic, setResearchTopic] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [hasResult, setHasResult] = useState(false);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(null);

  // Study Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I'm your Nexus Study Buddy. Paste a YouTube link or search a research topic to get started, and you can ask me anything about the content!" }
  ]);
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatTyping]);

  const handleYoutubeSubmit = (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setIsAnalyzing(true);
    setAnalysisStep(1);
    setHasResult(false);
    setSelectedQuizAnswer(null);
    setQuizScore(null);

    // Simulated multi-stage analysis pipeline
    setTimeout(() => {
      setAnalysisStep(2);
      setTimeout(() => {
        setAnalysisStep(3);
        setTimeout(() => {
          setIsAnalyzing(false);
          setHasResult(true);
          // Add system note to chat
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: `I've analyzed the video: **"React 19 Hooks & Server Components Complete Guide"**. Ask me anything about virtual DOM deprecation, compiler hooks, useActionState, or the new use() API!` }
          ]);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleResearchSubmit = (e) => {
    e.preventDefault();
    if (!researchTopic.trim()) return;

    setIsAnalyzing(true);
    setAnalysisStep(1);
    setHasResult(false);

    setTimeout(() => {
      setAnalysisStep(2);
      setTimeout(() => {
        setIsAnalyzing(false);
        setHasResult(true);
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: `I've prepared a comprehensive study outline on **"${researchTopic}"**. I can explain specific subsections, suggest additional research methodologies, or detail the key references!` }
        ]);
      }, 1200);
    }, 1000);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsChatTyping(true);

    setTimeout(() => {
      setIsChatTyping(false);
      let reply = "That's an interesting question! Based on my current knowledge base, this topic relates to core design guidelines and architecture optimization. Can you tell me more about what you're working on?";
      
      // Contextual replies if video or topic is loaded
      if (activeTab === "youtube" && hasResult) {
        if (userMsg.toLowerCase().includes("compiler") || userMsg.toLowerCase().includes("forget")) {
          reply = "The **React Compiler** (formerly React Forget) automatically memoizes components, hooks, and variables. In React 19, you no longer need `useMemo` or `useCallback` for performance optimizations, as the compiler does it at compile-time by detecting dependency trees.";
        } else if (userMsg.toLowerCase().includes("action") || userMsg.toLowerCase().includes("form")) {
          reply = "React 19 introduces **Actions** to handle pending states, errors, and async actions automatically. Form elements now support passing async functions directly to the `action` prop, and `useActionState` manages form submission status seamlessly.";
        } else {
          reply = "Based on the React 19 guide video, this represents a significant shift. The video highlights how the introduction of Actions, `useActionState`, the `use()` hook for promises/contexts, and resource loading APIs make React apps much more declarative. Let me know if you want me to explain any of these hooks in detail!";
        }
      } else if (activeTab === "research" && hasResult) {
        reply = `For the research topic "${researchTopic}", the core challenges lie in balancing performance constraints and scalability. The literature suggests implementing modular microservice systems, deploying cached middleware architectures, and auditing code complexity patterns. I recommend focusing your methodology chapter on these empirical comparisons.`;
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    }, 1500);
  };

  // Mock quiz checking
  const handleQuizAnswer = (idx) => {
    setSelectedQuizAnswer(idx);
    if (idx === 2) {
      setQuizScore("correct");
    } else {
      setQuizScore("incorrect");
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
              Study & Research AI
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">Sandbox</span>
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Extract insights from videos and structure study guides</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Study Hub Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* Left Panel: Inputs & Output summaries */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 lg:border-r lg:border-slate-200/85 lg:dark:border-zinc-900/50">
          
          {/* Tab Navigation */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-zinc-900/50 p-1 border border-slate-200/40 dark:border-zinc-900">
            <button
              onClick={() => { setActiveTab("youtube"); setHasResult(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                activeTab === "youtube"
                  ? "bg-[var(--bg-primary)] dark:bg-zinc-800 text-brand-600 dark:text-zinc-100 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              YouTube Link Analyzer
            </button>
            <button
              onClick={() => { setActiveTab("research"); setHasResult(false); }}
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

          {/* Form Block */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-zinc-800/80 shadow-sm">
            {activeTab === "youtube" ? (
              <form onSubmit={handleYoutubeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Paste Youtube URL</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 dark:text-zinc-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </span>
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="e.g. https://www.youtube.com/watch?v=kCc8FmEb1nY"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-205 dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900/30 text-xs placeholder-slate-400 outline-none focus:border-brand-500 transition-colors"
                      disabled={isAnalyzing}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isAnalyzing ? "Analyzing Video Resource..." : "Extract Video Insights"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResearchSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Research Subject / Topic</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 dark:text-zinc-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={researchTopic}
                      onChange={(e) => setResearchTopic(e.target.value)}
                      placeholder="e.g. Distributed Consensus Systems in Blockchain"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-205 dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900/30 text-xs placeholder-slate-400 outline-none focus:border-brand-500 transition-colors"
                      disabled={isAnalyzing}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isAnalyzing ? "Creating Study Plan..." : "Generate Study Outline"}
                </button>
              </form>
            )}
          </div>

          {/* Loading Animation States */}
          {isAnalyzing && (
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 text-center space-y-4">
              <div className="inline-block relative w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                  {analysisStep === 1 && "Fetching raw source data streams..."}
                  {analysisStep === 2 && "Extracting audio transcription & semantic references..."}
                  {analysisStep === 3 && "Synthesizing executive summaries and takeaways..."}
                </p>
                <div className="w-48 h-1.5 bg-slate-100 dark:bg-zinc-950 rounded-full mx-auto overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                    style={{ width: `${(analysisStep / 3) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* RESULTS DISPLAY PANEL */}
          {hasResult && !isAnalyzing && (
            <div className="space-y-6 animate-fade-in">
              {activeTab === "youtube" ? (
                <>
                  {/* YouTube Summary View */}
                  <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 space-y-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Analysis Complete</span>
                        <h2 className="text-lg font-extrabold text-slate-800 dark:text-zinc-150 mt-1.5 leading-snug">React 19 Hooks & Server Components Complete Guide</h2>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                          <span>Duration: 22m 14s</span>
                          <span>•</span>
                          <span>Source: YouTube Video</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-zinc-900/50 pt-4 space-y-3">
                      <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Executive Summary</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                        This tutorial is a comprehensive deep dive into the official APIs introduced in React 19. It focuses on the deprecation of traditional memoization utilities in favor of the React Compiler (React Forget), describes asynchronous action state management natively integrated inside Forms, explains the unified resources hook `use()`, and covers the server component lifecycle.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Key Takeaways</h3>
                      <ul className="space-y-2">
                        {[
                          "React Compiler memoizes automatically without useMemo/useCallback.",
                          "useActionState hook replaces form loading/pending state states seamlessly.",
                          "The new use() hook handles promises and React Context dynamically inside loops or conditionals.",
                          "Form Actions can take async handlers to trigger background transitions."
                        ].map((takeaway, idx) => (
                          <li key={idx} className="flex gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 items-start">
                            <span className="mt-1 flex items-center justify-center w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[10px] font-bold text-emerald-600 shrink-0">{idx + 1}</span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Interactive Quiz Module */}
                    <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-205 dark:border-zinc-800 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200">Interactive Quiz: Test Your Understanding</h4>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-semibold">1 Question</span>
                      </div>
                      
                      <p className="text-xs font-semibold text-slate-800 dark:text-zinc-150">
                        Q: Which React 19 hook allows you to handle loading, errors, and asynchronous actions in forms out-of-the-box?
                      </p>

                      <div className="grid grid-cols-1 gap-2.5">
                        {["useAsyncCallback", "useFormStatus", "useActionState", "useTransitionState"].map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuizAnswer(idx)}
                            className={`text-left p-2.5 rounded-xl text-xs font-medium border cursor-pointer transition-colors ${
                              selectedQuizAnswer === idx
                                ? idx === 2
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                  : "bg-red-50 dark:bg-red-950/20 border-red-500 text-red-600 dark:text-red-400"
                                : "bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-350"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      {quizScore && (
                        <div className={`p-3 rounded-xl border text-xs font-semibold ${
                          quizScore === "correct"
                            ? "bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-200 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-50/80 dark:bg-red-950/25 border-red-200 text-red-700 dark:text-red-400"
                        }`}>
                          {quizScore === "correct" 
                            ? "Correct! useActionState manages actions, pending actions, and response data natively in React 19."
                            : "Incorrect. Try selecting useActionState, which is the React 19 API replacing manually controlled loading spinners in Forms."
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accordion Transcript */}
                  <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Semantic Transcript (Highlights)</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {[
                        { time: "00:15", text: "React 19 changes things significantly. First, let's talk about compiling..." },
                        { time: "03:40", text: "With the compiler active, the old useMemo hooks are entirely redundant. The codebase becomes clean." },
                        { time: "08:12", text: "Next, forms! Let's explore Action handlers. We can pass async handlers to form tags." },
                        { time: "14:20", text: "Lastly, useActionState yields error and pending values directly. Loading indicators become trivial." }
                      ].map((seg, idx) => (
                        <div key={idx} className="flex gap-3 text-xs items-start py-1.5 border-b border-slate-100/50 dark:border-zinc-900/30 last:border-0">
                          <span className="font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-1.5 py-0.5 rounded shrink-0">{seg.time}</span>
                          <span className="text-slate-600 dark:text-zinc-400">{seg.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Research Outline View */}
                  <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 space-y-5">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Study Guide Active</span>
                      <h2 className="text-lg font-extrabold text-slate-800 dark:text-zinc-150 mt-1.5">Study Syllabus: {researchTopic}</h2>
                    </div>

                    <div className="border-t border-slate-100 dark:border-zinc-900/50 pt-4 space-y-4">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">1. Core Research Questions</h4>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                          - How do existing models address consistency and latency trade-offs?<br />
                          - What are the major computational overhead considerations under peak loading?
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">2. Suggested Thesis Structure</h4>
                        <ol className="list-decimal pl-4 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 space-y-1">
                          <li>Literature Review: History, paradigms, and state of the art.</li>
                          <li>Empirical Methodology: Testing configurations and performance metrics.</li>
                          <li>Comparative Analysis: Data evaluations and benchmark results.</li>
                        </ol>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">3. References & Key Citations</h4>
                        <div className="space-y-2">
                          {[
                            { author: "Lamport, L. (1978)", title: "Time, Clocks, and the Ordering of Events in a Distributed System." },
                            { author: "Castro, M., & Liskov, B. (2002)", title: "Practical Byzantine Fault Tolerance and Proactive Recovery." }
                          ].map((ref, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-205 dark:border-zinc-800 text-xs">
                              <span className="font-bold text-slate-700 dark:text-zinc-300 block">{ref.author}</span>
                              <span className="italic text-slate-500 dark:text-zinc-400">{ref.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Interactive Study Companion Chat */}
        <div className="w-full lg:w-96 flex flex-col h-[500px] lg:h-auto border-t lg:border-t-0 border-slate-200/85 lg:dark:border-zinc-900/50 bg-[var(--bg-secondary)]/30 dark:bg-zinc-950/20">
          {/* Header */}
          <div className="p-4 border-b border-slate-200/80 dark:border-zinc-900/50 flex items-center justify-between bg-[var(--bg-secondary)] dark:bg-zinc-950 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-150">Study Assistant AI</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">Session Chat</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div className={`rounded-2xl px-3.5 py-2.5 text-xs ${
                  msg.role === "user"
                    ? "bg-brand-600 text-white rounded-br-none"
                    : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 border border-slate-200/50 dark:border-zinc-800/80 rounded-bl-none shadow-sm"
                }`}>
                  {/* Handle very basic markdown-like bold text representation */}
                  {msg.content.split("**").map((part, index) => 
                    index % 2 === 1 ? <strong key={index} className="font-bold">{part}</strong> : part
                  )}
                </div>
              </div>
            ))}
            
            {isChatTyping && (
              <div className="mr-auto max-w-[85%] items-start">
                <div className="rounded-2xl px-3.5 py-2.5 text-xs bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 border border-slate-200/50 dark:border-zinc-800/80 rounded-bl-none shadow-sm flex items-center gap-1.5">
                  <span>Assistant is thinking</span>
                  <span className="streaming-cursor"></span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input field */}
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-200/80 dark:border-zinc-900/50 bg-[var(--bg-secondary)] dark:bg-zinc-950 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about hooks, thesis outline..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-205 dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 placeholder-slate-400 outline-none focus:border-brand-500 transition-colors"
                disabled={isChatTyping}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatTyping}
                className="px-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </form>

        </div>

      </div>

    </div>
  );
}

export default Study;
