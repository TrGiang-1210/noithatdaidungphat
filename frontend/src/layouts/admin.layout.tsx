// src/layouts/AdminLayout.tsx
import { Outlet, Link, useLocation } from "react-router-dom";
import "@/styles/layouts/admin.layout.scss";
import { 
  LayoutDashboard, 
  MessageSquareMore,
  Package, 
  Tags, 
  Newspaper,
  ShoppingCart,
  LogOut
} from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="admin-wrapper">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>NỘI THẤT ĐẠI DŨNG PHÁT</h2>
          <p>Admin Panel</p>
        </div>

        <nav className="sidebar-menu">
          {/* Dashboard */}
          <Link 
            to="/admin" 
            className={`menu-item ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            <LayoutDashboard className="icon" />
            <span>Dashboard</span>
          </Link>

          {/* Chat khách hàng */}
          <Link 
            to="/admin/chat-khach-hang" 
            className={`menu-item ${location.pathname.startsWith('/admin/chat-khach-hang') ? 'active' : ''}`}
          >
            <MessageSquareMore className="icon" />
            <span>Nhắn tin khách hàng</span>
          </Link>

          {/* Gán danh mục */}
          <Link 
            to="/admin/gan-danh-muc" 
            className={`menu-item ${location.pathname.startsWith('/admin/gan-danh-muc') ? 'active' : ''}`}
          >
            <Tags className="icon" />
            <span>Gán danh mục hàng loạt</span>
          </Link>

          {/* Quản lý danh mục */}
          <Link 
            to="/admin/quan-ly-danh-muc" 
            className={`menu-item ${location.pathname.startsWith('/admin/quan-ly-danh-muc') ? 'active' : ''}`}
          >
            <Package className="icon" />
            <span>Tất cả danh mục</span>
          </Link>

          {/* Tất cả sản phẩm */}
          <Link 
            to="/admin/quan-ly-san-pham" 
            className={`menu-item ${location.pathname.startsWith('/admin/quan-ly-san-pham') ? 'active' : ''}`}
          >
            <Package className="icon" />
            <span>Tất cả sản phẩm</span>
          </Link>

          {/* Bài viết */}
          <Link 
            to="/admin/quan-ly-bai-viet" 
            className={`menu-item ${location.pathname.startsWith('/admin/quan-ly-bai-viet') ? 'active' : ''}`}
          >
            <Newspaper className="icon" />
            <span>Tất cả bài viết</span>
          </Link>

          {/* Đơn hàng */}
          <Link 
            to="/admin/quan-ly-don-hang"
            className={`menu-item ${location.pathname.startsWith('/admin/quan-ly-don-hang') ? 'active' : ''}`}
          >
            <ShoppingCart className="icon" />
            <span>Tất cả đơn hàng</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="back-to-site">
            <LogOut size={18} style={{ marginRight: '8px' }} />
            Về trang chủ
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <h1>
            {location.pathname === '/admin' && "Dashboard"}
            {location.pathname.startsWith('/admin/chat') && "Nhắn tin khách hàng"}
            {location.pathname.startsWith('/admin/gan-danh-muc') && "Gán danh mục hàng loạt"}
            {location.pathname.startsWith('/admin/quan-ly-danh-muc') && "Quản lý danh mục"}
            {location.pathname.startsWith('/admin/quan-ly-san-pham') && "Tất cả sản phẩm"}
            {location.pathname.startsWith('/admin/quan-ly-bai-viet') && "Quản lý bài viết"}
            {location.pathname.startsWith('/admin/quan-ly-don-hang') && "Quản lý đơn hàng"}
          </h1>
          <div className="user-info">Chào Admin</div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}