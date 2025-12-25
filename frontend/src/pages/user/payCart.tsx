// src/pages/cart/payCart.tsx - MULTILINGUAL VERSION
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
import { useLanguage } from "@/context/LanguageContext";

const PayCart: React.FC = () => {
  const { t, language } = useLanguage();
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

  // ✅ Helper to get text from multilingual product name
  const getProductName = (name: any): string => {
    if (!name) return t("cart.noProductName") || "Không có tên";
    if (typeof name === "string") return name;
    if (typeof name === "object" && name !== null) {
      return name[language] || name.vi || name.en || String(name);
    }
    return String(name);
  };

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
      toast.error(t("cart.emptyCart") || "Giỏ hàng trống!");
      return;
    }
    if (!formData.city) {
      toast.error(
        t("checkout.selectProvince") || "Vui lòng chọn tỉnh/thành phố"
      );
      return;
    }
    if (!formData.name.trim()) {
      toast.error(t("checkout.enterName") || "Vui lòng nhập họ tên");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error(t("checkout.enterPhone") || "Vui lòng nhập số điện thoại");
      return;
    }
    if (!formData.address.trim()) {
      toast.error(t("checkout.enterAddress") || "Vui lòng nhập địa chỉ");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.product._id,
          quantity: item.quantity,
          price: item.product.price || item.product.priceSale || 0,
          name: getProductName(item.product.name),
          img_url: Array.isArray(item.product.images)
            ? item.product.images[0]
            : item.product.image || item.product.img_url || "",
          selectedAttributes:
            item.selectedAttributes || item.product.selectedAttributes || {}, // ✅ THÊM DÒNG NÀY
        })),
        total: totalPrice,
        payment_method: formData.paymentMethod === "cod" ? "cod" : "bank",
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim().replace(/\D/g, ""),
          email: formData.email.trim() || undefined,
          address: formData.address.trim(),
        },
        city: formData.city,
        note: formData.note.trim() || "",
      };

      console.log("Đang gửi order data:", orderData);

      const result = await addOrder(orderData);
      console.log("Kết quả từ backend:", result);

      const order = result?.order || result?.data || result;

      await clearCart();

      toast.success(
        t("checkout.orderSuccess") ||
          "Đặt hàng thành công! Chúng tôi sẽ liên hệ ngay"
      );

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
          },
        },
      });
    } catch (err: any) {
      console.error("Lỗi đặt hàng:", err);
      console.error("Error response:", err.response?.data);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        t("checkout.orderFailed") ||
        "Đặt hàng thất bại. Vui lòng thử lại.";

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
        t("checkout.guestCheckoutInfo") ||
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
          <h2>{t("checkout.deliveryInfo") || "THÔNG TIN GIAO HÀNG"}</h2>

          <form onSubmit={handleSubmit} className="paycart-form">
            <div className="form-row">
              <input
                type="tel"
                placeholder={
                  t("checkout.phonePlaceholder") || "Số điện thoại *"
                }
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9\s\-\+]+"
                title={
                  t("checkout.validPhone") ||
                  "Vui lòng nhập số điện thoại hợp lệ"
                }
              />
              <input
                type="email"
                placeholder={t("checkout.emailPlaceholder") || "Email"}
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              <input
                type="text"
                placeholder={t("checkout.namePlaceholder") || "Họ và tên *"}
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
                  <option value="">
                    {t("checkout.selectProvince") || "Chọn tỉnh / thành phố *"}
                  </option>
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
              placeholder={
                t("checkout.addressPlaceholder") || "Địa chỉ chi tiết *"
              }
              name="address"
              className="address"
              value={formData.address}
              onChange={handleChange}
              required
              minLength={5}
            />
            <textarea
              placeholder={
                t("checkout.notePlaceholder") || "Nhập ghi chú (nếu có)"
              }
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
                <span>
                  {t("checkout.paymentCOD") || "Thanh toán khi nhận hàng"}
                </span>
              </label>

              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={formData.paymentMethod === "bank"}
                  onChange={handleChange}
                />
                <span>
                  {t("checkout.paymentBank") || "Thanh toán chuyển khoản"}
                </span>
              </label>
            </div>

            {formData.paymentMethod === "bank" && (
              <div className="bank-transfer-info">
                <div className="bank-header">
                  <strong>
                    {t("checkout.bankAccount") ||
                      "Tài khoản ngân hàng: Ngân hàng Thương mại Cổ phần Á Châu (ACB)"}
                  </strong>
                  <br />
                  {t("checkout.accountHolder") || "Chủ tài khoản"}:{" "}
                  <strong>LƯU THỊ NGỌC HÀ</strong> -{" "}
                  {t("checkout.accountNumber") || "Số tài khoản"}:{" "}
                  <strong>1005986868</strong>
                </div>
                <div className="qr-wrapper">
                  <img
                    src="./src/assets/qr-acbbank.jpg"
                    alt={t("checkout.qrAlt") || "QR chuyển khoản ACB"}
                    className="qr-code"
                  />
                </div>
                <p className="note">
                  {t("checkout.bankNote") ||
                    "Sau khi chuyển khoản, vui lòng nhấn nút xác nhận bên dưới để hoàn tất đơn hàng."}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn-pay"
              disabled={loading || cartItems.length === 0}
            >
              {loading
                ? t("checkout.processing") || "ĐANG XỬ LÝ..."
                : t("checkout.confirmPayment") || "XÁC NHẬN THANH TOÁN"}
            </button>
          </form>

          <div className="paycart-footer">
            <button onClick={() => navigate(-1)} className="btn-back">
              ← {t("common.back") || "Quay lại trang trước"}
            </button>
            <span className="support">
              {t("checkout.support") || "Hỗ trợ"}: 0941 038 839{" "}
            </span>
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
                        alt={getProductName(product.name)}
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
                      <h4>{getProductName(product.name)}</h4>
                      <p>
                        {t("product.size") || "Kích thước"}:{" "}
                        {product.size || t("product.standard") || "Tiêu chuẩn"}
                      </p>
                    </div>

                    <div className="item-price">
                      {((product.price || 0) * item.quantity).toLocaleString()}₫
                    </div>

                    <button
                      className="btn-remove-item"
                      onClick={() => removeItem(product._id)}
                      title={
                        t("cart.removeItem") || "Xóa sản phẩm khỏi giỏ hàng"
                      }
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
              <div className="empty-cart">
                {t("cart.emptyCart") || "Giỏ hàng trống"}
              </div>
            )}

            <div className="summary-row">
              <span>{t("checkout.shippingFee") || "Phí vận chuyển"}</span>
              <strong>0 ₫</strong>
            </div>
            <div className="summary-row total">
              <span>{t("cart.total") || "Tổng cộng"}</span>
              <strong className="final-price">
                {totalPrice.toLocaleString()} ₫
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayCart;
