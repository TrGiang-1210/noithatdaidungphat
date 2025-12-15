// frontend/src/App.tsx - UPDATED VERSION
import React, { useContext } from "react";
import { ToastContainer } from "react-toastify";
import { AuthContext } from "./context/AuthContext";
import MainRouter from "./router/index.router";
import ChatWidget from "./components/user/ChatWidget";
import "react-toastify/dist/ReactToastify.css";

// ✅ Component con để có thể sử dụng AuthContext
const AppContent: React.FC = () => {
  const { user, loading } = useContext(AuthContext);

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <MainRouter />
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* ✅ CHAT WIDGET - Chỉ hiện khi:
          1. User đã đăng nhập (user !== null)
          2. User không phải admin (role !== 'admin')
          3. User có đủ thông tin cần thiết (id, name, email)
      */}
      {user && 
       user.id && 
       user.name && 
       user.role !== 'admin' && (
        <ChatWidget
          key={`chat-${user.id}`} // ✅ Key thay đổi khi user thay đổi
          userId={user.id}
          userName={user.name}
          userEmail={user.email}
        />
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <AppContent />
  );
};

export default App;