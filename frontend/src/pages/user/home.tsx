import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import { Link } from "react-router-dom";
import { getFirstImageUrl } from "../../utils/imageUrl";
import { useLanguage } from "../../context/LanguageContext";
import "@/styles/pages/user/home.scss";
import { ChevronRight, ChevronLeft } from "lucide-react";
import SEO from "@/components/SEO";

import banner1 from "@/assets/banner/banner1.jpg";
import banner2 from "@/assets/banner/banner2.jpg";
import banner3 from "@/assets/banner/banner3.jpg";

const API_URL =
  import.meta.env.VITE_API_URL || "https://tongkhonoithattayninh.vn/api";

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

// ─── Cache với stale-while-revalidate (10 phút stale, 30 phút max) ───
const CACHE = new Map<string, { data: any; ts: number }>();
const STALE_MS = 10 * 60 * 1000; // Dùng cache cũ ngay, revalidate ngầm
const MAX_MS = 30 * 60 * 1000; // Quá 30 phút mới block chờ

const fetchCached = async (url: string): Promise<any> => {
  const hit = CACHE.get(url);
  const now = Date.now();

  // Fresh → trả về luôn
  if (hit && now - hit.ts < STALE_MS) return hit.data;

  // Stale → trả về cache cũ NGAY, đồng thời fetch ngầm
  if (hit && now - hit.ts < MAX_MS) {
    fetch(url)
      .then((r) => r.json())
      .then((d) => CACHE.set(url, { data: d, ts: Date.now() }))
      .catch(() => {});
    return hit.data;
  }

  // Không có cache → fetch bình thường
  const res = await fetch(url);
  const data = await res.json();
  CACHE.set(url, { data, ts: now });
  return data;
};

const BANNERS = [
  { src: banner1, alt: "Banner 1" },
  { src: banner2, alt: "Banner 2" },
  { src: banner3, alt: "Banner 3" },
];

// ─── ProductCard ngoài component để không bị re-create ───
const ProductCard = memo(
  ({ product, t }: { product: Product; t: (k: string) => string }) => {
    const isOutOfStock = product.quantity <= 0;
    const discount =
      product.priceOriginal > product.priceSale && product.priceOriginal > 0
        ? Math.round(
            ((product.priceOriginal - product.priceSale) /
              product.priceOriginal) *
              100,
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
              {t("product.outOfStock")}
            </span>
          )}
          <img
            src={getFirstImageUrl(product.images)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
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
  },
);

// ─── ProductCarousel ngoài component ───
const ProductCarousel = memo(
  ({
    products,
    currentIndex,
    onPrev,
    onNext,
    t,
  }: {
    products: Product[];
    currentIndex: number;
    onPrev: () => void;
    onNext: () => void;
    t: (k: string) => string;
  }) => {
    if (products.length === 0) return null;

    const visibleProducts =
      products.length <= 4
        ? products
        : [0, 1, 2, 3].map(
            (i) => products[(currentIndex + i) % products.length],
          );

    if (products.length <= 4) {
      return (
        <div className="product-grid">
          {visibleProducts.map((p) => (
            <ProductCard key={p._id} product={p} t={t} />
          ))}
        </div>
      );
    }

    return (
      <div className="product-carousel-wrapper">
        <button className="carousel-nav prev" onClick={onPrev}>
          <ChevronLeft size={24} />
        </button>
        <div className="product-carousel">
          <div className="product-carousel-inner">
            {visibleProducts.map((p) => (
              <div key={p._id} className="carousel-item">
                <ProductCard product={p} t={t} />
              </div>
            ))}
          </div>
        </div>
        <button className="carousel-nav next" onClick={onNext}>
          <ChevronRight size={24} />
        </button>
      </div>
    );
  },
);

// ─── Skeleton placeholder ───
const ProductGridSkeleton = () => (
  <div className="product-grid">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="product-card skeleton">
        <div className="product-image skeleton-box" />
        <div className="product-info">
          <div
            className="skeleton-line"
            style={{ width: "80%", height: 14, marginBottom: 8 }}
          />
          <div className="skeleton-line" style={{ width: "50%", height: 14 }} />
        </div>
      </div>
    ))}
  </div>
);

