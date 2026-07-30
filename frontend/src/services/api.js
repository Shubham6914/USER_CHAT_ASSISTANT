import axios from "axios";

let inMemoryToken = sessionStorage.getItem("access_token") || null;

export const setInMemoryToken = (token) => {
  inMemoryToken = token;
  if (token) {
    sessionStorage.setItem("access_token", token);
  } else {
    sessionStorage.removeItem("access_token");
  }
};

export const getInMemoryToken = () => inMemoryToken;

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * =====================================================
 * BACKEND INTEGRATION: Axios Interceptor for Auth
 * =====================================================
 * Automatically attaches in-memory access token to requests.
 */
api.interceptors.request.use(
  (config) => {
    const token = inMemoryToken || sessionStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;