import { Route, Routes } from "react-router-dom";
import UserLayout from "../layouts/UserLayout";
import AdminLayout from "../layouts/admin.layout";

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
import Posts from "../pages/user/post";
import PostDetail from "../pages/user/postDetail";
import ColorChoice from "../pages/user/colorChoice";

// === ADMIN PAGES ===
import ProductBulkCategory from "../pages/admin/productBulkCategory";
import Dashboard from "../pages/admin/dashboard";
import CategoryManager from "../pages/admin/categoryManager";
import ProductManager from "../pages/admin/productManager";
import PostManager from "../pages/admin/postManager";
import OrderManager from "../pages/admin/orderManager";
import AdminChat from "../pages/admin/adminChat";
import TranslationManagement from "../pages/admin/translateManager";
import DatabaseTranslation from "../pages/admin/databaseTranslation";

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
        <Route path="/danh-muc/:slug" element={<CategoryProducts />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/posts/:slug" element={<PostDetail />} />
        <Route path="/mau-mau" element={<ColorChoice />} />
      </Route>

      <Route path="/tai-khoan-ca-nhan" element={<AuthPage />} />
      <Route path="/quen-mat-khau" element={<ResetPassPage />} />

      {/* ==================== ADMIN ROUTES ==================== */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="gan-danh-muc" element={<ProductBulkCategory />} />
        <Route path="quan-ly-danh-muc" element={<CategoryManager />} />
        <Route path="quan-ly-san-pham" element={<ProductManager />} />
        <Route path="quan-ly-bai-viet" element={<PostManager />} />
        <Route path="quan-ly-don-hang" element={<OrderManager />} />
        <Route path="chat-khach-hang" element={<AdminChat />} />
        <Route path="quan-ly-ngon-ngu-ui" element={<TranslationManagement />} />
        <Route path="quan-ly-ngon-ngu-db" element={<DatabaseTranslation />} />
      </Route>

      {/* 404 — tùy chọn */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};

export default MainRouter;