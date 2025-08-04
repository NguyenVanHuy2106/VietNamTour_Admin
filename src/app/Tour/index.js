import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { useNavigate } from "react-router-dom";
import { Button, Modal, Pagination, Spinner, Toast } from "react-bootstrap";
import { BsCaretLeft, BsCaretRight } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import { CiTrash, CiEdit } from "react-icons/ci";
import "./index.css";

const Tour = () => {
  const [dataTour, setDataTour] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  let [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [openModalDelete, setOpenModalDelete] = useState(false);

  const handleCloseModalDelete = () => setOpenModalDelete(false);

  const handleOpenModalDelete = (id) => {
    setOpenModalDelete(true);
    setDeleteId(id);
  };

  const handleAgrreDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/tour/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xoá Tour thành công");
        setSuccessAlertOpen(true);
      }
    } catch (error) {
      setError("Có lỗi xảy ra khi xoá Tour");
    } finally {
      setDeleteId(null);
      setLoading(false);
      setOpenModalDelete(false);
      getData();
    }
  };

  const getData = async () => {
    try {
      const response = await API.get("/tour/get");
      setDataTour(response.data.data || []);
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách loại Tour:",
        error.response || error
      );
    }
  };
  const handleGoToDetail = (tourid) => {
    navigate("/tour-detail", { state: { tourId: tourid } });
  };
  const handleGoToEdit = (tourid) => {
    navigate("/tour-edit", { state: { tourId: tourid } });
  };

  useEffect(() => {
    getData();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataTour.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(dataTour.length / itemsPerPage));

  return (
    <div className="container mt-1" style={{ padding: 10 }}>
      <div
        style={{
          borderBottom: "1px solid #1D61AD",
          fontSize: 20,
          paddingTop: 10,
          paddingBottom: 10,
          color: "#1d61ad",
        }}
      >
        QUẢN LÝ TOUR
      </div>

      <div className="d-flex justify-content-end mt-2">
        <Button
          variant="primary"
          onClick={() => navigate("/tour-add")}
          style={{ marginBottom: "15px" }}
        >
          <FaPlus size={16} style={{ marginRight: "8px" }} />
          Thêm mới
        </Button>
      </div>

      {/* Div chứa bảng có scroll ngang */}
      <div
        style={{
          overflowX: "auto",
          whiteSpace: "nowrap",
          border: "1px solid #ccc",
          padding: 5,
        }}
      >
        <table
          className="table table-bordered"
          style={{
            fontSize: "14px",
            minWidth: 1300,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th colSpan={2} className="text-center">
                Thông tin tour
              </th>
              <th rowSpan={2} className="text-center align-middle">
                Mô tả ngắn
              </th>
              <th colSpan={2} className="text-center">
                Địa điểm
              </th>
              <th colSpan={2} className="text-center">
                Người tạo
              </th>
              <th colSpan={3} className="text-center">
                Thời gian
              </th>
              <th colSpan={3} className="text-center">
                Giá tour
              </th>
              <th rowSpan={2} className="text-center align-middle">
                Tác vụ
              </th>
            </tr>
            <tr>
              <th className="text-center">Mã tour</th>
              <th className="text-center">Tên tour</th>
              <th className="text-center">Khởi hành</th>
              <th className="text-center">Điểm đến</th>
              <th className="text-center">Người tạo</th>
              <th className="text-center">Ngày tạo</th>
              <th className="text-center">Loại thời gian</th>
              <th className="text-center">Ngày đi</th>
              <th className="text-center">Ngày về</th>
              <th className="text-center">Người lớn</th>
              <th className="text-center">Trẻ em</th>
              <th className="text-center">Free</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((tour) => (
                <tr key={tour.tourid}>
                  <td>{tour.tourid}</td>
                  <td
                    className="detailLink"
                    onClick={() => handleGoToDetail(tour.tourid)}
                    style={{
                      maxWidth: "310px",
                      minWidth: "310px", // Giới hạn chiều rộng
                      wordBreak: "break-word", // Cho phép ngắt từ khi quá dài
                      whiteSpace: "normal", // Cho phép xuống dòng
                      textAlign: "justify",
                    }}
                  >
                    {tour.tourname}
                  </td>
                  <td
                    style={{
                      maxWidth: "500px",
                      minWidth: "500px", // Giới hạn chiều rộng
                      wordBreak: "break-word", // Cho phép ngắt từ khi quá dài
                      whiteSpace: "normal", // Cho phép xuống dòng
                      textAlign: "justify",
                    }}
                  >
                    {tour.description}
                  </td>
                  <td>{tour.departure_name}</td>
                  <td>{tour.destination_name}</td>
                  <td>{tour.created_by}</td>
                  <td>{tour.created_at || "N/A"}</td>
                  <td>{tour.timetype_name}</td>
                  <td>{tour.startdate}</td>
                  <td>{tour.enddate}</td>
                  <td>{tour.price.adultprice}</td>
                  <td>{tour.price.childprice}</td>
                  <td>{tour.price.freeprice}</td>
                  <td>
                    <div className="d-flex">
                      <CiEdit
                        style={{ marginRight: "10px", cursor: "pointer" }}
                        onClick={() => handleGoToEdit(tour.tourid)}
                      />
                      <CiTrash
                        style={{ marginLeft: "10px", cursor: "pointer" }}
                        onClick={() => handleOpenModalDelete(tour.tourid)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="14" className="text-center">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {dataTour.length > itemsPerPage && (
        <Pagination className="d-flex justify-content-center mt-3">
          <Pagination.Prev
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <BsCaretLeft />
          </Pagination.Prev>

          {[...Array(totalPages)].map((_, index) => (
            <Pagination.Item
              key={index}
              active={currentPage === index + 1}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}

          <Pagination.Next
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <BsCaretRight />
          </Pagination.Next>
        </Pagination>
      )}

      {/* Delete Modal */}
      <Modal show={openModalDelete} onHide={handleCloseModalDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Xoá Tour</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn xoá?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModalDelete}>
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleAgrreDelete}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : "Xoá"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Alert */}
      <Toast
        onClose={() => setSuccessAlertOpen(false)}
        show={successAlertOpen}
        delay={3000}
        autohide
        className="position-fixed top-0 end-0 m-3"
      >
        <Toast.Body>{alertMessage}</Toast.Body>
      </Toast>

      {/* Loading Spinner */}
      {loading && (
        <div className="d-flex justify-content-center mt-3">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
    </div>
  );
};

export default Tour;
