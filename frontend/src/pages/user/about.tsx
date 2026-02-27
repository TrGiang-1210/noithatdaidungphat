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
          <strong>Nội thất Đại Dũng Phát</strong> được thành lập năm 2019 tại Long An (giờ là tỉnh Tây Ninh sau sáp nhập), 
          chúng tôi chuyên sản xuất và cung cấp nội thất gỗ tự nhiên, 
          gỗ công nghiệp và nhựa: bàn ghế sofa, giường tủ, nội thất văn phòng - phòng ngủ - phòng khách - tủ bếp với giá tốt nhất thị trường. 
        </p>
        <p>
          Ngoài ra, năm 2025 chúng tôi ra mắt thêm <strong>Showroom Chăn Ga Gối Nệm</strong> với ngành nệm chủ lực, 
          chúng tôi phân phối các dòng sản phẩm nệm chính hãng cao cấp trên toàn quốc.
        </p>
      </div>

      <div className="section">
        <h2>2. Quy mô & năng lực sản xuất</h2>
        <p>Chúng tôi hiện sở hữu:</p>
        <ul>
          <li>Nhà xưởng sản xuất hiện đại tại Tây Ninh</li>
          <li>Hơn 10.000 Khách hàng đã tin tưởng sử dụng</li>
          <li>Hơn 500 Đối tác/ Quý công ty tin dùng sản phẩm</li>
          <li>Hệ thống showroom đặt tại Long An (Hiện giờ là tỉnh Tây Ninh - sau sáp nhập)</li>
        </ul>
      </div>

      <div className="section">
        <h2>3. Tại sao khách hàng chọn Đại Dũng Phát?</h2>
        <div className="highlight">
          Giá tại xưởng - Sản phẩm chất lượng - Dịch vụ tận tâm uy tín chuyên nghiệp
        </div>
        <ul>
          <li>Sản phẩm gỗ tự nhiên, gỗ công nghiệp hiện đại - giá tốt tận xưởng</li>
          <li>Tư vấn thiết kế thi công theo yêu cầu dự án/ nhà ở/ văn phòng </li>
          <li>Miễn phí lắp đặt, giao hàng toàn quốc</li>
          <li>Hỗ trợ trả góp 0% lãi suất lên đến 6 tháng</li>
          <li>Bảo hành chính hãng 5-10 năm</li>
        </ul>
      </div>

      <div className="section">
        <h2>4. Cam kết của chúng tôi</h2>
        <p>
          Mọi sản phẩm đều được kiểm tra chuẩn chỉnh chất lượng trước khi giao đến Quý khách hàng, Quý đối tác. 
          Đội ngũ tư vấn, thiết kế, thi công tận tình, luôn sẵn sàng hỗ trợ quý khách 24/7 để mang đến không gian sống đẹp, 
          hiện đại và tiện nghi nhất.
        </p>
      </div>

      <div className="section contact-info">
        <h2>5. Liên hệ Đại Dũng Phát</h2>
        <p><strong>Showroom Nội Thất:</strong> Ấp mới 2, xã Mỹ Hạnh, tỉnh Tây Ninh</p>
        <p><strong>Showroom Nệm:</strong> Chợ Ấp mới 1, xã Mỹ Hạnh, tỉnh Tây Ninh</p>
        <p><strong>Hotline/Zalo:</strong> 0941.038.839 - 0965.708.839</p>
        <p><strong>Email:</strong> noithatdaidungphat@gmail.com</p>
        <p><strong>Website:</strong> tongkhonoithattayninh.vn</p>
        <p><strong>Fanpage:</strong> https://www.facebook.com/noithatredepla</p>
      </div>
    </div>
  );
};

export default AboutDaiDungPhat;