// src/router/index.router.tsx – BẢN FIX CUỐI CÙNG, ĐẢM BẢO KHÔNG NHẢY + KHÔNG NHÁY
import { Route, Routes } from "react-router-dom";
import UserLayout from "../layouts/UserLayout";  // giữ nguyên tên cũ cũng được
import Home from "../pages/user/home";
import ProductDetail from "../pages/user/productDetail";
import AboutPage from "../pages/user/about";
import AuthPage from "../pages/user/auth";          // ← trang đăng nhập/đăng ký
import UpdateProfile from "../pages/user/updateProfile";
import SearchResults from "../pages/user/searchResults";
import PayCart from "../pages/user/payCart"; // <-- thêm import trang thanh toán (đường dẫn nếu khác thì chỉnh)
import OrderSuccess from "../pages/user/orderSuccess";
import ResetPassPage from "../pages/user/resetPass";
import OrderTrackingPage from "../pages/user/orderTracking"; // <-- thêm import trang theo dõi đơn hàng

const MainRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<UserLayout />}>
        <Route index element={<Home />} />
        <Route path="/trang-chu" element={<Home />} />
        <Route path="/san-pham/:slug" element={<ProductDetail />} />
        <Route path="/gioi-thieu" element={<AboutPage />} />
        <Route path="/tim-kiem" element={<SearchResults />} />
        <Route path="/thanh-toan" element={<PayCart />} />
        <Route path="/dat-hang-thanh-cong" element={<OrderSuccess />} />ư
        <Route path="/theo-doi-don-hang" element={<OrderTrackingPage />} />
        {/* Các trang cần đăng nhập (sau này sẽ bọc thêm ProtectedRoute) */}
        <Route path="/cap-nhat-thong-tin" element={<UpdateProfile />} />
      </Route>

      {/* 1. Trang đăng nhập / đăng ký – ĐỨNG RIÊNG, KHÔNG bọc layout chính */}
      <Route path="/tai-khoan-ca-nhan" element={<AuthPage />} />
      <Route path="/quen-mat-khau" element={<ResetPassPage />} />
      { /* fallback / other routes */ }
    </Routes>
  );
};

export default MainRouter;