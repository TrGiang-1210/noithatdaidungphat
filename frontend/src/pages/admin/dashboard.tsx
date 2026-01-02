// src/admin/pages/Dashboard.tsx - ✅ CLEANED (no inline styles)
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Package, 
  DollarSign,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  BarChart3
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import axiosInstance from "../../axios";
import "@/styles/pages/admin/dashboard.scss";

interface DashboardStats {
  totalProducts: number;
  newProductsThisWeek: number;
  ordersToday: number;
  revenueToday: number;
  uncategorized: number;
  hotProducts: number;
  pendingOrders: number;
  totalCategories: number;
  newMessages: number;
  totalConversations: number;
  totalPosts: number;
  postsToday: number;
  translationUI: {
    total: number;
    translated: number;
    pending: number;
  };
  translationDB: {
    products: { total: number; translated: number; percentage: number };
    categories: { total: number; translated: number; percentage: number };
    posts: { total: number; translated: number; percentage: number };
    postCategories: { total: number; translated: number; percentage: number };
  };
  revenueChart: {
    data: Array<{
      date: string;
      fullDate: string;
      revenue: number;
      orders: number;
      confirmedOrders: number;
    }>;
    total7Days: number;
    totalOrders7Days: number;
    average7Days: number;
    growth: number;
    topProducts: Array<{
      name: string;
      quantity: number;
      revenue: number;
      image: string;
    }>;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Bạn cần đăng nhập với tài khoản admin");
        setLoading(false);
        return;
      }
      
