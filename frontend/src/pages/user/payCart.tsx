// src/pages/cart/payCart.tsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "@/styles/pages/user/payCart.scss";
import { getCurrentUser } from "@/api/user/userAPI";
import { useCart } from "@/context/CartContext";
import { useOrder } from "@/context/OrderContext";
import { AuthContext } from "@/context/AuthContext";
import { toast } from "react-toastify";
import provinces from "../../vn-provinces";
import axiosInstance from "@/axios";

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

  // Load thông tin user khi vào trang — nếu không có user thì cho guest
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
      } catch (e) {}
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
    // Đặc biệt xử lý cho tỉnh/thành (vì select bị thư viện ghi đè)
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

    if (cartItems.length === 0) {
      toast.error("Giỏ hàng trống!");
      return;
    }
    if (!formData.city) {
      toast.error("Vui lòng chọn tỉnh/thành phố");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.product._id,
          quantity: item.quantity,
          price: item.product.price || item.product.priceSale || 0,
          name: item.product.name,
          img_url: item.product.images?.[0] || item.product.image || "",
        })),
        total: totalPrice,
        payment_method: formData.paymentMethod === "cod" ? "cod" : "bank",
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          address: `${formData.address.trim()}, ${formData.city}`,
        },
        city: formData.city,
        district: "Không yêu cầu",
        ward: "Không yêu cầu",
        // note: formData.note || "",
      };

      // Gọi API → nhận kết quả
      const result = await addOrder(orderData);
      console.log("Kết quả từ backend:", result); // ← xem cái này

      // Lấy thông tin đơn hàng dù backend trả kiểu gì
      const order = result.order || result.data || result;

      await clearCart();

      // CHỈ TOAST 1 LẦN DUY NHẤT Ở ĐÂY
      toast.success("Đặt hàng thành công! Chúng tôi sẽ liên hệ ngay");

      // CHUYỂN TRANG NGAY LẬP TỨC, KHÔNG DÙNG setTimeout NỮA
      navigate("/dat-hang-thanh-cong", {
        state: {
          orderCode: order.code || order.order_code || "DH" + Date.now(),
          trackingToken: order.tracking_token || order.token || "",
          total: totalPrice,
          isGuest: !user,
        },
      });
    } catch (err: any) {
      console.error("Lỗi đặt hàng:", err);
      toast.error(
        err.response?.data?.message || "Đặt hàng thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.info(
        "Bạn có thể xem giỏ hàng mà không cần đăng nhập. Đăng nhập để lưu đơn hoặc hoàn tất thanh toán."
      );
      // Nếu muốn bắt đăng nhập để xác thực đơn, uncomment next line:
      // navigate('/tai-khoan-ca-nhan');
      // return;
    }

    // reuse submit logic
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
            {/* error / guest notice could be added here */}
            <div className="form-row">
              <input
                type="text"
                placeholder="Số điện thoại"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                placeholder="Họ và tên"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <div className="address-select-group">
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn tỉnh / thành phố</option>
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
              placeholder="Địa chỉ"
              name="address"
              className="address"
              value={formData.address}
              onChange={handleChange}
              required
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
                <span>Thanh toán khi nhận hàng (COD)</span>
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
            {/* === KHUNG QR CHUYỂN KHOẢN - CHỈ HIỆN KHI CHỌN "bank" === */}
            {formData.paymentMethod === "bank" && (
              <div className="bank-transfer-info">
                <div className="bank-header">
                  <strong>
                    Tài khoản ngân hàng: Ngân hàng Thương Mại Cổ Phần Á Châu
                    (ACB)
                  </strong>
                  <br />
                  Chủ tài khoản: <strong>LƯU THỊ NGỌC HÀ</strong> - Số tài
                  khoản: <strong>1005986868</strong>
                </div>
                <div className="qr-wrapper">
                  <img
                    src="./src/assets/qr-acbbank.jpg"
                    alt="QR chuyển khoản TPBank"
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

                const imageUrl = Array.isArray(product.images)
                  ? product.images[0]
                  : product.image || product.img_url || "/images/no-image.png";

                return (
                  <div key={product._id || index} className="cart-item">
                    {/* Ảnh + badge số lượng */}
                    <div className="product-image-wrapper">
                      <img src={imageUrl} alt={product.name || "Sản phẩm"} />
                      {item.quantity > 1 && (
                        <span className="quantity-badge">{item.quantity}</span>
                      )}
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="item-info">
                      <h4>{product.name || "Không có tên"}</h4>
                      <p>Kích thước: {product.size || "Tiêu chuẩn"}</p>
                    </div>

                    {/* Giá tiền */}
                    <div className="item-price">
                      {((product.price || 0) * item.quantity).toLocaleString()}đ
                    </div>

                    {/* Nút XÓA - mới thêm */}
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

          {/* <div className="suggested-products">
            <h3>THƯỜNG ĐƯỢC MUA KÈM</h3>
            <div className="suggested-item">
              <img src="/assets/products/giuong1.jpg" alt="Gợi ý" />
              <div>
                <h4>
                  Mẫu Giường Gỗ Công Nghiệp Trơn Hiện Đại Chuẩn Xu Hướng 2025
                </h4>
                <p className="price">
                  3.500.000đ <del>4.550.000đ</del>
                </p>
              </div>
              <button>Xem ngay</button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default PayCart;
