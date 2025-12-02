// src/admin/pages/CategoryManager.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import axiosInstance from "../../axios";
import "@/styles/pages/admin/categoryManager.scss";

interface Category {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  level: number;
  path: string[];
  children?: Category[];
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", parent: "" });
  const [parentName, setParentName] = useState("");

  // Load danh mục dạng cây từ backend
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/categories/tree");
      setCategories(res.data || []);

      // Tạo danh sách phẳng để chọn cha
      const flatten = (
        cats: Category[],
        level = 0,
        path: string[] = []
      ): Category[] => {
        let list: Category[] = [];
        cats.forEach((cat) => {
          list.push({ ...cat, level, path: [...path, cat.name] });
          if (cat.children?.length) {
            list = list.concat(
              flatten(cat.children, level + 1, [...path, cat.name])
            );
          }
        });
        return list;
      };
      setFlatCategories(flatten(res.data || []));
    } catch (err) {
      alert("Lỗi tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openAddModal = (parentId: string = "") => {
    setEditingCat(null);
    setFormData({ name: "", parentId });
    setParentName(parentName || "");
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setFormData({ name: cat.name, parentId: cat.parent || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const slug = generateSlug(formData.name); // TẠO SLUG TỰ ĐỘNG

    try {
      if (editingCat) {
        await axiosInstance.put(`/admin/categories/${editingCat._id}`, {
          name: formData.name,
          slug, // GỬI SLUG LUÔN
          parent: formData.parentId || null,
        });
      } else {
        await axiosInstance.post("/admin/categories", {
          name: formData.name,
          slug, // GỬI SLUG LUÔN
          parent: formData.parentId || null,
        });
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi lưu danh mục");
    }
  };

  const handleDelete = async () => {
    if (!deletingCat) return;
    if (!confirm(`Xóa danh mục "${deletingCat.name}" và tất cả danh mục con?`))
      return;

    try {
      await axiosInstance.delete(`/admin/categories/${deletingCat._id}`);
      setDeletingCat(null);
      fetchCategories();
    } catch (err) {
      alert("Không thể xóa (có thể đang có sản phẩm thuộc danh mục này)");
    }
  };

  const renderTree = (nodes: Category[], level = 0) => {
    return nodes.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expanded.includes(cat._id);

      return (
        <div key={cat._id} className="category-tree-node">
          <div
            className="category-item"
            style={{ paddingLeft: `${level * 28}px` }}
          >
            <div className="drag-handle">
              <GripVertical size={18} />
            </div>

            {hasChildren ? (
              <button
                onClick={() => toggleExpand(cat._id)}
                className="toggle-btn"
                style={{
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                <ChevronRight size={18} />
              </button>
            ) : (
              <span className="toggle-placeholder" />
            )}

            <span className="category-name">{cat.name}</span>
            <span className="category-slug">/{cat.slug}</span>

            <div className="category-actions">
              <button
                onClick={() => openAddModal(cat._id, cat.name)}
                className="btn-small"
              >
                <Plus size={16} /> Thêm con
              </button>
              <button onClick={() => openEditModal(cat)} className="btn-small">
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => setDeletingCat(cat)}
                className="btn-small btn-danger"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="children">
              {renderTree(cat.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Xóa ký tự đặc biệt
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  if (loading) {
    return (
      <div className="category-manager">
        <div style={{ textAlign: "center", padding: "100px" }}>
          <Loader2 size={48} className="spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="category-manager">
      <div className="page-header">
        <h1 className="page-title">Quản lý danh mục</h1>
        <button onClick={() => openAddModal()} className="btn-primary">
          <Plus size={20} /> Thêm danh mục gốc
        </button>
      </div>

      <div className="category-tree">
        {categories.length === 0 ? (
          <p className="empty">
            Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!
          </p>
        ) : (
          renderTree(categories)
        )}
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCat ? "Sửa" : "Thêm"} danh mục</h3>

            {/* THÊM DÒNG NÀY – HIỂN THỊ DANH MỤC CHA */}
            {parentName && !editingCat && (
              <div className="parent-info">
                <strong>Thuộc danh mục:</strong> {parentName}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Tên danh mục"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              {/* Slug preview (bonus đẹp) */}
              {formData.name && (
                <div className="slug-preview">
                  Slug: <strong>{generateSlug(formData.name)}</strong>
                </div>
              )}

              <select
                value={formData.parent}
                onChange={(e) =>
                  setFormData({ ...formData, parent: e.target.value })
                }
              >
                <option value="">-- Làm danh mục gốc --</option>
                {flatCategories
                  .filter((c) => c._id !== editingCat?._id)
                  .map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {"─".repeat(cat.level)} {cat.path.join(" > ")}
                    </option>
                  ))}
              </select>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingCat ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm xóa */}
      {deletingCat && (
        <div className="modal-overlay" onClick={() => setDeletingCat(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Xác nhận xóa</h3>
            <p>
              Xóa danh mục <strong>{deletingCat.name}</strong> và tất cả danh
              mục con?
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => setDeletingCat(null)}>
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn-danger"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
