import API from './inventoryApi'; // Reusing the configured axios instance

export const salesAPI = {
  getAll: (params) => API.get('/sales', { params }),
  getById: (id) => API.get(`/sales/${id}`),
  create: (data) => API.post('/sales', data),
  update: (id, data) => API.put(`/sales/${id}`, data),
  remove: (id) => API.delete(`/sales/${id}`),
  getStats: () => API.get('/sales/stats'),
};
