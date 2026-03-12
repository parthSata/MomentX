import axios from 'axios';
import { toast } from 'sonner';

// 1. Create the instance
export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1`,
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

api.interceptors.request.use((config) => {
  // 👉 If this is an ADMIN request, attach admin token
  if (config.url?.startsWith('/admin')) {
    const adminToken = localStorage.getItem('adminToken');

    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  }

  return config;
});

// 3. The Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const { status, data } = error.response || {};

    // 🛑 1. HANDLE BANNED USERS (403 Forbidden)
    if (status === 403 && data?.message?.includes('suspended')) {
      toast.error('⛔ Account Suspended', {
        description: 'Your access has been revoked. Please contact support.',
        duration: 5000,
      });

      localStorage.removeItem('momentx_user');
      localStorage.removeItem('adminToken');
      sessionStorage.clear();

      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/admin/login'
      ) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }

      return Promise.reject(error);
    }

    // 🛑 2. Ignore errors from Login/Refresh (Prevent Loop)
    if (
      status === 401 &&
      (originalRequest.url.includes('/login') ||
        originalRequest.url.includes('/refresh-token'))
    ) {
      return Promise.reject(error);
    }

    // 🛑 3. Handle 401 (Session Expired) -> Try Refresh
    if (status === 401 && !originalRequest._retry) {
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
        await api.post('/users/refresh-token');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        // ✅ ADDED TOAST HERE
        toast.error('Session Expired', {
          description: 'Suspended user. Contact MomentX Support.',
          duration: 3000,
        });

        processQueue(refreshError, null);
        localStorage.removeItem('momentx_user');

        if (window.location.pathname !== '/login') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000); // Small delay to show toast
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
