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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/categories');
        const data = await response.json();
        setCategories(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <header className="ddp-header">
      <div className="topbar">
        Nội Thất Dại Dũng Phát, Uy Tín - Chất Lượng - Chính Hãng
      </div>
      <div className="header-main container">
        <div className="logo">
          <img src="./src/assets/logo-ddp-removebg.png" alt="DDP" /> {/* Giả sử logo mới */}
        </div>
        <div className="search-box">
          <input type="text" placeholder="Tìm kiếm sản phẩm..." />
          <button>🔍</button>
        </div>
        <div className="actions">
          <div className="user-box">
            <span className="user-icon" aria-hidden>👤</span>
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
          {loading ? (
            <div>Đang tải...</div>
          ) : (
            <>
              {categories.map((cat) => (
                <Link key={cat._id} to={`/${cat.slug}`} className="menu-item">
                  {cat.name}
                </Link>
              ))}
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;