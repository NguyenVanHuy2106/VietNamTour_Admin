import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import { BsCaretLeft, BsCaretRight } from "react-icons/bs";

const Service = () => {
  const [dataService, setDataService] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const getData = async () => {
    try {
      const response = await API.get("/services/get");
      setDataService(response.data.data || []);
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách loại Tour:",
        error.response || error
      );
    }
  };
  useEffect(() => {
    getData();
  }, []);

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataService.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(dataService.length / itemsPerPage));

  return (
    <div className="container">
      <div
        style={{
          borderBottom: "1px #000000 solid",
          fontSize: 25,
          padding: 10,
        }}
      >
        Dịch vụ
      </div>
      <table className="table table-striped mt-2">
        <thead>
          <tr>
            <th style={{ width: "10%" }}>Mã dịch vụ</th>
            <th style={{ width: "25%" }}>Tên dịch vụ</th>
            <th style={{ width: "15%" }}>Mô tả</th>

            <th>Người thêm</th>
            <th style={{ width: "20%" }}>Ngày thêm</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((service) => (
              <tr key={service.serviceid}>
                <td>{service.serviceid}</td>
                <td>{service.servicename}</td>
                <td>{service.description}</td>

                <td>{service.created_by}</td>
                <td>{service.created_at}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination - Luôn giữ vị trí, không thay đổi kích thước */}
      {dataService.length > itemsPerPage && (
        <div className="d-flex justify-content-center mt-3">
          <nav>
            <ul className="pagination">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
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
      )}
    </div>
  );
};

export default Service;
