// src/admin/pages/ProductManager.tsx - WITH CATEGORY FILTER
import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Search,
  Filter,
  Info,
  ChevronRight,
} from "lucide-react";
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

interface Variant {
  combination: {
    name: { vi: string; zh: string };
    option: { vi: string; zh: string };
  }[];
  priceOriginal: number;
  priceSale: number;
  quantity: number;
  sku: string;
}

interface Product {
  _id: string;
  name: string | { vi: string; zh: string };
  slug: string;
  sku: string;
  images: string[];
  description: string | { vi: string; zh: string };
  priceOriginal: number;
  priceSale: number;
  quantity: number;
  categories: { _id: string; name: string | { vi: string; zh: string } }[];
  hot: boolean;
  onSale: boolean;
  sold: number;
  attributes?: Attribute[];
}

interface Category {
  _id: string;
  name: string | { vi: string; zh: string };
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
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ NEW: Category filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

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
    variants: [] as any[],
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [attributeImages, setAttributeImages] = useState<
    Map<string, File | string>
  >(new Map());
  const [successMessage, setSuccessMessage] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const generateVariants = () => {
    if (formData.attributes.length === 0) {
      alert("Vui lòng thêm thuộc tính trước!");
      return;
    }

    // Thuật toán nhân bản (Cartesian Product)
    let combos: any[][] = [[]];
    formData.attributes.forEach((attr) => {
      const newCombos: any[][] = [];
      attr.options.forEach((opt) => {
        combos.forEach((combo) => {
          newCombos.push([
            ...combo,
            {
              name: { vi: attr.name, zh: "" },
              option: { vi: opt.label, zh: "" },
            },
          ]);
        });
      });
      combos = newCombos;
    });

    // Chuyển kết quả thành mảng variants
    const newVariants = combos.map((combo, index) => ({
      combination: combo,
      priceOriginal: formData.priceOriginal,
      priceSale: formData.priceSale,
      quantity: formData.quantity,
      sku: `${formData.sku}-${index + 1}`,
    }));

    setFormData({ ...formData, variants: newVariants });
  };

  // Hàm cập nhật giá trị cho từng ô trong bảng biến thể
  const handleVariantChange = (
    index: number,
    field: keyof Variant,
    value: any,
  ) => {
    const updatedVariants = [...(formData.variants || [])];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setFormData({ ...formData, variants: updatedVariants });
  };

