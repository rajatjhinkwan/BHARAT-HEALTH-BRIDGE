const envApi = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : '';

const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const fallbackHost =
  typeof window !== 'undefined' && window.location?.hostname
    ? window.location.hostname
    : 'localhost';

export const API_BASE_URL = envApi || `http://${fallbackHost}:4000/api`;
export const OCR_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OCR_URL) ||
  `http://${fallbackHost}:8000`;
