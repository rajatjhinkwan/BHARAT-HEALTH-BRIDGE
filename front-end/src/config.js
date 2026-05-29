const envApi = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : '';

const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const getFallbackApiUrl = () => {
  if (isLocal) {
    return 'http://localhost:4000/api';
  }
  return 'https://bhb-api.onrender.com/api';
};

export const API_BASE_URL = envApi || getFallbackApiUrl();

const envOcr = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_OCR_URL : '';
export const OCR_BASE_URL = envOcr || (isLocal ? 'http://localhost:8000' : 'https://bhb-ocr.onrender.com');
