import React, { useState, useEffect, useRef, useContext } from "react";
import {
  FaSearch, FaBars, FaTimes, FaChevronRight, FaChevronDown, FaChevronUp,
  FaShoppingCart, FaUser, FaPhone, FaStore, FaFacebookMessenger, FaNewspaper,
  FaInfoCircle, FaPalette, FaHandshake, FaBoxOpen, FaSignOutAlt, FaEdit,
  FaCommentDots, FaMapMarkerAlt 
} from "react-icons/fa";
import { SiZalo } from "react-icons/si";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { AuthContext } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getImageUrl, getFirstImageUrl } from "@/utils/imageUrl";
import { triggerUserLogout } from "@/utils/authEvents";
import "@/styles/components/user/header.scss";
import logoImage from "@/assets/new_logo_ntddp_removebg_edited-removebg-preview.png";

interface Category {
  _id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface CurrentUser {
  _id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
}

const Header: React.FC = () => {
  const { t, language, changeLanguage } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { totalQuantity, openCart } = useCart();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredParent, setHoveredParent] = useState<string | null>(null);
  const [hoveredChild, setHoveredChild] = useState<string | null>(null);

  // Mobile specific states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [expandedMobileSubCategory, setExpandedMobileSubCategory] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileCatGridOpen, setMobileCatGridOpen] = useState(false);
  const [megaActiveParent, setMegaActiveParent] = useState<Category | null>(null);

