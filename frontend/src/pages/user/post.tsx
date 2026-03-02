import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { getImageUrl } from "@/utils/imageUrl";
import { useLanguage } from "@/context/LanguageContext";
import { FaChevronLeft, FaChevronRight, FaClock, FaTag } from "react-icons/fa";
import "@/styles/pages/user/post.scss";
import SEO from "../../components/SEO";

interface PostCategory {
  _id: string;
  name: { vi: string; zh: string };
  slug: string;
}

interface Post {
  _id: string;
  title: { vi: string; zh: string };
  slug: string;
  thumbnail: string;
  description: { vi: string; zh: string };
  category_id: PostCategory;
  created_at: string;
}

interface PostsResponse {
  posts: Post[];
  totalPages: number;
  currentPage: number;
}

const API_URL = import.meta.env.VITE_API_URL || "https://tongkhonoithattayninh.vn/api";

// ── Skeleton components (memoized) ──
const FeaturedSkeleton = memo(() => (
  <div className="ps-featured-skeleton">
    <div className="skeleton-img" />
    <div className="skeleton-body">
      <div className="skeleton-line short" />
      <div className="skeleton-line title" />
      <div className="skeleton-line title w70" />
      <div className="skeleton-line" />
      <div className="skeleton-line w80" />
    </div>
  </div>
));

const CardSkeleton = memo(() => (
  <div className="ps-card-skeleton">
    <div className="skeleton-img" />
    <div className="skeleton-body">
      <div className="skeleton-line short" />
      <div className="skeleton-line title" />
      <div className="skeleton-line" />
    </div>
  </div>
));

// ── Memoized PostCard to avoid re-renders ──
const PostCard = memo(({ post, index, getText, formatDate, readMore }: {
  post: Post;
  index: number;
  getText: (field: any) => string;
  formatDate: (d: string) => string;
  readMore: string;
}) => (
  <article className="ps-card" style={{ animationDelay: `${index * 0.06}s` }}>
    <Link to={`/posts/${post.slug}`} className="ps-card-img-wrap">
      <img
        src={post.thumbnail ? getImageUrl(post.thumbnail) : "/placeholder-post.jpg"}
        alt={getText(post.title)}
        loading="lazy"
        decoding="async"
        width={400}
        height={300}
        onError={e => { e.currentTarget.src = "/placeholder-post.jpg"; }}
      />
      {post.category_id && (
        <span className="ps-badge">{getText(post.category_id.name)}</span>
      )}
    </Link>
    <div className="ps-card-body">
      <time className="ps-card-date">
        <FaClock /> {formatDate(post.created_at)}
      </time>
      <h3 className="ps-card-title">
        <Link to={`/posts/${post.slug}`}>{getText(post.title)}</Link>
      </h3>
      <p className="ps-card-desc">{getText(post.description)}</p>
      <Link to={`/posts/${post.slug}`} className="ps-card-more">
        {readMore} <FaChevronRight />
      </Link>
    </div>
  </article>
));

// ── Pagination buttons helper (pure, outside component) ──
function buildPageButtons(currentPage: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | '…')[] = [];
  if (currentPage <= 4) {
    pages.push(1, 2, 3, 4, 5, '…', totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages);
  }
  return pages;
}

