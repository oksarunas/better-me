import axios from 'axios';

// Create an axios instance with custom config
export const axiosInstance = axios.create({
  baseURL: 'http://localhost:8001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`
        }
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);