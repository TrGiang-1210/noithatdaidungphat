import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { totalQuantity, openCart } = useCart();

  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/" || location.pathname === "/home";

  const userBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch categories + scroll handler
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

  // Cập nhật vị trí dropdown khi scroll/resize (giữ vị trí chính xác)
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

  // Hover handlers
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
      alert("Vui lòng nhập từ khóa tìm kiếm!");
      return;
    }
    // Chuyển đến trang search với query
    navigate(`/tim-kiem?query=${encodeURIComponent(query)}`);
    setSearchQuery(""); // xóa ô input sau khi search
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    window.location.reload();
  };

  // LẤY TÊN CUỐI (ví dụ: "Lưu Nguyễn Trường Giang" → "Giang")
  const getLastName = (fullName: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(" ");
    return parts[parts.length - 1];
  };

  return (
    <header className={`ddp-header ${isAtTop ? "at-top" : "scrolled"}`}>
      <div className="topbar">
        Nội Thất Đại Dũng Phát, Uy Tín - Chất Lượng - Chính Hãng
      </div>

      <div className="header-main container">
        <div className="logo">
          <Link to="/">
            <img
              src="./src/assets/logo-ddp-removebg.png"
              alt="Nội Thất Đại Dũng Phát"
            />
          </Link>
        </div>

        <div className="search-box">
          <form
            onSubmit={handleSearch}
            style={{ display: "flex", flex: 1, maxWidth: "500px" }}
          >
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch(e)} // hỗ trợ Enter
            />
            <button type="submit">🔍</button>
          </form>
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
              <div className="user-logged-in">
                <span className="user-icon">👤</span>
                {/* HIỂN THỊ TÊN CUỐI */}
                <span className="user-name">{getLastName(user.name)}</span>
                <span className="arrow-down">▼</span>

                {/* DROPDOWN */}
                <div className="user-dropdown" ref={dropdownRef}>
                  <div className="dropdown-item phone">
                    <span>{user.phone || "Chưa có SĐT"}</span>
                  </div>
                  <div className="dropdown-item email">
                    <span>{user.email}</span>
                  </div>
                  <hr />

                  <Link
                    to="/cap-nhat-thong-tin"
                    className="dropdown-item edit-profile"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-20h-7z" />
                      <path d="M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Chỉnh sửa</span>
                  </Link>

                  <div className="dropdown-item logout" onClick={handleLogout}>
                    <span>Đăng xuất</span>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/tai-khoan-ca-nhan" className="user-link">
                <span className="user-icon">👤</span>
                <span className="user-box-text">Đăng ký/Đăng nhập</span>
              </Link>
            )}
          </div>

          <div className="cart-box" onClick={() => navigate("/paycart")}>
            <div className="cart-icon">🛒</div>
            {totalQuantity > 0 && (
              <span className="badge">
                {totalQuantity > 99 ? "99+" : totalQuantity}
              </span>
            )}
            {/* <div className="cart-tooltip">Xem giỏ hàng & Thanh toán</div> */}
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
          <div
            className={`category-main-item ${
              isAtTop && isHomePage ? "show-dropdown-at-top" : ""
            }`}
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
                    <span className="cat-name">{cat.name}</span>
                    <span className="arrow">›</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="main-menu-items">
            <Link to="/gioi-thieu" className="menu-item">
              Giới thiệu
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
