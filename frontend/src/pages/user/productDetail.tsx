// src/pages/productDetail.tsx - FIXED VERSION WITH PROPER MULTILINGUAL SUPPORT
import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import "@/styles/pages/user/productDetail.scss";
import { AuthContext } from "@/context/AuthContext";
import { getImageUrls, getFirstImageUrl, getImageUrl } from "@/utils/imageUrl";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type Product = {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  images: string[];
  description: string;
  priceOriginal: number;
  priceSale: number;
  quantity: number;
  categories: any[];
  hot: boolean;
  onSale: boolean;
  sold: number;
  material?: string;
  color?: string;
  size?: string;
  attributes?: Array<{
    name: string;
    options: Array<{
      label: string;
      value: string;
      image?: string;
      isDefault?: boolean;
    }>;
  }>;
};

const endpointCandidates = (param: string, lang: string) => [
  `http://localhost:5000/api/products/slug/${encodeURIComponent(param)}?lang=${lang}`,
  `http://localhost:5000/api/products/${encodeURIComponent(param)}?lang=${lang}`,
  `http://localhost:5000/api/product/${encodeURIComponent(param)}?lang=${lang}`,
];

const ProductDetail: React.FC = () => {
  const { t, language } = useLanguage();
  const { slug, id } = useParams();
  const param = slug || id || "";
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [categorySlug, setCategorySlug] = useState<string>("");
  const viewIncrementedRef = useRef(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // ✅ FIXED: Helper function to safely extract text from multilingual fields
  const safeGetText = (field: any, lang: string = "vi"): string => {
    if (!field) return "";
    
    // If already a string, return it
    if (typeof field === "string") return field;
    
    // If object, extract by language priority
    if (typeof field === "object" && field !== null) {
      // Try requested language
      if (field[lang] && field[lang].trim()) {
        return field[lang];
      }
      
      // Fallback to Vietnamese
      if (field.vi && field.vi.trim()) {
        return field.vi;
      }
      
      // Fallback to English
      if (field.en && field.en.trim()) {
        return field.en;
      }
      
      // Fallback to first non-empty value
      const values = Object.values(field).filter(v => 
        typeof v === 'string' && v.trim()
      );
      if (values.length > 0) {
        return values[0] as string;
      }
      
      // No valid translation found
      console.warn(`⚠️ No translation found for lang="${lang}":`, field);
      return '';
    }
    
    // Unknown type → stringify
    return String(field);
  };

  const incrementProductView = async (productId: string, productSlug: string) => {
    if (viewIncrementedRef.current) {
      return;
    }

    viewIncrementedRef.current = true;

    try {
      const viewUrl = productSlug
        ? `http://localhost:5000/api/products/slug/${productSlug}/increment-view`
        : `http://localhost:5000/api/products/${productId}/increment-view`;

      await fetch(viewUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      viewIncrementedRef.current = false;
      console.error("Error incrementing view:", error);
    }
  };

  useEffect(() => {
    if (!param) {
      setError(t("product.noProductId") || "Không có product id/slug trong URL");
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      const candidates = endpointCandidates(param, language);
      
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) continue;
          
          const data = await res.json();
          setProduct(data);
          setLoading(false);
          incrementProductView(data._id, data.slug);
          return;
        } catch (e) {
          console.warn(`[ProductDetail] fetch failed ${url}`, e);
        }
      }
      
      setError(t("product.notFound") || "Không tìm thấy sản phẩm");
      setLoading(false);
    };

    fetchProduct();
    setSelectedImageIndex(0);

    return () => {
      viewIncrementedRef.current = false;
    };
  }, [param, language]);

  useEffect(() => {
    if (!product) return;

    const fetchRelatedProducts = async () => {
      try {
        let productCategoryIds: string[] = [];

        if (!product.categories || !Array.isArray(product.categories) || product.categories.length === 0) {
          const res = await fetch(`http://localhost:5000/api/products?lang=${language}`);
          const allProducts = await res.json();
          const filtered = allProducts
            .filter((p: Product) => p._id !== product._id)
            .slice(0, 8);
          setRelatedProducts(filtered);
          return;
        }

        productCategoryIds = product.categories
          .map((cat: any) => {
            if (typeof cat === "string") return cat;
            if (cat && cat._id) return cat._id.toString();
            return null;
          })
          .filter(Boolean);

        const firstCategory = product.categories[0];
        if (firstCategory && typeof firstCategory === "object" && firstCategory.slug) {
          setCategorySlug(firstCategory.slug);
        }

        const res = await fetch(`http://localhost:5000/api/products?lang=${language}`);
        const allProducts = await res.json();

        const sameCategory = allProducts.filter((p: Product) => {
          if (p._id === product._id) return false;
          if (!p.categories || !Array.isArray(p.categories) || p.categories.length === 0) return false;

          const pCategoryIds = p.categories
            .map((cat: any) => {
              if (typeof cat === "string") return cat;
              if (cat && cat._id) return cat._id.toString();
              return null;
            })
            .filter(Boolean);

          return pCategoryIds.some((catId: string) => productCategoryIds.includes(catId));
        });

        const filtered = sameCategory.slice(0, 8);
        setRelatedProducts(filtered);
      } catch (error) {
        console.error("Error loading related products:", error);
        setRelatedProducts([]);
      }
    };

    fetchRelatedProducts();
  }, [product, language]);

  useEffect(() => {
    if (!showLightbox || !product) return;

    const productImages = getImageUrls(product.images);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLightbox(false);
        document.body.style.overflow = "auto";
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev + 1) % productImages.length);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLightbox, product]);

  useEffect(() => {
    if (!product?.attributes) return;

    const defaults: Record<string, string> = {};
    product.attributes.forEach((attr) => {
      // ✅ FIXED: Use safeGetText to get attribute name
      const attrName = safeGetText(attr.name, language);
      const defaultOption = attr.options.find((opt) => opt.isDefault);
      
      if (defaultOption) {
        defaults[attrName] = defaultOption.value;
      } else if (attr.options.length > 0) {
        defaults[attrName] = attr.options[0].value;
      }
    });

    setSelectedAttributes(defaults);
  }, [product, language]);

  const handleAttributeSelect = (attrName: string, optionValue: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attrName]: optionValue,
    }));
  };

  if (loading) return <div>{t("common.loading") || "Đang tải sản phẩm..."}</div>;
  if (error) return <div style={{ color: "red" }}>{t("common.error") || "Lỗi"}: {error}</div>;
  if (!product) return <div>{t("product.noData") || "Không có dữ liệu sản phẩm"}</div>;

  const productImages = getImageUrls(product.images);
  const currentImage = productImages[selectedImageIndex];
  const discount = product.priceOriginal > product.priceSale
    ? Math.round(((product.priceOriginal - product.priceSale) / product.priceOriginal) * 100)
    : 0;

  // ✅ FIXED: Extract description as plain text
  const productDescription = safeGetText(product.description, language);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setShowLightbox(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    document.body.style.overflow = "auto";
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const handleAdd = async (qty: number = 1, buyNow: boolean = false) => {
    if (!product) return;
    await addToCart(product, qty);
    if (buyNow) {
      setTimeout(() => {
        navigate("/thanh-toan");
      }, 300);
    }
  };

  const actionArea = (
    <div className="action-area">
      <button
        className="btn-buy-now"
        onClick={() => handleAdd(quantity, true)}
        disabled={product.quantity <= 0}
        style={{
          opacity: product.quantity <= 0 ? 0.5 : 1,
          cursor: product.quantity <= 0 ? "not-allowed" : "pointer",
        }}
      >
        {product.quantity <= 0 ? t("product.outOfStock") : t("product.buyNow")}
      </button>

      <button
        className="btn-add-cart"
        onClick={() => handleAdd(quantity, false)}
        disabled={product.quantity <= 0}
        style={{
          opacity: product.quantity <= 0 ? 0.5 : 1,
          cursor: product.quantity <= 0 ? "not-allowed" : "pointer",
        }}
      >
        {product.quantity <= 0 ? t("product.outOfStock") : t("product.addToCart")}
      </button>
    </div>
  );

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const isOutOfStock = product.quantity <= 0;
    const discount = product.priceOriginal > product.priceSale
      ? Math.round(((product.priceOriginal - product.priceSale) / product.priceOriginal) * 100)
      : 0;

    return (
      <Link
        to={`/san-pham/${product.slug}`}
        className={`product-card ${isOutOfStock ? "out-of-stock" : ""}`}
      >
        <div className="product-image">
          {isOutOfStock && (
            <span className="badge out-of-stock-badge">{t("product.outOfStock")}</span>
          )}
          <img
            src={getFirstImageUrl(product.images)}
            alt={safeGetText(product.name, language)}
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/300x300?text=No+Image";
            }}
          />
        </div>
        <div className="product-info">
          <h3 className="product-name">{safeGetText(product.name, language)}</h3>
          <div className="product-price">
            <div className="price-left">
              <span className="price-sale">{product.priceSale.toLocaleString()}₫</span>
              {discount > 0 && (
                <span className="price-original">{product.priceOriginal.toLocaleString()}₫</span>
              )}
            </div>
            {discount > 0 && <span className="discount-percent">-{discount}%</span>}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="new-layout">
          <div className="left-column">
            <div className="image-area">
              {discount > 0 && <div className="sale-badge">-{discount}%</div>}

              <div className="main-image">
                {product.quantity <= 0 && (
                  <div className="out-of-stock-overlay">
                    <span className="out-of-stock-text">{t("product.outOfStock")}</span>
                  </div>
                )}

                <img
                  src={currentImage}
                  alt={safeGetText(product.name, language)}
                  onClick={() => openLightbox(selectedImageIndex)}
                  style={{ cursor: "pointer" }}
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/600x600?text=No+Image";
                  }}
                />
              </div>

              {productImages.length > 1 && (
                <div className="thumbnail-row">
                  {productImages.map((img: string, i: number) => (
                    <div
                      key={i}
                      className={`thumb ${selectedImageIndex === i ? "active" : ""}`}
                      onClick={() => setSelectedImageIndex(i)}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={img}
                        alt={`${safeGetText(product.name, language)} ${i + 1}`}
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/100x100?text=Error";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ FIXED: Use extracted description text */}
            {productDescription && (
              <div className="description-under-image">
                <h3>{t("product.description")}</h3>
                <div dangerouslySetInnerHTML={{ __html: productDescription }} />
              </div>
            )}
          </div>

          <div className="right-column">
            <h1 className="product-title">{safeGetText(product.name, language)}</h1>

            <div className="meta-info">
              {t("product.sku")}: <strong>{product.sku || product._id?.slice(-8).toUpperCase()}</strong>
            </div>

            <div className="price-area">
              <span className="current-price">{product.priceSale?.toLocaleString()}₫</span>
              {discount > 0 && (
                <>
                  <span className="old-price">{product.priceOriginal?.toLocaleString()}₫</span>
                  <span className="discount-tag">-{discount}%</span>
                </>
              )}
            </div>

            {/* ✅ FIXED: Properly extract attribute names and labels */}
            {product.attributes && product.attributes.length > 0 ? (
              <div className="options-group">
                {product.attributes.map((attr, attrIdx) => {
                  const attrName = safeGetText(attr.name, language);
                  
                  return (
                    <div key={attrIdx} className="option-item">
                      <label>{attrName}:</label>

                      <div className="option-buttons">
                        {attr.options.map((opt, optIdx) => {
                          const isSelected = selectedAttributes[attrName] === opt.value;
                          const optionLabel = safeGetText(opt.label, language);

                          return (
                            <button
                              key={optIdx}
                              className={`option-btn ${isSelected ? "active" : ""}`}
                              onClick={() => handleAttributeSelect(attrName, opt.value)}
                              type="button"
                            >
                              {opt.image && (
                                <img
                                  src={getImageUrl(opt.image)}
                                  alt={optionLabel}
                                  className="option-image"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              )}
                              <span className="option-label">{optionLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="options-group">
                {product.material && (
                  <div className="option-item">
                    <label>{t("product.material")}:</label>
                    <button className="active">{product.material}</button>
                  </div>
                )}
                {product.color && (
                  <div className="option-item">
                    <label>{t("product.color")}:</label>
                    <button className="active">{product.color}</button>
                  </div>
                )}
                {product.size && (
                  <div className="option-item">
                    <label>{t("product.size")}:</label>
                    <button className="active">{product.size}</button>
                  </div>
                )}
              </div>
            )}

            <div className="quantity-area">
              <button
                className="qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <input type="text" value={quantity} readOnly className="qty-input" />
              <button
                className="qty-btn"
                onClick={() => setQuantity(quantity + 1)}
                disabled={quantity >= (product.quantity || 0)}
              >
                +
              </button>
            </div>

            {actionArea}

            <div className="installment-area">
              <button className="installment-btn primary">
                {t("product.installment0Percent")}
              </button>
              <button className="installment-btn secondary">
                {t("product.installmentCard")}
              </button>
            </div>

            <div className="policy-area">
              <div className="status-section">
                <p>
                  <strong>{t("product.condition")}:</strong> {t("product.brandNew")}
                </p>
                <p>
                  <strong>{t("product.status")}:</strong>{" "}
                  <span className={`stock-status ${product.quantity > 0 ? "in-stock" : "out-of-stock"}`}>
                    {product.quantity > 0 ? t("product.inStock") : t("product.outOfStock")}
                  </span>
                </p>
              </div>

              <div className="delivery-section">
                <h4>{t("product.deliveryCost")}:</h4>
                <ul>
                  <li>{t("product.freeDeliveryHCMC")}</li>
                  <li>{t("product.deliverySuburbs")}</li>
                  <li>{t("product.deliveryOtherProvinces")}</li>
                </ul>
              </div>

              <div className="time-section">
                <p>
                  <strong>{t("product.deliveryTime")}:</strong> {t("product.deliveryTimeRange")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="related-products-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">{t("product.relatedProducts")}</h2>
              <Link to={`/danh-muc/${categorySlug || "tat-ca"}`} className="view-all">
                {t("common.viewAll")} <ChevronRight size={16} />
              </Link>
            </div>
            <div className="product-grid">
              {relatedProducts.map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          </div>
        </section>
      )}

      {showLightbox && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>✕</button>

          {productImages.length > 1 && (
            <button
              className="lightbox-nav lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
            >
              ‹
            </button>
          )}

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={productImages[lightboxIndex]}
              alt={`${safeGetText(product.name, language)} - ${lightboxIndex + 1}`}
              className="lightbox-main-image"
            />
            <div className="lightbox-counter">
              {lightboxIndex + 1} / {productImages.length}
            </div>
          </div>

          {productImages.length > 1 && (
            <button
              className="lightbox-nav lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
            >
              ›
            </button>
          )}

          {productImages.length > 1 && (
            <div className="lightbox-thumbnails" onClick={(e) => e.stopPropagation()}>
              {productImages.map((img: string, i: number) => (
                <div
                  key={i}
                  className={`lightbox-thumb ${lightboxIndex === i ? "active" : ""}`}
                  onClick={() => setLightboxIndex(i)}
                >
                  <img src={img} alt={`Thumbnail ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;