// src/admin/pages/ProductBulkCategory.tsx
import { useState, useEffect, useMemo } from 'react';
import { Search, Package, Folders, Loader2, CheckCircle } from 'lucide-react';
import "@/styles/pages/admin/productBulkCategory.scss";
import axiosInstance from '../../axios';

interface Product {
  _id: string;
  name: string;
  images: string[];
}

interface CategoryNode {
  value: string;
  label: string;
  children?: CategoryNode[];
}

// Component cây danh mục (giữ nguyên)
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
    <div key={node.value}> {/* THÊM KEY Ở ĐÂY – FIX LỖI 1 */}
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
            {isExpanded ? '▼' : '▶'}
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
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // FIX LỖI 2 + 3: Dùng axiosInstance + try/catch + set state đúng
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          axiosInstance.get('/products'),
          axiosInstance.get('/admin/categories/tree'),
        ]);

        setProducts(prodRes.data || []);
        setCategories(catRes.data || []);
      } catch (err: any) {
        console.error('Lỗi tải dữ liệu:', err);
        if (err.response?.status === 401) {
          alert('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!');
          window.location.href = '/tai-khoan-ca-nhan';
        }
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch || categories.length === 0) return categories;

    const filterNodes = (nodes: CategoryNode[]): CategoryNode[] => {
      return nodes
        .map(node => {
          const matches = node.label.toLowerCase().includes(categorySearch.toLowerCase());
          const children = node.children ? filterNodes(node.children) : [];
          if (matches || children.length > 0) {
            return { ...node, children: children.length > 0 ? children : node.children };
          }
          return null;
        })
        .filter(Boolean) as CategoryNode[];
    };

    return filterNodes(categories);
  }, [categories, categorySearch]);

  const toggleSelectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p._id));
    }
  };

  const handleSave = async () => {
    if (selectedProducts.length === 0 || selectedCategories.length === 0) return;

    setSaving(true);
    try {
      await axiosInstance.post('/admin/products/bulk-categories', {
        productIds: selectedProducts,
        categoryIds: selectedCategories,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi gán danh mục');
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
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Loader2 size={48} className="spin" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-bulk-category">
      <div className="page-header">
        <h1 className="page-title">Gán danh mục hàng loạt</h1>
        <p className="page-desc">Chọn nhiều sản phẩm và gán cùng lúc vào nhiều danh mục</p>
      </div>

      {showSuccess && (
        <div className="success-banner">
          <CheckCircle size={20} />
          <span>Gán danh mục thành công cho {selectedProducts.length} sản phẩm!</span>
        </div>
      )}

      <div className="bulk-grid">
        {/* Bên trái: Sản phẩm */}
        <div className="bulk-card">
          <div className="card-header">
            <div className="header-left">
              <Package size={20} />
              <h2>Chọn sản phẩm</h2>
              <span className="selected-count">{selectedProducts.length} đã chọn</span>
            </div>
            <button onClick={toggleSelectAllProducts} className="link-btn">
              {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
                ? 'Bỏ chọn tất cả'
                : 'Chọn tất cả'}
            </button>
          </div>

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
            />
          </div>

          <div className="product-list">
            {filteredProducts.length === 0 ? (
              <p className="empty-text">Không tìm thấy sản phẩm</p>
            ) : (
              filteredProducts.map(p => (
                <label key={p._id} className="product-item">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(p._id)}
                    onChange={e => {
                      setSelectedProducts(prev =>
                        e.target.checked
                          ? [...prev, p._id]
                          : prev.filter(id => id !== p._id)
                      );
                    }}
                  />
                  <img src={p.images[0] || '/placeholder.jpg'} alt={p.name} />
                  <span className="product-name">{p.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Bên phải: Danh mục */}
        <div className="bulk-card">
          <div className="card-header">
            <div className="header-left">
              <Folders size={20} />
              <h2>Chọn danh mục</h2>
              <span className="selected-count">{selectedCategories.length} danh mục</span>
            </div>
          </div>

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm danh mục..."
              value={categorySearch}
              onChange={e => setCategorySearch(e.target.value)}
            />
          </div>

          <div className="category-tree">
            {filteredCategories.length === 0 ? (
              <p className="empty-text">Không có danh mục nào</p>
            ) : (
              <div className="simple-category-tree">
                {filteredCategories.map(node => (
                  <CategoryTreeItem
                    key={node.value}
                    node={node}
                    level={0}
                    checked={selectedCategories}
                    expanded={expandedCategories}
                    onToggle={(value) =>
                      setExpandedCategories(prev =>
                        prev.includes(value)
                          ? prev.filter(v => v !== value)
                          : [...prev, value]
                      )
                    }
                    onCheck={(value, isChecked) =>
                      setSelectedCategories(prev =>
                        isChecked ? [...prev, value] : prev.filter(v => v !== value)
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
          disabled={saving || selectedProducts.length === 0 || selectedCategories.length === 0}
          className="save-btn"
        >
          {saving ? (
            <>
              <Loader2 className="spin" size={20} />
              Đang lưu...
            </>
          ) : (
            `Gán danh mục cho ${selectedProducts.length.toLocaleString()} sản phẩm`
          )}
        </button>
      </div>
    </div>
  );
}