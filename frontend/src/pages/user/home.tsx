import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFirstImageUrl } from "@/utils/imageUrl";
import { useLanguage } from "@/context/LanguageContext"; // ✅ Import hook
import "@/styles/pages/user/home.scss";
import { ChevronRight, ChevronLeft } from "lucide-react";

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
  sold?: number;
  created_at?: string;
  quantity: number;
  hot?: boolean;
  onSale?: boolean;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  level: number;
  children?: Category[];
}

const Home: React.FC = () => {
  const { t } = useLanguage(); // ✅ Sử dụng hook translation

  const banners = [
    { src: banner1, alt: "Banner 1" },
    { src: banner2, alt: "Banner 2" },
    { src: banner3, alt: "Banner 3" },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<
    Record<string, Product[]>
  >({});
  const [loading, setLoading] = useState(true);
  
  // Carousel states
  const [hotCarouselIndex, setHotCarouselIndex] = useState(0);
  const [saleCarouselIndex, setSaleCarouselIndex] = useState(0);

  // Auto slide banner
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Auto slide HOT carousel
  useEffect(() => {
    if (hotProducts.length <= 4) return;
    const interval = setInterval(() => {
      setHotCarouselIndex((prev) => (prev + 1) % hotProducts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [hotProducts.length]);

  // Auto slide SALE carousel
  useEffect(() => {
    if (saleProducts.length <= 4) return;
    const interval = setInterval(() => {
      setSaleCarouselIndex((prev) => (prev + 1) % saleProducts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [saleProducts.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevHotCarousel = () => {
    setHotCarouselIndex((prev) => (prev - 1 + hotProducts.length) % hotProducts.length);
  };

  const nextHotCarousel = () => {
    setHotCarouselIndex((prev) => (prev + 1) % hotProducts.length);
  };

  const prevSaleCarousel = () => {
    setSaleCarouselIndex((prev) => (prev - 1 + saleProducts.length) % saleProducts.length);
  };

  const nextSaleCarousel = () => {
    setSaleCarouselIndex((prev) => (prev + 1) % saleProducts.length);
  };

  // Load dữ liệu
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const productsRes = await fetch("http://localhost:5000/api/products");
        const allProducts: Product[] = await productsRes.json();

        const hotProds = allProducts.filter(p => p.hot === true);
        setHotProducts(hotProds);

        const saleProds = allProducts.filter(p => p.onSale === true);
        setSaleProducts(saleProds);

        const sortedByDate = [...allProducts].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        setNewProducts(sortedByDate.slice(0, 8));

        const categoriesRes = await fetch(
          "http://localhost:5000/api/categories"
        );
        const allCategories: Category[] = await categoriesRes.json();

        const parentCategories = allCategories.filter((cat) => !cat.parent);
        setCategories(parentCategories);

        const categoryProds: Record<string, Product[]> = {};

        for (const cat of parentCategories.slice(0, 4)) {
          try {
            let url = `http://localhost:5000/api/products?category=${cat.slug}`;
            const res = await fetch(url);
            const prods = await res.json();
            categoryProds[cat._id] = Array.isArray(prods)
              ? prods.slice(0, 8)
              : [];
          } catch (err) {
            console.error(`Error loading products for ${cat.name}:`, err);
            categoryProds[cat._id] = [];
          }
        }

        setCategoryProducts(categoryProds);
      } catch (error) {
        console.error("Lỗi load dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Component ProductCard
  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const isOutOfStock = product.quantity <= 0;

    const discount =
      product.priceOriginal > product.priceSale
        ? Math.round(
            ((product.priceOriginal - product.priceSale) /
              product.priceOriginal) *
              100
          )
        : 0;

    return (
      <Link
        to={`/san-pham/${product.slug}`}
        className={`product-card ${isOutOfStock ? "out-of-stock" : ""}`}
      >
        <div className="product-image">
          {isOutOfStock && (
            <span className="badge out-of-stock-badge">
              {t('product.outOfStock')} {/* ✅ Dịch */}
            </span>
          )}

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

  // Component ProductCarousel
  const ProductCarousel: React.FC<{
    products: Product[];
    currentIndex: number;
    onPrev: () => void;
    onNext: () => void;
  }> = ({ products, currentIndex, onPrev, onNext }) => {
    if (products.length === 0) return null;

    // Nếu <= 4 sản phẩm, hiển thị bình thường không cần carousel
    if (products.length <= 4) {
      return (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      );
    }

    // Lấy 4 sản phẩm liên tiếp từ currentIndex
    const getVisibleProducts = () => {
      const visible = [];
      for (let i = 0; i < 4; i++) {
        visible.push(products[(currentIndex + i) % products.length]);
      }
      return visible;
    };

    const visibleProducts = getVisibleProducts();

    return (
      <div className="product-carousel-wrapper">
        <button className="carousel-nav prev" onClick={onPrev}>
          <ChevronLeft size={24} />
        </button>
        
        <div className="product-carousel">
          <div className="product-carousel-inner">
            {visibleProducts.map((product) => (
              <div key={product._id} className="carousel-item">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        <button className="carousel-nav next" onClick={onNext}>
          <ChevronRight size={24} />
        </button>
      </div>
    );
  };

  // Component Section Header
  const SectionHeader: React.FC<{ title: string; link?: string }> = ({
    title,
    link,
  }) => (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {link && (
        <Link to={link} className="view-all">
          {t('common.viewAll')} <ChevronRight size={16} /> {/* ✅ Dịch */}
        </Link>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p> {/* ✅ Dịch */}
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* ==================== BANNER ==================== */}
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
                    <img
                      src={banner.src}
                      alt={banner.alt}
                      className="slide-img"
                    />
                  </div>
                ))}
              </div>

              <button className="slider-nav prev" onClick={prevSlide}>
                ‹
              </button>
              <button className="slider-nav next" onClick={nextSlide}>
                ›
              </button>

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

      {/* ==================== SẢN PHẨM HOT ==================== */}
      {hotProducts.length > 0 && (
        <section className="product-section">
          <div className="container">
            <SectionHeader title={t('home.hotProducts')} /> {/* ✅ Dịch */}
            <ProductCarousel
              products={hotProducts}
              currentIndex={hotCarouselIndex}
              onPrev={prevHotCarousel}
              onNext={nextHotCarousel}
            />
          </div>
        </section>
      )}

      {/* ==================== SẢN PHẨM SIÊU GIẢM GIÁ ==================== */}
      {saleProducts.length > 0 && (
        <section className="product-section">
          <div className="container">
            <SectionHeader title={t('home.saleProducts')} /> {/* ✅ Dịch */}
            <ProductCarousel
              products={saleProducts}
              currentIndex={saleCarouselIndex}
              onPrev={prevSaleCarousel}
              onNext={nextSaleCarousel}
            />
          </div>
        </section>
      )}

      {/* ==================== SẢN PHẨM MỚI ==================== */}
      <section className="product-section">
        <div className="container">
          <SectionHeader title={t('home.newProducts')} /> {/* ✅ Dịch */}
          <div className="product-grid">
            {newProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== DANH MỤC CHA VÀ SẢN PHẨM ==================== */}
      {categories.slice(0, 4).map((category) => {
        const products = categoryProducts[category._id] || [];

        if (products.length === 0) return null;

        return (
          <section key={category._id} className="product-section">
            <div className="container">
              <SectionHeader
                title={category.name}
                link={`/danh-muc/${category.slug}`}
              />
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Home;