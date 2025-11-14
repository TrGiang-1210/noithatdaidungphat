import React from "react";
import { ToastContainer } from "react-toastify";
import MainRouter from "./router/index.router";

const App: React.FC = () => {
  return (
    <>
      <MainRouter />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default App;
