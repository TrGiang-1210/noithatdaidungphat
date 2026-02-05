import React, { useState } from 'react';
import "@/styles/pages/user/colorChoice.scss";

const ColorChoice: React.FC = () => {
  // Danh sách các danh mục màu
  const colorCategories = [
    { 
      id: 1, 
      name: 'Nội thất văn phòng', 
      image: '/images/colors/noi-that-van-phong.jpg' 
    },
    { 
      id: 2, 
      name: 'Giường', 
      image: '/images/colors/bang-mau-test.jpg' 
    },
    { 
      id: 3, 
      name: 'Tủ quần áo', 
      image: '/images/colors/tu-quan-ao.jpg' 
    },
  ];

  // State để lưu danh mục đang được chọn
  const [selectedCategory, setSelectedCategory] = useState(colorCategories[0]);

  return (
    <div className="color-choice">
      {/* Header */}
      <div className="page-header">
        <h1>Bảng Màu</h1>
        <p>Chất lượng cao - Đa dạng màu sắc - Giá cạnh tranh</p>
      </div>

      {/* Container */}
      <div className="container">
        {/* Category Tabs */}
        <div className="category-tabs">
          {colorCategories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory.id === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Color Chart Image */}
        <div className="color-chart">
          <img 
            src={selectedCategory.image} 
            alt={`Bảng màu ${selectedCategory.name}`}
            key={selectedCategory.id} // Để trigger animation khi đổi ảnh
          />
        </div>
      </div>
    </div>
  );
};

export default ColorChoice;