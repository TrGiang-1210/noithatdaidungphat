import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // Đổi nếu backend bạn chạy port khác
  withCredentials: false,               // Bật nếu backend dùng cookie
  timeout: 10000,                       // 10s timeout
});

// Thêm token vào header nếu có
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

// Xử lý lỗi trả về từ server
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // Nếu token hết hạn, chuyển về login
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
