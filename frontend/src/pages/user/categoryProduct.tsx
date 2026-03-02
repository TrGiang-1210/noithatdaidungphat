import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../axios";
import { formatPrice } from "../../utils";
import { getFirstImageUrl } from "@/utils/imageUrl";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/SEO";
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

const PRICE_PRESETS = [
  { label: "category.priceUnder2M", min: 0,          max: 2_000_000  },
  { label: "category.price2to5M",   min: 2_000_000,  max: 5_000_000  },
  { label: "category.price5to10M",  min: 5_000_000,  max: 10_000_000 },
  { label: "category.price10to20M", min: 10_000_000, max: 20_000_000 },
  { label: "category.priceAbove20M",min: 20_000_000, max: MAX_PRICE   },
];

const FALLBACK_IMG =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23bbb" font-size="14" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';

// ── Skeleton Card ─────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div className="product-card skeleton-card">
    <div className="image">
      <div className="skeleton-box" />
    </div>
    <div className="info">
      <div className="skeleton-line" style={{ width: "85%", height: 14 }} />
      <div className="skeleton-line" style={{ width: "65%", height: 14 }} />
      <div className="skeleton-line" style={{ width: "50%", height: 20, marginTop: 8 }} />
    </div>
  </div>
);

const formatCurrencyDisplay = (n: number) =>
  n === 0 ? "" : new Intl.NumberFormat("vi-VN").format(n);

