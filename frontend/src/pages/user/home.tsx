import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFirstImageUrl } from "@/utils/imageUrl";
import "@/styles/pages/user/home.scss";
import { ChevronRight } from "lucide-react";

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
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  level: number;
}

const Home: React.FC = () => {
  const banners = [
    { src: banner1, alt: "Banner 1" },
    { src: banner2, alt: "Banner 2" },
    { src: banner3, alt: "Banner 3" },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<
    Record<string, Product[]>
  >({});
  const [loading, setLoading] = useState(true);

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

  // Load dữ liệu
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 1. Load tất cả sản phẩm
        const productsRes = await fetch("http://localhost:5000/api/products");
        const allProducts: Product[] = await productsRes.json();

        // 2. Sản phẩm bán chạy (sort theo sold, giảm dần)
        const sortedBySold = [...allProducts].sort(
          (a, b) => (b.sold || 0) - (a.sold || 0)
        );
        setBestSellers(sortedBySold.slice(0, 8));

        // 3. Sản phẩm mới (sort theo created_at, mới nhất trước)
        const sortedByDate = [...allProducts].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        setNewProducts(sortedByDate.slice(0, 8));

        // 4. Load danh mục cha (level = 0)
        const categoriesRes = await fetch(
          "http://localhost:5000/api/categories"
        );
        const allCategories: Category[] = await categoriesRes.json();

        // Flatten categories nếu API trả về dạng tree
        const flattenCategories = (cats: any[]): Category[] => {
          let result: Category[] = [];
          cats.forEach((cat) => {
            result.push(cat);
            if (cat.children && cat.children.length > 0) {
              result = result.concat(flattenCategories(cat.children));
            }
          });
          return result;
        };

        const flatCats = flattenCategories(allCategories);
        const parentCategories = flatCats.filter((cat) => cat.level === 0);
        setCategories(parentCategories);

        // 5. Load sản phẩm cho từng danh mục cha (tối đa 4 danh mục)
        const categoryProds: Record<string, Product[]> = {};
        for (const cat of parentCategories.slice(0, 4)) {
          const res = await fetch(
            `http://localhost:5000/api/products?category=${cat.slug}`
          );
          const prods = await res.json();
          categoryProds[cat._id] = prods.slice(0, 8);
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

          {/* ✅ THÊM discount-percent vào .product-price */}
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

  // Component Section Header
  const SectionHeader: React.FC<{ title: string; link?: string }> = ({
    title,
    link,
  }) => (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {link && (
        <Link to={link} className="view-all">
          Xem tất cả <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
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

      {/* ==================== SẢN PHẨM BÁN CHẠY ==================== */}
      <section className="product-section">
        <div className="container">
          <SectionHeader title="Sản phẩm bán chạy" />
          <div className="product-grid">
            {bestSellers.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SẢN PHẨM MỚI ==================== */}
      <section className="product-section">
        <div className="container">
          <SectionHeader title="Sản phẩm mới" />
          <div className="product-grid">
            {newProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== DANH MỤC CHA ==================== */}
      {categories.slice(0, 4).map((category) => (
        <section key={category._id} className="product-section">
          <div className="container">
            <SectionHeader
              title={category.name}
              link={`/danh-muc/${category.slug}`}
            />
            <div className="product-grid">
              {(categoryProducts[category._id] || []).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default Home;
