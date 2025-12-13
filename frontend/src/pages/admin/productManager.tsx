// src/admin/pages/ProductManager.tsx - FULL CODE ENHANCED
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, X } from "lucide-react";
import axiosInstance from "../../axios";
import { getImageUrl, getFirstImageUrl } from "@/utils/imageUrl";
import "@/styles/pages/admin/productManager.scss";

interface AttributeOption {
  label: string;
  value: string;
  image?: string;
  isDefault?: boolean;
}

interface Attribute {
  name: string;
  options: AttributeOption[];
}

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
  attributes?: Attribute[];
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
    attributes: [] as Attribute[],
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [attributeImages, setAttributeImages] = useState<Map<string, File | string>>(
    new Map()
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
      imagePreviews.forEach((prev) => {
        if (prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
      });
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
      attributes: [],
    });
    setImagePreviews([]);
    setAttributeImages(new Map());
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
      description: prod.description || "",
      categories: prod.categories.map((c) => c._id),
      hot: prod.hot || false,
      onSale: prod.onSale || false,
      images: [],
      attributes: prod.attributes || [],
    });
    setImagePreviews(prod.images);
    
    // Load existing attribute images
    const newAttrImgMap = new Map<string, File | string>();
    prod.attributes?.forEach((attr, attrIdx) => {
      attr.options?.forEach((opt, optIdx) => {
        if (opt.image) {
          newAttrImgMap.set(`${attrIdx}_${optIdx}`, opt.image);
        }
      });
    });
    setAttributeImages(newAttrImgMap);
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

  const addAttribute = () => {
    setFormData({
      ...formData,
      attributes: [
        ...formData.attributes,
        { name: "", options: [{ label: "", value: "", isDefault: false }] },
      ],
    });
  };

  const removeAttribute = (attrIdx: number) => {
    const newAttrs = formData.attributes.filter((_, i) => i !== attrIdx);
    setFormData({ ...formData, attributes: newAttrs });
  };

  const updateAttributeName = (attrIdx: number, name: string) => {
    const newAttrs = [...formData.attributes];
    newAttrs[attrIdx].name = name;
    setFormData({ ...formData, attributes: newAttrs });
  };

  const addOption = (attrIdx: number) => {
    const newAttrs = [...formData.attributes];
    newAttrs[attrIdx].options.push({ label: "", value: "", isDefault: false });
    setFormData({ ...formData, attributes: newAttrs });
  };

  const removeOption = (attrIdx: number, optIdx: number) => {
    const newAttrs = [...formData.attributes];
    newAttrs[attrIdx].options = newAttrs[attrIdx].options.filter(
      (_, i) => i !== optIdx
    );
    setFormData({ ...formData, attributes: newAttrs });
  };

  const updateOption = (
    attrIdx: number,
    optIdx: number,
    field: keyof AttributeOption,
    value: any
  ) => {
    const newAttrs = [...formData.attributes];
    (newAttrs[attrIdx].options[optIdx] as any)[field] = value;

    if (field === "label") {
      newAttrs[attrIdx].options[optIdx].value = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
    }

    setFormData({ ...formData, attributes: newAttrs });
  };

  const handleAttributeImageChange = (
    attrIdx: number,
    optIdx: number,
    file: File | null
  ) => {
    if (file) {
      const key = `${attrIdx}_${optIdx}`;
      const newMap = new Map(attributeImages);
      newMap.set(key, file);
      setAttributeImages(newMap);
    }
  };

  // Format number with thousand separator
  const formatCurrency = (value: string) => {
    const num = value.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePriceChange = (field: "priceOriginal" | "priceSale", value: string) => {
    const numericValue = value.replace(/\D/g, "");
    setFormData({ ...formData, [field]: numericValue });
  };

  // Calculate discount percentage
  const calculateDiscount = () => {
    const original = parseFloat(formData.priceOriginal) || 0;
    const sale = parseFloat(formData.priceSale) || 0;
    if (original > 0 && sale > 0 && sale < original) {
      const discount = ((original - sale) / original) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append("name", formData.name);
    data.append("sku", formData.sku);
    data.append("priceOriginal", (formData.priceOriginal || "0").toString());
    data.append("priceSale", (formData.priceSale || "0").toString());
    data.append("quantity", (formData.quantity || "0").toString());
    data.append("description", formData.description || "");

    if (formData.categories && formData.categories.length > 0) {
      formData.categories.forEach((cat) => {
        if (cat) {
          data.append("categories[]", cat);
        }
      });
    }

    data.append("hot", formData.hot.toString());
    data.append("onSale", formData.onSale.toString());

    if (formData.images && formData.images.length > 0) {
      formData.images.forEach((file) => data.append("images", file));
    }

    // Only append new attribute images (File objects)
    attributeImages.forEach((file, key) => {
      if (file instanceof File) {
        data.append(`attribute_${key}`, file);
      }
    });

    if (formData.attributes && formData.attributes.length > 0) {
      data.append("attributes", JSON.stringify(formData.attributes));
    }

    try {
      if (editingProd) {
        await axiosInstance.put(`/admin/products/${editingProd._id}`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setSuccessMessage("✅ Cập nhật thành công!");
      } else {
        await axiosInstance.post("/admin/products", data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setSuccessMessage("✅ Thêm sản phẩm thành công!");
      }
      
      setTimeout(() => {
        setSuccessMessage("");
        setShowModal(false);
        fetchProducts();
      }, 1500);
    } catch (err: any) {
      console.error("Lỗi submit:", err);
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{editingProd ? "Sửa" : "Thêm"} sản phẩm</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Tên sản phẩm"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <input
                type="text"
                placeholder="SKU"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                required
              />

              <input
                type="text"
                placeholder="Giá gốc (₫)"
                value={formatCurrency(formData.priceOriginal)}
                onChange={(e) => handlePriceChange("priceOriginal", e.target.value)}
                required
              />

              <div className="price-with-discount">
                <input
                  type="text"
                  placeholder="Giá bán (₫)"
                  value={formatCurrency(formData.priceSale)}
                  onChange={(e) => handlePriceChange("priceSale", e.target.value)}
                  required
                />
                {calculateDiscount() > 0 && (
                  <span className="discount-badge">-{calculateDiscount()}%</span>
                )}
              </div>

              <input
                type="number"
                placeholder="Số lượng"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />

              <textarea
                placeholder="Mô tả sản phẩm"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

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

              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((prev, idx) => (
                    <img
                      key={idx}
                      src={
                        prev.startsWith("/uploads") ? getImageUrl(prev) : prev
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

              {/* PHẦN ATTRIBUTES */}
              <div className="attributes-section">
                <div className="attributes-header">
                  <label className="section-label">Thuộc tính sản phẩm</label>
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="btn-add-attribute"
                  >
                    <Plus size={16} /> Thêm thuộc tính
                  </button>
                </div>

                {formData.attributes.map((attr, attrIdx) => (
                  <div key={attrIdx} className="attribute-card">
                    <div className="attribute-header">
                      <input
                        type="text"
                        placeholder="Tên thuộc tính (VD: Chất liệu, Màu sắc, Kích thước)"
                        value={attr.name}
                        onChange={(e) =>
                          updateAttributeName(attrIdx, e.target.value)
                        }
                        className="attribute-name-input"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttribute(attrIdx)}
                        className="btn-remove-attribute"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="options-list">
                      {attr.options.map((opt, optIdx) => (
                        <div key={optIdx} className="option-item">
                          <input
                            type="text"
                            placeholder="Nhãn option (VD: MDF EC | Duy chuẩn / Không LED)"
                            value={opt.label}
                            onChange={(e) =>
                              updateOption(
                                attrIdx,
                                optIdx,
                                "label",
                                e.target.value
                              )
                            }
                          />

                          <div className="option-image-upload">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleAttributeImageChange(
                                  attrIdx,
                                  optIdx,
                                  e.target.files?.[0] || null
                                )
                              }
                              id={`attr-img-${attrIdx}-${optIdx}`}
                            />
                            <label
                              htmlFor={`attr-img-${attrIdx}-${optIdx}`}
                              className="file-label-small"
                            >
                              Chọn ảnh
                            </label>
                            {attributeImages.has(`${attrIdx}_${optIdx}`) && (
                              <span className="file-selected">✓</span>
                            )}
                            {(attributeImages.get(`${attrIdx}_${optIdx}`) || opt.image) && (
                              <img
                                src={
                                  (() => {
                                    const img = attributeImages.get(`${attrIdx}_${optIdx}`);
                                    if (img instanceof File) {
                                      return URL.createObjectURL(img);
                                    }
                                    if (typeof img === 'string') {
                                      return getImageUrl(img);
                                    }
                                    if (opt.image) {
                                      return getImageUrl(opt.image);
                                    }
                                    return '';
                                  })()
                                }
                                alt="preview"
                                className="attr-img-preview"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const img = attributeImages.get(`${attrIdx}_${optIdx}`);
                                  let imgUrl = '';
                                  if (img instanceof File) {
                                    imgUrl = URL.createObjectURL(img);
                                  } else if (typeof img === 'string') {
                                    imgUrl = getImageUrl(img);
                                  } else if (opt.image) {
                                    imgUrl = getImageUrl(opt.image);
                                  }
                                  if (imgUrl) setPreviewImage(imgUrl);
                                }}
                              />
                            )}
                          </div>

                          <label className="option-default">
                            <input
                              type="checkbox"
                              checked={opt.isDefault || false}
                              onChange={(e) =>
                                updateOption(
                                  attrIdx,
                                  optIdx,
                                  "isDefault",
                                  e.target.checked
                                )
                              }
                            />
                            Mặc định
                          </label>

                          <button
                            type="button"
                            onClick={() => removeOption(attrIdx, optIdx)}
                            className="btn-remove-option"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addOption(attrIdx)}
                        className="btn-add-option"
                      >
                        <Plus size={14} /> Thêm lựa chọn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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

            {successMessage && (
              <div className="success-message">{successMessage}</div>
            )}
          </div>
        </div>
      )}

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

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="image-preview-modal" onClick={() => setPreviewImage(null)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview" onClick={() => setPreviewImage(null)}>
              <X size={24} />
            </button>
            <img src={previewImage} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
}