import React, { useContext } from "react";
import { ToastContainer } from "react-toastify";
import { AuthContext } from "./context/AuthContext";
import { useLanguage } from "./context/LanguageContext";
import MainRouter from "./router/index.router";
import ChatWidget from "./components/user/ChatWidget";
import LanguageSwitcher from "./components/user/LanguageSwitcher";
import "react-toastify/dist/ReactToastify.css";

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { loading: langLoading } = useLanguage();

  // Loading state
  if (authLoading || langLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div className="spinner"></div>
        <div>{langLoading ? 'Đang tải ngôn ngữ...' : 'Đang tải...'}</div>
      </div>
    );
  }

  // ✅ KIỂM TRA: Chỉ render ChatWidget khi có user hợp lệ
  const shouldShowChat = user && 
                        user.id && 
                        user.name && 
                        user.role !== 'admin';

  return (
    <>
      {/* Language Switcher - Fixed position */}
      {/* <LanguageSwitcher /> */}
      
      <MainRouter />
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* ✅ ChatWidget - Chỉ render khi có user, unmount khi logout */}
      {shouldShowChat && (
        <ChatWidget
          key={`chat-${user.id}`}
          userId={user.id}
          userName={user.name}
          userEmail={user.email}
        />
      )}
      
      {/* ✅ DEBUG: Hiển thị trạng thái user (chỉ trong development) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          padding: '5px 10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          fontSize: '11px',
          borderRadius: '4px',
          zIndex: 999999
        }}>
          User: {user?.id || 'null'} | Chat: {shouldShowChat ? '✅' : '❌'}
        </div>
      )}
    </>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;