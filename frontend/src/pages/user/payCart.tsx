// src/pages/cart/payCart.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/styles/pages/user/payCart.scss';
import { getCurrentUser } from '@/api/user/userAPI';
import { useCart } from '@/context/CartContext';
import { useOrder } from '@/context/OrderContext';
import { AuthContext } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import axiosInstance from '@/axios';

const PayCart: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { addOrder } = useOrder();
  const { cartItems, clearCart, reloadCart } = useCart();
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    name: '',
    address: '',
    city: '',
    note: '',
    paymentMethod: 'cod',
  });

  // Load thông tin user khi vào trang — nếu không có user thì cho guest
  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      try {
        const u = await getCurrentUser();
        if (!mounted) return;
        setFormData(prev => ({
          ...prev,
          name: u.name || '',
          phone: u.phone || '',
          email: u.email || '',
          address: u.address || '',
        }));
      } catch (err) {
        // Không ép redirect — cho phép xem giỏ hàng dưới dạng guest
        console.info('Không có user hiện tại, dùng guest flow');
      }
    };
    loadUser();

    // load cart via CartContext (reloadCart may fetch backend or local)
    if (typeof reloadCart === 'function') {
      reloadCart().catch(e => console.error('reloadCart error', e));
    }

    return () => { mounted = false; };
  }, [reloadCart]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }

    if (!formData.city) {
      toast.error('Vui lòng chọn tỉnh/thành phố');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: `${formData.address.trim()}, ${formData.city}`,
          note: formData.note?.trim() || '',
          city: formData.city,
        },
        items: cartItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        total: totalPrice,
        paymentMethod: formData.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng',
      };

      await addOrder(orderData);
      await clearCart();

      toast.success('Đặt hàng thành công! Chúng tôi sẽ liên hệ ngay ❤️');
      setTimeout(() => navigate('/order-success'), 1500);
    } catch (err) {
      console.error('Lỗi đặt hàng:', err);
      toast.error('Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.info('Bạn có thể xem giỏ hàng mà không cần đăng nhập. Đăng nhập để lưu đơn hoặc hoàn tất thanh toán.');
      // Nếu muốn bắt đăng nhập để xác thực đơn, uncomment next line:
      // navigate('/tai-khoan-ca-nhan');
      // return;
    }

    // reuse submit logic
    await handleSubmit({ preventDefault: () => {} } as unknown as React.FormEvent);
  };

  return (
    <div className="paycart-container">
      <div className="paycart-wrapper">
        <div className="paycart-left">
          <h2>THÔNG TIN GIAO HÀNG</h2>

          <form onSubmit={handleSubmit} className="paycart-form">
            {/* error / guest notice could be added here */}
            <div className="form-row">
              <input type="text" placeholder="Số điện thoại" name="phone" value={formData.phone} onChange={handleChange} required />
              <input type="email" placeholder="Email" name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <input type="text" placeholder="Họ và tên" name="name" value={formData.name} onChange={handleChange} required />
            <input type="text" placeholder="Địa chỉ" name="address" value={formData.address} onChange={handleChange} required />

            <select name="city" value={formData.city} onChange={handleChange} required>
              <option value="">Chọn tỉnh thành</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="TP.HCM">TP.HCM</option>
            </select>

            <textarea placeholder="Nhập ghi chú (nếu có)" name="note" value={formData.note} onChange={handleChange} rows={3} />

            <div className="payment-methods">
              <label>
                <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} />
                <span>Thanh toán khi nhận hàng</span>
              </label>
              <label>
                <input type="radio" name="paymentMethod" value="bank" checked={formData.paymentMethod === 'bank'} onChange={handleChange} />
                <span>Thanh toán chuyển khoản</span>
              </label>
            </div>

            <button type="submit" className="btn-pay" disabled={loading || cartItems.length === 0}>
              {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN THANH TOÁN'}
            </button>
          </form>

          <div className="paycart-footer">
            <button onClick={() => navigate(-1)} className="btn-back">← Quay lại trang trước</button>
            <span>Hỗ trợ: 0944 333 966</span>
          </div>
        </div>

        <div className="paycart-right">
          <div className="order-summary">
            {cartItems.length ? cartItems.map((item, index) => {
  const product = item.product;
  if (!product) return null; // bảo vệ

  const imageUrl = Array.isArray(product.images) 
    ? product.images[0] 
    : (product.image || product.img_url || '/images/no-image.png');

  return (
    <div key={product._id || index} className="cart-item">
      <img src={imageUrl} alt={product.name || 'Sản phẩm'} />
  {item.quantity > 1 && (
    <span className="quantity-badge">{item.quantity}</span>
  )}
      <div className="item-info">
        <h4>{product.name || 'Không có tên'}</h4>
        <p>Kích thước: {product.size || 'Tiêu chuẩn'}</p>
      </div>
      <div className="item-price">
        {((product.price || 0) * item.quantity).toLocaleString()}đ
      </div>
    </div>
  );
}) : <div>Giỏ hàng trống</div>}

            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <strong>0 đ</strong>
            </div>
            <div className="summary-row total">
              <span>Tổng cộng</span>
              <strong className="final-price">{totalPrice.toLocaleString()} đ</strong>
            </div>
          </div>

          <div className="suggested-products">
            <h3>THƯỜNG ĐƯỢC MUA KÈM</h3>
            <div className="suggested-item">
              <img src="/assets/products/giuong1.jpg" alt="Gợi ý" />
              <div>
                <h4>Mẫu Giường Gỗ Công Nghiệp Trơn Hiện Đại Chuẩn Xu Hướng 2025</h4>
                <p className="price">3.500.000đ <del>4.550.000đ</del></p>
              </div>
              <button>Xem ngay</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayCart;