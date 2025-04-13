import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "./index.css";
import { Nav } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const Header = () => {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Xử lý đăng xuất tại đây, ví dụ: xóa token, xóa thông tin user,...
    localStorage.removeItem("token"); // hoặc sessionStorage.clear()

    // Điều hướng về trang chủ
    window.location.href = "/";
  };
  return (
    <div>
      <header style={styles.header}>
        <div className="logoClass">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/core-pilates-e0144.firebasestorage.app/o/images%2F1744194735278_2000x2000.webp?alt=media&token=76c42935-2b28-4d30-b00d-61b576fe096d"
            alt="React Logo"
            width="50"
          />
          <h2 style={styles.logo}>VIỆT NAM TOUR</h2>
        </div>

        <div className="admin">
          <div className="iconAdmin">
            <FaUserCircle style={{ height: 25, width: 25 }} />
          </div>
          <div>Nguyễn Văn Huy</div>
        </div>
      </header>

      {/* Menu chính */}
      <div className="menu-items">
        {HeaderNavData.map((item) => (
          <div
            key={item.id}
            className="menu-item"
            onMouseEnter={() => item.subMenu && setShowSubMenu(item.id)}
            onMouseLeave={() => item.subMenu && setShowSubMenu(false)}
          >
            <Nav.Link href={item.link}>{item.name}</Nav.Link>

            {/* Hiển thị submenu */}
            {item.subMenu && showSubMenu === item.id && (
              <div className="submenu">
                {item.subMenu.map((sub) => (
                  <Nav.Link
                    key={sub.id}
                    href={sub.link}
                    onClick={sub.name === "Thoát" ? handleLogout : undefined}
                    className="submenu-item"
                  >
                    {sub.name}
                  </Nav.Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  header: {
    padding: "10px 20px",
    color: "#1d61ad",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    margin: 0,
  },
};

export default Header;

const HeaderNavData = [
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
    ],
  },
  { id: 2, name: "TOUR", link: "#" },
  {
    id: 3,
    name: "DỊCH VỤ",
    link: "#",
    subMenu: [
      { id: 3.1, name: "Danh sách dịch vụ", link: "service" },
      { id: 3.2, name: "Danh sách Tỉnh/TP", link: "province" },
      { id: 3.3, name: "Địa điểm du lịch", link: "travel-location" },
      { id: 3.4, name: "Cẩm nang du lịch", link: "guide-travel" },
    ],
  },
  { id: 4, name: "KHUYẾN MÃI", link: "#" },
  {
    id: 5,
    name: "NGƯỜI DÙNG",
    link: "#",
    subMenu: [
      { id: 5.1, name: "Khách hàng", link: "customer" },
      { id: 5.2, name: "Người dùng hệ thống", link: "#" },
    ],
  },
  { id: 6, name: "THỐNG KÊ", link: "#" },
  {
    id: 7,
    name: "CÀI ĐẶT",
    link: "#",
    subMenu: [
      { id: 7.1, name: "Thông tin cá nhân", link: "#" },
      { id: 7.2, name: "Thoát", link: "#" },
    ],
  },
];