      const res = await axiosInstance.get("/admin/dashboard/stats");
      setStats(res.data);
    } catch (err: any) {
      console.error("Lỗi tải thống kê dashboard:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản admin.");
        setTimeout(() => {
          navigate('/tai-khoan-ca-nhan');
        }, 3000);
      } else if (err.response?.status === 404) {
        setError("API endpoint không tồn tại. Vui lòng kiểm tra backend.");
      } else {
        setError(err.response?.data?.message || "Không thể tải dữ liệu thống kê");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="admin-content dashboard-loading">
        <Loader2 size={48} className="spin" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-content dashboard-error">
        <AlertCircle size={48} />
        <p>{error}</p>
        <button onClick={fetchDashboardStats} className="btn-retry">
          Thử lại
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const incompleteDBTranslations = [
    stats.translationDB.products.percentage < 100 && {
      name: 'Products',
      percentage: stats.translationDB.products.percentage
    },
    stats.translationDB.categories.percentage < 100 && {
      name: 'Categories', 
      percentage: stats.translationDB.categories.percentage
    },
    stats.translationDB.posts.percentage < 100 && {
      name: 'Posts',
      percentage: stats.translationDB.posts.percentage
    },
    stats.translationDB.postCategories.percentage < 100 && {
      name: 'Post Cats',
      percentage: stats.translationDB.postCategories.percentage
    }
  ].filter(Boolean);

  const revenueChart = stats.revenueChart;
  const chartData = revenueChart?.data || [];
  const hasRevenueData = chartData.length > 0 && revenueChart.total7Days > 0;

  // Calculate translation UI percentage for progress bar
  const translationUIPercentage = ((stats.translationUI.translated / stats.translationUI.total) * 100) || 0;

  // Debug log for topProducts
  console.log('🔍 Revenue Chart Data:', {
    hasRevenueData,
    total7Days: revenueChart?.total7Days,
    topProducts: revenueChart?.topProducts,
    topProductsLength: revenueChart?.topProducts?.length
  });

  return (
    <div className="admin-content">
      <h1 className="page-title">Chào mừng quay lại, Admin!</h1>

      {/* Stats Grid */}
      <div className="stats-grid">
        <Link to="/admin/quan-ly-san-pham" className="stat-card blue">
          <h3>Tổng sản phẩm</h3>
          <div className="value">{(stats.totalProducts || 0).toLocaleString()}</div>
          <p className="stat-description stat-trend">
            {(stats.newProductsThisWeek || 0) > 0 ? (
              <>
                <TrendingUp size={14} />
                +{stats.newProductsThisWeek} so với tuần trước
              </>
            ) : (
              "Không có sản phẩm mới tuần này"
            )}
          </p>
        </Link>

        <Link to="/admin/quan-ly-don-hang" className="stat-card green">
          {(stats.pendingOrders || 0) > 0 && (
            <div className="notification-badge">!</div>
          )}
          <h3>Đơn hàng chưa xác nhận</h3>
          <div className="value">{stats.pendingOrders || 0}</div>
          <p className="stat-description">
            Tổng đơn hôm nay: <strong>{stats.ordersToday || 0}</strong>
          </p>
        </Link>

        <Link to="/admin/gan-danh-muc" className="stat-card orange">
          {(stats.uncategorized || 0) > 0 && (
            <div className="notification-badge">!</div>
          )}
          <h3>Chưa gắn danh mục</h3>
          <div className="value">{stats.uncategorized || 0}</div>
          <p className="stat-description">
            {(stats.uncategorized || 0) > 0 ? "Cần xử lý ngay" : "Tất cả đã có danh mục"}
          </p>
        </Link>

        <Link to="/admin/quan-ly-san-pham" className="stat-card purple">
          <h3>Đang hot</h3>
          <div className="value">{stats.hotProducts || 0}</div>
          <p className="stat-description">Sản phẩm bán chạy</p>
        </Link>

        <Link to="/admin/quan-ly-danh-muc" className="stat-card indigo">
          <h3>Tổng danh mục</h3>
          <div className="value">{stats.totalCategories || 0}</div>
          <p className="stat-description">Danh mục sản phẩm</p>
        </Link>

        <Link to="/admin/chat-khach-hang" className="stat-card pink">
          {(stats.newMessages || 0) > 0 && (
            <div className="notification-badge">!</div>
          )}
          <h3>Tin nhắn mới</h3>
          <div className="value">{stats.newMessages || 0}</div>
          <p className="stat-description">
            Tổng đoạn chat: <strong>{stats.totalConversations || 0}</strong>
          </p>
        </Link>

        <Link to="/admin/quan-ly-bai-viet" className="stat-card teal">
          <h3>Tổng bài viết</h3>
          <div className="value">{stats.totalPosts || 0}</div>
          <p className="stat-description">
            Bài viết hôm nay: <strong>{stats.postsToday || 0}</strong>
          </p>
        </Link>

        <div className="stat-card-split translation">
          <Link to="/admin/quan-ly-ngon-ngu-ui" className="split-left">
            <h3>Dịch UI</h3>
            <div className="value">{stats.translationUI.pending || 0}</div>
            <p className="stat-description">Keys chưa dịch</p>
            <div className="mini-progress">
              <div 
                className="mini-progress-bar"
                data-percentage={translationUIPercentage}
              />
            </div>
          </Link>

          <Link to="/admin/quan-ly-ngon-ngu-db" className="split-right">
            <h3>Dịch DB</h3>
            {incompleteDBTranslations.length > 0 ? (
              <div className="db-translation-items">
                {incompleteDBTranslations.map((item: any, idx) => (
                  <div key={idx} className="db-item">
                    <span className="db-name">{item.name}</span>
                    <span className="db-percentage">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="db-complete">
                <div className="value-small">✓</div>
                <p className="stat-description">Hoàn thành</p>
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <div className="revenue-section">
        <div className="revenue-header">
          <div className="revenue-title">
            <DollarSign size={28} className="icon-revenue" />
            <div>
              <h2>Doanh thu & Đơn hàng</h2>
              <p className="subtitle">7 ngày gần nhất</p>
            </div>
          </div>
          
          <div className="revenue-stats-row">
            <div className="revenue-stat-card">
              <div className="stat-icon blue">
                <DollarSign size={20} />
              </div>
              <div className="stat-content">
                <span className="label">Tổng doanh thu</span>
                <span className="value">{(revenueChart.total7Days || 0).toLocaleString()} ₫</span>
              </div>
            </div>
            
            <div className="revenue-stat-card">
              <div className="stat-icon green">
                <Package size={20} />
              </div>
              <div className="stat-content">
                <span className="label">Đơn hàng</span>
                <span className="value">{revenueChart.totalOrders7Days || 0}</span>
              </div>
            </div>
            
            <div className="revenue-stat-card">
              <div className="stat-icon purple">
                <BarChart3 size={20} />
              </div>
              <div className="stat-content">
                <span className="label">Trung bình/ngày</span>
                <span className="value">{(revenueChart.average7Days || 0).toLocaleString()} ₫</span>
              </div>
            </div>
            
            <div className={`revenue-stat-card ${(revenueChart.growth || 0) >= 0 ? 'growth-positive' : 'growth-negative'}`}>
              <div className={`stat-icon ${(revenueChart.growth || 0) >= 0 ? 'success' : 'danger'}`}>
                {(revenueChart.growth || 0) >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
              <div className="stat-content">
                <span className="label">Tăng trưởng</span>
                <span className="value growth">
                  {(revenueChart.growth || 0) >= 0 ? '+' : ''}{revenueChart.growth || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {hasRevenueData ? (
          <>
            <div className="charts-container">
              {/* Revenue Bar Chart */}
              <div className="chart-box">
                <h3 className="chart-title">
                  <DollarSign size={18} />
                  Biểu đồ doanh thu (₫)
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                        return value;
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: any) => [`${value.toLocaleString()} ₫`, 'Doanh thu']}
                      labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="url(#revenueGradient)" 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={60}
                    />
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Orders Line Chart */}
              <div className="chart-box">
                <h3 className="chart-title">
                  <Package size={18} />
                  Số lượng đơn hàng
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                      name="Tổng đơn"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confirmedOrders" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                      name="Đã xác nhận"
                      strokeDasharray="5 5"
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            {revenueChart?.topProducts && revenueChart.topProducts.length > 0 && (
              <div className="top-products-section">
                <h3 className="section-title">
                  <Package size={22} />
                  <span>Top 5 sản phẩm bán chạy</span>
                  <span className="subtitle-small">(7 ngày qua)</span>
                </h3>
                <div className="products-grid">
                  {revenueChart.topProducts.map((product, idx) => (
                    <div key={idx} className="product-card">
                      <div className={`rank-badge rank-${idx + 1}`}>{idx + 1}</div>
                      <div className="product-image">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="no-image"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>';
                              }
                            }}
                          />
                        ) : (
                          <div className="no-image">
                            <Package size={32} />
                          </div>
                        )}
                      </div>
                      <div className="product-details">
                        <div className="product-name" title={product.name}>{product.name}</div>
                        <div className="product-metrics">
                          <div className="metric">
                            <span className="metric-label">Đã bán:</span>
                            <span className="metric-value quantity">{product.quantity}</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Doanh thu:</span>
                            <span className="metric-value revenue">{product.revenue.toLocaleString()} ₫</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Debug: Show if topProducts is empty or undefined */}
            {hasRevenueData && (!revenueChart?.topProducts || revenueChart.topProducts.length === 0) && (
              <div className="top-products-section">
                <h3 className="section-title">
                  <Package size={22} />
                  <span>Top 5 sản phẩm bán chạy</span>
                  <span className="subtitle-small">(7 ngày qua)</span>
                </h3>
                <div className="no-products-data">
                  <Package size={48} />
                  <p>Chưa có dữ liệu sản phẩm bán chạy</p>
                  <small>Backend chưa trả về topProducts hoặc mảng rỗng</small>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-revenue-data">
            <BarChart3 size={64} />
            <h3>Chưa có dữ liệu doanh thu</h3>
            <p>Dữ liệu doanh thu sẽ được hiển thị khi có đơn hàng được xác nhận</p>
          </div>
        )}
      </div>
    </div>
  );
}