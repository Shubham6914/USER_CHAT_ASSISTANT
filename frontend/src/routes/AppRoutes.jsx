import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Chat from "../pages/Chat";
import Settings from "../pages/Settings";
import Home from "../pages/Home";
import Study from "../pages/Study";
import MockInterview from "../pages/MockInterview";
import ResumeReview from "../pages/ResumeReview";
import DocumentHub from "../pages/DocumentHub";
import DocChatSession from "../pages/DocChatSession";

import ProtectedRoute from "../components/layout/ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/study"
          element={
            <ProtectedRoute>
              <Study />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mock-interview"
          element={
            <ProtectedRoute>
              <MockInterview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume-review"
          element={
            <ProtectedRoute>
              <ResumeReview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat-with-doc"
          element={
            <ProtectedRoute>
              <DocumentHub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat-with-doc/:docId"
          element={
            <ProtectedRoute>
              <DocChatSession />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />


      </Routes>
    </BrowserRouter>
  );
}


export default AppRoutes;