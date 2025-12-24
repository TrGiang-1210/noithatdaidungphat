// src/pages/order/OrderSuccess.tsx - MULTILINGUAL VERSION
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '@/styles/pages/user/orderSuccess.scss';
import { useLanguage } from '@/context/LanguageContext';

const OrderSuccess = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ TỰ ĐỘNG SCROLL LÊN ĐẦU TRANG KHI VÀO
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Lấy dữ liệu từ payCart (nếu có)
  const orderData = location.state as {
    orderCode?: string;
    total?: number;
    isGuest?: boolean;
  } | null;

  // Luôn hiển thị mã đơn hàng (dù guest hay đã đăng nhập)
  const orderCode = orderData?.orderCode || 'DHxxxxx';

  return (
    <div className="order-success-container">
      <div className="success-icon">✓</div>
      
      <h1>{t('orderSuccess.title') || 'ĐẶT HÀNG THÀNH CÔNG!'}</h1>
      
      <p className="thank-you">
        {t('orderSuccess.thankYou') || 'Cảm ơn Quý khách đã tin tưởng mua sắm tại'}{' '}
        <strong>{t('orderSuccess.companyName') || 'NỘI THẤT ĐẠI DŨNG PHÁT'}</strong>
      </p>

      {/* ✅ CHUYỂN MÃ ĐƠN HÀNG LÊN NGAY SAU TIÊU ĐỀ */}
      <div className="order-code-section">
        <p className="order-code-label">
          {t('orderSuccess.orderCodeLabel') || 'MÃ ĐƠN HÀNG CỦA QUÝ KHÁCH'}
        </p>
        <h2 className="order-code-highlight">{orderCode}</h2>
        <p className="small-note">
          {t('orderSuccess.keepCodeNote') || 'Vui lòng giữ lại mã này để tiện trao đổi với nhân viên tư vấn'}
        </p>
      </div>

      <div className="info-box">
        <p>{t('orderSuccess.receivedOrder') || 'Chúng tôi đã nhận được đơn hàng của Quý khách.'}</p>
        <p>
          {t('orderSuccess.contactTime1') || 'Nhân viên sẽ liên hệ xác nhận trong vòng'}{' '}
          <strong>{t('orderSuccess.contactTime2') || '30 phút - 2 giờ'}</strong>{' '}
          {t('orderSuccess.contactTime3') || 'tới.'}
        </p>
        <p>{t('orderSuccess.immediateSupport') || 'Nếu cần hỗ trợ ngay, vui lòng gọi Hotline'}:</p>
        <h2 className="hotline">0941 038 839</h2>
      </div>

      <div className="buttons">
        <button className="btn-home" onClick={() => navigate('/')}>
          ← {t('orderSuccess.backHome') || 'Về Trang Chủ'}
        </button>
      </div>

      <p className="footer-text">
        {t('orderSuccess.regards') || 'Trân trọng'},<br />
        <strong>{t('orderSuccess.signature') || 'Nội Thất Đại Dũng Phát - Uy Tín Từ Tâm'}</strong>
      </p>
    </div>
  );
};

export default OrderSuccess;