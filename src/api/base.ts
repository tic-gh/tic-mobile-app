import axios from 'axios';

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add authorization header
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = token;
      }
    } catch (error) {
      console.warn('Failed to get token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Token expired or invalid, clear it from storage
      try {
        await localStorage.removeItem('access_token');

        // Optionally redirect to login page or show login modal
        // You can emit an event or use router to redirect
        console.log('Token expired, please login again');
      } catch (storageError) {
        console.error('Failed to clear expired token:', storageError);
      }
    }
    return Promise.reject(error);
  }
);
