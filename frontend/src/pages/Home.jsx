import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ThemeToggle from "../components/common/ThemeToggle";

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Mock dashboard data
  const stats = [
    { label: "Study Hub Usage", value: "14.5 hrs", desc: "This week", color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Mock Interviews", value: "8 Sessions", desc: "Avg. Score: 84%", color: "text-rose-500 bg-rose-500/10" },
    { label: "ATS Resume Match", value: "78%", desc: "Target: Software Engineer", color: "text-indigo-500 bg-indigo-500/10" },
  ];

  const recentActivity = [
    { text: "Mock Interview (Frontend Developer) completed", time: "2 hours ago", status: "88% score" },
    { text: "Analyzed video 'Next.js 15 Routing Architecture'", time: "Yesterday", status: "Summarized" },
    { text: "Updated master resume & scanned against ATS rules", time: "3 days ago", status: "78% match" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] dark:bg-zinc-950 transition-colors duration-200">
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-40 h-16 px-6 border-b border-slate-200/80 dark:border-zinc-900/50 bg-[var(--bg-secondary)]/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/25">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">NexusAI Portal</span>
            <span className="ml-2 px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-[10px] font-bold text-brand-700 dark:text-brand-400">Workspace</span>
          </div>
        </div>

        {/* User profile details & controls */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800">
            <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white text-xs font-bold flex items-center justify-center">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">{user?.name}</span>
          </div>

          <button
            onClick={handleLogout}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold cursor-pointer transition-colors duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Decorative ambient background glows */}
      <div className="absolute top-24 left-1/4 w-96 h-96 rounded-full bg-brand-500/5 dark:bg-brand-500/2 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 dark:bg-emerald-500/2 blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Main Dashboard Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 relative z-10 space-y-8">
        
        {/* Welcome Section */}
        <section className="glass-panel p-8 rounded-3xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
              {greeting}, <span className="text-brand-600 dark:text-brand-400">{user?.name || "Academic Pro"}</span>! 👋
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 max-w-xl text-sm sm:text-base leading-relaxed">
              Your NexusAI suite is ready. Access your chat agent, organize academic studies, simulate live job interviews, or optimize your resume from one integrated workspace.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/chat"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Chat with Nexus</span>
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-200 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span>
            Nexus Suite Services
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* CARD 1: Chat with Nexus */}
            <div className="group relative glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-zinc-800/80 hover:border-brand-500/40 dark:hover:border-brand-500/30 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-full group-hover:bg-brand-500/10 transition-all duration-300" />
              <div>
                {/* Icon wrapper */}
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-slate-800 dark:text-zinc-150 text-base tracking-tight">Chat with Nexus</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">Live</span>
                </div>
                <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                  Intelligent chatbot for custom tasks. Brainstorm copy, write code, search history, and review document uploads instantly.
                </p>
              </div>
              <Link
                to="/chat"
                className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all duration-200 cursor-pointer"
              >
                <span>Launch Assistant</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* CARD 2: Study & Research */}
            <div className="group relative glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-zinc-800/80 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-all duration-300" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-slate-800 dark:text-zinc-150 text-base tracking-tight">Study & Research</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">Sandbox</span>
                </div>
                <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                  Paste YouTube URLs to analyze content, read interactive transcripts, generate flashcard quizzes, or run research queries.
                </p>
              </div>
              <Link
                to="/study"
                className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all duration-200 cursor-pointer"
              >
                <span>Enter Study Lab</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* CARD 3: Mock Interview Prep */}
            <div className="group relative glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-zinc-800/80 hover:border-rose-500/40 dark:hover:border-rose-500/30 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full group-hover:bg-rose-500/10 transition-all duration-300" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-slate-800 dark:text-zinc-150 text-base tracking-tight">Mock Interview</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">Sandbox</span>
                </div>
                <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                  Simulate tech or behavioral interviews. Type answers to standard questions and receive score breakdowns and model comparisons.
                </p>
              </div>
              <Link
                to="/mock-interview"
                className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all duration-200 cursor-pointer"
              >
                <span>Start Practice</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* CARD 4: Resume Analyzer */}
            <div className="group relative glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-zinc-800/80 hover:border-violet-500/40 dark:hover:border-violet-500/30 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full group-hover:bg-violet-500/10 transition-all duration-300" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 dark:bg-violet-500/5 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-slate-800 dark:text-zinc-150 text-base tracking-tight">ATS Scanner</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">Sandbox</span>
                </div>
                <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                  Upload mock resumes, provide a job posting description, and audit your compatibility rating and keyword omissions.
                </p>
              </div>
              <Link
                to="/resume-review"
                className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-violet-500/5 dark:bg-violet-500/10 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 text-violet-600 dark:text-violet-400 text-xs font-bold transition-all duration-200 cursor-pointer"
              >
                <span>Scan Resume</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

          </div>
        </section>

        {/* Dashboard Panels & Analytics */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Recent Activity / Feed */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-150 tracking-tight">Recent Session Activities</h3>
              
              <div className="divide-y divide-slate-100 dark:divide-zinc-900/50">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-1 w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-200 truncate">{activity.text}</p>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">{activity.time}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-205 dark:border-zinc-800 shrink-0">
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-900/50 mt-4 text-center">
              <span className="text-xs text-slate-400 dark:text-zinc-500">Activities automatically synced with Nexus LocalStorage DB</span>
            </div>
          </div>

          {/* Column 3: Stats Dashboard */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 space-y-5">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-150 tracking-tight">Personal Metrics</h3>
            
            <div className="space-y-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200/40 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/25 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                    <p className="text-lg font-extrabold text-slate-800 dark:text-zinc-100">{stat.value}</p>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">{stat.desc}</span>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.color} font-bold text-xs shrink-0`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

      </main>

      {/* Modern minimal footer */}
      <footer className="py-6 border-t border-slate-200/60 dark:border-zinc-900/50 text-center text-xs text-slate-400 dark:text-zinc-600 transition-colors">
        <span>Powered by NexusAI Engine • Running in Offline Developer Sandbox</span>
      </footer>
    </div>
  );
}

export default Home;
