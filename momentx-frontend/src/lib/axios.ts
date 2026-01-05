import axios from "axios";

// 1. Create the instance
export const api = axios.create({
  baseURL: "http://localhost:3000/api/v1", // Adjust if needed
  withCredentials: true, // 👈 CRITICAL: Sends cookies automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Refresh Token Logic Variables
let isRefreshing = false;
let failedQueue: any[] = [];

// Helper to process the queue of failed requests
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 3. The Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already retried this specific request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the error comes from the login page itself, reject immediately (don't loop)
      if (originalRequest.url.includes("/login")) {
        return Promise.reject(error);
      }

      // If already refreshing, add this request to the queue
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        // The cookie is sent automatically by 'withCredentials: true'
        await api.post("/users/refresh-token");

        // If successful, retry all queued requests
        processQueue(null);

        // Retry the original failed request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, the session is truly dead
        processQueue(refreshError, null);

        // Clear local storage and let the UI know
        localStorage.removeItem("momentx_user");

        // Optional: Redirect to login
        // window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
