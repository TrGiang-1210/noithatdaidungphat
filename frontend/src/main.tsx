// main.tsx – SỬA THÀNH THẾ NÀY LÀ HẾT NHẤP NHÁY NGAY!
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { CartProvider } from "@/context/CartContext";
import { OrderProvider } from "@/context/OrderContext";
import { AuthProvider } from "@/context/AuthContext";   // ← THÊM DÒNG NÀY

import "@/styles/main.scss";
import "react-toastify/dist/ReactToastify.css";
import "swiper/css";

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>                  {/* ← BỌC TOÀN BỘ APP VÀO ĐÂY */}
          <CartProvider>
            <OrderProvider>
              <App />
            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
}