import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import "@/styles/pages/user/productDetail.scss";
import { toast } from "react-toastify";
import { AuthContext } from "@/context/AuthContext";
import { getImageUrls, getFirstImageUrl } from "@/utils/imageUrl";
import { ChevronRight } from "lucide-react";

type Product = any;

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
  }, [param]);

  // Load sản phẩm liên quan
  useEffect(() => {
    if (!product) return;

    const fetchRelatedProducts = async () => {
      try {
        console.log("Product data:", product);
        console.log("Product categories:", product.categories);

        // Lấy category IDs từ product - XỬ LÝ CẢ OBJECT VÀ STRING
        let productCategoryIds: string[] = [];

        if (
          !product.categories ||
          !Array.isArray(product.categories) ||
          product.categories.length === 0
        ) {
          console.log("No categories found, loading random products");
          // Fallback: load sản phẩm random
          const res = await fetch("http://localhost:5000/api/products");
          const allProducts = await res.json();
          const filtered = allProducts
            .filter((p: Product) => p._id !== product._id)
            .slice(0, 8);
          setRelatedProducts(filtered);
          return;
        }

        // Chuyển categories thành array of IDs (xử lý cả object và string)
        productCategoryIds = product.categories
          .map((cat: any) => {
            if (typeof cat === "string") return cat;
            if (cat && cat._id) return cat._id.toString();
            return null;
          })
          .filter(Boolean);

        // Lưu slug của category đầu tiên để dùng cho nút "Xem tất cả"
        const firstCategory = product.categories[0];
        if (
          firstCategory &&
          typeof firstCategory === "object" &&
          firstCategory.slug
        ) {
          setCategorySlug(firstCategory.slug);
        }

        console.log("Product category IDs:", productCategoryIds);

        // Load tất cả sản phẩm
        const res = await fetch("http://localhost:5000/api/products");
        const allProducts = await res.json();

        console.log("Total products:", allProducts.length);

        // Lọc sản phẩm có CHUNG ÍT NHẤT 1 CATEGORY với sản phẩm hiện tại
        const sameCategory = allProducts.filter((p: Product) => {
          // Loại bỏ sản phẩm hiện tại
          if (p._id === product._id) return false;

          // Kiểm tra xem p có categories không
          if (
            !p.categories ||
            !Array.isArray(p.categories) ||
            p.categories.length === 0
          ) {
            return false;
          }

          // Chuyển categories của p thành array of IDs
          const pCategoryIds = p.categories
            .map((cat: any) => {
              if (typeof cat === "string") return cat;
              if (cat && cat._id) return cat._id.toString();
              return null;
            })
            .filter(Boolean);

          // Kiểm tra xem có category nào trùng không
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

        // Lấy tối đa 8 sản phẩm cùng danh mục
        const filtered = sameCategory.slice(0, 8);
        setRelatedProducts(filtered);
      } catch (error) {
        console.error("Error loading related products:", error);
        // Nếu có lỗi, không hiển thị sản phẩm nào
        setRelatedProducts([]);
      }
    };

    fetchRelatedProducts();
  }, [product]);

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

  const handleAdd = async (qty: number = 1, buyNow: boolean = false) => {
    if (!product) return;

    const success = await addToCart(product, qty);

    if (success) {
      toast.success("Đã thêm vào giỏ hàng!");

      if (buyNow) {
        setTimeout(() => {
          navigate("/thanh-toan");
        }, 300);
      }
    } else {
      toast.success("Đã thêm vào giỏ hàng!");

      if (buyNow) {
        setTimeout(() => {
          navigate("/thanh-toan");
        }, 300);
      }
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
        THÊM VÀO GIỎ HÀNG
      </button>
    </div>
  );

  // Component ProductCard giống Home
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
          {/* ==================== TRÁI: ẢNH + MÔ TẢ DƯỚI ==================== */}
          <div className="left-column">
            <div className="image-area">
              {discount > 0 && <div className="sale-badge">-{discount}%</div>}

              <div className="main-image">
                <img
                  src={currentImage}
                  alt={product.name}
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

          {/* ==================== PHẢI: THÔNG TIN CHI TIẾT ==================== */}
          <div className="right-column">
            <h1 className="product-title">{product.name}</h1>

            <div className="meta-info">
              Mã hàng:{" "}
              <strong>
                {product.sku || product._id?.slice(-8).toUpperCase()}
              </strong>{" "}
              | {(product.view || 0) + 1289} lượt xem
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
              >
                +
              </button>
              <span className="note">
                (Còn {product.quantity || 0} sản phẩm)
              </span>
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

      {/* ==================== SECTION SẢN PHẨM LIÊN QUAN ==================== */}
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
    </div>
  );
};

export default ProductDetail;
