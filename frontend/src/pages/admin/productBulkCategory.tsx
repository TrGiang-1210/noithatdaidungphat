// src/admin/pages/ProductBulkCategory.tsx
import { useState, useEffect } from 'react';
import CheckboxTree from '@/components/admin/CheckboxTree';
import "@/styles/pages/admin/productBulkCategory.scss";


export default function ProductBulkCategory() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách sản phẩm (có checkbox)
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);

  // Lấy cây danh mục
  useEffect(() => {
    fetch('/api/admin/categories/tree').then(r => r.json()).then(setCategories);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await fetch('/api/products/bulk-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productIds: selectedProducts,
        categoryIds: selectedCategories
      })
    });
    alert('Gán danh mục thành công!');
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-6">Gán danh mục hàng loạt</h1>

      <div className="grid grid-cols-2 gap-8">
        {/* Bên trái: danh sách sản phẩm */}
        <div className="bg-white rounded shadow">
          <h2 className="p-4 border-b">Chọn sản phẩm ({selectedProducts.length})</h2>
          <div className="max-h-96 overflow-y-auto">
            {products.map(p => (
              <label key={p._id} className="flex items-center p-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(p._id)}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedProducts([...selectedProducts, p._id]);
                    } else {
                      setSelectedProducts(selectedProducts.filter(id => id !== p._id));
                    }
                  }}
                  className="mr-3"
                />
                <img src={p.images[0]} alt="" className="w-10 h-10 object-cover mr-3" />
                <span className="text-sm">{p.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bên phải: cây danh mục */}
        <div className="bg-white rounded shadow">
          <h2 className="p-4 border-b">Chọn danh mục</h2>
          <CheckboxTree
            nodes={categories}
            checked={selectedCategories}
            onCheck={setSelectedCategories}
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={loading || selectedProducts.length === 0}
          className="px-8 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : `Gán danh mục cho ${selectedProducts.length} sản phẩm`}
        </button>
      </div>
    </div>
  );
}