// src/admin/pages/Dashboard.tsx
import { Link } from "react-router-dom";
import "@/styles/pages/admin/dashboard.scss";

export default function Dashboard() {
  return (
    <div className="admin-content">
      <h1 className="page-title">Chào mừng quay lại, Admin!</h1>

      <div className="stats-grid">
        <div className="stat-card blue">
          <h3>Tổng sản phẩm</h3>
          <div className="value">1,256</div>
          <p className="text-sm text-gray-600">+128 so với tuần trước</p>
        </div>
        <div className="stat-card green">
          <h3>Đơn hàng hôm nay</h3>
          <div className="value">24</div>
          <p className="text-sm text-gray-600">Doanh thu: 87.500.000đ</p>
        </div>
        <div className="stat-card orange">
          <h3>Chưa gán danh mục</h3>
          <div className="value">48</div>
          <p className="text-sm text-gray-600">Cần xử lý ngay</p>
        </div>
        <div className="stat-card purple">
          <h3>Đang hot</h3>
          <div className="value">36</div>
          <p className="text-sm text-gray-600">Sản phẩm bán chạy</p>
        </div>
      </div>

      <div className="quick-action">
        <h3>Bạn muốn làm gì tiếp theo?</h3>
        <p className="opacity-90 mb-4">Gắn danh mục cho sản phẩm là việc quan trọng nhất lúc này!</p>
        <Link to="/admin/bulk-category">
          Gán danh mục hàng loạt ngay
        </Link>
      </div>
    </div>
  );
}