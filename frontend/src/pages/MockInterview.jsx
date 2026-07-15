import { useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/common/ThemeToggle";

function MockInterview() {
  const [step, setStep] = useState(1); // 1: config, 2: active, 3: feedback
  const [jobTitle, setJobTitle] = useState("Frontend Engineer");
  const [difficulty, setDifficulty] = useState("Mid-level");
  const [focus, setFocus] = useState("Technical");

  // Simulation states
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState(["", "", ""]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingIntervalId, setRecordingIntervalId] = useState(null);

  // Mock questions mapping
  const interviewQuestions = {
    "Frontend Engineer": [
      "Explain the event loop in JavaScript. How does call stack execution manage macro-tasks and micro-tasks?",
      "How would you optimize a heavy React dashboard component that triggers frequent re-renders?",
      "Describe how you handle state management across client-side page views and server-rendered blocks."
    ],
    "Product Manager": [
      "How do you prioritize features on a product roadmap when there are multiple competing stakeholder demands?",
      "Explain a time when a product launch failed. What did you learn and how did you iterate?",
      "How would you design a metric system to measure success for a new AI-powered search feature?"
    ],
    "Data Scientist": [
      "What is overfitting in machine learning models? How do you diagnose it and what steps resolve it?",
      "Describe the difference between bagging and boosting algorithms. When would you use which?",
      "How would you build an AB testing framework for an e-commerce checkout flow?"
    ],
    "Fullstack Developer": [
      "How would you design a distributed session caching layer for an application deployed across multiple cloud regions?",
      "Compare SQL databases (e.g. Postgres) and NoSQL databases (e.g. MongoDB). What are the main ACID tradeoffs?",
      "How do you handle API request security, validation, and token rotations inside middleware?"
    ]
  };

  const getQuestions = () => {
    return interviewQuestions[jobTitle] || interviewQuestions["Frontend Engineer"];
  };

  const handleStartInterview = () => {
    setStep(2);
    setCurrentQuestionIdx(0);
    setUserAnswers(["", "", ""]);
    setCurrentAnswer("");
  };

  const handleMicToggle = () => {
    if (isRecording) {
      clearInterval(recordingIntervalId);
      setIsRecording(false);
      setRecordingSeconds(0);
      // Simulate speech to text insertion
      const speechMocks = [
        "In JavaScript, the event loop handles asynchronous callbacks. The call stack executes functions sequentially. Micro-tasks like Promise resolutions are executed before macro-tasks like setTimeout callbacks are polled from the task queue.",
        "To optimize a React dashboard, I would memoize complex calculations using useMemo, encapsulate local states, implement virtualized scrolling for large tables, and audit re-renders using Profiler.",
        "For global state management, I prefer using Context API for configuration variables, Zustand for local client-side states, and React Query or RTK Query to cache server states."
      ];
      setCurrentAnswer((prev) => (prev ? prev + " " : "") + (speechMocks[currentQuestionIdx] || "Captured spoken interview response..."));
    } else {
      setIsRecording(true);
      const id = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      setRecordingIntervalId(id);
    }
  };

  const handleNextQuestion = () => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIdx] = currentAnswer.trim() || "No response provided.";
    setUserAnswers(updatedAnswers);

    const questions = getQuestions();
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setCurrentAnswer("");
    } else {
      setStep(3);
    }
  };

  // Mock feedback metrics generator
  const getFeedbackReport = () => {
    const questions = getQuestions();
    const mockCritiques = [
      {
        q: questions[0],
        answer: userAnswers[0],
        score: 86,
        strengths: "Clear description of micro-tasks and execution sequencing.",
        weaknesses: "Could elaborate slightly on the role of Web APIs (DOM, fetch) in relation to runtime worker loops.",
        ideal: "The event loop continuously checks if call stack is empty. If it is, it dequeues pending microtasks (Promises, queueMicrotask) and runs them completely, then pulls macrotasks (setTimeout, event listeners) one by one."
      },
      {
        q: questions[1],
        answer: userAnswers[1],
        score: 84,
        strengths: "Identified useMemo, React profiling utilities, and list virtualization as core strategies.",
        weaknesses: "Did not mention lazy loading components or state hoisting options.",
        ideal: "Identify render triggers, apply React.memo or split subcomponents, leverage useMemo/useCallback for complex objects/handlers, implement list virtualization (e.g. react-window), and transition state boundaries downwards."
      },
      {
        q: questions[2],
        answer: userAnswers[2],
        score: 82,
        strengths: "Structured analysis of Context API for UI states and asynchronous query caching layers.",
        weaknesses: "Omitted hydration concerns in Server Side Rendering (SSR) environments.",
        ideal: "Differentiate client and server states. Use hooks like useOptimistic, server-caching mechanisms, and sync client stores locally using localStorage hydrate models with boundary guards."
      }
    ];

    const overallScore = Math.round((mockCritiques[0].score + mockCritiques[1].score + mockCritiques[2].score) / 3);

    return { overallScore, critiques: mockCritiques };
  };

  const report = step === 3 ? getFeedbackReport() : null;

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
              AI Mock Interviewer
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">Sandbox</span>
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Practice custom interview domains and check evaluation matrices</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Primary Simulator Workspace */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 relative z-10 flex flex-col justify-center">
        
        {/* STEP 1: CONFIGURATION */}
        {step === 1 && (
          <div className="glass-panel p-8 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 shadow-md space-y-6 max-w-xl mx-auto w-full animate-fade-in">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100">Setup Interview Session</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Configure parameters to customize the AI Interviewer character focus</p>
            </div>

            <div className="space-y-4">
              {/* Job Title Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Target Job Role</label>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="Frontend Engineer">Frontend Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Fullstack Developer">Fullstack Developer</option>
                </select>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Candidate Level</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {["Junior", "Mid-level", "Senior"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                        difficulty === lvl
                          ? "bg-rose-500 text-white border-rose-500"
                          : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview Focus */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Evaluation Domain</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {["Technical", "Behavioral", "System Design"].map((foc) => (
                    <button
                      key={foc}
                      type="button"
                      onClick={() => setFocus(foc)}
                      className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                        focus === foc
                          ? "bg-rose-500 text-white border-rose-500"
                          : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      {foc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition-colors cursor-pointer"
            >
              Enter Live Interview Room
            </button>
          </div>
        )}

        {/* STEP 2: ACTIVE SIMULATION */}
        {step === 2 && (
          <div className="glass-panel p-8 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 shadow-md space-y-6 animate-fade-in relative overflow-hidden">
            {/* Header / Interviewer avatar card */}
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-zinc-900/50 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 text-white font-black flex items-center justify-center text-sm shadow-md">
                SR
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-150">Sophia - Principal Recruiter</h3>
                <span className="text-[10px] text-emerald-500 font-semibold tracking-wider uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Active Voice Connection
                </span>
              </div>
            </div>

            {/* Question Screen */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-zinc-500">
                <span>QUESTION {currentQuestionIdx + 1} OF 3</span>
                <span className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">
                  {focus}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-205 dark:border-zinc-800">
                <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-100 leading-relaxed">
                  "{getQuestions()[currentQuestionIdx]}"
                </p>
              </div>

              {/* Answer input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Your Written Response</label>
                  
                  {/* Microphone speech trigger simulation */}
                  <button
                    onClick={handleMicToggle}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                      isRecording
                        ? "bg-red-500 text-white border-red-500 animate-pulse"
                        : "bg-white dark:bg-zinc-900 border-slate-250 dark:border-zinc-800 text-slate-500 hover:text-slate-700 dark:text-zinc-400"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span>{isRecording ? `Recording Audio (${recordingSeconds}s)...` : "Simulate Audio Answer"}</span>
                  </button>
                </div>

                {isRecording && (
                  <div className="flex justify-center items-center gap-1 py-1.5">
                    {[1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1].map((val, idx) => (
                      <span
                        key={idx}
                        className="w-0.5 bg-red-500 rounded-full transition-all"
                        style={{ height: `${val * 3}px`, animation: "pulse 1s infinite", animationDelay: `${idx * 0.1}s` }}
                      />
                    ))}
                  </div>
                )}

                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your comprehensive response to the question here..."
                  className="w-full h-36 px-4 py-3 rounded-2xl border border-slate-205 dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900/30 text-xs sm:text-sm text-slate-800 dark:text-zinc-200 outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleNextQuestion}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
            >
              {currentQuestionIdx < 2 ? "Submit Answer & Next Question" : "Complete & Generate Evaluation"}
            </button>
          </div>
        )}

        {/* STEP 3: DETAILED EVALUATION REPORT */}
        {step === 3 && report && (
          <div className="glass-panel p-8 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 shadow-md space-y-8 animate-fade-in">
            {/* Top diagnostic dashboard */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-slate-100 dark:border-zinc-900/50 pb-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="px-2.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Evaluation Ready</span>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100 mt-1">Interview Diagnostic Report</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Calculated metrics for: {jobTitle} • Focus: {focus}</p>
              </div>

              {/* Score Dial */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-rose-500/20 border-r-rose-500 flex items-center justify-center font-black text-slate-800 dark:text-zinc-150 text-xl shadow-inner relative">
                  {report.overallScore}%
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Candidate Grade</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">B+ (Ready for Review)</span>
                </div>
              </div>
            </div>

            {/* Critique accordion lists */}
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Question Audit Details</h3>
              
              <div className="space-y-4">
                {report.critiques.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-205 dark:border-zinc-800 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 leading-snug">
                        <span className="text-rose-600 dark:text-rose-400 font-mono mr-1.5">Q{idx + 1}:</span>
                        "{item.q}"
                      </p>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 shrink-0">
                        {item.score}% score
                      </span>
                    </div>

                    <div className="space-y-2 border-t border-slate-200/40 dark:border-zinc-800 pt-3 text-xs">
                      <div>
                        <span className="font-extrabold text-slate-400 dark:text-zinc-500 uppercase text-[9px] block">Your Answer:</span>
                        <p className="italic text-slate-600 dark:text-zinc-400 mt-0.5">"{item.answer}"</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[9px] uppercase tracking-wider">Strengths</span>
                          <p className="text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">{item.strengths}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                          <span className="font-bold text-amber-600 dark:text-amber-400 block text-[9px] uppercase tracking-wider">Areas to Improve</span>
                          <p className="text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">{item.weaknesses}</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="font-extrabold text-slate-400 dark:text-zinc-500 uppercase text-[9px] block">Ideal / Model Reference:</span>
                        <p className="text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-205 dark:border-zinc-900">{item.ideal}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
              >
                Simulate New Interview Session
              </button>
              <Link
                to="/"
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-center font-bold text-xs sm:text-sm transition-all"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}

export default MockInterview;
