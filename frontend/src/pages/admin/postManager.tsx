import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Editor } from "@tinymce/tinymce-react";
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
  status: "draft" | "published";
  tags: string[];
  meta_title?: MultilangString | string;
  meta_description?: MultilangString | string;
  created_at: string;
  updated_at: string;
}

// 🆕 Interface for bulk upload
interface UploadedImage {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  uploading?: boolean;
  error?: string;
}

const PostManager: React.FC = () => {
  const { language } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingCategory, setEditingCategory] = useState<PostCategory | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // 🆕 Bulk upload states
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);

  // ✅ Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ✅ Helper: Get text from multilang field
  const getText = (
    field: MultilangString | string | undefined,
    lang: string = "vi",
  ): string => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[lang as keyof MultilangString] || field.vi || "";
  };

  const [formData, setFormData] = useState({
    title: { vi: "", zh: "" },
    slug: "",
    thumbnail: "",
    description: { vi: "", zh: "" },
    content: { vi: "", zh: "" },
    category_id: "",
    status: "draft" as "draft" | "published",
    tags: [] as string[],
    meta_title: { vi: "", zh: "" },
    meta_description: { vi: "", zh: "" },
  });

  const [tagInput, setTagInput] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");

  const [categoryForm, setCategoryForm] = useState({
    name: { vi: "", zh: "" },
    slug: "",
  });

  // ✅ THÊM DEBUG
  console.log("🔍 All env vars:", import.meta.env);
  console.log("🔍 VITE_API_URL:", import.meta.env.VITE_API_URL);
  console.log("🔍 MODE:", import.meta.env.MODE);

  const API_URL =
    import.meta.env.VITE_API_URL || "https://tongkhonoithattayninh.vn/api";

  console.log("🔍 Final API_URL:", API_URL);

  const token = localStorage.getItem("token");

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
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
      console.error("Error fetching posts:", error);
      alert("Lỗi khi tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/post-categories`);
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    // ✅ Handle multilang fields
    if (name === "title_vi") {
      setFormData((prev) => ({
        ...prev,
        title: { ...prev.title, vi: value },
      }));
      if (!editingPost) {
        const slug = generateSlug(value);
        setFormData((prev) => ({
          ...prev,
          slug,
          meta_title: { ...prev.meta_title, vi: value },
        }));
      }
    } else if (name === "description_vi") {
      setFormData((prev) => ({
        ...prev,
        description: { ...prev.description, vi: value },
      }));
    } else if (name === "meta_title_vi") {
      setFormData((prev) => ({
        ...prev,
        meta_title: { ...prev.meta_title, vi: value },
      }));
    } else if (name === "meta_description_vi") {
      setFormData((prev) => ({
        ...prev,
        meta_description: { ...prev.meta_description, vi: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditorChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content: { ...prev.content, vi: content },
    }));
  };

  // ✅ FIXED: Single image upload - tương tự ProductManager
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ảnh không được vượt quá 5MB!");
      return;
    }

    setUploadingImage(true);
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    try {
      const res = await axios.post(
        `${API_URL}/admin/upload-image`,
        formDataUpload,
        {
          headers: {
            ...axiosConfig.headers,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setFormData((prev) => ({ ...prev, thumbnail: res.data.url }));
      alert("Upload ảnh thành công!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert(
        error.response?.data?.message ||
          "Lỗi khi upload ảnh. Vui lòng thử lại.",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // 🆕 BULK IMAGE UPLOAD - Giống ProductManager style
  const handleBulkImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} không phải là file ảnh!`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} vượt quá 5MB!`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setShowBulkUpload(true);
    setBulkUploadProgress(0);

    // Initialize upload list
    const initialImages: UploadedImage[] = validFiles.map((file) => ({
      url: "",
      filename: "",
      originalName: file.name,
      size: file.size,
      uploading: true,
    }));
    setUploadedImages(initialImages);

    // ✅ Upload files sequentially with progress (giống ProductManager)
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const formDataUpload = new FormData();
      formDataUpload.append("image", file);

      try {
        const res = await axios.post(
          `${API_URL}/admin/upload-image`,
          formDataUpload,
          {
            headers: {
              ...axiosConfig.headers,
              "Content-Type": "multipart/form-data",
            },
          },
        );

        setUploadedImages((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            url: res.data.url,
            filename: res.data.filename,
            uploading: false,
          };
          return updated;
        });
      } catch (error: any) {
        console.error(`Error uploading ${file.name}:`, error);
        setUploadedImages((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            uploading: false,
            error: error.response?.data?.message || "Upload failed",
          };
          return updated;
        });
      }

      // Update progress
      setBulkUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
    }

    // Reset file input
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = "";
    }
  };

  // 🆕 Copy image URL to clipboard
  const copyToClipboard = (url: string) => {
    // ✅ FIX: Dùng env variable thay vì hardcode
    let fullUrl = url;

    // Nếu URL chưa có http:// hoặc https://
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      // Lấy base URL từ API_URL (đã được định nghĩa ở đầu component)
      const apiUrl =
        import.meta.env.VITE_API_URL || "https://tongkhonoithattayninh.vn/api";
      const baseUrl = apiUrl.replace(/\/api$/, ""); // Remove /api suffix

      // Đảm bảo path có dấu / ở đầu
      const normalizedPath = url.startsWith("/") ? url : `/${url}`;

      // Ghép thành URL đầy đủ
      fullUrl = `${baseUrl}${normalizedPath}`;
    }

    // Copy to clipboard
    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        alert("✅ Đã copy URL vào clipboard!");
      })
      .catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = fullUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        alert("✅ Đã copy URL vào clipboard!");
      });
  };

  // 🆕 Clear bulk upload list
  const clearBulkUpload = () => {
    setUploadedImages([]);
    setShowBulkUpload(false);
    setBulkUploadProgress(0);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const openModal = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title:
          typeof post.title === "string"
            ? { vi: post.title, zh: "" }
            : post.title,
        slug: post.slug,
        thumbnail: post.thumbnail,
        description:
          typeof post.description === "string"
            ? { vi: post.description, zh: "" }
            : post.description,
        content:
          typeof post.content === "string"
            ? { vi: post.content, zh: "" }
            : post.content,
        category_id:
          typeof post.category_id === "string"
            ? post.category_id
            : post.category_id._id,
        status: post.status,
        tags: post.tags || [],
        meta_title:
          typeof post.meta_title === "string"
            ? { vi: post.meta_title || "", zh: "" }
            : post.meta_title || { vi: "", zh: "" },
        meta_description:
          typeof post.meta_description === "string"
            ? { vi: post.meta_description || "", zh: "" }
            : post.meta_description || { vi: "", zh: "" },
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: { vi: "", zh: "" },
        slug: "",
        thumbnail: "",
        description: { vi: "", zh: "" },
        content: { vi: "", zh: "" },
        category_id: "",
        status: "draft",
        tags: [],
        meta_title: { vi: "", zh: "" },
        meta_description: { vi: "", zh: "" },
      });
      // ✅ Reset bulk upload when opening new post
      setUploadedImages([]);
      setShowBulkUpload(false);
      setBulkUploadProgress(0);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.vi.trim()) {
      alert("Vui lòng nhập tiêu đề bài viết (Tiếng Việt)");
      return;
    }

    if (!formData.slug.trim()) {
      alert("Vui lòng nhập slug cho bài viết");
      return;
    }

    if (!formData.category_id) {
      alert("Vui lòng chọn danh mục");
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        // Ensure content is properly formatted
        content: formData.content,
      };

      if (editingPost) {
        await axios.put(
          `${API_URL}/admin/posts/${editingPost._id}`,
          dataToSend,
          axiosConfig,
        );
        alert("Cập nhật bài viết thành công!");
      } else {
        await axios.post(`${API_URL}/admin/posts`, dataToSend, axiosConfig);
        alert("Tạo bài viết thành công!");
      }

      setShowModal(false);
      fetchPosts();
    } catch (error: any) {
      console.error("Error saving post:", error);
      alert(error.response?.data?.message || "Lỗi khi lưu bài viết");
    }
  };

  const handleDelete = async (post: Post) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa bài viết "${getText(post.title, "vi")}"?`,
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/admin/posts/${post._id}`, axiosConfig);
      alert("Xóa bài viết thành công!");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Lỗi khi xóa bài viết");
    }
  };

  const openCategoryModal = (category?: PostCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name:
          typeof category.name === "string"
            ? { vi: category.name, zh: "" }
            : category.name,
        slug: category.slug,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: { vi: "", zh: "" },
        slug: "",
      });
    }
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryForm.name.vi.trim()) {
      alert("Vui lòng nhập tên danh mục (Tiếng Việt)");
      return;
    }

    try {
      if (editingCategory) {
        await axios.put(
          `${API_URL}/admin/post-categories/${editingCategory._id}`,
          categoryForm,
          axiosConfig,
        );
        alert("Cập nhật danh mục thành công!");
      } else {
        await axios.post(
          `${API_URL}/admin/post-categories`,
          categoryForm,
          axiosConfig,
        );
        alert("Tạo danh mục thành công!");
      }

      setShowCategoryModal(false);
      fetchCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      alert(error.response?.data?.message || "Lỗi khi lưu danh mục");
    }
  };

  const handleDeleteCategory = async (category: PostCategory) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa danh mục "${getText(category.name, "vi")}"?`,
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/admin/post-categories/${category._id}`,
        axiosConfig,
      );
      alert("Xóa danh mục thành công!");
      fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      alert(error.response?.data?.message || "Lỗi khi xóa danh mục");
    }
  };

  const handleCategoryInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "name_vi") {
      setCategoryForm((prev) => ({
        ...prev,
        name: { ...prev.name, vi: value },
      }));
      if (!editingCategory) {
        setCategoryForm((prev) => ({
          ...prev,
          slug: generateSlug(value),
        }));
      }
    } else if (name === "name_zh") {
      setCategoryForm((prev) => ({
        ...prev,
        name: { ...prev.name, zh: value },
      }));
    } else {
      setCategoryForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        searchTerm === "" ||
        getText(post.title, "vi")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        post.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "" ||
        (typeof post.category_id === "object" &&
          post.category_id._id === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, itemsPerPage]);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className="pagination-number"
        >
          1
        </button>,
      );
      if (startPage > 2) {
        pageNumbers.push(
          <span key="ellipsis1" className="pagination-ellipsis">
            ...
          </span>,
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`pagination-number ${currentPage === i ? "active" : ""}`}
        >
          {i}
        </button>,
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <span key="ellipsis2" className="pagination-ellipsis">
            ...
          </span>,
        );
      }
      pageNumbers.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className="pagination-number"
        >
          {totalPages}
        </button>,
      );
    }

    return pageNumbers;
  };

  // Filter categories for search
  const filteredCategories = useMemo(() => {
    if (!categorySearchTerm) return categories;
    return categories.filter(
      (cat) =>
        getText(cat.name, "vi")
          .toLowerCase()
          .includes(categorySearchTerm.toLowerCase()) ||
        cat.slug.toLowerCase().includes(categorySearchTerm.toLowerCase()),
    );
  }, [categories, categorySearchTerm]);

  return (
    <div className="post-manager">
      <div className="post-manager-header">
        <h1>Quản lý bài viết</h1>
        <div className="header-actions">
          <button className="btn-category" onClick={() => openCategoryModal()}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
            </svg>
            Quản lý danh mục
          </button>
          <button className="btn-primary" onClick={() => openModal()}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tạo bài viết mới
          </button>
        </div>
      </div>

      <div className="post-manager-filters">
        <div className="search-box">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
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
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {getText(cat.name, "vi")}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          <div className="post-table-container">
            <table className="post-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
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
                  currentPosts.map((post) => (
                    <tr key={post._id}>
                      <td>
                        <div className="thumbnail-cell">
                          {post.thumbnail ? (
                            <img
                              src={getImageUrl(post.thumbnail)}
                              alt={getText(post.title, "vi")}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/150?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="no-image">No Image</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="title-cell">
                          <strong>{getText(post.title, "vi")}</strong>
                          <div className="slug">{post.slug}</div>
                        </div>
                      </td>
                      <td>
                        <span className="category-badge">
                          {typeof post.category_id === "object"
                            ? getText(post.category_id.name, "vi")
                            : "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${post.status}`}>
                          {post.status === "published"
                            ? "Đã xuất bản"
                            : "Bản nháp"}
                        </span>
                      </td>
                      <td>
                        {new Date(post.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => openModal(post)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(post)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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

          {filteredPosts.length > 0 && (
            <div className="pagination">
              <div className="pagination-left">
                <div className="items-per-page">
                  <span>Hiển thị</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>bài viết</span>
                </div>
                <div className="page-info">
                  Hiển thị {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredPosts.length)} trong tổng số{" "}
                  {filteredPosts.length} bài viết
                </div>
              </div>

              <div className="pagination-center">
                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  ← Trước
                </button>

                <div className="pagination-numbers">{renderPageNumbers()}</div>

                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Post Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content modal-wordpress"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingPost ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="wordpress-editor">
                <div className="editor-main">
                  <div className="form-group">
                    <input
                      type="text"
                      name="title_vi"
                      value={formData.title.vi}
                      onChange={handleInputChange}
                      className="title-input"
                      placeholder="Nhập tiêu đề bài viết..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mô tả ngắn (Tiếng Việt)</label>
                    <textarea
                      name="description_vi"
                      value={formData.description.vi}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Mô tả ngắn về bài viết..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Nội dung bài viết (Tiếng Việt)</label>
                    <Editor
                      apiKey="6xggb1bi1xu937evzkkxhjl8469qlt2l03hg1zpep5c4a6i7"
                      onInit={(evt, editor) => (editorRef.current = editor)}
                      value={formData.content.vi}
                      onEditorChange={handleEditorChange}
                      init={{
                        height: 500,
                        menubar: true,
                        plugins: [
                          "advlist",
                          "autolink",
                          "lists",
                          "link",
                          "image",
                          "charmap",
                          "preview",
                          "anchor",
                          "searchreplace",
                          "visualblocks",
                          "code",
                          "fullscreen",
                          "insertdatetime",
                          "media",
                          "table",
                          "code",
                          "help",
                          "wordcount",
                        ],
                        toolbar:
                          "undo redo | blocks | " +
                          "bold italic forecolor | alignleft aligncenter " +
                          "alignright alignjustify | bullist numlist outdent indent | " +
                          "removeformat | image media | code | fullscreen | help",
                        content_style:
                          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                        language: "vi",
                      }}
                    />
                  </div>
                </div>

                <div className="editor-sidebar">
                  {/* Publish Box */}
                  <div className="sidebar-box">
                    <h3>Xuất bản</h3>
                    <div className="form-group-inline">
                      <label>Trạng thái:</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="draft">Bản nháp</option>
                        <option value="published">Xuất bản</option>
                      </select>
                    </div>
                    <div className="publish-actions">
                      <button type="submit" className="btn-publish">
                        {editingPost ? "Cập nhật bài viết" : "Xuất bản ngay"}
                      </button>
                    </div>
                  </div>

                  {/* 🆕 BULK IMAGE UPLOAD BOX */}
                  {/* <div className="sidebar-box">
                    <h3>📸 Upload Nhiều Ảnh</h3>
                    <div className="featured-image-box">
                      <input
                        type="file"
                        ref={bulkFileInputRef}
                        onChange={handleBulkImageUpload}
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        className="btn-upload"
                        onClick={() => bulkFileInputRef.current?.click()}
                      >
                        Chọn nhiều ảnh
                      </button>

                      {showBulkUpload && (
                        <div className="bulk-upload-container">
                          <div className="bulk-upload-header">
                            <h4>
                              Đã upload:{" "}
                              {
                                uploadedImages.filter(
                                  (img) => !img.uploading && !img.error,
                                ).length
                              }
                              /{uploadedImages.length}
                            </h4>
                            <button
                              type="button"
                              onClick={clearBulkUpload}
                              className="btn-clear"
                            >
                              Xóa tất cả
                            </button>
                          </div>

                          {bulkUploadProgress < 100 && (
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${bulkUploadProgress}%` }}
                              ></div>
                              <span className="progress-text">
                                {bulkUploadProgress}%
                              </span>
                            </div>
                          )}

                          <div className="bulk-upload-grid">
                            {uploadedImages.map((img, index) => (
                              <div key={index} className="bulk-upload-item">
                                {img.uploading ? (
                                  <div className="upload-loading">
                                    <div className="spinner-small"></div>
                                  </div>
                                ) : img.error ? (
                                  <div className="upload-error">❌</div>
                                ) : (
                                  <img
                                    src={getImageUrl(img.url)}
                                    alt={img.originalName}
                                  />
                                )}
                                <div className="bulk-upload-info">
                                  <div className="image-name">
                                    {img.originalName}
                                  </div>
                                  {!img.uploading && !img.error && (
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(img.url)}
                                      className="btn-copy-url"
                                    >
                                      Copy URL
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div> */}

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
                              e.currentTarget.src =
                                "https://via.placeholder.com/150?text=Error";
                            }}
                          />
                          <button
                            type="button"
                            className="btn-remove-image"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                thumbnail: "",
                              }))
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <svg
                            width="48"
                            height="48"
                            viewBox="0 0 48 48"
                            fill="none"
                          >
                            <path
                              d="M24 16V32M16 24H32"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </svg>
                          <p>Thêm ảnh đại diện</p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        className="btn-upload"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? "Đang upload..." : "Chọn ảnh"}
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
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {getText(cat.name, "vi")}
                        </option>
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
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              ✕
                            </button>
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
                      <p className="char-count">
                        {formData.meta_title.vi.length}/60 ký tự
                      </p>
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
                      <p className="char-count">
                        {formData.meta_description.vi.length}/160 ký tự
                      </p>
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

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCategoryModal(false)}
        >
          <div
            className="modal-content modal-category-manager"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Quản lý danh mục bài viết</h2>
              <button
                className="modal-close"
                onClick={() => setShowCategoryModal(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="category-manager-body">
              <form className="category-form" onSubmit={handleCategorySubmit}>
                <h3 className="form-title">
                  {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
                </h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tên danh mục (Tiếng Việt) *</label>
                    <input
                      type="text"
                      name="name_vi"
                      value={categoryForm.name.vi}
                      onChange={handleCategoryInputChange}
                      placeholder="VD: Tin tức công ty"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên danh mục (中文)</label>
                    <input
                      type="text"
                      name="name_zh"
                      value={categoryForm.name.zh}
                      onChange={handleCategoryInputChange}
                      placeholder="例如：公司新闻"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Slug (URL thân thiện) *</label>
                  <input
                    type="text"
                    name="slug"
                    value={categoryForm.slug}
                    onChange={handleCategoryInputChange}
                    placeholder="tin-tuc-cong-ty"
                    required
                  />
                </div>

                <div className="form-actions">
                  {editingCategory && (
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({ name: { vi: "", zh: "" }, slug: "" });
                      }}
                    >
                      Hủy chỉnh sửa
                    </button>
                  )}
                  <button type="submit" className="btn-submit">
                    {editingCategory ? "Cập nhật danh mục" : "Thêm danh mục"}
                  </button>
                </div>
              </form>

              <div className="categories-list-section">
                <div className="list-header">
                  <h3 className="list-title">
                    Danh sách danh mục ({categories.length})
                  </h3>
                  <div className="search-box-small">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
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
                      {categorySearchTerm
                        ? "Không tìm thấy danh mục phù hợp"
                        : "Chưa có danh mục nào"}
                    </div>
                  ) : (
                    <div className="categories-grid">
                      {filteredCategories.map((cat) => (
                        <div
                          key={cat._id}
                          className={`category-item ${editingCategory?._id === cat._id ? "editing" : ""}`}
                        >
                          <div className="category-info">
                            <h4 className="category-name">
                              {getText(cat.name, "vi")}
                            </h4>
                            <p className="category-slug">{cat.slug}</p>
                          </div>
                          <div className="category-actions">
                            <button
                              type="button"
                              className="btn-edit-cat"
                              onClick={() => openCategoryModal(cat)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn-delete-cat"
                              onClick={() => handleDeleteCategory(cat)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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
    </div>
  );
};

export default PostManager;
