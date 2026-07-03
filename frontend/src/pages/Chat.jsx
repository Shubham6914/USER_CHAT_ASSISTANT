import { useState } from "react";
import Sidebar from "../components/chat/Sidebar";
import ChatHeader from "../components/chat/ChatHeader";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";

function Chat() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)] dark:bg-zinc-950 transition-colors duration-200">
      {/* Sidebar Drawer overlay on mobile, static on desktop */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 relative bg-[var(--bg-primary)] dark:bg-zinc-900/40">
        <ChatHeader onMenuToggle={toggleSidebar} />

        <ChatWindow />

        <ChatInput />
      </div>
    </div>
  );
}

export default Chat;