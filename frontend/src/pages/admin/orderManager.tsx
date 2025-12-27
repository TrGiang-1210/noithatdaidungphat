// src/admin/pages/OrderManager.tsx - FIX LỖI OBJECT RENDERING
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
}

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // ✅ FIX: Đảm bảo luôn trả về STRING, không phải object
  const getAttributeLabel = (
    attributeName: string,
    value: string,
    product: any
  ) => {
    if (!product || !product.attributes) return value;

    const attribute = product.attributes.find((attr: any) => {
      const attrNameVi =
        typeof attr.name === "object" ? attr.name.vi : attr.name;
      return attrNameVi === attributeName;
    });

    if (!attribute || !attribute.options) return value;

    const option = attribute.options.find((opt: any) => opt.value === value);
    if (!option) return value;

    // ✅ FIX: Nếu label là object {vi: "...", zh: "..."}, lấy .vi
    // Nếu label là string, dùng luôn
    let label = option.label;
    if (typeof label === "object" && label !== null) {
      label = label.vi || label.zh || value;
    }
    
    return String(label || value); // ✅ Đảm bảo luôn trả về string
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/orders");

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

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const handleStatusChange = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    if (
      !confirm(
        `Xác nhận chuyển trạng thái sang "${getStatusInfo(newStatus).label}"?`
      )
    ) {
      return;
    }

    try {
      setProcessingOrderId(orderId);
      await axiosInstance.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
      });
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
  }, [searchQuery, filterStatus, itemsPerPage]);

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
                    <tr key={order._id}>
                      <td>
                        <strong>{order.orderNumber}</strong>
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

      {/* ✅ MODAL CHI TIẾT - CHỈ FIX LỖI RENDER OBJECT */}
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

            <div className="modal-content">
              {/* Thông tin khách hàng */}
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
                      {new Date(selectedOrder.createdAt).toLocaleString(
                        "vi-VN"
                      )}
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
              </div>

              {/* Danh sách sản phẩm */}
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

                          {/* ✅ FIX: HIỂN THỊ THUỘC TÍNH - ĐẢM BẢO LUÔN LÀ STRING */}
                          {item.selectedAttributes &&
                            Object.keys(item.selectedAttributes).length > 0 && (
                              <div className="item-attributes">
                                {Object.entries(item.selectedAttributes).map(
                                  ([key, value]) => (
                                    <span key={key} className="attribute-badge">
                                      <strong>{key}:</strong>{" "}
                                      {getAttributeLabel(
                                        key,
                                        value,
                                        item.product
                                      )}
                                    </span>
                                  )
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}