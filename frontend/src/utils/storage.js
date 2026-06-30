/**
 * Storage Utility
 *
 * Handles all localStorage operations.
 * Keeps storage logic in one place.
 */

// -------------------------
// USER STORAGE METHODS
// -------------------------

export const saveUser = (userData) => {
  localStorage.setItem("user", JSON.stringify(userData));
};

export const getUser = () => {
  const user = localStorage.getItem("user");

  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem("user");
};

// -------------------------
// REGISTERED USERS
// -------------------------

export const saveRegisteredUsers = (users) => {
  localStorage.setItem("registered_users", JSON.stringify(users));
};

export const getRegisteredUsers = () => {
  const users = localStorage.getItem("registered_users");

  return users ? JSON.parse(users) : [];
};

/**
 * THEME STORAGE
 */

/**
 * Save selected theme
 */
export const saveTheme = (theme) => {
  localStorage.setItem("theme", theme);
};

/**
 * Get saved theme
 */
export const getTheme = () => {
  return localStorage.getItem("theme") || "light";
};

/**
 * CHAT STORAGE
 */

/**
 * Save all conversations
 */
export const saveConversations = (
  conversations
) => {
  localStorage.setItem(
    "conversations",
    JSON.stringify(conversations)
  );
};

/**
 * Get conversations
 */
export const getConversations = () => {
  const data =
    localStorage.getItem(
      "conversations"
    );

  return data
    ? JSON.parse(data)
    : [];
};