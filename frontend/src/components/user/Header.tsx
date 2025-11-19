import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "@/styles/components/user/header.scss";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const Header: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/categories");
        const data = await response.json();
        setCategories(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoading(false);
      }
    };
    fetchCategories();

    // THÊM ĐOẠN NÀY: detect scroll
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Nếu cuộn xuống quá 50px thì ẩn dropdown (có thể chỉnh thành 10px, 100px tùy ý)
      setIsAtTop(scrollPosition < 80);
    };

    // Kiểm tra ngay lúc load (tránh flash)
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="ddp-header">
      <div className="topbar">
        Nội Thất Dại Dũng Phát, Uy Tín - Chất Lượng - Chính Hãng
      </div>
      <div className="header-main container">
        <div className="logo">
          {/* Bấm logo sẽ về trang chủ */}
          <Link to="/">
            <img
              src="./src/assets/logo-ddp-removebg.png"
              alt="Nội Thất Dại Dũng Phát - Trang chủ"
            />
          </Link>
        </div>
        <div className="search-box">
          <input type="text" placeholder="Tìm kiếm sản phẩm..." />
          <button>🔍</button>
        </div>
        <div className="actions">
          <div className="user-box">
            <span className="user-icon" aria-hidden>
              👤
            </span>
            <span className="user-box-text">Đăng ký/Đăng nhập</span>
          </div>
          <div className="cart-box">
            <div className="cart-icon">🛒</div>
            <span className="badge">1</span>
          </div>
          <div className="hotline">
            <span className="phone-icon">📞</span>
            <span className="phone-number">0941038839</span>
          </div>
        </div>
      </div>
      <nav className="nav-menu">
        <div className="container">
          {/* DANH MỤC SẢN PHẨM - CÓ DROPDOWN */}
          <div 
  className={`category-main-item ${isAtTop ? "show-dropdown-at-top" : ""}`}
>
            <div className="category-trigger">
              <span className="menu-icon">☰</span>
              DANH MỤC SẢN PHẨM
            </div>

            <div className="category-dropdown">
              {loading ? (
                <div className="loading">Đang tải...</div>
              ) : (
                categories.map((cat) => (
                  <Link key={cat._id} to={`/${cat.slug}`} className="cat-item">
                    {/* bạn thay link logo nhỏ */}
                    <span className="cat-name">{cat.name}</span>
                    <span className="arrow">›</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Các menu khác nếu có (giữ nguyên hoặc thêm sau) */}
          {/* Ví dụ: <Link to="/khuyen-mai" className="menu-item">KHUYẾN MÃI</Link> */}
        </div>
      </nav>
    </header>
  );
};

export default Header;
