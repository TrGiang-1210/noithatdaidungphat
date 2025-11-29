// src/api/orderAPI.ts (đã fix + bổ sung hoàn chỉnh)
import axiosInstance from '../../axios';

// 🧾 Tạo đơn hàng mới (khi thanh toán)
export const createOrder = async (orderData: any) => {
  const res = await axiosInstance.post(`/orders`, orderData);
  return res.data;
};

// 📄 Lấy danh sách tất cả đơn hàng (admin)
export const getOrders = async () => {
  const res = await axiosInstance.get(`/orders`);
  return res.data;
};

// 🔍 Lấy chi tiết 1 đơn hàng theo ID (dành cho user đã đăng nhập hoặc admin)
export const getOrderById = async (id: string) => {
  const res = await axiosInstance.get(`/orders/${id}`);
  return res.data;
};

// NEW: TRA CỨU ĐƠN HÀNG CÔNG KHAI (không cần đăng nhập)
// Dùng cho trang /kiem-tra-don-hang
export const trackOrderPublic = async (orderCode: string, phone: string) => {
  const res = await axiosInstance.post(`/order/track`, {
    order_code: orderCode,
    phone: phone.replace(/\D/g, ''), // loại bỏ dấu cách, dấu gạch, v.v.
  });
  return res.data;
};

// Cập nhật trạng thái đơn hàng (admin)
export const updateOrderStatus = async (id: string, status: string) => {
  const res = await axiosInstance.put(`/orders/${id}`, { status });
  return res.data;
};

// Hủy đơn hàng
export const cancelOrder = async (id: string) => {
  const res = await axiosInstance.put(`/orders/${id}`, { status: 'cancelled' });
  return res.data;
};

// Xóa đơn hàng (admin)
export const deleteOrder = async (id: string) => {
  const res = await axiosInstance.delete(`/orders/${id}`);
  return res.data;
};