const SectionHeader = memo(
  ({
    title,
    link,
    viewAllLabel,
  }: {
    title: string;
    link?: string;
    viewAllLabel: string;
  }) => (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {link && (
        <Link to={link} className="view-all">
          {viewAllLabel} <ChevronRight size={16} />
        </Link>
      )}
    </div>
  ),
);

// ─── Main component ───
const Home: React.FC = () => {
  const { t, language } = useLanguage();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<
    Record<string, Product[]>
  >({});

  // Progressive loading: phase 1 = products xong, phase 2 = categories xong
  const [phase, setPhase] = useState<0 | 1 | 2>(0); // 0=loading, 1=products ready, 2=all ready

  const [hotIdx, setHotIdx] = useState(0);
  const [saleIdx, setSaleIdx] = useState(0);

  // ─── Banner auto-slide ───
  useEffect(() => {
    const id = setInterval(
      () => setCurrentSlide((p) => (p + 1) % BANNERS.length),
      5000,
    );
    return () => clearInterval(id);
  }, []);

  // ─── Carousel auto-slide ───
  useEffect(() => {
    if (hotProducts.length <= 4) return;
    const id = setInterval(
      () => setHotIdx((p) => (p + 1) % hotProducts.length),
      3500,
    );
    return () => clearInterval(id);
  }, [hotProducts.length]);

  useEffect(() => {
    if (saleProducts.length <= 4) return;
    const id = setInterval(
      () => setSaleIdx((p) => (p + 1) % saleProducts.length),
      3500,
    );
    return () => clearInterval(id);
  }, [saleProducts.length]);

  // ─── Data loading với progressive rendering ───
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setPhase(0);

      try {
        // Phase 1: Lấy products + categories song song
        const [allProducts, allCategories] = await Promise.all([
          fetchCached(`${API_URL}/products?lang=${language}`),
          fetchCached(`${API_URL}/categories?lang=${language}`),
        ]);

        if (cancelled) return;

        // Xử lý products ngay → hiển thị phần trên trước
        const hotProds = allProducts.filter((p: Product) => p.hot === true);
        const saleProds = allProducts.filter((p: Product) => p.onSale === true);
        const newProds = [...allProducts]
          .sort(
            (a: Product, b: Product) =>
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime(),
          )
          .slice(0, 8);

        const parentCats = allCategories.filter(
          (c: Category) => c.parent === null || c.parent === undefined,
        );

        setHotProducts(hotProds);
        setSaleProducts(saleProds);
        setNewProducts(newProds);
        setCategories(parentCats);
        setPhase(1); // ← Render UI ngay với products

        // Phase 2: Lấy category products (filter từ allProducts trước, fallback API)
        const catProds: Record<string, Product[]> = {};

        await Promise.all(
          parentCats.slice(0, 4).map(async (cat: Category) => {
            // Tập hợp tất cả _id categories (cha + con)
            const catIds = new Set<string>([cat._id]);
            cat.children?.forEach((child) => catIds.add(child._id));

            // Thử filter từ allProducts trước (không tốn thêm request)
            const fromLocal = allProducts.filter((p: Product) =>
              p.categories?.some?.((c: any) => {
                const id = typeof c === "string" ? c : c?._id;
                return catIds.has(id);
              }),
            );

            if (fromLocal.length >= 4) {
              catProds[cat._id] = fromLocal.slice(0, 12);
              return;
            }

            // Fallback: gọi API theo slug (song song cha + con)
            const slugs = [
              cat.slug,
              ...(cat.children?.map((c) => c.slug) ?? []),
            ];
            const arrays = await Promise.all(
              slugs.map((slug) =>
                fetchCached(
                  `${API_URL}/products?category=${slug}&lang=${language}`,
                ).catch(() => []),
              ),
            );
            const merged = Array.from(
              new Map(arrays.flat().map((p: Product) => [p._id, p])).values(),
            );
            catProds[cat._id] = merged.slice(0, 12);
          }),
        );

        if (cancelled) return;
        setCategoryProducts(catProds);
        setPhase(2);
      } catch (err) {
        console.error("Lỗi load home:", err);
        setPhase(2);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const prevSlide = useCallback(
    () => setCurrentSlide((p) => (p - 1 + BANNERS.length) % BANNERS.length),
    [],
  );
  const nextSlide = useCallback(
    () => setCurrentSlide((p) => (p + 1) % BANNERS.length),
    [],
  );
  const prevHot = useCallback(
    () => setHotIdx((p) => (p - 1 + hotProducts.length) % hotProducts.length),
    [hotProducts.length],
  );
  const nextHot = useCallback(
    () => setHotIdx((p) => (p + 1) % hotProducts.length),
    [hotProducts.length],
  );
  const prevSale = useCallback(
    () =>
      setSaleIdx((p) => (p - 1 + saleProducts.length) % saleProducts.length),
    [saleProducts.length],
  );
  const nextSale = useCallback(
    () => setSaleIdx((p) => (p + 1) % saleProducts.length),
    [saleProducts.length],
  );

  return (
    <div className="home-page">
      <SEO
      title="Trang Chủ"
      description="Chuyên sản xuất nội thất gia đình, văn phòng chất lượng cao tại Tây Ninh"
      url="/"
    />
      {/* ── BANNER ── */}
      <section className="banner-section">
        <div className="container banner-container">
          <div className="slider-wrapper">
            <div className="slider">
              <div
                className="slider-inner"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {BANNERS.map((banner, idx) => (
                  <div key={idx} className="slide">
                    <img
                      src={banner.src}
                      alt={banner.alt}
                      className="slide-img"
                      loading={idx === 0 ? "eager" : "lazy"}
                      fetchPriority={idx === 0 ? "high" : "low"}
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
                {BANNERS.map((_, idx) => (
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

      {/* ── Phase 0: Loading skeleton toàn trang ── */}
      {phase === 0 && (
        <section className="product-section">
          <div className="container">
            <div className="section-header">
              <div
                className="skeleton-line"
                style={{ width: 200, height: 24 }}
              />
            </div>
            <ProductGridSkeleton />
          </div>
        </section>
      )}

      {/* ── Phase 1+: Hiện ngay khi có products ── */}
      {phase >= 1 && (
        <>
          {hotProducts.length > 0 && (
            <section className="product-section">
              <div className="container">
                <SectionHeader
                  title={t("home.hotProducts")}
                  viewAllLabel={t("common.viewAll")}
                />
                <ProductCarousel
                  products={hotProducts}
                  currentIndex={hotIdx}
                  onPrev={prevHot}
                  onNext={nextHot}
                  t={t}
                />
              </div>
            </section>
          )}

          {saleProducts.length > 0 && (
            <section className="product-section">
              <div className="container">
                <SectionHeader
                  title={t("home.saleProducts")}
                  viewAllLabel={t("common.viewAll")}
                />
                <ProductCarousel
                  products={saleProducts}
                  currentIndex={saleIdx}
                  onPrev={prevSale}
                  onNext={nextSale}
                  t={t}
                />
              </div>
            </section>
          )}

          <section className="product-section">
            <div className="container">
              <SectionHeader
                title={t("home.newProducts")}
                viewAllLabel={t("common.viewAll")}
              />
              <div className="product-grid">
                {newProducts.map((p) => (
                  <ProductCard key={p._id} product={p} t={t} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Phase 2: Category sections ── */}
      {phase >= 1 &&
        categories.slice(0, 4).map((cat) => {
          const prods = categoryProducts[cat._id];

          // Đang load category này → hiện skeleton
          if (phase === 1 && !prods) {
            return (
              <section key={cat._id} className="product-section">
                <div className="container">
                  <SectionHeader
                    title={cat.name}
                    link={`/danh-muc/${cat.slug}`}
                    viewAllLabel={t("common.viewAll")}
                  />
                  <ProductGridSkeleton />
                </div>
              </section>
            );
          }

          if (!prods || prods.length === 0) return null;

          return (
            <section key={cat._id} className="product-section">
              <div className="container">
                <SectionHeader
                  title={cat.name}
                  link={`/danh-muc/${cat.slug}`}
                  viewAllLabel={t("common.viewAll")}
                />
                <div className="product-grid">
                  {prods.map((p) => (
                    <ProductCard key={p._id} product={p} t={t} />
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
