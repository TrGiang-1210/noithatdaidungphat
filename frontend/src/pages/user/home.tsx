import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getFirstImageUrl } from "../../utils/imageUrl";
import { useLanguage } from "../../context/LanguageContext";
import "@/styles/pages/user/home.scss";
import { ChevronRight, ChevronLeft } from "lucide-react";

// Banner images - GIỮ NGUYÊN như code gốc
import banner1 from "@/assets/banner/banner1.jpg";
import banner2 from "@/assets/banner/banner2.jpg";
import banner3 from "@/assets/banner/banner3.jpg";

const API_URL = import.meta.env.VITE_API_URL || 'https://tongkhonoithattayninh.vn/api';

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
  parent?: string | null;
  children?: Category[];
}

// ✅ API CACHE - Lưu kết quả API trong 1 phút (giảm từ 5 phút để test dễ hơn)
const API_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1 * 60 * 1000; // 1 phút

const fetchWithCache = async (url: string, forceRefresh = false) => {
  const cached = API_CACHE.get(url);
  const now = Date.now();

  // Skip cache nếu forceRefresh = true
  if (!forceRefresh && cached && now - cached.timestamp < CACHE_DURATION) {
    console.log('📦 Using cached data for:', url);
    return cached.data;
  }

  console.log('🌐 Fetching fresh data from:', url);
  const response = await fetch(url);
  const data = await response.json();
  API_CACHE.set(url, { data, timestamp: now });
  return data;
};

