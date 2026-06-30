// Add Logout to Settings

import { useNavigate } from "react-router-dom";

import Button from "../components/common/Button";

import useAuth from "../hooks/useAuth";

import ThemeToggle from "../components/common/ThemeToggle";

function Settings() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();

    navigate("/login");
  };

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Settings
      </h1>

      <p className="mt-5">
        Logged in as:
      </p>

      <p>{user?.email}</p>

      <div className="mt-6">
        <ThemeToggle />
      </div>

      <div className="mt-5 w-48">
        <Button onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}

export default Settings;