import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Home from "../../app/Home";
import About from "../../app/About";
import Users from "../../app/User";
import MainPage from "../MainPage";

import Banner from "../../app/Banner";
import Collection from "../../app/Collection";
import HotelType from "../../app/HotelType";
import TimeType from "../../app/TimeType";
import TourType from "../../app/TourType";
import VehicleType from "../../app/VehicleType";
import Service from "../../app/Service";
import Province from "../../app/Province";
import TravelLocation from "../../app/TravelLocation";
import Customer from "../../app/Customer";

import SignIn from "../SignIn";
import APIToken from "../../config/APIToken";

const RoutePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/sign-in");
        return;
      }

      try {
        const response = await APIToken.get("/check-token", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success === false) {
          localStorage.removeItem("token");
          navigate("/sign-in");
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra token:", error);
        localStorage.removeItem("token");
        navigate("/sign-in");
      }
    };

    checkToken();
  }, [navigate]); // Chỉ thêm navigate vào mảng phụ thuộc

  return (
    <Routes>
      <Route path="sign-in" element={<SignIn />} />
      <Route path="/" element={<MainPage />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="users" element={<Users />} />
        <Route path="banner" element={<Banner />} />
        <Route path="collection" element={<Collection />} />
        <Route path="hotel-type" element={<HotelType />} />
        <Route path="time-type" element={<TimeType />} />
        <Route path="tour-type" element={<TourType />} />
        <Route path="vehicle-type" element={<VehicleType />} />
        <Route path="service" element={<Service />} />
        <Route path="province" element={<Province />} />
        <Route path="travel-location" element={<TravelLocation />} />
        <Route path="customer" element={<Customer />} />
      </Route>
    </Routes>
  );
};

export default RoutePage;
