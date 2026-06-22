import API from './merchantApi'; // Reusing the configured axios instance

export const laborAPI = {
  getAll: (params) => API.get('/labor', { params }),
  getById: (id) => API.get(`/labor/${id}`),
  create: (data) => API.post('/labor', data),
  update: (id, data) => API.put(`/labor/${id}`, data),
  remove: (id) => API.delete(`/labor/${id}`),
  getStats: () => API.get('/labor/stats'),
};
