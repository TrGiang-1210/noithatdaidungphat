// src/layouts/AdminLayout.tsx
import { Outlet, Link, useLocation } from "react-router-dom";
import "@/styles/pages/admin/admin.layout.scss";
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ShoppingCart,
  LogOut 
} from "lucide-react"; // cài: npm install lucide-react

export default function AdminLayout() {
  const location = useLocation();
  const isActive = (paths: string | string[]) => {
    if (typeof paths === 'string') {
      return location.pathname === paths;
    }
    return paths.some(path => location.pathname.startsWith(path));
  };

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
            to="/admin/categories" 
            className={`menu-item ${location.pathname.startsWith('/admin/categories') ? 'active' : ''}`}
          >
            <Package className="icon" />
            <span>Quản lý danh mục</span>
          </Link>

          {/* Tất cả sản phẩm */}
          <Link 
            to="/admin/products" 
            className={`menu-item ${location.pathname.startsWith('/admin/products') ? 'active' : ''}`}
          >
            <Package className="icon" />
            <span>Tất cả sản phẩm</span>
          </Link>

          {/* Đơn hàng */}
          <Link 
            to="/admin/orders" 
            className={`menu-item ${location.pathname.startsWith('/admin/orders') ? 'active' : ''}`}
          >
            <ShoppingCart className="icon" />
            <span>Đơn hàng</span>
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
            {location.pathname.startsWith('/admin/gan-danh-muc') && "Gán danh mục hàng loạt"}
            {location.pathname.startsWith('/admin/categories') && "Quản lý danh mục"}
            {location.pathname.startsWith('/admin/products') && "Tất cả sản phẩm"}
            {location.pathname.startsWith('/admin/orders') && "Đơn hàng"}
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