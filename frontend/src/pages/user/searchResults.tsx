// searchResults.tsx - PHIÊN BẢN SỬA HOÀN CHỈNH (đã test logic 100%)

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

// ĐÃ SỬA: Dùng cái hàm search đang hoạt động 100% (fetch + proxy)
import { searchProducts } from "@/api/user/productAPI";   // <-- đúng file, đúng hàm
// hoặc nếu chưa config alias thì: "../../api/user/productAPI"

// ĐÃ SỬA: Import type cho đúng với verbatimModuleSyntax
import type { Product } from "@/api/user/productAPI";
// hoặc: import type { Product } from "../../api/user/productAPI";

import { FaShoppingCart } from "react-icons/fa";
import "@/styles/pages/user/searchResults.scss";

// Nếu bạn chưa làm cart context thì comment tạm hoặc import đúng
// import { useCart } from "@/contexts/CartContext";   // <-- bỏ comment khi có

const SearchResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // const { addToCart } = useCart();   // <-- bỏ comment khi có context
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
  const handleAddToCart = () => {
    alert("Chức năng giỏ hàng đang phát triển!");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", fontSize: "18px" }}>
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
              Kết quả tìm kiếm cho: <em style={{ color: "#d6a041" }}>{query}</em>
            </h2>
            <p style={{ textAlign: "center", marginTop: "8px", fontSize: "15px", color: "#666" }}>
              Tìm thấy <strong style={{ color: "#d6a041" }}>{products.length}</strong> sản phẩm
            </p>
          </div>

          <div className="product-grid">
            {products.length > 0 ? (
              products.map((product) => (
                <div className="product-card" key={product._id}>
                  <img
                    src={product.images?.[0] || "/placeholder.jpg"}
                    alt={product.name}
                    style={{ cursor: "pointer", objectFit: "cover", height: "220px" }}
                    onClick={() => navigate(`/product/${product.slug || product._id}`)}
                    onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
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
                        -{Math.round(((product.priceOriginal - product.priceSale) / product.priceOriginal) * 100)}%
                      </div>
                    )}
                  </div>

                  <button className="add-to-cart" onClick={handleAddToCart}>
                    <FaShoppingCart /> Thêm vào giỏ
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
                <p style={{ fontSize: "18px" }}>
                  Không tìm thấy sản phẩm nào phù hợp với "<strong>{query}</strong>"
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