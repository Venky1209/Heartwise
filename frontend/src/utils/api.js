import axios from 'axios';

// Create axios instance with base URL from environment variable
const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001/api',
  timeout: 120000, // Increased to 120 seconds for heavy AI analysis with enhanced ML model
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication and logging
api.interceptors.request.use(
  (config) => {
    // Add JWT token to requests
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default api;
