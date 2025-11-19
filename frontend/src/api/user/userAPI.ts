import axiosInstance from "../../axios";

// ==================== ĐỊNH NGHĨA KIỂU USER MỚI ====================
export interface User {
  _id: string;
  name: string;
  phone: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
  // password không trả về từ server (tốt cho bảo mật)
}

// ==================== ĐĂNG KÝ ====================
export const registerUser = async (userData: {
  name: string;
  phone: string;
  email: string;
  password: string;
}): Promise<{ message: string; user: User }> => {
  const response = await axiosInstance.post('/auth/register', userData);
  return response.data;
};

// ==================== ĐĂNG NHẬP ====================
export const loginUser = async (credentials: {
  email: string;
  password: string;
}): Promise<{
  token: string;
  user: User;
}> => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data;
};

// ==================== QUÊN MẬT KHẨU ====================
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await axiosInstance.post('/auth/forgot-password', { email });
  return response.data;
};

// ==================== ĐẶT LẠI MẬT KHẨU ====================
export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
  const response = await axiosInstance.post('/auth/reset-password', { token, newPassword });
  return response.data;
};

// ==================== LẤY THÔNG TIN USER HIỆN TẠI (sau khi login) ====================
export const getCurrentUser = async (): Promise<User> => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};

// ==================== CẬP NHẬT THÔNG TIN CÁ NHÂN ====================
export const updateProfile = async (updatedData: {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
}): Promise<User> => {
  const response = await axiosInstance.put('/auth/profile', updatedData);
  return response.data;
};

// ==================== ADMIN: LẤY TẤT CẢ NGƯỜI DÙNG ====================
export const fetchAllUsers = async (): Promise<User[]> => {
  const response = await axiosInstance.get('/admin/users');
  return response.data;
};

// ==================== ADMIN: LẤY CHI TIẾT USER ====================
export const fetchUserById = async (userId: string): Promise<User> => {
  const response = await axiosInstance.get(`/admin/users/${userId}`);
  return response.data;
};

// ==================== ADMIN: CẬP NHẬT USER ====================
export const updateUserByAdmin = async (
  userId: string,
  updatedData: {
    name?: string;
    phone?: string;
    email?: string;
    role?: 'user' | 'admin';
  }
): Promise<User> => {
  const response = await axiosInstance.put(`/admin/users/${userId}`, updatedData);
  return response.data;
};

// ==================== ADMIN: XÓA USER ====================
export const deleteUserByAdmin = async (userId: string): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`/admin/users/${userId}`);
  return response.data;
};