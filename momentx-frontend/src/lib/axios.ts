import axios from "axios";

// Create the axios instance
export const api = axios.create({
  // Ensure this matches your backend URL exactly
  baseURL: "http://localhost:3000/api/v1",

  // ✅ CRITICAL: This allows cookies to be sent/received
  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add response interceptor to debug errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);
