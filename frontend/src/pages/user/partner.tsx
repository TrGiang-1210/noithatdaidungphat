import React from 'react';
import "@/styles/pages/user/partner.scss";
import homeCreditLogo from "@/assets/home_credit_logo.png";
const Partner: React.FC = () => {
  return (
    <div className="partner-page">
      {/* Hero Section */}
      <section className="partner-hero">
        <div className="partner-hero__overlay"></div>
        <div className="partner-hero__content">
          <h1 className="partner-hero__title">
            MUA NỘI THẤT TRẢ GÓP CÙNG<br />
            NỘI THẤT ĐẠI DŨNG PHÁT VÀ HOME CREDIT
          </h1>
          <p className="partner-hero__subtitle">
            Giải pháp tài chính linh hoạt - Sở hữu ngay nội thất mơ ước
          </p>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="partner-intro">
        <div className="container">
          <div className="partner-intro__content">
            <h2 className="section-title">Đối Tác Tài Chính Uy Tín</h2>
            <div className="partner-intro__grid">
              <div className="partner-intro__logo">
                <img src={homeCreditLogo} alt="Home Credit Logo" />
              </div>
              <div className="partner-intro__text">
                <p>
                  <strong>Home Credit</strong> là công ty tài chính tiêu dùng hàng đầu tại Việt Nam, 
                  chuyên cung cấp các giải pháp cho vay tiêu dùng linh hoạt và tiện lợi. 
                  Với mạng lưới rộng khắp và quy trình phê duyệt nhanh chóng, Home Credit 
                  đã đồng hành cùng hàng triệu khách hàng Việt Nam hiện thực hóa ước mơ sở hữu 
                  những sản phẩm yêu thích.
                </p>
                <p>
                  Hợp tác cùng <strong>Nội Thất Đại Dũng Phát</strong>, Home Credit mang đến 
                  cho khách hàng cơ hội sở hữu nội thất cao cấp với các gói trả góp 
                  lãi suất ưu đãi, thủ tục đơn giản và thời gian phê duyệt nhanh chóng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="partner-benefits">
        <div className="container">
          <h2 className="section-title">Ưu Đãi Vượt Trội</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-card__icon">
                <i className="icon-percentage"></i>
              </div>
              <h3 className="benefit-card__title">Lãi Suất Ưu Đãi</h3>
              <p className="benefit-card__desc">
                Lãi suất cạnh tranh từ 0% cho các chương trình khuyến mãi, 
                giúp khách hàng tiết kiệm tối đa chi phí
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-card__icon">
                <i className="icon-clock"></i>
              </div>
              <h3 className="benefit-card__title">Duyệt Nhanh 15 Phút</h3>
              <p className="benefit-card__desc">
                Quy trình phê duyệt nhanh chóng, kết quả trong vòng 15 phút, 
                nhận hàng ngay trong ngày
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-card__icon">
                <i className="icon-document"></i>
              </div>
              <h3 className="benefit-card__title">Thủ Tục Đơn Giản</h3>
              <p className="benefit-card__desc">
                Chỉ cần CMND/CCCD, không cần chứng minh thu nhập, 
                không cần tài sản đảm bảo
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-card__icon">
                <i className="icon-calendar"></i>
              </div>
              <h3 className="benefit-card__title">Kỳ Hạn Linh Hoạt</h3>
              <p className="benefit-card__desc">
                Đa dạng các gói trả góp từ 6-18 tháng, 
                phù hợp với nhu cầu tài chính của mọi khách hàng
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-card__icon">
                <i className="icon-gift"></i>
              </div>
              <h3 className="benefit-card__title">Quà Tặng Hấp Dẫn</h3>
              <p className="benefit-card__desc">
                Nhiều chương trình ưu đãi, quà tặng giá trị 
                dành riêng cho khách hàng trả góp qua Home Credit
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-card__icon">
                <i className="icon-shield"></i>
              </div>
              <h3 className="benefit-card__title">Bảo Mật Thông Tin</h3>
              <p className="benefit-card__desc">
                Cam kết bảo mật tuyệt đối thông tin cá nhân, 
                tuân thủ nghiêm ngặt các quy định về bảo vệ dữ liệu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="partner-process">
        <div className="container">
          <h2 className="section-title">Quy Trình Mua Trả Góp</h2>
          <div className="process-timeline">
            <div className="process-step">
              <div className="process-step__number">1</div>
              <div className="process-step__content">
                <h3>Chọn Sản Phẩm</h3>
                <p>Tham quan showroom và chọn sản phẩm nội thất yêu thích tại Nội Thất Đại Dũng Phát</p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-step__number">2</div>
              <div className="process-step__content">
                <h3>Đăng Ký Trả Góp</h3>
                <p>Điền thông tin vào đơn đăng ký trả góp Home Credit, chỉ cần CMND/CCCD</p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-step__number">3</div>
              <div className="process-step__content">
                <h3>Phê Duyệt Nhanh</h3>
                <p>Nhận kết quả phê duyệt trong vòng 15 phút, tỷ lệ chấp thuận cao</p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-step__number">4</div>
              <div className="process-step__content">
                <h3>Nhận Hàng</h3>
                <p>Ký hợp đồng và nhận hàng ngay, bắt đầu thanh toán từ tháng sau</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Packages Section */}
      <section className="partner-packages">
        <div className="container">
          <h2 className="section-title">Các Gói Trả Góp</h2>
          <div className="packages-grid">
            <div className="package-card">
              <div className="package-card__header">
                <h3 className="package-card__title">Gói 6 Tháng</h3>
                <div className="package-card__rate">Lãi suất 0%</div>
              </div>
              <div className="package-card__body">
                <ul className="package-card__features">
                  <li>✓ Không lãi suất cho đơn hàng từ 10 triệu</li>
                  <li>✓ Trả trước 0đ hoặc từ 20%</li>
                  <li>✓ Thời gian vay ngắn, áp lực thấp</li>
                  <li>✓ Phù hợp mua sắm giá trị nhỏ</li>
                </ul>
              </div>
              <div className="package-card__footer">
                <p className="package-card__note">*Áp dụng theo chương trình khuyến mãi</p>
              </div>
            </div>

            <div className="package-card package-card--featured">
              <div className="package-card__badge">Phổ Biến</div>
              <div className="package-card__header">
                <h3 className="package-card__title">Gói 12 Tháng</h3>
                <div className="package-card__rate">Từ 0.83%/tháng</div>
              </div>
              <div className="package-card__body">
                <ul className="package-card__features">
                  <li>✓ Lãi suất ưu đãi cạnh tranh</li>
                  <li>✓ Trả trước từ 0-30%</li>
                  <li>✓ Kỳ hạn cân bằng, phù hợp đại đa số</li>
                  <li>✓ Áp dụng mọi đơn hàng từ 3 triệu</li>
                  <li>✓ Nhiều ưu đãi và quà tặng kèm theo</li>
                </ul>
              </div>
              <div className="package-card__footer">
                <p className="package-card__note">*Gói được khách hàng lựa chọn nhiều nhất</p>
              </div>
            </div>

            <div className="package-card">
              <div className="package-card__header">
                <h3 className="package-card__title">Gói 18 Tháng</h3>
                <div className="package-card__rate">Từ 1.17%/tháng</div>
              </div>
              <div className="package-card__body">
                <ul className="package-card__features">
                  <li>✓ Kỳ hạn dài, trả góp nhẹ nhàng</li>
                  <li>✓ Trả trước từ 0-30%</li>
                  <li>✓ Phù hợp đơn hàng giá trị cao</li>
                  <li>✓ Áp lực tài chính thấp nhất</li>
                </ul>
              </div>
              <div className="package-card__footer">
                <p className="package-card__note">*Dành cho nhu cầu mua sắm lớn</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="partner-requirements">
        <div className="container">
          <h2 className="section-title">Điều Kiện & Hồ Sơ</h2>
          <div className="requirements-grid">
            <div className="requirements-col">
              <h3 className="requirements-col__title">Điều Kiện Vay</h3>
              <ul className="requirements-list">
                <li>
                  <span className="requirements-list__icon">✓</span>
                  <span>Công dân Việt Nam từ 20-65 tuổi</span>
                </li>
                <li>
                  <span className="requirements-list__icon">✓</span>
                  <span>Có CMND/CCCD còn hiệu lực</span>
                </li>
                <li>
                  <span className="requirements-list__icon">✓</span>
                  <span>Có thu nhập ổn định</span>
                </li>
                <li>
                  <span className="requirements-list__icon">✓</span>
                  <span>Không nằm trong danh sách đen tín dụng</span>
                </li>
                <li>
                  <span className="requirements-list__icon">✓</span>
                  <span>Giá trị đơn hàng tối thiểu 3 triệu đồng</span>
                </li>
              </ul>
            </div>

            <div className="requirements-col">
              <h3 className="requirements-col__title">Hồ Sơ Cần Có</h3>
              <ul className="requirements-list">
                <li>
                  <span className="requirements-list__icon">📄</span>
                  <span>CMND/CCCD gốc (bản photo không hợp lệ)</span>
                </li>
                <li>
                  <span className="requirements-list__icon">📄</span>
                  <span>Hộ khẩu (nếu có, tăng tỷ lệ duyệt)</span>
                </li>
                <li>
                  <span className="requirements-list__icon">📄</span>
                  <span>Sổ hộ nghèo/Thẻ bảo hiểm y tế (nếu có)</span>
                </li>
                <li>
                  <span className="requirements-list__icon">📄</span>
                  <span>Bảng lương/Sao kê ngân hàng (ưu tiên)</span>
                </li>
                <li>
                  <span className="requirements-list__icon">📄</span>
                  <span>Giấy tờ chứng minh thu nhập khác (nếu có)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="requirements-note">
            <p>
              <strong>Lưu ý:</strong> Hồ sơ càng đầy đủ, tỷ lệ phê duyệt càng cao và hạn mức vay càng lớn. 
              Nhân viên tư vấn sẽ hỗ trợ bạn chuẩn bị hồ sơ phù hợp nhất.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="partner-faq">
        <div className="container">
          <h2 className="section-title">Câu Hỏi Thường Gặp</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3 className="faq-item__question">Tôi có cần chứng minh thu nhập không?</h3>
              <p className="faq-item__answer">
                Không bắt buộc. Tuy nhiên, nếu bạn có giấy tờ chứng minh thu nhập (bảng lương, 
                sao kê ngân hàng), tỷ lệ phê duyệt sẽ cao hơn và hạn mức vay có thể lớn hơn.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-item__question">Thời gian phê duyệt mất bao lâu?</h3>
              <p className="faq-item__answer">
                Hồ sơ của bạn sẽ được xét duyệt ngay tại showroom, kết quả trả về trong vòng 
                15 phút. Sau khi được duyệt, bạn có thể ký hợp đồng và nhận hàng ngay.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-item__question">Tôi có thể trả trước bao nhiêu?</h3>
              <p className="faq-item__answer">
                Tùy vào gói trả góp, bạn có thể trả trước từ 0% đến 30% giá trị đơn hàng. 
                Trả trước càng nhiều, số tiền phải trả góp hàng tháng càng thấp.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-item__question">Nếu muốn trả hết trước hạn thì sao?</h3>
              <p className="faq-item__answer">
                Bạn hoàn toàn có thể thanh toán trước hạn bất kỳ lúc nào mà không phải chịu 
                phí phạt. Lãi suất chỉ tính đến thời điểm bạn thanh toán hết nợ.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-item__question">Có những hình thức thanh toán nào?</h3>
              <p className="faq-item__answer">
                Bạn có thể thanh toán qua: chuyển khoản ngân hàng, trích tài khoản tự động, 
                thanh toán tại các điểm giao dịch Home Credit, hoặc qua ví điện tử liên kết.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-item__question">Điều gì xảy ra nếu tôi trễ hạn thanh toán?</h3>
              <p className="faq-item__answer">
                Nếu trễ hạn, bạn sẽ phải chịu phí phạt chậm thanh toán và có thể ảnh hưởng đến 
                lịch sử tín dụng. Nếu gặp khó khăn, hãy liên hệ Home Credit để được tư vấn 
                và hỗ trợ điều chỉnh kế hoạch thanh toán phù hợp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="partner-cta">
        <div className="container">
          <div className="partner-cta__content">
            <h2 className="partner-cta__title">Sẵn Sàng Sở Hữu Nội Thất Mơ Ước?</h2>
            <p className="partner-cta__text">
              Đến ngay showroom Nội Thất Đại Dũng Phát để được tư vấn chi tiết 
              về các gói trả góp Home Credit phù hợp nhất với bạn!
            </p>
            <div className="partner-cta__buttons">
              <a href="/lien-he" className="btn btn--primary">Liên Hệ Tư Vấn</a>
              <a href="/san-pham" className="btn btn--secondary">Xem Sản Phẩm</a>
            </div>
            <div className="partner-cta__contact">
              <div className="partner-cta__contact-item">
                <i className="icon-phone"></i>
                <span>Hotline: 1900-xxxx</span>
              </div>
              <div className="partner-cta__contact-item">
                <i className="icon-location"></i>
                <span>Địa chỉ: Showroom Nội Thất Đại Dũng Phát</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Partner;