// src/admin/pages/ProductManager.tsx
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import axiosInstance from "../../axios";
import { getImageUrl, getFirstImageUrl } from "@/utils/imageUrl";
import "@/styles/pages/admin/productManager.scss";

interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  images: string[];
  description: string;
  priceOriginal: number;
  priceSale: number;
  quantity: number;
  categories: { _id: string; name: string }[];
  hot: boolean;
  onSale: boolean;
  sold: number;
}

interface Category {
  _id: string;
  name: string;
  level: number;
  path: string[];
  children?: Category[];
}

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [deletingProd, setDeletingProd] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    priceOriginal: "",
    priceSale: "",
    quantity: "",
    description: "",
    categories: [] as string[],
    hot: false,
    onSale: false,
    images: [] as File[],
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/products");
      setProducts(res.data || []);
    } catch (err) {
      alert("Lỗi tải sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const fetchFlatCategories = async () => {
    try {
      const res = await axiosInstance.get("/admin/categories/tree");
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
      console.error("Lỗi tải categories:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchFlatCategories();
  }, []);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((prev) => URL.revokeObjectURL(prev));
    };
  }, [imagePreviews]);

  const openAddModal = () => {
    setEditingProd(null);
    setFormData({
      name: "",
      sku: "",
      priceOriginal: "",
      priceSale: "",
      quantity: "",
      description: "",
      categories: [],
      hot: false,
      onSale: false,
      images: [],
    });
    setImagePreviews([]);
    setShowModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProd(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      priceOriginal: prod.priceOriginal.toString(),
      priceSale: prod.priceSale.toString(),
      quantity: prod.quantity.toString(),
      description: prod.description,
      categories: prod.categories.map((c) => c._id),
      hot: prod.hot,
      onSale: prod.onSale,
      images: [],
    });
    setImagePreviews(prod.images);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 3) {
      alert("Chỉ được upload tối đa 3 ảnh!");
      return;
    }
    setFormData({ ...formData, images: files });
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("sku", formData.sku);
    data.append("priceOriginal", formData.priceOriginal);
    data.append("priceSale", formData.priceSale);
    data.append("quantity", formData.quantity);
    data.append("description", formData.description);
    formData.categories.forEach((cat) => data.append("categories[]", cat));
    data.append("hot", formData.hot.toString());
    data.append("onSale", formData.onSale.toString());
    formData.images.forEach((file) => data.append("images", file));

    try {
      if (editingProd) {
        await axiosInstance.put(`/admin/products/${editingProd._id}`, data);
      } else {
        await axiosInstance.post("/admin/products", data);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi lưu sản phẩm");
    }
  };

  const handleDelete = async () => {
    if (!deletingProd) return;
    try {
      await axiosInstance.delete(`/admin/products/${deletingProd._id}`);
      setDeletingProd(null);
      fetchProducts();
    } catch (err) {
      alert("Lỗi xóa sản phẩm");
    }
  };

  if (loading) {
    return (
      <div className="product-manager">
        <div style={{ textAlign: "center", padding: "100px" }}>
          <Loader2 size={48} className="spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="product-manager">
      <div className="page-header">
        <h1 className="page-title">Quản lý sản phẩm</h1>
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={20} /> Thêm sản phẩm
        </button>
      </div>

      <div className="product-table">
        {products.length === 0 ? (
          <p className="empty">
            Chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên!
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Hình ảnh</th>
                <th>Tên sản phẩm</th>
                <th>SKU</th>
                <th>Giá gốc</th>
                <th>Giá bán</th>
                <th>Số lượng</th>
                <th>Danh mục</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod._id}>
                  <td>
                    <img
                      src={getFirstImageUrl(prod.images)}
                      alt={prod.name}
                      className="thumbnail"
                      onError={(e) => {
                        // Nếu ảnh lỗi, hiển thị placeholder
                        e.currentTarget.src =
                          "https://via.placeholder.com/150?text=Error";
                      }}
                    />
                  </td>
                  <td>{prod.name}</td>
                  <td>{prod.sku}</td>
                  <td>{prod.priceOriginal.toLocaleString()} ₫</td>
                  <td>{prod.priceSale.toLocaleString()} ₫</td>
                  <td>{prod.quantity}</td>
                  <td>{prod.categories.map((c) => c.name).join(", ")}</td>
                  <td className="actions">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="btn-small"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingProd(prod)}
                      className="btn-small btn-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProd ? "Sửa" : "Thêm"} sản phẩm</h3>
            <form onSubmit={handleSubmit}>
              {/* Tên sản phẩm */}
              <input
                type="text"
                placeholder="Tên sản phẩm"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              {/* SKU */}
              <input
                type="text"
                placeholder="SKU"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                required
              />

              {/* Giá gốc */}
              <input
                type="number"
                placeholder="Giá gốc (₫)"
                value={formData.priceOriginal}
                onChange={(e) =>
                  setFormData({ ...formData, priceOriginal: e.target.value })
                }
                required
              />

              {/* Giá bán */}
              <input
                type="number"
                placeholder="Giá bán (₫)"
                value={formData.priceSale}
                onChange={(e) =>
                  setFormData({ ...formData, priceSale: e.target.value })
                }
                required
              />

              {/* Số lượng */}
              <input
                type="number"
                placeholder="Số lượng"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />

              {/* Mô tả */}
              <textarea
                placeholder="Mô tả sản phẩm"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              {/* Danh mục */}
              <div className="category-select-wrapper">
                <label>Chọn danh mục (giữ Ctrl/Cmd để chọn nhiều)</label>
                <select
                  multiple
                  value={formData.categories}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categories: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      ),
                    })
                  }
                >
                  {flatCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {"  ".repeat(cat.level)}
                      {cat.level > 0 && "└─ "}
                      {cat.name}
                    </option>
                  ))}
                </select>
                <span className="select-hint">
                  Đã chọn: {formData.categories.length} danh mục
                </span>
              </div>

              {/* Checkbox Hot & On Sale */}
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.hot}
                    onChange={(e) =>
                      setFormData({ ...formData, hot: e.target.checked })
                    }
                  />
                  🔥 Hot
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.onSale}
                    onChange={(e) =>
                      setFormData({ ...formData, onSale: e.target.checked })
                    }
                  />
                  💰 On Sale
                </label>
              </div>

              {/* Upload ảnh */}
              <div className="file-input-wrapper">
                <label className="file-label">Hình ảnh sản phẩm</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <span className="file-hint">
                  Tối đa 3 ảnh, mỗi ảnh dưới 5MB
                </span>
              </div>

              {/* Preview ảnh */}
              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((prev, idx) => (
                    <img
                      key={idx}
                      src={
                        // Nếu là ảnh cũ từ server (bắt đầu bằng /uploads) → dùng getImageUrl
                        prev.startsWith("/uploads") ? getImageUrl(prev) : prev // Nếu là blob URL (file mới upload) → giữ nguyên
                      }
                      alt={`preview-${idx}`}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/150?text=Error";
                      }}
                    />
                  ))}
                </div>
              )}
            </form>

            <div className="modal-actions">
              <button type="button" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary"
                onClick={handleSubmit}
              >
                {editingProd ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm xóa */}
      {deletingProd && (
        <div className="modal-overlay" onClick={() => setDeletingProd(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Xác nhận xóa</h3>
            <p>
              Xóa sản phẩm <strong>{deletingProd.name}</strong>?
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => setDeletingProd(null)}>
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
