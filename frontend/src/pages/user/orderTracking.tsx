// src/pages/orderTracking/OrderTracking.tsx - MULTILINGUAL VERSION
import { useState, useEffect } from 'react';
import axiosInstance from '@/axios';
import '@/styles/pages/user/orderTracking.scss';
import { getImageUrl } from "@/utils/imageUrl";
import { Package, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

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
    img_url?: string;
    images?: string[];
  }>;
}

export default function OrderTrackingPage() {
  const { t } = useLanguage();
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderTrackingResult | null>(null);
  const [error, setError] = useState('');

  // ✅ PAYMENT METHOD LABELS - Multilingual
  const getPaymentMethodLabel = (method: string) => {
    const methodKey = method.toLowerCase();
    
    if (methodKey === 'cod') {
      return t('orderTracking.paymentCOD') || 'Thanh toán khi nhận hàng (COD)';
    } else if (methodKey === 'bank') {
      return t('orderTracking.paymentBank') || 'Chuyển khoản ngân hàng';
    } else if (methodKey === 'momo') {
      return t('orderTracking.paymentMomo') || 'Ví điện tử MoMo';
    }
    
    return method;
  };

  // ✅ ORDER STATUS LABELS - Multilingual
  const getStatusLabel = (statusKey: string) => {
    const statusLabels: Record<string, string> = {
      'Pending': t('orderTracking.statusPending') || 'Chờ xử lý',
      'Confirmed': t('orderTracking.statusConfirmed') || 'Đã xác nhận',
      'Shipping': t('orderTracking.statusShipping') || 'Đang giao hàng',
      'Completed': t('orderTracking.statusCompleted') || 'Hoàn thành',
      'Cancelled': t('orderTracking.statusCancelled') || 'Đã hủy',
    };
    return statusLabels[statusKey] || statusKey;
  };

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('lastTrackedOrder');
      const savedOrderNumber = localStorage.getItem('lastOrderNumber');
      
      if (savedOrder) {
        const order = JSON.parse(savedOrder);
        setResult(order);
        
        if (savedOrderNumber) setOrderNumber(savedOrderNumber);
      }
    } catch (err) {
      console.error('Error loading saved order:', err);
      localStorage.removeItem('lastTrackedOrder');
      localStorage.removeItem('lastOrderNumber');
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!orderNumber.trim()) {
      setError(t('orderTracking.fillOrderCode') || 'Vui lòng nhập mã đơn hàng');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/orders/track/${orderNumber.toUpperCase().trim()}`
      );
      
      setResult(res.data);
      localStorage.setItem('lastTrackedOrder', JSON.stringify(res.data));
      localStorage.setItem('lastOrderNumber', orderNumber.toUpperCase().trim());
      
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        t('orderTracking.orderNotFound') || 
        'Không tìm thấy đơn hàng với mã này'
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
    setError('');
    localStorage.removeItem('lastTrackedOrder');
    localStorage.removeItem('lastOrderNumber');
  };

  return (
    <div className="order-tracking-page">
      <div className="tracking-container">
        <div className="tracking-header">
          <Package size={40} />
          <h1>{t('orderTracking.title') || 'Tra cứu đơn hàng'}</h1>
          <p>{t('orderTracking.subtitle') || 'Nhập mã đơn hàng để kiểm tra'}</p>
        </div>

        {!result ? (
          <form className="tracking-form" onSubmit={handleSearch}>
            <div className="form-group">
              <label>{t('orderTracking.orderCode') || 'Mã đơn hàng'}</label>
              <input
                type="text"
                placeholder={t('orderTracking.orderCodePlaceholder') || 'Ví dụ: DH2512150001'}
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
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
              {loading 
                ? (t('orderTracking.searching') || 'Đang tìm...') 
                : (t('orderTracking.searchButton') || 'Tra cứu đơn hàng')
              }
            </button>
          </form>
        ) : (
          <div className="tracking-result">
            <div className="result-header">
              <div className="order-info">
                <h2>{t('orderTracking.orderLabel') || 'Đơn hàng'} #{result.orderId}</h2>
                <div 
                  className="status-badge"
                  style={{ 
                    backgroundColor: `${getStatusColor(result.statusKey)}20`,
                    color: getStatusColor(result.statusKey)
                  }}
                >
                  {getStatusIcon(result.statusKey)}
                  {getStatusLabel(result.statusKey)}
                </div>
              </div>
            </div>

            <div className="result-details">
              <div className="detail-section">
                <h3>{t('orderTracking.customerInfo') || 'Thông tin khách hàng'}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>{t('orderTracking.fullName') || 'Họ tên'}:</strong>
                    <span>{result.customerName}</span>
                  </div>
                  <div className="detail-item">
                    <strong>{t('orderTracking.phone') || 'Số điện thoại'}:</strong>
                    <span>{result.phone}</span>
                  </div>
                  <div className="detail-item full">
                    <strong>{t('orderTracking.address') || 'Địa chỉ'}:</strong>
                    <span>{result.address}</span>
                  </div>
                  <div className="detail-item">
                    <strong>{t('orderTracking.orderDate') || 'Ngày đặt'}:</strong>
                    <span>{result.orderDate}</span>
                  </div>
                  <div className="detail-item">
                    <strong>{t('orderTracking.paymentMethod') || 'Thanh toán'}:</strong>
                    <span>{getPaymentMethodLabel(result.paymentMethod)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>{t('orderTracking.orderedProducts') || 'Sản phẩm đã đặt'}</h3>
                <div className="items-list">
                  {result.items.map((item, idx) => {
                    const imageUrl = item.img_url || 
                                    (item.images && item.images.length > 0 ? item.images[0] : null);
                    
                    return (
                      <div key={idx} className="item-row">
                        <img 
                          src={
                            imageUrl
                              ? getImageUrl(imageUrl)
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
                          <div className="item-quantity">
                            {t('orderTracking.quantity') || 'Số lượng'}: {item.quantity}
                          </div>
                        </div>
                        <div className="item-price">{item.price}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="total-row">
                  <strong>{t('cart.total') || 'Tổng cộng'}:</strong>
                  <strong className="total-amount">{result.totalAmount}</strong>
                </div>
              </div>
            </div>

            <button 
              onClick={handleReset}
              className="back-btn"
            >
              {t('orderTracking.searchAnother') || 'Tra cứu đơn hàng khác'}
            </button>
          </div>
        )}

        <div className="tracking-footer">
          <p>
            {t('orderTracking.needSupport') || 'Cần hỗ trợ? Gọi'}{' '}
            <strong>0941 038 838</strong>
          </p>
        </div>
      </div>
    </div>
  );
}