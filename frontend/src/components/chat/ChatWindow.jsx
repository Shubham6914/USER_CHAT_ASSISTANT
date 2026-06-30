// Temporary Mock Messages.

// Later:

// Context API
// Backend
// Streaming


import ChatMessage from "./ChatMessage";

function ChatWindow() {
  const messages = [
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! How can I help you today?",
    },
    {
      id: 2,
      role: "user",
      content:
        "Explain Graph RAG.",
    },
    {
      id: 3,
      role: "assistant",
      content:
        "Graph RAG combines vector retrieval with knowledge graphs.",
    },
  ];

  return (
    <div
      className="
        flex-1
        overflow-y-auto
        p-6
      "
    >
      {messages.map(
        (message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={
              message.content
            }
          />
        )
      )}
    </div>
  );
}

export default ChatWindow;