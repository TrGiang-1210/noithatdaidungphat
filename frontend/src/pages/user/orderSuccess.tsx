// src/pages/order/OrderSuccess.tsx   (hoặc đặt ở bất kỳ đâu bạn thích)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '@/styles/pages/user/orderSuccess.scss'; // tạo file scss nếu muốn đẹp hơn

const OrderSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="order-success-container">
      <div className="success-icon">✓</div>
      
      <h1>ĐẶT HÀNG THÀNH CÔNG!</h1>
      
      <p className="thank-you">
        Cảm ơn Quý khách đã tin tưởng mua sắm tại <strong>NỘI THẤT ĐẠI DŨNG PHÁT</strong>
      </p>
      
      <div className="info-box">
        <p>Chúng tôi đã nhận được đơn hàng của Quý khách.</p>
        <p>Nhân viên sẽ liên hệ xác nhận trong vòng <strong>30 phút - 2 giờ</strong> tới.</p>
        <p>Nếu cần hỗ trợ ngay, vui lòng gọi Hotline:</p>
        <h2 className="hotline">0944 333 966</h2>
      </div>

      <div className="buttons">
        <button className="btn-home" onClick={() => navigate('/')}>
          ← Về Trang Chủ Mua Tiếp
        </button>
        <button className="btn-history" onClick={() => navigate('/profile/orders')}>
          Xem Lịch Sử Đơn Hàng
        </button>
      </div>

      <p className="footer-text">
        Trân trọng,<br /><strong>Nội Thất Đại Dũng Phát - Uy Tín Tạo Nên Thương Hiệu</strong>
      </p>
    </div>
  );
};

export default OrderSuccess;    