// ── Simple in-memory cache ──
const postsCache = new Map<string, { data: PostsResponse; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute

const Posts: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  // Stable getText — depends only on language
  const getText = useCallback((field: any): string => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[language] || field.vi || "";
  }, [language]);

  // Stable formatDate — depends only on language
  const formatDate = useCallback((d: string) =>
    new Date(d).toLocaleDateString(language === "vi" ? "vi-VN" : "zh-CN", {
      year: "numeric", month: "long", day: "numeric",
    }), [language]);

  // Fetch categories ONCE, cache in module scope
  const categoriesFetched = useRef(false);
  useEffect(() => {
    if (categoriesFetched.current) return;
    categoriesFetched.current = true;
    axios.get(`${API_URL}/post-categories`).then(r => setCategories(r.data)).catch(() => {});
  }, []);

  // Fetch posts with caching + abort on param change
  useEffect(() => {
    const page = searchParams.get("page") || "1";
    const category = searchParams.get("category") || "";
    const cacheKey = `${page}__${category}`;
    const cached = postsCache.get(cacheKey);

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      // Instant render from cache — no loading flash
      const d = cached.data;
      setPosts(d.posts);
      setTotalPages(d.totalPages);
      setCurrentPage(Number(page));
      setSelectedCategory(category);
      setLoading(false);
      return;
    }

    // Cancel previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    axios.get<PostsResponse>(`${API_URL}/posts`, {
      params: { page, limit: 10, category },
      signal: controller.signal,
    })
      .then(r => {
        postsCache.set(cacheKey, { data: r.data, ts: Date.now() });
        setPosts(r.data.posts);
        setTotalPages(r.data.totalPages);
        setCurrentPage(Number(page));
        setSelectedCategory(category);
      })
      .catch(err => { if (axios.isCancel(err)) return; })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [searchParams]);

  const handleCategoryFilter = useCallback((categoryId: string) => {
    const p = new URLSearchParams();
    if (categoryId) p.set("category", categoryId);
    p.set("page", "1");
    setSearchParams(p);
  }, [setSearchParams]);

  const handlePageChange = useCallback((page: number) => {
    const p = new URLSearchParams(searchParams);
    p.set("page", page.toString());
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchParams, setSearchParams]);

  const [featured, ...rest] = posts;
  const pageButtons = buildPageButtons(currentPage, totalPages);
  const readMore = t("posts.readMore") || "Đọc tiếp";
  const gridPosts = currentPage === 1 ? rest : posts;

  return (
    <div className="posts-page">
      <SEO title="Tin Tức" description="Tin tức nội thất mới nhất" url="/posts" />
      {/* ── HERO ── */}
      <div className="ps-hero">
        <div className="ps-hero-inner">
          <div className="ps-hero-eyebrow"><FaTag /> Tin tức & Nội dung</div>
          <h1>{t("posts.pageTitle") || "Tin Tức & Cảm Hứng Nội Thất"}</h1>
          <p>{t("posts.pageSubtitle") || "Xu hướng thiết kế, mẹo bài trí và cập nhật mới nhất từ Đại Dũng Phát"}</p>
        </div>
      </div>

      <div className="ps-wrap">

        {/* ── CATEGORY FILTER BAR ── */}
        <div className="ps-filter-bar">
          <div className="ps-filter-scroll">
            <button
              className={`ps-filter-pill ${!selectedCategory ? 'active' : ''}`}
              onClick={() => handleCategoryFilter("")}
            >
              {t("posts.allCategories") || "Tất cả"}
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                className={`ps-filter-pill ${selectedCategory === cat._id ? 'active' : ''}`}
                onClick={() => handleCategoryFilter(cat._id)}
              >
                {getText(cat.name)}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div className="ps-loading-layout">
            <FeaturedSkeleton />
            <div className="ps-grid">
              {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="ps-empty">
            <div className="ps-empty-icon">📭</div>
            <p>{t("posts.noPosts") || "Chưa có bài viết nào."}</p>
          </div>
        ) : (
          <>
            {/* ── FEATURED POST ── */}
            {featured && currentPage === 1 && (
              <Link to={`/posts/${featured.slug}`} className="ps-featured">
                <div className="ps-featured-img">
                  <img
                    src={featured.thumbnail ? getImageUrl(featured.thumbnail) : "/placeholder-post.jpg"}
                    alt={getText(featured.title)}
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    width={800}
                    height={500}
                    onError={e => { e.currentTarget.src = "/placeholder-post.jpg"; }}
                  />
                  {featured.category_id && (
                    <span className="ps-badge">{getText(featured.category_id.name)}</span>
                  )}
                </div>
                <div className="ps-featured-body">
                  <div className="ps-featured-eyebrow">Bài viết nổi bật</div>
                  <h2 className="ps-featured-title">{getText(featured.title)}</h2>
                  <p className="ps-featured-desc">{getText(featured.description)}</p>
                  <div className="ps-featured-meta">
                    <FaClock className="meta-icon" />
                    <time>{formatDate(featured.created_at)}</time>
                    <span className="ps-read-more">
                      {readMore} <FaChevronRight />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* ── POSTS GRID ── */}
            {gridPosts.length > 0 && (
              <div className="ps-grid">
                {gridPosts.map((post, i) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    index={i}
                    getText={getText}
                    formatDate={formatDate}
                    readMore={readMore}
                  />
                ))}
              </div>
            )}

            {/* ── PAGINATION ── */}
            {totalPages > 1 && (
              <div className="ps-pagination">
                <button
                  className="ps-pg-btn arrow"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Trang trước"
                >
                  <FaChevronLeft />
                </button>

                <div className="ps-pg-numbers">
                  {pageButtons.map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="ps-pg-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`ps-pg-btn ${currentPage === p ? 'active' : ''}`}
                        onClick={() => handlePageChange(p as number)}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  className="ps-pg-btn arrow"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Trang sau"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Posts;