import axios from 'axios';

const API_BASE_URL = 'https://fearless-achievement-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/admin/login', { email, password }),
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },
};

export const providersAPI = {
  getAll: (params) => api.get('/admin/providers', { params }),
  getById: (id) => api.get(`/admin/providers/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/providers/${id}/status`, { status }),
};

export const servicesAPI = {
  getByProvider: (providerId) => api.get(`/admin/providers/${providerId}/services`),
};

export default api;

export const photosAPI = {
  getByProvider: (providerId) => api.get(`/admin/providers/${providerId}/photos`),
};
