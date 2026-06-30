import Sidebar from "../components/chat/Sidebar";
import ChatHeader from "../components/chat/ChatHeader";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";

function Chat() {
  return (
    <div
      className="
        flex
        h-screen
      "
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Chat Area */}
      <div
        className="
          flex
          flex-col
          flex-1
        "
      >
        <ChatHeader />

        <ChatWindow />

        <ChatInput />
      </div>
    </div>
  );
}

export default Chat;