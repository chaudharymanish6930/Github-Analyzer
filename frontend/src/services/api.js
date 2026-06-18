import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    if (!response) {
      toast.error('Network error — please check your connection');
      return Promise.reject(error);
    }

    if (response.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      // Let the app handle redirect via auth context
    }

    if (response.status === 429) {
      const msg = response.data?.message || 'Rate limit exceeded. Please try again later.';
      toast.error(msg, { duration: 5000 });
    }

    return Promise.reject(error);
  }
);

export default api;
