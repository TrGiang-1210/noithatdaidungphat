import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from "@/utils/imageUrl";
import { useLanguage } from "@/context/LanguageContext";
import { ChevronRight, ChevronLeft, Clock, Tag, ArrowLeft } from "lucide-react";
import "@/styles/pages/user/postDetail.scss";

// ── Types ──────────────────────────────────────────────────────────
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
  content: { vi: string; zh: string };
  category_id: PostCategory;
  tags: string[];
  meta_title?: { vi: string; zh: string };
  meta_description?: { vi: string; zh: string };
  created_at: string;
  updated_at: string;
}

// ── Module-level constants ─────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || 'https://tongkhonoithattayninh.vn/api';
const FALLBACK_IMG = '/placeholder-post.jpg';

// ── Module-level cache ─────────────────────────────────────────────
const postCache = new Map<string, { data: Post; ts: number }>();
const relatedCache = new Map<string, { data: Post[]; ts: number }>();
const CACHE_TTL = 120_000; // 2 minutes

// ── Image processor (run once per content, pure function) ──────────
function processContentImages(html: string, getImgUrl: (s: string) => string): string {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;

  div.querySelectorAll('img').forEach(img => {
    // ── 1. Fix src URL ──
    let src = (img.getAttribute('src') || '').trim();
    if (!src) return;
    if (!src.startsWith('http') && !src.startsWith('data:')) {
      if (src.startsWith('/uploads')) src = getImgUrl(src);
      else if (src.startsWith('uploads/')) src = getImgUrl('/' + src);
      else src = getImgUrl('/uploads/posts/' + src);
    }
    img.setAttribute('src', src);

    // ── 2. Performance attrs ──
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    img.removeAttribute('onerror');
    if (!img.hasAttribute('alt')) img.setAttribute('alt', 'Hình ảnh bài viết');

    // ── 3. Strip ALL inline styles that cause misalignment ──
    //    Editors (TipTap, Quill, CKEditor) often inject:
    //    float, width, margin, display, position, etc.
    img.removeAttribute('style');
    img.removeAttribute('width');
    img.removeAttribute('height');
    img.removeAttribute('align');

    // ── 4. Lift image out of <p> if it's the only child ──
    //    <p><img></p>  →  <figure class="pd-img-wrap"><img></figure>
    //    This prevents the image from being constrained by p's text layout
    const parent = img.parentElement;
    if (parent && parent.tagName === 'P') {
      const siblings = Array.from(parent.childNodes).filter(
        n => !(n.nodeType === Node.TEXT_NODE && n.textContent?.trim() === '')
      );
      const onlyImg = siblings.length === 1 && siblings[0] === img;
      const startsWithImg = siblings[0] === img && siblings.length <= 2;

      if (onlyImg || startsWithImg) {
        // Replace <p><img></p> with <figure class="pd-img-wrap"><img></figure>
        const figure = document.createElement('figure');
        figure.className = 'pd-img-wrap';
        parent.replaceWith(figure);
        figure.appendChild(img);
        return;
      }
    }

    // ── 5. If image is directly in a <figure>, add class ──
    if (parent && parent.tagName === 'FIGURE') {
      parent.classList.add('pd-img-wrap');
    }
  });

  // ── 6. Handle consecutive images: wrap groups in a flex row ──
  //    <figure><img></figure><figure><img></figure>  →  <div class="pd-img-row">...</div>
  const allFigures = Array.from(div.querySelectorAll('figure.pd-img-wrap'));
  let i = 0;
  while (i < allFigures.length) {
    const fig = allFigures[i];
    const group: Element[] = [fig];

    let next = fig.nextElementSibling;
    while (next && next.tagName === 'FIGURE' && next.classList.contains('pd-img-wrap')) {
      group.push(next);
      next = next.nextElementSibling;
    }

    if (group.length >= 2) {
      const row = document.createElement('div');
      row.className = 'pd-img-row';
      fig.parentNode?.insertBefore(row, fig);
      group.forEach(el => row.appendChild(el));
      i += group.length;
    } else {
      i++;
    }
  }

  return div.innerHTML;
}

// ── Skeleton ───────────────────────────────────────────────────────
const PostDetailSkeleton = memo(() => (
  <div className="pd-skeleton">
    <div className="pd-skeleton__hero" />
    <div className="pd-skeleton__wrap">
      <div className="pd-skeleton__pill" />
      <div className="pd-skeleton__title" />
      <div className="pd-skeleton__title w70" />
      <div className="pd-skeleton__meta" />
      <div className="pd-skeleton__desc" />
      <div className="pd-skeleton__desc w85" />
      <div className="pd-skeleton__img" />
      {[1,2,3,4,5].map(i => (
        <div key={i} className={`pd-skeleton__line ${i % 3 === 0 ? 'w80' : ''}`} />
      ))}
    </div>
  </div>
));

