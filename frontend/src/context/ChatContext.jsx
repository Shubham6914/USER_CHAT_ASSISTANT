import { createContext, useEffect, useMemo, useState, useRef } from "react";
import useAuth from "../hooks/useAuth";
import {
  getChats,
  createChat,
  updateChatTitle,
  deleteChat,
  loadChatMessages,
  saveUserMessage,
  createAssistantPlaceholder,
  completeAssistantMessage,
  failAssistantMessage,
  generateChatTitle,
  queryAssistantStream,
} from "../services/chatService";

/**
 * =====================================================
 * Chat Context
 * =====================================================
 *
 * This context is responsible for:
 *
 * 1. Managing all conversations synced with the Postgres backend DB
 * 2. Tracking the active conversation
 * 3. Creating new conversations in backend and state
 * 4. Fetching, saving, and updating messages (including streaming orchestration)
 * 5. Renaming and deleting conversations
 * =====================================================
 */

export const ChatContext = createContext();

function ChatProvider({ children }) {
  const { user } = useAuth();

  // =====================================================
  // STATE
  // =====================================================
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const loadedChatsRef = useRef(new Set());

  // =====================================================
  // DERIVED STATE
  // =====================================================
  const activeConversation = useMemo(() => {
    return conversations.find((conversation) => conversation.id === activeConversationId);
  }, [conversations, activeConversationId]);

  // =====================================================
  // LOAD CONVERSATIONS (ON AUTH OR MOUNT)
  // =====================================================
  useEffect(() => {
    const fetchChats = async () => {
      loadedChatsRef.current.clear();
      if (user && user.token) {
        try {
          const data = await getChats();
          const mappedConversations = data.chats.map((c) => ({
            id: c.chat_id,
            title: c.chat_title,
            messages: [], // Loaded on demand when selected
            title_status: c.title_status,
          }));
          setConversations(mappedConversations);

          if (mappedConversations.length > 0) {
            setActiveConversationId(mappedConversations[0].id);
          } else {
            setActiveConversationId(null);
          }
        } catch (error) {
          console.error("Failed to fetch chats:", error);
        }
      } else {
        setConversations([]);
        setActiveConversationId(null);
      }
    };

    fetchChats();
  }, [user]);

  // =====================================================
  // LOAD MESSAGES FOR ACTIVE CONVERSATION
  // =====================================================
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversationId) return;
      if (loadedChatsRef.current.has(activeConversationId)) return;

      // Mark as loaded before the async call to prevent rapid duplicate calls
      loadedChatsRef.current.add(activeConversationId);

      try {
        const data = await loadChatMessages(activeConversationId);
        const mappedMessages = data.messages.map((m) => ({
          id: m.message_id,
          role: m.role,
          content: m.content,
          status: m.status,
          sources: m.meta_data?.sources || null,
        }));

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId ? { ...c, messages: mappedMessages } : c
          )
        );
      } catch (error) {
        console.error("Failed to fetch messages for conversation:", activeConversationId, error);
        // Clear from cache to allow retrying
        loadedChatsRef.current.delete(activeConversationId);
      }
    };

    fetchMessages();
  }, [activeConversationId]);

  // =====================================================
  // ACTIONS
  // =====================================================

  /**
   * Creates a new conversation in backend DB and appends to local state.
   */
  const createConversation = async () => {
    try {
      const data = await createChat("New Chat");
      const newConversation = {
        id: data.chat_id,
        title: data.chat_title,
        messages: [],
        title_status: data.title_status,
      };

      // Mark as loaded immediately because it is a new empty chat session
      loadedChatsRef.current.add(data.chat_id);

      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
    } catch (error) {
      console.error("Failed to create new conversation:", error);
    }
  };

  /**
   * Updates conversation title in DB and local state.
   */
  const updateConversationTitle = async (conversationId, title) => {
    try {
      const data = await updateChatTitle(conversationId, title);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title: data.chat_title, title_status: data.title_status } : c))
      );
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    }
  };

  /**
   * Deletes a conversation from DB and adjusts selected active conversation.
   */
  const deleteConversation = async (conversationId) => {
    try {
      await deleteChat(conversationId);
      loadedChatsRef.current.delete(conversationId);
      setConversations((prev) => {
        const nextConversations = prev.filter((c) => c.id !== conversationId);

        if (activeConversationId === conversationId) {
          if (nextConversations.length > 0) {
            setActiveConversationId(nextConversations[0].id);
          } else {
            setActiveConversationId(null);
          }
        }
        return nextConversations;
      });
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  /**
   * Local state helper: Appends message to conversation's list
   */
  const addMessage = (conversationId, message) => {
    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          messages: [...conversation.messages, message],
        };
      })
    );
  };

  /**
   * Local state helper: Updates content or fields in an existing message
   */
  const updateMessage = (conversationId, messageId, updates) => {
    const updateObj = typeof updates === "string" ? { content: updates } : updates;
    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId ? { ...message, ...updateObj } : message
          ),
        };
      })
    );
  };

  /**
   * Centralized Messaging Pipeline:
   * 1. Save User Message in database
   * 2. Create Assistant Message placeholder (status: PENDING)
   * 3. Stream generated response token-by-token from orchestrator
   * 4. Finalize response on complete (completeAssistantMessage) or error (failAssistantMessage)
   * 5. Generate summary title automatically if chat is in "New Chat" status
   */
  const sendMessage = async (messageText) => {
    if (!activeConversationId || isGenerating) return;

    const chat_id = activeConversationId;
    setIsGenerating(true);

    try {
      if (!user || !user.id) {
        throw new Error("You must be logged in to send messages.");
      }

      // 1. Save user message in database
      const userMsgData = await saveUserMessage(chat_id, messageText);
      const userMessage = {
        id: userMsgData.message_id,
        role: "user",
        content: userMsgData.content,
      };

      // Add user message to UI state
      addMessage(chat_id, userMessage);

      // 2. Create assistant message placeholder in DB (status: PENDING)
      const placeholderData = await createAssistantPlaceholder(chat_id, userMsgData.message_id);
      const assistantMessageId = placeholderData.message_id;

      // Add assistant placeholder message to UI state
      const assistantPlaceholder = {
        id: assistantMessageId,
        role: "assistant",
        content: "Thinking...",
      };
      addMessage(chat_id, assistantPlaceholder);

      let streamedText = "";
      let hasReceivedFirstChunk = false;
      let sourcesList = null;

      // 3. Call assistant query stream
      await queryAssistantStream(
        user.id,
        messageText,
        chat_id,
        (chunk) => {
          if (!hasReceivedFirstChunk) {
            hasReceivedFirstChunk = true;
            streamedText = chunk;
          } else {
            streamedText += chunk;
          }
          // Update bubble content token-by-token
          updateMessage(chat_id, assistantMessageId, streamedText);
        },
        (sources) => {
          sourcesList = sources;
          updateMessage(chat_id, assistantMessageId, { sources });
        },
        async () => {
          // Completed! Save final content and source citations in DB
          try {
            await completeAssistantMessage(
              assistantMessageId,
              streamedText,
              sourcesList ? { sources: sourcesList } : null
            );
          } catch (e) {
            console.error("Failed to complete assistant message in database:", e);
          }

          setIsGenerating(false);

          // 4. Auto generate chat title if it's currently a "New Chat" thread
          const currentConv = conversations.find((c) => c.id === chat_id);
          if (
            currentConv &&
            (currentConv.title === "New Chat" ||
              currentConv.title_status === "PENDING" ||
              !currentConv.title_status)
          ) {
            try {
              const updatedChat = await generateChatTitle(chat_id, messageText, streamedText);
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === chat_id
                    ? { ...c, title: updatedChat.chat_title, title_status: updatedChat.title_status }
                    : c
                )
              );
            } catch (e) {
              console.error("Failed to auto-generate chat title:", e);
            }
          }
        },
        async (err) => {
          // Failed streaming! Mark failed state in DB and retain partial response
          try {
            await failAssistantMessage(assistantMessageId, streamedText, {
              error: err.message || "Unknown error",
            });
          } catch (e) {
            console.error("Failed to mark assistant message as failed in database:", e);
          }

          updateMessage(
            chat_id,
            assistantMessageId,
            `⚠️ **Query failed**: ${err.message || "An unexpected error occurred while communicating with the server."}`
          );
          setIsGenerating(false);
        }
      );
    } catch (err) {
      console.error("Error in sendMessage flow:", err);
      setIsGenerating(false);
      alert(`Failed to send message: ${err.message}`);
    }
  };

  const selectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
  };

  // =====================================================
  // CONTEXT VALUE
  // =====================================================
  const value = {
    conversations,
    activeConversation,
    activeConversationId,
    isGenerating,
    createConversation,
    addMessage,
    updateMessage,
    updateConversationTitle,
    deleteConversation,
    selectConversation,
    sendMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export default ChatProvider;