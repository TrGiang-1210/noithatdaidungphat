import axiosInstance from '../../axios';

// 🧾 Tạo đơn hàng mới
export const createOrder = async (orderData: any) => {
  const res = await axiosInstance.post(`/orders`, orderData);
  return res.data;
};

// 📄 Lấy danh sách tất cả đơn hàng (cho admin)
export const getOrders = async () => {
  const res = await axiosInstance.get(`/orders`);
  return res.data.map((order: any) => ({
    ...order,
    items: order.items || []
  }));
};

// 🔍 Lấy chi tiết 1 đơn hàng theo ID
export const getOrderById = async (id: string) => {
  const res = await axiosInstance.get(`/orders/${id}`);
  return res.data;
};

// 🔄 Cập nhật trạng thái đơn hàng (hủy)
export const cancelOrder = async (id: string) => {
  const res = await axiosInstance.put(`/orders/${id}`, { status: 'cancelled' });
  return res.data;
};

// ❌ Xoá đơn hàng
export const deleteOrder = async (id: string) => {
  const res = await axiosInstance.delete(`/orders/${id}`);
  return res.data;
};

export const cancelOrderAPI = async (id: string) => {
  const res = await axiosInstance.put(`/orders/${id}`, { status: "cancelled" });
  return res.data;
};

export const deleteOrderAPI = async (id: string) => {
  const res = await axiosInstance.delete(`/orders/${id}`);
  return res.data;
};

// 🔄 Cập nhật trạng thái đơn hàng (bất kỳ)
export const updateOrderStatus = async (id: string, status: string) => {
  const res = await axiosInstance.put(`/orders/${id}`, { status });
  return res.data;
};
    