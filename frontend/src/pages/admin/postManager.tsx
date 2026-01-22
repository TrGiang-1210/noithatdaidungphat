import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Editor } from '@tinymce/tinymce-react';
import { getImageUrl } from "@/utils/imageUrl";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/pages/admin/postManager.scss";

// ✅ Multilingual interfaces
interface MultilangString {
  vi: string;
  zh: string;
}

interface PostCategory {
  _id: string;
  name: MultilangString | string;
  slug: string;
}

interface Post {
  _id: string;
  title: MultilangString | string;
  slug: string;
  thumbnail: string;
  description: MultilangString | string;
  content: MultilangString | string;
  category_id: PostCategory | string;
  status: 'draft' | 'published';
  tags: string[];
  meta_title?: MultilangString | string;
  meta_description?: MultilangString | string;
  created_at: string;
  updated_at: string;
}

const PostManager: React.FC = () => {
  const { language } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingCategory, setEditingCategory] = useState<PostCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);

  // ✅ Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ✅ Helper: Get text from multilang field
  const getText = (field: MultilangString | string | undefined, lang: string = 'vi'): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang as keyof MultilangString] || field.vi || '';
  };

  const [formData, setFormData] = useState({
    title: { vi: '', zh: '' },
    slug: '',
    thumbnail: '',
    description: { vi: '', zh: '' },
    content: { vi: '', zh: '' },
    category_id: '',
    status: 'draft' as 'draft' | 'published',
    tags: [] as string[],
    meta_title: { vi: '', zh: '' },
    meta_description: { vi: '', zh: '' }
  });

  const [tagInput, setTagInput] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  const [categoryForm, setCategoryForm] = useState({
    name: { vi: '', zh: '' },
    slug: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://tongkhonoithattayninh.vn/api';
  const token = localStorage.getItem('token');

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/posts`, axiosConfig);
      setPosts(res.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      alert('Lỗi khi tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/post-categories`);
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // ✅ Handle multilang fields
    if (name === 'title_vi') {
      setFormData(prev => ({
        ...prev,
        title: { ...prev.title, vi: value }
      }));
      if (!editingPost) {
        const slug = generateSlug(value);
        setFormData(prev => ({
          ...prev,
          slug,
          meta_title: { ...prev.meta_title, vi: value }
        }));
      }
    } else if (name === 'description_vi') {
      setFormData(prev => ({
        ...prev,
        description: { ...prev.description, vi: value }
      }));
    } else if (name === 'meta_title_vi') {
      setFormData(prev => ({
        ...prev,
        meta_title: { ...prev.meta_title, vi: value }
      }));
    } else if (name === 'meta_description_vi') {
      setFormData(prev => ({
        ...prev,
        meta_description: { ...prev.meta_description, vi: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content: { ...prev.content, vi: content }
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh không được vượt quá 5MB!');
      return;
    }

    setUploadingImage(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const res = await axios.post(`${API_URL}/admin/upload-image`, formDataUpload, {
        headers: {
          ...axiosConfig.headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFormData(prev => ({ ...prev, thumbnail: res.data.url }));
      alert('Upload ảnh thành công!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Lỗi khi upload ảnh. Vui lòng nhập URL thủ công.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPost) {
        await axios.put(`${API_URL}/admin/posts/${editingPost._id}`, formData, axiosConfig);
        alert('Cập nhật bài viết thành công!');
      } else {
        await axios.post(`${API_URL}/admin/posts`, formData, axiosConfig);
        alert('Tạo bài viết thành công!');
      }
      
      await fetchPosts();
      closeModal();
    } catch (error: any) {
      console.error('Error saving post:', error);
      alert(error.response?.data?.error || 'Lỗi khi lưu bài viết');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    
    try {
      await axios.delete(`${API_URL}/admin/posts/${id}`, axiosConfig);
      alert('Xóa bài viết thành công!');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Lỗi khi xóa bài viết');
    }
  };

  const openModal = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: typeof post.title === 'object' ? post.title : { vi: post.title, zh: '' },
        slug: post.slug,
        thumbnail: post.thumbnail || '',
        description: typeof post.description === 'object' ? post.description : { vi: post.description || '', zh: '' },
        content: typeof post.content === 'object' ? post.content : { vi: post.content || '', zh: '' },
        category_id: typeof post.category_id === 'object' ? post.category_id._id : post.category_id,
        status: post.status || 'draft',
        tags: post.tags || [],
        meta_title: typeof post.meta_title === 'object' ? post.meta_title : { vi: post.meta_title || getText(post.title, 'vi'), zh: '' },
        meta_description: typeof post.meta_description === 'object' ? post.meta_description : { vi: post.meta_description || getText(post.description, 'vi') || '', zh: '' }
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: { vi: '', zh: '' },
        slug: '',
        thumbnail: '',
        description: { vi: '', zh: '' },
        content: { vi: '', zh: '' },
        category_id: '',
        status: 'draft',
        tags: [],
        meta_title: { vi: '', zh: '' },
        meta_description: { vi: '', zh: '' }
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPost(null);
    setTagInput('');
  };

  // ==================== CATEGORY MANAGEMENT ====================

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'name_vi') {
      setCategoryForm(prev => ({
        ...prev,
        name: { ...prev.name, vi: value },
        slug: generateSlug(value)
      }));
    } else if (name === 'slug') {
      setCategoryForm(prev => ({ ...prev, slug: value }));
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await axios.put(`${API_URL}/admin/post-categories/${editingCategory._id}`, categoryForm, axiosConfig);
        alert('Cập nhật danh mục thành công!');
      } else {
        await axios.post(`${API_URL}/admin/post-categories`, categoryForm, axiosConfig);
        alert('Tạo danh mục thành công!');
      }
      
      fetchCategories();
      setCategoryForm({ name: { vi: '', zh: '' }, slug: '' });
      setEditingCategory(null);
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.error || 'Lỗi khi lưu danh mục');
    }
  };

  const handleEditCategory = (category: PostCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: typeof category.name === 'object' ? category.name : { vi: category.name, zh: '' },
      slug: category.slug
    });
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: { vi: '', zh: '' }, slug: '' });
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    
    try {
      await axios.delete(`${API_URL}/admin/post-categories/${id}`, axiosConfig);
      alert('Xóa danh mục thành công!');
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.error || 'Lỗi khi xóa danh mục');
    }
  };

  // ✅ FIX: Use getText() helper for filtering
  const filteredCategories = categories.filter(category => {
    const categoryName = getText(category.name, 'vi').toLowerCase();
    const categorySlug = category.slug.toLowerCase();
    const search = categorySearchTerm.toLowerCase();
    return categoryName.includes(search) || categorySlug.includes(search);
  });

  // ✅ FIX: Use getText() helper for filtering
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const postTitle = getText(post.title, 'vi').toLowerCase();
      const matchSearch = postTitle.includes(searchTerm.toLowerCase());
      const matchCategory = !selectedCategory || 
        (typeof post.category_id === 'object' && post.category_id._id === selectedCategory);
      return matchSearch && matchCategory;
    });
  }, [posts, searchTerm, selectedCategory]);

  // ✅ Pagination calculations
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  // ✅ Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="post-manager">
      <div className="post-manager-header">
        <h1>Quản Lý Bài Viết</h1>
        <div className="header-actions">
          <button className="btn-category" onClick={() => setShowCategoryModal(true)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Quản Lý Danh Mục
          </button>
          <button className="btn-primary" onClick={() => openModal()}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Tạo Bài Viết
          </button>
        </div>
      </div>

      <div className="post-manager-filters">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="2"/>
            <path d="M13 13L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{getText(cat.name, 'vi')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      ) : (
        <>
          <div className="post-table-container">
            <table className="post-table">
              <thead>
                <tr>
                  <th>Thumbnail</th>
                  <th>Tiêu đề</th>
                  <th>Danh mục</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      Không có bài viết nào
                    </td>
                  </tr>
                ) : (
                  currentPosts.map(post => (
                    <tr key={post._id}>
                      <td>
                        <div className="thumbnail-cell">
                          {post.thumbnail ? (
                            <img 
                              src={getImageUrl(post.thumbnail)} 
                              alt={getText(post.title, 'vi')}
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/150?text=Error';
                              }}
                            />
                          ) : (
                            <div className="no-image">No Image</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="title-cell">
                          <strong>{getText(post.title, 'vi')}</strong>
                          <span className="slug">{post.slug}</span>
                        </div>
                      </td>
                      <td>
                        {typeof post.category_id === 'object' ? (
                          <span className="category-badge">{getText(post.category_id.name, 'vi')}</span>
                        ) : (
                          <span className="category-badge">-</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge status-${post.status || 'draft'}`}>
                          {post.status === 'published' ? 'Đã xuất bản' : 'Nháp'}
                        </span>
                      </td>
                      <td>{formatDate(post.created_at)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => openModal(post)}
                            title="Sửa"
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <path d="M12.5 2.5L15.5 5.5L5.5 15.5H2.5V12.5L12.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(post._id)}
                            title="Xóa"
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15C5 15.5 5.5 16 6 16H12C12.5 16 13 15.5 13 15L14 5M7 5V3C7 2.5 7.5 2 8 2H10C10.5 2 11 2.5 11 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ Pagination - Same layout as translateManager */}
          {filteredPosts.length > 0 && (
            <div className="pagination">
              <div className="pagination-left">
                <div className="items-per-page">
                  <span>Hiển thị:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>bài viết/trang</span>
                </div>
                <div className="page-info">
                  Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredPosts.length)} trong tổng số {filteredPosts.length} bài viết
                </div>
              </div>

              {totalPages > 1 && (
                <div className="pagination-center">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ← Trước
                  </button>
                  
                  <div className="pagination-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="pagination-ellipsis">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content modal-category-manager" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Quản Lý Danh Mục Bài Viết</h2>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="modal-body category-manager-body">
              {/* Add/Edit Form */}
              <form className="category-form" onSubmit={handleCategorySubmit}>
                <h3 className="form-title">
                  {editingCategory ? '✏️ Chỉnh Sửa Danh Mục' : '➕ Thêm Danh Mục Mới'}
                </h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên danh mục (Tiếng Việt) *</label>
                    <input
                      type="text"
                      name="name_vi"
                      value={categoryForm.name.vi}
                      onChange={handleCategoryInputChange}
                      required
                      placeholder="Ví dụ: Xu hướng nội thất"
                    />
                  </div>

                  <div className="form-group">
                    <label>Slug *</label>
                    <input
                      type="text"
                      name="slug"
                      value={categoryForm.slug}
                      onChange={handleCategoryInputChange}
                      required
                      placeholder="xu-huong-noi-that"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  {editingCategory && (
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={handleCancelEditCategory}
                    >
                      Hủy
                    </button>
                  )}
                  <button type="submit" className="btn-submit">
                    {editingCategory ? 'Cập Nhật' : 'Tạo Danh Mục'}
                  </button>
                </div>
              </form>

              {/* Categories List */}
              <div className="categories-list-section">
                <div className="list-header">
                  <h3 className="list-title">
                    📂 Danh Sách Danh Mục ({filteredCategories.length})
                  </h3>
                  <div className="search-box-small">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="2"/>
                      <path d="M13 13L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Tìm danh mục..."
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="categories-list-scrollable">
                  {filteredCategories.length === 0 ? (
                    <div className="empty-categories">
                      {categorySearchTerm ? 'Không tìm thấy danh mục' : 'Chưa có danh mục nào'}
                    </div>
                  ) : (
                    <div className="categories-grid">
                      {filteredCategories.map(category => (
                        <div
                          key={category._id}
                          className={`category-item ${editingCategory?._id === category._id ? 'editing' : ''}`}
                        >
                          <div className="category-info">
                            <h4 className="category-name">{getText(category.name, 'vi')}</h4>
                            <p className="category-slug">{category.slug}</p>
                          </div>
                          <div className="category-actions">
                            <button
                              className="btn-edit-cat"
                              onClick={() => handleEditCategory(category)}
                              title="Sửa"
                            >
                              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                                <path d="M12.5 2.5L15.5 5.5L5.5 15.5H2.5V12.5L12.5 2.5Z" stroke="currentColor" strokeWidth="1.5"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Modal - WordPress Style */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-wordpress" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPost ? 'Sửa Bài Viết' : 'Tạo Bài Viết Mới'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="wordpress-editor">
                {/* Main Editor Area */}
                <div className="editor-main">
                  <div className="form-group">
                    <input
                      type="text"
                      name="title_vi"
                      className="title-input"
                      value={formData.title.vi}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập tiêu đề bài viết (Tiếng Việt)..."
                    />
                    <p className="helper-text">Permalink: {formData.slug || 'auto-generate-from-title'}</p>
                  </div>

                  <div className="form-group">
                    <label>Nội dung bài viết (Tiếng Việt)</label>
                    <Editor
                      apiKey="6xggb1bi1xu937evzkkxhjl8469qlt2l03hg1zpep5c4a6i7"
                      onInit={(evt, editor) => editorRef.current = editor}
                      value={formData.content.vi}
                      onEditorChange={handleEditorChange}
                      init={{
                        height: 500,
                        menubar: true,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                          'bold italic forecolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'removeformat | image media link | code | help',
                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                        language: 'vi',
                        skin: 'oxide',
                        content_css: 'default'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Mô tả ngắn (Excerpt - Tiếng Việt)</label>
                    <textarea
                      name="description_vi"
                      value={formData.description.vi}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Mô tả ngắn gọn về bài viết, hiển thị trong danh sách bài viết..."
                    />
                  </div>
                </div>

                {/* Sidebar */}
                <div className="editor-sidebar">
                  {/* Publish Box */}
                  <div className="sidebar-box">
                    <h3>Xuất bản</h3>
                    <div className="publish-actions">
                      <div className="form-group-inline">
                        <label>Trạng thái:</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="draft">Nháp</option>
                          <option value="published">Xuất bản</option>
                        </select>
                      </div>
                      <button type="submit" className="btn-publish">
                        {formData.status === 'published' ? 'Xuất Bản' : 'Lưu Nháp'}
                      </button>
                    </div>
                  </div>

                  {/* Featured Image */}
                  <div className="sidebar-box">
                    <h3>Ảnh đại diện</h3>
                    <div className="featured-image-box">
                      {formData.thumbnail ? (
                        <div className="image-preview">
                          <img 
                            src={getImageUrl(formData.thumbnail)} 
                            alt="Featured"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/150?text=Error';
                            }}
                          />
                          <button
                            type="button"
                            className="btn-remove-image"
                            onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <path d="M24 16V32M16 24H32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                          </svg>
                          <p>Thêm ảnh đại diện</p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="btn-upload"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? 'Đang upload...' : 'Chọn ảnh'}
                      </button>
                      <input
                        type="text"
                        name="thumbnail"
                        value={formData.thumbnail}
                        onChange={handleInputChange}
                        placeholder="Hoặc nhập URL ảnh"
                        className="url-input"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="sidebar-box">
                    <h3>Danh mục</h3>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{getText(cat.name, 'vi')}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="sidebar-box">
                    <h3>Tags</h3>
                    <div className="tags-input-box">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Nhập tag và nhấn Enter"
                      />
                      <div className="tags-list">
                        {formData.tags.map((tag, index) => (
                          <span key={index} className="tag-item">
                            {tag}
                            <button type="button" onClick={() => handleRemoveTag(tag)}>✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SEO Settings */}
                  <div className="sidebar-box">
                    <h3>SEO</h3>
                    <div className="form-group">
                      <label>Meta Title (Tiếng Việt)</label>
                      <input
                        type="text"
                        name="meta_title_vi"
                        value={formData.meta_title.vi}
                        onChange={handleInputChange}
                        placeholder="Tiêu đề SEO"
                        maxLength={60}
                      />
                      <p className="char-count">{formData.meta_title.vi.length}/60 ký tự</p>
                    </div>
                    <div className="form-group">
                      <label>Meta Description (Tiếng Việt)</label>
                      <textarea
                        name="meta_description_vi"
                        value={formData.meta_description.vi}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Mô tả SEO"
                        maxLength={160}
                      />
                      <p className="char-count">{formData.meta_description.vi.length}/160 ký tự</p>
                    </div>
                  </div>

                  {/* Slug */}
                  <div className="sidebar-box">
                    <h3>URL Slug</h3>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                      placeholder="url-bai-viet"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManager;