/**
 * Reusable Input Component
 */

function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error = "",
  className = "",
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 tracking-wide uppercase">
          {label}
        </label>
      )}

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full
          rounded-xl
          border
          ${error 
            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" 
            : "border-slate-200 dark:border-zinc-800 focus:border-brand-500 focus:ring-brand-500/10"}
          bg-white dark:bg-zinc-900/50
          px-4
          py-2.5
          text-slate-900 dark:text-zinc-100
          placeholder-slate-400 dark:placeholder-zinc-500
          outline-none
          transition-all
          duration-200
          focus:ring-4
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 mt-1 font-medium">{error}</span>
      )}
    </div>
  );
}

export default Input;