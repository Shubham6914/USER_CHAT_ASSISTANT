// This component displays:

// User Message
// OR
// Assistant Message



function ChatMessage({
  role,
  content,
}) {
  const isUser =
    role === "user";

  return (
    <div
      className={`
        flex
        ${isUser
          ? "justify-end"
          : "justify-start"}
      `}
    >
      <div
        className="
          max-w-2xl
          rounded-xl
          px-4
          py-3
          mb-4
        "
        style={{
          backgroundColor: isUser
            ? "#2563eb"
            : "var(--bg-secondary)",

          color: isUser
            ? "white"
            : "var(--text-primary)",
        }}
      >
        {content}
      </div>
    </div>
  );
}

export default ChatMessage;