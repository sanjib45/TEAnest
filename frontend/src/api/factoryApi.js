import API from './merchantApi'; // Reusing the configured axios instance

export const factoryAPI = {
  getAll:        (params) => API.get('/factory', { params }),
  getById:       (id)     => API.get(`/factory/${id}`),
  create:        (data)   => API.post('/factory', data),
  update:        (id, data) => API.put(`/factory/${id}`, data),
  remove:        (id)     => API.delete(`/factory/${id}`),
  getStats:      ()       => API.get('/factory/stats'),
  addPayment:    (id, paymentData) => API.post(`/factory/${id}/payments`, paymentData),
  removePayment: (id, paymentId)   => API.delete(`/factory/${id}/payments/${paymentId}`),
};
