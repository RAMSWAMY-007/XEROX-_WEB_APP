import axios from 'axios';

let rawApiUrl = import.meta.env.VITE_API_URL || 'https://xerox-backend-plld.onrender.com/api';
// Fix for missing /api at the end (solves the 404 issue!)
if (rawApiUrl && !rawApiUrl.endsWith('/api')) {
  rawApiUrl = rawApiUrl.endsWith('/') ? rawApiUrl + 'api' : rawApiUrl + '/api';
}
const API_URL = rawApiUrl;

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

// --- Admin API Functions ---
export const adminLogin = async (credentials) => {
  const response = await client.post('/auth/admin/login', credentials);
  return response.data;
};

export const studentLogin = async (credentials) => {
  const response = await client.post('/auth/student/login', credentials);
  return response.data;
};

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
