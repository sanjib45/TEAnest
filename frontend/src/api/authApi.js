import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api/auth' });

export const authAPI = {
  login: (data) => API.post('/login', data),
  register: (data) => API.post('/register', data),
  resetPassword: (data) => API.post('/reset-password', data),
};
