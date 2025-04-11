// src/layouts/MainLayout.js
import React from "react";
import Header from "../Header";

import { Outlet } from "react-router-dom";

const MainPage = () => {
  return (
    <div>
      <Header />

      <main style={{ padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainPage;
