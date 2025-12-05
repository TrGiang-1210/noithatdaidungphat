// src/router/index.router.tsx
import { Route, Routes } from "react-router-dom";
import UserLayout from "../layouts/UserLayout";
import AdminLayout from "../layouts/admin.layout";        // ← THÊM DÒNG NÀY

// === USER PAGES ===
import Home from "../pages/user/home";
import ProductDetail from "../pages/user/productDetail";
import AboutPage from "../pages/user/about";
import AuthPage from "../pages/user/auth";
import UpdateProfile from "../pages/user/updateProfile";
import SearchResults from "../pages/user/searchResults";
import PayCart from "../pages/user/payCart";
import OrderSuccess from "../pages/user/orderSuccess";
import ResetPassPage from "../pages/user/resetPass";
import OrderTrackingPage from "../pages/user/orderTracking";
import CategoryProducts from "../pages/user/categoryProduct";

// === ADMIN PAGES ===  ← THÊM TỪ ĐÂY
import ProductBulkCategory from "../pages/admin/productBulkCategory";  // trang gán danh mục
import Dashboard from "../pages/admin/dashboard";                      // (tạo sau cũng được)
import CategoryManager from "../pages/admin/categoryManager";

const MainRouter = () => {
  return (
    <Routes>

      {/* ==================== USER ROUTES ==================== */}
      <Route path="/" element={<UserLayout />}>
        <Route index element={<Home />} />
        <Route path="/trang-chu" element={<Home />} />
        <Route path="/san-pham/:slug" element={<ProductDetail />} />
        <Route path="/gioi-thieu" element={<AboutPage />} />
        <Route path="/tim-kiem" element={<SearchResults />} />
        <Route path="/thanh-toan" element={<PayCart />} />
        <Route path="/dat-hang-thanh-cong" element={<OrderSuccess />} />
        <Route path="/theo-doi-don-hang" element={<OrderTrackingPage />} />
        <Route path="/cap-nhat-thong-tin" element={<UpdateProfile />} />
        <Route path="/danh-muc/:categorySlug" element={<CategoryProducts />} />
      </Route>

      <Route path="/tai-khoan-ca-nhan" element={<AuthPage />} />
      <Route path="/quen-mat-khau" element={<ResetPassPage />} />

      {/* ==================== ADMIN ROUTES ==================== */}
      {/* THÊM TOÀN BỘ ĐOẠN NÀY */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="gan-danh-muc" element={<ProductBulkCategory />} />   {/* ← TRANG QUAN TRỌNG NHẤT */}
        <Route path="quan-ly-danh-muc" element={<CategoryManager />} />   {/* ← TRANG QUAN TRỌNG THỨ HAI */}
      </Route>
      {/* HẾT ĐOẠN THÊM */}

      {/* 404 – tuỳ chọn */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};

export default MainRouter;