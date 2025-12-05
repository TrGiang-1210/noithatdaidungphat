import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../axios";
import { debounce } from "lodash";
import {
  formatPrice,
  formatCurrencyInput,
  parseCurrencyInput,
} from "../../utils";
import "@/styles/pages/user/categoryProduct.scss";

// XÓA formatPrice ở đây vì đã có trong utils
// import { formatPrice, formatCurrencyInput, parseCurrencyInput } from "../../utils/index";

interface Product {
  _id: string;
  slug: string;
  name: string;
  images: string[];
  priceSale: number;
  priceOriginal: number;
  onSale?: boolean;
  hot?: boolean;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  children?: Category[];
}

const MAX_PRICE = 50_000_000;

const CategoryProducts: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [sortBy, setSortBy] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0,
    MAX_PRICE,
  ]);
  const [minInput, setMinInput] = useState<string>("");
  const [maxInput, setMaxInput] = useState<string>("");

  // DÙNG formatPrice từ utils (đã có sẵn, không định nghĩa lại)
  // Nếu utils chưa có → thêm vào src/utils/index.ts: export { formatPrice } from './formatPrice';

  // Flatten categories
  const flatCategories = useMemo(() => {
    const flat: Category[] = [];
    const traverse = (nodes?: Category[]) => {
      if (!Array.isArray(nodes)) return;
      nodes.forEach((node) => {
        flat.push(node);
        if (node.children?.length) traverse(node.children);
      });
    };
    traverse(allCategories);
    return flat;
  }, [allCategories]);

  // FIX: Tách riêng hàm fetch thật sự
  const loadProducts = useCallback(() => {
    if (!slug) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.append("category", slug);
    if (sortBy) params.append("sort", sortBy);
    if (priceRange[0] > 0) params.append("minPrice", priceRange[0].toString());
    if (priceRange[1] < MAX_PRICE)
      params.append("maxPrice", priceRange[1].toString());

    axiosInstance // dùng axiosInstance
      .get<Product[]>(`/products?${params.toString()}`)
      .then((res) => {
        const data = res.data;
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Load sản phẩm thất bại:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [slug, sortBy, priceRange]);

  // Debounced version để dùng khi gõ giá
  const fetchProducts = useMemo(
    () => debounce(loadProducts, 400),
    [loadProducts]
  );

  // Load lần đầu + khi thay đổi filter
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Lắng nghe event cập nhật danh mục (từ admin)
  useEffect(() => {
    const handler = () => loadProducts();
    window.addEventListener("categories-updated", handler);
    return () => window.removeEventListener("categories-updated", handler);
  }, [loadProducts]);

  // Lấy danh mục hiện tại
  useEffect(() => {
    if (slug && flatCategories.length > 0) {
      const found = flatCategories.find((c) => c.slug === slug);
      setCategory(found || null);
    }
  }, [slug, flatCategories]);

  // Lấy tất cả danh mục
  useEffect(() => {
    axiosInstance
      .get<Category[]>("/categories") // đã đổi thành axiosInstance
      .then((res) => setAllCategories(res.data))
      .catch(console.error);
  }, []);

  // Xử lý input giá
  useEffect(() => {
    const clean = (val: string) => parseInt(val.replace(/\D/g), "") || 0;
    const min = clean(minInput);
    const max = clean(maxInput) || 50_000_000;

    if (min <= max && max <= 50_000_000) {
      setPriceRange([min * 1000, max * 1000]);
    }
  }, [minInput, maxInput]);

  // Subcategories
  const subCategories = useMemo(() => {
    if (!category) return [];
    return allCategories.filter((cat) => cat.parent === category._id);
  }, [allCategories, category]);

  if (loading) {
    return (
      <div className="container mx-auto py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-orange-600"></div>
      </div>
    );
  }

  // Trong file categoryProduct.tsx, thay phần return bằng đoạn này:

  return (
    <div className="category-product-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span className="separator">›</span>
          <span>{category?.name || "Danh mục"}</span>
        </div>

        <div className="main-wrapper">
          {/* Sidebar */}
          <aside className="sidebar">
            {/* Danh mục con */}
            {subCategories.length > 0 && (
              <div className="widget">
                <h3>{category?.name}</h3>
                <div className="sub-categories">
                  <ul>
                    {subCategories.map((sub) => (
                      <li key={sub._id}>
                        <Link to={`/danh-muc/${sub.slug}`}>{sub.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Lọc giá */}
            <div className="widget price-filter">
              <h3>Lọc theo giá</h3>
              <div className="range-slider">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={priceRange[1] / 1_000_000}
                  onChange={(e) =>
                    setPriceRange([
                      priceRange[0],
                      parseInt(e.target.value) * 1_000_000,
                    ])
                  }
                />
              </div>
              <div className="price-inputs">
                <input
                  type="text"
                  placeholder="Từ"
                  value={minInput}
                  onChange={(e) =>
                    setMinInput(formatCurrencyInput(e.target.value))
                  }
                />
                <span>-</span>
                <input
                  type="text"
                  placeholder="Đến"
                  value={maxInput}
                  onChange={(e) =>
                    setMaxInput(formatCurrencyInput(e.target.value))
                  }
                />
              </div>
              <button className="apply-btn" onClick={loadProducts}>
                Áp dụng
              </button>
            </div>
          </aside>

          {/* Main content */}
          <section className="main-content">
            <div className="page-header">
              <h1>{category?.name || "Tất cả sản phẩm"}</h1>
              <div className="sort-group">
                <span>Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="">Mới nhất</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="-sold">Bán chạy nhất</option>
                </select>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="no-products">
                Không tìm thấy sản phẩm nào trong danh mục này.
              </div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <Link
                    key={product._id}
                    to={`/san-pham/${product.slug}`}
                    className="product-card"
                  >
                    <div className="image">
                      <img
                        src={product.images[0] || "/placeholder.jpg"}
                        alt={product.name}
                      />
                      {product.onSale && (
                        <span className="badge sale">Sale</span>
                      )}
                      {product.hot && <span className="badge hot">Hot</span>}
                    </div>
                    <div className="info">
                      <h3 className="name">{product.name}</h3>
                      <div className="price-info">
                        <div>
                          <div className="price-sale">
                            {formatPrice(product.priceSale)}
                          </div>
                          {product.priceSale < product.priceOriginal && (
                            <div className="price-original">
                              {formatPrice(product.priceOriginal)}
                            </div>
                          )}
                        </div>
                        {product.priceSale < product.priceOriginal && (
                          <span className="discount">
                            -
                            {Math.round(
                              ((product.priceOriginal - product.priceSale) /
                                product.priceOriginal) *
                                100
                            )}
                            %
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CategoryProducts;
