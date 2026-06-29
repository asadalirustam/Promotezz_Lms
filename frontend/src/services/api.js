import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 second timeout — prevents infinite spinner on slow MongoDB Atlas
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT token and custom LLM API keys from localStorage into headers of every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const geminiKey = localStorage.getItem('gemini_key');
    if (geminiKey) {
      config.headers['x-gemini-key'] = geminiKey;
    }
    
    const openaiKey = localStorage.getItem('openai_key');
    if (openaiKey) {
      config.headers['x-openai-key'] = openaiKey;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
