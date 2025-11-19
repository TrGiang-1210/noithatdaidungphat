import React from "react";
import "@/styles/pages/user/about.scss";   // <- import global SCSS như anh/chị đang làm
import banner1 from "@/assets/banner/banner1.jpg";

const AboutDaiDungPhat: React.FC = () => {
  return (
    <div className="about-page">
      <h1>Giới thiệu Nội thất Đại Dũng Phát</h1>

      <img src={banner1} alt="Showroom Nội thất Đại Dũng Phát" className="banner-img" />
      {/* Nếu chưa có ảnh thì dùng tạm link này */}
      {/* <img src="https://images.unsplash.com/photo-1558618666-fcd25b1d3d82?w=1400" alt="Showroom" className="banner-img" /> */}

      <div className="section">
        <h2>1. Về Đại Dũng Phát</h2>
        <p>
          <strong>Nội thất Đại Dũng Phát</strong> được thành lập từ năm 2008 tại Bình Dương – 
          một trong những cái nôi sản xuất nội thất lớn nhất Việt Nam.
        </p>
        <p>
          Với hơn <strong>15 năm kinh nghiệm</strong>, chúng tôi chuyên sản xuất và cung cấp 
          nội thất gỗ tự nhiên cao cấp trực tiếp từ nhà máy: bàn ghế sofa, tủ kệ, giường tủ, 
          nội thất phòng khách - phòng ngủ - phòng bếp với giá gốc tốt nhất thị trường.
        </p>
      </div>

      <div className="section">
        <h2>2. Quy mô & năng lực sản xuất</h2>
        <p>Chúng tôi hiện sở hữu:</p>
        <ul>
          <li>3 nhà máy sản xuất hiện đại tại Bình Dương</li>
          <li>Công suất hơn 5.000 sản phẩm/tháng</li>
          <li>Hơn 50.000 khách hàng đã tin tưởng sử dụng</li>
          <li>Hệ thống showroom tại Bình Dương và TP.HCM</li>
        </ul>
      </div>

      <div className="section">
        <h2>3. Tại sao khách hàng chọn Đại Dũng Phát?</h2>
        <div className="highlight">
          Giá gốc nhà máy – Không qua trung gian – Chất lượng vượt trội!
        </div>
        <ul>
          <li>100% gỗ tự nhiên & gỗ công nghiệp nhập khẩu cao cấp</li>
          <li>Thiết kế miễn phí theo không gian nhà bạn</li>
          <li>Bảo hành chính hãng 5-10 năm</li>
          <li>Giao hàng & lắp đặt tận nơi toàn quốc</li>
          <li>Hỗ trợ trả góp 0% lãi suất</li>
        </ul>
      </div>

      <div className="section">
        <h2>4. Cam kết của chúng tôi</h2>
        <p>
          Mọi sản phẩm đều được kiểm tra kỹ lưỡng trước khi xuất xưởng. 
          Đội ngũ tư vấn - thiết kế - thi công luôn sẵn sàng hỗ trợ quý khách 
          24/7 để mang đến không gian sống đẹp nhất, tiện nghi nhất.
        </p>
      </div>

      <div className="section contact-info">
        <h2>5. Liên hệ Đại Dũng Phát</h2>
        <p><strong>Showroom Bình Dương:</strong> KP.XX, P.XXX, TP. Thủ Dầu Một, Bình Dương</p>
        <p><strong>Showroom TP.HCM:</strong> Quận XXX, TP. Hồ Chí Minh</p>
        <p><strong>Hotline/Zalo:</strong> 090x.xxx.xxx - 090y.yyy.yyy</p>
        <p><strong>Email:</strong> info@daidungphat.vn</p>
        <p><strong>Website:</strong> www.daidungphat.vn</p>
        <p><strong>Fanpage:</strong> fb.com/noithatdaidungphat</p>
      </div>
    </div>
  );
};

export default AboutDaiDungPhat;