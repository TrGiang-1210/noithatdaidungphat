// src/admin/pages/ProductBulkCategory.tsx
import { useState, useEffect, useMemo } from "react";
import { 
  Search, Package, Folders, Loader2, CheckCircle, 
  ToggleLeft, ToggleRight, Filter, X, Eye, Save
} from "lucide-react";
import "@/styles/pages/admin/productBulkCategory.scss";
import { getImageUrl, getFirstImageUrl } from "@/utils/imageUrl";
import axiosInstance from "../../axios";

interface Product {
  _id: string;
  name: string;
  images: string[];
  categories?: Array<string | { _id: string; name?: string; slug?: string }>;
}

interface CategoryNode {
  value: string;
  label: string;
  children?: CategoryNode[];
}

interface PreviewItem {
  product: Product;
  oldCategories: string[];
  newCategories: string[];
}

const normalizeCategoryIds = (
  categories?: Array<string | { _id: string }>
): string[] => {
  if (!categories || !Array.isArray(categories)) return [];

  return categories
    .map((cat) => {
      if (typeof cat === "string") return cat;
      if (cat && typeof cat === "object" && cat._id) return cat._id;
      return "";
    })
    .filter(Boolean);
};

const CategoryTreeItem: React.FC<{
  node: CategoryNode;
  level: number;
  checked: string[];
  expanded: string[];
  onToggle: (value: string) => void;
  onCheck: (value: string, checked: boolean) => void;
}> = ({ node, level, checked, expanded, onToggle, onCheck }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.includes(node.value);
  const isChecked = checked.includes(node.value);

  return (
    <div key={node.value}>
      <label
        className="category-tree-item"
        style={{ paddingLeft: `${level * 28 + 8}px` }}
      >
        {hasChildren && (
          <button
            type="button"
            className="expand-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle(node.value);
            }}
          >
            <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>
              ▶
            </span>
          </button>
        )}
        {!hasChildren && <span className="expand-placeholder" />}

        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onCheck(node.value, e.target.checked)}
        />
        <span className="category-name">{node.label}</span>
      </label>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <CategoryTreeItem
              key={child.value}
              node={child}
              level={level + 1}
              checked={checked}
              expanded={expanded}
              onToggle={onToggle}
              onCheck={onCheck}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ProductBulkCategory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedProductCount, setSavedProductCount] = useState(0);
  const [selectionMode, setSelectionMode] = useState<"single" | "multiple">("single");

  // New states
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [updateMode, setUpdateMode] = useState<"replace" | "add">("replace");
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          axiosInstance.get("/products"),
          axiosInstance.get("/admin/categories/tree"),
        ]);

        const productsData = prodRes.data || [];
        setProducts(productsData);
        setCategories(catRes.data || []);
      } catch (err: any) {
        console.error("Lỗi tải dữ liệu:", err);
        if (err.response?.status === 401) {
          alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
          window.location.href = "/tai-khoan-ca-nhan";
        }
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load danh mục của sản phẩm (chỉ ở chế độ single)
  useEffect(() => {
    if (selectionMode === "single" && selectedProducts.length === 1) {
      const product = products.find((p) => p._id === selectedProducts[0]);

      if (product) {
        const categoryIds = normalizeCategoryIds(product.categories);

        if (categoryIds.length > 0) {
          setSelectedCategories(categoryIds);
          expandParentCategories(categoryIds);
        } else {
          setSelectedCategories([]);
        }
      }
    } else if (selectionMode === "multiple" && selectedProducts.length === 0) {
      setSelectedCategories([]);
    }
  }, [selectedProducts, products, selectionMode]);

  const expandParentCategories = (categoryIds: string[]) => {
    const toExpand: string[] = [];

    const findParents = (nodes: CategoryNode[], targetIds: string[]): void => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          const hasMatchingChild = node.children.some(
            (child) =>
              targetIds.includes(child.value) ||
              (child.children && hasChildMatch(child.children, targetIds))
          );

          if (hasMatchingChild) {
            toExpand.push(node.value);
            findParents(node.children, targetIds);
          }
        }
      });
    };

    const hasChildMatch = (
      nodes: CategoryNode[],
      targetIds: string[]
    ): boolean => {
      return nodes.some((node) => {
        if (targetIds.includes(node.value)) return true;
        if (node.children) return hasChildMatch(node.children, targetIds);
        return false;
      });
    };

    findParents(categories, categoryIds);
    setExpandedCategories((prev) => [...new Set([...prev, ...toExpand])]);
  };

  const getCategoryLabel = (catId: string): string => {
    const findLabel = (nodes: CategoryNode[]): string | null => {
      for (const node of nodes) {
        if (node.value === catId) return node.label;
        if (node.children) {
          const found = findLabel(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findLabel(categories) || catId;
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (productSearch) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      if (categoryFilter === "no_category") {
        filtered = filtered.filter((p) => {
          const cats = normalizeCategoryIds(p.categories);
          return cats.length === 0;
        });
      } else {
        filtered = filtered.filter((p) => {
          const cats = normalizeCategoryIds(p.categories);
          return cats.includes(categoryFilter);
        });
      }
    }

    return filtered;
  }, [products, productSearch, categoryFilter]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch || categories.length === 0) return categories;

    const filterNodes = (nodes: CategoryNode[]): CategoryNode[] => {
      return nodes
        .map((node) => {
          const matches = node.label
            .toLowerCase()
            .includes(categorySearch.toLowerCase());
          const children = node.children ? filterNodes(node.children) : [];
          if (matches || children.length > 0) {
            return {
              ...node,
              children: children.length > 0 ? children : node.children,
            };
          }
          return null;
        })
        .filter(Boolean) as CategoryNode[];
    };

    return filterNodes(categories);
  }, [categories, categorySearch]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [productSearch, categoryFilter, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const toggleSelectAllProducts = () => {
    if (
      selectedProducts.length === filteredProducts.length &&
      filteredProducts.length > 0
    ) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p._id));
    }
  };

  const handleProductSelect = (productId: string, checked: boolean) => {
    if (selectionMode === "single") {
      setSelectedProducts(checked ? [productId] : []);
    } else {
      setSelectedProducts((prev) =>
        checked ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
    }
  };

  const toggleSelectionMode = () => {
    const newMode = selectionMode === "single" ? "multiple" : "single";
    setSelectionMode(newMode);

    if (newMode === "single") {
      if (selectedProducts.length > 1) {
        setSelectedProducts([selectedProducts[0]]);
      }
    } else {
      setSelectedCategories([]);
    }
  };

  const getPreviewData = (): PreviewItem[] => {
    return selectedProducts
      .map((pid) => {
        const product = products.find((p) => p._id === pid);
        if (!product) return null;

        const oldCategories = normalizeCategoryIds(product.categories);
        let newCategories: string[];

        if (updateMode === "replace") {
          newCategories = selectedCategories;
        } else {
          newCategories = [...new Set([...oldCategories, ...selectedCategories])];
        }

        return {
          product,
          oldCategories,
          newCategories,
        };
      })
      .filter(Boolean) as PreviewItem[];
  };

  const handleSave = async () => {
    if (selectedProducts.length === 0 || selectedCategories.length === 0)
      return;

    const productCount = selectedProducts.length;
    setSaving(true);
    try {
      await axiosInstance.post("/admin/products/bulk-categories", {
        productIds: selectedProducts,
        categoryIds: selectedCategories,
        mode: updateMode,
      });

      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          if (selectedProducts.includes(p._id)) {
            const oldCats = normalizeCategoryIds(p.categories);
            let newCats: string[];

            if (updateMode === "replace") {
              newCats = selectedCategories;
            } else {
              newCats = [...new Set([...oldCats, ...selectedCategories])];
            }

            return { ...p, categories: newCats };
          }
          return p;
        })
      );

      setSavedProductCount(productCount);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      window.dispatchEvent(new Event("categories-updated"));

      setSelectedProducts([]);
      setSelectedCategories([]);
      setShowPreview(false);
    } catch (err: any) {
      console.error("Lỗi gán danh mục:", err);
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="product-bulk-category">
        <div className="page-header">
          <h1 className="page-title">Gán danh mục hàng loạt</h1>
        </div>
        <div style={{ textAlign: "center", padding: "100px" }}>
          <Loader2 size={48} className="spin" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-bulk-category">
      {showSuccess && (
        <div className="success-banner">
          <CheckCircle size={20} />
          <span>
            Đã {updateMode === "replace" ? "thay thế" : "thêm"} danh mục cho{" "}
            {savedProductCount} sản phẩm vào database!
          </span>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="preview-modal-overlay">
          <div className="preview-modal">
            <div className="preview-header">
              <h2>Xem trước thay đổi</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="close-btn"
              >
                <X size={24} />
              </button>
            </div>

            <div className="preview-mode-info">
              <strong>Chế độ: </strong>
              {updateMode === "replace"
                ? "Thay thế danh mục cũ"
                : "Thêm vào danh mục hiện có"}
            </div>

            <div className="preview-list">
              {getPreviewData().map(({ product, oldCategories, newCategories }) => (
                <div key={product._id} className="preview-item">
                  <div className="preview-product-name">{product.name}</div>
                  <div className="preview-changes">
                    <div className="preview-row">
                      <strong>Cũ:</strong>{" "}
                      {oldCategories.length === 0
                        ? "Chưa có"
                        : oldCategories.map((id) => getCategoryLabel(id)).join(", ")}
                    </div>
                    <div className="preview-row">
                      <strong>Mới:</strong>{" "}
                      {newCategories.map((id) => getCategoryLabel(id)).join(", ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="preview-actions">
              <button onClick={() => setShowPreview(false)} className="btn-cancel">
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-confirm">
                {saving ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Xác nhận lưu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bulk-grid">
        {/* Products Panel */}
        <div className="bulk-card">
          <div className="card-header">
            <div className="header-left">
              <Package size={20} />
              <h2>Chọn sản phẩm</h2>
              <span className="selected-count">
                {selectedProducts.length} đã chọn
              </span>
            </div>
            <div className="header-right">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
                title="Bộ lọc"
              >
                <Filter size={16} />
                Lọc
              </button>
              <button
                onClick={toggleSelectionMode}
                className="mode-toggle-btn"
                title={
                  selectionMode === "single"
                    ? "Chuyển sang chế độ chọn nhiều"
                    : "Chuyển sang chế độ xem"
                }
              >
                {selectionMode === "single" ? (
                  <>
                    <ToggleLeft size={18} />
                    <span>Xem danh mục</span>
                  </>
                ) : (
                  <>
                    <ToggleRight size={18} />
                    <span>Gán hàng loạt</span>
                  </>
                )}
              </button>
              {selectionMode === "multiple" && (
                <button onClick={toggleSelectAllProducts} className="link-btn">
                  {selectedProducts.length === filteredProducts.length &&
                  filteredProducts.length > 0
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="filter-panel">
              <label className="filter-label">Lọc theo danh mục:</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="all">Tất cả sản phẩm</option>
                <option value="no_category">Chưa có danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="product-list">
            {paginatedProducts.length === 0 ? (
              <p className="empty-text">Không tìm thấy sản phẩm</p>
            ) : (
              paginatedProducts.map((p) => {
                const categoryCount = normalizeCategoryIds(p.categories).length;

                return (
                  <label key={p._id} className="product-item">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(p._id)}
                      onChange={(e) => handleProductSelect(p._id, e.target.checked)}
                    />
                    <img
                      src={getFirstImageUrl(p.images)}
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/150?text=Error";
                      }}
                    />
                    <span className="product-name">{p.name}</span>
                    {categoryCount > 0 && (
                      <span className="category-badge">{categoryCount} DM</span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                <div className="items-per-page">
                  <span>Hiển thị:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="items-select"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>sp/trang</span>
                </div>
                <span className="page-range">
                  Trang {currentPage} / {totalPages} ({filteredProducts.length} SP)
                </span>
              </div>
              <div className="pagination-buttons">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← Trước
                </button>
                
                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="pagination-ellipsis">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Categories Panel */}
        <div className="bulk-card">
          <div className="card-header">
            <div className="header-left">
              <Folders size={20} />
              <h2>Chọn danh mục</h2>
              <span className="selected-count">
                {selectedCategories.length} danh mục
              </span>
            </div>
            <div className="header-right">
              {selectionMode === "single" && selectedProducts.length === 1 && (
                <span className="hint-text">
                  {normalizeCategoryIds(
                    products.find((p) => p._id === selectedProducts[0])?.categories
                  ).length > 0
                    ? "Đang xem danh mục đã lưu"
                    : "Chưa có danh mục"}
                </span>
              )}
              {selectionMode === "multiple" && selectedProducts.length > 0 && (
                <>
                  <span className="hint-text-multiple">
                    Chọn danh mục để gán cho {selectedProducts.length} sản phẩm
                  </span>
                  <select
                    value={updateMode}
                    onChange={(e) => setUpdateMode(e.target.value as "replace" | "add")}
                    className="update-mode-select"
                  >
                    <option value="replace">Thay thế</option>
                    <option value="add">Thêm vào</option>
                  </select>
                </>
              )}
            </div>
          </div>

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm danh mục..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
            />
          </div>

          <div className="category-tree">
            {filteredCategories.length === 0 ? (
              <p className="empty-text">Không có danh mục nào</p>
            ) : (
              <div className="simple-category-tree">
                {filteredCategories.map((node) => (
                  <CategoryTreeItem
                    key={node.value}
                    node={node}
                    level={0}
                    checked={selectedCategories}
                    expanded={expandedCategories}
                    onToggle={(value) =>
                      setExpandedCategories((prev) =>
                        prev.includes(value)
                          ? prev.filter((v) => v !== value)
                          : [...prev, value]
                      )
                    }
                    onCheck={(value, isChecked) =>
                      setSelectedCategories((prev) =>
                        isChecked
                          ? [...prev, value]
                          : prev.filter((v) => v !== value)
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="action-bar">
        <button
          onClick={() => setShowPreview(true)}
          disabled={
            selectedProducts.length === 0 || selectedCategories.length === 0
          }
          className="save-btn"
        >
          <Eye size={20} />
          {updateMode === "replace" ? "Thay thế" : "Thêm"} danh mục cho{" "}
          {selectedProducts.length.toLocaleString()} sản phẩm
        </button>
      </div>
    </div>
  );
}