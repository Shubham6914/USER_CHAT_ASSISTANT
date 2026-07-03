import useTheme from "../../hooks/useTheme";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="
        relative
        flex
        items-center
        justify-center
        h-10
        w-10
        rounded-xl
        border
        border-slate-200
        dark:border-zinc-800
        bg-white
        dark:bg-zinc-900/50
        text-slate-700
        dark:text-zinc-300
        hover:bg-slate-100
        dark:hover:bg-zinc-800
        hover:text-slate-900
        dark:hover:text-zinc-100
        transition-all
        duration-200
        cursor-pointer
        focus:outline-none
        focus:ring-2
        focus:ring-brand-500
      "
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        // Moon Icon
        <svg className="w-5 h-5 transition-transform duration-300 hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        // Sun Icon
        <svg className="w-5 h-5 transition-transform duration-300 hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      )}
    </button>
  );
}

export default ThemeToggle;