import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('nf_token');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  updateSettings: (settings) => api.put('/auth/settings', settings),
};

export const notesAPI = {
  getAll: (archived = false) => api.get(`/notes?archived=${archived}`),
  create: (note) => api.post('/notes', note),
  update: (id, updates) => api.put(`/notes/${id}`, updates),
  delete: (id) => api.delete(`/notes/${id}`),
  share: (id) => api.post(`/notes/${id}/share`),
  revoke: (id) => api.post(`/notes/${id}/revoke`),
  getPublic: (token) => api.get(`/public/notes/${token}`),
};

export const aiAPI = {
  summarize: (content) => api.post('/ai/summary', { content }),
  extractActions: (content) => api.post('/ai/actions', { content }),
  suggestTitle: (content) => api.post('/ai/suggest-title', { content }),
};

export const statsAPI = {
  getStats: () => api.get('/stats'),
  trackUsage: () => api.post('/stats/ai-usage'),
};

export default api;
