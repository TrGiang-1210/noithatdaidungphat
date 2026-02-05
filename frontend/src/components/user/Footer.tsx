import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/components/user/footer.scss";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const Footer: React.FC = () => {
  const { t, language } = useLanguage(); // ✅ Lấy cả language
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // ✅ Thêm ?lang=${language}
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
  }, [language]); // ✅ Re-fetch khi language thay đổi

  return (
    <footer className="ddp-footer">
      <div className="container footer-grid">
        {/* Cột 1 – Logo + mô tả */}
        <div className="footer-col">
          <div className="footer-logo">
            <img src="./src/assets/logo-ddp-removebg.png" alt="ddp" />
          </div>
          <p className="footer-desc">{t("footer.description")}</p>
          <div className="footer-hotline">
            <span className="phone-icon">📞</span>
            <span className="phone-number">0941038839 - 0965708839</span>
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

        {/* Cột 3 – Danh mục (làm động) */}
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
