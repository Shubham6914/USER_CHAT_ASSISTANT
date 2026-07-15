import { useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/common/ThemeToggle";

function ResumeReview() {
  const [jobDescription, setJobDescription] = useState("");
  const [mockFile, setMockFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setMockFile(e.target.files[0]);
    }
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!mockFile && !jobDescription.trim()) return;

    setIsScanning(true);
    setHasScanned(false);

    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] dark:bg-zinc-950 transition-colors duration-200">
      
      {/* Header */}
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
              AI Resume Analyzer
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">Sandbox</span>
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Scan and audit CV formatting metrics against target job listings</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Upload Panel */}
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-zinc-200 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
            ATS Analysis Engine
          </h2>

          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 shadow-sm space-y-5">
            <form onSubmit={handleScanSubmit} className="space-y-5">
              
              {/* File Dropzone Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Upload Mock Resume</label>
                
                <div className="border-2 border-dashed border-slate-250 dark:border-zinc-800 hover:border-violet-500 dark:hover:border-violet-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-[var(--bg-primary)]/50 dark:bg-zinc-900/10">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        {mockFile ? mockFile.name : "Drag & drop your resume file here"}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-0.5">Supports PDF, DOCX, TXT up to 5MB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Description input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Paste Target Job Posting Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job requirements details here to calculate keywords overlap score..."
                  className="w-full h-40 px-4 py-3 rounded-2xl border border-slate-205 dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900/30 text-xs sm:text-sm text-slate-800 dark:text-zinc-200 outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isScanning || (!mockFile && !jobDescription.trim())}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-violet-500/20 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {isScanning ? "Processing ATS Keywords Scanner..." : "Analyze and Score CV"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Scan Results Panel */}
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-zinc-200 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse"></span>
            Feedback Reports
          </h2>

          {isScanning && (
            <div className="glass-panel p-8 rounded-3xl border border-violet-500/20 text-center space-y-4">
              <div className="inline-block relative w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Parsing document outline and layout margins...</p>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-1">Measuring target keywords density matrix</span>
              </div>
            </div>
          )}

          {!hasScanned && !isScanning && (
            <div className="glass-panel p-8 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 text-center py-16 text-slate-400 dark:text-zinc-500 space-y-2">
              <svg className="w-12 h-12 stroke-current mx-auto opacity-45" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <div>
                <p className="text-xs font-bold">No Audit Report Generated</p>
                <span className="text-[10px] block mt-0.5">Upload a file and supply a job posting to view analysis diagnostics</span>
              </div>
            </div>
          )}

          {hasScanned && !isScanning && (
            <div className="space-y-6 animate-fade-in">
              {/* ATS Core score card */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950 text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Report Generated</span>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-100 mt-1">ATS Compatibility Score</h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">Document margins, structure and headers are clear</p>
                </div>
                <div className="w-18 h-18 rounded-full border-4 border-violet-500/20 border-r-violet-500 flex items-center justify-center font-black text-slate-800 dark:text-zinc-150 text-lg shrink-0">
                  76%
                </div>
              </div>

              {/* Keyword comparison checks */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Keywords Matching Matrix</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Matched Keywords */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Identified ({3})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["React.js", "JavaScript", "REST APIs"].map((kw) => (
                        <span key={kw} className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium text-[10px]">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Missing ({3})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Next.js", "Redux Toolkit", "CI/CD Pipeline"].map((kw) => (
                        <span key={kw} className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-medium text-[10px]">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* STAR Actionable Recommendations */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/80 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Bullet Points Optimization (STAR Method)</h3>
                
                <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-zinc-900/50">
                  
                  <div className="space-y-1.5 first:pt-0 pt-3">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Current line:</span>
                    <p className="italic text-slate-600 dark:text-zinc-400 text-xs">"Responsible for code reviews and styling rules."</p>
                    <span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-wider block pt-1">Recommended update:</span>
                    <p className="text-slate-800 dark:text-zinc-200 text-xs leading-relaxed bg-slate-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-205 dark:border-zinc-850">
                      "Led peer code inspections for a team of 6 engineers, standardizing linters and lint rules that reduced build-time compilation errors by 18%."
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-3.5">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Current line:</span>
                    <p className="italic text-slate-600 dark:text-zinc-400 text-xs">"Made database queries run faster."</p>
                    <span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-wider block pt-1">Recommended update:</span>
                    <p className="text-slate-800 dark:text-zinc-200 text-xs leading-relaxed bg-slate-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-205 dark:border-zinc-850">
                      "Optimized relational database indices and database query caching schemas, reducing API response latency profiles by 40%."
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
}

export default ResumeReview;
