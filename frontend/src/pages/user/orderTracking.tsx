// src/pages/orderTracking/OrderTracking.tsx - FIXED
import { useState, useEffect } from 'react';
import axiosInstance from '@/axios';
import '@/styles/pages/user/orderTracking.scss';
import { getImageUrl } from "@/utils/imageUrl"; // ✅ Dùng getImageUrl thay vì getFirstImageUrl
import { Package, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react';

interface OrderTrackingResult {
  orderId: string;
  status: string;
  statusKey: string;
  customerName: string;
  phone: string;
  address: string;
  orderDate: string;
  totalAmount: string;
  paymentMethod: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    img_url?: string; // ✅ Backend trả về img_url (string), KHÔNG phải images (array)
    images?: string[]; // Giữ lại để tương thích nếu backend thay đổi sau
  }>;
}

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderTrackingResult | null>(null);
  const [error, setError] = useState('');

  // ✅ 1. LOAD LẠI ĐƠN HÀNG TỪ localStorage KHI REFRESH
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('lastTrackedOrder');
      const savedOrderNumber = localStorage.getItem('lastOrderNumber');
      const savedPhone = localStorage.getItem('lastPhone');
      
      if (savedOrder) {
        const order = JSON.parse(savedOrder);
        setResult(order);
        
        // Khôi phục luôn mã đơn và SĐT để user có thể tra cứu lại
        if (savedOrderNumber) setOrderNumber(savedOrderNumber);
        if (savedPhone) setPhone(savedPhone);
      }
    } catch (err) {
      console.error('Error loading saved order:', err);
      // Xóa dữ liệu lỗi
      localStorage.removeItem('lastTrackedOrder');
      localStorage.removeItem('lastOrderNumber');
      localStorage.removeItem('lastPhone');
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!orderNumber.trim() || !phone.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/orders/track/${orderNumber.toUpperCase().trim()}`,
        { params: { phone: phone.replace(/\D/g, '') } }
      );
      
      // ✅ 2. LƯU ĐƠN HÀNG VÀO localStorage SAU KHI TÌM THÀNH CÔNG
      setResult(res.data);
      localStorage.setItem('lastTrackedOrder', JSON.stringify(res.data));
      localStorage.setItem('lastOrderNumber', orderNumber.toUpperCase().trim());
      localStorage.setItem('lastPhone', phone);
      
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Không tìm thấy đơn hàng với thông tin này'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (statusKey: string) => {
    switch (statusKey) {
      case 'Pending':
        return <Clock size={20} />;
      case 'Confirmed':
        return <CheckCircle size={20} />;
      case 'Shipping':
        return <Truck size={20} />;
      case 'Completed':
        return <CheckCircle size={20} />;
      case 'Cancelled':
        return <AlertCircle size={20} />;
      default:
        return <Package size={20} />;
    }
  };

  const getStatusColor = (statusKey: string) => {
    switch (statusKey) {
      case 'Pending':
        return '#f39c12';
      case 'Confirmed':
        return '#3498db';
      case 'Shipping':
        return '#e67e22';
      case 'Completed':
        return '#27ae60';
      case 'Cancelled':
        return '#95a5a6';
      default:
        return '#7f8c8d';
    }
  };

  const handleReset = () => {
    setResult(null);
    setOrderNumber('');
    setPhone('');
    setError('');
    // Xóa localStorage khi user muốn tra cứu đơn khác
    localStorage.removeItem('lastTrackedOrder');
    localStorage.removeItem('lastOrderNumber');
    localStorage.removeItem('lastPhone');
  };

  return (
    <div className="order-tracking-page">
      <div className="tracking-container">
        <div className="tracking-header">
          <Package size={40} />
          <h1>Tra cứu đơn hàng</h1>
          <p>Nhập mã đơn hàng và số điện thoại để kiểm tra</p>
        </div>

        {!result ? (
          <form className="tracking-form" onSubmit={handleSearch}>
            <div className="form-group">
              <label>Mã đơn hàng</label>
              <input
                type="text"
                placeholder="Ví dụ: DH2512150001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                placeholder="Nhập số điện thoại đặt hàng"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Đang tìm...' : 'Tra cứu đơn hàng'}
            </button>
          </form>
        ) : (
          <div className="tracking-result">
            <div className="result-header">
              <div className="order-info">
                <h2>Đơn hàng #{result.orderId}</h2>
                <div 
                  className="status-badge"
                  style={{ 
                    backgroundColor: `${getStatusColor(result.statusKey)}20`,
                    color: getStatusColor(result.statusKey)
                  }}
                >
                  {getStatusIcon(result.statusKey)}
                  {result.status}
                </div>
              </div>
            </div>

            <div className="result-details">
              <div className="detail-section">
                <h3>Thông tin khách hàng</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Họ tên:</strong>
                    <span>{result.customerName}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Số điện thoại:</strong>
                    <span>{result.phone}</span>
                  </div>
                  <div className="detail-item full">
                    <strong>Địa chỉ:</strong>
                    <span>{result.address}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Ngày đặt:</strong>
                    <span>{result.orderDate}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Thanh toán:</strong>
                    <span>{result.paymentMethod}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Sản phẩm đã đặt</h3>
                <div className="items-list">
                  {/* ✅ 3. FIX HIỂN THỊ ẢNH - Backend trả về img_url (string) */}
                  {result.items.map((item, idx) => {
                    // Ưu tiên img_url, nếu không có thì dùng images[0]
                    const imageUrl = item.img_url || 
                                    (item.images && item.images.length > 0 ? item.images[0] : null);
                    
                    return (
                      <div key={idx} className="item-row">
                        <img 
                          src={
                            imageUrl
                              ? getImageUrl(imageUrl) // ✅ Dùng getImageUrl thay vì getFirstImageUrl
                              : 'https://via.placeholder.com/60?text=No+Image'
                          }
                          alt={item.name}
                          onError={(e) => {
                            console.error('Image load failed:', e.currentTarget.src);
                            e.currentTarget.src = 'https://via.placeholder.com/60?text=Error';
                          }}
                        />
                        <div className="item-info">
                          <div className="item-name">{item.name}</div>
                          <div className="item-quantity">Số lượng: {item.quantity}</div>
                        </div>
                        <div className="item-price">{item.price}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="total-row">
                  <strong>Tổng cộng:</strong>
                  <strong className="total-amount">{result.totalAmount}</strong>
                </div>
              </div>
            </div>

            <button 
              onClick={handleReset}
              className="back-btn"
            >
              Tra cứu đơn hàng khác
            </button>
          </div>
        )}

        <div className="tracking-footer">
          <p>Cần hỗ trợ? Gọi <strong>0941 038 838</strong></p>
        </div>
      </div>
    </div>
  );
}