  // Mobile scroll states — pattern: compact on scroll-down, full on scroll-up / at-top
  const [mobileScrolled, setMobileScrolled] = useState(false);   // đã rời khỏi top
  const [mobileCompact, setMobileCompact] = useState(false);     // thu gọn (scroll xuống)
  const lastScrollY = useRef(0);
  const scrollTicking = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/" || location.pathname === "/home";
  const userBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 992);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Mobile scroll — Shopee/Lazada pattern:
  // • scroll xuống > 60px  → compact (ẩn search, category bar, chips; giữ lại logo+cart+lang)
  // • scroll lên bất kỳ    → full header hiện lại
  // • về đầu trang (< 10px) → full + chips
  useEffect(() => {
    if (!isMobile) return;

    const handleMobileScroll = () => {
      if (scrollTicking.current) return;
      scrollTicking.current = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastScrollY.current;
        const atTop = currentY < 10;

        if (atTop) {
          // Đầu trang — full header + chips
          setMobileScrolled(false);
          setMobileCompact(false);
        } else if (diff > 5) {
          // Scroll xuống — compact
          setMobileScrolled(true);
          setMobileCompact(true);
        } else if (diff < -5) {
          // Scroll lên — hiện full (trừ chips vẫn ẩn cho đến khi về top)
          setMobileScrolled(true);
          setMobileCompact(false);
        }

        lastScrollY.current = currentY;
        scrollTicking.current = false;
      });
    };

    window.addEventListener("scroll", handleMobileScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleMobileScroll);
  }, [isMobile]);

  // Fetch categories + desktop scroll handler
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`https://tongkhonoithattayninh.vn/api/categories?lang=${language}`);
        const data = await response.json();
        setCategories(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoading(false);
      }
    };
    fetchCategories();

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          setIsAtTop(scrollPosition <= 10);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [language]);

  useEffect(() => {
    const updateDropdownPosition = () => {
      if (
        dropdownRef.current &&
        user &&
        userBoxRef.current?.classList.contains("show-dropdown")
      ) {
        const userBox = userBoxRef.current!.getBoundingClientRect();
        const dropdown = dropdownRef.current!;
        dropdown.style.position = "fixed";
        dropdown.style.top = `${userBox.bottom + 8}px`;
        dropdown.style.right = `${window.innerWidth - userBox.right}px`;
        dropdown.style.left = "auto";
      }
    };

    if (user) {
      window.addEventListener("scroll", updateDropdownPosition);
      window.addEventListener("resize", updateDropdownPosition);
      return () => {
        window.removeEventListener("scroll", updateDropdownPosition);
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      setShowSuggestions(true);

      try {
        const res = await fetch(
          `https://tongkhonoithattayninh.vn/api/products/search-suggestions?q=${encodeURIComponent(searchQuery)}&lang=${language}`
        );
        const data = await res.json();
        setSuggestions(data.slice(0, 6));
      } catch (err) {
        console.error("Lỗi gợi ý tìm kiếm:", err);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, language]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isHomePage) {
      document.body.classList.add("homepage");
    } else {
      document.body.classList.remove("homepage");
    }
    return () => document.body.classList.remove("homepage");
  }, [isHomePage]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleMouseEnter = () => {
    if (user) userBoxRef.current?.classList.add("show-dropdown");
  };

  const handleMouseLeave = () => {
    userBoxRef.current?.classList.remove("show-dropdown");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query === "") {
      alert(t('header.searchPlaceholder'));
      return;
    }
    navigate(`/tim-kiem?query=${encodeURIComponent(query)}`);
    setSearchQuery("");
    setMobileSearchOpen(false);
  };

  const handleLogout = () => {
    try {
      triggerUserLogout();
      logout();
      setTimeout(() => { window.location.href = '/'; }, 100);
    } catch (e) {
      window.location.href = '/';
    }
  };

  const getLastName = (fullName: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(" ");
    return parts[parts.length - 1];
  };

  const toggleMobileCategory = (id: string) => {
    setExpandedMobileCategory(prev => prev === id ? null : id);
    setExpandedMobileSubCategory(null);
  };

  const toggleMobileSubCategory = (id: string) => {
    setExpandedMobileSubCategory(prev => prev === id ? null : id);
  };

  // ======================== MOBILE HEADER ========================
  if (isMobile) {
    return (
      <>
        {/* MOBILE TOP HEADER - always sticky, never hides */}
        <header className={`mobile-header${mobileCompact ? " mobile-header--compact" : ""}`}>
          <div className="mobile-header-top">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu"
            >
              <FaBars />
            </button>

            <Link to="/" className="mobile-logo">
              <img src={logoImage} alt="Nội Thất Đại Dũng Phát" />
            </Link>

            <div className="mobile-header-actions">
              <div className="mobile-lang-switch">
                <button
                  className={`mobile-lang-btn ${language === 'vi' ? 'active' : ''}`}
                  onClick={() => { changeLanguage('vi'); document.documentElement.lang = 'vi'; }}
                >VI</button>
                <button
                  className={`mobile-lang-btn ${language === 'zh' ? 'active' : ''}`}
                  onClick={() => { changeLanguage('zh'); document.documentElement.lang = 'zh'; }}
                >ZH</button>
              </div>
              <Link
                to="/tai-khoan-ca-nhan"
                className="mobile-action-btn"
                aria-label="Tài khoản"
              >
                <FaUser />
              </Link>
              <button
                className="mobile-action-btn cart-btn"
                onClick={() => navigate("/thanh-toan")}
                aria-label="Giỏ hàng"
              >
                <FaShoppingCart />
                {totalQuantity > 0 && (
                  <span className="cart-badge">{totalQuantity}</span>
                )}
              </button>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="mobile-search-always">
            <form onSubmit={handleSearch} className="mobile-search-form">
              <input
                type="text"
                placeholder={t('header.searchPlaceholder') || "Bạn cần tìm gì?"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                autoComplete="off"
              />
              <button type="submit" className="mobile-search-submit">
                <FaSearch />
              </button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="mobile-suggestions" ref={suggestionsRef}>
                {suggestions.map((product) => (
                  <Link
                    key={product._id}
                    to={`/san-pham/${product.slug}`}
                    className="mobile-suggestion-item"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                  >
                    <img
                      src={getFirstImageUrl(product.images)}
                      alt={product.name}
                      className="mobile-suggestion-img"
                      onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/50?text=Err"; }}
                    />
                    <div className="mobile-suggestion-info">
                      <div className="mobile-suggestion-name">{product.name}</div>
                      <div className="mobile-suggestion-price">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.priceSale)}
                      </div>
                    </div>
                  </Link>
                ))}
                <div className="mobile-suggestion-footer">
                  Nhấn Enter để tìm "<strong>{searchQuery}</strong>"
                </div>
              </div>
            )}

            {showSuggestions && loadingSuggestions && (
              <div className="mobile-suggestions">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mobile-suggestion-item skeleton">
                    <div className="skeleton-img"></div>
                    <div className="skeleton-lines">
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line short"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MOBILE CATEGORY TRIGGER BAR + CHIP GRID */}
          <div className="mobile-category-section">
            <div
              className="mobile-category-header"
              onClick={() => { setMobileCatGridOpen(true); setMegaActiveParent(categories[0] || null); }}
            >
              <span className="cat-header-icon"><FaBars /></span>
              <span className="cat-header-text">Nhấn vào đây để xem toàn bộ danh mục</span>
              <span className="cat-header-arrow"><FaChevronRight /></span>
            </div>

          {/* CATEGORY CHIP GRID — 12 danh mục cố định, 6 cột × 2 hàng */}
          <div className={`mobile-cat-chips${mobileScrolled ? " mobile-cat-chips--hidden" : ""}`}>
            {[
              { name: "Giường", slug: "giuong-ngu" },
              { name: "Tủ Áo", slug: "tu-quan-ao" },
              { name: "Bàn Phấn", slug: "ban-trang-diem" },
              { name: "Nệm Ngủ", slug: "nem" },
              { name: "Sofa Gỗ", slug: "ban-ghe-sofa-go" },
              { name: "Salon Gỗ", slug: "ban-ghe-salon-go" },
              { name: "Kệ Tivi", slug: "ke-tivi" },
              { name: "Tủ Bếp", slug: "tu-bep" },
              { name: "Tủ Rượu", slug: "tu-ruou" },
              { name: "Tủ Giày", slug: "tu-giay-dep" },
              { name: "Bàn Ăn", slug: "bo-ban-an" },
              { name: "Bàn Thờ", slug: "ban-tho" },
            ].map((cat) => (
              <Link
                key={cat.slug}
                to={`/danh-muc/${cat.slug}`}
                className="mobile-cat-chip"
              >
                {cat.name}
              </Link>
            ))}
          </div>
          </div>
        </header>

        {/* MOBILE MEGA MENU FULLSCREEN */}
        {mobileCatGridOpen && (
          <div className="mega-menu-overlay" onClick={() => { setMobileCatGridOpen(false); setMegaActiveParent(null); }}>
            <div className="mega-menu-panel" onClick={(e) => e.stopPropagation()}>
              <div className="mega-menu-header">
                <button className="mega-close-btn" onClick={() => { setMobileCatGridOpen(false); setMegaActiveParent(null); }}>
                  ✕ Đóng
                </button>
                <span className="mega-menu-title">Nhấn vào đây để xem tất cả danh mục</span>
              </div>

              <div className="mega-menu-body">
                <div className="mega-left">
                  {categories.map((cat) => (
                    <div
                      key={cat._id}
                      className={`mega-left-item ${megaActiveParent?._id === cat._id ? "active" : ""}`}
                      onClick={() => setMegaActiveParent(cat)}
                    >
                      {cat.name}
                    </div>
                  ))}
                </div>

                <div className="mega-right">
                  {megaActiveParent ? (
                    <>
                      {megaActiveParent.children && megaActiveParent.children.length > 0 ? (
                        megaActiveParent.children.map((child) => (
                          <div key={child._id} className="mega-right-group">
                            <div className="mega-right-parent">
                              <Link
                                to={`/danh-muc/${child.slug}`}
                                className="mega-right-parent-link"
                                onClick={() => setMobileCatGridOpen(false)}
                              >
                                {child.name.toUpperCase()}
                              </Link>
                              <Link
                                to={`/danh-muc/${child.slug}`}
                                className="mega-right-see-all"
                                onClick={() => setMobileCatGridOpen(false)}
                              >
                                Xem tất cả &gt;
                              </Link>
                            </div>
                            {child.children && child.children.length > 0 && (
                              <div className="mega-right-children">
                                {child.children.map((grand) => (
                                  <Link
                                    key={grand._id}
                                    to={`/danh-muc/${grand.slug}`}
                                    className="mega-right-child-link"
                                    onClick={() => setMobileCatGridOpen(false)}
                                  >
                                    {grand.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="mega-right-empty">
                          <Link
                            to={`/danh-muc/${megaActiveParent.slug}`}
                            className="mega-right-parent-link"
                            onClick={() => setMobileCatGridOpen(false)}
                          >
                            {megaActiveParent.name.toUpperCase()}
                          </Link>
                          <Link
                            to={`/danh-muc/${megaActiveParent.slug}`}
                            className="mega-right-see-all"
                            onClick={() => setMobileCatGridOpen(false)}
                          >
                            Xem tất cả &gt;
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mega-right-hint">
                      ← Chọn danh mục bên trái để xem sản phẩm
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {mobileMenuOpen && (
          <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <img src={logoImage} alt="Logo" className="drawer-logo" />
                <button className="drawer-close-btn" onClick={() => setMobileMenuOpen(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="drawer-user">
                {user ? (
                  <Link
                    to="/cap-nhat-thong-tin"
                    className="drawer-user-logged"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="drawer-user-avatar">
                      {getLastName(user.name)[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="drawer-user-info">
                      <div className="drawer-user-name">{user.name}</div>
                      <div className="drawer-user-phone">{user.phone || user.email}</div>
                    </div>
                    <FaEdit className="drawer-user-edit-icon" />
                  </Link>
                ) : (
                  <Link to="/tai-khoan-ca-nhan" className="drawer-login-btn" onClick={() => setMobileMenuOpen(false)}>
                    <FaUser />
                    <span>Đăng nhập / Đăng ký</span>
                  </Link>
                )}
              </div>

              <div className="drawer-divider" />

              <div className="drawer-nav-links">
                <Link to="/theo-doi-don-hang" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                  <FaBoxOpen className="drawer-nav-icon" /> Theo dõi đơn hàng
                </Link>
                <Link to="/posts" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                  <FaNewspaper className="drawer-nav-icon" /> Tin tức
                </Link>
                <Link to="/gioi-thieu" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                  <FaInfoCircle className="drawer-nav-icon" /> Giới thiệu
                </Link>
                <Link to="/mau-mau" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                  <FaPalette className="drawer-nav-icon" /> Màu sắc
                </Link>
                <Link to="/doi-tac" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                  <FaHandshake className="drawer-nav-icon" /> Đối tác
                </Link>
              </div>

              <div className="drawer-divider" />

              <div className="drawer-section-title">Danh mục sản phẩm</div>
              <div className="drawer-categories">
                {categories.map((cat) => (
                  <div key={cat._id} className="drawer-cat-item">
                    <div
                      className="drawer-cat-header"
                      onClick={() => {
                        if (cat.children && cat.children.length > 0) {
                          toggleMobileCategory(cat._id);
                        } else {
                          navigate(`/danh-muc/${cat.slug}`);
                          setMobileMenuOpen(false);
                        }
                      }}
                    >
                      <Link
                        to={`/danh-muc/${cat.slug}`}
                        className="drawer-cat-name"
                        onClick={(e) => {
                          if (cat.children && cat.children.length > 0) e.preventDefault();
                          else setMobileMenuOpen(false);
                        }}
                      >
                        {cat.name}
                      </Link>
                      {cat.children && cat.children.length > 0 && (
                        <span className="drawer-cat-arrow">
                          {expandedMobileCategory === cat._id ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                      )}
                    </div>

                    {expandedMobileCategory === cat._id && cat.children && (
                      <div className="drawer-sub-cats">
                        {cat.children.map((child) => (
                          <div key={child._id} className="drawer-sub-item">
                            <div
                              className="drawer-sub-header"
                              onClick={() => {
                                if (child.children && child.children.length > 0) {
                                  toggleMobileSubCategory(child._id);
                                } else {
                                  navigate(`/danh-muc/${child.slug}`);
                                  setMobileMenuOpen(false);
                                }
                              }}
                            >
                              <Link
                                to={`/danh-muc/${child.slug}`}
                                className="drawer-sub-name"
                                onClick={(e) => {
                                  if (child.children && child.children.length > 0) e.preventDefault();
                                  else setMobileMenuOpen(false);
                                }}
                              >
                                {child.name}
                              </Link>
                              {child.children && child.children.length > 0 && (
                                <span className="drawer-cat-arrow small">
                                  {expandedMobileSubCategory === child._id ? <FaChevronUp /> : <FaChevronRight />}
                                </span>
                              )}
                            </div>

                            {expandedMobileSubCategory === child._id && child.children && (
                              <div className="drawer-grand-cats">
                                {child.children.map((grand) => (
                                  <Link
                                    key={grand._id}
                                    to={`/danh-muc/${grand.slug}`}
                                    className="drawer-grand-item"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    {grand.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="drawer-divider" />

              <div className="drawer-hotline">
                <FaPhone className="hotline-icon" />
                <a href="tel:0965708839">0965 708 839</a>
              </div>

              {user && (
                <button className="drawer-logout-btn" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                  <FaSignOutAlt /> Đăng xuất
                </button>
              )}
            </div>
          </div>
        )}

        {/* MOBILE BOTTOM NAV BAR */}
        <nav className="mobile-bottom-nav">
          <button className="bottom-nav-item" onClick={() => navigate("/thanh-toan")}>
            <span className="bottom-nav-icon-wrap">
              <FaShoppingCart />
              {totalQuantity > 0 && <span className="bottom-badge">{totalQuantity}</span>}
            </span>
            <span className="bottom-nav-label">Giỏ hàng</span>
          </button>
          <a className="bottom-nav-item" href="https://maps.app.goo.gl/sFewZmWxpSrRRNsw5" target="_blank" rel="noreferrer">
            <span className="bottom-nav-icon-wrap"><FaMapMarkerAlt /></span>
            <span className="bottom-nav-label">Cửa hàng</span>
          </a>
          <a href="tel:0965708839" className="bottom-nav-item bottom-call-btn">
            <div className="call-circle">
              <FaPhone />
            </div>
            <span className="bottom-nav-label">Gọi điện</span>
          </a>
          <a href="https://m.me/noithatredepla" className="bottom-nav-item" target="_blank" rel="noreferrer">
            <span className="bottom-nav-icon-wrap"><FaFacebookMessenger /></span>
            <span className="bottom-nav-label">Messenger</span>
          </a>
          <a href="https://zalo.me/noithatdaidungphat" className="bottom-nav-item" target="_blank" rel="noreferrer">
            <span className="bottom-nav-icon-wrap zalo-icon"><SiZalo /></span>
            <span className="bottom-nav-label">Chat Zalo</span>
          </a>
        </nav>
      </>
    );
  }

  // ======================== DESKTOP HEADER ========================
  return (
    <header className={`ddp-header ${isAtTop ? "at-top" : "scrolled"}`}>
      <div className="topbar">
        {t('header.topbar')}
      </div>

      <div className="header-main container">
        <div className="logo">
          <Link to="/">
            <img src={logoImage} alt="Nội Thất Đại Dũng Phát" />
          </Link>
        </div>

        <div className="search-box">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder={t('header.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
              autoComplete="off"
            />
            <button type="submit">
              <FaSearch className="search-icon" />
            </button>

            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions" ref={suggestionsRef}>
                {suggestions.map((product) => (
                  <Link
                    key={product._id}
                    to={`/san-pham/${product.slug}`}
                    className="suggestion-item"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                  >
                    <img
                      src={getFirstImageUrl(product.images)}
                      alt={product.name}
                      className="suggestion-img"
                      onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/150?text=Error"; }}
                    />
                    <div className="suggestion-info">
                      <div className="suggestion-name">{product.name}</div>
                      <div className="suggestion-sku">{t('header.productCode')}: {product.sku}</div>
                      <div className="suggestion-price-info">
                        <span className="price-sale">
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.priceSale)}
                        </span>
                        {product.priceOriginal > product.priceSale && (
                          <div className="price-original-wrapper">
                            <span className="price-original">
                              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.priceOriginal)}
                            </span>
                            <span className="discount-percent">
                              -{Math.round(((product.priceOriginal - product.priceSale) / product.priceOriginal) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                <div className="suggestion-footer">
                  {t('header.pressEnter')} "<strong>{searchQuery}</strong>"
                </div>
              </div>
            )}

            {showSuggestions && loadingSuggestions && (
              <div className="search-suggestions loading" ref={suggestionsRef}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="suggestion-item skeleton">
                    <div className="suggestion-img skeleton-img"></div>
                    <div className="suggestion-info">
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line short"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        <div className="actions">
          <div
            className="user-box"
            ref={userBoxRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {user ? (
              <div className="user-logged-in">
                <span className="user-icon">👤</span>
                <span className="user-name">{getLastName(user.name)}</span>
                <span className="arrow-down">▼</span>
                <div className="user-dropdown" ref={dropdownRef}>
                  <div className="dropdown-item phone">
                    <span>{user?.phone || t('header.noPhone')}</span>
                  </div>
                  <div className="dropdown-item email">
                    <span>{user?.email}</span>
                  </div>
                  <hr />
                  <Link to="/cap-nhat-thong-tin" className="dropdown-item edit-profile" onClick={(e) => e.stopPropagation()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7z" />
                      <path d="M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>{t('header.editProfile')}</span>
                  </Link>
                  <div className="dropdown-item logout" onClick={handleLogout}>
                    <span>{t('header.logout')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/tai-khoan-ca-nhan" className="user-link">
                <span className="user-icon">👤</span>
                <span className="user-box-text">{t('header.loginRegister')}</span>
              </Link>
            )}
          </div>

          <div
            className="cart-box"
            onClick={() => navigate("/thanh-toan")}
            role="button"
            aria-label={t('header.cart')}
          >
            <div className="cart-icon">🛒</div>
            <span className="badge">{totalQuantity || 0}</span>
          </div>

          <div className="hotline">
            <span className="phone-icon">📞</span>
            <span className="phone-number">0965 708 839</span>
          </div>
        </div>
      </div>

      <nav className={`nav-menu ${!isAtTop ? "fixed-when-scrolled" : ""}`}>
        <div className="container nav-container">
          <div className="tree-menu-wrapper">
            <div className="category-trigger">
              <span className="menu-icon">☰</span>
              {t('header.categoryMenu')}
            </div>
            <div className={`tree-dropdown ${isHomePage && isAtTop ? "show-at-top" : ""}`}>
              <div className="tree-level">
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((cat) => (
                    <div
                      key={cat._id}
                      className={`tree-item ${hoveredParent === cat._id ? "active" : ""}`}
                      onMouseEnter={() => setHoveredParent(cat._id)}
                      onMouseLeave={() => setHoveredParent(null)}
                    >
                      <Link to={`/danh-muc/${cat.slug}`} className="tree-link">
                        <span>{cat.name}</span>
                        {cat.children && cat.children.length > 0 && (
                          <span className="tree-arrow">›</span>
                        )}
                      </Link>

                      {hoveredParent === cat._id && cat.children && cat.children.length > 0 && (
                        <div className="mega-submenu">
                          <div className="mega-submenu-inner">
                            {cat.children.map((child) => (
                              <div key={child._id} className="submenu-item">
                                <Link to={`/danh-muc/${child.slug}`} className="submenu-title">
                                  {child.name}
                                  {child.children && child.children.length > 0 && (
                                    <span className="submenu-arrow">›</span>
                                  )}
                                </Link>

                                {child.children && child.children.length > 0 && (
                                  <div className="submenu-dropdown">
                                    {child.children.map((grandchild) => (
                                      <div key={grandchild._id} className="submenu-item">
                                        <Link to={`/danh-muc/${grandchild.slug}`} className="submenu-title">
                                          {grandchild.name}
                                          {grandchild.children && grandchild.children.length > 0 && (
                                            <span className="submenu-arrow">›</span>
                                          )}
                                        </Link>
                                        {grandchild.children && grandchild.children.length > 0 && (
                                          <div className="submenu-dropdown">
                                            {grandchild.children.map((great) => (
                                              <Link key={great._id} to={`/danh-muc/${great.slug}`} className="submenu-leaf">
                                                {great.name}
                                              </Link>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-categories">{t('header.noCategories')}</div>
                )}
              </div>
            </div>
          </div>

          <div className="main-menu-items">
            <Link to="/theo-doi-don-hang" className="menu-item">{t('header.trackOrder')}</Link>
            <Link to="/posts" className="menu-item">{t('header.news')}</Link>
            <Link to="/gioi-thieu" className="menu-item">{t('header.about')}</Link>
            <Link to="/mau-mau" className="menu-item">{t('header.color')}</Link>
            <Link to="/doi-tac" className="menu-item">{t('header.partners')}</Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;