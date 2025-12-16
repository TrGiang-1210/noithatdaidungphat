import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Footer from "@/components/user/Footer";
import Header from "@/components/user/Header";
import ChatWidget from "@/components/user/ChatWidget";

const UserLayout = () => {
  const [userInfo, setUserInfo] = useState<{
    userId?: string;
    userName?: string;
    userEmail?: string;
  }>({});

  useEffect(() => {
    // ✅ LẤY THÔNG TIN USER TỪ LOCALSTORAGE/CONTEXT
    const checkUserInfo = () => {
      try {
        // Lấy từ localStorage (hoặc từ Context/Redux của bạn)
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setUserInfo({
            userId: user._id || user.id,
            userName: user.name,
            userEmail: user.email
          });
          console.log('✅ User logged in:', user.name);
        } else {
          // Guest - không có user info
          setUserInfo({});
          console.log('👤 Guest user');
        }
      } catch (error) {
        console.error('Error checking user info:', error);
        setUserInfo({});
      }
    };

    checkUserInfo();

    // ✅ LISTEN STORAGE CHANGES (khi login/logout từ tab khác)
    const handleStorageChange = () => {
      checkUserInfo();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // ✅ LISTEN CUSTOM EVENT (khi login/logout trong cùng tab)
    window.addEventListener('user-login', checkUserInfo);
    window.addEventListener('user-logout', checkUserInfo);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-login', checkUserInfo);
      window.removeEventListener('user-logout', checkUserInfo);
    };
  }, []);

  return (
    <div className="user-layout">
      <Header />

      <main className="user-content">
        <Outlet />
      </main>

      <Footer />

      {/* ✅ CHAT WIDGET với user info */}
      <ChatWidget 
        userId={userInfo.userId}
        userName={userInfo.userName}
        userEmail={userInfo.userEmail}
      />
    </div>
  );
};

export default UserLayout;