// What is Context?

// Without Context:

// App
//  └── Chat
//       └── Sidebar
//            └── Profile

// You would have to pass user data through every component.

// Context lets us access the user globally.


import { createContext, useEffect, useState } from "react";

import {
  saveUser,
  getUser,
  removeUser,
  getRegisteredUsers,
  saveRegisteredUsers,
} from "../utils/storage";

// Create global auth context
export const AuthContext = createContext();

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
    const storedUser = getUser();

    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  /**
   * Register new user
   */
  const register = ({ name, email, password }) => {
    const users = getRegisteredUsers();

    const emailExists = users.find(
      (user) => user.email === email
    );

    if (emailExists) {
      throw new Error("Email already exists");
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
    };

    users.push(newUser);

    saveRegisteredUsers(users);

    return true;
  };

  /**
   * Login user
   */
  const login = (email, password) => {
    const users = getRegisteredUsers();

    const matchedUser = users.find(
      (user) =>
        user.email === email &&
        user.password === password
    );

    if (!matchedUser) {
      throw new Error("Invalid credentials");
    }

    saveUser(matchedUser);

    setUser(matchedUser);

    return true;
  };

  /**
   * Logout user
   */
  const logout = () => {
    removeUser();

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;