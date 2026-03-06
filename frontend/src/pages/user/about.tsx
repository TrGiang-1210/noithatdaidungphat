import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "@/styles/pages/user/about.scss";
import banner1 from "@/assets/banner/banner1.jpg";
import {
  FaWarehouse,
  FaUsers,
  FaHandshake,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaFacebook,
  FaCheckCircle,
  FaLeaf,
  FaTools,
  FaTruck,
  FaPercent,
  FaShieldAlt,
} from "react-icons/fa";

const STATS = [
  { value: "2019", label: "Năm thành lập", icon: <FaWarehouse /> },
  { value: "10.000+", label: "Khách hàng tin tưởng", icon: <FaUsers /> },
  { value: "500+", label: "Đối tác công ty", icon: <FaHandshake /> },
  { value: "5–10", label: "Năm bảo hành", icon: <FaShieldAlt /> },
];

const WHY_US = [
  { icon: <FaLeaf />, title: "Gỗ tự nhiên & công nghiệp", desc: "Nguyên liệu chọn lọc, hiện đại, giá tốt tận xưởng sản xuất." },
  { icon: <FaTools />, title: "Tư vấn thiết kế thi công", desc: "Theo yêu cầu dự án, nhà ở, văn phòng — đội ngũ chuyên nghiệp." },
  { icon: <FaTruck />, title: "Miễn phí lắp đặt & giao hàng", desc: "Giao toàn quốc, lắp đặt tận nơi không phụ thu." },
  { icon: <FaPercent />, title: "Trả góp 0% lãi suất", desc: "Hỗ trợ trả góp linh hoạt lên đến 6 tháng." },
  { icon: <FaShieldAlt />, title: "Bảo hành 5–10 năm", desc: "Cam kết chính hãng, đổi trả minh bạch, không điều kiện ẩn." },
  { icon: <FaUsers />, title: "Hỗ trợ 24/7", desc: "Đội ngũ tư vấn luôn sẵn sàng, phản hồi trong vòng 30 phút." },
];

const CONTACTS = [
  { icon: <FaMapMarkerAlt />, label: "Showroom Nội Thất", value: "Ấp mới 2, xã Mỹ Hạnh, tỉnh Tây Ninh" },
  { icon: <FaMapMarkerAlt />, label: "Showroom Nệm", value: "Chợ Ấp mới 1, xã Mỹ Hạnh, tỉnh Tây Ninh" },
  { icon: <FaPhone />, label: "Hotline / Zalo", value: "0941.038.839 – 0965.708.839" },
  { icon: <FaEnvelope />, label: "Email", value: "noithatdaidungphat@gmail.com" },
  { icon: <FaGlobe />, label: "Website", value: "tongkhonoithattayninh.vn" },
  { icon: <FaFacebook />, label: "Fanpage", value: "facebook.com/noithatredepla" },
];

