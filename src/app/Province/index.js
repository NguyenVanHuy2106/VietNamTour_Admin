import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import { BsCaretLeft, BsCaretRight } from "react-icons/bs";

const Province = () => {
  const [dataProvince, setDataProvince] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await API.get("/province/get");
        setDataProvince(response.data.data || []);
      } catch (error) {
        console.error(
          "Lỗi khi lấy danh sách tỉnh/thành:",
          error.response || error
        );
      }
    };
    getData();
  }, []);

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataProvince.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(dataProvince.length / itemsPerPage);

  return (
    <div className="container mt-1">
      <div
        style={{
          borderBottom: "1px #000000 solid",
          fontSize: 25,
          padding: 10,
        }}
      >
        Danh sách Tỉnh/TP
      </div>
      <table className="table table-striped mt-2">
        <thead>
          <tr>
            <th style={{ width: "10%" }}>Mã tỉnh/Tp</th>
            <th style={{ width: "30%" }}>Tên Tỉnh/Thành</th>
            <th>Quốc Gia</th>
            <th>Người thêm</th>
            <th style={{ width: "20%" }}>Ngày thêm</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((province) => (
              <tr key={province.provinceid}>
                <td>{province.provinceid}</td>
                <td>{province.provincename}</td>
                <td>
                  {province.countryid === "VN"
                    ? "VN - Việt Nam"
                    : province.countryid}
                </td>

                <td>{province.created_by}</td>
                <td>{province.created_at}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                Đang tải dữ liệu...
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="d-flex justify-content-center mt-3">
        <nav>
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <BsCaretLeft />
              </button>
            </li>
            {[...Array(totalPages)].map((_, index) => (
              <li
                key={index}
                className={`page-item ${
                  currentPage === index + 1 ? "active" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              </li>
            ))}
            <li
              className={`page-item ${
                currentPage === totalPages ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <BsCaretRight />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Province;
