import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: false,
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // Remove token on 401 but don't force redirect here.
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // let AuthContext handle UI and navigation; avoid window.location.href here
      // Optionally dispatch an event that AuthContext can listen to:
      try {
        window.dispatchEvent(new CustomEvent("app:auth-logout"));
      } catch (e) { /* ignore */ }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
