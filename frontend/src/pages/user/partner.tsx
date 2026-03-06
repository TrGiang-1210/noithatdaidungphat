import React, { useState } from 'react';
import "@/styles/pages/user/partner.scss";
import homeCreditLogo from "@/assets/home_credit_logo.png";
import {
  FaPercent, FaClock, FaFileAlt, FaCalendarAlt, FaGift, FaShieldAlt,
  FaPhone, FaMapMarkerAlt, FaCheckCircle, FaChevronDown, FaChevronUp,
  FaHandshake, FaStar,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const BENEFITS = [
  {
    icon: <FaPercent />,
    title: 'Lãi Suất Ưu Đãi',
    desc: 'Lãi suất cạnh tranh từ 0% cho các chương trình khuyến mãi, giúp khách hàng tiết kiệm tối đa chi phí.',
  },
  {
    icon: <FaClock />,
    title: 'Duyệt Nhanh 15 Phút',
    desc: 'Quy trình phê duyệt nhanh chóng, kết quả trong vòng 15 phút, nhận hàng ngay trong ngày.',
  },
  {
    icon: <FaFileAlt />,
    title: 'Thủ Tục Đơn Giản',
    desc: 'Chỉ cần CMND/CCCD, không cần chứng minh thu nhập, không cần tài sản đảm bảo.',
  },
  {
    icon: <FaCalendarAlt />,
    title: 'Kỳ Hạn Linh Hoạt',
    desc: 'Đa dạng các gói trả góp từ 6–18 tháng, phù hợp với nhu cầu tài chính của mọi khách hàng.',
  },
  {
    icon: <FaGift />,
    title: 'Quà Tặng Hấp Dẫn',
    desc: 'Nhiều chương trình ưu đãi, quà tặng giá trị dành riêng cho khách hàng trả góp qua Home Credit.',
  },
  {
    icon: <FaShieldAlt />,
    title: 'Bảo Mật Thông Tin',
    desc: 'Cam kết bảo mật tuyệt đối thông tin cá nhân, tuân thủ nghiêm ngặt các quy định bảo vệ dữ liệu.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Chọn Sản Phẩm',
    desc: 'Tham quan showroom và chọn sản phẩm nội thất yêu thích tại Nội Thất Đại Dũng Phát.',
  },
  {
    num: '02',
    title: 'Đăng Ký Trả Góp',
    desc: 'Điền thông tin vào đơn đăng ký trả góp Home Credit, chỉ cần CMND/CCCD.',
  },
  {
    num: '03',
    title: 'Phê Duyệt Nhanh',
    desc: 'Nhận kết quả phê duyệt trong vòng 15 phút, tỷ lệ chấp thuận cao.',
  },
  {
    num: '04',
    title: 'Nhận Hàng Ngay',
    desc: 'Ký hợp đồng và nhận hàng ngay, bắt đầu thanh toán từ tháng sau.',
  },
];

const PACKAGES = [
  {
    title: 'Gói 6 Tháng',
    rate: '0%',
    rateLabel: 'lãi suất',
    featured: false,
    features: [
      'Không lãi suất cho đơn từ 10 triệu',
      'Trả trước 0đ hoặc từ 20%',
      'Thời gian vay ngắn, áp lực thấp',
      'Phù hợp mua sắm giá trị nhỏ',
    ],
    note: 'Áp dụng theo chương trình khuyến mãi',
  },
  {
    title: 'Gói 12 Tháng',
    rate: '0.89%',
    rateLabel: '/tháng',
    featured: true,
    badge: 'Phổ biến nhất',
    features: [
      'Mức trả hàng tháng hợp lý',
      'Áp dụng mọi đơn từ 3 triệu',
      'Nhiều ưu đãi & quà tặng kèm theo',
      'Tỷ lệ phê duyệt cao nhất',
    ],
    note: 'Gói được khách hàng lựa chọn nhiều nhất',
  },
  {
    title: 'Gói 18 Tháng',
    rate: '1.17%',
    rateLabel: '/tháng',
    featured: false,
    features: [
      'Kỳ hạn dài, trả góp nhẹ nhàng',
      'Trả trước từ 0–30%',
      'Phù hợp đơn hàng giá trị cao',
      'Áp lực tài chính thấp nhất',
    ],
    note: 'Dành cho nhu cầu mua sắm lớn',
  },
];

const FAQS = [
  {
    q: 'Tôi có cần chứng minh thu nhập không?',
    a: 'Không bắt buộc. Tuy nhiên, nếu bạn có giấy tờ chứng minh thu nhập (bảng lương, sao kê ngân hàng), tỷ lệ phê duyệt sẽ cao hơn và hạn mức vay có thể lớn hơn.',
  },
  {
    q: 'Thời gian phê duyệt mất bao lâu?',
    a: 'Hồ sơ của bạn sẽ được xét duyệt ngay tại showroom, kết quả trả về trong vòng 15 phút. Sau khi được duyệt, bạn có thể ký hợp đồng và nhận hàng ngay.',
  },
  {
    q: 'Tôi có thể trả trước bao nhiêu?',
    a: 'Tùy vào gói trả góp, bạn có thể trả trước từ 0% đến 30% giá trị đơn hàng. Trả trước càng nhiều, số tiền phải trả góp hàng tháng càng thấp.',
  },
  {
    q: 'Nếu muốn trả hết trước hạn thì sao?',
    a: 'Bạn hoàn toàn có thể thanh toán trước hạn bất kỳ lúc nào mà không phải chịu phí phạt. Lãi suất chỉ tính đến thời điểm bạn thanh toán hết nợ.',
  },
  {
    q: 'Có những hình thức thanh toán nào?',
    a: 'Bạn có thể thanh toán qua: chuyển khoản ngân hàng, trích tài khoản tự động, thanh toán tại các điểm giao dịch Home Credit, hoặc qua ví điện tử liên kết.',
  },
  {
    q: 'Điều gì xảy ra nếu tôi trễ hạn thanh toán?',
    a: 'Nếu trễ hạn, bạn sẽ phải chịu phí phạt chậm thanh toán và có thể ảnh hưởng đến lịch sử tín dụng. Nếu gặp khó khăn, hãy liên hệ Home Credit để được hỗ trợ điều chỉnh kế hoạch thanh toán.',
  },
];

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="faq-q">
        <span>{q}</span>
        {open ? <FaChevronUp className="faq-icon" /> : <FaChevronDown className="faq-icon" />}
      </div>
      <div className="faq-a">
        <p>{a}</p>
      </div>
    </div>
  );
};