const AboutDaiDungPhat: React.FC = () => {
  const navigate = useNavigate();

  // Intersection Observer cho scroll-reveal
  const revealRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.12 }
    );

    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addReveal = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <div className="about-page">
      {/* ── HERO ── */}
      <section className="about-hero" ref={addReveal}>
        <div className="hero-bg">
          <img src={banner1} alt="Showroom Nội thất Đại Dũng Phát" className="hero-img" />
          <div className="hero-overlay" />
        </div>
        <div className="hero-content">
          <span className="hero-eyebrow">Kể từ năm 2019</span>
          <h1 className="hero-title">Nội thất<br /><em>Đại Dũng Phát</em></h1>
          <p className="hero-subtitle">
            Chuyên sản xuất & cung cấp nội thất gỗ tự nhiên, gỗ công nghiệp<br className="br-desktop" />
            và nệm cao cấp — giá tốt nhất từ xưởng sản xuất
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="about-stats" ref={addReveal}>
        <div className="stats-inner">
          {STATS.map((s, i) => (
            <div className="stat-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="about-section about-intro" ref={addReveal}>
        <div className="about-container">
          <div className="section-label">Về chúng tôi</div>
          <h2 className="section-heading">Hơn 5 năm<br />kiến tạo không gian sống</h2>
          <div className="section-body two-col">
            <p>
              <strong>Nội thất Đại Dũng Phát</strong> được thành lập năm 2019 tại Long An
              (nay là tỉnh Tây Ninh sau sáp nhập), chuyên sản xuất và cung cấp nội thất gỗ
              tự nhiên, gỗ công nghiệp và nhựa — bàn ghế sofa, giường tủ, nội thất văn
              phòng, phòng ngủ, phòng khách, tủ bếp với giá tốt nhất thị trường.
            </p>
            <p>
              Năm 2025, chúng tôi ra mắt thêm <strong>Showroom Chăn Ga Gối Nệm</strong> với
              ngành nệm chủ lực, phân phối các dòng sản phẩm nệm chính hãng cao cấp trên
              toàn quốc — mang đến giải pháp hoàn chỉnh cho không gian nghỉ ngơi của gia đình bạn.
            </p>
          </div>
        </div>
      </section>

      {/* ── CAPACITY ── */}
      <section className="about-section about-capacity" ref={addReveal}>
        <div className="about-container">
          <div className="capacity-grid">
            <div className="capacity-text">
              <div className="section-label">Quy mô & năng lực</div>
              <h2 className="section-heading">Cơ sở hạ tầng<br />hiện đại, quy mô lớn</h2>
              <ul className="capacity-list">
                {[
                  "Nhà xưởng sản xuất hiện đại tại Tây Ninh",
                  "Hơn 10.000 khách hàng đã tin tưởng sử dụng",
                  "Hơn 500 đối tác / quý công ty tin dùng sản phẩm",
                  "Hệ thống showroom tại Tây Ninh (sau sáp nhập từ Long An)",
                ].map((item, i) => (
                  <li key={i}>
                    <FaCheckCircle className="check-icon" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="capacity-visual">
              <div
                className="visual-card clickable"
                onClick={() => navigate("/posts/10000-trai-nghiem-khach-hang")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate("/posts/10000-trai-nghiem-khach-hang")}
              >
                <div className="vc-big">10.000<span>+</span></div>
                <div className="vc-sub">khách hàng trên toàn quốc</div>
                <div className="vc-cta">Xem chi tiết →</div>
              </div>
              <div
                className="visual-card accent clickable"
                onClick={() => navigate("/posts/du-an-cua-cac-quy-cong-ty")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate("/posts/du-an-cua-cac-quy-cong-ty")}
              >
                <div className="vc-big">500<span>+</span></div>
                <div className="vc-sub">đối tác doanh nghiệp</div>
                <div className="vc-cta">Xem chi tiết →</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="about-section about-why" ref={addReveal}>
        <div className="about-container">
          <div className="section-label">Lý do chọn chúng tôi</div>
          <h2 className="section-heading">Giá tại xưởng — Chất lượng — Tận tâm</h2>
          <div className="why-grid">
            {WHY_US.map((item, i) => (
              <div className="why-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="why-icon">{item.icon}</div>
                <div className="why-text">
                  <div className="why-title">{item.title}</div>
                  <div className="why-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMITMENT ── */}
      <section className="about-section about-commit" ref={addReveal}>
        <div className="about-container">
          <div className="commit-banner">
            <div className="commit-quote">"</div>
            <div className="commit-text">
              <div className="section-label light">Cam kết của chúng tôi</div>
              <p>
                Mọi sản phẩm đều được kiểm tra chuẩn chỉnh trước khi giao đến Quý khách hàng.
                Đội ngũ tư vấn, thiết kế, thi công tận tình — luôn sẵn sàng hỗ trợ 24/7 để
                mang đến không gian sống đẹp, hiện đại và tiện nghi nhất.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="about-section about-contact" ref={addReveal}>
        <div className="about-container">
          <div className="section-label">Liên hệ</div>
          <h2 className="section-heading">Đến gặp chúng tôi</h2>
          <div className="contact-grid">
            {CONTACTS.map((c, i) => (
              <div className="contact-item" key={i}>
                <div className="contact-icon">{c.icon}</div>
                <div className="contact-info">
                  <div className="contact-label">{c.label}</div>
                  <div className="contact-value">{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutDaiDungPhat;