import axios from 'axios';

/**
 * Khi chạy local, Vite chuyển tiếp `/api` sang server localhost qua proxy.
 * Khi deploy Vercel, đặt VITE_API_URL=https://<ten-dich-vu>.onrender.com/api
 * để trình duyệt gọi trực tiếp API Render. Không ghi URL production cứng vào mã nguồn.
 */
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');

const api = axios.create({
  baseURL: configuredApiUrl || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
