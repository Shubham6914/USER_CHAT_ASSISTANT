import useTheme from "../../hooks/useTheme";

function ThemeToggle() {
  const {
    theme,
    toggleTheme,
  } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        px-4
        py-2
        rounded-lg
        border
      "
    >
      {theme === "light"
        ? "🌙 Dark"
        : "☀️ Light"}
    </button>
  );
}

export default ThemeToggle;