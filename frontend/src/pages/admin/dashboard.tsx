import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Package, 
  DollarSign,
  BarChart3,
  Calendar
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
  Legend,
  Area,
  ComposedChart
} from "recharts";
import axiosInstance from "../../axios";
import { getImageUrl } from "../../utils/imageUrl";
import "@/styles/pages/admin/dashboard.scss";

interface Product {
  name: string;
  quantity: number;
  revenue: number;
  image: string;
  slug: string;
}

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
    topProducts: Product[];
  };
}

type DateRange = '7days' | '30days' | '3months' | '6months' | '1year' | 'custom';

interface DateRangeOption {
  value: DateRange;
  label: string;
  days: number;
}

const dateRangeOptions: DateRangeOption[] = [
  { value: '7days', label: '7 ngày qua', days: 7 },
  { value: '30days', label: '30 ngày qua', days: 30 },
  { value: '3months', label: '3 tháng qua', days: 90 },
  { value: '6months', label: '6 tháng qua', days: 180 },
  { value: '1year', label: '1 năm qua', days: 365 },
  { value: 'custom', label: 'Tùy chỉnh', days: 0 }
];

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <div className="tooltip-content">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="tooltip-item" style={{ color: entry.color }}>
              <span className="tooltip-name">{entry.name}:</span>
              <span className="tooltip-value">
                {entry.name.includes('Doanh thu') 
                  ? `${entry.value.toLocaleString()} ₫`
                  : entry.value.toLocaleString()
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Dot Component
const CustomDot = (props: any) => {
  const { cx, cy, stroke, value } = props;
  
  if (value === 0) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#e2e8f0"
        stroke={stroke}
        strokeWidth={2}
      />
    );
  }
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={stroke}
      stroke="#fff"
      strokeWidth={2}
      className="pulse-dot"
    />
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardStats = async (range: DateRange = dateRange) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Bạn cần đăng nhập với tài khoản admin");
        setLoading(false);
        return;
      }
      
      // Build query params based on date range
      let params: any = {};
      
      if (range === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      } else {
        const option = dateRangeOptions.find(opt => opt.value === range);
        if (option) {
          params.days = option.days;
        }
      }
      
      const res = await axiosInstance.get("/admin/dashboard/stats", { params });
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
    const interval = setInterval(() => fetchDashboardStats(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dateRange, customStartDate, customEndDate]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    if (range === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      fetchDashboardStats(range);
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      fetchDashboardStats('custom');
      setShowCustomDatePicker(false);
    }
  };

  const getDateRangeLabel = () => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return `${new Date(customStartDate).toLocaleDateString('vi-VN')} - ${new Date(customEndDate).toLocaleDateString('vi-VN')}`;
    }
    return dateRangeOptions.find(opt => opt.value === dateRange)?.label || '7 ngày qua';
  };

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
        <button onClick={() => fetchDashboardStats()} className="btn-retry">
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
  const hasRevenueData = chartData.length > 0;
  
  const formattedChartData = chartData.map(item => ({
    ...item,
    displayDate: item.date,
    fullDate: item.fullDate,
    revenue: item.revenue || 0,
    orders: item.orders || 0,
    confirmedOrders: item.confirmedOrders || 0
  }));

  const translationUIPercentage = ((stats.translationUI.translated / stats.translationUI.total) * 100) || 0;

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
                style={{ width: `${translationUIPercentage}%` }}
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
          <div className="revenue-title-row">
            <div className="revenue-title">
              <DollarSign size={28} className="icon-revenue" />
              <div>
                <h2>Doanh thu & Đơn hàng</h2>
                <p className="subtitle">{getDateRangeLabel()}</p>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="date-range-filter">
              <div className="filter-buttons">
                {dateRangeOptions.map(option => (
                  <button
                    key={option.value}
                    className={`filter-btn ${dateRange === option.value ? 'active' : ''}`}
                    onClick={() => handleDateRangeChange(option.value)}
                  >
                    {option.value === 'custom' && <Calendar size={16} />}
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Picker */}
              {showCustomDatePicker && (
                <div className="custom-date-picker">
                  <div className="date-inputs">
                    <div className="input-group">
                      <label>Từ ngày:</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        max={customEndDate || undefined}
                      />
                    </div>
                    <div className="input-group">
                      <label>Đến ngày:</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        min={customStartDate || undefined}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div className="picker-actions">
                    <button 
                      className="btn-apply"
                      onClick={handleCustomDateApply}
                      disabled={!customStartDate || !customEndDate}
                    >
                      Áp dụng
                    </button>
                    <button 
                      className="btn-cancel"
                      onClick={() => {
                        setShowCustomDatePicker(false);
                        setDateRange('7days');
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
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
              {/* Combined Revenue Chart */}
              <div className="chart-box chart-featured">
                <h3 className="chart-title">
                  <DollarSign size={18} />
                  Biểu đồ doanh thu (₫)
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={formattedChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.9} />
                      </linearGradient>
                      <filter id="shadow" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                        <feOffset dx="0" dy="4" result="offsetblur"/>
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.2"/>
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                        return value;
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      fill="url(#revenueGradient)"
                      stroke="#3b82f6"
                      strokeWidth={0}
                      name="Doanh thu"
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="url(#barGradient)" 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={60}
                      minPointSize={5}
                      filter="url(#shadow)"
                      name="Doanh thu"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Orders Line Chart */}
              <div className="chart-box">
                <h3 className="chart-title">
                  <Package size={18} />
                  Số lượng đơn hàng
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={formattedChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <filter id="glow" height="300%" width="300%" x="-75%" y="-75%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={<CustomDot />}
                      activeDot={{ r: 8, filter: "url(#glow)" }}
                      name="Tổng đơn"
                      connectNulls
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confirmedOrders" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={<CustomDot />}
                      activeDot={{ r: 7 }}
                      name="Đã xác nhận"
                      strokeDasharray="5 5"
                      connectNulls
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
                  <span className="subtitle-small">({getDateRangeLabel()})</span>
                </h3>
                <div className="products-grid">
                  {revenueChart.topProducts.map((product, idx) => (
                    <Link 
                      key={idx} 
                      to={`/san-pham/${product.slug}`}
                      className="product-card"
                    >
                      <div className={`rank-badge rank-${idx + 1}`}>{idx + 1}</div>
                      <div className="product-image">
                        {product.image ? (
                          <img 
                            src={getImageUrl(product.image)} 
                            alt={product.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/150?text=No+Image';
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
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {hasRevenueData && (!revenueChart?.topProducts || revenueChart.topProducts.length === 0) && (
              <div className="top-products-section">
                <h3 className="section-title">
                  <Package size={22} />
                  <span>Top 5 sản phẩm bán chạy</span>
                  <span className="subtitle-small">({getDateRangeLabel()})</span>
                </h3>
                <div className="no-products-data">
                  <Package size={48} />
                  <p>Chưa có dữ liệu sản phẩm bán chạy</p>
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