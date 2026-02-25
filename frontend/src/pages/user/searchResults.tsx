import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { searchProducts } from "@/api/user/productAPI";
import type { Product } from "@/api/user/productAPI";
import { FaShoppingCart, FaSearch, FaArrowRight } from "react-icons/fa";
import "@/styles/pages/user/searchResults.scss";
import { getFirstImageUrl } from "@/utils/imageUrl";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

const FALLBACK_IMG =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23bbb" font-size="14" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

// ── Skeleton Card ─────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div className="product-card skeleton-card">
    <div className="card-image skeleton-box" />
    <div className="card-body">
      <div className="skeleton-line" style={{ width: "40%", height: 12 }} />
      <div className="skeleton-line" style={{ width: "90%", height: 16 }} />
      <div className="skeleton-line" style={{ width: "70%", height: 16 }} />
      <div className="skeleton-line" style={{ width: "55%", height: 22, marginTop: 8 }} />
    </div>
  </div>
);

const SearchResult: React.FC = () => {
  const [searchParams]                      = useSearchParams();
  const query                               = searchParams.get("query") || "";
  const [products, setProducts]             = useState<Product[]>([]);
  const [loading, setLoading]               = useState(true);
  const [addedId, setAddedId]               = useState<string | null>(null);
  const { addToCart }                       = useCart();
  const navigate                            = useNavigate();
  const { t, language }                     = useLanguage();

  // ── Scroll to top + fetch khi query thay đổi ─────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });

    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchProducts(query, language)
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [query, language]);

  // ── Add to cart với feedback ──────────────────────────────────
  const handleAddToCart = useCallback(async (product: Product) => {
    const success = await addToCart(product, 1);
    if (success) {
      setAddedId(product._id);
      setTimeout(() => setAddedId(null), 1800);
    }
  }, [addToCart]);

  const discount = (orig: number, sale: number) =>
    Math.round(((orig - sale) / orig) * 100);

  return (
    <div className="search-results-page">
      {/* ── Header ── */}
      <div className="search-header">
        <div className="search-header-inner">
          <span className="search-icon-decor"><FaSearch /></span>
          <div>
            <h1 className="search-title">
              {t("search.pageTitle") || "Kết quả tìm kiếm cho"}{" "}
              <em>"{query}"</em>
            </h1>
            {!loading && (
              <p className="search-count">
                {t("search.resultsFound") || "Tìm thấy"}{" "}
                <strong>{products.length}</strong>{" "}
                {t("search.products") || "sản phẩm"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="search-results-container">
        <div className="product-grid">
          {loading ? (
            // Skeleton
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : products.length > 0 ? (
            products.map((product) => {
              const outOfStock   = product.quantity <= 0;
              const hasDiscount  = product.priceSale < product.priceOriginal;
              const pct          = hasDiscount ? discount(product.priceOriginal, product.priceSale) : 0;
              const isAdded      = addedId === product._id;

              return (
                <div
                  key={product._id}
                  className={`product-card${outOfStock ? " out-of-stock" : ""}${isAdded ? " just-added" : ""}`}
                >
                  {/* Image */}
                  <Link to={`/san-pham/${product.slug || product._id}`} className="card-image-link">
                    <div className="card-image">
                      <img
                        src={getFirstImageUrl(product.images)}
                        alt={product.name}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                      />
                      {hasDiscount && !outOfStock && (
                        <span className="badge discount-badge">-{pct}%</span>
                      )}
                      {outOfStock && (
                        <span className="badge out-of-stock-badge">
                          {t("search.outOfStock") || "Hết hàng"}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="card-body">
                    <Link to={`/san-pham/${product.slug || product._id}`} className="product-name">
                      {product.name}
                    </Link>

                    {product.sku && (
                      <p className="product-sku">Mã: {product.sku}</p>
                    )}

                    <div className="price-block">
                      <div className="price-left">
                        <span className="price-sale">
                          {formatVND(hasDiscount ? product.priceSale : product.priceOriginal)}
                        </span>
                        {hasDiscount && (
                          <span className="price-original">{formatVND(product.priceOriginal)}</span>
                        )}
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        className={`btn-view`}
                        onClick={() => navigate(`/san-pham/${product.slug || product._id}`)}
                      >
                        Xem chi tiết <FaArrowRight />
                      </button>
                      <button
                        className={`btn-cart${isAdded ? " added" : ""}`}
                        onClick={() => !outOfStock && handleAddToCart(product)}
                        disabled={outOfStock}
                        title={outOfStock ? t("search.outOfStock") || "Hết hàng" : t("search.addToCart") || "Thêm vào giỏ"}
                      >
                        <FaShoppingCart />
                        {isAdded ? "✓" : ""}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Empty state */
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>
                {t("search.noResults") || "Không tìm thấy kết quả cho"}{" "}
                "<strong>{query}</strong>"
              </h3>
              <p>{t("search.suggestions") || "Hãy thử từ khóa khác hoặc kiểm tra chính tả"}</p>
              <button className="btn-back-home" onClick={() => navigate("/")}>
                Quay về trang chủ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResult;