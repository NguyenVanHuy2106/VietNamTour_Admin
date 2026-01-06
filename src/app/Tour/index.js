import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Modal,
  Spinner,
  Toast,
  ToastContainer,
  Table,
} from "react-bootstrap";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { FaPlus, FaTrash, FaEdit, FaEye, FaMapMarkerAlt } from "react-icons/fa";
import "./index.css";

const Tour = () => {
  const [dataTour, setDataTour] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [openModalDelete, setOpenModalDelete] = useState(false);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/tour/get");
      setDataTour(response.data.data || []);
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleAgreeDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/tour/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xóa tour thành công! ✨");
        setSuccessAlertOpen(true);
        getData();
      }
    } catch (error) {
      setAlertMessage("Lỗi khi xóa");
      setSuccessAlertOpen(true);
    } finally {
      setOpenModalDelete(false);
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(dataTour.length / itemsPerPage) || 1;
  const currentItems = dataTour.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div className="sv-header-left">
          <h2>QUẢN LÝ TOUR</h2>
          <p>Danh sách các chương trình du lịch hiện có</p>
        </div>
        <Button className="sv-btn-add" onClick={() => navigate("/tour-add")}>
          <FaPlus /> Thêm mới
        </Button>
      </div>

      <div className="sv-card-table">
        <Table hover className="sv-table">
          <thead>
            <tr>
              <th className="text-center">Hình ảnh</th>
              <th>Tên Tour / Mã</th>
              <th>Địa điểm</th>
              <th>Giá người lớn</th>
              <th>Ngày đi</th>
              <th className="text-center">Tác vụ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </td>
              </tr>
            ) : (
              currentItems.map((tour) => (
                <tr key={tour.tourid}>
                  {/* Cột Hình Ảnh */}
                  <td className="text-center">
                    <div className="sv-img-wrapper">
                      {/* Tìm ảnh có imagetype là 0 */}
                      {(() => {
                        const avatar = tour.images?.find(
                          (img) => img.imagetype === 0
                        );
                        return (
                          <img
                            src={
                              avatar
                                ? avatar.imageurl
                                : "https://placehold.co/80x60?text=No+Avatar"
                            }
                            alt="tour-avatar"
                            className="sv-tour-img"
                          />
                        );
                      })()}
                    </div>
                  </td>
                  <td>
                    <div
                      className="sv-tour-name"
                      onClick={() =>
                        navigate("/tour-detail", {
                          state: { tourId: tour.tourid },
                        })
                      }
                    >
                      {tour.tourname}
                    </div>
                    {/* Hiển thị nhãn Loại Tour */}
                    {tour.tourtype === "DOAN" ? (
                      <span className="sv-badge-type group">Tour đoàn</span>
                    ) : (
                      <span className="sv-badge-type retail">Tour lẻ</span>
                    )}
                    <div className="sv-tour-id text-muted">
                      Mã: #{tour.tourid}
                    </div>
                    <div className="sv-tour-desc-short">{tour.description}</div>
                  </td>
                  <td>
                    <div className="sv-loc">
                      <FaMapMarkerAlt size={12} className="text-danger me-1" />
                      {tour.departure_name} → {tour.destination_name}
                    </div>
                  </td>
                  <td>
                    <span className="sv-price">
                      {tour.price.adultprice?.toLocaleString()}đ
                    </span>
                  </td>
                  <td className="sv-text-small">{tour.startdate}</td>
                  <td>
                    <div className="sv-actions">
                      <button
                        className="sv-icon-btn view"
                        onClick={() =>
                          navigate("/tour-detail", {
                            state: { tourId: tour.tourid },
                          })
                        }
                      >
                        <FaEye />
                      </button>
                      <button
                        className="sv-icon-btn edit"
                        onClick={() =>
                          navigate("/tour-edit", {
                            state: { tourId: tour.tourid },
                          })
                        }
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="sv-icon-btn delete"
                        onClick={() => {
                          setDeleteId(tour.tourid);
                          setOpenModalDelete(true);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* PHÂN TRANG KIỂU SERVICE */}
        <div className="sv-pagination-bar">
          <div className="sv-page-count">
            Trang {currentPage} / {totalPages}
          </div>
          <div className="sv-page-controls">
            <button
              className="sv-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <BsChevronLeft />
            </button>

            <div className="sv-page-number">{currentPage}</div>

            <button
              className="sv-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <BsChevronRight />
            </button>
          </div>
        </div>
      </div>

      <Modal
        show={openModalDelete}
        onHide={() => setOpenModalDelete(false)}
        centered
      >
        <Modal.Body className="text-center p-4">
          <h4 className="mb-3">Xác nhận xóa?</h4>
          <p>
            Bạn muốn xóa tour <strong>#{deleteId}</strong>?
          </p>
          <div className="d-flex gap-2 justify-content-center mt-4">
            <Button variant="light" onClick={() => setOpenModalDelete(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleAgreeDelete}>
              Xóa
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ position: "fixed", zIndex: 10000 }}
      >
        <Toast
          show={successAlertOpen}
          onClose={() => setSuccessAlertOpen(false)}
          delay={3000}
          autohide
          bg="primary"
        >
          <Toast.Body className="text-white fw-bold">{alertMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default Tour;
