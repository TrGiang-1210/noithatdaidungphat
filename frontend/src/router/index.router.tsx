import { Route, Routes } from "react-router-dom";
//user layout
import AuthLayout from "@/layouts/auth.layout";
import Home from "@/pages/user/home";


const MainRouter = () => {
  return (
    <Routes>
    {/* User layout */}
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
      </Route>
    </Routes>
  );
};

export default MainRouter;
