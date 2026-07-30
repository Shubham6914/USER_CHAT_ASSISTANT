import { createContext, useEffect, useState, useCallback } from "react";
import { setInMemoryToken } from "../services/api";
import { signup, signin, refreshToken, getMe, googleLoginApi, logoutApi } from "../services/authService";
import { removeUser } from "../utils/storage";

// Create global auth context
export const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load user state on application mount via silent cookie refresh
   */
  useEffect(() => {
    const checkAuth = async () => {
      removeUser();

      try {
        let token = null;

        // Step 1: Attempt silent refresh via HttpOnly cookie
        const refreshData = await refreshToken();
        if (refreshData?.access_token || refreshData?.token) {
          token = refreshData.access_token || refreshData.token;
        }

        // Step 2: Fallback to active tab session token if cookie is restricted on local origins
        if (!token) {
          token = sessionStorage.getItem("access_token");
        }

        if (token) {
          setInMemoryToken(token);

          // Step 3: Fetch fresh user profile details from /api/v1/auth/me
          const meData = await getMe(token);
          if (meData) {
            setUser({
              id: meData.user_id,
              name: meData.user_name,
              email: meData.user_email,
              authProvider: meData.auth_provider,
              profilePicture: meData.profile_picture,
              token: token,
            });
          } else {
            setInMemoryToken(null);
            setUser(null);
          }
        } else {
          setInMemoryToken(null);
          setUser(null);
        }
      } catch (err) {
        setInMemoryToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Register new user
   */
  const register = async ({ name, email, password }) => {
    await signup({ name, email, password });
    return true;
  };

  /**
   * Login user with email & password
   */
  const login = async (email, password) => {
    const data = await signin(email, password);
    const token = data.access_token || data.token;

    if (token) {
      setInMemoryToken(token);
    }

    const loggedUser = {
      id: data.user_id || Date.now(),
      name: data.user_name || email.split("@")[0],
      email: data.user_email || email,
      token: token,
    };

    setUser(loggedUser);
    removeUser();
    return true;
  };

  /**
   * Login user with Google OAuth
   */
  const googleLogin = async (idToken) => {
    const data = await googleLoginApi(idToken);
    const token = data.access_token || data.token;

    if (token) {
      setInMemoryToken(token);
    }

    const loggedUser = {
      id: data.user_id || Date.now(),
      name: data.user_name || "Google User",
      email: data.user_email || "",
      profilePicture: data.profile_picture || null,
      token: token,
    };

    setUser(loggedUser);
    removeUser();
    return true;
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.error("Logout API failed", e);
    } finally {
      setInMemoryToken(null);
      removeUser();
      setUser(null);
    }
  };

  /**
   * Fetch current user profile details from backend and sync state
   */
  const fetchMe = useCallback(async () => {
    try {
      const meData = await getMe();
      if (meData) {
        setUser((prev) => ({
          ...prev,
          id: meData.user_id || prev?.id,
          name: meData.user_name || prev?.name,
          email: meData.user_email || prev?.email,
          profilePicture: meData.profile_picture || prev?.profilePicture,
        }));
        return meData;
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
        googleLogin,
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