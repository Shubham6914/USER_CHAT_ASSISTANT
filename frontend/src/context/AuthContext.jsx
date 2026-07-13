// What is Context?

// Without Context:

// App
//  └── Chat
//       └── Sidebar
//            └── Profile

// You would have to pass user data through every component.

// Context lets us access the user globally.


import { createContext, useEffect, useState, useCallback } from "react";

import { signup, signin, verifyToken, refreshToken, getMe } from "../services/authService";
import {
  saveUser,
  getUser,
  removeUser,
  getRegisteredUsers,
  saveRegisteredUsers,
} from "../utils/storage";

// Create global auth context
export const AuthContext = createContext();

/**
 * Decodes base64 JWT token payload
 */
const decodeToken = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT token decoding failed", e);
    return null;
  }
};

function AuthProvider({ children }) {
  /**
   * Current logged in user
   */
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

  /**
   * Load user when application starts
   */
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = getUser();

      if (storedUser && storedUser.token) {
        try {
          // BACKEND INTEGRATION: Calling verify-token endpoint POST http://127.0.0.1:8000/api/v1/auth/verify-token
          await verifyToken(storedUser.token);
          setUser(storedUser);
        } catch (verifyErr) {
          // If access token verification fails, attempt to refresh using the refresh token
          if (storedUser.refreshToken) {
            try {
              // BACKEND INTEGRATION: Calling refresh endpoint POST http://127.0.0.1:8000/api/v1/auth/refresh
              const refreshData = await refreshToken(storedUser.refreshToken);
              const newToken = refreshData.access_token || refreshData.token || storedUser.token;
              
              let userId = storedUser.id;
              if (newToken) {
                const decoded = decodeToken(newToken);
                if (decoded && decoded.sub) {
                  userId = decoded.sub;
                }
              }

              const updatedUser = {
                ...storedUser,
                id: userId,
                token: newToken,
                refreshToken: refreshData.refresh_token || refreshData.refreshToken || storedUser.refreshToken,
              };
              
              saveUser(updatedUser);
              setUser(updatedUser);
            } catch (refreshErr) {
              // Both verification and refresh failed, clear session
              removeUser();
              setUser(null);
            }
          } else {
            // Verification failed and no refresh token found, clear session
            removeUser();
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  /**
   * Register new user
   */
  const register = async ({ name, email, password }) => {
    // BACKEND INTEGRATION: Calling signup endpoint POST http://127.0.0.1:8000/api/v1/auth/signup
    await signup({ name, email, password });
    return true;
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    // BACKEND INTEGRATION: Calling login endpoint POST http://127.0.0.1:8000/api/v1/auth/login
    const data = await signin(email, password);

    const token = data.access_token || data.token || data.jwt;
    let userId = Date.now();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.sub) {
        userId = decoded.sub;
      }
    }

    const loggedUser = {
      id: userId,
      name: data.user?.user_name || data.user?.name || data.name || email.split("@")[0],
      email: data.user?.user_email || data.user?.email || data.email || email,
      token: token || "mock-token",
      refreshToken: data.refresh_token || data.refreshToken || null,
    };

    saveUser(loggedUser);
    setUser(loggedUser);

    return true;
  };

  /**
   * Logout user
   */
  const logout = () => {
    removeUser();

    setUser(null);
  };

  /**
   * Fetch current user profile details from backend and sync state
   */
  const fetchMe = useCallback(async () => {
    const storedUser = getUser();
    if (!storedUser || !storedUser.token) return null;
    try {
      const data = await getMe(storedUser.token);
      if (data) {
        const updatedUser = {
          ...storedUser,
          id: data.user_id || storedUser.id,
          name: data.user_name || storedUser.name,
          email: data.user_email || storedUser.email,
        };
        setUser(updatedUser);
        saveUser(updatedUser);
        return updatedUser;
      }
      return null;
    } catch (err) {
      console.error("Failed to fetch user details from /api/v1/auth/me", err);
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;