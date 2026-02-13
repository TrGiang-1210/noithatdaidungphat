import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { FaFacebook, FaYoutube, FaTiktok, FaInstagram } from "react-icons/fa";
import "@/styles/components/user/footer.scss";
import logoImage from "@/assets/logo_noithatddp-removebg-preview.png";
interface Category {
  _id: string;
  name: string;
  slug: string;
}

const Footer: React.FC = () => {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Thay đổi link này thành link Google Map thực tế của bạn
  const GOOGLE_MAP_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.421361988654!2d106.4932956!3d10.865125800000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x310ad5252083fff3%3A0xeb714f7c1c23d670!2zTuG7mWkgVGjhuqV0IMSQ4bqhaSBExaluZyBQaMOhdCAtIE7hu5lpIFRo4bqldCBS4bq7IMSQ4bq5cCBMb25nIEFu!5e1!3m2!1svi!2s!4v1770954855405!5m2!1svi!2s";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `https://tongkhonoithattayninh.vn/api/categories?lang=${language}`,
        );
        const data = await response.json();
        setCategories(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoading(false);
      }
    };
    fetchCategories();
  }, [language]);

  return (
    <footer className="ddp-footer">
      {/* Google Map Section */}
      <div className="footer-map-section">
        <div className="container">
          {/* <h3 className="map-title">{t("footer.findUs")}</h3> */}
          <div className="map-container">
            <iframe
              src={GOOGLE_MAP_EMBED_URL}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Map Location"
            ></iframe>
          </div>
        </div>
      </div>

      <div className="container footer-grid">
        {/* Cột 1 – Logo + mô tả + Social Media */}
        <div className="footer-col">
          <div className="footer-logo">
            <img src={logoImage} alt="ddp" />
          </div>
          <p className="footer-desc">{t("footer.description")}</p>
          <div className="footer-hotline">
            <span className="phone-icon">📞</span>
            <span className="phone-number">0941038839 - 0965708839</span>
          </div>

          {/* Social Media Icons */}
          <div className="footer-social">
            <h4 className="social-title">{t("footer.followUs")}</h4>
            <div className="social-icons">
              <a
                href="https://www.facebook.com/noithatredepla"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon facebook"
                aria-label="Facebook"
              >
                <FaFacebook />
              </a>
              <a
                href="https://www.youtube.com/@noithatredeplongan"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon youtube"
                aria-label="YouTube"
              >
                <FaYoutube />
              </a>
              <a
                href="IwY2xjawP7hHtleHRuA2FlbQIxMABicmlkETJQdGJsWGZFTkUxYU14U0I0c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHkuvH1viNSGCsJUaKKZ1pFoaub_qjCmECNm4YGjNbDguOEtC5pjNEvM16f8v_aem__QX9nwnJ3TQOicrVm50mEA"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon tiktok"
                aria-label="TikTok"
              >
                <FaTiktok />
              </a>
              <a
                href="https://www.instagram.com/noithatdaidungphat"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon instagram"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>

        {/* Cột 2 – Chính sách */}
        <div className="footer-col">
          <h3 className="footer-title">{t("footer.policy")}</h3>
          <ul>
            <li>
              <Link to="/chinh-sach-bao-hanh">
                {t("footer.warrantyPolicy")}
              </Link>
            </li>
            <li>
              <Link to="/chinh-sach-van-chuyen">
                {t("footer.shippingPolicy")}
              </Link>
            </li>
            <li>
              <Link to="/doi-tra">{t("footer.returnPolicy")}</Link>
            </li>
            <li>
              <Link to="/bao-mat">{t("footer.privacyPolicy")}</Link>
            </li>
          </ul>
        </div>

        {/* Cột 3 – Danh mục */}
        <div className="footer-col">
          <h3 className="footer-title">{t("footer.categories")}</h3>
          {loading ? (
            <p>{t("common.loading")}</p>
          ) : categories.length > 0 ? (
            <ul>
              {categories.slice(0, 15).map((cat) => (
                <li key={cat._id}>
                  <Link to={`/danh-muc/${cat.slug}`} className="tree-link">
                    <span>{cat.name}</span>
                    {cat.children && cat.children.length > 0 && (
                      <span className="tree-arrow">›</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("footer.noCategories")}</p>
          )}
        </div>

        {/* Cột 4 – Liên hệ */}
        <div className="footer-col">
          <h3 className="footer-title">{t("footer.contact")}</h3>
          <div className="store-info">
            <h4>{t("footer.store1Name")}</h4>
            <ul>
              <li>
                {t("footer.address")}: 
                <a
                  href="https://maps.app.goo.gl/5kxYrbLMLHNRW6W19"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  474 ĐT824, Mỹ Hạnh Nam, Đức Hòa, Long An 82703, Việt Nam
                </a>
              </li>
              <li>Email: noithatdaidungphat@gmail.com</li>
              <li>{t("footer.phone")}: 0941038839 - 0965708839</li>
            </ul>

            <h4>{t("footer.store2Name")}</h4>
            <ul>
              <li>
                {t("footer.address")}: 
                <a
                  href="https://maps.app.goo.gl/1LXMP469W2WM4L7dA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  ĐT824, Mỹ Hạnh Nam, Đức Hòa, Long An, Việt Nam
                </a>
              </li>
              <li>Email: nemdaidungphat@gmail.com</li>
              <li>{t("footer.phone")}: 0941038839 - 0965708839</li>
            </ul>
          </div>
          <p className="working-hours">{t("footer.workingHours")}</p>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} {t("footer.copyright")}
      </div>
    </footer>
  );
};

export default Footer;