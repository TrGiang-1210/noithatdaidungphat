import { Route, Routes } from "react-router-dom";
//user layout
import AuthLayout from "@/layouts/auth.layout";
import Home from "@/pages/user/home";
import ProductDetail from "@/pages/user/productDetail";
import AboutPage from "@/pages/user/about";
import AuthPage from "@/pages/user/auth";
import SearchResults from "@/pages/user/searchResults";

const MainRouter = () => {
  return (
    <Routes>
    {/* User layout */}
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<Home />} />
        <Route path="trang-chu" element={<Home />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="gioi-thieu" element={<AboutPage />} />
        <Route path="tai-khoan-ca-nhan" element={<AuthPage />} />
        <Route path="tim-kiem" element={<SearchResults />} />
      </Route>
    </Routes>
  );
};

export default MainRouter;
