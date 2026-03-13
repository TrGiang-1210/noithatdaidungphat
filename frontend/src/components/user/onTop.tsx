import React, { useState, useEffect } from "react";
import "@/styles/components/user/onTop.scss";

const OnTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      className="on-top-btn"
      onClick={scrollToTop}
      aria-label="Lên đầu trang"
      title="Lên đầu trang"
    >
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
        <circle cx="100" cy="100" r="94" fill="#001f3f" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="#d6a041" strokeWidth="1.5" opacity="0.45" />
        <line x1="100" y1="148" x2="100" y2="62" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        <polyline
          points="78,88 100,58 122,88"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default OnTop;