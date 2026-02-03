import axios from 'axios';

// Allow overriding API base URL via env var for dev workflows
const rawBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const base = rawBase.replace(/\/\/$/, '');
const api = axios.create({
  baseURL: `${base}/api/v1`,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refresh_token: refreshToken
          });

          const tokenData = response.data.data; // Backend returns: { success: true, data: { token: "...", refresh_token: "..." } }
          localStorage.setItem('token', tokenData.token);
          if (tokenData.refresh_token) {
            localStorage.setItem('refreshToken', tokenData.refresh_token);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${tokenData.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        // Check if we are in mock mode - if so, don't logout
        if (localStorage.getItem('token') === 'mock-jwt-token') {
          console.warn('Mock token invalid (expected), keeping session active.');
          return Promise.reject(refreshError);
        }

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Also check for mock token on simple 401s (if retry logic was skipped or failed immediately)
    if (error.response?.status === 401 && localStorage.getItem('token') === 'mock-jwt-token') {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
