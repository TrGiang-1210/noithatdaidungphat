// src/pages/cart/payCart.tsx - FIXED VERSION
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "@/styles/pages/user/payCart.scss";
import { getCurrentUser } from "@/api/user/userAPI";
import { useCart } from "@/context/CartContext";
import { useOrder } from "@/context/OrderContext";
import { AuthContext } from "@/context/AuthContext";
import { toast } from "react-toastify";
import provinces from "../../vn-provinces";
import axiosInstance from "../../axios";
import { getFirstImageUrl } from "@/utils/imageUrl";

const PayCart: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { addOrder } = useOrder();
  const { cartItems, clearCart, reloadCart, removeItem } = useCart();
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    name: "",
    address: "",
    city: "",
    note: "",
    paymentMethod: "cod",
  });

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        const u = JSON.parse(userInfo);
        setFormData((prev) => ({
          ...prev,
          name: u.name || "",
          phone: u.phone || "",
          email: u.email || "",
          address: u.address || "",
        }));
      } catch (e) {
        console.error("Error parsing user info:", e);
      }
    }

    if (typeof reloadCart === "function") {
      reloadCart().catch(() => {});
    }
  }, [reloadCart]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "city" || e.target.id === "province") {
      setFormData((prev) => ({ ...prev, city: value }));
      return;
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (cartItems.length === 0) {
      toast.error("Giỏ hàng trống!");
      return;
    }
    if (!formData.city) {
      toast.error("Vui lòng chọn tỉnh/thành phố");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    if (!formData.address.trim()) {
      toast.error("Vui lòng nhập địa chỉ");
      return;
    }

    setLoading(true);

    try {
      // ✅ Chuẩn bị dữ liệu order - XÓA ward và district
      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.product._id,
          quantity: item.quantity,
          price: item.product.price || item.product.priceSale || 0,
          name: item.product.name,
          img_url: Array.isArray(item.product.images) 
            ? item.product.images[0] 
            : item.product.image || item.product.img_url || "",
        })),
        total: totalPrice,
        payment_method: formData.paymentMethod === "cod" ? "cod" : "bank",
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim().replace(/\D/g, ''),
          email: formData.email.trim() || undefined,
          address: `${formData.address.trim()}, ${formData.city}`,
        },
        city: formData.city,
        note: formData.note.trim() || "",
        // ✅ XÓA HOÀN TOÀN ward và district
      };

      console.log("Đang gửi order data:", orderData);

      // Gọi API
      const result = await addOrder(orderData);
      console.log("Kết quả từ backend:", result);

      // Lấy thông tin đơn hàng
      const order = result?.order || result?.data || result;

      // Xóa giỏ hàng
      await clearCart();

      // Thông báo thành công
      toast.success("Đặt hàng thành công! Chúng tôi sẽ liên hệ ngay");

      // Chuyển trang
      navigate("/dat-hang-thanh-cong", {
        state: {
          orderCode: order?.code || order?.order_code || "DH" + Date.now(),
          trackingToken: order?.tracking_token || order?.token || "",
          total: totalPrice,
          isGuest: !user,
          customerInfo: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
          }
        },
      });
    } catch (err: any) {
      console.error("Lỗi đặt hàng:", err);
      console.error("Error response:", err.response?.data);
      
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error
        || err.message
        || "Đặt hàng thất bại. Vui lòng thử lại.";
      
      toast.error(errorMessage);
      
      if (err.response?.data) {
        console.error("Backend error details:", err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.info(
        "Bạn có thể xem giỏ hàng mà không cần đăng nhập. Đăng nhập để lưu đơn hoặc hoàn tất thanh toán."
      );
    }

    await handleSubmit({
      preventDefault: () => {},
    } as unknown as React.FormEvent);
  };

  return (
    <div className="paycart-container">
      <div className="paycart-wrapper">
        <div className="paycart-left">
          <h2>THÔNG TIN GIAO HÀNG</h2>

          <form onSubmit={handleSubmit} className="paycart-form">
            <div className="form-row">
              <input
                type="tel"
                placeholder="Số điện thoại *"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9\s\-\+]+"
                title="Vui lòng nhập số điện thoại hợp lệ"
              />
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              <input
                type="text"
                placeholder="Họ và tên *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={2}
              />

              <div className="address-select-group">
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn tỉnh / thành phố *</option>
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <input
              type="text"
              placeholder="Địa chỉ chi tiết *"
              name="address"
              className="address"
              value={formData.address}
              onChange={handleChange}
              required
              minLength={5}
            />
            <textarea
              placeholder="Nhập ghi chú (nếu có)"
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={3}
            />

            <div className="payment-methods">
              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === "cod"}
                  onChange={handleChange}
                />
                <span>Thanh toán khi nhận hàng</span>
              </label>

              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={formData.paymentMethod === "bank"}
                  onChange={handleChange}
                />
                <span>Thanh toán chuyển khoản</span>
              </label>
            </div>

            {formData.paymentMethod === "bank" && (
              <div className="bank-transfer-info">
                <div className="bank-header">
                  <strong>
                    Tài khoản ngân hàng: Ngân hàng Thương mại Cổ phần Á Châu
                    (ACB)
                  </strong>
                  <br />
                  Chủ tài khoản: <strong>LƯU THỊ NGỌC HÀ</strong> - Số tài
                  khoản: <strong>1005986868</strong>
                </div>
                <div className="qr-wrapper">
                  <img
                    src="./src/assets/qr-acbbank.jpg"
                    alt="QR chuyển khoản ACB"
                    className="qr-code"
                  />
                </div>
                <p className="note">
                  Sau khi chuyển khoản, vui lòng nhấn nút xác nhận bên dưới để
                  hoàn tất đơn hàng.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn-pay"
              disabled={loading || cartItems.length === 0}
            >
              {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN THANH TOÁN"}
            </button>
          </form>

          <div className="paycart-footer">
            <button onClick={() => navigate(-1)} className="btn-back">
              ← Quay lại trang trước
            </button>
            <span className="support">Hỗ trợ: 0941 038 839 </span>
          </div>
        </div>

        <div className="paycart-right">
          <div className="order-summary">
            {cartItems.length ? (
              cartItems.map((item, index) => {
                const product = item.product;
                if (!product) return null;

                return (
                  <div key={product._id || index} className="cart-item">
                    <div className="product-image-wrapper">
                      <img
                        src={getFirstImageUrl(product.images)}
                        alt={product.name || "Sản phẩm"}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/300x300?text=No+Image";
                        }}
                      />
                      {item.quantity > 1 && (
                        <span className="quantity-badge">{item.quantity}</span>
                      )}
                    </div>

                    <div className="item-info">
                      <h4>{product.name || "Không có tên"}</h4>
                      <p>Kích thước: {product.size || "Tiêu chuẩn"}</p>
                    </div>

                    <div className="item-price">
                      {((product.price || 0) * item.quantity).toLocaleString()}đ
                    </div>

                    <button
                      className="btn-remove-item"
                      onClick={() => removeItem(product._id)}
                      title="Xóa sản phẩm khỏi giỏ hàng"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-8 0h10l-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 6z" />
                      </svg>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="empty-cart">Giỏ hàng trống</div>
            )}

            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <strong>0 đ</strong>
            </div>
            <div className="summary-row total">
              <span>Tổng cộng</span>
              <strong className="final-price">
                {totalPrice.toLocaleString()} đ
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayCart;