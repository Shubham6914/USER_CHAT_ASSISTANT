import axios from "axios";

const api = axios.create({

  // TODO:
  // Replace with backend URL

  baseURL: "http://localhost:8000",

  headers: {
    "Content-Type": "application/json",
  },
});

export default api;