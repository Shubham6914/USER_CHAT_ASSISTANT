import { useState } from "react";
import useChat from "../../hooks/useChat";

function ChatInput() {
  const [message, setMessage] =
    useState("");

  const handleSubmit = (e) => {
  e.preventDefault();

  if (!message.trim()) {
    return;
  }

  if (!activeConversation) {
    return;
  }

  /**
   * User Message
   */
  addMessage(
    activeConversation.id,
    {
      id: Date.now(),

      role: "user",

      content: message,
    }
  );

  setMessage("");
};

  return (
    <div
      className="
        border-t
        p-4
      "
    >
      <form
        onSubmit={handleSubmit}
        className="
          flex
          gap-2
        "
      >
        <input
          value={message}
          onChange={(e) =>
            setMessage(
              e.target.value
            )
          }
          placeholder="Send a message..."
          className="
            flex-1
            border
            rounded-lg
            px-4
            py-3
            outline-none
          "
        />

        <button
          className="
            px-6
            rounded-lg
            border
          "
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInput;