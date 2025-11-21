import axiosInstance from '../../axios';

/**
 * Lấy toàn bộ giỏ hàng hiện tại
 */
export const fetchCart = async () => {
  const res = await axiosInstance.get(`/cart`);
  return res.data;
};

/**
 * Thêm sản phẩm vào giỏ hàng
 */
export const addToCartAPI = async (product_id: string, quantity: number) => {
  return await axiosInstance.post(`/cart`, { product_id, quantity });
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ hàng
 */
export const updateCartItemAPI = async (product_id: string, quantity: number) => {
  try {
    const res = await axiosInstance.put(`/cart`, { product_id, quantity });
    return res.data;
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật giỏ hàng:', err);
    throw err;
  }
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 */
export const removeCartItemAPI = async (product_id: string) => {
  try {
    const res = await axiosInstance.delete(`/cart`, {
      data: { product_id }
    });
    return res.data;
  } catch (err) {
    console.error('❌ Lỗi khi xóa sản phẩm:', err);
    throw err;
  }
};

/**
 * Xóa toàn bộ giỏ hàng
 */
export const clearCartAPI = async () => {
  try {
    const res = await axiosInstance.delete(`/cart/clear`);
    return res.data;
  } catch (err) {
    console.error('❌ Lỗi khi xóa giỏ hàng:', err);
    throw err;
  }
};
