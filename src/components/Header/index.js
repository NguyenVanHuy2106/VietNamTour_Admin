import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaBars, FaTimes, FaChevronDown } from "react-icons/fa"; // Thêm icon
import "./index.css";
import { Nav } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import APIToken from "../../config/APIToken";

const Header = () => {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State cho mobile menu
  const [dataInfo, setDataInfo] = useState({ name: "" });
  const navigate = useNavigate();
  let userId = localStorage.getItem("userId");
  let role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/sign-in");
  };

  const getInfo = async () => {
    try {
      const response = await APIToken.get(`/user/get/${userId}`);
      setDataInfo(response.data.data || { name: "" });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getInfo();
  }, []);

  // Hàm điều hướng và đóng menu mobile
  const handleNavigate = (link) => {
    if (link !== "#") {
      navigate(link);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="header-wrapper">
      <header className="main-header">
        <div
          className="logoClass d-flex align-items-center"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <img
            src="https://cdn.myvietnamtour.vn/uploads/1.png"
            alt="Logo"
            width="40"
          />
          <h2 className="logo-text">VIỆT NAM TOUR</h2>
        </div>

        <div className="header-right">
          <div className="admin-info">
            <FaUserCircle className="user-icon" />
            <span className="user-name">{dataInfo.name}</span>
          </div>

          {/* Nút Hamburger cho Mobile */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </header>

      {/* Menu chính */}
      <nav className={`menu-container ${isMobileMenuOpen ? "active" : ""}`}>
        <div className="menu-items">
          {HeaderNavData.map((item) => (
            <div
              key={item.id}
              className="menu-item-wrapper"
              onMouseEnter={() =>
                !isMobileMenuOpen && item.subMenu && setShowSubMenu(item.id)
              }
              onMouseLeave={() =>
                !isMobileMenuOpen && item.subMenu && setShowSubMenu(false)
              }
              onClick={() =>
                isMobileMenuOpen &&
                item.subMenu &&
                setShowSubMenu(showSubMenu === item.id ? false : item.id)
              }
            >
              <div
                className="menu-item-link"
                onClick={() => !item.subMenu && handleNavigate(item.link)}
              >
                {item.name}
                {item.subMenu && <FaChevronDown className="ms-1" size={10} />}
              </div>

              {item.subMenu && showSubMenu === item.id && (
                <div className="submenu">
                  {item.subMenu
                    // Bước 1: Lọc danh sách trước khi hiển thị
                    .filter((sub) => {
                      // Nếu mục này là Báo cáo chấm công thì chỉ cho admin thấy
                      if (sub.name === "Báo cáo chấm công") {
                        return role === "admin";
                      }
                      // Các mục khác (như Thoát, Thông tin...) thì hiện bình thường
                      return true;
                    })
                    // Bước 2: Map dữ liệu đã lọc
                    .map((sub) => (
                      <div
                        key={sub.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (sub.name === "Thoát") handleLogout();
                          else handleNavigate(sub.link);
                        }}
                        className="submenu-item"
                      >
                        {sub.name}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Lớp phủ mờ khi mở menu mobile */}
      {isMobileMenuOpen && (
        <div
          className="menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
};

// HeaderNavData giữ nguyên như code của bạn

export default Header;

const HeaderNavData = [
  {
    id: 10,
    name: "TRANG CHỦ",
    link: "/",
  },
  {
    id: 1,
    name: "KHAI BÁO",
    link: "#",
    subMenu: [
      { id: 1.1, name: "Khai báo loại tour", link: "/tour-type" },
      { id: 1.2, name: "Khai báo loại nơi ở", link: "/hotel-type" },
      { id: 1.3, name: "Khai báo loại phương tiện", link: "/vehicle-type" },
      { id: 1.4, name: "Khai báo loại thời gian", link: "/time-type" },
      { id: 1.5, name: "Khai báo banner", link: "/banner" },
      { id: 1.6, name: "Khai báo bộ sưu tập", link: "/collection" },
      { id: 1.7, name: "Khai báo danh mục hình ảnh", link: "/image-category" },
    ],
  },
  {
    id: 2,
    name: "TOUR",
    link: "#",
    subMenu: [{ id: 2.1, name: "Quản lý tour", link: "/tour" }],
  },
  {
    id: 3,
    name: "DỊCH VỤ",
    link: "#",
    subMenu: [
      { id: 3.1, name: "Danh sách dịch vụ", link: "/service" },
      { id: 3.2, name: "Danh sách Tỉnh/TP", link: "/province" },
      { id: 3.3, name: "Địa điểm du lịch", link: "/travel-location" },
      { id: 3.4, name: "Cẩm nang du lịch", link: "/guide-travel-list" },
      { id: 3.5, name: "Hình ảnh", link: "/image" },
    ],
  },
  { id: 4, name: "KHUYẾN MÃI", link: "#" },
  {
    id: 5,
    name: "NGƯỜI DÙNG",
    link: "#",
    subMenu: [
      { id: 5.2, name: "Khách hàng", link: "/customer" },
      { id: 5.3, name: "Người dùng hệ thống", link: "#" },
      { id: 5.4, name: "Hình ảnh", link: "/image-list" },
    ],
  },
  { id: 6, name: "CHẤM CÔNG", link: "/attendance" },
  {
    id: 7,
    name: "BÁO CÁO",
    link: "#",
    subMenu: [
      {
        id: 7.1,
        name: "Báo cáo chấm công",
        link: "/attendance-report",
        requiredRole: "admin",
      },
    ],
  },
  {
    id: 8,
    name: "CÀI ĐẶT",
    link: "#",
    subMenu: [
      { id: 8.1, name: "Thông tin cá nhân", link: "#" },
      { id: 8.2, name: "Thoát", link: "#" },
    ],
  },
];
