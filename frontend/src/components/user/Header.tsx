import React, { useState, useEffect, useRef, useContext } from "react";
import { FaSearch } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import "@/styles/components/user/header.scss";
import { AuthContext } from "@/context/AuthContext";
import { getImageUrl, getFirstImageUrl } from "@/utils/imageUrl";
import { triggerUserLogout } from "@/utils/authEvents"; // ← THÊM

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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hoveredParent, setHoveredParent] = useState<string | null>(null);
  const [hoveredChild, setHoveredChild] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/" || location.pathname === "/home";

  const userBoxRef = useRef<HTMLDivElement>(null);

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

  // Cập nhật vị trí dropdown khi scroll/resize
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

  // DEBOUNCE SEARCH
  useEffect(() => {
    if (searchQuery.trim().trim().length < 1) {
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
          `http://localhost:5000/api/products/search-suggestions?q=${encodeURIComponent(
            searchQuery
          )}`
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
  }, [searchQuery]);

  // ĐÓNG DROPDOWN KHI CLICK RA NGOÀI
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

    return () => {
      document.body.classList.remove("homepage");
    };
  }, [isHomePage]);

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
    navigate(`/tim-kiem?query=${encodeURIComponent(query)}`);
    setSearchQuery("");
  };

  // ✅ HANDLE LOGOUT - TÍCH HỢP CHAT + REFRESH
  const handleLogout = () => {
    console.log('🔔 User logging out...');
    
    try {
      // 1. Trigger chat logout event TRƯỚC
      triggerUserLogout();
      console.log('🔔 Chat: User logout event triggered');
      
      // 2. AuthContext logout (sẽ reset user state)
      logout();
      
      // 3. Refresh page để reset chat hoàn toàn
      setTimeout(() => {
        window.location.href = '/';
      }, 100); // Delay 100ms để các cleanup hoàn thành
    } catch (e) {
      console.error('Logout error:', e);
      // Nếu lỗi vẫn refresh
      window.location.href = '/';
    }
  };

  // Lấy tên cuối
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
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() =>
                searchQuery.trim().length >= 2 && setShowSuggestions(true)
              }
              autoComplete="off"
            />
            <button type="submit">
              <FaSearch className="search-icon" />
            </button>

            {/* DROPDOWN GỢI Ý */}
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
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/150?text=Error";
                      }}
                    />
                    <div className="suggestion-info">
                      <div className="suggestion-name">{product.name}</div>
                      <div className="suggestion-sku">Mã SP: {product.sku}</div>
                      <div className="suggestion-price-info">
                        <span className="price-sale">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(product.priceSale)}
                        </span>

                        {product.priceOriginal > product.priceSale && (
                          <div className="price-original-wrapper">
                            <span className="price-original">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(product.priceOriginal)}
                            </span>
                            <span className="discount-percent">
                              -
                              {Math.round(
                                ((product.priceOriginal - product.priceSale) /
                                  product.priceOriginal) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}

                <div className="suggestion-footer">
                  Nhấn Enter để tìm "<strong>{searchQuery}</strong>"
                </div>
              </div>
            )}

            {/* Loading skeleton */}
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
          {/* USER BOX */}
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

                {/* DROPDOWN */}
                <div className="user-dropdown" ref={dropdownRef}>
                  <div className="dropdown-item phone">
                    <span>{user?.phone || "Chưa có SĐT"}</span>
                  </div>
                  <div className="dropdown-item email">
                    <span>{user?.email}</span>
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

          <div
            className="cart-box"
            onClick={() => navigate("/thanh-toan")}
            role="button"
            aria-label="Giỏ hàng"
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

      {/* NAV MENU */}
      <nav className={`nav-menu ${!isAtTop ? "fixed-when-scrolled" : ""}`}>
        <div className="container nav-container">
          <div className="tree-menu-wrapper">
            <div className="category-trigger">
              <span className="menu-icon">☰</span>
              DANH MỤC SẢN PHẨM
            </div>
            <div
              className={`tree-dropdown ${
                isHomePage && isAtTop ? "show-at-top" : ""
              }`}
            >
              <div className="tree-level">
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((cat) => (
                    <div
                      key={cat._id}
                      className={`tree-item ${
                        hoveredParent === cat._id ? "active" : ""
                      }`}
                      onMouseEnter={() => setHoveredParent(cat._id)}
                      onMouseLeave={() => setHoveredParent(null)}
                    >
                      <Link to={`/danh-muc/${cat.slug}`} className="tree-link">
                        <span>{cat.name}</span>
                        {cat.children && cat.children.length > 0 && (
                          <span className="tree-arrow">›</span>
                        )}
                      </Link>

                      {/* MEGA MENU */}
                      {hoveredParent === cat._id &&
                        cat.children &&
                        cat.children.length > 0 && (
                          <div className="mega-submenu">
                            <div className="mega-submenu-inner">
                              {cat.children.map((child) => (
                                <div key={child._id} className="submenu-item">
                                  <Link
                                    to={`/danh-muc/${child.slug}`}
                                    className="submenu-title"
                                  >
                                    {child.name}
                                    {child.children &&
                                      child.children.length > 0 && (
                                        <span className="submenu-arrow">›</span>
                                      )}
                                  </Link>

                                  {child.children &&
                                    child.children.length > 0 && (
                                      <div className="submenu-dropdown">
                                        {child.children.map((grandchild) => (
                                          <div
                                            key={grandchild._id}
                                            className="submenu-item"
                                          >
                                            <Link
                                              to={`/danh-muc/${grandchild.slug}`}
                                              className="submenu-title"
                                            >
                                              {grandchild.name}
                                              {grandchild.children &&
                                                grandchild.children.length >
                                                  0 && (
                                                  <span className="submenu-arrow">
                                                    ›
                                                  </span>
                                                )}
                                            </Link>

                                            {grandchild.children &&
                                              grandchild.children.length >
                                                0 && (
                                                <div className="submenu-dropdown">
                                                  {grandchild.children.map(
                                                    (great) => (
                                                      <Link
                                                        key={great._id}
                                                        to={`/danh-muc/${great.slug}`}
                                                        className="submenu-leaf"
                                                      >
                                                        {great.name}
                                                      </Link>
                                                    )
                                                  )}
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
                  <div className="no-categories">Không có danh mục</div>
                )}
              </div>
            </div>
          </div>

          <div className="main-menu-items">
            <Link to="/theo-doi-don-hang" className="menu-item">
              Kiểm tra đơn hàng
            </Link>
            <Link to="/posts" className="menu-item">
              Tin tức
            </Link>
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