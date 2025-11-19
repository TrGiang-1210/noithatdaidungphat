import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "@/styles/components/user/header.scss";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface CurrentUser {
  _id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
}

const Header: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/" || location.pathname === "/home";

  // Ref để hover dropdown
  const userBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch categories
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
  }, []);

  // Hover dropdown
  const handleMouseEnter = () => {
    if (user) {
      userBoxRef.current?.classList.add("show-dropdown");
    }
  };

  const handleMouseLeave = () => {
    userBoxRef.current?.classList.remove("show-dropdown");
  };

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    window.location.reload();
  };

  return (
    <header className={`ddp-header ${isAtTop ? "at-top" : "scrolled"}`}>
      <div className="topbar">
        Nội Thất Dại Dũng Phát, Uy Tín - Chất Lượng - Chính Hãng
      </div>

      <div className="header-main container">
        <div className="logo">
          <Link to="/">
            <img src="./src/assets/logo-ddp-removebg.png" alt="Nội Thất Dại Dũng Phát" />
          </Link>
        </div>

        <div className="search-box">
          <input type="text" placeholder="Tìm kiếm sản phẩm..." />
          <button>🔍</button>
        </div>

        <div className="actions">
          {/* ==================== USER BOX ==================== */}
          <div 
            className="user-box"
            ref={userBoxRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {user ? (
              // ĐÃ LOGIN → HOVER HIỆN DROPDOWN, KHÔNG NHẢY TRANG
              <div className="user-logged-in">
                <span className="user-icon">👤</span>
                <span className="user-name">{user.name.split(" ")[0]}</span>
                <span className="arrow-down">▼</span>

                {/* DROPDOWN */}
                <div className="user-dropdown">
                  <div className="dropdown-item">
                    <span className="icon">📱</span>
                    <span>{user.phone || "Chưa có SĐT"}</span>
                  </div>
                  <div className="dropdown-item">
                    <span className="icon">✉️</span>
                    <span>{user.email}</span>
                  </div>
                  <hr />
                  <Link 
                    to="/tai-khoan-ca-nhan" 
                    className="dropdown-item edit-profile"
                    onClick={(e) => e.stopPropagation()} // chặn hover khi click
                  >
                    <span>✏️ Edit Profile</span>
                  </Link>
                  <div 
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    <span>🚪</span> Đăng xuất
                  </div>
                </div>
              </div>
            ) : (
              // CHƯA LOGIN → CLICK NHẢY TRANG ĐĂNG NHẬP
              <Link to="/tai-khoan-ca-nhan" className="user-link">
                <span className="user-icon">👤</span>
                <span className="user-box-text">Đăng ký/Đăng nhập</span>
              </Link>
            )}
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

      {/* NAV MENU */}
      <nav className={`nav-menu ${!isAtTop ? "fixed-when-scrolled" : ""}`}>
        <div className="container nav-container">
          <div className={`category-main-item ${isAtTop && isHomePage ? "show-dropdown-at-top" : ""}`}>
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
                    <span className="cat-name">{cat.name}</span>
                    <span className="arrow">›</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="main-menu-items">
            <Link to="/gioi-thieu" className="menu-item">Giới thiệu</Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;