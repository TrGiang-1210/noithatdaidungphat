import { Route, Routes } from "react-router-dom";
//user layout
import AuthLayout from "@/layouts/auth.layout";
import Home from "@/pages/user/home";
import ProductDetail from "@/pages/user/productDetail";


const MainRouter = () => {
  return (
    <Routes>
    {/* User layout */}
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="product/:id" element={<ProductDetail />} />
      </Route>
    </Routes>
  );
};

export default MainRouter;
