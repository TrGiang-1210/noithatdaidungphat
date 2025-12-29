import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from "@/utils/imageUrl";
import { useLanguage } from "@/context/LanguageContext"; // ✅ NEW
import "@/styles/pages/user/post.scss";

// ✅ UPDATED: Multilingual fields
interface PostCategory {
  _id: string;
  name: {
    vi: string;
    zh: string;
  };
  slug: string;
}

interface Post {
  _id: string;
  title: {
    vi: string;
    zh: string;
  };
  slug: string;
  thumbnail: string;
  description: {
    vi: string;
    zh: string;
  };
  category_id: PostCategory;
  created_at: string;
}

interface PostsResponse {
  posts: Post[];
  totalPages: number;
  currentPage: number;
}

const Posts: React.FC = () => {
  const { language, t } = useLanguage(); // ✅ NEW
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // ✅ Helper: Get text by language
  const getText = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[language] || field.vi || '';
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/post-categories`);
        setCategories(res.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const page = searchParams.get('page') || '1';
        const category = searchParams.get('category') || '';
        
        const res = await axios.get<PostsResponse>(`${API_URL}/posts`, {
          params: { page, limit: 9, category }
        });
        
        setPosts(res.data.posts);
        setTotalPages(res.data.totalPages);
        setCurrentPage(Number(page));
        setSelectedCategory(category);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [searchParams]);

  const handleCategoryFilter = (categoryId: string) => {
    const params = new URLSearchParams();
    if (categoryId) params.set('category', categoryId);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="posts-page">
      <div className="posts-hero">
        <div className="container">
          <h1>{t('posts.pageTitle')}</h1>
          <p>{t('posts.pageSubtitle')}</p>
        </div>
      </div>

      <div className="container">
        <div className="posts-content">
          {/* Sidebar */}
          <aside className="posts-sidebar">
            <div className="sidebar-widget">
              <h3 className="widget-title">{t('posts.categories')}</h3>
              <ul className="category-list">
                <li>
                  <button
                    className={!selectedCategory ? 'active' : ''}
                    onClick={() => handleCategoryFilter('')}
                  >
                    {t('posts.allCategories')}
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat._id}>
                    <button
                      className={selectedCategory === cat._id ? 'active' : ''}
                      onClick={() => handleCategoryFilter(cat._id)}
                    >
                      {getText(cat.name)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="posts-main">
            {loading ? (
              <div className="posts-loading">
                <div className="spinner"></div>
                <p>{t('posts.loading')}</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="posts-empty">
                <p>{t('posts.noPosts')}</p>
              </div>
            ) : (
              <>
                <div className="posts-grid">
                  {posts.map((post) => (
                    <article key={post._id} className="post-card">
                      <Link to={`/posts/${post.slug}`} className="post-thumbnail">
                        <img
                          src={post.thumbnail ? getImageUrl(post.thumbnail) : '/placeholder-post.jpg'}
                          alt={getText(post.title)}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                          }}
                        />
                        {post.category_id && (
                          <span className="post-category-badge">
                            {getText(post.category_id.name)}
                          </span>
                        )}
                      </Link>
                      
                      <div className="post-content">
                        <time className="post-date">
                          {formatDate(post.created_at)}
                        </time>
                        
                        <h2 className="post-title">
                          <Link to={`/posts/${post.slug}`}>
                            {getText(post.title)}
                          </Link>
                        </h2>
                        
                        <p className="post-description">
                          {getText(post.description)}
                        </p>
                        
                        <Link to={`/posts/${post.slug}`} className="post-read-more">
                          {t('posts.readMore')}
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="posts-pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M12 16L6 10L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {t('posts.previous')}
                    </button>

                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      {t('posts.next')}
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Posts;