// ── Related Post Card ──────────────────────────────────────────────
const RelatedCard = memo(({ post, getText, formatDate }: {
  post: Post;
  getText: (f: any) => string;
  formatDate: (d: string) => string;
}) => (
  <Link to={`/posts/${post.slug}`} className="pd-rcard">
    <div className="pd-rcard__img-wrap">
      <img
        src={post.thumbnail ? getImageUrl(post.thumbnail) : FALLBACK_IMG}
        alt={getText(post.title)}
        loading="lazy"
        decoding="async"
        width={320}
        height={240}
        onError={e => { e.currentTarget.src = FALLBACK_IMG; }}
      />
      {post.category_id && (
        <span className="pd-rcard__badge">{getText(post.category_id.name)}</span>
      )}
    </div>
    <div className="pd-rcard__body">
      <time className="pd-rcard__date"><Clock size={12} />{formatDate(post.created_at)}</time>
      <h3 className="pd-rcard__title">{getText(post.title)}</h3>
      <p className="pd-rcard__desc">{getText(post.description)}</p>
    </div>
  </Link>
));

// ── Reading Progress Bar ───────────────────────────────────────────
const ReadingProgress = memo(() => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div className="pd-progress" style={{ width: `${pct}%` }} aria-hidden />;
});

// ── Table of Contents ──────────────────────────────────────────────
const TableOfContents = memo(({ html }: { html: string }) => {
  const headings = React.useMemo(() => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const hs = Array.from(div.querySelectorAll('h2, h3'));
    return hs.map((h, i) => ({
      id: `heading-${i}`,
      text: h.textContent || '',
      level: h.tagName === 'H2' ? 2 : 3,
    }));
  }, [html]);

  const [active, setActive] = useState('');

  // Inject IDs into rendered headings
  useEffect(() => {
    headings.forEach(({ id }, i) => {
      const el = document.querySelectorAll('.pd-content h2, .pd-content h3')[i] as HTMLElement;
      if (el) el.id = id;
    });
  }, [headings]);

  // Observe which heading is in view
  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav className="pd-toc" aria-label="Mục lục">
      <div className="pd-toc__label">Mục lục</div>
      <ol className="pd-toc__list">
        {headings.map(({ id, text, level }) => (
          <li key={id} className={`pd-toc__item level-${level} ${active === id ? 'active' : ''}`}>
            <a href={`#${id}`} onClick={e => {
              e.preventDefault();
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}>{text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
});

// ── Main Component ─────────────────────────────────────────────────
const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const getText = useCallback((field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[language] || field.vi || '';
  }, [language]);

  const formatDate = useCallback((d: string) =>
    new Date(d).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric',
    }), [language]);

  // Fetch post with cache
  useEffect(() => {
    if (!slug) return;
    const cacheKey = `${slug}__${language}`;
    const cached = postCache.get(cacheKey);

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setPost(cached.data);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(false);
    setImgLoaded(false);

    axios.get<Post>(`${API_URL}/posts/${slug}`, { signal: ctrl.signal })
      .then(r => {
        postCache.set(cacheKey, { data: r.data, ts: Date.now() });
        setPost(r.data);

        // Update document title
        const title = getText(r.data.meta_title) || `${getText(r.data.title)} - Nội Thất Đại Dũng Phát`;
        document.title = title;
      })
      .catch(err => { if (!axios.isCancel(err)) setError(true); })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [slug, language]);

  // Fetch related posts with cache (only after main post loads)
  useEffect(() => {
    if (!post?.category_id?._id) return;
    const key = post.category_id._id;
    const cached = relatedCache.get(key);

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setRelatedPosts(cached.data.filter(p => p._id !== post._id).slice(0, 8));
      return;
    }

    // Deferred fetch — don't block main content
    const timer = setTimeout(() => {
      axios.get(`${API_URL}/posts`, { params: { category: key, limit: 9 } })
        .then(r => {
          const all: Post[] = r.data.posts;
          relatedCache.set(key, { data: all, ts: Date.now() });
          setRelatedPosts(all.filter(p => p._id !== post._id).slice(0, 8));
        })
        .catch(() => {});
    }, 300); // slight delay so main content renders first

    return () => clearTimeout(timer);
  }, [post]);

  // Process content images via DOM (runs after post set)
  const processedContent = React.useMemo(() => {
    const raw = getText(post?.content);
    if (!raw) return '';
    return processContentImages(raw, getImageUrl);
  }, [post, getText]);

  if (loading) return <PostDetailSkeleton />;

  if (error || !post) {
    return (
      <div className="pd-error">
        <div className="pd-error__icon">📭</div>
        <h1>{t('postDetail.notFound') || 'Không tìm thấy bài viết'}</h1>
        <p>{t('postDetail.notFoundDesc') || 'Bài viết này không tồn tại hoặc đã bị xoá.'}</p>
        <Link to="/posts" className="pd-btn-back">
          <ArrowLeft size={18} /> {t('postDetail.backToList') || 'Quay lại danh sách'}
        </Link>
      </div>
    );
  }

  return (
    <>
      <ReadingProgress />

      <div className="pd-page">

        {/* ── HERO THUMBNAIL ── */}
        {post.thumbnail && (
          <div className="pd-hero">
            <img
              src={getImageUrl(post.thumbnail)}
              alt={getText(post.title)}
              fetchPriority="high"
              decoding="sync"
              loading="eager"
              width={1400}
              height={600}
              onLoad={() => setImgLoaded(true)}
              onError={e => { e.currentTarget.src = FALLBACK_IMG; setImgLoaded(true); }}
              className={imgLoaded ? 'loaded' : ''}
            />
            <div className="pd-hero__overlay" />
            {/* Category pill on hero */}
            {post.category_id && (
              <Link
                to={`/posts?category=${post.category_id._id}`}
                className="pd-hero__cat"
              >
                <Tag size={12} /> {getText(post.category_id.name)}
              </Link>
            )}
          </div>
        )}

        {/* ── ARTICLE ── */}
        <article className="pd-article">
          <div className="pd-article__wrap">

            {/* ── HEADER ── */}
            <header className="pd-header">
              <Link to="/posts" className="pd-back-link">
                <ChevronLeft size={16} /> {t('postDetail.backToList') || 'Tất cả bài viết'}
              </Link>

              <h1 className="pd-title">{getText(post.title)}</h1>

              <div className="pd-meta">
                <time className="pd-meta__date">
                  <Clock size={14} />
                  {formatDate(post.created_at)}
                </time>
                {post.category_id && (
                  <>
                    <span className="pd-meta__sep" />
                    <Link to={`/posts?category=${post.category_id._id}`} className="pd-meta__cat">
                      {getText(post.category_id.name)}
                    </Link>
                  </>
                )}
              </div>

              {post.description && (
                <p className="pd-lead">{getText(post.description)}</p>
              )}
            </header>

            {/* ── LAYOUT: CONTENT + TOC SIDEBAR ── */}
            <div className="pd-layout">
              {/* Sidebar TOC (desktop only, sticky) */}
              <aside className="pd-sidebar">
                <TableOfContents html={processedContent} />
              </aside>

              {/* Main content */}
              <div
                ref={contentRef}
                className="pd-content"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />
            </div>

            {/* ── TAGS ── */}
            {post.tags && post.tags.length > 0 && (
              <div className="pd-tags">
                {post.tags.map((tag, i) => (
                  <span key={i} className="pd-tag">#{tag}</span>
                ))}
              </div>
            )}

            {/* ── BACK BUTTON ── */}
            <div className="pd-footer-nav">
              <Link to="/posts" className="pd-btn-back">
                <ArrowLeft size={18} />
                {t('postDetail.backButton') || 'Quay lại'}
              </Link>
            </div>

          </div>
        </article>

        {/* ── RELATED POSTS ── */}
        {relatedPosts.length > 0 && (
          <section className="pd-related">
            <div className="pd-related__wrap">
              <div className="pd-related__header">
                <h2>{language === 'vi' ? 'Bài viết liên quan' : '相关文章'}</h2>
                {post.category_id && (
                  <Link to={`/posts?category=${post.category_id._id}`} className="pd-related__all">
                    {t('common.viewAll') || 'Xem tất cả'} <ChevronRight size={15} />
                  </Link>
                )}
              </div>
              <div className="pd-related__grid">
                {relatedPosts.map(rp => (
                  <RelatedCard key={rp._id} post={rp} getText={getText} formatDate={formatDate} />
                ))}
              </div>
            </div>
          </section>
        )}

      </div>
    </>
  );
};

export default PostDetail;