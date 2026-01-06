// src/admin/pages/OrderManager.tsx - ✅ COMPLETE WITH ARCHIVE FEATURE
import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Loader2,
  AlertCircle,
  Phone,
  MapPin,
  User,
  Calendar,
  Search,
  Archive,
  ArchiveRestore,
  Download,
} from "lucide-react";
import axiosInstance from "../../axios";
import { getFirstImageUrl } from "@/utils/imageUrl";
import "@/styles/pages/admin/orderManager.scss";

interface OrderItem {
  product: {
    _id: string;
    name: string;
    images: string[];
    sku: string;
  };
  quantity: number;
  price: number;
  selectedAttributes?: Record<string, string>;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: "Pending" | "Confirmed" | "Shipping" | "Completed" | "Cancelled";
  paymentMethod: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  reservedUntil?: string;
  archived?: boolean;
  archivedAt?: string;
}

interface ArchiveStats {
  total: number;
  active: number;
  archived: number;
  archivable: number;
}

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ✅ NEW: Archive filters
  const [dateRange, setDateRange] = useState("30"); // Default 30 days
  const [showArchived, setShowArchived] = useState(false);
  const [archiveStats, setArchiveStats] = useState<ArchiveStats | null>(null);

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cod: "Thanh toán khi nhận hàng (COD)",
      bank: "Chuyển khoản ngân hàng",
      momo: "Ví điện tử MoMo",
      COD: "Thanh toán khi nhận hàng (COD)",
      Bank: "Chuyển khoản ngân hàng",
      Momo: "Ví điện tử MoMo",
    };
    return labels[method] || method;
  };

  // ✅ SAFE STRING EXTRACTION
  const getAttributeLabel = (
    attributeName: string,
    value: string | any,
    product: any
  ): string => {
    let valueStr: string;
    
    if (typeof value === 'string') {
      valueStr = value;
    } else if (typeof value === 'object' && value !== null) {
      valueStr = value.vi || value.zh || String(value);
    } else {
      valueStr = String(value || '');
    }

    if (!product || !product.attributes) {
      return valueStr;
    }

    const attribute = product.attributes.find((attr: any) => {
      if (!attr || !attr.name) return false;
      const attrName = typeof attr.name === "object" ? attr.name.vi : attr.name;
      return attrName === attributeName;
    });

    if (!attribute || !attribute.options) {
      return valueStr;
    }

    const option = attribute.options.find((opt: any) => opt && opt.value === valueStr);
    
    if (!option || !option.label) {
      return valueStr;
    }

    let label = option.label;
    if (typeof label === "object" && label !== null) {
      label = label.vi || label.zh || valueStr;
    }
    
    return String(label || valueStr);
  };

  // ✅ FETCH ORDERS WITH FILTERS
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        days: dateRange,
        archived: showArchived.toString(),
      });

      const res = await axiosInstance.get(`/admin/orders?${params}`);

      const validOrders = (res.data || [])
        .filter((order: any) => {
          if (!order) return false;
          if (!order.items || !Array.isArray(order.items)) return false;
          return true;
        })
        .map((order: any) => ({
          ...order,
          items: (order.items || [])
            .filter((item: any) => item && item.product)
            .map((item: any) => ({
              ...item,
              product: item.product || {
                _id: "unknown",
                name: "Sản phẩm đã xóa",
                images: [],
                sku: "N/A",
              },
              selectedAttributes: item.selectedAttributes || {},
            })),
        }));

      setOrders(validOrders);
    } catch (err) {
      alert("Lỗi tải đơn hàng");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH ARCHIVE STATS
  const fetchArchiveStats = async () => {
    try {
      const res = await axiosInstance.get("/admin/orders/stats/archive");
      setArchiveStats(res.data);
    } catch (err) {
      console.error("Error fetching archive stats:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchArchiveStats();
    const interval = setInterval(() => {
      fetchOrders();
      fetchArchiveStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [dateRange, showArchived]);

  const getStatusInfo = (status: Order["status"]) => {
    const statusMap = {
      Pending: {
        label: "Chờ xác nhận",
        color: "#f59e0b",
        icon: Clock,
        bgColor: "#fef3c7",
      },
      Confirmed: {
        label: "Đã xác nhận",
        color: "#3b82f6",
        icon: CheckCircle,
        bgColor: "#dbeafe",
      },
      Shipping: {
        label: "Đang giao",
        color: "#8b5cf6",
        icon: Truck,
        bgColor: "#ede9fe",
      },
      Completed: {
        label: "Hoàn thành",
        color: "#10b981",
        icon: CheckCircle,
        bgColor: "#d1fae5",
      },
      Cancelled: {
        label: "Đã hủy",
        color: "#ef4444",
        icon: XCircle,
        bgColor: "#fee2e2",
      },
    };

    return (
      statusMap[status] || {
        label: "Không xác định",
        color: "#6b7280",
        icon: AlertCircle,
        bgColor: "#f3f4f6",
      }
    );
  };

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    if (!confirm(`Xác nhận chuyển trạng thái sang "${getStatusInfo(newStatus).label}"?`)) {
      return;
    }

    try {
      setProcessingOrderId(orderId);
      await axiosInstance.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
      alert("Cập nhật trạng thái thành công!");

      if (selectedOrder?._id === orderId) {
        const updated = orders.find((o) => o._id === orderId);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi cập nhật trạng thái");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Xác nhận HỦY đơn hàng này? Tồn kho sẽ được hoàn lại.")) {
      return;
    }

    try {
      setProcessingOrderId(orderId);
      await axiosInstance.patch(`/admin/orders/${orderId}/cancel`);
      await fetchOrders();
      alert("Đã hủy đơn hàng và hoàn tồn kho!");

      if (selectedOrder?._id === orderId) {
        setShowDetailModal(false);
        setSelectedOrder(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi hủy đơn hàng");
    } finally {
      setProcessingOrderId(null);
    }
  };

  // ✅ NEW: ARCHIVE ORDER
  const handleArchiveOrder = async (orderId: string) => {
    if (!confirm("Xác nhận lưu trữ đơn hàng này? Đơn sẽ được chuyển vào kho lưu trữ.")) {
      return;
    }

    try {
      setProcessingOrderId(orderId);
      await axiosInstance.patch(`/admin/orders/${orderId}/archive`);
      await fetchOrders();
      await fetchArchiveStats();
      alert("Đã lưu trữ đơn hàng thành công!");

      if (selectedOrder?._id === orderId) {
        setShowDetailModal(false);
        setSelectedOrder(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi lưu trữ đơn hàng");
    } finally {
      setProcessingOrderId(null);
    }
  };

  // ✅ NEW: UNARCHIVE ORDER
  const handleUnarchiveOrder = async (orderId: string) => {
    if (!confirm("Xác nhận khôi phục đơn hàng từ kho lưu trữ?")) {
      return;
    }

    try {
      setProcessingOrderId(orderId);
      await axiosInstance.patch(`/admin/orders/${orderId}/unarchive`);
      await fetchOrders();
      await fetchArchiveStats();
      alert("Đã khôi phục đơn hàng!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khôi phục đơn hàng");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const getReserveTimeLeft = (reservedUntil?: string) => {
    if (!reservedUntil) return null;

    const now = new Date().getTime();
    const reserved = new Date(reservedUntil).getTime();
    const diff = reserved - now;

    if (diff <= 0) return "Đã hết hạn";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // ✅ CHECK IF ORDER CAN BE ARCHIVED
  const canArchiveOrder = (order: Order) => {
    if (!["Completed", "Cancelled"].includes(order.status)) return false;
    if (order.archived) return false;

    const orderDate = new Date(order.createdAt);
    const daysDiff = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff >= 30;
  };

  const statusFilteredOrders = useMemo(() => {
    if (filterStatus === "all") return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return statusFilteredOrders;

    const query = searchQuery.toLowerCase().trim();

    return statusFilteredOrders.filter((order) => {
      if (order.orderNumber?.toLowerCase().includes(query)) return true;
      if (order.customer?.name?.toLowerCase().includes(query)) return true;
      if (order.customer?.phone?.includes(query)) return true;
      if (order.customer?.address?.toLowerCase().includes(query)) return true;
      const hasMatchingProduct = order.items?.some((item) =>
        item?.product?.name?.toLowerCase().includes(query)
      );
      if (hasMatchingProduct) return true;

      return false;
    });
  }, [statusFilteredOrders, searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, itemsPerPage, dateRange, showArchived]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const stats = {
    pending: orders.filter((o) => o.status === "Pending").length,
    confirmed: orders.filter((o) => o.status === "Confirmed").length,
    shipping: orders.filter((o) => o.status === "Shipping").length,
    completed: orders.filter((o) => o.status === "Completed").length,
    cancelled: orders.filter((o) => o.status === "Cancelled").length,
  };

  if (loading) {
    return (
      <div className="order-manager">
        <div style={{ textAlign: "center", padding: "100px" }}>
          <Loader2 size={48} className="spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="order-manager">
      <div className="page-header">
        <h1 className="page-title">Quản lý đơn hàng</h1>
        <div className="stats-row">
          <div className="stat-card pending">
            <Clock size={20} />
            <div>
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">Chờ xác nhận</div>
            </div>
          </div>
          <div className="stat-card confirmed">
            <CheckCircle size={20} />
            <div>
              <div className="stat-number">{stats.confirmed}</div>
              <div className="stat-label">Đã xác nhận</div>
            </div>
          </div>
          <div className="stat-card shipping">
            <Truck size={20} />
            <div>
              <div className="stat-number">{stats.shipping}</div>
              <div className="stat-label">Đang giao</div>
            </div>
          </div>
          <div className="stat-card completed">
            <Package size={20} />
            <div>
              <div className="stat-number">{stats.completed}</div>
              <div className="stat-label">Hoàn thành</div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NEW: ARCHIVE CONTROLS */}
      <div className="archive-controls">
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          className="date-filter"
        >
          <option value="7">7 ngày gần nhất</option>
          <option value="30">30 ngày gần nhất</option>
          <option value="90">3 tháng gần nhất</option>
          <option value="180">6 tháng gần nhất</option>
          <option value="365">1 năm gần nhất</option>
          <option value="all">Tất cả</option>
        </select>
        
        <label className="archive-toggle">
          <input 
            type="checkbox" 
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          <Archive size={16} />
          Hiển thị đơn đã lưu trữ
        </label>

        {archiveStats && (
          <div className="archive-stats">
            <Archive size={14} />
            Đã lưu trữ: <strong>{archiveStats.archived}</strong> / {archiveStats.total} đơn
            {archiveStats.archivable > 0 && (
              <> • Có thể lưu trữ: <strong>{archiveStats.archivable}</strong></>
            )}
          </div>
        )}
      </div>

      <div className="filter-bar">
        <button
          className={filterStatus === "all" ? "active" : ""}
          onClick={() => setFilterStatus("all")}
        >
          Tất cả ({orders.length})
        </button>
        <button
          className={filterStatus === "Pending" ? "active" : ""}
          onClick={() => setFilterStatus("Pending")}
        >
          Chờ xác nhận ({stats.pending})
        </button>
        <button
          className={filterStatus === "Confirmed" ? "active" : ""}
          onClick={() => setFilterStatus("Confirmed")}
        >
          Đã xác nhận ({stats.confirmed})
        </button>
        <button
          className={filterStatus === "Shipping" ? "active" : ""}
          onClick={() => setFilterStatus("Shipping")}
        >
          Đang giao ({stats.shipping})
        </button>
        <button
          className={filterStatus === "Completed" ? "active" : ""}
          onClick={() => setFilterStatus("Completed")}
        >
          Hoàn thành ({stats.completed})
        </button>
        <button
          className={filterStatus === "Cancelled" ? "active" : ""}
          onClick={() => setFilterStatus("Cancelled")}
        >
          Đã hủy ({stats.cancelled})
        </button>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm theo mã đơn, tên khách hàng, SĐT, địa chỉ, tên sản phẩm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="clear-search"
            onClick={() => setSearchQuery("")}
            title="Xóa tìm kiếm"
          >
            ✕
          </button>
        )}
      </div>

      <div className="orders-table">
        {currentOrders.length === 0 ? (
          <p className="empty">
            {searchQuery
              ? `Không tìm thấy đơn hàng nào với từ khóa "${searchQuery}"`
              : showArchived
              ? "Không có đơn hàng đã lưu trữ"
              : "Không có đơn hàng nào"}
          </p>
        ) : (
          <>
            {searchQuery && (
              <div className="search-result-info">
                Tìm thấy <strong>{filteredOrders.length}</strong> đơn hàng
              </div>
            )}
            <table>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Reserve</th>
                  <th>Ngày đặt</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;
                  const timeLeft = getReserveTimeLeft(order.reservedUntil);

                  return (
                    <tr key={order._id} className={order.archived ? "archived-row" : ""}>
                      <td>
                        <strong>{order.orderNumber}</strong>
                        {order.archived && (
                          <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                            <Archive size={10} style={{ display: "inline", marginRight: "2px" }} />
                            Đã lưu trữ
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="customer-info">
                          <div className="name">{order.customer.name}</div>
                          <div className="phone">{order.customer.phone}</div>
                        </div>
                      </td>
                      <td>
                        <div className="items-preview">
                          {order.items
                            .filter((item) => {
                              return (
                                item &&
                                item.product &&
                                typeof item.product === "object" &&
                                item.quantity > 0
                              );
                            })
                            .slice(0, 2)
                            .map((item, idx) => {
                              const product = item.product || {};
                              const images = Array.isArray(product.images)
                                ? product.images
                                : [];

                              return (
                                <div key={idx} className="item-mini">
                                  <img
                                    src={getFirstImageUrl(images)}
                                    alt={product.name || "Sản phẩm"}
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "https://via.placeholder.com/40?text=?";
                                    }}
                                  />
                                  <span>x{item.quantity}</span>
                                </div>
                              );
                            })}
                          {order.items.length > 2 && (
                            <span className="more">
                              +{order.items.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{order.totalAmount.toLocaleString()} ₫</strong>
                      </td>
                      <td>
                        <div
                          className="status-badge"
                          style={{
                            backgroundColor: statusInfo.bgColor,
                            color: statusInfo.color,
                          }}
                        >
                          <StatusIcon size={14} />
                          {statusInfo.label}
                        </div>
                      </td>
                      <td>
                        {order.status === "Pending" && timeLeft && (
                          <div className="reserve-time">
                            <Clock size={12} />
                            {timeLeft}
                          </div>
                        )}
                        {order.status === "Pending" && !timeLeft && (
                          <div className="reserve-expired">
                            <AlertCircle size={12} />
                            Hết hạn
                          </div>
                        )}
                      </td>
                      <td>
                        {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="actions">
                        <button
                          onClick={() => openDetailModal(order)}
                          className="btn-small btn-view"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>

                        {/* ✅ ARCHIVED ORDERS - ONLY UNARCHIVE */}
                        {order.archived && (
                          <button
                            onClick={() => handleUnarchiveOrder(order._id)}
                            className="btn-small btn-unarchive"
                            disabled={processingOrderId === order._id}
                            title="Khôi phục đơn hàng"
                          >
                            {processingOrderId === order._id ? (
                              <Loader2 size={16} className="spin" />
                            ) : (
                              <ArchiveRestore size={16} />
                            )}
                          </button>
                        )}

                        {/* ✅ ACTIVE ORDERS - NORMAL ACTIONS */}
                        {!order.archived && (
                          <>
                            {order.status === "Pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusChange(order._id, "Confirmed")
                                  }
                                  className="btn-small btn-confirm"
                                  disabled={processingOrderId === order._id}
                                  title="Xác nhận đơn"
                                >
                                  {processingOrderId === order._id ? (
                                    <Loader2 size={16} className="spin" />
                                  ) : (
                                    <CheckCircle size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleCancelOrder(order._id)}
                                  className="btn-small btn-cancel"
                                  disabled={processingOrderId === order._id}
                                  title="Hủy đơn"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}

                            {order.status === "Confirmed" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(order._id, "Shipping")
                                }
                                className="btn-small btn-ship"
                                disabled={processingOrderId === order._id}
                                title="Chuyển sang đang giao"
                              >
                                {processingOrderId === order._id ? (
                                  <Loader2 size={16} className="spin" />
                                ) : (
                                  <Truck size={16} />
                                )}
                              </button>
                            )}

                            {order.status === "Shipping" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(order._id, "Completed")
                                }
                                className="btn-small btn-complete"
                                disabled={processingOrderId === order._id}
                                title="Hoàn thành"
                              >
                                {processingOrderId === order._id ? (
                                  <Loader2 size={16} className="spin" />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                              </button>
                            )}

                            {/* ✅ ARCHIVE BUTTON - Only for Completed/Cancelled > 30 days */}
                            {canArchiveOrder(order) && (
                              <button
                                onClick={() => handleArchiveOrder(order._id)}
                                className="btn-small btn-archive"
                                disabled={processingOrderId === order._id}
                                title="Lưu trữ đơn hàng"
                              >
                                {processingOrderId === order._id ? (
                                  <Loader2 size={16} className="spin" />
                                ) : (
                                  <Archive size={16} />
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {filteredOrders.length > 0 && (
        <div className="pagination">
          <div className="pagination-left">
            <div className="items-per-page">
              <span>Hiển thị:</span>
              <select
                value={itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(Number(e.target.value))
                }
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>đơn hàng/trang</span>
            </div>
            <div className="page-info">
              Hiển thị {startIndex + 1}-
              {Math.min(endIndex, filteredOrders.length)} trong tổng số{" "}
              {filteredOrders.length} đơn hàng
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Trước
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`pagination-number ${
                            currentPage === page ? "active" : ""
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="pagination-ellipsis">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ✅ MODAL CHI TIẾT */}
      {showDetailModal && selectedOrder && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="modal detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Chi tiết đơn hàng {selectedOrder.orderNumber}</h3>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {selectedOrder.archived && (
                  <div style={{
                    backgroundColor: "#fef3c7",
                    color: "#92400e",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <Archive size={14} />
                    Đã lưu trữ
                  </div>
                )}
                <div
                  className="status-badge"
                  style={{
                    backgroundColor: getStatusInfo(selectedOrder.status).bgColor,
                    color: getStatusInfo(selectedOrder.status).color,
                  }}
                >
                  {(() => {
                    const StatusIcon = getStatusInfo(selectedOrder.status).icon;
                    return <StatusIcon size={14} />;
                  })()}
                  {getStatusInfo(selectedOrder.status).label}
                </div>
              </div>
            </div>

            <div className="modal-content">
              <div className="info-section">
                <h4>
                  <User size={18} /> Thông tin khách hàng
                </h4>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Họ tên:</strong>
                    <span>{selectedOrder.customer.name}</span>
                  </div>
                  <div className="info-item">
                    <Phone size={14} />
                    <strong>Số điện thoại:</strong>
                    <span>{selectedOrder.customer.phone}</span>
                  </div>
                  <div className="info-item full-width">
                    <MapPin size={14} />
                    <strong>Địa chỉ:</strong>
                    <span>{selectedOrder.customer.address}</span>
                  </div>
                  <div className="info-item">
                    <Calendar size={14} />
                    <strong>Ngày đặt:</strong>
                    <span>
                      {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="info-item">
                    <strong>Thanh toán:</strong>
                    <span>
                      {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                    </span>
                  </div>
                </div>

                {selectedOrder.note && (
                  <div className="note-box">
                    <strong>Ghi chú:</strong>
                    <p>{selectedOrder.note}</p>
                  </div>
                )}

                {selectedOrder.status === "Pending" &&
                  selectedOrder.reservedUntil && (
                    <div className="reserve-info">
                      <AlertCircle size={16} />
                      <div>
                        <strong>Thời gian giữ hàng:</strong>
                        <span>
                          Còn {getReserveTimeLeft(selectedOrder.reservedUntil)}{" "}
                          để xác nhận
                        </span>
                      </div>
                    </div>
                  )}

                {selectedOrder.archived && selectedOrder.archivedAt && (
                  <div className="reserve-info" style={{ background: "#fef3c7", borderLeftColor: "#f59e0b" }}>
                    <Archive size={16} style={{ color: "#f59e0b" }} />
                    <div>
                      <strong style={{ color: "#92400e" }}>Đã lưu trữ:</strong>
                      <span style={{ color: "#78350f" }}>
                        {new Date(selectedOrder.archivedAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="info-section">
                <h4>
                  <Package size={18} /> Sản phẩm đã đặt
                </h4>
                <div className="items-list">
                  {selectedOrder.items
                    .filter((item) => item && item.product)
                    .map((item, idx) => (
                      <div key={idx} className="item-row">
                        <img
                          src={getFirstImageUrl(item.product?.images || [])}
                          alt={item.product?.name || "Sản phẩm"}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/80?text=Error";
                          }}
                        />
                        <div className="item-details">
                          <div className="item-name">
                            {item.product?.name || "N/A"}
                          </div>
                          <div className="item-sku">
                            SKU: {item.product?.sku || "N/A"}
                          </div>

                          {item.selectedAttributes &&
                            Object.keys(item.selectedAttributes).length > 0 && (
                              <div className="item-attributes">
                                {Object.entries(item.selectedAttributes).map(
                                  ([key, value]) => {
                                    const displayValue = getAttributeLabel(
                                      key,
                                      value,
                                      item.product
                                    );
                                    
                                    return (
                                      <span key={key} className="attribute-badge">
                                        <strong>{key}:</strong> {displayValue}
                                      </span>
                                    );
                                  }
                                )}
                              </div>
                            )}
                        </div>
                        <div className="item-quantity">x{item.quantity}</div>
                        <div className="item-price">
                          {item.price.toLocaleString()} ₫
                        </div>
                        <div className="item-total">
                          {(item.price * item.quantity).toLocaleString()} ₫
                        </div>
                      </div>
                    ))}
                </div>

                <div className="total-row">
                  <strong>Tổng cộng:</strong>
                  <strong className="total-amount">
                    {selectedOrder.totalAmount.toLocaleString()} ₫
                  </strong>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowDetailModal(false)}>Đóng</button>

              {/* ✅ ARCHIVED ORDER - ONLY UNARCHIVE */}
              {selectedOrder.archived && (
                <button
                  onClick={() => handleUnarchiveOrder(selectedOrder._id)}
                  className="btn-confirm"
                  disabled={processingOrderId === selectedOrder._id}
                >
                  {processingOrderId === selectedOrder._id ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <ArchiveRestore size={16} />
                  )}
                  Khôi phục đơn hàng
                </button>
              )}

              {/* ✅ ACTIVE ORDERS - NORMAL ACTIONS */}
              {!selectedOrder.archived && (
                <>
                  {selectedOrder.status === "Pending" && (
                    <>
                      <button
                        onClick={() => {
                          handleStatusChange(selectedOrder._id, "Confirmed");
                        }}
                        className="btn-confirm"
                        disabled={processingOrderId === selectedOrder._id}
                      >
                        {processingOrderId === selectedOrder._id ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Xác nhận đơn
                      </button>
                      <button
                        onClick={() => handleCancelOrder(selectedOrder._id)}
                        className="btn-danger"
                        disabled={processingOrderId === selectedOrder._id}
                      >
                        <XCircle size={16} />
                        Hủy đơn
                      </button>
                    </>
                  )}

                  {selectedOrder.status === "Confirmed" && (
                    <button
                      onClick={() =>
                        handleStatusChange(selectedOrder._id, "Shipping")
                      }
                      className="btn-ship"
                      disabled={processingOrderId === selectedOrder._id}
                    >
                      {processingOrderId === selectedOrder._id ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <Truck size={16} />
                      )}
                      Chuyển sang đang giao
                    </button>
                  )}

                  {selectedOrder.status === "Shipping" && (
                    <button
                      onClick={() =>
                        handleStatusChange(selectedOrder._id, "Completed")
                      }
                      className="btn-complete"
                      disabled={processingOrderId === selectedOrder._id}
                    >
                      {processingOrderId === selectedOrder._id ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Hoàn thành đơn
                    </button>
                  )}

                  {/* ✅ ARCHIVE BUTTON IN MODAL */}
                  {canArchiveOrder(selectedOrder) && (
                    <button
                      onClick={() => handleArchiveOrder(selectedOrder._id)}
                      className="btn-archive"
                      disabled={processingOrderId === selectedOrder._id}
                      style={{
                        background: "#6b7280",
                        color: "white",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      {processingOrderId === selectedOrder._id ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <Archive size={16} />
                      )}
                      Lưu trữ đơn hàng
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}