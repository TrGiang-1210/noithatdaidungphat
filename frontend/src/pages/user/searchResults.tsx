import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchProductsAPI } from "@/api/user/searchAPI";
import { Product } from "@/api/user/productAPI";
import { FaShoppingCart } from "react-icons/fa";
import "@/styles/pages/user/searchResults.scss";

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
    searchProductsAPI(query)
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
            <p
              style={{
                textAlign: "center",
                marginTop: "8px",
                fontSize: "15px",
                color: "#666",
              }}
            >
              Tìm thấy <strong style={{ color: "#d6a041" }}>{products.length}</strong> sản phẩm
            </p>
          </div>

          <div className="product-grid">
            {products.length > 0 ? (
              products.map((product) => (
                <div className="product-card" key={product._id}>
                  <img
                    src={product.img_url || "/placeholder.jpg"}
                    alt={product.name}
                    style={{ cursor: "pointer", objectFit: "cover", height: "220px" }}
                    onClick={() => navigate(`/product/${product._id}`)}
                    onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
                  />
                  <p className="product-brand">
                    {typeof product.brand_id === "object" && product.brand_id?.name
                      ? product.brand_id.name
                      : "Thương hiệu"}
                  </p>
                  <h4 className="product-name">{product.name}</h4>

                  <div className="price-block">
                    <div className="price-left">
                      {product.sale ? (
                        <>
                          <div className="discount-price">
                            {formatCurrency(Math.round(product.price * 0.66))}
                          </div>
                          <div className="original-price">
                            {formatCurrency(product.price)}
                          </div>
                        </>
                      ) : (
                        <div className="discount-price">
                          {formatCurrency(product.price)}
                        </div>
                      )}
                    </div>
                    {product.sale && <div className="discount-percent">-34%</div>}
                  </div>

                  <button
                    className="add-to-cart"
                    onClick={() =>
                      addToCart({
                        _id: product._id,
                        name: product.name,
                        price: product.sale ? Math.round(product.price * 0.66) : product.price,
                        quantity: 1,
                        img_url: product.img_url || "/placeholder.jpg",
                      })
                    }
                  >
                    <FaShoppingCart /> Thêm vào giỏ
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
                <p style={{ fontSize: "18px" }}>Không tìm thấy sản phẩm nào phù hợp với "<strong>{query}</strong>"</p>
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