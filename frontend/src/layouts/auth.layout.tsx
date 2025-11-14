import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Footer from "@/components/user/Footer";
import Header from "@/components/user/Header";
// import CartSidebar from "@/components/user/CartSidebar";
import { FaShoppingCart } from "react-icons/fa";

const AuthLayout: React.FC = () => {
//   const [isCartOpen, setCartOpen] = useState(false);

  return (
    <div className="user-layout">
      <Header />
    
      {/* Cart Sidebar
      <CartSidebar isOpen={isCartOpen} onClose={() => setCartOpen(false)} /> */}

      <main className="user-content">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default AuthLayout;
