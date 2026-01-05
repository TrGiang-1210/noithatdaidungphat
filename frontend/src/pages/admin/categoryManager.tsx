// src/admin/pages/CategoryManager.tsx
import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";
import axiosInstance from "../../axios";
import "@/styles/pages/admin/categoryManager.scss";

interface Category {
  _id: string;
  name: string | { vi: string; zh: string };
  slug: string;
  parent?: string | null;
  level: number;
  path: string[];
  children?: Category[];
  sortOrder?: number;
}

type DropPosition = 'before' | 'inside' | 'after' | null;

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
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedItem, setDraggedItem] = useState<Category | null>(null);
  const [dragOverItem, setDragOverItem] = useState<Category | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ✅ Helper: Safely get category name (multilingual support)
  const getCategoryName = (name: any): string => {
    if (typeof name === 'object' && name !== null && name.vi) {
      return name.vi;
    }
    return String(name || '');
  };

  // Load danh mục dạng cây từ backend
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/categories/tree");
      console.log('📦 Fetched categories:', res.data);
      setCategories(res.data || []);

      // Tạo danh sách phẳng để chọn cha
      const flatten = (
        cats: Category[],
        level = 0,
        path: string[] = []
      ): Category[] => {
        let list: Category[] = [];
        cats.forEach((cat) => {
          const catName = getCategoryName(cat.name);
          list.push({ ...cat, level, path: [...path, catName] });
          if (cat.children?.length) {
            list = list.concat(
              flatten(cat.children, level + 1, [...path, catName])
            );
          }
        });
        return list;
      };
      setFlatCategories(flatten(res.data || []));
    } catch (err) {
      alert("Lỗi tải danh mục");
      console.error("❌ Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Tự động expand các danh mục cha khi search
  useEffect(() => {
    if (searchQuery.trim()) {
      const idsToExpand: string[] = [];
      
      const findMatchingParents = (nodes: Category[]): void => {
        nodes.forEach((node) => {
          const nodeName = getCategoryName(node.name).toLowerCase();
          const hasMatch = nodeName.includes(searchQuery.toLowerCase());
          
          if (node.children && node.children.length > 0) {
            const childHasMatch = hasChildMatch(node.children);
            
            if (hasMatch || childHasMatch) {
              idsToExpand.push(node._id);
            }
            
            findMatchingParents(node.children);
          }
        });
      };
      
      const hasChildMatch = (nodes: Category[]): boolean => {
        return nodes.some((node) => {
          const nodeName = getCategoryName(node.name).toLowerCase();
          if (nodeName.includes(searchQuery.toLowerCase())) return true;
          if (node.children) return hasChildMatch(node.children);
          return false;
        });
      };
      
      findMatchingParents(categories);
      setExpanded(idsToExpand);
    }
  }, [searchQuery, categories]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openAddModal = (parentId: string = "", parentNameParam: string = "") => {
    setEditingCat(null);
    setFormData({ name: "", parent: parentId });
    setParentName(parentNameParam || "");
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setFormData({ 
      name: getCategoryName(cat.name), 
      parent: cat.parent || "" 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const slug = generateSlug(formData.name);

    try {
      if (editingCat) {
        await axiosInstance.put(`/admin/categories/${editingCat._id}`, {
          name: formData.name,
          slug,
          parent: formData.parent || null,
        });
      } else {
        await axiosInstance.post("/admin/categories", {
          name: formData.name,
          slug,
          parent: formData.parent || null,
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
    const catName = getCategoryName(deletingCat.name);
    if (!confirm(`Xóa danh mục "${catName}" và tất cả danh mục con?`))
      return;

    try {
      await axiosInstance.delete(`/admin/categories/${deletingCat._id}`);
      setDeletingCat(null);
      fetchCategories();
    } catch (err) {
      alert("Không thể xóa (có thể đang có sản phẩm thuộc danh mục này)");
    }
  };

  // ✅ Drag & Drop handlers - ENHANCED with 3 drop zones
  const handleDragStart = (e: React.DragEvent, cat: Category) => {
    e.stopPropagation();
    setDraggedItem(cat);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    
    setTimeout(() => {
      setDraggedItem(null);
      setDragOverItem(null);
      setDropPosition(null);
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent, cat: Category) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem || draggedItem._id === cat._id) return;
    
    // ✅ Tính toán vị trí drop dựa trên mouse position
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const height = rect.height;
    
    // Chia thành 3 vùng: 30% trên, 40% giữa, 30% dưới
    let position: DropPosition = null;
    
    if (mouseY < height * 0.3) {
      position = 'before'; // Vùng trên - đặt trước
    } else if (mouseY > height * 0.7) {
      position = 'after'; // Vùng dưới - đặt sau
    } else {
      position = 'inside'; // Vùng giữa - đặt vào trong
    }
    
    // Kiểm tra không phải descendant
    if (position === 'inside' && isDescendant(draggedItem, cat)) {
      position = null;
    }
    
    setDragOverItem(cat);
    setDropPosition(position);
    
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = (e: React.DragEvent, cat: Category) => {
    e.stopPropagation();
    
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    
    if (!currentTarget.contains(relatedTarget)) {
      if (dragOverItem?._id === cat._id) {
        setDragOverItem(null);
        setDropPosition(null);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent, dropTarget: Category) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem || draggedItem._id === dropTarget._id || !dropPosition) {
      setDraggedItem(null);
      setDragOverItem(null);
      setDropPosition(null);
      setIsDragging(false);
      return;
    }

    // Kiểm tra descendant cho position 'inside'
    if (dropPosition === 'inside' && isDescendant(draggedItem, dropTarget)) {
      alert("Không thể di chuyển danh mục cha vào danh mục con của nó!");
      setDraggedItem(null);
      setDragOverItem(null);
      setDropPosition(null);
      setIsDragging(false);
      return;
    }

    const itemElement = (e.target as HTMLElement).closest('.category-item');
    if (itemElement) {
      itemElement.classList.add('processing');
    }

    try {
      // ✅ Gửi cả position lên backend
      await axiosInstance.put("/admin/categories/reorder", {
        draggedId: draggedItem._id,
        targetId: dropTarget._id,
        position: dropPosition, // 'before', 'inside', 'after'
      });
      
      if (itemElement) {
        itemElement.classList.remove('processing');
        itemElement.classList.add('success-flash');
        setTimeout(() => {
          itemElement.classList.remove('success-flash');
        }, 600);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchCategories();
      
      console.log(`✅ Di chuyển thành công: ${dropPosition}`);
      
    } catch (err: any) {
      console.error("❌ Reorder error:", err);
      
      if (itemElement) {
        itemElement.classList.remove('processing');
        itemElement.classList.add('error-flash');
        setTimeout(() => {
          itemElement.classList.remove('error-flash');
        }, 600);
      }
      
      alert(err.response?.data?.message || "Lỗi khi di chuyển danh mục");
      fetchCategories();
    } finally {
      setDraggedItem(null);
      setDragOverItem(null);
      setDropPosition(null);
      setIsDragging(false);
    }
  };

  // Kiểm tra xem target có phải là con của dragged không
  const isDescendant = (parent: Category, target: Category): boolean => {
    if (!parent.children) return false;
    
    for (const child of parent.children) {
      if (child._id === target._id) return true;
      if (isDescendant(child, target)) return true;
    }
    return false;
  };

  const renderTree = (nodes: Category[], level = 0) => {
    // Lọc categories theo search query
    const filterCategories = (cats: Category[]): Category[] => {
      if (!searchQuery.trim()) return cats;
      
      const searchLower = searchQuery.toLowerCase();
      
      const filterNode = (cat: Category): Category | null => {
        const catName = getCategoryName(cat.name).toLowerCase();
        const currentMatches = catName.includes(searchLower);
        
        let filteredChildren: Category[] = [];
        if (cat.children && cat.children.length > 0) {
          filteredChildren = cat.children
            .map(child => filterNode(child))
            .filter((child): child is Category => child !== null);
        }
        
        if (currentMatches || filteredChildren.length > 0) {
          return {
            ...cat,
            children: currentMatches ? cat.children : filteredChildren
          };
        }
        
        return null;
      };
      
      return cats
        .map(cat => filterNode(cat))
        .filter((cat): cat is Category => cat !== null);
    };

    const filteredNodes = filterCategories(nodes);

    return filteredNodes.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expanded.includes(cat._id);
      const catName = getCategoryName(cat.name);
      const isDraggingThis = draggedItem?._id === cat._id;
      const isDragOverThis = dragOverItem?._id === cat._id;

      return (
        <div key={cat._id} className="category-tree-node">
          {/* ✅ Drop indicator TRƯỚC item */}
          {isDragOverThis && dropPosition === 'before' && (
            <div className="drop-indicator drop-before">
              <span className="drop-label">📍 Đặt ở đây</span>
            </div>
          )}

          <div
            className={`category-item ${isDraggingThis ? 'dragging' : ''} ${isDragOverThis && dropPosition === 'inside' ? 'drag-over-inside' : ''}`}
            style={{ paddingLeft: `${level * 28}px` }}
            onDragOver={(e) => handleDragOver(e, cat)}
            onDragLeave={(e) => handleDragLeave(e, cat)}
            onDrop={(e) => handleDrop(e, cat)}
          >
            <div 
              className="drag-handle" 
              title="Kéo để di chuyển"
              draggable={true}
              onDragStart={(e) => handleDragStart(e, cat)}
              onDragEnd={handleDragEnd}
            >
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

            <span className="category-name">{catName}</span>
            <span className="category-slug">/{cat.slug}</span>

            <div className="category-actions">
              <button
                onClick={() => openAddModal(cat._id, catName)}
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

            {/* ✅ Overlay INSIDE khi hover vào giữa */}
            {isDragOverThis && dropPosition === 'inside' && (
              <div className="drop-overlay-inside">
                <span className="drop-label-inside">📂 Đặt vào trong danh mục này</span>
              </div>
            )}
          </div>

          {/* ✅ Drop indicator SAU item */}
          {isDragOverThis && dropPosition === 'after' && (
            <div className="drop-indicator drop-after">
              <span className="drop-label">📍 Đặt ở đây</span>
            </div>
          )}

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
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
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

      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm danh mục..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
              Xóa danh mục <strong>{getCategoryName(deletingCat.name)}</strong> và tất cả danh mục con?
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