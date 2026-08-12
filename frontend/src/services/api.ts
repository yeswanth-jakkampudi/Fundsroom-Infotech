import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Interceptor: always attach the latest Supabase access token
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Calls
export const authAPI = {
  getMe: () => api.get('/api/auth/me')
};

export const customerAPI = {
  getCustomers: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/api/customers', { params }),
  getCustomerById: (id: string | number) => api.get(`/api/customers/${id}`),
  createCustomer: (data: any) => api.post('/api/customers', data),
  updateCustomer: (id: string | number, data: any) => api.put(`/api/customers/${id}`, data),
  addFollowUp: (id: string | number, data: { note: string; follow_up_date?: string }) =>
    api.post(`/api/customers/${id}/followups`, data)
};

export const productAPI = {
  getProducts: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/api/products', { params }),
  getProductById: (id: string | number) => api.get(`/api/products/${id}`),
  createProduct: (data: any) => api.post('/api/products', data),
  updateProduct: (id: string | number, data: any) => api.put(`/api/products/${id}`, data),
  getStockMovements: () => api.get('/api/products/movements')
};

export const challanAPI = {
  getChallans: (params?: { status?: string }) => api.get('/api/challans', { params }),
  getChallanById: (id: string | number) => api.get(`/api/challans/${id}`),
  createChallan: (data: { customerId: number; items: { productId: number; qty: number }[]; status: 'Draft' | 'Confirmed' }) =>
    api.post('/api/challans', data),
  updateStatus: (id: string | number, status: 'Confirmed' | 'Cancelled') =>
    api.put(`/api/challans/${id}/status`, { status })
};

export default api;
