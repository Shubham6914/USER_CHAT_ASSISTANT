function Loader() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950">
      <div className="relative flex items-center justify-center">
        {/* Ambient background glow */}
        <div className="absolute w-24 h-24 rounded-full bg-brand-500/10 blur-xl animate-pulse" />
        
        {/* Double ring spinner */}
        <div className="relative w-12 h-12 rounded-full border-4 border-slate-200 dark:border-zinc-800" />
        <div className="absolute w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500 dark:text-zinc-400 tracking-wide animate-pulse">
        Initializing...
      </p>
    </div>
  );
}

export default Loader;