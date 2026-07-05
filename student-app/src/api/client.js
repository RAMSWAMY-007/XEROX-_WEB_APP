import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://xerox-backend-plld.onrender.com/api';

const client = axios.create({
  baseURL: API_URL,
});

// Interceptor to add auth token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const createOrder = async (formData) => {
  const response = await client.post('/orders', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getMyOrders = async () => {
  const response = await client.get('/orders/my');
  return response.data;
};

export default client;
