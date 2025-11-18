import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { fetchHomeData } from "../../api/user/homeAPI";
import { fetchAllProducts } from "../../api/user/productAPI";
import "@/styles/pages/user/home.scss";

// Banner images
import banner1 from "@/assets/banner/banner1.jpg";
import banner2 from "@/assets/banner/banner2.jpg";
import banner3 from "@/assets/banner/banner3.jpg";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  slug: string;
  name: string;
  images: string[];
  priceOriginal: number;
  priceSale: number;
}

const Home: React.FC = () => {
  /* --------------------------------------------------------------------- */
  /* Banners */
  /* --------------------------------------------------------------------- */
  const banners = [
    { src: banner1, alt: "Banner 1" },
    { src: banner2, alt: "Banner 2" },
    { src: banner3, alt: "Banner 3" },
  ];

  /* --------------------------------------------------------------------- */
  /* State */
  /* --------------------------------------------------------------------- */
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const sliderWrapperRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  /* --------------------------------------------------------------------- */
  /* Load data – chỉ 1 lần */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
  const loadHome = async () => {
    try {
      // 1. Lấy categories từ /api/home
      const homeData = await fetchHomeData();
      setCategories(Array.isArray(homeData.categories) ? homeData.categories : []);

      // 2. LẤY TOÀN BỘ SẢN PHẨM từ /api/products
      const allProducts = await fetchAllProducts();
      setProducts(Array.isArray(allProducts) ? allProducts : []);

      setLoadingCategories(false);
      setLoadingProducts(false);
    } catch (err) {
      console.error("Error:", err);
      setCategories([]);
      setProducts([]);
      setLoadingCategories(false);
      setLoadingProducts(false);
    }
  };

  loadHome();
}, []);

  /* --------------------------------------------------------------------- */
  /* Auto slide */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlide, banners.length]);

  /* --------------------------------------------------------------------- */
  /* Slider helpers */
  /* --------------------------------------------------------------------- */
  const transitionSlide = (newSlide: number) => {
    if (sliderWrapperRef.current) {
      sliderWrapperRef.current.style.transition = "transform 0.5s ease";
      sliderWrapperRef.current.style.transform = `translateX(-${newSlide * 100}%)`;
    }
    setCurrentSlide(newSlide);
  };

  const prevSlide = () => {
    const newSlide = (currentSlide - 1 + banners.length) % banners.length;
    transitionSlide(newSlide);
  };

  const nextSlide = () => {
    const newSlide = (currentSlide + 1) % banners.length;
    transitionSlide(newSlide);
  };

  /* --------------------------------------------------------------------- */
  /* Swipe handling */
  /* --------------------------------------------------------------------- */
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = "touches" in e ? e.touches[0].clientX : e.clientX;
    currentXRef.current = startXRef.current;

    if (sliderWrapperRef.current) {
      sliderWrapperRef.current.style.transition = "none";
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    currentXRef.current = "touches" in e ? e.touches[0].clientX : e.clientX;
    const deltaX = currentXRef.current - startXRef.current;

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      if (sliderWrapperRef.current) {
        const currentTranslate = -currentSlide * 100;
        const offset = (deltaX / sliderWrapperRef.current!.clientWidth) * 100;
        sliderWrapperRef.current!.style.transform = `translateX(${currentTranslate + offset}%)`;
      }
    });
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const deltaX = currentXRef.current - startXRef.current;
    const threshold = 50;
    const velocity = Math.abs(deltaX) / 100;

    if (Math.abs(deltaX) > threshold || velocity > 1.5) {
      deltaX < 0 ? nextSlide() : prevSlide();
    } else {
      // snap back
      if (sliderWrapperRef.current) {
        sliderWrapperRef.current.style.transition = "transform 0.3s ease-out";
        sliderWrapperRef.current.style.transform = `translateX(-${currentSlide * 100}%)`;
      }
    }
  };

  /* --------------------------------------------------------------------- */
  /* Render */
  /* --------------------------------------------------------------------- */
  return (
    <div className="home-page">
      {/* ==================== BANNER ==================== */}
      <section className="banner-section">
        <div className="container banner-layout">
          {/* ---- Categories ---- */}
          <div className="category-col">
            <h3 className="category-title">Danh mục sản phẩm</h3>
            {loadingCategories ? (
              <p>Đang tải...</p>
            ) : categories.length > 0 ? (
              <ul className="category-list">
                {categories.map((cat) => (
                  <li key={cat._id}>
                    <Link to={`/${cat.slug}`}>{cat.name}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Không có danh mục</p>
            )}
          </div>

          {/* ---- Slider ---- */}
          <div className="slider-col">
            <div
              className="slider"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={handleTouchMove}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              <div className="slider-wrapper" ref={sliderWrapperRef}>
                {banners.map((banner, idx) => (
                  <img
                    key={idx}
                    src={banner.src}
                    alt={banner.alt}
                    className="slider-img"
                  />
                ))}
              </div>

              <button className="slider-btn prev" onClick={prevSlide}>
                Previous
              </button>
              <button className="slider-btn next" onClick={nextSlide}>
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PRODUCTS ==================== */}
      <section className="product-section">
        <div className="container">
          <h2 className="section-title">Sản phẩm nổi bật</h2>

          <div className="product-grid">
            {loadingProducts ? (
              <p>Đang tải sản phẩm...</p>
            ) : products.length > 0 ? (
              products.map((product) => (
                <div className="product-card" key={product._id}>
                  <Link to={`/product/${product.slug}`}>
                    <img
                      src={product.images?.[0] ?? "placeholder.jpg"}
                      alt={product.name}
                      className="product-img"
                    />
                    <h3 className="product-name">{product.name}</h3>
                  </Link>

                  <div className="product-price">
                    <span className="price-sale">
                      {product.priceSale.toLocaleString()}₫
                    </span>
                    <span className="price-original">
                      {product.priceOriginal.toLocaleString()}₫
                    </span>
                  </div>
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