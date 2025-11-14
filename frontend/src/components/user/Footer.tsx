import React from "react";
import { Link } from "react-router-dom";
import "@/styles/components/user/footer.scss";

const Footer: React.FC = () => {
  return (
    <footer className="ddp-footer">
      <div className="container footer-grid">

        {/* Cột 1 — Logo + mô tả */}
        <div className="footer-col">
          <div className="footer-logo">
            <img src="/logo-ddp.png" alt="ddp" />
          </div>
          <p className="footer-desc">
            Nội Thất Đại Dũng Phát — cung cấp sản phẩm nội thất chất lượng, bền đẹp, giá tốt cho gia đình, khách sạn, văn phòng.
          </p>
          <div className="footer-hotline">
            <span className="phone-icon">📞</span>
            <span className="phone-number">0944 333 966</span>
          </div>
        </div>

        {/* Cột 2 — Chính sách */}
        <div className="footer-col">
          <h3 className="footer-title">Chính sách</h3>
          <ul>
            <li><Link to="/chinh-sach-bao-hanh">Chính sách bảo hành</Link></li>
            <li><Link to="/chinh-sach-van-chuyen">Chính sách vận chuyển</Link></li>
            <li><Link to="/doi-tra">Chính sách đổi trả</Link></li>
            <li><Link to="/bao-mat">Bảo mật thông tin</Link></li>
          </ul>
        </div>

        {/* Cột 3 — Danh mục */}
        <div className="footer-col">
          <h3 className="footer-title">Danh mục sản phẩm</h3>
          <ul>
            <li><Link to="/giuong-ngu">Giường Ngủ</Link></li>
            <li><Link to="/tu-quan-ao">Tủ Quần Áo</Link></li>
            <li><Link to="/sofa-go">Bộ Sofa Gỗ</Link></li>
            <li><Link to="/ke-tivi">Kệ Tivi</Link></li>
            <li><Link to="/tu-ruou">Tủ Rượu</Link></li>
            <li><Link to="/phong-tho">Phòng Thờ</Link></li>
          </ul>
        </div>

        {/* Cột 4 — Liên hệ */}
        <div className="footer-col">
          <h3 className="footer-title">Liên hệ</h3>
          <ul>
            <li>Địa chỉ: </li>
            <li>Email: </li>
            <li>Điện thoại: </li>
            <li>Giờ làm việc: 8:00 – 21:00 (T2–CN)</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Dại Dũng Phát — All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
