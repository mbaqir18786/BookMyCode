const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : 'http://localhost:5000';

export default API_BASE_URL;
export { API_BASE_URL };
