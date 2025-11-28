import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import "@/styles/pages/user/productDetail.scss";
import { toast } from "react-toastify";
import { AuthContext } from "@/context/AuthContext";
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

  const { addToCart } = useCart();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

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
  }, [param]);

  if (loading) return <div>Đang tải sản phẩm...</div>;
  if (error) return <div style={{ color: "red" }}>Lỗi: {error}</div>;
  if (!product) return <div>Không có dữ liệu sản phẩm</div>;

  const currentImage =
    product.images?.[0] || product.img_url || "/images/no-image.png";
  const discount =
    product.priceOriginal > product.priceSale
      ? Math.round(
          ((product.priceOriginal - product.priceSale) /
            product.priceOriginal) *
            100
        )
      : 0;

  // Fallback lưu giỏ hàng cho guest (localStorage)
  const handleAdd = async (qty: number = 1, buyNow: boolean = false) => {
    if (!product) return;

    const success = await addToCart(product, qty);

    if (success) {
      toast.success("Đã thêm vào giỏ hàng!");

      if (buyNow) {
        // Chờ 1 chút để context cập nhật xong rồi mới chuyển trang
        setTimeout(() => {
          navigate("/thanh-toan");
        }, 300);
      }
    } else {
      // success = false → nghĩa là đang dùng guest (hoặc server lỗi nhưng đã fallback local)
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

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="new-layout">
          {/* ==================== TRÁI: ẢNH + MÔ TẢ DƯỚI ==================== */}
          <div className="left-column">
            {/* Ảnh + thumbnail */}
            <div className="image-area">
              {discount > 0 && <div className="sale-badge">-{discount}%</div>}

              <div className="main-image">
                <img src={currentImage} alt={product.name} />
              </div>

              {product.images && product.images.length > 1 && (
                <div className="thumbnail-row">
                  {product.images.map((img: string, i: number) => (
                    <div key={i} className={`thumb ${0 === i ? "active" : ""}`}>
                      <img src={img} alt={`${product.name} ${i + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MÔ TẢ SẢN PHẨM - ĐÚNG VỊ TRÍ BẠN MUỐN */}
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

            {/* Nút hành động */}
            {actionArea}

            <div className="installment-area">
              <button className="installment-btn primary">
                MUA TRẢ GÓP 0% Thủ tục đơn giản
              </button>
              <button className="installment-btn secondary">
                TRẢ GÓP 0% QUA THẺ Visa, Master, JCB
              </button>
            </div>

            {/* ==================== PHẦN CHÍNH SÁCH MUA HÀNG - GIỐNG HỆT ẢNH ==================== */}
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
    </div>
  );
};

export default ProductDetail;
