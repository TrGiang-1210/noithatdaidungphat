import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { FaFacebook, FaYoutube, FaTiktok, FaInstagram } from "react-icons/fa";
import "@/styles/components/user/footer.scss";
import logoImage from "@/assets/new_logo_ntddp_removebg_edited-removebg-preview.png";

interface Category {
  _id: string;
  name: string;
  slug: string;
  children?: Category[];
}

// ── Cache dùng chung (10 phút) ────────────────────────────────────
const FOOTER_CACHE = new Map<string, { data: any; ts: number }>();
const CACHE_MS = 10 * 60 * 1000;

const fetchCategoriesCached = async (lang: string): Promise<Category[]> => {
  const key = `categories_${lang}`;
  const hit = FOOTER_CACHE.get(key);
  if (hit && Date.now() - hit.ts < CACHE_MS) return hit.data;
  const res  = await fetch(`https://tongkhonoithattayninh.vn/api/categories?lang=${lang}`);
  const data = await res.json();
  FOOTER_CACHE.set(key, { data, ts: Date.now() });
  return data;
};

const GOOGLE_MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.421361988654!2d106.4932956!3d10.865125800000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x310ad5252083fff3%3A0xeb714f7c1c23d670!2zTuG7mWkgVGjhuqV0IESQ4bqhaSBExaluZyBQaMOhdCAtIE7hu5lpIFRo4bqldCBS4bq7IMSQ4bq5cCBMb25nIEFu!5e1!3m2!1svi!2s!4v1770954855405!5m2!1svi!2s";

const Footer: React.FC = () => {
  const { t, language } = useLanguage();
  const { pathname } = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mapVisible, setMapVisible] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // ── Scroll to top khi navigate ────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  // ── Load categories với cache ─────────────────────────────────
  useEffect(() => {
    fetchCategoriesCached(language)
      .then(setCategories)
      .catch(() => {});
  }, [language]);

  // ── Lazy load map qua IntersectionObserver ────────────────────
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setMapVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="ddp-footer">

      {/* ── Google Map (lazy) ── */}
      <div className="footer-map-section" ref={mapRef}>
        <div className="container">
          <div className="map-container">
            {mapVisible ? (
              <iframe
                src={GOOGLE_MAP_EMBED_URL}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Vị trí Nội Thất Đại Dũng Phát"
              />
            ) : (
              <div className="map-placeholder" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>

      {/* ── Footer grid ── */}
      <div className="container footer-grid">

        {/* Cột 1 – Logo + mô tả + Social */}
        <div className="footer-col">
          <div className="footer-logo">
            <img src={logoImage} alt="Nội Thất Đại Dũng Phát" width={200} />
          </div>
          <p className="footer-desc">{t("footer.description")}</p>
          <div className="footer-hotline">
            <span className="phone-icon" aria-hidden="true">📞</span>
            <a href="tel:0941038839" className="phone-number">0941038839</a>
            <span className="phone-sep"> - </span>
            <a href="tel:0965708839" className="phone-number">0965708839</a>
          </div>

          <div className="footer-social">
            <h4 className="social-title">{t("footer.followUs")}</h4>
            <div className="social-icons">
              <a href="https://www.facebook.com/noithatredepla" target="_blank" rel="noopener noreferrer" className="social-icon facebook" aria-label="Facebook"><FaFacebook /></a>
              <a href="https://www.youtube.com/@noithatredeplongan" target="_blank" rel="noopener noreferrer" className="social-icon youtube" aria-label="YouTube"><FaYoutube /></a>
              <a href="https://www.tiktok.com/@noithatdaidungphat" target="_blank" rel="noopener noreferrer" className="social-icon tiktok" aria-label="TikTok"><FaTiktok /></a>
              <a href="https://www.instagram.com/noithatdaidungphat" target="_blank" rel="noopener noreferrer" className="social-icon instagram" aria-label="Instagram"><FaInstagram /></a>
            </div>
          </div>
        </div>

        {/* Cột 2 – Chính sách */}
        <div className="footer-col">
          <h3 className="footer-title">{t("footer.policy")}</h3>
          <ul>
            <li><Link to="/chinh-sach-bao-hanh">{t("footer.warrantyPolicy")}</Link></li>
            <li><Link to="/chinh-sach-van-chuyen">{t("footer.shippingPolicy")}</Link></li>
            <li><Link to="/doi-tra">{t("footer.returnPolicy")}</Link></li>
            <li><Link to="/bao-mat">{t("footer.privacyPolicy")}</Link></li>
          </ul>
        </div>

        {/* Cột 3 – Danh mục */}
        <div className="footer-col">
          <h3 className="footer-title">{t("footer.categories")}</h3>
          {categories.length > 0 ? (
            <ul>
              {categories.slice(0, 15).map((cat) => (
                <li key={cat._id}>
                  <Link to={`/danh-muc/${cat.slug}`} className="tree-link">
                    <span>{cat.name}</span>
                    {cat.children && cat.children.length > 0 && (
                      <span className="tree-arrow" aria-hidden="true">›</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="category-skeleton">
              {[...Array(6)].map((_, i) => (
                <li key={i}><span className="skeleton-line" style={{ width: `${55 + i * 8}%`, height: 14, display: "block", borderRadius: 4 }} /></li>
              ))}
            </ul>
          )}
        </div>

        {/* Cột 4 – Liên hệ */}
        <div className="footer-col">
          <h3 className="footer-title">{t("footer.contact")}</h3>
          <div className="store-info">
            <h4>{t("footer.store1Name")}</h4>
            <ul>
              <li>{t("footer.address")}: <a href="https://maps.app.goo.gl/5kxYrbLMLHNRW6W19" target="_blank" rel="noopener noreferrer" className="map-link">474 ĐT824, Mỹ Hạnh Nam, Đức Hòa, Long An 82703</a></li>
              <li>Email: <a href="mailto:noithatdaidungphat@gmail.com" className="map-link">noithatdaidungphat@gmail.com</a></li>
              <li>{t("footer.phone")}: <a href="tel:0941038839" className="map-link">0941038839</a> - <a href="tel:0965708839" className="map-link">0965708839</a></li>
            </ul>

            <h4>{t("footer.store2Name")}</h4>
            <ul>
              <li>{t("footer.address")}: <a href="https://maps.app.goo.gl/1LXMP469W2WM4L7dA" target="_blank" rel="noopener noreferrer" className="map-link">ĐT824, Mỹ Hạnh Nam, Đức Hòa, Long An</a></li>
              <li>Email: <a href="mailto:nemdaidungphat@gmail.com" className="map-link">nemdaidungphat@gmail.com</a></li>
              <li>{t("footer.phone")}: <a href="tel:0941038839" className="map-link">0941038839</a> - <a href="tel:0965708839" className="map-link">0965708839</a></li>
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