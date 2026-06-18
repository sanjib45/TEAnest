import API from './inventoryApi'; // Reusing the configured axios instance

export const paymentsAPI = {
  getAll: (params) => API.get('/payments', { params }),
  getById: (id) => API.get(`/payments/${id}`),
  create: (data) => API.post('/payments', data),
  update: (id, data) => API.put(`/payments/${id}`, data),
  remove: (id) => API.delete(`/payments/${id}`),
  getStats: () => API.get('/payments/stats'),
};
