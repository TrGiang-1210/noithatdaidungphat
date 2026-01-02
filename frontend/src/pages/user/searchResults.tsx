import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchProducts } from "@/api/user/productAPI";
import type { Product } from "@/api/user/productAPI";
import { FaShoppingCart } from "react-icons/fa";
import "@/styles/pages/user/searchResults.scss";
import { getFirstImageUrl } from "@/utils/imageUrl";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext"; // ✅ IMPORT

const SearchResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { t, language } = useLanguage(); // ✅ SỬ DỤNG HOOK

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // ✅ Gọi API với language parameter
    searchProducts(query, language)
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Lỗi tìm kiếm:", err);
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query, language]); // ✅ THÊM language vào dependencies

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const handleAddToCart = async (product: Product) => {
    const success = await addToCart(product, 1);

    if (success) {
      setTimeout(() => {
        navigate("/thanh-toan");
      }, 300);
    }
  };

  if (loading) {
    return (
      <div
        style={{ textAlign: "center", padding: "60px 20px", fontSize: "18px" }}
      >
        {t('search.loading')} {/* ✅ DỊCH */}
      </div>
    );
  }

  return (
    <div className="product-page-container">
      <div className="product-layout">
        <main className="product-content">
          <div className="product-header">
            <h2 style={{ textAlign: "center" }}>
              {t('search.pageTitle')}{" "} {/* ✅ DỊCH */}
              <em style={{ color: "#d6a041" }}>{query}</em>
            </h2>
            <p
              style={{
                textAlign: "center",
                marginTop: "8px",
                fontSize: "15px",
                color: "#666",
              }}
            >
              {t('search.resultsFound')}{" "} {/* ✅ DỊCH */}
              <strong style={{ color: "#d6a041" }}>{products.length}</strong>{" "}
              {t('search.products')} {/* ✅ DỊCH */}
            </p>
          </div>

          <div className="product-grid">
            {products.length > 0 ? (
              products.map((product) => {
                const isOutOfStock = product.quantity <= 0;

                return (
                  <div
                    className={`product-card ${
                      isOutOfStock ? "out-of-stock" : ""
                    }`}
                    key={product._id}
                  >
                    <div style={{ position: "relative" }}>
                      {isOutOfStock && (
                        <span className="badge out-of-stock-badge">
                          {t('search.outOfStock')} {/* ✅ DỊCH */}
                        </span>
                      )}
                      <img
                        src={getFirstImageUrl(product.images)}
                        alt={product.name}
                        style={{
                          cursor: "pointer",
                          objectFit: "cover",
                          height: "220px",
                        }}
                        onClick={() =>
                          navigate(`/san-pham/${product.slug || product._id}`)
                        }
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/300x300?text=No+Image";
                        }}
                      />
                    </div>

                    <p className="product-brand">{t('search.brand')}</p> {/* ✅ DỊCH */}
                    <h4 className="product-name">{product.name}</h4>

                    <div className="price-block">
                      <div className="price-left">
                        {product.priceSale < product.priceOriginal ? (
                          <>
                            <div className="discount-price">
                              {formatCurrency(product.priceSale)}
                            </div>
                            <div className="original-price">
                              {formatCurrency(product.priceOriginal)}
                            </div>
                          </>
                        ) : (
                          <div className="discount-price">
                            {formatCurrency(product.priceOriginal)}
                          </div>
                        )}
                      </div>
                      {product.priceSale < product.priceOriginal && (
                        <div className="discount-percent">
                          -
                          {Math.round(
                            ((product.priceOriginal - product.priceSale) /
                              product.priceOriginal) *
                              100
                          )}
                          %
                        </div>
                      )}
                    </div>

                    <button
                      className="add-to-cart"
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                    >
                      <FaShoppingCart />
                      {isOutOfStock ? t('search.outOfStock') : t('search.addToCart')} {/* ✅ DỊCH */}
                    </button>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#888",
                }}
              >
                <p style={{ fontSize: "18px" }}>
                  {t('search.noResults')} " {/* ✅ DỊCH */}
                  <strong>{query}</strong>"
                </p>
                <p>{t('search.suggestions')}</p> {/* ✅ DỊCH */}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SearchResult;