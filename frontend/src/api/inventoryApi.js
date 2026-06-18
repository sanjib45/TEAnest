import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const inventoryAPI = {
  getAll: (params) => API.get('/inventory', { params }),
  getById: (id) => API.get(`/inventory/${id}`),
  create: (data) => API.post('/inventory', data),
  update: (id, data) => API.put(`/inventory/${id}`, data),
  remove: (id) => API.delete(`/inventory/${id}`),
  getStats: () => API.get('/inventory/stats'),
};

export default API;
