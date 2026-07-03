import ChatMessage from "./ChatMessage";
import useChat from "../../hooks/useChat";

function ChatWindow() {
  const { activeConversation } = useChat();

  return (
    <div
      className="
        flex-1
        overflow-y-auto
        p-6
      "
    >
      {!activeConversation && (
        <div className="text-center mt-10">
          Create a conversation to start chatting
        </div>
      )}

      {activeConversation?.messages.map(
        (message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
          />
        )
      )}
    </div>
  );
}

export default ChatWindow;