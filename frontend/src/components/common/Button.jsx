/**
 * Reusable Button Component
 */

function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  isLoading = false,
  disabled = false,
  className = "",
}) {
  const baseStyle = "flex items-center justify-center rounded-xl font-semibold px-5 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]";
  
  const variants = {
    primary: "bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/10 hover:shadow-brand-500/20",
    secondary: "bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 border border-transparent",
    outline: "bg-transparent border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/10 hover:shadow-red-500/20",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${className} w-full`}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      <span>{children}</span>
    </button>
  );
}

export default Button;