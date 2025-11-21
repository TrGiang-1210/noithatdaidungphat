// src/pages/cart/payCart.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/styles/pages/user/payCart.scss';
import { getCurrentUser } from '@/api/user/userAPI';
import { useCart } from '@/context/CartContext'; 
import { useOrder } from '@/context/OrderContext';
import { toast } from 'react-toastify';

const PayCart: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { addOrder } = useOrder(); // thêm dòng này
const { cartItems, clearCart, reloadCart } = useCart();


  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    name: '',
    address: '',
    city: '',
    note: '',
    paymentMethod: 'cod', // cod hoặc bank
  });

  // Load thông tin user khi vào trang
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
          address: user.address || '',
        }));
      } catch (err) {
        toast.error('Vui lòng đăng nhập để thanh toán');
        navigate('/auth');
      }
    };
    loadUser();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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

    // GỌI THẬT QUA OrderContext → dùng API createOrder bạn vừa gửi
    await addOrder(orderData);

    // Xóa giỏ hàng sau khi đặt thành công
    await clearCart();

    toast.success('Đặt hàng thành công! Chúng tôi sẽ liên hệ ngay ❤️');
    
    // Chuyển sang trang cảm ơn
    setTimeout(() => navigate('/order-success'), 1500);

  } catch (err) {
    // Lỗi đã được toast trong OrderContext rồi
    console.error('Lỗi đặt hàng:', err);
  } finally {
    setLoading(false);
  }
};

  const totalPrice = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="paycart-container">
      <div className="paycart-wrapper">
        {/* Bên trái: Form thông tin */}
        <div className="paycart-left">
          <h2>THÔNG TIN GIAO HÀNG</h2>

          <form onSubmit={handleSubmit} className="paycart-form">
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
              {/* Thêm các tỉnh khác nếu cần */}
            </select>

            <textarea
              placeholder="Nhập ghi chú (nếu có)"
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={3}
            />

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
            <button onClick={() => navigate(-1)} className="btn-back">
              ← Quay lại trang trước
            </button>
            <span>Hỗ trợ: 0944 333 966</span>
          </div>
        </div>

        {/* Bên phải: Tóm tắt đơn hàng */}
        <div className="paycart-right">
          <div className="order-summary">
            {cartItems.map(item => (
              <div key={item.product._id} className="cart-item">
                <img src={item.product.images[0]} alt={item.product.name} />
                <div className="item-info">
                  <h4>{item.product.name}</h4>
                  <p>Kích thước: {item.product.size || 'Tiêu chuẩn'}</p>
                </div>
                <div className="item-price">
                  {(item.product.price * item.quantity).toLocaleString()}đ
                </div>
              </div>
            ))}

            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <strong>0 đ</strong>
            </div>
            <div className="summary-row total">
              <span>Tổng cộng</span>
              <strong className="final-price">{totalPrice.toLocaleString()} đ</strong>
            </div>
          </div>

          {/* Sản phẩm đề xuất */}
          <div className="suggested-products">
            <h3>THƯỜNG ĐƯỢC MUA KÈM</h3>
            {/* Bạn có thể thêm 2-3 sản phẩm gợi ý ở đây */}
            <div className="suggested-item">
              <img src="/assets/products/giuong1.jpg" alt="Gợi ý" />
              <div>
                <h4>Mẫu Giường Gỗ Công Nghiệp Trơn Hiện Đại Chuẩn Xu Hướng 2025</h4>
                <p className="price">3.500.000đ <del>4.550.000đ</del></p>
              </div>
              <button>Xem ngay</button>
            </div>
            {/* Thêm 1-2 sản phẩm nữa nếu muốn */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayCart;