import {
  createContext,
  useEffect,
  useState,
} from "react";

import {
  saveConversations,
  getConversations,
} from "../utils/storage";

export const ChatContext =
  createContext();

function ChatProvider({
  children,
}) {
  /**
   * All conversations
   */
  const [
    conversations,
    setConversations,
  ] = useState([]);

  /**
   * Current active chat
   */
  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState(null);

  /**
   * Load conversations
   */
  useEffect(() => {
    const storedConversations =
      getConversations();

    if (
      storedConversations.length
    ) {
      setConversations(
        storedConversations
      );

      setActiveConversationId(
        storedConversations[0].id
      );
    }
  }, []);

  /**
   * Persist conversations
   */
  useEffect(() => {
    saveConversations(
      conversations
    );
  }, [conversations]);

  /**
   * Create new conversation
   */
  const createConversation =
    () => {
      const newConversation = {
        id: Date.now(),

        title: "New Chat",

        messages: [],
      };

      setConversations(
        (prev) => [
          newConversation,
          ...prev,
        ]
      );

      setActiveConversationId(
        newConversation.id
      );
    };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,

        createConversation,

        setActiveConversationId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export default ChatProvider;