const Partner: React.FC = () => {
  return (
    <div className="partner-page">
      {/* ── HERO ── */}
      <section className="pt-hero">
        <div className="pt-hero-bg" />
        <div className="pt-hero-inner">
          <div className="pt-hero-badge">
            <FaHandshake /> Đối tác tài chính
          </div>
          <h1 className="pt-hero-title">
            Mua Nội Thất Trả Góp<br />
            <span>Cùng Home Credit</span>
          </h1>
          <p className="pt-hero-sub">
            Giải pháp tài chính linh hoạt — Sở hữu ngay nội thất mơ ước
          </p>
          <div className="pt-hero-stats">
            <div className="pt-hero-stat"><strong>0%</strong><span>Lãi suất ưu đãi</span></div>
            <div className="pt-hero-stat-sep" />
            <div className="pt-hero-stat"><strong>15 phút</strong><span>Phê duyệt nhanh</span></div>
            <div className="pt-hero-stat-sep" />
            <div className="pt-hero-stat"><strong>6–18</strong><span>Tháng linh hoạt</span></div>
          </div>
        </div>
      </section>

      {/* ── INTRO ── */}
      <section className="pt-section pt-intro">
        <div className="pt-container">
          <div className="pt-section-label">Đối tác uy tín</div>
          <h2 className="pt-section-title">Hợp Tác Với Home Credit</h2>
          <div className="pt-intro-grid">
            <div className="pt-intro-logo">
              <img src={homeCreditLogo} alt="Home Credit" />
            </div>
            <div className="pt-intro-text">
              <p>
                <strong>Home Credit</strong> là công ty tài chính tiêu dùng hàng đầu tại Việt Nam,
                chuyên cung cấp các giải pháp cho vay tiêu dùng linh hoạt và tiện lợi.
                Với mạng lưới rộng khắp và quy trình phê duyệt nhanh chóng, Home Credit
                đã đồng hành cùng hàng triệu khách hàng hiện thực hóa ước mơ sở hữu những sản phẩm yêu thích.
              </p>
              <p>
                Hợp tác cùng <strong>Nội Thất Đại Dũng Phát</strong>, Home Credit mang đến
                cho khách hàng cơ hội sở hữu nội thất cao cấp với các gói trả góp lãi suất ưu đãi,
                thủ tục đơn giản và thời gian phê duyệt nhanh chóng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="pt-section pt-benefits">
        <div className="pt-container">
          <div className="pt-section-label">Vì sao chọn trả góp</div>
          <h2 className="pt-section-title">Ưu Đãi Vượt Trội</h2>
          <div className="pt-benefits-grid">
            {BENEFITS.map((b, i) => (
              <div className="pt-benefit-card" key={i}>
                <div className="pt-benefit-icon">{b.icon}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="pt-section pt-process">
        <div className="pt-container">
          <div className="pt-section-label">Chỉ 4 bước đơn giản</div>
          <h2 className="pt-section-title">Quy Trình Mua Trả Góp</h2>
          <div className="pt-steps">
            {STEPS.map((s, i) => (
              <div className="pt-step" key={i}>
                <div className="pt-step-num">{s.num}</div>
                <div className="pt-step-connector" />
                <div className="pt-step-card">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PACKAGES ── */}
      <section className="pt-section pt-packages">
        <div className="pt-container">
          <div className="pt-section-label">Lựa chọn phù hợp</div>
          <h2 className="pt-section-title">Các Gói Trả Góp</h2>
          <div className="pt-packages-grid">
            {PACKAGES.map((pkg, i) => (
              <div className={`pt-pkg-card ${pkg.featured ? 'featured' : ''}`} key={i}>
                {pkg.badge && (
                  <div className="pt-pkg-badge">
                    <FaStar /> {pkg.badge}
                  </div>
                )}
                <div className="pt-pkg-header">
                  <div className="pt-pkg-title">{pkg.title}</div>
                  <div className="pt-pkg-rate">
                    <span className="rate-num">{pkg.rate}</span>
                    <span className="rate-label">{pkg.rateLabel}</span>
                  </div>
                </div>
                <ul className="pt-pkg-features">
                  {pkg.features.map((f, j) => (
                    <li key={j}>
                      <FaCheckCircle className="check" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-pkg-note">* {pkg.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUIREMENTS ── */}
      <section className="pt-section pt-requirements">
        <div className="pt-container">
          <div className="pt-section-label">Điều kiện & hồ sơ</div>
          <h2 className="pt-section-title">Ai Có Thể Đăng Ký?</h2>
          <div className="pt-req-grid">
            <div className="pt-req-col">
              <h3>Điều Kiện Vay</h3>
              <ul>
                {[
                  'Công dân Việt Nam từ 20–65 tuổi',
                  'Có CMND/CCCD còn hiệu lực',
                  'Có thu nhập ổn định',
                  'Không nằm trong danh sách đen tín dụng',
                  'Giá trị đơn hàng tối thiểu 3 triệu đồng',
                ].map((item, i) => (
                  <li key={i}>
                    <FaCheckCircle className="check" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-req-col">
              <h3>Hồ Sơ Cần Có</h3>
              <ul>
                {[
                  'CMND/CCCD gốc (bản photo không hợp lệ)',
                  'Hộ khẩu (nếu có, tăng tỷ lệ duyệt)',
                  'Sổ hộ nghèo / Thẻ bảo hiểm y tế (nếu có)',
                  'Bảng lương / Sao kê ngân hàng (ưu tiên)',
                  'Giấy tờ chứng minh thu nhập khác (nếu có)',
                ].map((item, i) => (
                  <li key={i}>
                    <FaFileAlt className="doc" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-req-note">
            <strong>💡 Lưu ý:</strong> Hồ sơ càng đầy đủ, tỷ lệ phê duyệt càng cao và hạn mức vay càng lớn.
            Nhân viên tư vấn sẽ hỗ trợ bạn chuẩn bị hồ sơ phù hợp nhất.
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="pt-section pt-faq">
        <div className="pt-container">
          <div className="pt-section-label">Giải đáp thắc mắc</div>
          <h2 className="pt-section-title">Câu Hỏi Thường Gặp</h2>
          <div className="pt-faq-list">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pt-cta">
        <div className="pt-container">
          <div className="pt-cta-inner">
            <h2>Sẵn Sàng Sở Hữu Nội Thất Mơ Ước?</h2>
            <p>Đến ngay showroom Nội Thất Đại Dũng Phát để được tư vấn chi tiết về các gói trả góp Home Credit phù hợp nhất với bạn!</p>
            <div className="pt-cta-buttons">
              {/* <Link to="/lien-he" className="pt-btn primary">Liên Hệ Tư Vấn</Link>
              <Link to="/san-pham" className="pt-btn secondary">Xem Sản Phẩm</Link> */}
            </div>
            <div className="pt-cta-contacts">
              <div className="pt-cta-contact">
                <FaPhone />
                <span>Hotline: <strong>0965 708 839</strong></span>
              </div>
              <div className="pt-cta-contact">
                <FaMapMarkerAlt />
                <span>Ấp mới 2, xã Mỹ Hạnh, Tây Ninh</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Partner;