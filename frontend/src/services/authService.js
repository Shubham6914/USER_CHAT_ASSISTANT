import api from "./api";

/**
 * =====================================================
 * BACKEND INTEGRATION: Signup Endpoint
 * =====================================================
 * API Endpoint: POST http://127.0.0.1:8000/api/v1/auth/signup
 * Headers: Content-Type: application/json
 * Request Payload:
 * {
 *   "user_name": "Full Name",
 *   "user_email": "email@example.com",
 *   "password": "strongpassword"
 * }
 */
export const signup = async ({ name, email, password }) => {
  try {
    const response = await api.post("/api/v1/auth/signup", {
      user_name: name,
      user_email: email,
      password: password,
    });
    return response.data;
  } catch (error) {
    // Propagate backend error details if available
    const message = error.response?.data?.detail || error.message || "Failed to register";
    throw new Error(message);
  }
};

/**
 * =====================================================
 * BACKEND INTEGRATION: Login Endpoint
 * =====================================================
 * API Endpoint: POST http://127.0.0.1:8000/api/v1/auth/login
 * Headers: Content-Type: application/json
 * Request Payload:
 * {
 *   "user_email": "email@example.com",
 *   "password": "strongpassword"
 * }
 */
export const signin = async (email, password) => {
  try {
    const response = await api.post("/api/v1/auth/login", {
      user_email: email,
      password: password,
    });
    return response.data;
  } catch (error) {
    // Propagate backend error details if available
    const message = error.response?.data?.detail || error.message || "Invalid credentials";
    throw new Error(message);
  }
};

/**
 * =====================================================
 * BACKEND INTEGRATION: Verify Token Endpoint
 * =====================================================
 * API Endpoint: POST http://127.0.0.1:8000/api/v1/auth/verify-token
 * Headers: Content-Type: application/json
 * Request Payload:
 * {
 *   "access_token": "access_token_string"
 * }
 */
export const verifyToken = async (accessToken) => {
  try {
    const response = await api.post("/api/v1/auth/verify-token", {
      access_token: accessToken,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || "Token verification failed";
    throw new Error(message);
  }
};

/**
 * =====================================================
 * BACKEND INTEGRATION: Refresh Token Endpoint
 * =====================================================
 * API Endpoint: POST http://127.0.0.1:8000/api/v1/auth/refresh
 * Headers: Content-Type: application/json
 * Request Payload:
 * {
 *   "refresh_token": "refresh_token_string"
 * }
 */
export const refreshToken = async (refreshTokenVal) => {
  try {
    const response = await api.post("/api/v1/auth/refresh", {
      refresh_token: refreshTokenVal,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || "Token refresh failed";
    throw new Error(message);
  }
};

/**
 * =====================================================
 * BACKEND INTEGRATION: Get Current User Info (Me)
 * =====================================================
 * API Endpoint: GET http://127.0.0.1:8000/api/v1/auth/me
 * Headers:
 *   Authorization: Bearer <token>
 */
export const getMe = async (token) => {
  try {
    const response = await api.get("/api/v1/auth/me", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || "Failed to fetch user info";
    throw new Error(message);
  }
};

