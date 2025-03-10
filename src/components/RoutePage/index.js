// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../../app/Home";
import About from "../../app/About";
import Users from "../../app/User";
import MainPage from "../MainPage";

const RoutePage = () => {
  return (
    <Routes>
      {/* Tất cả route con đều xài chung MainLayout */}
      <Route path="/" element={<MainPage />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
};

export default RoutePage;
