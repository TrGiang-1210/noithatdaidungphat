// UserLayout.tsx
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Footer from "@/components/user/Footer";
import Header from "@/components/user/Header";
import ChatWidget from "@/components/user/ChatWidget";
import LanguageSwitcher from "@/components/user/LanguageSwitcher";
import ContactButtons from "@/components/user/ContactButtons"; // ← THÊM

const UserLayout = () => {
  const [userInfo, setUserInfo] = useState<{
    userId?: string;
    userName?: string;
    userEmail?: string;
  }>({});

  useEffect(() => {
    const checkUserInfo = () => {
      try {
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
          setUserInfo({});
          console.log('👤 Guest user');
        }
      } catch (error) {
        console.error('Error checking user info:', error);
        setUserInfo({});
      }
    };

    checkUserInfo();

    const handleStorageChange = () => {
      checkUserInfo();
    };

    window.addEventListener('storage', handleStorageChange);
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
      <LanguageSwitcher />
      
      <Header />

      <main className="user-content">
        <Outlet />
      </main>

      <Footer />

      {/* Nút liên hệ góc dưới bên trái */}
      <ContactButtons />

      {/* Chat AI góc dưới bên phải */}
      <ChatWidget 
        userId={userInfo.userId}
        userName={userInfo.userName}
        userEmail={userInfo.userEmail}
      />
    </div>
  );
};

export default UserLayout;