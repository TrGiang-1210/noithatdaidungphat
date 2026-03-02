import React, { useState, useRef, useEffect } from 'react';
import "@/styles/pages/user/colorChoice.scss";
import { FaPalette, FaChevronRight } from 'react-icons/fa';
import SEO from '../../components/SEO';

const colorCategories = [
  {
    id: 1,
    name: 'Nội thất văn phòng',
    shortName: 'Văn phòng',
    desc: 'Bảng màu gỗ công nghiệp cho không gian làm việc hiện đại',
    accent: '#8B6F47',
    swatch: ['#2C1810', '#4A3728', '#8B6F47', '#C4A882', '#E8D5B7', '#F5EFE6'],
    image: '/images/colors/noi-that-van-phong.jpg',
  },
  {
    id: 2,
    name: 'Giường & Phòng ngủ',
    shortName: 'Phòng ngủ',
    desc: 'Tông màu êm dịu, ấm áp cho không gian nghỉ ngơi',
    accent: '#6B4E3D',
    swatch: ['#1A0F0A', '#3D2314', '#6B4E3D', '#A07850', '#D4B896', '#F0E6D8'],
    image: '/images/colors/bang-mau-test.jpg',
  },
  {
    id: 3,
    name: 'Tủ quần áo',
    shortName: 'Tủ áo',
    desc: 'Đa dạng màu sắc từ cổ điển đến hiện đại cho tủ đựng đồ',
    accent: '#5C4A3A',
    swatch: ['#0D0908', '#2E1F15', '#5C4A3A', '#8C7060', '#BFA88A', '#EDE0D0'],
    image: '/images/colors/tu-quan-ao.jpg',
  },
];

const ColorChoice: React.FC = () => {
  const [selectedId, setSelectedId] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const selected = colorCategories.find(c => c.id === selectedId)!;

  const handleSelect = (id: number) => {
    if (id === selectedId) return;
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedId(id);
      setIsAnimating(false);
    }, 220);
  };

  return (
    <div className="cc-page">
      <SEO title="Bảng Màu Nội Thất" url="/mau-mau" />
      {/* ── HEADER ── */}
      <div className="cc-hero">
        <div className="cc-hero-wood" />
        <div className="cc-hero-inner">
          <div className="cc-hero-eyebrow">
            <FaPalette />
            <span>Catalogue màu sắc</span>
          </div>
          <h1 className="cc-hero-title">Bảng Màu Nội Thất</h1>
          <p className="cc-hero-sub">Chất lượng cao · Đa dạng màu sắc · Giá cạnh tranh</p>
          {/* Decorative swatches */}
          <div className="cc-hero-swatches">
            {['#1A0F0A','#4A3728','#8B6F47','#C4A882','#E8D5B7','#F5EFE6',
              '#2E1F15','#6B4E3D','#A07850','#BFA88A'].map((c, i) => (
              <span key={i} className="cc-hero-swatch" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="cc-main">

        {/* SIDEBAR — desktop */}
        <aside className="cc-sidebar">
          <div className="cc-sidebar-label">Danh mục</div>
          {colorCategories.map(cat => (
            <button
              key={cat.id}
              className={`cc-tab ${selectedId === cat.id ? 'active' : ''}`}
              onClick={() => handleSelect(cat.id)}
            >
              <div className="cc-tab-swatches">
                {cat.swatch.slice(0, 4).map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </div>
              <div className="cc-tab-info">
                <div className="cc-tab-name">{cat.name}</div>
                <div className="cc-tab-desc">{cat.shortName}</div>
              </div>
              <FaChevronRight className="cc-tab-arrow" />
            </button>
          ))}
        </aside>

        {/* CONTENT */}
        <div className="cc-content">

          {/* Mobile tab pills */}
          <div className="cc-mobile-tabs">
            {colorCategories.map(cat => (
              <button
                key={cat.id}
                className={`cc-pill ${selectedId === cat.id ? 'active' : ''}`}
                onClick={() => handleSelect(cat.id)}
                style={selectedId === cat.id ? { borderColor: cat.accent, color: cat.accent } : {}}
              >
                <span className="cc-pill-dot" style={{ background: cat.accent }} />
                {cat.shortName}
              </button>
            ))}
          </div>

          {/* Category heading */}
          <div className="cc-content-header" style={{ '--accent': selected.accent } as React.CSSProperties}>
            <div className="cc-content-swatch-row">
              {selected.swatch.map((c, i) => (
                <div key={i} className="cc-swatch-chip" title={c}>
                  <div className="cc-swatch-color" style={{ background: c }} />
                  <div className="cc-swatch-hex">{c}</div>
                </div>
              ))}
            </div>
            <div className="cc-content-meta">
              <h2 className="cc-content-title">{selected.name}</h2>
              <p className="cc-content-desc">{selected.desc}</p>
            </div>
          </div>

          {/* Image panel */}
          <div className={`cc-chart-panel ${isAnimating ? 'fade-out' : 'fade-in'}`}>
            <div className="cc-chart-inner">
              <img
                ref={imgRef}
                src={selected.image}
                alt={`Bảng màu ${selected.name}`}
              />
            </div>
            <div className="cc-chart-footer">
              <span>* Màu thực tế có thể chênh lệch nhẹ so với hình ảnh do điều kiện ánh sáng và thiết bị hiển thị</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorChoice;