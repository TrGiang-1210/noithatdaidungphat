import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash";
import { formatPrice, formatCurrencyInput, parseCurrencyInput } from "@/utils";
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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
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
    if (priceRange[1] < MAX_PRICE) params.append("maxPrice", priceRange[1].toString());

    axios
      .get<Product[]>(`/products?${params.toString()}`)
      .then((res) => setProducts(res.data))
      .catch(console.error)
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
    axios
      .get<Category[]>("/categories")
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-orange-600">Trang chủ</Link>
          <span className="mx-2">›</span>
          <span className="text-black font-medium">
            {category?.name || "Danh mục"}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 space-y-6">
            {subCategories.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-5">
                <h3 className="font-bold text-lg text-orange-600 mb-4">
                  {category?.name}
                </h3>
                <ul className="space-y-2">
                  {subCategories.map((sub) => (
                    <li key={sub._id}>
                      <Link
                        to={`/danh-muc/${sub.slug}`}
                        className="block py-2 px-3 rounded hover:bg-orange-50 hover:text-orange-600 transition"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lọc giá */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="font-bold text-lg text-orange-600 mb-4">
                Lọc theo giá
              </h3>

              <div className="mb-6">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={priceRange[1] / 1_000_000}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], parseInt(e.target.value) * 1_000_000])
                  }
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider-orange"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>0đ</span>
                  <span>50.000.000đ</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Từ"
                  value={minInput}
                  onChange={(e) => setMinInput(formatCurrencyInput(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="text"
                  placeholder="Đến"
                  value={maxInput}
                  onChange={(e) => setMaxInput(formatCurrencyInput(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                onClick={() => loadProducts()}
                className="w-full bg-orange-600 text-white py-2.5 rounded-lg hover:bg-orange-700 transition font-medium"
              >
                Áp dụng giá
              </button>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {category?.name || "Sản phẩm"}
              </h1>

              <div className="flex items-center gap-3">
                <span className="text-gray-600">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  <option value="">Mới nhất</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="-sold">Bán chạy nhất</option>
                </select>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-20 text-gray-500 text-lg">
                Không tìm thấy sản phẩm nào.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link
                    key={product._id}
                    to={`/san-pham/${product.slug}`}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition group"
                  >
                    <div className="relative aspect-square bg-gray-100">
                      <img
                        src={product.images[0] || "/placeholder.jpg"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      {product.onSale && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          SALE
                        </span>
                      )}
                      {product.hot && (
                        <span className="absolute top-2 right-2 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          HOT
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-medium text-gray-800 line-clamp-2 text-sm mb-3">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-600 font-bold text-lg">
                            {formatPrice(product.priceSale)}
                          </p>
                          {product.priceSale < product.priceOriginal && (
                            <p className="text-xs text-gray-500 line-through">
                              {formatPrice(product.priceOriginal)}
                            </p>
                          )}
                        </div>
                        {product.priceSale < product.priceOriginal && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold">
                            -{Math.round(((product.priceOriginal - product.priceSale) / product.priceOriginal) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryProducts;