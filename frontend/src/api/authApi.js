import API from './merchantApi';

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  getProfile: () => API.get('/users/me'),
  updateProfile: (data) => API.put('/users/me', data),
  changePassword: (data) => API.put('/users/change-password', data),
};
