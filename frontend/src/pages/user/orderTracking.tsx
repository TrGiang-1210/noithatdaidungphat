// src/pages/orderTracking/OrderTracking.tsx
import React, { useState } from 'react';
import { trackOrderPublic } from '@/api/user/orderAPI';
import '@/styles/pages/user/orderTracking.scss';

const OrderTrackingPage: React.FC = () => {
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!orderCode.trim() || !phone.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const data = await trackOrderPublic(orderCode, phone);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tìm thấy đơn hàng với thông tin này');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (v: string) => v.replace(/\D/g, '').slice(0, 11);

  return (
    <div className="order-tracking-mini">
      <div className="tracking-wrapper">
        {/* Thanh tìm kiếm nhỏ */}
        {!result ? (
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Nhập mã đơn hàng hoặc số điện thoại"
              value={orderCode || phone}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d+$/.test(val.replace(/\s/g, '')) || val.length <= 10) {
                  setPhone(formatPhone(val));
                  setOrderCode('');
                } else {
                  setOrderCode(val.toUpperCase());
                  setPhone('');
                }
              }}
              className="search-input"
              disabled={loading}
            />
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </form>
        ) : null}

        {/* Hiển thị lỗi */}
        {error && !result && (
          <div className="result-box error">
            <p>{error}</p>
            <button onClick={() => { setError(''); setResult(null); }} className="back-mini">
              Thử lại
            </button>
          </div>
        )}

        {/* Kết quả tìm được */}
        {result && (
          <div className="result-box success">
            <div className="result-header">
              <h3>Đơn hàng #{result.orderId}</h3>
              <span className={`status ${result.statusKey}`}>
                {result.status}
              </span>
            </div>

            <div className="result-info">
              <p><strong>Khách hàng:</strong> {result.customerName}</p>
              <p><strong>Số điện thoại:</strong> {result.phone}</p>
              <p><strong>Địa chỉ:</strong> {result.address}</p>
              <p><strong>Ngày đặt:</strong> {result.orderDate}</p>
              <p><strong>Tổng tiền:</strong> <span className="price">{result.totalAmount}</span></p>
              {result.trackingNumber && (
                <p><strong>Vận đơn:</strong> {result.trackingNumber}</p>
              )}
            </div>

            <button onClick={() => { setResult(null); setOrderCode(''); setPhone(''); }} className="back-mini">
              Tìm đơn hàng khác
            </button>
          </div>
        )}
      </div>

      {/* Footer nhỏ */}
      <div className="tracking-footer">
        <p>Gọi <strong>0941 038 839</strong> nếu bạn cần hỗ trợ</p>
      </div>
    </div>
  );
};

export default OrderTrackingPage;