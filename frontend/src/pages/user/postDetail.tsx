import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from "@/utils/imageUrl";
import "@/styles/pages/user/postDetail.scss";

interface PostCategory {
  _id: string;
  name: string;
  slug: string;
}

interface Post {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  description: string;
  content: string;
  category_id: PostCategory;
  tags: string[];
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(false);
      
      try {
        const res = await axios.get<Post>(`${API_URL}/posts/${slug}`);
        setPost(res.data);
        
        // Update page title & meta
        if (res.data.meta_title) {
          document.title = res.data.meta_title;
        } else {
          document.title = `${res.data.title} - Nội Thất Đại Dũng Phát`;
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="post-detail-loading">
        <div className="spinner"></div>
        <p>Đang tải bài viết...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail-error">
        <h1>😢 Không tìm thấy bài viết</h1>
        <p>Bài viết bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
        <Link to="/posts" className="btn-back">
          ← Quay lại danh sách bài viết
        </Link>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      {/* Breadcrumb */}
      {/* <div className="breadcrumb">
        <div className="container">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/posts">Tin tức</Link>
          <span>/</span>
          {post.category_id && (
            <>
              <Link to={`/posts?category=${post.category_id._id}`}>
                {post.category_id.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="current">{post.title}</span>
        </div>
      </div> */}

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
                {post.category_id.name}
              </Link>
            )}
            
            <h1 className="post-title">{post.title}</h1>
            
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
              <p className="post-description">{post.description}</p>
            )}
          </header>

          {/* Featured Image */}
          {post.thumbnail && (
            <div className="post-featured-image">
              <img
                src={getImageUrl(post.thumbnail)}
                alt={post.title}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Content */}
          <div 
            className="post-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="post-tags">
              <h3>Tags:</h3>
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
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
};

export default PostDetail;