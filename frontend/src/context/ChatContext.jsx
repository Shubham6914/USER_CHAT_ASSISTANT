import { createContext, useEffect, useMemo, useState } from "react";

import {
  getConversations,
  saveConversations,
} from "../utils/storage";

/**
 * =====================================================
 * Chat Context
 * =====================================================
 *
 * This context is responsible for:
 *
 * 1. Managing all conversations
 * 2. Tracking the active conversation
 * 3. Creating new conversations
 * 4. Adding messages
 * 5. Updating conversation title
 * 6. Persisting conversations in localStorage
 *
 * Later this context will also handle:
 * - Delete Conversation
 * - Rename Conversation
 * - Streaming Responses
 * - Backend API Integration
 * =====================================================
 */

export const ChatContext = createContext();

function ChatProvider({ children }) {
  // =====================================================
  // STATE
  // =====================================================

  /**
   * Stores all conversations.
   *
   * Example:
   *
   * [
   *   {
   *      id: 123,
   *      title: "Graph RAG",
   *      messages: []
   *   }
   * ]
   */
  const [conversations, setConversations] = useState([]);

  /**
   * Stores the currently selected conversation ID.
   */
  const [activeConversationId, setActiveConversationId] =
    useState(null);

  // =====================================================
  // DERIVED STATE
  // =====================================================

  /**
   * Finds the currently active conversation.
   *
   * Instead of searching everywhere,
   * we calculate it once here.
   */
  const activeConversation = useMemo(() => {
    return conversations.find(
      (conversation) =>
        conversation.id === activeConversationId
    );
  }, [conversations, activeConversationId]);

  // =====================================================
  // LOAD DATA
  // =====================================================

  /**
   * Runs only once when the application starts.
   *
   * Loads conversations from localStorage.
   */
  useEffect(() => {
    const storedConversations = getConversations();

    if (storedConversations.length > 0) {
      setConversations(storedConversations);

      // Select first conversation
      setActiveConversationId(
        storedConversations[0].id
      );
    }
  }, []);

  // =====================================================
  // SAVE DATA
  // =====================================================

  /**
   * Save conversations whenever they change.
   */
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // =====================================================
  // ACTIONS
  // =====================================================

  /**
   * Creates a new conversation.
   */
  const createConversation = () => {
    const newConversation = {
      id: Date.now(),

      title: "New Chat",

      messages: [],
    };

    setConversations((prev) => [
      newConversation,
      ...prev,
    ]);

    setActiveConversationId(newConversation.id);
  };

  /**
   * Adds a new message
   * to a conversation.
   */
  const addMessage = (
    conversationId,
    message
  ) => {
    setConversations((prev) =>
      prev.map((conversation) => {
        if (
          conversation.id !== conversationId
        ) {
          return conversation;
        }

        return {
          ...conversation,

          messages: [
            ...conversation.messages,
            message,
          ],
        };
      })
    );
  };

  /**
   * Updates a specific message in a conversation.
   */
  const updateMessage = (conversationId, messageId, newContent) => {
    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId ? { ...message, content: newContent } : message
          ),
        };
      })
    );
  };

  /**
   * Updates conversation title.
   */
  const updateConversationTitle = (
    conversationId,
    title
  ) => {
    setConversations((prev) =>
      prev.map((conversation) => {
        if (
          conversation.id !== conversationId
        ) {
          return conversation;
        }

        return {
          ...conversation,

          title,
        };
      })
    );
  };

  /**
   * Select conversation.
   */
  const selectConversation = (
    conversationId
  ) => {
    setActiveConversationId(
      conversationId
    );
  };

  // =====================================================
  // CONTEXT VALUE
  // =====================================================

  const value = {
    conversations,

    activeConversation,

    activeConversationId,

    createConversation,

    addMessage,

    updateMessage,

    updateConversationTitle,

    selectConversation,
  };

  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export default ChatProvider;