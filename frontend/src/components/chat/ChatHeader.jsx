import useAuth from "../../hooks/useAuth";

function ChatHeader() {
  const { user } = useAuth();

  return (
    <header
      className="
        h-16
        border-b
        flex
        items-center
        justify-between
        px-6
      "
    >
      <h1
        className="
          text-lg
          font-semibold
        "
      >
        New Conversation
      </h1>

      <div>
        <span>
          {user?.name}
        </span>
      </div>
    </header>
  );
}

export default ChatHeader;