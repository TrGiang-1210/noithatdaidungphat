import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../axios";
import { debounce } from "lodash";
import {
  formatPrice,
  formatCurrencyInput,
  parseCurrencyInput,
} from "../../utils";
import { getFirstImageUrl } from "@/utils/imageUrl";
import { useLanguage } from "../../context/LanguageContext"; // ✅ IMPORT
import "@/styles/pages/user/categoryProduct.scss";

interface Product {
  _id: string;
  slug: string;
  name: string;
  images: string[];
  priceSale: number;
  priceOriginal: number;
  onSale?: boolean;
  hot?: boolean;
  quantity: number;
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
  const { t, language } = useLanguage(); // ✅ SỬ DỤNG HOOK

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

  // ✅ Load products - THÊM language parameter
  const loadProducts = useCallback(() => {
    if (!slug) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.append("category", slug);
    params.append("lang", language); // ✅ THÊM language
    if (sortBy) params.append("sort", sortBy);
    if (priceRange[0] > 0) params.append("minPrice", priceRange[0].toString());
    if (priceRange[1] < MAX_PRICE)
      params.append("maxPrice", priceRange[1].toString());

    axiosInstance
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
  }, [slug, sortBy, priceRange, language]); // ✅ THÊM language vào dependencies

  // Load lần đầu + khi thay đổi sortBy, slug hoặc language
  useEffect(() => {
    loadProducts();
  }, [slug, sortBy, language]); // ✅ THÊM language

  // Lắng nghe event cập nhật danh mục
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

  // ✅ Lấy tất cả danh mục với language parameter
  useEffect(() => {
    axiosInstance
      .get<Category[]>(`/categories?lang=${language}`)
      .then((res) => setAllCategories(res.data))
      .catch(console.error);
  }, [language]); // ✅ Re-fetch khi language thay đổi

  // Subcategories
  const subCategories = useMemo(() => {
    if (!category || !category.children) return [];
    return category.children;
  }, [category]);

  // Handle range slider change
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) * 1_000_000;
    setPriceRange([priceRange[0], value]);
    setMaxInput(formatCurrencyInput((value / 1000).toString()));
  };

  // Handle input change
  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setMinInput(formatted);
    const value = parseCurrencyInput(formatted) * 1000;

    if (value <= MAX_PRICE && value <= priceRange[1]) {
      setPriceRange([value, priceRange[1]]);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setMaxInput(formatted);
    const value = parseCurrencyInput(formatted) * 1000;

    if (value >= priceRange[0] && value <= MAX_PRICE) {
      setPriceRange([priceRange[0], value]);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="category-product-page">
      <div className="container">
        {/* Danh mục con - Nằm ngang */}
        {subCategories.length > 0 && (
          <div className="category-tabs">
            <Link
              to={`/danh-muc/${category?.slug}`}
              className={!slug || slug === category?.slug ? "active" : ""}
            >
              {t('category.all')} {/* ✅ DỊCH */}
            </Link>
            {subCategories.map((sub) => (
              <Link
                key={sub._id}
                to={`/danh-muc/${sub.slug}`}
                className={slug === sub.slug ? "active" : ""}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}

        <div className="main-wrapper">
          {/* Sidebar */}
          <aside className="sidebar">
            {/* Lọc giá */}
            <div className="widget price-filter">
              <h3>{t('category.priceRange')}</h3> {/* ✅ DỊCH */}

              <div className="price-options">
                <button
                  className={
                    priceRange[0] === 0 && priceRange[1] === 2_000_000
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setPriceRange([0, 2_000_000]);
                    setMinInput("0");
                    setMaxInput("2.000.000");
                  }}
                >
                  {t('category.priceUnder2M')} {/* ✅ DỊCH */}
                </button>
                <button
                  className={
                    priceRange[0] === 2_000_000 && priceRange[1] === 5_000_000
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setPriceRange([2_000_000, 5_000_000]);
                    setMinInput("2.000.000");
                    setMaxInput("5.000.000");
                  }}
                >
                  {t('category.price2to5M')} {/* ✅ DỊCH */}
                </button>
                <button
                  className={
                    priceRange[0] === 5_000_000 && priceRange[1] === 10_000_000
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setPriceRange([5_000_000, 10_000_000]);
                    setMinInput("5.000.000");
                    setMaxInput("10.000.000");
                  }}
                >
                  {t('category.price5to10M')} {/* ✅ DỊCH */}
                </button>
                <button
                  className={
                    priceRange[0] === 10_000_000 && priceRange[1] === 20_000_000
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setPriceRange([10_000_000, 20_000_000]);
                    setMinInput("10.000.000");
                    setMaxInput("20.000.000");
                  }}
                >
                  {t('category.price10to20M')} {/* ✅ DỊCH */}
                </button>
                <button
                  className={
                    priceRange[0] === 20_000_000 && priceRange[1] === MAX_PRICE
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setPriceRange([20_000_000, MAX_PRICE]);
                    setMinInput("20.000.000");
                    setMaxInput("50.000.000");
                  }}
                >
                  {t('category.priceAbove20M')} {/* ✅ DỊCH */}
                </button>
              </div>

              <div className="price-divider">
                <span>{t('category.orSelectRange')}</span> {/* ✅ DỊCH */}
              </div>

              <div className="price-inputs">
                <input
                  type="text"
                  placeholder={t('category.priceFrom')} 
                  value={minInput}
                  onChange={handleMinInputChange}
                />
                <span className="separator">↔</span>
                <input
                  type="text"
                  placeholder={t('category.priceTo')} 
                  value={maxInput}
                  onChange={handleMaxInputChange}
                />
              </div>

              <button className="apply-btn" onClick={loadProducts}>
                {t('category.apply')} {/* ✅ DỊCH */}
              </button>
            </div>
          </aside>

          {/* Main content */}
          <section className="main-content">
            <div className="page-header">
              <h1>{category?.name || t('category.allProducts')}</h1> {/* ✅ DỊCH */}
              <div className="sort-group">
                <span>{t('category.sortBy')}</span> {/* ✅ DỊCH */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="">{t('category.sortNewest')}</option> {/* ✅ DỊCH */}
                  <option value="price-asc">{t('category.sortPriceAsc')}</option> {/* ✅ DỊCH */}
                  <option value="price-desc">{t('category.sortPriceDesc')}</option> {/* ✅ DỊCH */}
                  <option value="-sold">{t('category.sortBestSelling')}</option> {/* ✅ DỊCH */}
                </select>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="no-products">
                {t('category.noProducts')} {/* ✅ DỊCH */}
              </div>
            ) : (
              <div className="products-grid">
                {products.map((product) => {
                  const isOutOfStock = product.quantity <= 0;

                  return (
                    <Link
                      key={product._id}
                      to={`/san-pham/${product.slug}`}
                      className={`product-card ${
                        isOutOfStock ? "out-of-stock" : ""
                      }`}
                    >
                      <div className="image">
                        {isOutOfStock && (
                          <span className="badge out-of-stock-badge">
                            {t('category.outOfStock')} {/* ✅ DỊCH */}
                          </span>
                        )}

                        <img
                          src={getFirstImageUrl(product.images)}
                          alt={product.name}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/300x300?text=No+Image";
                          }}
                        />
                        {product.onSale && !isOutOfStock && (
                          <span className="badge sale">{t('category.sale')}</span>
                        )}
                        {product.hot && !isOutOfStock && (
                          <span className="badge hot">{t('category.hot')}</span>
                        )}
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
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CategoryProducts;