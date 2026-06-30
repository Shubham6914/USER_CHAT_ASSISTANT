import { Link } from "react-router-dom";
import useChat from "../../hooks/useChat";

function Sidebar() {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
  } = useChat();

  return (
    <aside className="w-72 h-screen border-r flex flex-col p-4">
      <h2 className="text-xl font-bold mb-6">GenAI Chat</h2>

      <button
        onClick={createConversation}
        className="border rounded-lg p-3 mb-4 text-left"
      >
        + New Chat
      </button>

      <div className="space-y-2">
        {conversations?.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => setActiveConversationId(conversation.id)}
            className={`p-3 rounded cursor-pointer border ${
              activeConversationId === conversation.id ? "bg-gray-300" : ""
            }`}
          >
            {conversation.title}
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <Link to="/settings" className="block p-3 border rounded-lg">
          Settings
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;