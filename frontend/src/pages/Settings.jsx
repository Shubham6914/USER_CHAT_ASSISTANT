import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import useAuth from "../hooks/useAuth";
import ThemeToggle from "../components/common/ThemeToggle";

function Settings() {
  const navigate = useNavigate();
  const { user, logout, fetchMe } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    let isMounted = true;
    const loadProfile = async () => {
      if (!fetchMe) return;
      setProfileLoading(true);
      setProfileError(null);
      try {
        await fetchMe();
      } catch (err) {
        if (isMounted) {
          setProfileError(err.message || "Failed to load user info");
          hasFetched.current = false;
        }
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [fetchMe]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/chat")}
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--bg-secondary)] dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-all duration-200 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">Settings</h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Manage account and theme options</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-[var(--bg-secondary)] dark:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 p-6 shadow-sm shadow-slate-100/50 dark:shadow-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Profile details
              </h3>
              {profileLoading ? (
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                  Syncing with server...
                </span>
              ) : profileError ? (
                <button
                  onClick={() => {
                    const retry = async () => {
                      setProfileLoading(true);
                      setProfileError(null);
                      try {
                        await fetchMe();
                      } catch (err) {
                        setProfileError(err.message || "Failed to load user info");
                      } finally {
                        setProfileLoading(false);
                      }
                    };
                    retry();
                  }}
                  className="text-[10px] text-red-500 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1 border-0 bg-transparent p-0"
                  title={profileError}
                >
                  ⚠️ Sync failed. Click to retry
                </button>
              ) : (
                <span className="text-[10px] text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                  ✓ Synced
                </span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* User Avatar Placeholder */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-brand-500/15">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h4 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                  {user?.name || "App User"}
                </h4>
                <p className="text-sm text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 justify-center sm:justify-start">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  {user?.email}
                </p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                    Active Session
                  </div>
                  {user?.id && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                      ID: {user.id}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section (Appearance & Account Options) */}
          <div className="bg-[var(--bg-secondary)] dark:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 p-6 shadow-sm shadow-slate-100/50 dark:shadow-none">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
              Preferences
            </h3>
            
            <div className="divide-y divide-slate-100 dark:divide-zinc-850">
              {/* Theme Toggle row */}
              <div className="flex items-center justify-between py-4 first:pt-0">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                    Application Theme
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Switch between dark and light appearance modes
                  </p>
                </div>
                <ThemeToggle />
              </div>

              {/* Version row */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                    System Version
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Currently installed frontend client version
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/50 dark:border-zinc-800/50">
                  v1.0.0-prod
                </span>
              </div>
            </div>
          </div>

          {/* Actions panel */}
          <div className="bg-[var(--bg-secondary)] dark:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 p-6 shadow-sm shadow-slate-100/50 dark:shadow-none flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                Log Out of Account
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Safely sign out of your profile and clear session cache
              </p>
            </div>
            <div className="w-32">
              <Button onClick={handleLogout} variant="danger">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;