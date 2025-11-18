import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProductDetail } from "@/api/user/productAPI";
import "@/styles/pages/user/productDetail.scss";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await fetchProductDetail(id);
        setProduct(data);
      } catch (err) {
        console.error("Không tìm thấy sản phẩm:", err);
      }
    };
    load();
  }, [id]);

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="container">Đang tải sản phẩm...</div>
      </div>
    );
  }

  const currentImage = product.images?.[selectedImg] || product.images?.[0] || "/placeholder.jpg";
  const discount = product.priceOriginal > product.priceSale
    ? Math.round(((product.priceOriginal - product.priceSale) / product.priceOriginal) * 100)
    : 0;

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
                    <div
                      key={i}
                      className={`thumb ${selectedImg === i ? "active" : ""}`}
                      onClick={() => setSelectedImg(i)}
                    >
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
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            )}
          </div>

          {/* ==================== PHẢI: THÔNG TIN CHI TIẾT ==================== */}
          <div className="right-column">
            <h1 className="product-title">{product.name}</h1>

            <div className="meta-info">
              Mã hàng: <strong>{product.sku || product._id?.slice(-8).toUpperCase()}</strong> |{" "}
              {(product.view || 0) + 1289} lượt xem
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
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
              <input type="text" value={quantity} readOnly />
              <button onClick={() => setQuantity(q => q + 1)}>+</button>
              <span className="note">(Còn {product.quantity || 0} sản phẩm)</span>
            </div>

            <div className="action-area">
              <button className="btn-buy-now">MUA NGAY</button>
              <button className="btn-add-cart">
                THÊM VÀO GIỎ HÀNG
              </button>
            </div>

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
    <p><strong>Tình trạng:</strong> Hàng mới 100%</p>
    <p>
      <strong>Trạng thái:</strong>{" "}
      <span className={`stock-status ${product.quantity > 0 ? "in-stock" : "out-of-stock"}`}>
        {product.quantity > 0 ? "Còn hàng" : "Hết hàng"}
      </span>
    </p>
  </div>

  <div className="delivery-section">
    <h4>Chi phí giao hàng:</h4>
    <ul>
      <li>Giao lắp miễn phí tại các quận nội thành tại TPHCM.</li>
      <li>Quận 9, Hóc Môn, Thủ Đức, Củ Chi, Nhà Bè: 200.000 vnđ/đơn hàng</li>
      <li>Các tỉnh thành khác: 400.000 vnđ/đơn hàng</li>
    </ul>
  </div>

  <div className="time-section">
    <p><strong>Thời gian giao hàng:</strong> Từ 6 giờ đến 10 ngày làm việc.</p>
  </div>
</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;