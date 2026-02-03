import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from "@/utils/imageUrl";
import { useLanguage } from "@/context/LanguageContext";
import { ChevronRight } from "lucide-react";
import "@/styles/pages/user/postDetail.scss";

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
  content: {
    vi: string;
    zh: string;
  };
  category_id: PostCategory;
  tags: string[];
  meta_title?: {
    vi: string;
    zh: string;
  };
  meta_description?: {
    vi: string;
    zh: string;
  };
  created_at: string;
  updated_at: string;
}

const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://tongkhonoithattayninh.vn/api';

  const getText = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[language] || field.vi || '';
  };

  // ✅ IMPROVED: Function to process HTML content and fix image URLs
  const processContentImages = (htmlContent: string): string => {
    if (!htmlContent) return '';
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Find all img tags
    const images = tempDiv.querySelectorAll('img');
    
    images.forEach((img) => {
      let src = img.getAttribute('src');
      if (!src) return;
      
      // ✅ FIX 1: Remove any leading/trailing whitespace
      src = src.trim();
      
      // ✅ FIX 2: Handle different URL formats
      let finalUrl = src;
      
      // Case 1: Absolute URL (starts with http:// or https://)
      if (src.startsWith('http://') || src.startsWith('https://')) {
        finalUrl = src;
      }
      // Case 2: Data URI (base64 images)
      else if (src.startsWith('data:')) {
        finalUrl = src;
      }
      // Case 3: Relative path starting with /uploads
      else if (src.startsWith('/uploads')) {
        finalUrl = getImageUrl(src);
      }
      // Case 4: Relative path without leading slash
      else if (src.startsWith('uploads/')) {
        finalUrl = getImageUrl('/' + src);
      }
      // Case 5: Just filename (unlikely but handle it)
      else {
        // Assume it's in /uploads/posts/
        finalUrl = getImageUrl('/uploads/posts/' + src);
      }
      
      // Set the corrected URL
      img.setAttribute('src', finalUrl);
      
      // ✅ FIX 3: Better error handling with placeholder
      img.setAttribute('onerror', `
        this.onerror=null;
        this.src='https://via.placeholder.com/800x450?text=Image+Not+Found';
        this.style.maxWidth='100%';
        this.style.height='auto';
      `);
      
      // Add loading lazy for performance
      img.setAttribute('loading', 'lazy');
      
      // ✅ FIX 4: Ensure images are responsive with better styling
      const existingStyle = img.getAttribute('style') || '';
      const newStyle = existingStyle + '; max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px;';
      img.setAttribute('style', newStyle);
      
      // Add alt text if missing
      if (!img.hasAttribute('alt')) {
        img.setAttribute('alt', 'Post image');
      }
    });
    
    return tempDiv.innerHTML;
  };

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(false);
      
      try {
        const res = await axios.get<Post>(`${API_URL}/posts/${slug}`);
        setPost(res.data);
        
        const metaTitle = getText(res.data.meta_title);
        const postTitle = getText(res.data.title);
        
        if (metaTitle) {
          document.title = metaTitle;
        } else {
          document.title = `${postTitle} - Nội Thất Đại Dũng Phát`;
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, language]);

  // ✅ IMPROVED: Process images in content after post is loaded (backup method)
  useEffect(() => {
    if (post && contentRef.current) {
      const images = contentRef.current.querySelectorAll('img');
      
      images.forEach((img) => {
        let src = img.getAttribute('src');
        if (!src) return;
        
        src = src.trim();
        
        // Skip if already a full URL or data URI
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
          return;
        }
        
        // Fix relative URLs
        let finalUrl = src;
        if (src.startsWith('/uploads')) {
          finalUrl = getImageUrl(src);
        } else if (src.startsWith('uploads/')) {
          finalUrl = getImageUrl('/' + src);
        } else {
          finalUrl = getImageUrl('/uploads/posts/' + src);
        }
        
        img.setAttribute('src', finalUrl);
        
        // Error handling
        img.onerror = () => {
          img.src = 'https://via.placeholder.com/800x450?text=Image+Not+Found';
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
        };
      });
    }
  }, [post]);

  // Fetch related posts
  useEffect(() => {
    const fetchRelatedPosts = async () => {
      if (!post || !post.category_id) return;

      try {
        const res = await axios.get(`${API_URL}/posts`, {
          params: {
            category: post.category_id._id,
            limit: 8
          }
        });

        // Filter out current post and limit to 8
        const filtered = res.data.posts
          .filter((p: Post) => p._id !== post._id)
          .slice(0, 8);

        setRelatedPosts(filtered);
      } catch (error) {
        console.error('Error fetching related posts:', error);
        setRelatedPosts([]);
      }
    };

    fetchRelatedPosts();
  }, [post]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="post-detail-loading">
        <div className="spinner"></div>
        <p>{t('postDetail.loading')}</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail-error">
        <h1>{t('postDetail.notFound')}</h1>
        <p>{t('postDetail.notFoundDesc')}</p>
        <Link to="/posts" className="btn-back">
          {t('postDetail.backToList')}
        </Link>
      </div>
    );
  }

  // Post Card Component
  const PostCard: React.FC<{ post: Post }> = ({ post }) => {
    return (
      <Link to={`/posts/${post.slug}`} className="post-card-mini">
        <div className="post-card-image">
          <img
            src={post.thumbnail ? getImageUrl(post.thumbnail) : '/placeholder-post.jpg'}
            alt={getText(post.title)}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
            }}
          />
          {post.category_id && (
            <span className="post-card-category">
              {getText(post.category_id.name)}
            </span>
          )}
        </div>
        <div className="post-card-content">
          <time className="post-card-date">
            {formatDate(post.created_at)}
          </time>
          <h3 className="post-card-title">
            {getText(post.title)}
          </h3>
          <p className="post-card-description">
            {getText(post.description)}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <div className="post-detail-page">
      {/* Main Content */}
      <article className="post-detail">
        <div className="container">
          {/* Header */}
          <header className="post-header">
            {post.category_id && (
              <Link 
                to={`/posts?category=${post.category_id._id}`}
                className="post-category"
              >
                {getText(post.category_id.name)}
              </Link>
            )}
            
            <h1 className="post-title">{getText(post.title)}</h1>
            
            <div className="post-meta">
              <time className="post-date">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 4V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {formatDate(post.created_at)}
              </time>
            </div>

            {post.description && (
              <p className="post-description">{getText(post.description)}</p>
            )}
          </header>

          {/* Featured Image */}
          {post.thumbnail && (
            <div className="post-featured-image">
              <img
                src={getImageUrl(post.thumbnail)}
                alt={getText(post.title)}
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/1200x600?text=No+Image';
                }}
              />
            </div>
          )}

          {/* Content - ✅ Using improved processContentImages */}
          <div 
            ref={contentRef}
            className="post-content"
            dangerouslySetInnerHTML={{ __html: processContentImages(getText(post.content)) }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="post-tags">
              <h3>{t('postDetail.tags')}</h3>
              <div className="tags-list">
                {post.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="post-actions">
            <Link to="/posts" className="btn-back">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 16L6 10L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('postDetail.backButton')}
            </Link>
          </div>
        </div>
      </article>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="related-posts-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                {language === 'vi' ? 'Bài viết liên quan' : '相关文章'}
              </h2>
              {post.category_id && (
                <Link
                  to={`/posts?category=${post.category_id._id}`}
                  className="view-all"
                >
                  {t('common.viewAll')} <ChevronRight size={16} />
                </Link>
              )}
            </div>
            <div className="posts-grid-mini">
              {relatedPosts.map((relatedPost) => (
                <PostCard key={relatedPost._id} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default PostDetail;