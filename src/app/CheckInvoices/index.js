// src/pages/CheckInvoice.js

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import {
  Button,
  Modal,
  Form,
  Spinner,
  Toast,
  ToastContainer,
  InputGroup,
} from "react-bootstrap";

import {
  BsSearch,
  BsReceipt,
  BsCalendar3,
  BsBuilding,
  BsArrowRight,
} from "react-icons/bs";

import {
  FaPlus,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTrash,
} from "react-icons/fa";

import "./index.css";

const CheckInvoice = () => {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [tours, setTours] = useState([]);
  const [tourSummaries, setTourSummaries] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  // ADD TOUR
  const [openAddTour, setOpenAddTour] = useState(false);

  const [tourForm, setTourForm] = useState({
    tour_code: "",
    tour_name: "",
    customer_name: "",
    departure_date: "",
    return_date: "",
    output_amount: "",
    note: "",
  });

  // TOAST
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {
    getTours();
  }, []);

  // =====================================================
  // GET TOURS
  // =====================================================

  const getTours = async () => {
    try {
      setLoading(true);

      const response = await API.get("/invoice-tours");

      const tourData = response.data?.data || [];

      setTours(tourData);

      // ============================================
      // LOAD SUMMARY TỪNG TOUR
      // ============================================

      if (tourData.length > 0) {
        const results = await Promise.allSettled(
          tourData.map((tour) =>
            API.get(`/invoice-tours/${tour.tour_id}/summary`),
          ),
        );

        const summaryMap = {};

        results.forEach((result, index) => {
          const tourId = tourData[index].tour_id;

          if (result.status === "fulfilled") {
            summaryMap[tourId] = result.value.data?.data || {};
          } else {
            summaryMap[tourId] = {};
          }
        });

        setTourSummaries(summaryMap);
      } else {
        setTourSummaries({});
      }
    } catch (error) {
      console.error("getTours error:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  const formatMoney = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString("vi-VN") + " đ";
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "---";

    const dateOnly = String(date).substring(0, 10);

    const [year, month, day] = dateOnly.split("-");

    if (!year || !month || !day) {
      return date;
    }

    return `${day}/${month}/${year}`;
  };

  // =====================================================
  // DASHBOARD
  // =====================================================

  const dashboard = useMemo(() => {
    let totalOutput = 0;
    let totalRequired = 0;
    let totalReceived = 0;
    let totalMissing = 0;

    Object.values(tourSummaries).forEach((summary) => {
      if (!summary) return;

      totalOutput += Number(summary.output_amount || 0);

      totalRequired += Number(summary.total_required_invoice || 0);

      totalReceived += Number(summary.total_invoice_received || 0);

      totalMissing += Number(summary.total_missing_invoice || 0);
    });

    return {
      totalOutput,
      totalRequired,
      totalReceived,
      totalMissing,
    };
  }, [tourSummaries]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredTours = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return tours;
    }

    return tours.filter((tour) => {
      const tourCode = String(tour.tour_code || "").toLowerCase();

      const tourName = String(tour.tour_name || "").toLowerCase();

      const customerName = String(tour.customer_name || "").toLowerCase();

      return (
        tourCode.includes(keyword) ||
        tourName.includes(keyword) ||
        customerName.includes(keyword)
      );
    });
  }, [tours, searchTerm]);

  // =====================================================
  // OPEN ADD TOUR
  // =====================================================
  const handleDeleteTour = async (e, tour) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const ok = window.confirm(
      `Bạn có chắc chắn muốn xóa tour "${tour.tour_code} - ${tour.tour_name}" không?\n\n` +
        `Lưu ý: các dịch vụ và hóa đơn liên quan đến tour này cũng có thể bị xóa.`,
    );

    if (!ok) return;

    try {
      setLoading(true);

      await APIToken.delete(`/invoice-tours/${tour.tour_id}`);

      setToastMessage("Xóa tour thành công");
      setToastOpen(true);

      await getTours();
    } catch (error) {
      console.error("handleDeleteTour error:", error);

      alert(error.response?.data?.message || "Không thể xóa tour");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddTour = () => {
    setTourForm({
      tour_code: "",
      tour_name: "",
      customer_name: "",
      departure_date: "",
      return_date: "",
      output_amount: "",
      note: "",
    });

    setOpenAddTour(true);
  };

  // =====================================================
  // CHANGE TOUR FORM
  // =====================================================

  const handleTourFormChange = (field, value) => {
    setTourForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =====================================================
  // ADD TOUR
  // =====================================================

  const handleAddTour = async () => {
    if (!tourForm.tour_code.trim()) {
      alert("Vui lòng nhập mã tour");

      return;
    }

    if (!tourForm.tour_name.trim()) {
      alert("Vui lòng nhập tên tour");

      return;
    }

    if (
      tourForm.departure_date &&
      tourForm.return_date &&
      tourForm.return_date < tourForm.departure_date
    ) {
      alert("Ngày về không được nhỏ hơn ngày đi");

      return;
    }

    try {
      setSaving(true);

      const payload = {
        tour_code: tourForm.tour_code.trim(),

        tour_name: tourForm.tour_name.trim(),

        customer_name: tourForm.customer_name.trim(),

        departure_date: tourForm.departure_date || null,

        return_date: tourForm.return_date || null,

        output_amount: Number(tourForm.output_amount || 0),

        note: tourForm.note.trim(),
      };

      const response = await APIToken.post("/invoice-tours/add", payload);

      if (response.status === 200 || response.status === 201) {
        setOpenAddTour(false);

        setToastMessage("Tạo tour thành công");

        setToastOpen(true);

        await getTours();
      }
    } catch (error) {
      console.error("handleAddTour error:", error);

      alert(error.response?.data?.message || "Không thể tạo tour");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // GO DETAIL
  // =====================================================

  const handleGoDetail = (tourId) => {
    navigate(`/check-invoice/${tourId}`);
  };

  // =====================================================
  // GET TOUR STATUS
  // =====================================================

  const getTourStatus = (summary) => {
    const required = Number(summary?.total_required_invoice || 0);

    const received = Number(summary?.total_invoice_received || 0);

    const missing = Number(summary?.total_missing_invoice || 0);

    if (required <= 0) {
      return {
        text: "Chưa khai báo",
        className: "ci-tour-status-neutral",
      };
    }

    if (missing <= 0 && received >= required) {
      return {
        text: "Đã đủ",
        className: "ci-tour-status-success",
      };
    }

    if (received > 0) {
      return {
        text: "Còn thiếu",
        className: "ci-tour-status-warning",
      };
    }

    return {
      text: "Chưa có HĐ",
      className: "ci-tour-status-danger",
    };
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="ci-page">
      {/* ================================================
          HEADER
      ================================================= */}

      <div className="ci-header">
        <div className="ci-title">
          <h2>Đối soát hóa đơn</h2>

          <p>Theo dõi hóa đơn đầu vào và số tiền còn thiếu của từng tour</p>
        </div>

        <div className="ci-header-actions">
          <InputGroup className="ci-search">
            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>

            <Form.Control
              placeholder="Tìm mã tour, tên tour, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <Button className="ci-btn-add" onClick={handleOpenAddTour}>
            <FaPlus />

            <span>Thêm tour</span>
          </Button>
        </div>
      </div>

      {/* ================================================
          DASHBOARD
      ================================================= */}

      <div className="ci-dashboard">
        <div className="ci-stat-card">
          <div className="ci-stat-top">
            <div className="ci-stat-label">Tổng xuất khách</div>

            <div className="ci-stat-icon">
              <BsReceipt />
            </div>
          </div>

          <div className="ci-stat-value">
            {formatMoney(dashboard.totalOutput)}
          </div>
        </div>

        <div className="ci-stat-card">
          <div className="ci-stat-top">
            <div className="ci-stat-label">Hóa đơn cần lấy</div>
          </div>

          <div className="ci-stat-value">
            {formatMoney(dashboard.totalRequired)}
          </div>
        </div>

        <div className="ci-stat-card ci-stat-success">
          <div className="ci-stat-top">
            <div className="ci-stat-label">Đã lấy hóa đơn</div>

            <FaCheckCircle />
          </div>

          <div className="ci-stat-value">
            {formatMoney(dashboard.totalReceived)}
          </div>
        </div>

        <div className="ci-stat-card ci-stat-danger">
          <div className="ci-stat-top">
            <div className="ci-stat-label">Còn thiếu</div>

            <FaExclamationTriangle />
          </div>

          <div className="ci-stat-value">
            {formatMoney(dashboard.totalMissing)}
          </div>
        </div>
      </div>

      {/* ================================================
          TITLE LIST
      ================================================= */}

      <div className="ci-list-header">
        <div>
          <h3>Danh sách tour</h3>

          <p>{filteredTours.length} tour</p>
        </div>
      </div>

      {/* ================================================
          LOADING
      ================================================= */}

      {loading ? (
        <div className="ci-loading">
          <Spinner animation="border" size="sm" />

          <span>Đang tải dữ liệu...</span>
        </div>
      ) : (
        <>
          {/* ============================================
              DESKTOP TABLE
          ============================================= */}

          <div className="ci-desktop-content">
            <div className="table-responsive">
              <table className="ci-table">
                <thead>
                  <tr>
                    <th>Mã tour</th>

                    <th>Tour / Khách hàng</th>

                    <th>Thời gian</th>

                    <th>Xuất khách</th>

                    <th>Cần lấy HĐ</th>

                    <th>Đã lấy</th>

                    <th>Còn thiếu</th>

                    <th>Trạng thái</th>

                    <th className="ci-action-column">Tác vụ</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTours.map((tour) => {
                    const summary = tourSummaries[tour.tour_id] || {};

                    const status = getTourStatus(summary);

                    const missing = Number(summary.total_missing_invoice || 0);

                    return (
                      <tr key={tour.tour_id}>
                        <td>
                          <span
                            className="ci-tour-code"
                            onClick={() =>
                              navigate(`/check-invoice/tours/${tour.tour_id}`)
                            }
                          >
                            {tour.tour_code}
                          </span>
                        </td>

                        <td>
                          <div className="ci-tour-name">{tour.tour_name}</div>

                          <div className="ci-customer">
                            <BsBuilding />

                            <span>{tour.customer_name || "---"}</span>
                          </div>
                        </td>

                        <td>
                          <div className="ci-table-date">
                            {formatDate(tour.departure_date)}
                          </div>

                          <div className="ci-table-date-sub">
                            đến {formatDate(tour.return_date)}
                          </div>
                        </td>

                        <td>
                          <strong>{formatMoney(tour.output_amount)}</strong>
                        </td>

                        <td>{formatMoney(summary.total_required_invoice)}</td>

                        <td className="ci-money-success">
                          {formatMoney(summary.total_invoice_received)}
                        </td>

                        <td
                          className={
                            missing > 0 ? "ci-money-danger" : "ci-money-success"
                          }
                        >
                          {formatMoney(missing)}
                        </td>

                        <td>
                          <span
                            className={`ci-tour-status ${status.className}`}
                          >
                            {status.text}
                          </span>
                        </td>
                        <td>
                          <div className="ci-table-actions">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="ci-btn-detail"
                              onClick={() => handleGoDetail(tour.tour_id)}
                            >
                              Đối soát
                              <BsArrowRight />
                            </Button>

                            <button
                              type="button"
                              className="ci-btn-delete-tour"
                              onClick={(e) => handleDeleteTour(e, tour)}
                              title="Xóa tour"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTours.length === 0 && (
                    <tr>
                      <td colSpan="9" className="ci-empty-table">
                        <BsReceipt size={32} />

                        <div>Không tìm thấy tour</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================
              MOBILE CARDS
          ============================================= */}

          <div className="ci-mobile-content">
            {filteredTours.map((tour) => {
              const summary = tourSummaries[tour.tour_id] || {};

              const status = getTourStatus(summary);

              const missing = Number(summary.total_missing_invoice || 0);

              return (
                <div
                  className="ci-mobile-card"
                  key={tour.tour_id}
                  onClick={() =>
                    navigate(`/check-invoice/tours/${tour.tour_id}`)
                  }
                >
                  {/* HEADER CARD */}

                  <div className="ci-mobile-card-head">
                    <div className="ci-mobile-card-title">
                      <div className="ci-mobile-code">{tour.tour_code}</div>

                      <h4>{tour.tour_name}</h4>
                    </div>

                    <span className={`ci-tour-status ${status.className}`}>
                      {status.text}
                    </span>
                  </div>

                  {/* CUSTOMER */}

                  <div className="ci-mobile-customer">
                    <BsBuilding />

                    <span>{tour.customer_name || "---"}</span>
                  </div>

                  {/* DATE */}

                  <div className="ci-mobile-date">
                    <BsCalendar3 />

                    <span>
                      {formatDate(tour.departure_date)}

                      {" - "}

                      {formatDate(tour.return_date)}
                    </span>
                  </div>

                  {/* MONEY */}

                  <div className="ci-mobile-money-grid">
                    <div className="ci-mobile-money">
                      <span>Xuất khách</span>

                      <strong>{formatMoney(tour.output_amount)}</strong>
                    </div>

                    <div className="ci-mobile-money">
                      <span>Cần lấy HĐ</span>

                      <strong>
                        {formatMoney(summary.total_required_invoice)}
                      </strong>
                    </div>

                    <div className="ci-mobile-money">
                      <span>Đã lấy</span>

                      <strong className="ci-money-success">
                        {formatMoney(summary.total_invoice_received)}
                      </strong>
                    </div>

                    <div className="ci-mobile-money">
                      <span>Còn thiếu</span>

                      <strong
                        className={
                          missing > 0 ? "ci-money-danger" : "ci-money-success"
                        }
                      >
                        {formatMoney(missing)}
                      </strong>
                    </div>
                  </div>

                  {/* BUTTON */}

                  <div className="ci-mobile-actions">
                    <Button
                      className="ci-mobile-detail-btn"
                      variant={missing > 0 ? "primary" : "outline-success"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        handleGoDetail(tour.tour_id);
                      }}
                    >
                      <BsReceipt />

                      <span>Đối soát</span>

                      <BsArrowRight />
                    </Button>

                    <button
                      type="button"
                      className="ci-mobile-delete-btn"
                      onClick={(e) => handleDeleteTour(e, tour)}
                      title="Xóa tour"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTours.length === 0 && (
              <div className="ci-mobile-empty">
                <BsReceipt size={40} />

                <h4>Không tìm thấy tour</h4>

                <p>Thử tìm bằng mã tour, tên tour hoặc khách hàng.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ================================================
          ADD TOUR MODAL
      ================================================= */}

      <Modal
        show={openAddTour}
        onHide={() => setOpenAddTour(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="ci-modal-title">
            Thêm tour đối soát
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <div className="row">
              {/* MÃ TOUR */}

              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label className="ci-form-label">
                    Mã tour
                    <span>*</span>
                  </Form.Label>

                  <Form.Control
                    value={tourForm.tour_code}
                    onChange={(e) =>
                      handleTourFormChange("tour_code", e.target.value)
                    }
                    placeholder="VD: VT-200826"
                  />
                </Form.Group>
              </div>

              {/* TÊN TOUR */}

              <div className="col-md-8">
                <Form.Group className="mb-3">
                  <Form.Label className="ci-form-label">
                    Tên tour
                    <span>*</span>
                  </Form.Label>

                  <Form.Control
                    value={tourForm.tour_name}
                    onChange={(e) =>
                      handleTourFormChange("tour_name", e.target.value)
                    }
                    placeholder="VD: Vũng Tàu 3N2Đ"
                  />
                </Form.Group>
              </div>

              {/* KHÁCH HÀNG */}

              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label className="ci-form-label">Khách hàng</Form.Label>

                  <Form.Control
                    value={tourForm.customer_name}
                    onChange={(e) =>
                      handleTourFormChange("customer_name", e.target.value)
                    }
                    placeholder="Tên công ty / đơn vị / đoàn khách"
                  />
                </Form.Group>
              </div>

              {/* NGÀY ĐI */}

              <div className="col-6">
                <Form.Group className="mb-3">
                  <Form.Label className="ci-form-label">Ngày đi</Form.Label>

                  <Form.Control
                    type="date"
                    value={tourForm.departure_date}
                    onChange={(e) =>
                      handleTourFormChange("departure_date", e.target.value)
                    }
                  />
                </Form.Group>
              </div>

              {/* NGÀY VỀ */}

              <div className="col-6">
                <Form.Group className="mb-3">
                  <Form.Label className="ci-form-label">Ngày về</Form.Label>

                  <Form.Control
                    type="date"
                    value={tourForm.return_date}
                    onChange={(e) =>
                      handleTourFormChange("return_date", e.target.value)
                    }
                  />
                </Form.Group>
              </div>

              {/* OUTPUT */}

              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label className="ci-form-label">
                    Số tiền xuất cho khách
                  </Form.Label>

                  <Form.Control
                    type="number"
                    inputMode="numeric"
                    value={tourForm.output_amount}
                    onChange={(e) =>
                      handleTourFormChange("output_amount", e.target.value)
                    }
                    placeholder="VD: 335000000"
                  />

                  {tourForm.output_amount && (
                    <Form.Text className="ci-money-preview">
                      {formatMoney(tourForm.output_amount)}
                    </Form.Text>
                  )}
                </Form.Group>
              </div>

              {/* NOTE */}

              <div className="col-12">
                <Form.Group>
                  <Form.Label className="ci-form-label">Ghi chú</Form.Label>

                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={tourForm.note}
                    onChange={(e) =>
                      handleTourFormChange("note", e.target.value)
                    }
                    placeholder="Ghi chú thêm nếu có..."
                  />
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="light"
            onClick={() => setOpenAddTour(false)}
            disabled={saving}
          >
            Hủy
          </Button>

          <Button onClick={handleAddTour} disabled={saving}>
            {saving ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <FaPlus />

                <span>Tạo tour</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================================================
          TOAST
      ================================================= */}

      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={toastOpen}
          onClose={() => setToastOpen(false)}
          delay={2500}
          autohide
          bg="success"
        >
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default CheckInvoice;
