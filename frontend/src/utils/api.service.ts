import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Tự động thêm token và ngôn ngữ
apiClient.interceptors.request.use(
  (config) => {
    // Add token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add language header from localStorage
    const currentLang = localStorage.getItem('language') || 'vi';
    config.headers['Accept-Language'] = currentLang;
    
    // Add language to query params if not already present
    if (config.params) {
      config.params.lang = config.params.lang || currentLang;
    } else {
      config.params = { lang: currentLang };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý lỗi
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Product APIs
export const productApi = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  }
};

// Auth APIs
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (data: any) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }
};

// Translation APIs
export const translationApi = {
  getTranslations: async (lang: string, namespace?: string) => {
    const params: any = { lang };
    if (namespace) params.namespace = namespace;
    const response = await apiClient.get('/admin/translations', { params });
    return response.data;
  },
  
  getTranslationKeys: async (params?: any) => {
    const response = await apiClient.get('/admin/translations/keys', { params });
    return response.data;
  },
  
  requestAITranslation: async (translationId: string, targetLang: string = 'zh') => {
    const response = await apiClient.post('/admin/translations/ai-translate', {
      translationId,
      targetLang
    });
    return response.data;
  },
  
  batchAITranslation: async (translationIds: string[], targetLang: string = 'zh') => {
    const response = await apiClient.post('/admin/translations/batch-ai-translate', {
      translationIds,
      targetLang
    });
    return response.data;
  }
};

export default apiClient;