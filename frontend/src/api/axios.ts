import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem('smartpeer_user');
      const user = stored && stored !== 'undefined' ? JSON.parse(stored) : null;
      if (user && user.token) {
        config.headers['Authorization'] = `Bearer ${user.token}`;
      }
    } catch (error) {
      console.error('Error parsing auth token in interceptor:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
