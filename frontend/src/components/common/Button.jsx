/**
 * Reusable Button Component
 */

function Button({
  children,
  onClick,
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="
        w-full
        rounded-lg
        bg-black
        text-white
        py-3
        font-medium
        hover:opacity-90
        transition
      "
    >
      {children}
    </button>
  );
}

export default Button;