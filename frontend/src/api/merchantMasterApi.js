import API from './merchantApi';

export const merchantMasterAPI = {
  search:        (q)       => API.get('/merchants/search', { params: { q } }),
  getAll:        (params)  => API.get('/merchants', { params }),
  getById:       (id)      => API.get(`/merchants/${id}`),
  findOrCreate:  (data)    => API.post('/merchants', data),
  update:        (id, data)=> API.put(`/merchants/${id}`, data),
  remove:        (id)      => API.delete(`/merchants/${id}`),
};
