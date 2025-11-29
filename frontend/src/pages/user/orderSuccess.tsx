// src/pages/order/OrderSuccess.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '@/styles/pages/user/orderSuccess.scss';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      
      <h1>ĐẶT HÀNG THÀNH CÔNG!</h1>
      
      <p className="thank-you">
        Cảm ơn Quý khách đã tin tưởng mua sắm tại <strong>NỘI THẤT ĐẠI DŨNG PHÁT</strong>
      </p>

      {/* PHẦN DUY NHẤT GIỮ LẠI: MÃ ĐƠN HÀNG – HIỂN THỊ CHO TẤT CẢ KHÁCH */}
      <div className="order-code-section">
        <p><strong>Mã đơn hàng của Quý khách:</strong></p>
        <h2 className="order-code-highlight">{orderCode}</h2>
        <p className="small-note">
          Vui lòng giữ lại mã này để tiện trao đổi với nhân viên tư vấn
        </p>
      </div>

      <div className="info-box">
        <p>Chúng tôi đã nhận được đơn hàng của Quý khách.</p>
        <p>Nhân viên sẽ liên hệ xác nhận trong vòng <strong>30 phút - 2 giờ</strong> tới.</p>
        <p>Nếu cần hỗ trợ ngay, vui lòng gọi Hotline:</p>
        <h2 className="hotline">0941 038 839</h2>
      </div>

      <div className="buttons">
        <button className="btn-home" onClick={() => navigate('/')}>
          ← Về Trang Chủ
        </button>
      </div>

      <p className="footer-text">
        Trân trọng,<br />
        <strong>Nội Thất Đại Dũng Phát - Uy Tín Từ Tâm</strong>
      </p>
    </div>
  );
};

export default OrderSuccess;