const CategoryProducts: React.FC = () => {
  const { slug }           = useParams<{ slug: string }>();
  const { t, language }    = useLanguage();
  const navigate           = useNavigate();

  const [products, setProducts]         = useState<Product[]>([]);
  const [category, setCategory]         = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading]           = useState(true);
  const [sortBy, setSortBy]             = useState("");
  const [priceRange, setPriceRange]     = useState<[number, number]>([0, MAX_PRICE]);
  const [minInput, setMinInput]         = useState("");
  const [maxInput, setMaxInput]         = useState("");

  // ── Flatten categories ────────────────────────────────────────
  const flatCategories = useMemo(() => {
    const flat: Category[] = [];
    const traverse = (nodes?: Category[]) => {
      nodes?.forEach((n) => { flat.push(n); traverse(n.children); });
    };
    traverse(allCategories);
    return flat;
  }, [allCategories]);

  // ── Reset filters khi chuyển danh mục ────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setSortBy("");
    setPriceRange([0, MAX_PRICE]);
    setMinInput("");
    setMaxInput("");
  }, [slug]);

  // ── Load products ─────────────────────────────────────────────
  const loadProducts = useCallback((range = priceRange) => {
    if (!slug) return;
    setLoading(true);

    const params = new URLSearchParams({ category: slug, lang: language });
    if (sortBy)           params.append("sort",     sortBy);
    if (range[0] > 0)     params.append("minPrice", range[0].toString());
    if (range[1] < MAX_PRICE) params.append("maxPrice", range[1].toString());

    axiosInstance
      .get<Product[]>(`/products?${params}`)
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [slug, sortBy, language, priceRange]);

  useEffect(() => { loadProducts(); }, [slug, sortBy, language]);

  // ── Event listener ────────────────────────────────────────────
  useEffect(() => {
    const handler = () => loadProducts();
    window.addEventListener("categories-updated", handler);
    return () => window.removeEventListener("categories-updated", handler);
  }, [loadProducts]);

  // ── Lấy category hiện tại ─────────────────────────────────────
  useEffect(() => {
    if (slug && flatCategories.length > 0)
      setCategory(flatCategories.find((c) => c.slug === slug) ?? null);
  }, [slug, flatCategories]);

  // ── Load all categories ───────────────────────────────────────
  useEffect(() => {
    axiosInstance
      .get<Category[]>(`/categories?lang=${language}`)
      .then((res) => setAllCategories(res.data))
      .catch(() => {});
  }, [language]);

  const subCategories = useMemo(
    () => category?.children ?? [],
    [category]
  );

  // ── Price handlers ────────────────────────────────────────────
  const applyPreset = (min: number, max: number) => {
    setPriceRange([min, max]);
    setMinInput(formatCurrencyDisplay(min));
    setMaxInput(max === MAX_PRICE ? "" : formatCurrencyDisplay(max));
    loadProducts([min, max]);
  };

  const handleApply = () => loadProducts(priceRange);

  const parseInput = (v: string) => {
    const n = parseInt(v.replace(/\D/g, ""), 10);
    return isNaN(n) ? 0 : n;
  };

  const handleMinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinInput(e.target.value);
    const val = parseInput(e.target.value);
    if (val <= priceRange[1]) setPriceRange([val, priceRange[1]]);
  };

  const handleMaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxInput(e.target.value);
    const val = parseInput(e.target.value) || MAX_PRICE;
    if (val >= priceRange[0]) setPriceRange([priceRange[0], val]);
  };

  return (
    <div className="category-product-page">
      <SEO title={category?.name || t("category.allProducts") || "Sản phẩm"} 
      description={`Sản phẩm danh mục ${category?.name || t("category.allProducts") || "Sản phẩm"}`} 
      url={`/danh-muc/${slug}`} />
      <div className="container">
        {/* Category tabs */}
        {subCategories.length > 0 && (
          <div className="category-tabs">
            <Link
              to={`/danh-muc/${category?.slug}`}
              className={slug === category?.slug ? "active" : ""}
            >
              {t("category.all") || "Tất cả"}
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
          {/* ── Sidebar ── */}
          <aside className="sidebar">
            <div className="widget price-filter">
              <h3>{t("category.priceRange") || "Lọc theo giá"}</h3>

              <div className="price-options">
                {PRICE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    className={priceRange[0] === p.min && priceRange[1] === p.max ? "active" : ""}
                    onClick={() => applyPreset(p.min, p.max)}
                  >
                    {t(p.label)}
                  </button>
                ))}
              </div>

              <div className="price-divider">
                <span>{t("category.orSelectRange") || "Hoặc nhập khoảng giá"}</span>
              </div>

              <div className="price-inputs">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t("category.priceFrom") || "Từ (VNĐ)"}
                  value={minInput}
                  onChange={handleMinInput}
                />
                <span className="separator">↔</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t("category.priceTo") || "Đến (VNĐ)"}
                  value={maxInput}
                  onChange={handleMaxInput}
                />
              </div>

              <button className="apply-btn" onClick={handleApply}>
                {t("category.apply") || "Áp dụng"}
              </button>
            </div>
          </aside>

          {/* ── Main content ── */}
          <section className="main-content">
            <div className="page-header">
              <h1>{category?.name || t("category.allProducts") || "Sản phẩm"}</h1>
              <div className="sort-group">
                <span>{t("category.sortBy") || "Sắp xếp"}:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="">{t("category.sortNewest") || "Mới nhất"}</option>
                  <option value="price-asc">{t("category.sortPriceAsc") || "Giá tăng dần"}</option>
                  <option value="price-desc">{t("category.sortPriceDesc") || "Giá giảm dần"}</option>
                  <option value="-sold">{t("category.sortBestSelling") || "Bán chạy"}</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="products-grid">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="no-products">
                <div className="no-products-icon">📦</div>
                <p>{t("category.noProducts") || "Không có sản phẩm nào trong danh mục này."}</p>
                <button onClick={() => navigate("/")}>Về trang chủ</button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map((product) => {
                  const outOfStock  = product.quantity <= 0;
                  const hasDiscount = product.priceSale < product.priceOriginal;
                  const pct         = hasDiscount
                    ? Math.round(((product.priceOriginal - product.priceSale) / product.priceOriginal) * 100)
                    : 0;

                  return (
                    <Link
                      key={product._id}
                      to={`/san-pham/${product.slug}`}
                      className={`product-card${outOfStock ? " out-of-stock" : ""}`}
                    >
                      <div className="image">
                        {hasDiscount && !outOfStock && (
                          <span className="badge discount-badge">-{pct}%</span>
                        )}
                        {product.hot && !outOfStock && (
                          <span className="badge hot-badge">HOT</span>
                        )}
                        {outOfStock && (
                          <span className="badge out-of-stock-badge">
                            {t("category.outOfStock") || "Hết hàng"}
                          </span>
                        )}
                        <img
                          src={getFirstImageUrl(product.images)}
                          alt={product.name}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                        />
                      </div>

                      <div className="info">
                        <h3 className="name">{product.name}</h3>
                        <div className="price-info">
                          <div className="price-left">
                            <span className="price-sale">
                              {formatPrice(hasDiscount ? product.priceSale : product.priceOriginal)}
                            </span>
                            {hasDiscount && (
                              <span className="price-original">{formatPrice(product.priceOriginal)}</span>
                            )}
                          </div>
                          {hasDiscount && (
                            <span className="discount-badge-inline">-{pct}%</span>
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