const Home: React.FC = () => {
  const { t, language } = useLanguage();

  // ✅ useMemo cho banners
  const banners = useMemo(
    () => [
      { src: banner1, alt: "Banner 1" },
      { src: banner2, alt: "Banner 2" },
      { src: banner3, alt: "Banner 3" },
    ],
    []
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);

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

  // ✅ OPTIMIZED DATA LOADING - Gọi API song song và có cache
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('🚀 Loading home page data...');

        // ✅ GỌI API SONG SONG thay vì tuần tự
        const [allProducts, allCategories] = await Promise.all([
          fetchWithCache(`https://tongkhonoithattayninh.vn/api/products?lang=${language}`),
          fetchWithCache(`https://tongkhonoithattayninh.vn/api/categories?lang=${language}`),
        ]);

        console.log('📦 Loaded:', allProducts.length, 'products', allCategories.length, 'categories');

        // Filter products (client-side filtering nhanh hơn nhiều API calls)
        const hotProds = allProducts.filter((p: Product) => p.hot === true);
        setHotProducts(hotProds);

        const saleProds = allProducts.filter((p: Product) => p.onSale === true);
        setSaleProducts(saleProds);

        const sortedByDate = [...allProducts].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        setNewProducts(sortedByDate.slice(0, 8));

        const parentCategories = allCategories.filter((cat: Category) => cat.parent === null || cat.parent === undefined);
        setCategories(parentCategories);

        // ✅ DEBUG: Kiểm tra categories có children không
        console.log('📦 Parent Categories:', parentCategories.map(c => ({
          name: c.name,
          slug: c.slug,
          childrenCount: c.children?.length || 0,
          children: c.children?.map(child => child.name)
        })));

        // ✅ GỌI API CATEGORY PRODUCTS SONG SONG - Lấy cả products từ category con
        const categoryProds: Record<string, Product[]> = {};
        const categoryPromises = parentCategories.slice(0, 4).map(async (cat: Category) => {
          try {
            // Lấy tất cả slugs: category cha + tất cả category con
            const categorySlugs: string[] = [cat.slug];
            if (cat.children && cat.children.length > 0) {
              cat.children.forEach(child => categorySlugs.push(child.slug));
            }

            // ✅ DEBUG: Xem slugs được thu thập
            console.log(`📂 Category "${cat.name}":`, {
              mainSlug: cat.slug,
              allSlugs: categorySlugs,
              childrenCount: cat.children?.length || 0
            });

            // Gọi API song song cho tất cả categories
            const productsArrays = await Promise.all(
              categorySlugs.map(slug =>
                fetchWithCache(
                  `https://tongkhonoithattayninh.vn/api/products?category=${slug}&lang=${language}`
                ).catch(() => []) // Nếu lỗi thì trả về mảng rỗng
              )
            );

            // Gộp tất cả products lại, loại bỏ trùng lặp theo _id
            const allProducts = productsArrays.flat();
            const uniqueProducts = Array.from(
              new Map(allProducts.map((p: Product) => [p._id, p])).values()
            );

            // ✅ DEBUG: Xem kết quả
            console.log(`✅ Category "${cat.name}": ${uniqueProducts.length} products (from ${categorySlugs.length} categories)`);

            // Giới hạn 12 sản phẩm
            categoryProds[cat._id] = uniqueProducts.slice(0, 12);
          } catch (err) {
            console.error(`Error loading products for ${cat.name}:`, err);
            categoryProds[cat._id] = [];
          }
        });

        await Promise.all(categoryPromises);
        setCategoryProducts(categoryProds);

        // ✅ TỔNG KẾT
        console.log('🎉 Data loading completed!');
        console.log('📊 Summary:', {
          hotProducts: hotProds.length,
          saleProducts: saleProds.length,
          newProducts: sortedByDate.slice(0, 8).length,
          categorySections: Object.keys(categoryProds).length,
          categoryProducts: Object.entries(categoryProds).map(([id, prods]) => {
            const cat = parentCategories.find(c => c._id === id);
            return {
              category: cat?.name,
              productCount: prods.length
            };
          })
        });

      } catch (error) {
        console.error("Lỗi load dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [language]);

  // ✅ OPTIMIZED PRODUCT CARD với React.memo
  const ProductCard: React.FC<{ product: Product }> = React.memo(({ product }) => {
    const isOutOfStock = product.quantity <= 0;

    const discount = useMemo(() => {
      return product.priceOriginal > product.priceSale
        ? Math.round(((product.priceOriginal - product.priceSale) / product.priceOriginal) * 100)
        : 0;
    }, [product.priceOriginal, product.priceSale]);

    return (
      <Link
        to={`/san-pham/${product.slug}`}
        className={`product-card ${isOutOfStock ? "out-of-stock" : ""}`}
      >
        <div className="product-image">
          {isOutOfStock && (
            <span className="badge out-of-stock-badge">{t("product.outOfStock")}</span>
          )}

          <img
            src={getFirstImageUrl(product.images)}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>

          <div className="product-price">
            <div className="price-left">
              <span className="price-sale">{product.priceSale.toLocaleString()}₫</span>
              {discount > 0 && (
                <span className="price-original">{product.priceOriginal.toLocaleString()}₫</span>
              )}
            </div>
            {discount > 0 && <span className="discount-percent">-{discount}%</span>}
          </div>
        </div>
      </Link>
    );
  });

  // ✅ OPTIMIZED CAROUSEL với React.memo
  const ProductCarousel: React.FC<{
    products: Product[];
    currentIndex: number;
    onPrev: () => void;
    onNext: () => void;
  }> = React.memo(({ products, currentIndex, onPrev, onNext }) => {
    if (products.length === 0) return null;

    if (products.length <= 4) {
      return (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      );
    }

    const visibleProducts = useMemo(() => {
      const visible = [];
      for (let i = 0; i < 4; i++) {
        visible.push(products[(currentIndex + i) % products.length]);
      }
      return visible;
    }, [products, currentIndex]);

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
  });

  const SectionHeader: React.FC<{ title: string; link?: string }> = React.memo(
    ({ title, link }) => (
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {link && (
          <Link to={link} className="view-all">
            {t("common.viewAll")} <ChevronRight size={16} />
          </Link>
        )}
      </div>
    )
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t("common.loading")}</p>
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
                      loading={idx === 0 ? "eager" : "lazy"}
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
            <SectionHeader title={t("home.hotProducts")} />
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
            <SectionHeader title={t("home.saleProducts")} />
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
          <SectionHeader title={t("home.newProducts")} />
          <div className="product-grid">
            {newProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== DANH MỤC CHA VÀ SẢN PHẨM (bao gồm cả products từ danh mục con) ==================== */}
      {categories.slice(0, 4).map((category) => {
        const products = categoryProducts[category._id] || [];

        if (products.length === 0) return null;

        return (
          <section key={category._id} className="product-section">
            <div className="container">
              <SectionHeader title={category.name} link={`/danh-muc/${category.slug}`} />
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