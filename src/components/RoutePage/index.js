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
import GuideTravel from "../../app/GuideTravel";
import Tour from "../../app/Tour";
import TourAdd from "../../app/TourAdd";
import ImageList from "../../app/ImageList";
import TourDetail from "../../app/TourDetail";
import TourEdit from "../../app/TourEdit";
// import Collection from "../../app/Collection";
import GuideTravelList from "../../app/GuideTravelList";
import GuideTravelDetail from "../../app/GuideTravelDetail";
import ImageCategory from "../../app/ImageCategory";

import Image from "../../app/Image";

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
        <Route path="tour-type" element={<TourType />} />
        <Route path="hotel-type" element={<HotelType />} />
        <Route path="vehicle-type" element={<VehicleType />} />
        <Route path="province" element={<Province />} />
        <Route path="travel-location" element={<TravelLocation />} />
        <Route path="tour" element={<Tour />} />
        <Route path="guide-travel" element={<GuideTravel />} />
        <Route path="guide-travel-list" element={<GuideTravelList />} />
        <Route path="time-type" element={<TimeType />} />
        <Route path="tour-add" element={<TourAdd />} />
        <Route path="customer" element={<Customer />} />
        <Route path="service" element={<Service />} />
        <Route path="image-list" element={<ImageList />} />
        <Route path="tour-detail" element={<TourDetail />} />
        <Route path="tour-edit" element={<TourEdit />} />
        <Route path="collection" element={<Collection />} />
        <Route path="guide-travel-detail" element={<GuideTravelDetail />} />
        <Route path="image-category" element={<ImageCategory />} />
        <Route path="image" element={<Image />} />
      </Route>
    </Routes>
  );
};

export default RoutePage;
