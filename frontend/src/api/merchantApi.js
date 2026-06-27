import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach auth token if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const merchantAPI = {
  getAll: (params) => API.get('/merchant', { params }),
  getById: (id) => API.get(`/merchant/${id}`),
  create: (data) => API.post('/merchant', data),
  update: (id, data) => API.put(`/merchant/${id}`, data),
  remove: (id) => API.delete(`/merchant/${id}`),
  getStats: () => API.get('/merchant/stats'),
};

export default API;
