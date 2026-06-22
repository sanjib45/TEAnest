import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const merchantTxnAPI = {
  getAll:   (params) => API.get('/merchant-transactions', { params }),
  getById:  (id)     => API.get(`/merchant-transactions/${id}`),
  getStats: ()       => API.get('/merchant-transactions/stats'),
  create:   (data)   => API.post('/merchant-transactions', data),
  update:   (id, data) => API.put(`/merchant-transactions/${id}`, data),
  remove:   (id)     => API.delete(`/merchant-transactions/${id}`),

  // Client-side calculation mirror (instant UI feedback without round-trip)
  compute: (d) => {
    const grossQty             = Number(d.grossQty)             || 0;
    const lessPercent          = Number(d.lessPercent)          || 0;
    const ratePerKg            = Number(d.ratePerKg)            || 0;
    const laborCount           = Number(d.laborCount)           || 0;
    const laborChargePerWorker = Number(d.laborChargePerWorker) || 0;
    const advancePayment       = Number(d.advancePayment)       || 0;

    const r2 = (n) => Math.round(n * 100) / 100;

    const lessQty           = r2(grossQty * (lessPercent / 100));
    const netQty            = r2(grossQty - lessQty);
    const grossAmount       = r2(netQty * ratePerKg);
    const totalLaborCharges = r2(laborCount * laborChargePerWorker);
    const netPayable        = r2(grossAmount - totalLaborCharges);
    const finalPayable      = r2(netPayable - advancePayment);
    const balance           = finalPayable;

    return { lessQty, netQty, grossAmount, totalLaborCharges, netPayable, finalPayable, balance };
  },
  // ── Payments sub-resource ─────────────────────────────────────────────────
  getPayments:    (txnId)         => API.get(`/merchant-transactions/${txnId}/payments`),
  addPayment:     (txnId, data)   => API.post(`/merchant-transactions/${txnId}/payments`, data),
  deletePayment:  (txnId, payId)  => API.delete(`/merchant-transactions/${txnId}/payments/${payId}`),
};

export default API;
