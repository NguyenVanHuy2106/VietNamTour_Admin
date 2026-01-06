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
    localStorage.removeItem("token");
    navigate("/sign-in"); // dùng navigate thay vì reload
  };

  return (
    <div>
      <header style={styles.header}>
        <div className="logoClass">
          <img
            src="https://cdn.myvietnamtour.vn/uploads/1.png"
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
            {/* Nếu item.link là "#" thì không điều hướng */}
            <Nav.Link
              as="div"
              onClick={() => item.link !== "#" && navigate(item.link)}
              style={{ cursor: item.link !== "#" ? "pointer" : "default" }}
            >
              {item.name}
            </Nav.Link>

            {/* Hiển thị submenu */}
            {item.subMenu && showSubMenu === item.id && (
              <div className="submenu">
                {item.subMenu.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() =>
                      sub.name === "Thoát" ? handleLogout() : navigate(sub.link)
                    }
                    className="submenu-item"
                    style={{ cursor: "pointer", padding: "5px 10px" }}
                  >
                    {sub.name}
                  </div>
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
      { id: 5.1, name: "Khách hàng", link: "/customer" },
      { id: 5.2, name: "Người dùng hệ thống", link: "#" },
      { id: 5.3, name: "Hình ảnh", link: "/image-list" },
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
