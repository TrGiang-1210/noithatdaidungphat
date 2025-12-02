// src/api/axiosInstance.ts (hoặc tên file bạn đang dùng)
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api", // TỐT HƠN: dùng .env
  timeout: 15000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Giữ nguyên phần response interceptor của bạn (có xử lý 401 rất tốt)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.debug("API Error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      delete axiosInstance.defaults.headers.common["Authorization"];
      window.dispatchEvent(new CustomEvent("app:auth-logout"));
      // Có thể thêm: window.location.href = '/tai-khoan-ca-nhan';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;