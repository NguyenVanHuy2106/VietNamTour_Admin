import React, { useState, useEffect, useMemo } from "react";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { useNavigate } from "react-router-dom";

import {
  Button,
  Modal,
  Spinner,
  Toast,
  ToastContainer,
  Form,
} from "react-bootstrap";

import { BsChevronLeft, BsChevronRight, BsSearch } from "react-icons/bs";

import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaEye,
  FaMapMarkerAlt,
  FaUsers,
  FaUser,
  FaCalendarAlt,
  FaRoute,
} from "react-icons/fa";

import "./index.css";

const Tour = () => {
  const navigate = useNavigate();

  const [dataTour, setDataTour] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");

  const [tourTypeFilter, setTourTypeFilter] = useState("");

  const itemsPerPage = 8;

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);

  const [alertMessage, setAlertMessage] = useState("");

  const [toastVariant, setToastVariant] = useState("success");

  const [loading, setLoading] = useState(false);

  const [deleteId, setDeleteId] = useState(null);

  const [deleteTourName, setDeleteTourName] = useState("");

  const [openModalDelete, setOpenModalDelete] = useState(false);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  const getData = async () => {
    try {
      setLoading(true);

      const response = await API.get("/tour/get");

      setDataTour(
        response.data && response.data.data ? response.data.data : [],
      );
    } catch (error) {
      console.error("Lỗi lấy danh sách tour:", error);

      showToast("danger", "Không thể tải danh sách tour.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  /* =====================================================
     TOAST
  ===================================================== */

  const showToast = (variant, message) => {
    setToastVariant(variant);
    setAlertMessage(message);
    setSuccessAlertOpen(true);
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const handleGoToDetail = (tourid) => {
    navigate("/tour-detail", {
      state: {
        tourId: tourid,
      },
    });
  };

  const handleGoToEdit = (tourid) => {
    navigate("/tour-edit", {
      state: {
        tourId: tourid,
      },
    });
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleOpenDelete = (tour) => {
    setDeleteId(tour.tourid);

    setDeleteTourName(tour.tourname || "");

    setOpenModalDelete(true);
  };

  const handleCloseDelete = () => {
    setDeleteId(null);

    setDeleteTourName("");

    setOpenModalDelete(false);
  };

  const handleAgreeDelete = async () => {
    if (!deleteId) return;

    try {
      setLoading(true);

      const response = await APIToken.delete(`/tour/delete/${deleteId}`);

      if (response.status === 200) {
        showToast("success", "Xóa tour thành công!");

        await getData();

        const remaining = filteredData.length - 1;

        const newTotalPages = Math.max(1, Math.ceil(remaining / itemsPerPage));

        if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
        }
      }
    } catch (error) {
      console.error("Lỗi xóa tour:", error);

      showToast("danger", "Không thể xóa tour.");
    } finally {
      setLoading(false);

      handleCloseDelete();
    }
  };

  /* =====================================================
     HELPERS
  ===================================================== */

  const getAvatar = (tour) => {
    const images = Array.isArray(tour.images) ? tour.images : [];

    const avatar = images.find((img) => Number(img.imagetype) === 0);

    return avatar && avatar.imageurl ? avatar.imageurl : "";
  };

  const formatMoney = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Liên hệ";
    }

    return Number(value).toLocaleString("vi-VN") + " đ";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Linh hoạt";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return dataTour.filter((tour) => {
      const name = tour.tourname ? tour.tourname.toLowerCase() : "";

      const departure = tour.departure_name
        ? tour.departure_name.toLowerCase()
        : "";

      const destination = tour.destination_name
        ? tour.destination_name.toLowerCase()
        : "";

      const matchSearch =
        !keyword ||
        name.indexOf(keyword) !== -1 ||
        departure.indexOf(keyword) !== -1 ||
        destination.indexOf(keyword) !== -1;

      let matchType = true;

      if (tourTypeFilter === "DOAN") {
        matchType = tour.tourtype === "DOAN";
      }

      if (tourTypeFilter === "LE") {
        matchType = tour.tourtype !== "DOAN";
      }

      return matchSearch && matchType;
    });
  }, [dataTour, searchTerm, tourTypeFilter]);

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,

    currentPage * itemsPerPage,
  );

  /* =====================================================
     STATS
  ===================================================== */

  const groupTourCount = useMemo(() => {
    return dataTour.filter((tour) => tour.tourtype === "DOAN").length;
  }, [dataTour]);

  const retailTourCount = dataTour.length - groupTourCount;

  const scheduledTourCount = useMemo(() => {
    return dataTour.filter((tour) => Boolean(tour.startdate)).length;
  }, [dataTour]);

  /* =====================================================
     RESET
  ===================================================== */

  const handleResetFilter = () => {
    setSearchTerm("");

    setTourTypeFilter("");

    setCurrentPage(1);
  };

  return (
    <div className="sv-container">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="sv-header">
        <div className="sv-header-left">
          <div className="sv-title-row">
            <div>
              <h2>Quản lý Tour</h2>

              <p>
                Quản lý các chương trình du lịch đang hiển thị trên website.
              </p>
            </div>

            <span className="sv-total-badge">{dataTour.length} tour</span>
          </div>
        </div>

        <Button className="sv-btn-add" onClick={() => navigate("/tour-add")}>
          <FaPlus />

          <span>Thêm Tour</span>
        </Button>
      </div>

      {/* =================================================
          STATS
      ================================================= */}

      <div className="sv-stats-grid">
        <div className="sv-stat-card">
          <div className="sv-stat-icon blue">
            <FaRoute />
          </div>

          <div>
            <span>Tổng số Tour</span>

            <strong>{dataTour.length}</strong>
          </div>
        </div>

        <div className="sv-stat-card">
          <div className="sv-stat-icon purple">
            <FaUsers />
          </div>

          <div>
            <span>Tour đoàn</span>

            <strong>{groupTourCount}</strong>
          </div>
        </div>

        <div className="sv-stat-card">
          <div className="sv-stat-icon green">
            <FaUser />
          </div>

          <div>
            <span>Tour khách lẻ</span>

            <strong>{retailTourCount}</strong>
          </div>
        </div>

        <div className="sv-stat-card">
          <div className="sv-stat-icon orange">
            <FaCalendarAlt />
          </div>

          <div>
            <span>Có lịch khởi hành</span>

            <strong>{scheduledTourCount}</strong>
          </div>
        </div>
      </div>

      {/* =================================================
          CARD
      ================================================= */}

      <div className="sv-card-table">
        {/* ===============================================
            TOOLBAR
        =============================================== */}

        <div className="sv-toolbar">
          <div className="sv-toolbar-left">
            <div className="sv-search-box">
              <BsSearch />

              <input
                type="text"
                placeholder="Tìm tên tour, điểm đi, điểm đến..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);

                  setCurrentPage(1);
                }}
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");

                    setCurrentPage(1);
                  }}
                >
                  ×
                </button>
              )}
            </div>

            <Form.Select
              className="sv-type-filter"
              value={tourTypeFilter}
              onChange={(e) => {
                setTourTypeFilter(e.target.value);

                setCurrentPage(1);
              }}
            >
              <option value="">Tất cả loại Tour</option>

              <option value="DOAN">Tour đoàn</option>

              <option value="LE">Tour khách lẻ</option>
            </Form.Select>

            {(searchTerm || tourTypeFilter) && (
              <button
                type="button"
                className="sv-reset-filter"
                onClick={handleResetFilter}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div className="sv-result-count">
            Hiển thị <strong>{currentItems.length}</strong> /{" "}
            <strong>{filteredData.length}</strong> tour
          </div>
        </div>

        {/* ===============================================
            DESKTOP TABLE
        =============================================== */}

        <div className="sv-desktop-table">
          <div className="table-responsive">
            <table className="sv-table">
              <thead>
                <tr>
                  <th className="sv-col-tour">Tour</th>

                  <th className="sv-col-route">Tuyến</th>

                  <th className="sv-col-price">Giá người lớn</th>

                  <th className="sv-col-date">Khởi hành</th>

                  <th className="sv-col-type">Loại</th>

                  <th className="sv-col-action">Tác vụ</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="sv-loading-cell">
                      <Spinner animation="border" variant="primary" />

                      <span>Đang tải dữ liệu...</span>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((tour) => {
                    const avatar = getAvatar(tour);

                    const price =
                      tour.price && tour.price.adultprice !== undefined
                        ? tour.price.adultprice
                        : null;

                    return (
                      <tr key={tour.tourid}>
                        {/* TOUR */}

                        <td>
                          <div className="sv-tour-cell">
                            <div className="sv-img-wrapper">
                              {avatar ? (
                                <img src={avatar} alt={tour.tourname} />
                              ) : (
                                <div className="sv-no-image">
                                  <FaRoute />
                                </div>
                              )}
                            </div>

                            <div className="sv-tour-info">
                              <button
                                type="button"
                                className="sv-tour-name"
                                onClick={() => handleGoToDetail(tour.tourid)}
                              >
                                {tour.tourname}
                              </button>

                              <div className="sv-tour-id">
                                Mã Tour: #{tour.tourid}
                              </div>

                              <div className="sv-tour-desc-short">
                                {tour.description || "Chưa có mô tả."}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ROUTE */}

                        <td>
                          <div className="sv-route">
                            <FaMapMarkerAlt />

                            <div>
                              <span>{tour.departure_name || "—"}</span>

                              <small>↓</small>

                              <strong>{tour.destination_name || "—"}</strong>
                            </div>
                          </div>
                        </td>

                        {/* PRICE */}

                        <td>
                          <div className="sv-price">{formatMoney(price)}</div>

                          <span className="sv-price-note">/ khách</span>
                        </td>

                        {/* DATE */}

                        <td>
                          <div
                            className={
                              tour.startdate ? "sv-date" : "sv-date flexible"
                            }
                          >
                            <FaCalendarAlt />

                            {formatDate(tour.startdate)}
                          </div>
                        </td>

                        {/* TYPE */}

                        <td>
                          {tour.tourtype === "DOAN" ? (
                            <span className="sv-badge-type group">
                              Tour đoàn
                            </span>
                          ) : (
                            <span className="sv-badge-type retail">
                              Tour lẻ
                            </span>
                          )}
                        </td>

                        {/* ACTION */}

                        <td>
                          <div className="sv-actions">
                            <button
                              className="sv-icon-btn view"
                              title="Xem chi tiết"
                              onClick={() => handleGoToDetail(tour.tourid)}
                            >
                              <FaEye />
                            </button>

                            <button
                              className="sv-icon-btn edit"
                              title="Chỉnh sửa"
                              onClick={() => handleGoToEdit(tour.tourid)}
                            >
                              <FaEdit />
                            </button>

                            <button
                              className="sv-icon-btn delete"
                              title="Xóa Tour"
                              onClick={() => handleOpenDelete(tour)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="sv-empty-table">
                      <BsSearch />

                      <strong>Không tìm thấy Tour</strong>

                      <span>Thử thay đổi từ khóa hoặc bộ lọc.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===============================================
            MOBILE CARD
        =============================================== */}

        <div className="sv-mobile-list">
          {loading ? (
            <div className="sv-mobile-loading">
              <Spinner animation="border" variant="primary" />

              <span>Đang tải Tour...</span>
            </div>
          ) : currentItems.length > 0 ? (
            currentItems.map((tour) => {
              const avatar = getAvatar(tour);

              const price =
                tour.price && tour.price.adultprice !== undefined
                  ? tour.price.adultprice
                  : null;

              return (
                <div key={tour.tourid} className="sv-mobile-card">
                  <div
                    className="sv-mobile-image"
                    onClick={() => handleGoToDetail(tour.tourid)}
                  >
                    {avatar ? (
                      <img src={avatar} alt={tour.tourname} />
                    ) : (
                      <div className="sv-no-image">
                        <FaRoute />
                      </div>
                    )}

                    <span className="sv-mobile-id">#{tour.tourid}</span>

                    <span
                      className={
                        tour.tourtype === "DOAN"
                          ? "sv-mobile-type group"
                          : "sv-mobile-type retail"
                      }
                    >
                      {tour.tourtype === "DOAN" ? "Tour đoàn" : "Tour lẻ"}
                    </span>
                  </div>

                  <div className="sv-mobile-body">
                    <h3 onClick={() => handleGoToDetail(tour.tourid)}>
                      {tour.tourname}
                    </h3>

                    <div className="sv-mobile-route">
                      <FaMapMarkerAlt />

                      <span>
                        {tour.departure_name || "—"}

                        {" → "}

                        {tour.destination_name || "—"}
                      </span>
                    </div>

                    <p>{tour.description || "Chưa có mô tả."}</p>

                    <div className="sv-mobile-info-grid">
                      <div>
                        <span>Giá từ</span>

                        <strong className="price">{formatMoney(price)}</strong>
                      </div>

                      <div>
                        <span>Khởi hành</span>

                        <strong>{formatDate(tour.startdate)}</strong>
                      </div>
                    </div>

                    <div className="sv-mobile-actions">
                      <button
                        className="view"
                        onClick={() => handleGoToDetail(tour.tourid)}
                      >
                        <FaEye />
                        Xem
                      </button>

                      <button
                        className="edit"
                        onClick={() => handleGoToEdit(tour.tourid)}
                      >
                        <FaEdit />
                        Sửa
                      </button>

                      <button
                        className="delete"
                        onClick={() => handleOpenDelete(tour)}
                      >
                        <FaTrash />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="sv-mobile-empty">
              <BsSearch />

              <strong>Không tìm thấy Tour</strong>

              <span>Hãy thử thay đổi bộ lọc.</span>
            </div>
          )}
        </div>

        {/* ===============================================
            PAGINATION
        =============================================== */}

        <div className="sv-pagination-bar">
          <div className="sv-page-count">
            Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
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

      {/* =================================================
          DELETE MODAL
      ================================================= */}

      <Modal
        show={openModalDelete}
        onHide={handleCloseDelete}
        centered
        size="sm"
      >
        <div className="sv-delete-modal">
          <div className="sv-delete-icon">
            <FaTrash />
          </div>

          <h4>Xóa Tour?</h4>

          <p>Bạn có chắc chắn muốn xóa:</p>

          <strong>{deleteTourName}</strong>

          <div className="sv-delete-warning">
            Dữ liệu tour sẽ bị xóa khỏi hệ thống và không thể hoàn tác.
          </div>

          <div className="sv-delete-actions">
            <Button variant="light" onClick={handleCloseDelete}>
              Hủy
            </Button>

            <Button
              variant="danger"
              onClick={handleAgreeDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang xóa...
                </>
              ) : (
                "Xác nhận xóa"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* =================================================
          TOAST
      ================================================= */}

      <ToastContainer
        position="top-end"
        className="p-3"
        style={{
          position: "fixed",
          zIndex: 10000,
        }}
      >
        <Toast
          show={successAlertOpen}
          onClose={() => setSuccessAlertOpen(false)}
          delay={3500}
          autohide
          bg={toastVariant}
        >
          <Toast.Body className="text-white fw-bold">{alertMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default Tour;
