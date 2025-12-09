// src/admin/pages/ProductBulkCategory.tsx
import { useState, useEffect, useMemo } from "react";
import { Search, Package, Folders, Loader2, CheckCircle } from "lucide-react";
import "@/styles/pages/admin/productBulkCategory.scss";
import { getImageUrl, getFirstImageUrl } from "@/utils/imageUrl";
import axiosInstance from "../../axios";

interface Product {
  _id: string;
  name: string;
  images: string[];
  categories?: Array<string | { _id: string; name?: string; slug?: string }>; // Có thể là string hoặc object
}

interface CategoryNode {
  value: string;
  label: string;
  children?: CategoryNode[];
}

// Helper: Chuyển categories thành array string ID
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

// Component cây danh mục
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
        console.log("Products loaded:", productsData[0]); // Debug

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

  // Load danh mục của sản phẩm được chọn
  useEffect(() => {
    if (selectedProducts.length === 1) {
      const product = products.find((p) => p._id === selectedProducts[0]);

      if (product) {
        // Normalize categories thành array string ID
        const categoryIds = normalizeCategoryIds(product.categories);

        console.log("Selected product categories:", categoryIds); // Debug

        if (categoryIds.length > 0) {
          setSelectedCategories(categoryIds);
          expandParentCategories(categoryIds);
        } else {
          setSelectedCategories([]);
        }
      }
    } else if (selectedProducts.length === 0) {
      setSelectedCategories([]);
    }
  }, [selectedProducts, products]);

  // Hàm expand các nhánh cha của danh mục
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

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

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

  const handleSave = async () => {
    if (selectedProducts.length === 0 || selectedCategories.length === 0)
      return;

    setSaving(true);
    try {
      await axiosInstance.post("/admin/products/bulk-categories", {
        productIds: selectedProducts,
        categoryIds: selectedCategories,
      });

      // Cập nhật state local với categories mới (dạng string ID)
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          selectedProducts.includes(p._id)
            ? { ...p, categories: selectedCategories }
            : p
        )
      );

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      window.dispatchEvent(new Event("categories-updated"));
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
            Đã lưu danh mục cho {selectedProducts.length} sản phẩm vào database!
          </span>
        </div>
      )}

      <div className="bulk-grid">
        {/* Bên trái: Sản phẩm */}
        <div className="bulk-card">
          <div className="card-header">
            <div className="header-left">
              <Package size={20} />
              <h2>Chọn sản phẩm</h2>
              <span className="selected-count">
                {selectedProducts.length} đã chọn
              </span>
            </div>
            <button onClick={toggleSelectAllProducts} className="link-btn">
              {selectedProducts.length === filteredProducts.length &&
              filteredProducts.length > 0
                ? "Bỏ chọn tất cả"
                : "Chọn tất cả"}
            </button>
          </div>

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>

          <div className="product-list">
            {filteredProducts.length === 0 ? (
              <p className="empty-text">Không tìm thấy sản phẩm</p>
            ) : (
              filteredProducts.map((p) => {
                const categoryCount = normalizeCategoryIds(p.categories).length;

                return (
                  <label key={p._id} className="product-item">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(p._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([p._id]);
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                    />
                    <img 
                      src={getFirstImageUrl(p.images)} 
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/150?text=Error";
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
        </div>

        {/* Bên phải: Danh mục */}
        <div className="bulk-card">
          <div className="card-header">
            <div className="header-left">
              <Folders size={20} />
              <h2>Chọn danh mục</h2>
              <span className="selected-count">
                {selectedCategories.length} danh mục
              </span>
            </div>
            {selectedProducts.length === 1 && (
              <span className="hint-text">
                {normalizeCategoryIds(
                  products.find((p) => p._id === selectedProducts[0])
                    ?.categories
                ).length > 0
                  ? "Đang xem danh mục đã lưu"
                  : "Chưa có danh mục"}
              </span>
            )}
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
          onClick={handleSave}
          disabled={
            saving ||
            selectedProducts.length === 0 ||
            selectedCategories.length === 0
          }
          className="save-btn"
        >
          {saving ? (
            <>
              <Loader2 className="spin" size={20} />
              Đang lưu vào database...
            </>
          ) : (
            `Lưu danh mục cho ${selectedProducts.length.toLocaleString()} sản phẩm`
          )}
        </button>
      </div>
    </div>
  );
}