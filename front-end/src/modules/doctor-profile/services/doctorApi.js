import axios from 'axios';
import { API_BASE_URL } from '../../../config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/doctors`,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hospflow_auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const doctorApi = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.patch('/profile', data),
  updateImage: (file, onProgress) => {
    const form = new FormData();
    form.append('image', file);
    return api.patch('/profile/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
  updateAvailability: (availability) => api.patch('/profile/availability', { availability }),
  updateSettings: (settings) => api.patch('/profile/settings', { settings }),
  updatePassword: (data) => api.patch('/profile/password', data),
  updateSecurity: (data) => api.patch('/profile/security', data),
  uploadDocument: (file, type, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    return api.post('/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
  deleteDocument: (docId) => api.delete(`/documents/${docId}`),
  getActivity: () => api.get('/profile/activity'),
  sendMobileOtp: () => api.post('/verify/mobile/send'),
  verifyMobileOtp: (otp) => api.post('/verify/mobile', { otp }),
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export default doctorApi;
