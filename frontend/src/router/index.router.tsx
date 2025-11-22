// src/router/index.router.tsx – BẢN FIX CUỐI CÙNG, ĐẢM BẢO KHÔNG NHẢY + KHÔNG NHÁY
import { Route, Routes } from "react-router-dom";
import UserLayout from "../layouts/UserLayout";  // giữ nguyên tên cũ cũng được
import Home from "../pages/user/home";
import ProductDetail from "../pages/user/productDetail";
import AboutPage from "../pages/user/about";
import AuthPage from "../pages/user/auth";          // ← trang đăng nhập/đăng ký
import UpdateProfile from "../pages/user/updateProfile";
import SearchResults from "../pages/user/searchResults";
import PayCart from "../pages/user/payCart";
import OrderSuccess from "../pages/user/orderSuccess";

const MainRouter = () => {
  return (
    <Routes>

      {/* 1. Trang đăng nhập / đăng ký – ĐỨNG RIÊNG, KHÔNG bọc layout chính */}
      <Route path="/tai-khoan-ca-nhan" element={<AuthPage />} />

      {/* 2. Tất cả các trang còn lại dùng layout chung (Header + Footer) */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/trang-chu" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/gioi-thieu" element={<AboutPage />} />
        <Route path="/tim-kiem" element={<SearchResults />} />

        {/* Các trang cần đăng nhập (sau này sẽ bọc thêm ProtectedRoute) */}
        <Route path="/cap-nhat-thong-tin" element={<UpdateProfile />} />
        <Route path="/thanh-toan" element={<PayCart />} />
        <Route path="/dat-hang-thanh-cong" element={<OrderSuccess />} />
      </Route>

    </Routes>
  );
};

export default MainRouter;