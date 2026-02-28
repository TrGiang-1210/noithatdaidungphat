import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { getImageUrl } from "@/utils/imageUrl";
import { useLanguage } from "@/context/LanguageContext";
import { FaChevronLeft, FaChevronRight, FaClock, FaTag } from "react-icons/fa";
import "@/styles/pages/user/post.scss";

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

// ── Skeleton components ──
const FeaturedSkeleton = () => (
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
);

const CardSkeleton = () => (
  <div className="ps-card-skeleton">
    <div className="skeleton-img" />
    <div className="skeleton-body">
      <div className="skeleton-line short" />
      <div className="skeleton-line title" />
      <div className="skeleton-line" />
    </div>
  </div>
);

const Posts: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const API_URL = import.meta.env.VITE_API_URL || "https://tongkhonoithattayninh.vn/api";

  const getText = (field: any): string => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[language] || field.vi || "";
  };

  useEffect(() => {
    axios.get(`${API_URL}/post-categories`).then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const page = searchParams.get("page") || "1";
    const category = searchParams.get("category") || "";
    axios.get<PostsResponse>(`${API_URL}/posts`, { params: { page, limit: 10, category } })
      .then(r => {
        setPosts(r.data.posts);
        setTotalPages(r.data.totalPages);
        setCurrentPage(Number(page));
        setSelectedCategory(category);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleCategoryFilter = (categoryId: string) => {
    const p = new URLSearchParams();
    if (categoryId) p.set("category", categoryId);
    p.set("page", "1");
    setSearchParams(p);
  };

  const handlePageChange = (page: number) => {
    const p = new URLSearchParams(searchParams);
    p.set("page", page.toString());
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(language === "vi" ? "vi-VN" : "zh-CN", {
      year: "numeric", month: "long", day: "numeric",
    });

  // Bài đầu tiên = featured hero, phần còn lại = grid
  const [featured, ...rest] = posts;

  // Smart pagination: show max 7 page buttons
  const pageButtons = () => {
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
  };

  return (
    <div className="posts-page">

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
                    onError={e => { e.currentTarget.src = "https://via.placeholder.com/800x500?text=No+Image"; }}
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
                      {t("posts.readMore") || "Đọc tiếp"} <FaChevronRight />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* ── POSTS GRID ── */}
            {rest.length > 0 && (
              <div className="ps-grid">
                {(currentPage === 1 ? rest : posts).map((post, i) => (
                  <article key={post._id} className="ps-card" style={{ animationDelay: `${i * 0.06}s` }}>
                    <Link to={`/posts/${post.slug}`} className="ps-card-img-wrap">
                      <img
                        src={post.thumbnail ? getImageUrl(post.thumbnail) : "/placeholder-post.jpg"}
                        alt={getText(post.title)}
                        loading="lazy"
                        onError={e => { e.currentTarget.src = "https://via.placeholder.com/400x300?text=No+Image"; }}
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
                        {t("posts.readMore") || "Đọc tiếp"} <FaChevronRight />
                      </Link>
                    </div>
                  </article>
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
                  {pageButtons().map((p, i) =>
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