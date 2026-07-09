import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * =====================================================
 * BACKEND INTEGRATION: Axios Interceptor for Auth
 * =====================================================
 * Automatically attaches the user's JWT access token to 
 * all authenticated backend requests.
 */
api.interceptors.request.use(
  (config) => {
    try {
      const user = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user"))
        : null;
        
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error("Failed to parse user for authorization header", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;