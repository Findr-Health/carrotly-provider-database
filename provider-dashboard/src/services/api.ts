import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('providerToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const dashboardAPI = {
  getStats: () => api.get('/provider/dashboard/stats'),
  getTodaysSchedule: () => api.get('/provider/dashboard/todays-schedule'),
};

export const transactionAPI = {
  getTransaction: (appointmentId: string) => 
    api.get(`/provider/appointments/${appointmentId}/transaction`),
  adjustTransaction: (appointmentId: string, data: any) => 
    api.post(`/provider/appointments/${appointmentId}/adjust`, data),
};

export const calendarAPI = {
  getAppointments: (start: string, end: string) => 
    api.get(`/provider/calendar?start=${start}&end=${end}`),
};

export const servicesAPI = {
  getAll: () => api.get('/provider/services'),
  update: (serviceId: string, data: any) => 
    api.put(`/provider/services/${serviceId}`, data),
};

export default api;
