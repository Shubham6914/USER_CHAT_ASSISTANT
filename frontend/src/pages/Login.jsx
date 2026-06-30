import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import Input from "../components/common/Input";
import Button from "../components/common/Button";

import useAuth from "../hooks/useAuth";

function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    try {
      login(email, password);

      navigate("/chat");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundColor: "var(--bg-secondary)"
      }}
    >
      <div
        className="p-8 rounded-xl shadow-md w-full max-w-md"
        style={{
          backgroundColor: "var(--bg-primary)"
        }}
      >
        <h1 className="text-3xl font-bold mb-6">
          Welcome Back
        </h1>

        {error && (
          <p className="text-red-500 mb-4">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            label="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Enter email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter password"
          />

          <Button type="submit">
            Login
          </Button>
        </form>

        <p className="mt-5 text-center">
          No account?
          <Link
            to="/register"
            className="text-blue-600 ml-1"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;