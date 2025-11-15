import React from "react";
import { Link } from "react-router-dom";
import "@/styles/components/user/header.scss";

const Header: React.FC = () => {
  return (
    <header className="ddp-header">
      {/* TOP BAR */}
      <div className="topbar">
        Nội Thất Dại Dũng Phát, Uy Tín - Chất Lượng - Chính Hãng
      </div>

      {/* HEADER MAIN */}
      <div className="header-main container">
        {/* Logo */}
        <div className="logo">
          <img src="./src/assets/logo-ddp-removebg.png" alt="DDP" />
        </div>

        {/* Search */}
        <div className="search-box">
          <input type="text" placeholder="Bạn cần tìm gì?" />
          <button>🔍</button>
        </div>

        {/* User */}
        <div className="user-box">
          <div className="user-icon">👤</div>
          <div className="user-text">Đăng ký / đăng nhập</div>
        </div>

        {/* Cart */}
        <div className="cart-box">
          <div className="cart-icon">🛒</div>
          <span className="badge">1</span>
        </div>

        {/* Hotline */}
        <div className="hotline">
          <span className="phone-icon">📱</span>
          <span className="phone-number">0941038839</span>
        </div>
      </div>

      {/* MENU DƯỚI */}
      <nav className="nav-yellow">
        <div className="container">
          <div className="menu-item">Danh mục sản phẩm</div>
          <div className="menu-item">Giường Ngủ</div>
          <div className="menu-item">Tủ Quần Áo</div>
          <div className="menu-item">Bộ Sofa Gỗ</div>
          <div className="menu-item">Bàn Trang Điểm</div>
          <div className="menu-item">Tủ Rượu</div>
          <div className="menu-item">Tủ Giày</div>
          <div className="menu-item">Kệ Tivi</div>
          <div className="menu-item">Nệm</div>
          <div className="menu-item">Bộ Bàn Ăn</div>
          <div className="menu-item">Phòng Thờ</div>
          <div className="menu-item">Tủ Bếp</div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
