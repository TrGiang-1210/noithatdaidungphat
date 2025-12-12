// src/pages/productDetail.tsx - FULL CODE WITH ATTRIBUTES
import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import "@/styles/pages/user/productDetail.scss";
import { AuthContext } from "@/context/AuthContext";
import { getImageUrls, getFirstImageUrl, getImageUrl } from "@/utils/imageUrl";
import { ChevronRight } from "lucide-react";

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
  // ✅ THÊM ATTRIBUTES
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

const endpointCandidates = (param: string) => [
  `http://localhost:5000/api/products/slug/${encodeURIComponent(param)}`,
  `http://localhost:5000/api/products/${encodeURIComponent(param)}`,
  `http://localhost:5000/api/product/${encodeURIComponent(param)}`,
];

const ProductDetail: React.FC = () => {
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
  // ✅ THÊM STATE CHO ATTRIBUTES
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const incrementProductView = async (productId: string, productSlug: string) => {
    if (viewIncrementedRef.current) {
      console.log('View already incremented (ref check), skipping...');
      return;
    }

    viewIncrementedRef.current = true;

    try {
      const viewUrl = productSlug 
        ? `http://localhost:5000/api/products/slug/${productSlug}/increment-view`
        : `http://localhost:5000/api/products/${productId}/increment-view`;
      
      await fetch(viewUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('View incremented successfully - only once!');
    } catch (error) {
      viewIncrementedRef.current = false;
      console.error('Error incrementing view:', error);
    }
  };

  useEffect(() => {
    if (!param) {
      setError("Không có product id/slug trong URL");
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      const candidates = endpointCandidates(param);
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            const txt = await res.text();
            console.warn(
              `[ProductDetail] ${url} -> ${res.status}`,
              txt.slice(0, 200)
            );
            continue;
          }
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) {
            const txt = await res.text();
            console.warn(
              `[ProductDetail] ${url} returned non-json:`,
              txt.slice(0, 200)
            );
            continue;
          }
          const data = await res.json();
          setProduct(data);
          setLoading(false);
          
          incrementProductView(data._id, data.slug);
          
          return;
        } catch (e) {
          console.warn(`[ProductDetail] fetch failed ${url}`, e);
        }
      }
      setError("Không tìm thấy sản phẩm (kiểm tra backend route).");
      setLoading(false);
    };

    fetchProduct();
    setSelectedImageIndex(0);
    
    return () => {
      viewIncrementedRef.current = false;
    };
  }, [param]);

  useEffect(() => {
    if (!product) return;

    const fetchRelatedProducts = async () => {
      try {
        console.log("Product data:", product);
        console.log("Product categories:", product.categories);

        let productCategoryIds: string[] = [];

        if (
          !product.categories ||
          !Array.isArray(product.categories) ||
          product.categories.length === 0
        ) {
          console.log("No categories found, loading random products");
          const res = await fetch("http://localhost:5000/api/products");
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
        if (
          firstCategory &&
          typeof firstCategory === "object" &&
          firstCategory.slug
        ) {
          setCategorySlug(firstCategory.slug);
        }

        console.log("Product category IDs:", productCategoryIds);

        const res = await fetch("http://localhost:5000/api/products");
        const allProducts = await res.json();

        console.log("Total products:", allProducts.length);

        const sameCategory = allProducts.filter((p: Product) => {
          if (p._id === product._id) return false;

          if (
            !p.categories ||
            !Array.isArray(p.categories) ||
            p.categories.length === 0
          ) {
            return false;
          }

          const pCategoryIds = p.categories
            .map((cat: any) => {
              if (typeof cat === "string") return cat;
              if (cat && cat._id) return cat._id.toString();
              return null;
            })
            .filter(Boolean);

          const hasCommonCategory = pCategoryIds.some((catId: string) =>
            productCategoryIds.includes(catId)
          );

          if (hasCommonCategory) {
            console.log(
              `Product "${p.name}" has common category with current product`
            );
          }

          return hasCommonCategory;
        });

        console.log("Products in same category:", sameCategory.length);

        const filtered = sameCategory.slice(0, 8);
        setRelatedProducts(filtered);
      } catch (error) {
        console.error("Error loading related products:", error);
        setRelatedProducts([]);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  useEffect(() => {
    if (!showLightbox || !product) return;

    const productImages = getImageUrls(product.images);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLightbox(false);
        document.body.style.overflow = 'auto';
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev + 1) % productImages.length);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox, product]);

  // ✅ KHỞI TẠO GIÁ TRỊ MẶC ĐỊNH CHO ATTRIBUTES
  useEffect(() => {
    if (!product?.attributes) return;
    
    const defaults: Record<string, string> = {};
    product.attributes.forEach((attr) => {
      const defaultOption = attr.options.find(opt => opt.isDefault);
      if (defaultOption) {
        defaults[attr.name] = defaultOption.value;
      } else if (attr.options.length > 0) {
        defaults[attr.name] = attr.options[0].value;
      }
    });
    
    setSelectedAttributes(defaults);
  }, [product]);

  // ✅ HÀM XỬ LÝ CHỌN ATTRIBUTE
  const handleAttributeSelect = (attrName: string, optionValue: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attrName]: optionValue
    }));
  };

  if (loading) return <div>Đang tải sản phẩm...</div>;
  if (error) return <div style={{ color: "red" }}>Lỗi: {error}</div>;
  if (!product) return <div>Không có dữ liệu sản phẩm</div>;

  const productImages = getImageUrls(product.images);
  const currentImage = productImages[selectedImageIndex];
  const discount =
    product.priceOriginal > product.priceSale
      ? Math.round(
          ((product.priceOriginal - product.priceSale) /
            product.priceOriginal) *
            100
        )
      : 0;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setShowLightbox(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    document.body.style.overflow = 'auto';
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
      <button className="btn-buy-now" onClick={() => handleAdd(quantity, true)}>
        MUA NGAY
      </button>

      <button
        className="btn-add-cart"
        onClick={() => handleAdd(quantity, false)}
      >
        THÊM VÀO GIỎ
      </button>
    </div>
  );

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const discount =
      product.priceOriginal > product.priceSale
        ? Math.round(
            ((product.priceOriginal - product.priceSale) /
              product.priceOriginal) *
              100
          )
        : 0;

    return (
      <Link to={`/san-pham/${product.slug}`} className="product-card">
        <div className="product-image">
          <img
            src={getFirstImageUrl(product.images)}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/300x300?text=No+Image";
            }}
          />
        </div>
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>

          <div className="product-price">
            <div className="price-left">
              <span className="price-sale">
                {product.priceSale.toLocaleString()}₫
              </span>
              {discount > 0 && (
                <span className="price-original">
                  {product.priceOriginal.toLocaleString()}₫
                </span>
              )}
            </div>
            {discount > 0 && (
              <span className="discount-percent">-{discount}%</span>
            )}
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
                <img
                  src={currentImage}
                  alt={product.name}
                  onClick={() => openLightbox(selectedImageIndex)}
                  style={{ cursor: 'pointer' }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/600x600?text=No+Image";
                  }}
                />
              </div>

              {productImages.length > 1 && (
                <div className="thumbnail-row">
                  {productImages.map((img: string, i: number) => (
                    <div
                      key={i}
                      className={`thumb ${
                        selectedImageIndex === i ? "active" : ""
                      }`}
                      onClick={() => setSelectedImageIndex(i)}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${i + 1}`}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/100x100?text=Error";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {product.description && (
              <div className="description-under-image">
                <h3>MÔ TẢ SẢN PHẨM</h3>
                <div
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>

          <div className="right-column">
            <h1 className="product-title">{product.name}</h1>

            <div className="meta-info">
              Mã hàng:{" "}
              <strong>
                {product.sku || product._id?.slice(-8).toUpperCase()}
              </strong>
            </div>

            <div className="price-area">
              <span className="current-price">
                {product.priceSale?.toLocaleString()}₫
              </span>
              {discount > 0 && (
                <>
                  <span className="old-price">
                    {product.priceOriginal?.toLocaleString()}₫
                  </span>
                  <span className="discount-tag">-{discount}%</span>
                </>
              )}
            </div>

            {/* ✅ HIỂN THỊ ATTRIBUTES ĐỘNG */}
            {product.attributes && product.attributes.length > 0 ? (
              <div className="options-group">
                {product.attributes.map((attr, attrIdx) => (
                  <div key={attrIdx} className="option-item">
                    <label>{attr.name}:</label>
                    <div className="option-buttons">
                      {attr.options.map((opt, optIdx) => {
                        const isSelected = selectedAttributes[attr.name] === opt.value;
                        
                        return (
                          <button
                            key={optIdx}
                            className={`option-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => handleAttributeSelect(attr.name, opt.value)}
                            type="button"
                          >
                            {opt.image && (
                              <img 
                                src={getImageUrl(opt.image)} 
                                alt={opt.label}
                                className="option-image"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span className="option-label">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ✅ FALLBACK: Hiển thị các field cũ nếu không có attributes */
              <div className="options-group">
                {product.material && (
                  <div className="option-item">
                    <label>Chất liệu:</label>
                    <button className="active">{product.material}</button>
                  </div>
                )}
                {product.color && (
                  <div className="option-item">
                    <label>Màu sắc:</label>
                    <button className="active">{product.color}</button>
                  </div>
                )}
                {product.size && (
                  <div className="option-item">
                    <label>Kích thước (cm):</label>
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
              <input
                type="text"
                value={quantity}
                readOnly
                className="qty-input"
              />
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
                MUA TRẢ GÓP 0% Thủ tục đơn giản
              </button>
              <button className="installment-btn secondary">
                TRẢ GÓP 0% QUA THẺ Visa, Master, JCB
              </button>
            </div>

            <div className="policy-area">
              <div className="status-section">
                <p>
                  <strong>Tình trạng:</strong> Hàng mới 100%
                </p>
                <p>
                  <strong>Trạng thái:</strong>{" "}
                  <span
                    className={`stock-status ${
                      product.quantity > 0 ? "in-stock" : "out-of-stock"
                    }`}
                  >
                    {product.quantity > 0 ? "Còn hàng" : "Hết hàng"}
                  </span>
                </p>
              </div>

              <div className="delivery-section">
                <h4>Chi phí giao hàng:</h4>
                <ul>
                  <li>Giao lắp miễn phí tại các quận nội thành tại TPHCM.</li>
                  <li>
                    Quận 9, Hóc Môn, Thủ Đức, Củ Chi, Nhà Bè: 200.000 vnđ/đơn
                    hàng
                  </li>
                  <li>Các tỉnh thành khác: 400.000 vnđ/đơn hàng</li>
                </ul>
              </div>

              <div className="time-section">
                <p>
                  <strong>Thời gian giao hàng:</strong> Từ 6 giờ đến 10 ngày làm
                  việc.
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
              <h2 className="section-title">CÁC SẢN PHẨM LIÊN QUAN</h2>
              <Link
                to={`/danh-muc/${categorySlug || "tat-ca"}`}
                className="view-all"
              >
                Xem tất cả <ChevronRight size={16} />
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
          <button className="lightbox-close" onClick={closeLightbox}>
            ✕
          </button>

          {productImages.length > 1 && (
            <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
              ‹
            </button>
          )}

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={productImages[lightboxIndex]}
              alt={`${product.name} - ${lightboxIndex + 1}`}
              className="lightbox-main-image"
            />

            <div className="lightbox-counter">
              {lightboxIndex + 1} / {productImages.length}
            </div>
          </div>

          {productImages.length > 1 && (
            <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
              ›
            </button>
          )}

          {productImages.length > 1 && (
            <div className="lightbox-thumbnails" onClick={(e) => e.stopPropagation()}>
              {productImages.map((img: string, i: number) => (
                <div
                  key={i}
                  className={`lightbox-thumb ${lightboxIndex === i ? 'active' : ''}`}
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