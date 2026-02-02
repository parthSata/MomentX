import axios from 'axios';

// 1. Create the instance
export const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1', // Ensure port is correct
  withCredentials: true, // 👈 CRITICAL: Sends cookies automatically
  headers: {
    'Content-Type': 'application/json',
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

    // 🛑 1. Ignore errors from Login or Refresh endpoints (Prevent Infinite Loop)
    if (
      error.response?.status === 401 &&
      (originalRequest.url.includes('/login') ||
        originalRequest.url.includes('/refresh-token'))
    ) {
      return Promise.reject(error);
    }

    // 🛑 2. Handle 401 (Unauthorized) - Access Token Expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      // A. If refreshing is already happening, Queue this request
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

      // B. Start Refreshing
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/users/refresh-token');

        // If successful, process the queue
        processQueue(null);

        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ [Axios] Refresh Failed. Session expired.');

        // Fail all queued requests
        processQueue(refreshError, null);

        // Cleanup local storage
        localStorage.removeItem('momentx_user');

        // 🛑 CRITICAL FIX: Only redirect if we are NOT already on the login page.
        // This stops the infinite reload loop.
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Return other errors as is
    return Promise.reject(error);
  },
);
