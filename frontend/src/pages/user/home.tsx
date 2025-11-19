import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { fetchAllProducts } from "../../api/user/productAPI";
import "@/styles/pages/user/home.scss";

// Banner images
import banner1 from "@/assets/banner/banner1.jpg";
import banner2 from "@/assets/banner/banner2.jpg";
import banner3 from "@/assets/banner/banner3.jpg";

interface Product {
  _id: string;
  slug: string;
  name: string;
  images: string[];
  priceOriginal: number;
  priceSale: number;
}

const Home: React.FC = () => {
  const banners = [
    { src: banner1, alt: "Banner 1" },
    { src: banner2, alt: "Banner 2" },
    { src: banner3, alt: "Banner 3" },
  ];

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const sliderWrapperRef = useRef<HTMLDivElement>(null);

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  // Load sản phẩm nổi bật
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchAllProducts();
        setProducts(data.slice(0, 12)); // lấy 12 sp nổi bật
        setLoadingProducts(false);
      } catch (err) {
        console.error(err);
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  return (
    <div className="home-page">
      {/* ==================== BANNER ==================== */}
      {/* ==================== BANNER - CHUẨN DOGOVIET.COM ==================== */}
<section className="banner-section">
  <div className="container banner-container">
    <div className="slider-wrapper">
      <div className="slider">
        <div 
          className="slider-inner"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner, idx) => (
            <div key={idx} className="slide">
              <img src={banner.src} alt={banner.alt} className="slide-img" />
            </div>
          ))}
        </div>

        <button className="slider-nav prev" onClick={prevSlide}>‹</button>
        <button className="slider-nav next" onClick={nextSlide}>›</button>

        <div className="slider-pagination">
          {banners.map((_, idx) => (
            <span
              key={idx}
              className={`dot ${idx === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
</section>

      {/* ==================== SẢN PHẨM NỔI BẬT ==================== */}
      <section className="product-section">
        <div className="container">
          <h2 className="section-title">Sản phẩm nổi bật</h2>

          <div className="product-grid">
            {loadingProducts ? (
              <p>Đang tải sản phẩm...</p>
            ) : products.length > 0 ? (
              products.map((product) => (
                <div className="product-card" key={product._id}>
                  <Link to={`/product/${product.slug}`} className="product-link">
                    <img
                      src={product.images?.[0] ?? "/placeholder.jpg"}
                      alt={product.name}
                      className="product-img"
                    />
                    <h3 className="product-name">{product.name}</h3>

                    <div className="product-price">
                      <span className="price-sale">
                        {product.priceSale.toLocaleString()}₫
                      </span>
                      {product.priceOriginal > product.priceSale && (
                        <span className="price-original">
                          {product.priceOriginal.toLocaleString()}₫
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <p>Không có sản phẩm</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;