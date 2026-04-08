import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (email: string, password: string, name?: string) =>
    api.post('/api/auth/register', { email, password, name }),
  me: () => api.get('/api/auth/me'),
};

// Meetings
export const meetingsApi = {
  list: (params?: { limit?: number; offset?: number; status?: string }) =>
    api.get('/api/meetings', { params }),
  get: (id: string) => api.get(`/api/meetings/${id}`),
  create: (data: { title: string; description?: string; audioUrl?: string }) =>
    api.post('/api/meetings', data),
  update: (id: string, data: any) => api.patch(`/api/meetings/${id}`, data),
  delete: (id: string) => api.delete(`/api/meetings/${id}`),
  process: (id: string) => api.post(`/api/meetings/${id}/process`),
};

// Settings
export const settingsApi = {
  get: () => api.get('/api/settings'),
  update: (data: any) => api.patch('/api/settings', data),
};

// Upload
export const uploadApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