  // ✅ Helper: Safely get name (multilingual support)
  const getName = (name: any): string => {
    if (typeof name === "object" && name !== null && name.vi) {
      return name.vi;
    }
    return String(name || "");
  };

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
        path: string[] = [],
      ): Category[] => {
        let list: Category[] = [];
        cats.forEach((cat) => {
          const catName = getName(cat.name);
          list.push({ ...cat, level, path: [...path, catName] });
          if (cat.children?.length) {
            list = list.concat(
              flatten(cat.children, level + 1, [...path, catName]),
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

  // ✅ NEW: Filter products by search AND categories
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((prod) => {
        const name = getName(prod.name).toLowerCase();
        const sku = prod.sku.toLowerCase();
        const categories = prod.categories
          .map((c) => getName(c.name).toLowerCase())
          .join(" ");

        return (
          name.includes(searchLower) ||
          sku.includes(searchLower) ||
          categories.includes(searchLower)
        );
      });
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((prod) => {
        return prod.categories.some((cat) =>
          selectedCategories.includes(cat._id),
        );
      });
    }

    return filtered;
  }, [products, searchQuery, selectedCategories]);

  // ✅ NEW: Get product count for each category
  const getCategoryProductCount = (categoryId: string): number => {
    return products.filter((prod) =>
      prod.categories.some((cat) => cat._id === categoryId),
    ).length;
  };

  // ✅ NEW: Toggle expand/collapse category
  const toggleExpandCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // ✅ NEW: Handle category filter change
  const handleCategoryFilterChange = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // ✅ NEW: Clear category filter
  const clearCategoryFilter = () => {
    setSelectedCategories([]);
  };

  // ✅ NEW: Build hierarchical tree from flat categories
  const buildCategoryTree = (categories: Category[]): Category[] => {
    const tree: Category[] = [];
    const categoryMap = new Map<string, Category>();

    // Create a map of all categories
    categories.forEach((cat) => {
      categoryMap.set(cat._id, { ...cat, children: [] });
    });

    // Build the tree
    categories.forEach((cat) => {
      const categoryNode = categoryMap.get(cat._id)!;
      if (cat.level === 0) {
        tree.push(categoryNode);
      } else {
        // Find parent in the original categories list
        const parent = categories.find((c) => {
          // Check if this category is a direct child of the potential parent
          const parentPath = c.path.join("/");
          const childPath = cat.path.slice(0, -1).join("/");
          return c._id !== cat._id && parentPath === childPath;
        });

        if (parent) {
          const parentNode = categoryMap.get(parent._id);
          if (parentNode) {
            parentNode.children = parentNode.children || [];
            parentNode.children.push(categoryNode);
          }
        }
      }
    });

    return tree;
  };

  const categoryTree = useMemo(
    () => buildCategoryTree(flatCategories),
    [flatCategories],
  );

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when search query, categories, or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

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
      variants: prod.variants || [],
    });
    setImagePreviews([]);
    setAttributeImages(new Map());
    setShowModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProd(prod);

    // ✅ Convert multilingual attributes back to simple string format for editing
    const convertedAttributes = (prod.attributes || []).map((attr) => ({
      name: getName(attr.name),
      options: (attr.options || []).map((opt) => ({
        label: getName(opt.label),
        value: opt.value || "",
        image: opt.image,
        isDefault: opt.isDefault || false,
      })),
    }));

    setFormData({
      name: getName(prod.name),
      sku: prod.sku,
      priceOriginal: prod.priceOriginal.toString(),
      priceSale: prod.priceSale.toString(),
      quantity: prod.quantity.toString(),
      description: getName(prod.description),
      categories: prod.categories.map((c) => c._id),
      hot: prod.hot || false,
      onSale: prod.onSale || false,
      images: [],
      attributes: convertedAttributes,
      variants: prod.variants || [],
    });
    setImagePreviews(prod.images);

    const newAttrImgMap = new Map<string, File | string>();
    convertedAttributes.forEach((attr, attrIdx) => {
      attr.options.forEach((opt, optIdx) => {
        if (opt.image) {
          newAttrImgMap.set(`${attrIdx}_${optIdx}`, opt.image);
        }
      });
    });
    setAttributeImages(newAttrImgMap);
    setShowModal(true);
  };

  const formatCurrency = (value: string) => {
    const num = value.replace(/\D/g, "");
    return num ? parseInt(num).toLocaleString() : "";
  };

  const handlePriceChange = (
    field: "priceOriginal" | "priceSale",
    value: string,
  ) => {
    const numericValue = value.replace(/\D/g, "");
    setFormData({ ...formData, [field]: numericValue });
  };

  const calculateDiscount = () => {
    const original = parseFloat(formData.priceOriginal);
    const sale = parseFloat(formData.priceSale);
    if (original && sale && sale < original) {
      return Math.round(((original - sale) / original) * 100);
    }
    return 0;
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 3) {
      alert("Chỉ được chọn tối đa 3 ảnh");
      return;
    }
    setFormData({ ...formData, images: files });
    const previews = files.map((f) => URL.createObjectURL(f));
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

  const removeAttribute = (index: number) => {
    const newAttrs = formData.attributes.filter((_, i) => i !== index);
    setFormData({ ...formData, attributes: newAttrs });

    const newAttrImgMap = new Map(attributeImages);
    Array.from(attributeImages.keys()).forEach((key) => {
      const [attrIdx] = key.split("_").map(Number);
      if (attrIdx === index) {
        newAttrImgMap.delete(key);
      } else if (attrIdx > index) {
        const [, optIdx] = key.split("_").map(Number);
        const img = attributeImages.get(key);
        newAttrImgMap.delete(key);
        newAttrImgMap.set(`${attrIdx - 1}_${optIdx}`, img!);
      }
    });
    setAttributeImages(newAttrImgMap);
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
      (_, i) => i !== optIdx,
    );
    setFormData({ ...formData, attributes: newAttrs });

    const newAttrImgMap = new Map(attributeImages);
    const key = `${attrIdx}_${optIdx}`;
    newAttrImgMap.delete(key);

    Array.from(attributeImages.keys()).forEach((k) => {
      const [aIdx, oIdx] = k.split("_").map(Number);
      if (aIdx === attrIdx && oIdx > optIdx) {
        const img = attributeImages.get(k);
        newAttrImgMap.delete(k);
        newAttrImgMap.set(`${aIdx}_${oIdx - 1}`, img!);
      }
    });
    setAttributeImages(newAttrImgMap);
  };

  const updateOption = (
    attrIdx: number,
    optIdx: number,
    field: keyof AttributeOption,
    value: any,
  ) => {
    const newAttrs = [...formData.attributes];
    if (field === "isDefault" && value === true) {
      newAttrs[attrIdx].options.forEach((opt) => (opt.isDefault = false));
    }
    newAttrs[attrIdx].options[optIdx] = {
      ...newAttrs[attrIdx].options[optIdx],
      [field]: value,
    };
    setFormData({ ...formData, attributes: newAttrs });
  };

  const handleAttributeImageChange = (
    attrIdx: number,
    optIdx: number,
    file: File | null,
  ) => {
    if (!file) return;
    const newAttrImgMap = new Map(attributeImages);
    newAttrImgMap.set(`${attrIdx}_${optIdx}`, file);
    setAttributeImages(newAttrImgMap);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const form = new FormData();

    // 1. Các trường cơ bản
    form.append("name", typeof formData.name === 'string' ? formData.name : JSON.stringify(formData.name));
    form.append("sku", formData.sku);
    form.append("priceOriginal", formData.priceOriginal.toString());
    form.append("priceSale", formData.priceSale.toString());
    form.append("quantity", formData.quantity.toString());
    form.append("description", typeof formData.description === 'string' ? formData.description : JSON.stringify(formData.description));
    form.append("hot", formData.hot.toString());
    form.append("onSale", formData.onSale.toString());

    // 2. Xử lý Categories
    formData.categories.forEach((catId) => {
      form.append("categories[]", catId);
    });

    // 3. Xử lý Ảnh chính
    formData.images.forEach((img) => {
      form.append("images", img);
    });

    // 4. Xử lý Attributes (Thuộc tính)
    const attributesForBackend = formData.attributes.map((attr, attrIdx) => ({
      name: { vi: attr.name, zh: "" },
      options: attr.options.map((opt, optIdx) => {
        const key = `${attrIdx}_${optIdx}`;
        const imgFile = attributeImages.get(key);
        return {
          label: { vi: opt.label, zh: "" },
          value: opt.value || opt.label.toLowerCase().replace(/\s+/g, "-"),
          isDefault: opt.isDefault || false,
          imageKey: imgFile instanceof File ? key : undefined,
          existingImage: typeof imgFile === "string" ? imgFile : opt.image,
        };
      }),
    }));
    form.append("attributes", JSON.stringify(attributesForBackend));

    // ==========================================
    // PHẦN B: LƯU BIẾN THỂ (VARIANTS) - THÊM VÀO ĐÂY
    // ==========================================
    if (formData.variants && formData.variants.length > 0) {
      form.append("variants", JSON.stringify(formData.variants));
    }
    // ==========================================

    // 5. Xử lý Ảnh của thuộc tính (nếu có)
    attributeImages.forEach((img, key) => {
      if (img instanceof File) {
        form.append(`attributeImages[${key}]`, img);
      }
    });

    // 6. Gửi API
    if (editingProd) {
      await axiosInstance.put(`/admin/products/${editingProd._id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMessage("Cập nhật sản phẩm thành công!");
    } else {
      await axiosInstance.post("/admin/products", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMessage("Thêm sản phẩm thành công!");
    }

    setTimeout(() => setSuccessMessage(""), 1500);
    fetchProducts();
    setShowModal(false);
  } catch (err: any) {
    console.error("Submit error:", err);
    alert(err.response?.data?.message || "Lỗi khi lưu sản phẩm");
  }
};

  const handleDelete = async () => {
    if (!deletingProd) return;
    try {
      await axiosInstance.delete(`/admin/products/${deletingProd._id}`);
      setSuccessMessage("Xóa sản phẩm thành công!");
      setTimeout(() => setSuccessMessage(""), 1500);
      fetchProducts();
      setDeletingProd(null);
    } catch (err) {
      alert("Lỗi khi xóa sản phẩm");
    }
  };

  if (loading) {
    return (
      <div
        className="product-manager"
        style={{ textAlign: "center", padding: "100px" }}
      >
        <Loader2 size={48} className="spin" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="product-manager">
      <div className="page-header">
        <h1 className="page-title">Quản lý sản phẩm</h1>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={20} />
          Thêm sản phẩm
        </button>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm theo tên, SKU, danh mục..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <span className="search-result-count">
            Tìm thấy {filteredProducts.length} sản phẩm
          </span>
        )}
      </div>

      {/* ✅ NEW: CATEGORY FILTER SECTION */}
      <div className="category-filter-section">
        <div className="filter-header">
          <div className="filter-title">
            <Filter size={18} />
            Lọc theo danh mục
          </div>
          <button
            className="btn-clear-filter"
            onClick={clearCategoryFilter}
            disabled={selectedCategories.length === 0}
          >
            <X size={16} />
            Xóa bộ lọc
          </button>
        </div>

        <div className="filter-content">
          <div className="category-tree-wrapper">
            {categoryTree.length === 0 ? (
              <div className="empty-categories">Chưa có danh mục nào</div>
            ) : (
              categoryTree.map((parentCat) => {
                const hasChildren =
                  parentCat.children && parentCat.children.length > 0;
                const isExpanded = expandedCategories.has(parentCat._id);
                const parentCount = getCategoryProductCount(parentCat._id);

                return (
                  <div
                    key={parentCat._id}
                    className={`category-tree-item ${hasChildren ? "has-children" : "no-children"}`}
                  >
                    <div className="category-parent">
                      {hasChildren && (
                        <div
                          className={`expand-icon ${isExpanded ? "expanded" : ""}`}
                          onClick={() => toggleExpandCategory(parentCat._id)}
                        >
                          <ChevronRight size={16} />
                        </div>
                      )}
                      {!hasChildren && <div className="expand-icon" />}

                      <div className="category-checkbox-wrapper">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(parentCat._id)}
                          onChange={() =>
                            handleCategoryFilterChange(parentCat._id)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="category-label">
                          {getName(parentCat.name)}
                        </span>
                        <span className="category-count">{parentCount}</span>
                      </div>
                    </div>

                    {hasChildren && isExpanded && (
                      <div className="category-children">
                        {parentCat.children!.map((childCat) => {
                          const childCount = getCategoryProductCount(
                            childCat._id,
                          );
                          return (
                            <div
                              key={childCat._id}
                              className="category-child"
                              onClick={() =>
                                handleCategoryFilterChange(childCat._id)
                              }
                            >
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(
                                  childCat._id,
                                )}
                                onChange={() =>
                                  handleCategoryFilterChange(childCat._id)
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="child-label">
                                {getName(childCat.name)}
                              </span>
                              <span className="child-count">{childCount}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="selected-categories">
            <div className="selected-header">Đã chọn</div>
            {selectedCategories.length > 0 ? (
              <div className="selected-items">
                {selectedCategories.map((catId) => {
                  const category = flatCategories.find((c) => c._id === catId);
                  if (!category) return null;
                  const count = getCategoryProductCount(catId);
                  return (
                    <div key={catId} className="selected-tag">
                      <span>{getName(category.name)}</span>
                      <span className="tag-count">{count}</span>
                      <button onClick={() => handleCategoryFilterChange(catId)}>
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <Filter size={32} />
                <span>Chưa chọn danh mục nào</span>
              </div>
            )}
          </div>
        </div>

        <div className="filter-stats">
          <div className="stats-left">
            {selectedCategories.length > 0 ? (
              <>
                Đang lọc <strong>{filteredProducts.length}</strong> sản phẩm
              </>
            ) : (
              <>
                Tổng cộng <strong>{products.length}</strong> sản phẩm
              </>
            )}
          </div>
          <div className="stats-right">
            <div className="stat-item">
              <span>Tổng danh mục:</span>
              <span className="stat-value">{flatCategories.length}</span>
            </div>
            <div className="stat-item">
              <span>Đã chọn:</span>
              <span className="stat-value">{selectedCategories.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="product-table">
        {currentProducts.length === 0 ? (
          <p className="empty">
            {searchQuery || selectedCategories.length > 0
              ? `Không tìm thấy sản phẩm nào${searchQuery ? ` với từ khóa "${searchQuery}"` : ""}${selectedCategories.length > 0 ? " trong danh mục đã chọn" : ""}`
              : "Chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên!"}
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
              {currentProducts.map((prod) => (
                <tr key={prod._id}>
                  <td>
                    <img
                      src={getFirstImageUrl(prod.images)}
                      alt={getName(prod.name)}
                      className="thumbnail"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/150?text=Error";
                      }}
                    />
                  </td>
                  <td>{getName(prod.name)}</td>
                  <td>{prod.sku}</td>
                  <td>{prod.priceOriginal.toLocaleString()} ₫</td>
                  <td>{prod.priceSale.toLocaleString()} ₫</td>
                  <td>{prod.quantity}</td>
                  <td>
                    {prod.categories.map((c) => getName(c.name)).join(", ")}
                  </td>
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

      {filteredProducts.length > 0 && (
        <div className="pagination">
          <div className="pagination-left">
            <div className="items-per-page">
              <span>Hiển thị:</span>
              <select
                value={itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(Number(e.target.value))
                }
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={100}>100</option>
              </select>
              <span>sản phẩm/trang</span>
            </div>
            <div className="page-info">
              Hiển thị {startIndex + 1}-
              {Math.min(endIndex, filteredProducts.length)} trong tổng số{" "}
              {filteredProducts.length} sản phẩm
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`pagination-number ${currentPage === page ? "active" : ""}`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="pagination-ellipsis">
                          ...
                        </span>
                      );
                    }
                    return null;
                  },
                )}
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
                onChange={(e) =>
                  handlePriceChange("priceOriginal", e.target.value)
                }
                required
              />

              <div className="price-with-discount">
                <input
                  type="text"
                  placeholder="Giá bán (₫)"
                  value={formatCurrency(formData.priceSale)}
                  onChange={(e) =>
                    handlePriceChange("priceSale", e.target.value)
                  }
                  required
                />
                {calculateDiscount() > 0 && (
                  <span className="discount-badge">
                    -{calculateDiscount()}%
                  </span>
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
                <label>Danh mục sản phẩm</label>
                <select
                  multiple
                  value={formData.categories}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions);
                    const values = options.map((opt) => opt.value);
                    setFormData({ ...formData, categories: values });
                  }}
                >
                  {flatCategories.map((cat) => {
                    const indent = "  ".repeat(cat.level);
                    return (
                      <option key={cat._id} value={cat._id}>
                        {indent}
                        {getName(cat.name)}
                      </option>
                    );
                  })}
                </select>
                <span className="select-hint">
                  Nhấn Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều danh mục
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
                  Sản phẩm Hot
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.onSale}
                    onChange={(e) =>
                      setFormData({ ...formData, onSale: e.target.checked })
                    }
                  />
                  Đang khuyến mãi
                </label>
              </div>

              <div className="file-input-wrapper">
                <label className="file-label">Hình ảnh sản phẩm</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
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
                                e.target.value,
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
                                  e.target.files?.[0] || null,
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
                            {(attributeImages.get(`${attrIdx}_${optIdx}`) ||
                              opt.image) && (
                              <img
                                src={(() => {
                                  const img = attributeImages.get(
                                    `${attrIdx}_${optIdx}`,
                                  );
                                  if (img instanceof File) {
                                    return URL.createObjectURL(img);
                                  }
                                  if (typeof img === "string") {
                                    return getImageUrl(img);
                                  }
                                  if (opt.image) {
                                    return getImageUrl(opt.image);
                                  }
                                  return "";
                                })()}
                                alt="preview"
                                className="attr-img-preview"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const img = attributeImages.get(
                                    `${attrIdx}_${optIdx}`,
                                  );
                                  let imgUrl = "";
                                  if (img instanceof File) {
                                    imgUrl = URL.createObjectURL(img);
                                  } else if (typeof img === "string") {
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
                                  e.target.checked,
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

              {/* Bảng biến thể */}
              <div className="variants-section">
                <div className="variants-header">
                  <h4>Phân loại hàng (Biến thể)</h4>
                  <button
                    type="button"
                    className="btn-generate"
                    onClick={generateVariants}
                  >
                    Tạo danh sách phân loại
                  </button>
                </div>

                {formData.variants && formData.variants.length > 0 && (
                  <div className="variants-table-wrapper">
                    <table className="variants-table">
                      <thead>
                        <tr>
                          <th>Phân loại</th>
                          <th>Giá bán (VNĐ)</th>
                          <th>Kho hàng</th>
                          <th>SKU</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.variants.map((v, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className="variant-label">
                                {v.combination
                                  .map((c: any) => c.option.vi)
                                  .join(" / ")}
                              </span>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="price-input"
                                value={v.priceSale}
                                onChange={(e) => {
                                  const newVariants = [
                                    ...(formData.variants || []),
                                  ];
                                  newVariants[idx].priceSale = Number(
                                    e.target.value,
                                  );
                                  setFormData({
                                    ...formData,
                                    variants: newVariants,
                                  });
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={v.quantity}
                                onChange={(e) => {
                                  const newVariants = [
                                    ...(formData.variants || []),
                                  ];
                                  newVariants[idx].quantity = Number(
                                    e.target.value,
                                  );
                                  setFormData({
                                    ...formData,
                                    variants: newVariants,
                                  });
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => {
                                  const newVariants = [
                                    ...(formData.variants || []),
                                  ];
                                  newVariants[idx].sku = e.target.value;
                                  setFormData({
                                    ...formData,
                                    variants: newVariants,
                                  });
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
              Xóa sản phẩm <strong>{getName(deletingProd.name)}</strong>?
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

      {previewImage && (
        <div
          className="image-preview-modal"
          onClick={() => setPreviewImage(null)}
        >
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-preview"
              onClick={() => setPreviewImage(null)}
            >
              <X size={24} />
            </button>
            <img src={previewImage} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
