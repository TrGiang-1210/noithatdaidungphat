import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchProducts } from "@/api/user/productAPI";
import type { Product } from "@/api/user/productAPI";
import { FaShoppingCart } from "react-icons/fa";
import "@/styles/pages/user/searchResults.scss";
import { getFirstImageUrl } from "@/utils/imageUrl";
import { useCart } from "@/context/CartContext";

const SearchResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // ĐÃ SỬA: Gọi đúng hàm searchProducts (dùng fetch, không 404)
    searchProducts(query)
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
  }, [query]);

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  // Tạm disable nút thêm giỏ hàng nếu chưa có context
  const handleAddToCart = async (product: Product) => {
    // Thêm vào giỏ hàng trước
    const success = await addToCart(product, 1);
    
    if (success) {
      // Sau đó chuyển đến trang thanh toán
      setTimeout(() => {
        navigate('/thanh-toan');
      }, 300);
    }
  };

  if (loading) {
    return (
      <div
        style={{ textAlign: "center", padding: "60px 20px", fontSize: "18px" }}
      >
        Đang tìm kiếm sản phẩm...
      </div>
    );
  }

  return (
    <div className="product-page-container">
      <div className="product-layout">
        <main className="product-content">
          <div className="product-header">
            <h2 style={{ textAlign: "center" }}>
              Kết quả tìm kiếm cho:{" "}
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
              Tìm thấy{" "}
              <strong style={{ color: "#d6a041" }}>{products.length}</strong>{" "}
              sản phẩm
            </p>
          </div>

          <div className="product-grid">
            {products.length > 0 ? (
              products.map((product) => (
                <div className="product-card" key={product._id}>
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
                  <p className="product-brand">Nội thất cao cấp</p>
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
                  >
                    <FaShoppingCart /> Thêm vào giỏ
                  </button>
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#888",
                }}
              >
                <p style={{ fontSize: "18px" }}>
                  Không tìm thấy sản phẩm nào phù hợp với "
                  <strong>{query}</strong>"
                </p>
                <p>Gợi ý: Thử tìm "giường", "tủ", "bàn ăn", "ghế sofa"...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SearchResult;
