// src/pages/orderTracking/OrderTracking.tsx
import { useState, useEffect } from 'react';
import axiosInstance from '@/axios';
import '@/styles/pages/user/orderTracking.scss';
import { getImageUrl } from "@/utils/imageUrl";
import {
  Package, Clock, CheckCircle, Truck, AlertCircle,
  Search, RotateCcw, Phone
} from 'lucide-react';
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
    selectedAttributes?: Record<string, string>;
  }>;
}

// Thứ tự các bước timeline
const STATUS_STEPS = ['Pending', 'Confirmed', 'Shipping', 'Completed'];

export default function OrderTrackingPage() {
  const { t, language } = useLanguage();
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderTrackingResult | null>(null);
  const [error, setError] = useState('');

  const getPaymentMethodLabel = (method: string) => {
    const m = method.toLowerCase();
    if (m === 'cod')  return t('orderTracking.paymentCOD')  || 'Thanh toán khi nhận hàng (COD)';
    if (m === 'bank') return t('orderTracking.paymentBank') || 'Chuyển khoản ngân hàng';
    if (m === 'momo') return t('orderTracking.paymentMomo') || 'Ví điện tử MoMo';
    return method;
  };

  const getStatusLabel = (statusKey: string) => {
    const map: Record<string, string> = {
      Pending:   t('orderTracking.statusPending')   || 'Chờ xử lý',
      Confirmed: t('orderTracking.statusConfirmed') || 'Đã xác nhận',
      Shipping:  t('orderTracking.statusShipping')  || 'Đang giao hàng',
      Completed: t('orderTracking.statusCompleted') || 'Hoàn thành',
      Cancelled: t('orderTracking.statusCancelled') || 'Đã hủy',
    };
    return map[statusKey] || statusKey;
  };

  const getStepIcon = (step: string, size = 16) => {
    switch (step) {
      case 'Pending':   return <Clock size={size} />;
      case 'Confirmed': return <CheckCircle size={size} />;
      case 'Shipping':  return <Truck size={size} />;
      case 'Completed': return <CheckCircle size={size} />;
      default:          return <Package size={size} />;
    }
  };

  const getStatusColor = (statusKey: string) => {
    switch (statusKey) {
      case 'Pending':   return '#e67e22';
      case 'Confirmed': return '#2980b9';
      case 'Shipping':  return '#8e44ad';
      case 'Completed': return '#27ae60';
      case 'Cancelled': return '#95a5a6';
      default:          return '#7f8c8d';
    }
  };

  // Tính % fill của timeline line
  const getTimelineFill = (statusKey: string) => {
    if (statusKey === 'Cancelled') return 0;
    const idx = STATUS_STEPS.indexOf(statusKey);
    if (idx < 0) return 0;
    return Math.round((idx / (STATUS_STEPS.length - 1)) * 100);
  };

  const getStepState = (step: string, currentStatus: string) => {
    if (currentStatus === 'Cancelled') return 'is-cancelled';
    const currentIdx = STATUS_STEPS.indexOf(currentStatus);
    const stepIdx    = STATUS_STEPS.indexOf(step);
    if (stepIdx < currentIdx)  return 'is-done';
    if (stepIdx === currentIdx) return 'is-active';
    return '';
  };

  // Restore từ localStorage
  useEffect(() => {
    try {
      const saved     = localStorage.getItem('lastTrackedOrder');
      const savedNum  = localStorage.getItem('lastOrderNumber');
      const savedLang = localStorage.getItem('lastOrderLanguage');
      if (saved && savedLang === language) {
        setResult(JSON.parse(saved));
        if (savedNum) setOrderNumber(savedNum);
      } else if (saved && savedLang !== language) {
        localStorage.removeItem('lastTrackedOrder');
        if (savedNum) setOrderNumber(savedNum);
      }
    } catch { localStorage.removeItem('lastTrackedOrder'); }
  }, [language]);

  useEffect(() => {
    const savedNum = localStorage.getItem('lastOrderNumber');
    if (savedNum && orderNumber) handleSearch(new Event('submit') as any, true);
  }, [language]);

  const handleSearch = async (e: React.FormEvent, silent = false) => {
    e.preventDefault();
    if (!silent) { setError(''); setResult(null); }
    if (!orderNumber.trim()) {
      setError(t('orderTracking.fillOrderCode') || 'Vui lòng nhập mã đơn hàng');
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/orders/track/${orderNumber.toUpperCase().trim()}?lang=${language}`
      );
      setResult(res.data);
      localStorage.setItem('lastTrackedOrder',  JSON.stringify(res.data));
      localStorage.setItem('lastOrderNumber',   orderNumber.toUpperCase().trim());
      localStorage.setItem('lastOrderLanguage', language);
    } catch (err: any) {
      if (!silent)
        setError(err.response?.data?.message || t('orderTracking.orderNotFound') || 'Không tìm thấy đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null); setOrderNumber(''); setError('');
    localStorage.removeItem('lastTrackedOrder');
    localStorage.removeItem('lastOrderNumber');
    localStorage.removeItem('lastOrderLanguage');
  };

  return (
    <div className="order-tracking-page">
      <div className="tracking-container">

        {/* ── Header ── */}
        <div className="tracking-header">
          <div className="tracking-header__icon">
            <Package size={32} />
          </div>
          <h1>{t('orderTracking.title') || 'Tra cứu đơn hàng'}</h1>
          <p>{t('orderTracking.subtitle') || 'Nhập mã đơn hàng để kiểm tra trạng thái giao hàng'}</p>
        </div>

        {/* ══ FORM ══ */}
        {!result ? (
          <form className="tracking-form" onSubmit={handleSearch}>
            <div className="form-group">
              <label>{t('orderTracking.orderCode') || 'Mã đơn hàng'}</label>
              <div className="input-wrap">
                <span className="input-icon"><Package size={16} /></span>
                <input
                  type="text"
                  placeholder={t('orderTracking.orderCodePlaceholder') || 'Ví dụ: DH2512150001'}
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>{t('orderTracking.searching') || 'Đang tìm...'}</>
              ) : (
                <><Search size={17} /> {t('orderTracking.searchButton') || 'Tra cứu đơn hàng'}</>
              )}
            </button>

            <p className="form-hint">
              Mã đơn hàng có dạng <strong>DH + ngày + số thứ tự</strong>, bạn sẽ nhận được sau khi đặt hàng thành công.
            </p>
          </form>

        ) : (
          /* ══ RESULT ══ */
          <div className="tracking-result">

            {/* Top bar: mã đơn + badge trạng thái */}
            <div className="result-topbar">
              <div className="result-order-id">
                <h2>{t('orderTracking.orderLabel') || 'Đơn hàng'}</h2>
                <div className="order-code">#{result.orderId}</div>
              </div>
              <div
                className="status-badge"
                style={{ background: `${getStatusColor(result.statusKey)}22`, color: getStatusColor(result.statusKey), borderColor: `${getStatusColor(result.statusKey)}55` }}
              >
                {getStepIcon(result.statusKey, 16)}
                {getStatusLabel(result.statusKey)}
              </div>
            </div>

            {/* Timeline */}
            {result.statusKey !== 'Cancelled' && (
              <div className="order-timeline">
                <div className="order-timeline__steps">
                  {/* Background line */}
                  <div className="order-timeline__line">
                    <div className="order-timeline__line__fill" style={{ width: `${getTimelineFill(result.statusKey)}%` }} />
                  </div>

                  {STATUS_STEPS.map((step) => (
                    <div key={step} className={`order-timeline__step ${getStepState(step, result.statusKey)}`}>
                      <div className="order-timeline__step__dot">
                        {getStepIcon(step, 14)}
                      </div>
                      <div className="order-timeline__step__label">{getStatusLabel(step)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Body */}
            <div className="result-body">

              {/* Thông tin khách hàng */}
              <div className="detail-section">
                <h3>{t('orderTracking.customerInfo') || 'Thông tin khách hàng'}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>{t('orderTracking.fullName') || 'Họ tên'}</strong>
                    <span>{result.customerName}</span>
                  </div>
                  <div className="detail-item">
                    <strong>{t('orderTracking.phone') || 'Số điện thoại'}</strong>
                    <span>{result.phone}</span>
                  </div>
                  <div className="detail-item full">
                    <strong>{t('orderTracking.address') || 'Địa chỉ'}</strong>
                    <span>{result.address}</span>
                  </div>
                  <div className="detail-item">
                    <strong>{t('orderTracking.orderDate') || 'Ngày đặt'}</strong>
                    <span>{result.orderDate}</span>
                  </div>
                  <div className="detail-item">
                    <strong>{t('orderTracking.paymentMethod') || 'Thanh toán'}</strong>
                    <span>{getPaymentMethodLabel(result.paymentMethod)}</span>
                  </div>
                </div>
              </div>

              {/* Sản phẩm */}
              <div className="detail-section">
                <h3>{t('orderTracking.orderedProducts') || 'Sản phẩm đã đặt'}</h3>
                <div className="items-list">
                  {result.items?.length > 0 ? result.items.map((item, idx) => {
                    if (!item || typeof item !== 'object') return null;
                    const imageUrl = item.img_url || item.images?.[0] || null;
                    const attrs = item.selectedAttributes || {};
                    return (
                      <div key={idx} className="item-row">
                        <img
                          src={imageUrl ? getImageUrl(imageUrl) : 'https://via.placeholder.com/64?text=No+Image'}
                          alt={item.name || 'Product'}
                          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/64?text=Error'; }}
                        />
                        <div className="item-info">
                          <div className="item-name">{item.name || 'N/A'}</div>
                          <div className="item-quantity">
                            {t('orderTracking.quantity') || 'Số lượng'}: <strong>{item.quantity || 0}</strong>
                          </div>
                          {Object.keys(attrs).length > 0 && (
                            <div className="item-attributes">
                              {Object.entries(attrs).map(([key, value], i) => (
                                <span key={i} className="attribute-badge">
                                  <strong>{String(key)}:</strong> {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="item-price">{item.price || '0₫'}</div>
                      </div>
                    );
                  }) : (
                    <p style={{ padding: '20px', color: '#888', textAlign: 'center' }}>
                      {t('orderTracking.noProducts') || 'Không có sản phẩm nào'}
                    </p>
                  )}
                </div>

                <div className="total-row">
                  <strong>{t('cart.total') || 'Tổng cộng'}</strong>
                  <span className="total-amount">{result.totalAmount}</span>
                </div>
              </div>

            </div>{/* /result-body */}

            <div style={{ padding: '0 28px 28px' }}>
              <button onClick={handleReset} className="back-btn" type="button">
                <RotateCcw size={16} />
                {t('orderTracking.searchAnother') || 'Tra cứu đơn hàng khác'}
              </button>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="tracking-footer">
          <p>
            <Phone size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t('orderTracking.needSupport') || 'Cần hỗ trợ? Gọi'}{' '}
            <strong>0941 038 839</strong>
          </p>
        </div>

      </div>
    </div>
  );
}