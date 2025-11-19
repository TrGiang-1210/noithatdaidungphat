import { Route, Routes } from "react-router-dom";
//user layout
import AuthLayout from "@/layouts/auth.layout";
import Home from "@/pages/user/home";
import ProductDetail from "@/pages/user/productDetail";
import AboutPage from "@/pages/user/about";

const MainRouter = () => {
  return (
    <Routes>
    {/* User layout */}
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
};

export default MainRouter;
