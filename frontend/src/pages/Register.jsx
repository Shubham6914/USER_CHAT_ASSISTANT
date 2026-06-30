// Register Page

// What Happens Here?

// User fills form
//         ↓
// Validation
//         ↓
// AuthContext.register()
//         ↓
// Save to localStorage
//         ↓
// Navigate Login


import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Input from "../components/common/Input";
import Button from "../components/common/Button";

import useAuth from "../hooks/useAuth";

function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  /**
   * Update field value
   */
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /**
   * Register User
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    try {
      if (
        !formData.name ||
        !formData.email ||
        !formData.password
      ) {
        throw new Error("All fields are required");
      }

      register(formData);

      alert("Registration successful");

      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-gray-100
      "
    >
      <div
        className="
          bg-white
          p-8
          rounded-xl
          shadow-md
          w-full
          max-w-md
        "
      >
        <h1 className="text-3xl font-bold mb-6">
          Create Account
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
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter name"
          />

          <Input
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
          />

          <Button type="submit">
            Register
          </Button>
        </form>

        <p className="mt-5 text-center">
          Already have an account?

          <Link
            to="/login"
            className="text-blue-600 ml-1"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;