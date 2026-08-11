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
  getMe: () => api.get('/auth/me')
};

export const customerAPI = {
  getCustomers: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/customers', { params }),
  getCustomerById: (id: string | number) => api.get(`/customers/${id}`),
  createCustomer: (data: any) => api.post('/customers', data),
  updateCustomer: (id: string | number, data: any) => api.put(`/customers/${id}`, data),
  addFollowUp: (id: string | number, data: { note: string; follow_up_date?: string }) =>
    api.post(`/customers/${id}/followups`, data)
};

export const productAPI = {
  getProducts: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/products', { params }),
  getProductById: (id: string | number) => api.get(`/products/${id}`),
  createProduct: (data: any) => api.post('/products', data),
  updateProduct: (id: string | number, data: any) => api.put(`/products/${id}`, data),
  getStockMovements: () => api.get('/products/movements')
};

export const challanAPI = {
  getChallans: (params?: { status?: string }) => api.get('/challans', { params }),
  getChallanById: (id: string | number) => api.get(`/challans/${id}`),
  createChallan: (data: { customerId: number; items: { productId: number; qty: number }[]; status: 'Draft' | 'Confirmed' }) =>
    api.post('/challans', data),
  updateStatus: (id: string | number, status: 'Confirmed' | 'Cancelled') =>
    api.put(`/challans/${id}/status`, { status })
};

export default api;
