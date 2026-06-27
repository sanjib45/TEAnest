import API from './merchantApi';

export const buyerAPI = {
  search:       (q)        => API.get('/buyers/search', { params: { q } }),
  getAll:       (params)   => API.get('/buyers', { params }),
  getById:      (id)       => API.get(`/buyers/${id}`),
  findOrCreate: (data)     => API.post('/buyers', data),
  update:       (id, data) => API.put(`/buyers/${id}`, data),
  remove:       (id)       => API.delete(`/buyers/${id}`),
};
