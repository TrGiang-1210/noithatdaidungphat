import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Footer from "@/components/user/Footer";
import Header from "@/components/user/Header";
import ChatWidget from "@/components/user/ChatWidget"; // ← THÊM

const UserLayout = () => {
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // Lấy hoặc tạo userId cho chat
    let id = localStorage.getItem('chatUserId');
    if (!id) {
      // Tạo unique ID cho khách
      id = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chatUserId', id);
    }
    setUserId(id);
  }, []);

  return (
    <div className="user-layout">
      <Header />

      <main className="user-content">
        <Outlet />
      </main>

      <Footer />

      {/* ✅ CHAT WIDGET - hiển thị ở tất cả trang */}
      {userId && (
        <ChatWidget 
          userId={userId}
          userName="Khách"
          userEmail=""
        />
      )}
    </div>
  );
};

export default UserLayout;