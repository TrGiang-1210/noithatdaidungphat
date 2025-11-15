import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "@/styles/pages/user/home.scss";

 // Import ảnh banner (thay bằng tên file thật nếu khác)
  import banner1 from "@/assets/banner/banner1.jpg";
  import banner2 from "@/assets/banner/banner2.jpg";
  import banner3 from "@/assets/banner/banner3.jpg";
const Home: React.FC = () => {
 

  const banners = [
    { src: banner1, alt: "Banner 1" },
    { src: banner2, alt: "Banner 2" },
    { src: banner3, alt: "Banner 3" },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderWrapperRef = useRef<HTMLDivElement>(null);  // Ref cho wrapper chứa all img
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  // Tự động chuyển slide với vòng lặp
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);  // Chuyển sau 5 giây, và quay lại đầu khi hết
    return () => clearInterval(interval);
  }, [currentSlide, banners.length]);

  // Hàm chuyển slide với hiệu ứng swipe ngang
  const transitionSlide = (newSlide: number, direction: 'next' | 'prev') => {
    if (sliderWrapperRef.current) {
      const width = sliderWrapperRef.current.clientWidth / banners.length;
      sliderWrapperRef.current.style.transition = 'transform 0.5s ease';
      sliderWrapperRef.current.style.transform = `translateX(-${newSlide * 100}%)`;
    }
    setCurrentSlide(newSlide);
  };

  const prevSlide = () => {
    const newSlide = (currentSlide - 1 + banners.length) % banners.length;
    transitionSlide(newSlide, 'prev');
  };

  const nextSlide = () => {
    const newSlide = (currentSlide + 1) % banners.length;
    transitionSlide(newSlide, 'next');
  };

  // Xử lý swipe với animation frame
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    currentXRef.current = startXRef.current;
    if (sliderWrapperRef.current) {
      sliderWrapperRef.current.style.transition = 'none';  // Tắt transition khi kéo
    }
    cancelAnimationFrame(animationFrameRef.current!);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    currentXRef.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = currentXRef.current - startXRef.current;

    // Update mượt với requestAnimationFrame
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      if (sliderWrapperRef.current) {
        const currentTranslate = -currentSlide * 100;
        sliderWrapperRef.current.style.transform = `translateX(${currentTranslate + (deltaX / sliderWrapperRef.current.clientWidth) * 100}%)`;
      }
    });
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const deltaX = currentXRef.current - startXRef.current;
    const threshold = 50;  // Giảm threshold để swipe nhạy hơn
    const velocity = Math.abs(deltaX) / 100;

    if (Math.abs(deltaX) > threshold || velocity > 1.5) {
      if (deltaX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    } else {
      // Reset về slide hiện tại nếu không vượt threshold
      if (sliderWrapperRef.current) {
        sliderWrapperRef.current.style.transition = 'transform 0.3s ease-out';
        sliderWrapperRef.current.style.transform = `translateX(-${currentSlide * 100}%)`;
      }
    }
  };

  return (
    <div className="home-page">
      {/* Phần Banner với layout: Danh mục bên trái, Banner bên phải */}
      <section className="banner-section">
        <div className="container banner-layout">
          {/* Cột trái: Danh mục sản phẩm */}
          <div className="category-col">
            <h3 className="category-title">Danh mục sản phẩm</h3>
            <ul className="category-list">
              <li><Link to="/giuong-ngu">Giường Ngủ</Link></li>
              <li><Link to="/tu-quan-ao">Tủ Quần Áo</Link></li>
              <li><Link to="/sofa-go">Bộ Sofa Gỗ</Link></li>
              <li><Link to="/ke-tivi">Kệ Tivi</Link></li>
              <li><Link to="/tu-ruou">Tủ Rượu</Link></li>
              <li><Link to="/phong-tho">Phòng Thờ</Link></li>
              {/* Thêm các danh mục khác nếu cần */}
            </ul>
          </div>

          {/* Cột phải: Banner Slider */}
          <div className="slider-col">
            <div 
              className="slider" 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={handleTouchMove}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              <div className="slider-wrapper" ref={sliderWrapperRef}>
                {banners.map((banner, index) => (
                  <img
                    key={index}
                    src={banner.src}
                    alt={banner.alt}
                    className="slider-img"
                  />
                ))}
              </div>
              <button className="slider-btn prev" onClick={prevSlide}>
                ❮
              </button>
              <button className="slider-btn next" onClick={nextSlide}>
                ❯
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Các phần khác của trang home có thể thêm sau */}
    </div>
  );
};

export default Home;