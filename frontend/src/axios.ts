// src/api/axiosInstance.ts
import axios from "axios";

// QUAN TRỌNG: Fallback phải là production URL, không phải localhost
const baseURL = import.meta.env.VITE_API_URL || "https://tongkhonoithattayninh.vn/api";

const axiosInstance = axios.create({
  baseURL: baseURL,
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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.debug("API Error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      delete axiosInstance.defaults.headers.common["Authorization"];
      window.dispatchEvent(new CustomEvent("app:auth-logout"));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;