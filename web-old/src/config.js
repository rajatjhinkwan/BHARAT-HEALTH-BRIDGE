
const MACHINE_IP = '10.148.13.85'; 

// Use localhost if we are on the same machine, otherwise use the detected local IP
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_HOST = isLocal ? 'localhost' : MACHINE_IP;

export const API_BASE_URL = `http://${API_HOST}:4000/api`;
export const OCR_BASE_URL = `http://${API_HOST}:8000`;
