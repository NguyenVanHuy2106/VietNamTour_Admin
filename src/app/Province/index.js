import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";
import { Form, InputGroup, Spinner, Badge } from "react-bootstrap";
import "./index.css";

const Province = () => {
  const [dataProvince, setDataProvince] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/province/get");
      setDataProvince(response.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách tỉnh/thành:", error);
    } finally {
      setLoading(false);
    }
  };

  // Logic lọc dữ liệu
  const filteredData = dataProvince.filter((item) =>
    item.provincename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const currentItems = filteredData.slice(
    indexOfLastItem - itemsPerPage,
    indexOfLastItem
  );

  return (
    <div className="pv-container">
      <div className="pv-header">
        <div className="pv-header-info">
          <h2>Danh sách Tỉnh / Thành</h2>
          <p>Dữ liệu địa giới hành chính hệ thống</p>
        </div>
        <div className="pv-header-actions">
          <InputGroup className="pv-search-bar">
            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm tên tỉnh thành..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </InputGroup>
        </div>
      </div>

      <div className="pv-content-card">
        <div className="table-responsive">
          <table className="pv-table">
            <thead>
              <tr>
                <th style={{ width: "12%" }}>Mã vùng</th>
                <th style={{ width: "30%" }}>Tên Tỉnh / Thành</th>
                <th style={{ width: "20%" }}>Quốc Gia</th>
                <th style={{ width: "18%" }}>Người tạo</th>
                <th>Ngày thêm</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <Spinner animation="border" variant="primary" size="sm" />
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.provinceid}>
                    <td>
                      <span className="pv-id">#{item.provinceid}</span>
                    </td>
                    <td className="fw-bold">{item.provincename}</td>
                    <td>
                      <Badge bg="light" text="dark" className="border">
                        {item.countryid === "VN" ? "Việt Nam" : item.countryid}
                      </Badge>
                    </td>
                    <td>
                      <span className="pv-user">
                        {item.created_by || "System"}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {item.created_at || "---"}
                      </small>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    Không tìm thấy dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG: Chữ bên trái, Nút mũi tên bên phải */}
        <div className="pv-pagination">
          <span className="pv-page-text">
            Trang {currentPage} / {totalPages}
          </span>
          <div className="pv-page-btns">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((v) => v - 1)}
            >
              <BsCaretLeft />
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((v) => v + 1)}
            >
              <BsCaretRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Province;
