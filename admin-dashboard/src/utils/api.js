import axios from 'axios';

const API_BASE_URL = 'https://fearless-achievement-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/admin/login', { email, password }),
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },
};

export const providersAPI = {
  // Get all providers with optional filters
  getAll: (params) => api.get('/admin/providers', { params }),
  
  // Get single provider by ID
  getById: (id) => api.get(`/admin/providers/${id}`),
  
  // Create new provider
  create: (data) => api.post('/admin/providers', data),
  
  // FULL provider update - updates all fields
  update: (id, data) => api.put(`/admin/providers/${id}`, data),
  
  // Delete provider
  delete: (id) => api.delete(`/admin/providers/${id}`),
  
  // Update status only
  updateStatus: (id, status) => api.patch(`/admin/providers/${id}/status`, { status }),
};

export const servicesAPI = {
  // Get services for a provider
  getByProvider: (providerId) => api.get(`/admin/providers/${providerId}/services`),
  
  // Add service to provider
  create: (providerId, data) => api.post(`/admin/providers/${providerId}/services`, data),
  
  // Update single service
  update: (providerId, serviceId, data) => 
    api.put(`/admin/providers/${providerId}/services/${serviceId}`, data),
  
  // Delete service
  delete: (providerId, serviceId) => 
    api.delete(`/admin/providers/${providerId}/services/${serviceId}`),
};

export const teamAPI = {
  // Add team member
  add: (providerId, data) => api.post(`/admin/providers/${providerId}/team`, data),
  
  // Delete team member
  delete: (providerId, memberId) => 
    api.delete(`/admin/providers/${providerId}/team/${memberId}`),
};

export const photosAPI = {
  // Add photo
  add: (providerId, data) => api.post(`/admin/providers/${providerId}/photos`, data),
  
  // Delete photo
  delete: (providerId, photoId) => 
    api.delete(`/admin/providers/${providerId}/photos/${photoId}`),
};

export const dashboardAPI = {
  // Get dashboard statistics
  getStats: () => api.get('/admin/dashboard/stats'),
};

export default api;
