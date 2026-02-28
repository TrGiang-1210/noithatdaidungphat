// src/pages/productDetail.tsx - IMPROVED VERSION
import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import "@/styles/pages/user/productDetail.scss";
import { AuthContext } from "@/context/AuthContext";
import { getFirstImageUrl, getImageUrl } from "../../utils/imageUrl";
import { ChevronRight, ShoppingCart, Zap, Shield, Truck, RotateCcw, ChevronLeft, ChevronRight as ChevronRightIcon, X, ZoomIn } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const API_URL =
  import.meta.env.VITE_API_URL || "https://tongkhonoithattayninh.vn/api";

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
  variants?: Array<{
    sku?: string;
    combination: Array<{
      name: { vi: string; zh: string };
      option: { vi: string; zh: string };
    }>;
    priceOriginal: number;
    priceSale: number;
    quantity: number;
  }>;
};

const endpointCandidates = (param: string, lang: string) => {
  const cleanUrl = API_URL.replace(/\/$/, "");
  return [
    `${cleanUrl}/products/slug/${encodeURIComponent(param)}?lang=${lang}`,
    `${cleanUrl}/products/${encodeURIComponent(param)}?lang=${lang}`,
  ];
};

// ── Policy badges ────────────────────────────────────────────────
const POLICIES = [
  { icon: <Shield size={18} />, text: "Bảo hành 5–10 năm" },
  { icon: <Truck size={18} />, text: "Miễn phí giao lắp" },
  { icon: <RotateCcw size={18} />, text: "Đổi trả 30 ngày" },
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
  // ✅ FIX: isAdding state đã được định nghĩa
  const [isAdding, setIsAdding] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState<"cart" | "buy" | null>(null);
  const thumbnailRowRef = useRef<HTMLDivElement>(null);

  // ✅ Helper function
  const safeGetText = (field: any, lang: string = "vi"): string => {
    if (!field) return "";
    if (typeof field === "string") return field;
    if (typeof field === "object" && field !== null) {
      if (field[lang] && field[lang].trim()) return field[lang];
      if (field.vi && field.vi.trim()) return field.vi;
      if (field.en && field.en.trim()) return field.en;
      const values = Object.values(field).filter((v) => typeof v === "string" && (v as string).trim());
      if (values.length > 0) return values[0] as string;
      return "";
    }
    return String(field);
  };

  const incrementProductView = async (productId: string, productSlug: string) => {
    if (viewIncrementedRef.current) return;
    viewIncrementedRef.current = true;
    try {
      const cleanUrl = API_URL.replace(/\/$/, "");
      const viewUrl = productSlug
        ? `${cleanUrl}/products/slug/${productSlug}/increment-view`
        : `${cleanUrl}/products/${productId}/increment-view`;
      await fetch(viewUrl, { method: "POST" });
    } catch {}
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
        } catch (e) {}
      }
      setError(t("product.notFound") || "Không tìm thấy sản phẩm");
      setLoading(false);
    };
    fetchProduct();
    setSelectedImageIndex(0);
    window.scrollTo({ top: 0, behavior: "instant" });
    return () => { viewIncrementedRef.current = false; };
  }, [param, language]);

  useEffect(() => {
    if (!product) return;
    const fetchRelatedProducts = async () => {
      try {
        let productCategoryIds: string[] = [];
        if (!product.categories || !Array.isArray(product.categories) || product.categories.length === 0) {
          const res = await fetch(`https://tongkhonoithattayninh.vn/api/products?lang=${language}`);
          const allProducts = await res.json();
          setRelatedProducts(allProducts.filter((p: Product) => p._id !== product._id).slice(0, 8));
          return;
        }
        productCategoryIds = product.categories
          .map((cat: any) => { if (typeof cat === "string") return cat; if (cat?._id) return cat._id.toString(); return null; })
          .filter(Boolean);
        const firstCategory = product.categories[0];
        if (firstCategory && typeof firstCategory === "object" && firstCategory.slug) {
          setCategorySlug(firstCategory.slug);
        }
        const res = await fetch(`https://tongkhonoithattayninh.vn/api/products?lang=${language}`);
        const allProducts = await res.json();
        const sameCategory = allProducts.filter((p: Product) => {
          if (p._id === product._id) return false;
          if (!p.categories || !Array.isArray(p.categories) || p.categories.length === 0) return false;
          const pCategoryIds = p.categories.map((cat: any) => { if (typeof cat === "string") return cat; if (cat?._id) return cat._id.toString(); return null; }).filter(Boolean);
          return pCategoryIds.some((catId: string) => productCategoryIds.includes(catId));
        });
        setRelatedProducts(sameCategory.slice(0, 8));
      } catch { setRelatedProducts([]); }
    };
    fetchRelatedProducts();
  }, [product, language]);

  useEffect(() => {
    if (!showLightbox || !product) return;
    const productImages = product.images?.length > 0 ? product.images.map((img) => getImageUrl(img)) : [getImageUrl(null)];
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowLightbox(false); document.body.style.overflow = "auto"; }
      else if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev + 1) % productImages.length);
      else if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLightbox, product]);

  useEffect(() => {
    if (!product?.attributes) return;
    const defaults: Record<string, string> = {};
    product.attributes.forEach((attr) => {
      const attrName = safeGetText(attr.name, language);
      const defaultOption = attr.options.find((opt) => opt.isDefault);
      if (defaultOption) defaults[attrName] = defaultOption.value;
      else if (attr.options.length > 0) defaults[attrName] = attr.options[0].value;
    });
    setSelectedAttributes(defaults);
  }, [product, language]);

  const handleAttributeSelect = (attrName: string, optionValue: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [attrName]: optionValue }));
  };

  const activeVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return product.variants.find((variant) =>
      variant.combination.every((comb) => {
        const targetAttr = product.attributes?.find((attr) => safeGetText(attr.name, "vi") === comb.name.vi);
        if (!targetAttr) return false;
        const currentSelectedValue = selectedAttributes[safeGetText(targetAttr.name, language)];
        const matchingOption = targetAttr.options.find((opt) => (opt.value || safeGetText(opt.label, language)) === currentSelectedValue);
        return safeGetText(matchingOption?.label, "vi") === comb.option.vi;
      })
    );
  }, [product, selectedAttributes, language]);

  const getValidOptionsForAttr = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return (targetAttrNameLang: string, targetAttrNameVi: string) => {
      const validOptionLabelsVi = new Set<string>();
      product.variants!.forEach((variant: any) => {
        const combForTarget = variant.combination.find((c: any) => (c.name?.vi || c.name) === targetAttrNameVi);
        if (!combForTarget) return;
        const otherCombsMatch = variant.combination.every((c: any) => {
          const cAttrNameVi = c.name?.vi || c.name;
          if (cAttrNameVi === targetAttrNameVi) return true;
          const matchedAttr = product.attributes?.find((a: any) => safeGetText(a.name, "vi") === cAttrNameVi);
          if (!matchedAttr) return true;
          const attrNameInLang = safeGetText(matchedAttr.name, language);
          const currentVal = selectedAttributes[attrNameInLang];
          if (!currentVal) return true;
          const matchedOpt = matchedAttr.options.find((opt: any) => (opt.value || safeGetText(opt.label, language)) === currentVal);
          return safeGetText(matchedOpt?.label, "vi") === (c.option?.vi || c.option);
        });
        if (otherCombsMatch) validOptionLabelsVi.add(combForTarget.option?.vi || combForTarget.option);
      });
      return validOptionLabelsVi;
    };
  }, [product, selectedAttributes, language]);

  if (loading) return (
    <div className="pd-skeleton">
      <div className="container">
        <div className="pd-skeleton__layout">
          <div className="pd-skeleton__img" />
          <div className="pd-skeleton__info">
            <div className="pd-skeleton__line pd-skeleton__line--title" />
            <div className="pd-skeleton__line pd-skeleton__line--price" />
            <div className="pd-skeleton__line" />
            <div className="pd-skeleton__line pd-skeleton__line--short" />
            <div className="pd-skeleton__btns">
              <div className="pd-skeleton__btn" />
              <div className="pd-skeleton__btn" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return <div className="pd-error"><p>😕 {error}</p><Link to="/" className="pd-error__back">← Về trang chủ</Link></div>;
  if (!product) return <div className="pd-error"><p>{t("product.noData") || "Không có dữ liệu"}</p></div>;

  const productImages = product.images?.length > 0 ? product.images.map((img) => getImageUrl(img)) : [getImageUrl(null)];
  const currentImage = productImages[selectedImageIndex];
  const productDescription = safeGetText(product.description, language);
  const displayPriceSale = activeVariant ? activeVariant.priceSale : product.priceSale || 0;
  const displayPriceOriginal = activeVariant ? activeVariant.priceOriginal : product.priceOriginal || 0;
  const displayQuantity = activeVariant ? activeVariant.quantity : product.quantity || 0;
  const displaySku = activeVariant ? (activeVariant as any).sku : product.sku;
  const displayDiscount = displayPriceOriginal > displayPriceSale && displayPriceOriginal > 0
    ? Math.round(((displayPriceOriginal - displayPriceSale) / displayPriceOriginal) * 100) : 0;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setShowLightbox(true);
    document.body.style.overflow = "hidden";
  };
  const closeLightbox = () => {
    setShowLightbox(false);
    document.body.style.overflow = "auto";
  };
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % productImages.length);
  const prevImage = () => setLightboxIndex((prev) => (prev - 1 + productImages.length) % productImages.length);

  // ✅ FIX: handleAdd nhận buyNow boolean, dùng setIsAdding đúng cách
  const handleAdd = (qty: number, buyNow: boolean = false) => {
    if (!product) return;
    const productToCart = {
      ...product,
      priceSale: displayPriceSale,
      priceOriginal: displayPriceOriginal,
      sku: displaySku || product.sku,
    };
    addToCart(productToCart, qty, selectedAttributes);
    setIsAdding(true);
    setAddedFeedback(buyNow ? "buy" : "cart");
    setTimeout(() => {
      setIsAdding(false);
      setAddedFeedback(null);
      if (buyNow) navigate("/thanh-toan");
    }, 600);
  };

  // ── ProductCard component ────────────────────────────────────
  const ProductCard: React.FC<{ product: Product }> = ({ product: prod }) => {
    const isOutOfStock = prod.quantity <= 0;
    const pOri = Number(prod.priceOriginal) || 0;
    const pSale = Number(prod.priceSale) || 0;
    const disc = pOri > pSale && pOri > 0 ? Math.round(((pOri - pSale) / pOri) * 100) : 0;
    return (
      <Link to={`/san-pham/${prod.slug}`} className={`pd-related-card ${isOutOfStock ? "is-oos" : ""}`}>
        <div className="pd-related-card__img">
          {isOutOfStock && <span className="pd-related-card__oos">{t("product.outOfStock")}</span>}
          {disc > 0 && <span className="pd-related-card__disc">-{disc}%</span>}
          <img src={getFirstImageUrl(prod.images)} alt={safeGetText(prod.name, language)}
            onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3C/svg%3E'; }} />
        </div>
        <div className="pd-related-card__info">
          <h3 className="pd-related-card__name">{safeGetText(prod.name, language)}</h3>
          <div className="pd-related-card__price">
            <span className="pd-related-card__sale">{pSale.toLocaleString()}₫</span>
            {disc > 0 && <span className="pd-related-card__ori">{pOri.toLocaleString()}₫</span>}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="pd-page">
      {/* ── Breadcrumb ── */}
      <div className="pd-breadcrumb">
        <div className="container">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          {product.categories?.[0] && typeof product.categories[0] === "object" && (
            <><Link to={`/danh-muc/${product.categories[0].slug}`}>{safeGetText(product.categories[0].name, language)}</Link><ChevronRight size={14} /></>
          )}
          <span>{safeGetText(product.name, language)}</span>
        </div>
      </div>

      <div className="container">
        <div className="pd-layout">

          {/* ══ LEFT: Image gallery ══ */}
          <div className="pd-gallery">
            <div className="pd-gallery__main" onClick={() => openLightbox(selectedImageIndex)}>
              {displayQuantity <= 0 && (
                <div className="pd-gallery__oos-overlay">
                  <span>{t("product.outOfStock")}</span>
                </div>
              )}
              {displayDiscount > 0 && <span className="pd-gallery__disc-badge">-{displayDiscount}%</span>}
              <span className="pd-gallery__zoom-hint"><ZoomIn size={18} /> Phóng to</span>
              <img src={currentImage} alt={safeGetText(product.name, language)}
                onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect fill="%23f0f0f0" width="600" height="600"/%3E%3C/svg%3E'; }} />
            </div>

            {productImages.length > 1 && (
              <div className="pd-gallery__thumbs" ref={thumbnailRowRef}>
                {productImages.map((img, i) => (
                  <button key={i} className={`pd-gallery__thumb ${selectedImageIndex === i ? "is-active" : ""}`}
                    onClick={() => setSelectedImageIndex(i)} aria-label={`Ảnh ${i + 1}`}>
                    <img src={img} alt={`${safeGetText(product.name, language)} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Description dưới gallery — desktop */}
            {productDescription && (
              <div className="pd-description">
                <h3>{t("product.description")}</h3>
                <div className="pd-description__body" dangerouslySetInnerHTML={{ __html: productDescription }} />
              </div>
            )}
          </div>

          {/* ══ RIGHT: Product info ══ */}
          <div className="pd-info">

            {/* Badges */}
            <div className="pd-info__badges">
              {product.hot && <span className="pd-badge pd-badge--hot">🔥 Hot</span>}
              {product.onSale && <span className="pd-badge pd-badge--sale">Sale</span>}
              {displayQuantity > 0
                ? <span className="pd-badge pd-badge--stock">✓ Còn hàng</span>
                : <span className="pd-badge pd-badge--oos">Hết hàng</span>}
            </div>

            <h1 className="pd-info__title">{safeGetText(product.name, language)}</h1>

            <p className="pd-info__sku">SKU: <strong>{displaySku || product._id?.slice(-8).toUpperCase()}</strong></p>

            {/* Price */}
            <div className="pd-info__price">
              <span className="pd-info__price-sale">{displayPriceSale.toLocaleString()}₫</span>
              {displayDiscount > 0 && (
                <div className="pd-info__price-meta">
                  <span className="pd-info__price-ori">{displayPriceOriginal.toLocaleString()}₫</span>
                  <span className="pd-info__price-disc">Tiết kiệm {(displayPriceOriginal - displayPriceSale).toLocaleString()}₫</span>
                </div>
              )}
            </div>

            {/* Attributes / Variants */}
            {product.attributes && product.attributes.length > 0 ? (
              <div className="pd-attrs">
                {product.attributes.map((attr, attrIdx) => {
                  const attrName = safeGetText(attr.name, language);
                  const attrNameVi = safeGetText(attr.name, "vi");
                  const validSet = getValidOptionsForAttr ? getValidOptionsForAttr(attrName, attrNameVi) : null;
                  return (
                    <div key={attrIdx} className="pd-attrs__group">
                      <label className="pd-attrs__label">{attrName}:
                        <strong className="pd-attrs__selected">
                          {safeGetText(attr.options.find(o => o.value === selectedAttributes[attrName])?.label, language)}
                        </strong>
                      </label>
                      <div className="pd-attrs__options">
                        {attr.options.filter((opt) => {
                          if (!validSet) return true;
                          return validSet.has(safeGetText(opt.label, "vi"));
                        }).map((opt, optIdx) => {
                          const isSelected = selectedAttributes[attrName] === opt.value;
                          return (
                            <button key={optIdx}
                              className={`pd-attrs__opt ${isSelected ? "is-active" : ""}`}
                              onClick={() => handleAttributeSelect(attrName, opt.value)} type="button">
                              {opt.image && (
                                <img src={getImageUrl(opt.image)} alt={safeGetText(opt.label, language)}
                                  className="pd-attrs__opt-img"
                                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
                              )}
                              <span>{safeGetText(opt.label, language)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pd-attrs">
                {product.material && <div className="pd-attrs__group"><label className="pd-attrs__label">{t("product.material")}:</label><div className="pd-attrs__options"><button className="pd-attrs__opt is-active"><span>{product.material}</span></button></div></div>}
                {product.color && <div className="pd-attrs__group"><label className="pd-attrs__label">{t("product.color")}:</label><div className="pd-attrs__options"><button className="pd-attrs__opt is-active"><span>{product.color}</span></button></div></div>}
                {product.size && <div className="pd-attrs__group"><label className="pd-attrs__label">{t("product.size")}:</label><div className="pd-attrs__options"><button className="pd-attrs__opt is-active"><span>{product.size}</span></button></div></div>}
              </div>
            )}

            {/* Quantity */}
            <div className="pd-qty">
              <span className="pd-qty__label">Số lượng:</span>
              <div className="pd-qty__ctrl">
                <button className="pd-qty__btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} aria-label="Giảm">−</button>
                <span className="pd-qty__val">{quantity}</span>
                <button className="pd-qty__btn" onClick={() => setQuantity(quantity + 1)} disabled={quantity >= displayQuantity} aria-label="Tăng">+</button>
              </div>
              {displayQuantity > 0 && displayQuantity <= 10 && (
                <span className="pd-qty__warn">Chỉ còn {displayQuantity} sản phẩm</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="pd-actions">
              <button className={`pd-actions__buy ${isAdding && addedFeedback === "buy" ? "is-loading" : ""}`}
                onClick={() => handleAdd(quantity, true)} disabled={displayQuantity <= 0 || isAdding}>
                <Zap size={18} />
                {displayQuantity <= 0 ? t("product.outOfStock") : addedFeedback === "buy" ? "Đang xử lý..." : t("product.buyNow")}
              </button>
              <button className={`pd-actions__cart ${isAdding && addedFeedback === "cart" ? "is-loading" : ""}`}
                onClick={() => handleAdd(quantity, false)} disabled={displayQuantity <= 0 || isAdding}>
                <ShoppingCart size={18} />
                {displayQuantity <= 0 ? t("product.outOfStock") : addedFeedback === "cart" ? "✓ Đã thêm!" : t("product.addToCart")}
              </button>
            </div>

            {/* Installment */}
            <div className="pd-installment">
              <button className="pd-installment__btn pd-installment__btn--blue">{t("product.installment0Percent")}</button>
              <button className="pd-installment__btn pd-installment__btn--green">{t("product.installmentCard")}</button>
            </div>

            {/* Policy strip */}
            <div className="pd-policies">
              {POLICIES.map((p, i) => (
                <div key={i} className="pd-policies__item">
                  <span className="pd-policies__icon">{p.icon}</span>
                  <span>{p.text}</span>
                </div>
              ))}
            </div>

            {/* Delivery info */}
            <div className="pd-delivery">
              <h4>🚚 Thông tin giao hàng</h4>
              <ul>
                <li>{t("product.freeDeliveryHCMC")}</li>
                <li>{t("product.deliverySuburbs")}</li>
                <li>{t("product.deliveryOtherProvinces")}</li>
              </ul>
              <p className="pd-delivery__time">⏱ {t("product.deliveryTime")}: <strong>{t("product.deliveryTimeRange")}</strong></p>
            </div>

          </div>{/* end pd-info */}
        </div>{/* end pd-layout */}

        {/* Description on mobile (below layout) */}
        {productDescription && (
          <div className="pd-description pd-description--mobile">
            <h3>{t("product.description")}</h3>
            <div className="pd-description__body" dangerouslySetInnerHTML={{ __html: productDescription }} />
          </div>
        )}
      </div>

      {/* ── Related products ── */}
      {relatedProducts.length > 0 && (
        <section className="pd-related">
          <div className="container">
            <div className="pd-related__header">
              <h2>{t("product.relatedProducts")}</h2>
              <Link to={`/danh-muc/${categorySlug || "tat-ca"}`} className="pd-related__view-all">
                {t("common.viewAll")} <ChevronRightIcon size={16} />
              </Link>
            </div>
            <div className="pd-related__grid">
              {relatedProducts.map((prod) => <ProductCard key={prod._id} product={prod} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Mobile sticky bar ── */}
      <div className={`pd-sticky-bar ${displayQuantity <= 0 ? "is-oos" : ""}`}>
        <div className="pd-sticky-bar__price">{displayPriceSale.toLocaleString()}₫</div>
        <div className="pd-sticky-bar__actions">
          <button className="pd-sticky-bar__cart" onClick={() => handleAdd(quantity, false)} disabled={displayQuantity <= 0 || isAdding}>
            <ShoppingCart size={16} /> Giỏ hàng
          </button>
          <button className="pd-sticky-bar__buy" onClick={() => handleAdd(quantity, true)} disabled={displayQuantity <= 0 || isAdding}>
            <Zap size={16} /> Mua ngay
          </button>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {showLightbox && (
        <div className="pd-lightbox" onClick={closeLightbox}>
          <button className="pd-lightbox__close" onClick={closeLightbox}><X size={24} /></button>
          {productImages.length > 1 && (
            <button className="pd-lightbox__nav pd-lightbox__nav--prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
              <ChevronLeft size={32} />
            </button>
          )}
          <div className="pd-lightbox__content" onClick={(e) => e.stopPropagation()}>
            <img src={productImages[lightboxIndex]} alt={`${safeGetText(product.name, language)} - ${lightboxIndex + 1}`} />
            <div className="pd-lightbox__counter">{lightboxIndex + 1} / {productImages.length}</div>
          </div>
          {productImages.length > 1 && (
            <button className="pd-lightbox__nav pd-lightbox__nav--next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
              <ChevronRightIcon size={32} />
            </button>
          )}
          {productImages.length > 1 && (
            <div className="pd-lightbox__thumbs" onClick={(e) => e.stopPropagation()}>
              {productImages.map((img, i) => (
                <button key={i} className={`pd-lightbox__thumb ${lightboxIndex === i ? "is-active" : ""}`} onClick={() => setLightboxIndex(i)}>
                  <img src={img} alt={`Thumbnail ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;