import client from './client';
export const merchantMasterAPI = {
  search:          (q)              => client.get('/merchants/search', { params: { q } }),
  getAll:          (params)         => client.get('/merchants', { params }),
  getById:         (id)             => client.get(`/merchants/${id}`),
  findOrCreate:    (data)           => client.post('/merchants', data),
  update:          (id, data)       => client.put(`/merchants/${id}`, data),
  remove:          (id)             => client.delete(`/merchants/${id}`),
  // ── Advance Payments ──────────────────────────────────────────────────────
  getAdvances:     (merchantId)     => client.get(`/merchants/${merchantId}/advances`),
  createAdvance:   (merchantId, d)  => client.post(`/merchants/${merchantId}/advances`, d),
  deleteAdvance:   (merchantId, id) => client.delete(`/merchants/${merchantId}/advances/${id}`),
};

