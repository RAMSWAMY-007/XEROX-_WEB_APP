import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
});

// Interceptor to add auth token
client.interceptors.request.use((config) => {
  // For demo purposes, we will mock the admin token if it doesn't exist
  // In reality, you'd want a real login flow.
  let token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getQueue = async () => {
  const response = await client.get('/admin/queue');
  return response.data;
};

export const updateOrderStatus = async ({ id, status }) => {
  const response = await client.patch(`/admin/orders/${id}/status`, { status });
  return response.data;
};

export const batchPrintOrders = async (orderIds) => {
  const response = await client.post('/admin/orders/batch-print', { orderIds });
  return response.data;
};

export default client;
