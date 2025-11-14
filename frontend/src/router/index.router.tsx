import { Route, Routes } from "react-router-dom";
//user layout
import AuthLayout from "@/layouts/auth.layout";
import HomePage from "@/pages/user/home";


const MainRouter = () => {
  return (
    <Routes>
    {/* User layout */}
      <Route epath="/" element={<AuthLayout />}>
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
      </Route>
    </Routes>
  );
};

export default MainRouter;
