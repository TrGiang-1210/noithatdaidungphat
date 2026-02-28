// src/pages/cart/payCart.tsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "@/styles/pages/user/payCart.scss";
import { useCart } from "@/context/CartContext";
import { useOrder } from "@/context/OrderContext";
import { AuthContext } from "@/context/AuthContext";
import { toast } from "react-toastify";
import provinces from "../../vn-provinces";
import axiosInstance from "../../axios";
import { getFirstImageUrl } from "@/utils/imageUrl";
import { useLanguage } from "@/context/LanguageContext";
import {
  Phone, Mail, User, MapPin, FileText,
  Truck, CreditCard, ShoppingBag, ArrowLeft,
  Headphones, ChevronRight
} from "lucide-react";

const PayCart: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { addOrder } = useOrder();
  const { cartItems, clearCart, reloadCart, removeItem } = useCart();
  const { user } = useContext(AuthContext);

  const [attributeLabels, setAttributeLabels] = useState<
    Record<string, { keys: Record<string, string>; values: Record<string, string> }>
  >({});

  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    name: "",
    address: "",
    city: "",
    note: "",
    paymentMethod: "cod",
  });

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
      } catch {}
    }
    if (typeof reloadCart === "function") reloadCart().catch(() => {});
  }, [reloadCart]);

  useEffect(() => {
    setAttributeLabels({});
    if (typeof reloadCart === "function") reloadCart().catch(() => {});
  }, [language, reloadCart]);

  useEffect(() => {
    const fetchAttributeLabels = async () => {
      const labels: Record<string, { keys: Record<string, string>; values: Record<string, string> }> = {};
      for (const item of cartItems) {
        if (!item.selectedAttributes || Object.keys(item.selectedAttributes).length === 0) continue;
        try {
          const res = await axiosInstance.get(`/products/${item.product._id}?raw=true`);
          const product = res.data;
          if (product && Array.isArray(product.attributes)) {
            const translatedKeys: Record<string, string> = {};
            const translatedValues: Record<string, string> = {};
            for (const [attrName, attrValue] of Object.entries(item.selectedAttributes)) {
              const attribute = product.attributes.find((attr: any) => {
                if (!attr?.name) return false;
                if (typeof attr.name === "string") return attr.name === attrName;
                if (typeof attr.name === "object") return attr.name.vi === attrName || attr.name.zh === attrName;
                return false;
              });
              if (attribute) {
                translatedKeys[attrName] = typeof attribute.name === "object"
                  ? attribute.name[language] || attribute.name.vi || attrName
                  : attribute.name;
                if (Array.isArray(attribute.options)) {
                  const option = attribute.options.find((opt: any) => opt?.value === attrValue);
                  if (option?.label) {
                    translatedValues[attrName] = typeof option.label === "object"
                      ? option.label[language] || option.label.vi || option.label.zh || String(option.label)
                      : String(option.label);
                  } else {
                    translatedValues[attrName] = String(attrValue);
                  }
                } else {
                  translatedValues[attrName] = String(attrValue);
                }
              } else {
                translatedKeys[attrName] = attrName;
                translatedValues[attrName] = String(attrValue);
              }
            }
            const sortedAttrs = Object.keys(item.selectedAttributes).sort()
              .map(k => `${k}:${(item.selectedAttributes as Record<string, string>)[k]}`).join("|");
            labels[`${item.product._id}__${sortedAttrs}`] = { keys: translatedKeys, values: translatedValues };
          }
        } catch {}
      }
      setAttributeLabels(labels);
    };
    if (cartItems.length > 0) fetchAttributeLabels();
  }, [cartItems, language]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name === "city" || e.target.id === "province" ? "city" : name]: value }));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  const localizedCartItems = useMemo(() => {
    return cartItems.map(item => ({
      ...item,
      product: { ...item.product, displayName: getProductName(item.product.name) }
    }));
  }, [cartItems, language]);

  const doSubmit = async () => {
    if (cartItems.length === 0) { toast.error(t("cart.emptyCart") || "Giỏ hàng trống!"); return; }
    if (!formData.city) { toast.error(t("checkout.selectProvince") || "Vui lòng chọn tỉnh/thành phố"); return; }
    if (!formData.name.trim()) { toast.error(t("checkout.enterName") || "Vui lòng nhập họ tên"); return; }
    if (!formData.phone.trim()) { toast.error(t("checkout.enterPhone") || "Vui lòng nhập số điện thoại"); return; }
    if (!formData.address.trim()) { toast.error(t("checkout.enterAddress") || "Vui lòng nhập địa chỉ"); return; }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.product._id,
          quantity: item.quantity,
          price: item.product.price || item.product.priceSale || 0,
          name: typeof item.product.name === "object"
            ? item.product.name.vi || item.product.name.zh || String(item.product.name)
            : item.product.name,
          img_url: Array.isArray(item.product.images) ? item.product.images[0] : item.product.image || item.product.img_url || "",
          selectedAttributes: item.selectedAttributes || item.product.selectedAttributes || {},
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

      const result = await addOrder(orderData);
      const order = result?.order || result?.data || result;
      await clearCart();
      toast.success(t("checkout.orderSuccess") || "Đặt hàng thành công! Chúng tôi sẽ liên hệ ngay");
      navigate("/dat-hang-thanh-cong", {
        state: {
          orderCode: order?.code || order?.order_code || "DH" + Date.now(),
          trackingToken: order?.tracking_token || order?.token || "",
          total: totalPrice,
          isGuest: !user,
          customerInfo: { name: formData.name, phone: formData.phone, email: formData.email },
        },
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || t("checkout.orderFailed") || "Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doSubmit(); };

  return (
    <>
      <div className="paycart-container">

        {/* ── Progress steps ── */}
        <div className="paycart-steps">
          <div className="step is-done">
            <div className="step__num">✓</div>
            <span>Giỏ hàng</span>
          </div>
          <div className="step-sep is-done" />
          <div className="step is-active">
            <div className="step__num">2</div>
            <span>Thanh toán</span>
          </div>
          <div className="step-sep" />
          <div className="step">
            <div className="step__num">3</div>
            <span>Xác nhận</span>
          </div>
        </div>

        <div className="paycart-wrapper">

          {/* ══ LEFT: FORM ══ */}
          <div className="paycart-left">
            <div className="paycart-left__header">
              <div className="header-icon">📦</div>
              <h2>{t("checkout.deliveryInfo") || "Thông tin giao hàng"}</h2>
            </div>

            <form onSubmit={handleSubmit} className="paycart-form">

              <p className="form-section-label">Thông tin liên hệ</p>

              <div className="form-row">
                <div className="input-wrap">
                  <span className="input-icon"><Phone size={15} /></span>
                  <input type="tel" placeholder={t("checkout.phonePlaceholder") || "Số điện thoại *"}
                    name="phone" value={formData.phone} onChange={handleChange}
                    required pattern="[0-9\s\-\+]+" />
                </div>
                <div className="input-wrap">
                  <span className="input-icon"><Mail size={15} /></span>
                  <input type="email" placeholder={t("checkout.emailPlaceholder") || "Email (không bắt buộc)"}
                    name="email" value={formData.email} onChange={handleChange} />
                </div>
              </div>

              <div className="input-wrap">
                <span className="input-icon"><User size={15} /></span>
                <input type="text" placeholder={t("checkout.namePlaceholder") || "Họ và tên *"}
                  name="name" value={formData.name} onChange={handleChange} required minLength={2} />
              </div>

              <p className="form-section-label">Địa chỉ giao hàng</p>

              <div className="input-wrap">
                <span className="input-icon"><MapPin size={15} /></span>
                <select name="city" value={formData.city} onChange={handleChange} required>
                  <option value="">{t("checkout.selectProvince") || "Chọn tỉnh / thành phố *"}</option>
                  {provinces.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div className="input-wrap">
                <span className="input-icon"><MapPin size={15} /></span>
                <input type="text" placeholder={t("checkout.addressPlaceholder") || "Địa chỉ chi tiết *"}
                  name="address" value={formData.address} onChange={handleChange} required minLength={5} />
              </div>

              <div className="input-wrap">
                <span className="input-icon" style={{ top: 18 }}><FileText size={15} /></span>
                <textarea placeholder={t("checkout.notePlaceholder") || "Ghi chú đơn hàng (không bắt buộc)"}
                  name="note" value={formData.note} onChange={handleChange} style={{ paddingLeft: 42 }} />
              </div>

              <p className="form-section-label">Phương thức thanh toán</p>

              <div className="payment-methods">
                <div className="payment-option">
                  <input type="radio" id="pay-cod" name="paymentMethod" value="cod"
                    checked={formData.paymentMethod === "cod"} onChange={handleChange} />
                  <label htmlFor="pay-cod">
                    <span className="payment-option__icon">🚚</span>
                    <span>{t("checkout.paymentCOD") || "Thanh toán khi nhận hàng"}</span>
                    <span className="payment-option__check" />
                  </label>
                </div>
                <div className="payment-option">
                  <input type="radio" id="pay-bank" name="paymentMethod" value="bank"
                    checked={formData.paymentMethod === "bank"} onChange={handleChange} />
                  <label htmlFor="pay-bank">
                    <span className="payment-option__icon">🏦</span>
                    <span>{t("checkout.paymentBank") || "Chuyển khoản ngân hàng"}</span>
                    <span className="payment-option__check" />
                  </label>
                </div>
              </div>

              {formData.paymentMethod === "bank" && (
                <div className="bank-transfer-info">
                  <div className="bank-header">
                    <strong>{t("checkout.bankAccount") || "Ngân hàng ACB — Lưu Thị Ngọc Hà"}</strong>
                    <br />
                    {t("checkout.accountNumber") || "Số tài khoản"}: <strong>1005986868</strong>
                  </div>
                  <div className="qr-wrapper">
                    <img src="./src/assets/qr-acbbank.jpg" alt={t("checkout.qrAlt") || "QR ACB"} className="qr-code" />
                  </div>
                  <p className="note">{t("checkout.bankNote") || "Sau khi chuyển khoản, vui lòng nhấn xác nhận để hoàn tất."}</p>
                </div>
              )}

              {/* Desktop submit button (hidden on mobile) */}
              <button type="submit" className="btn-pay" disabled={loading || cartItems.length === 0}
                style={{ display: "block" } as any}>
                {loading ? (t("checkout.processing") || "Đang xử lý...") : (t("checkout.confirmPayment") || "Xác nhận thanh toán")}
              </button>
            </form>

            <div className="paycart-footer">
              <button onClick={() => navigate(-1)} className="btn-back" type="button">
                <ArrowLeft size={15} />
                {t("common.back") || "Quay lại"}
              </button>
              <span className="support">
                <Headphones size={15} /> 0941 038 839
              </span>
            </div>
          </div>

          {/* ══ RIGHT: ORDER SUMMARY ══ */}
          <div className="paycart-right">
            <div className="order-summary">
              <div className="order-summary__header">
                <h3>🛒 Đơn hàng của bạn</h3>
                <span className="item-count">{cartItems.reduce((s, i) => s + i.quantity, 0)} sản phẩm</span>
              </div>

              <div className="order-summary__body">
                {localizedCartItems.length ? (
                  localizedCartItems.map((item, index) => {
                    const product = item.product;
                    if (!product) return null;
                    const attrs = item.selectedAttributes || product.selectedAttributes || {};
                    const hasAttrs = Object.keys(attrs).length > 0;
                    const sortedAttrs = Object.keys(attrs).sort()
                      .map(k => `${k}:${(attrs as Record<string, string>)[k]}`).join("|");
                    const cartKey = `${product._id}__${sortedAttrs}`;
                    const productLabels = attributeLabels[cartKey];

                    return (
                      <div key={`${product._id}-${language}-${index}`} className="cart-item">
                        <div className="product-image-wrapper">
                          <img src={getFirstImageUrl(product.images)} alt={product.displayName}
                            onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/80?text=No+Image"; }} />
                          {item.quantity > 1 && <span className="quantity-badge">{item.quantity}</span>}
                        </div>

                        <div className="item-info">
                          <h4>{product.displayName}</h4>

                          {hasAttrs ? (
                            <div className="selected-attributes">
                              {Object.entries(attrs).map(([key, value]) => (
                                <span key={key} className="attr-tag">
                                  {productLabels?.keys?.[key] || key}:&nbsp;
                                  <strong>{productLabels?.values?.[key] || String(value)}</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="item-size">
                              {product.size || t("product.standard") || "Tiêu chuẩn"}
                            </p>
                          )}
                        </div>

                        <div className="item-price">
                          {((product.price || 0) * item.quantity).toLocaleString()}₫
                        </div>

                        <button className="btn-remove-item" onClick={() => removeItem(product._id)}
                          title={t("cart.removeItem") || "Xóa"} type="button">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-8 0h10l-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 6z" />
                          </svg>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-cart">
                    <div className="empty-icon">🛒</div>
                    <p>{t("cart.emptyCart") || "Giỏ hàng trống"}</p>
                  </div>
                )}
              </div>

              <div className="order-summary__totals">
                <div className="summary-row summary-row--shipping">
                  <span>{t("checkout.shippingFee") || "Phí vận chuyển"}</span>
                  <strong>Miễn phí</strong>
                </div>
                <div className="summary-row summary-row--total">
                  <span>{t("cart.total") || "Tổng cộng"}</span>
                  <span className="final-price">{totalPrice.toLocaleString()}₫</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile sticky bar ── */}
      <div className="paycart-mobile-bar">
        <div className="paycart-mobile-bar__total">
          <div className="label">Tổng tiền</div>
          <div className="amount">{totalPrice.toLocaleString()}₫</div>
        </div>
        <button className="paycart-mobile-bar__btn" onClick={doSubmit}
          disabled={loading || cartItems.length === 0} type="button">
          {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
        </button>
      </div>
    </>
  );
};

export default PayCart;