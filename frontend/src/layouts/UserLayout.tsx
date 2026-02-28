// UserLayout.tsx
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Footer from "@/components/user/Footer";
import Header from "@/components/user/Header";
import ChatWidget from "@/components/user/ChatWidget";
import LanguageSwitcher from "@/components/user/LanguageSwitcher";
import ContactButtons from "@/components/user/ContactButtons";

const UserLayout = () => {
  const [userInfo, setUserInfo] = useState<{
    userId?: string;
    userName?: string;
    userEmail?: string;
  }>({});

  // Detect mobile để ẩn LanguageSwitcher fixed (Header tự render inline trên mobile)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 992);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
        } else {
          setUserInfo({});
        }
      } catch (error) {
        console.error('Error checking user info:', error);
        setUserInfo({});
      }
    };

    checkUserInfo();

    window.addEventListener('storage', checkUserInfo);
    window.addEventListener('user-login', checkUserInfo);
    window.addEventListener('user-logout', checkUserInfo);

    return () => {
      window.removeEventListener('storage', checkUserInfo);
      window.removeEventListener('user-login', checkUserInfo);
      window.removeEventListener('user-logout', checkUserInfo);
    };
  }, []);

  return (
    <div className="user-layout">
      {/* LanguageSwitcher fixed chỉ hiện trên desktop
          Trên mobile, Header tự render inline language switch */}
      {!isMobile && <LanguageSwitcher />}
      
      <Header />

      <main className="user-content">
        <Outlet />
      </main>

      <Footer />

      {/* Contact buttons — đã ẩn trên mobile qua CSS */}
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