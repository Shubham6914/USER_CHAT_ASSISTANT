import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";

import AuthProvider from "./context/AuthContext";
import ThemeProvider from "./context/ThemeContext";
import ChatProvider from "./context/ChatContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Global Authentication State */}
    <AuthProvider>
      <ThemeProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);