// src/pages/CheckInvoiceTourDetail.js

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { Button, Spinner, Form, Toast, ToastContainer } from "react-bootstrap";

import {
  BsArrowLeft,
  BsBuilding,
  BsCalendar3,
  BsReceipt,
} from "react-icons/bs";

import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaSave,
  FaTimes,
} from "react-icons/fa";

import "./index.css";

const CheckInvoiceTourDetail = () => {
  const { tourId } = useParams();
  const navigate = useNavigate();

  // =====================================================
  // TOUR
  // =====================================================

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // =====================================================
  // EDIT TOUR
  // =====================================================

  const [editTour, setEditTour] = useState(false);

  const [tourEditForm, setTourEditForm] = useState({
    tour_code: "",
    tour_name: "",
    customer_name: "",
    departure_date: "",
    return_date: "",
    output_amount: "",
    note: "",
  });

  // =====================================================
  // ADD SERVICE
  // =====================================================

  const [showServiceForm, setShowServiceForm] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    service_type: "",
    service_name: "",
    supplier_name: "",
    description: "",
    service_amount: "",
    required_invoice_amount: "",
    note: "",
  });

  // =====================================================
  // EDIT SERVICE
  // =====================================================

  const [editingServiceId, setEditingServiceId] = useState(null);

  const [serviceEditForm, setServiceEditForm] = useState({
    service_type: "",
    service_name: "",
    supplier_name: "",
    description: "",
    service_amount: "",
    required_invoice_amount: "",
    note: "",
  });

  // =====================================================
  // TOAST
  // =====================================================

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message) => {
    setToastMessage(message);
    setToastOpen(true);
  };

  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {
    getTourDetail();
  }, [tourId]);

  // =====================================================
  // GET TOUR DETAIL
  // =====================================================

  const getTourDetail = async () => {
    try {
      setLoading(true);

      const response = await API.get(`/invoice-tours/${tourId}/summary`);

      setTour(response.data?.data || null);
    } catch (error) {
      console.error("getTourDetail error:", error);

      alert(error.response?.data?.message || "Không thể tải thông tin tour");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + " đ";
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
  // OPEN EDIT TOUR
  // =====================================================

  const handleOpenEditTour = () => {
    if (!tour) return;

    // đóng form thêm/sửa dịch vụ nếu đang mở
    setShowServiceForm(false);
    setEditingServiceId(null);

    setTourEditForm({
      tour_code: tour.tour_code || "",
      tour_name: tour.tour_name || "",
      customer_name: tour.customer_name || "",

      departure_date: tour.departure_date
        ? String(tour.departure_date).substring(0, 10)
        : "",

      return_date: tour.return_date
        ? String(tour.return_date).substring(0, 10)
        : "",

      output_amount: tour.output_amount || "",

      note: tour.note || "",
    });

    setEditTour(true);
  };

  // =====================================================
  // UPDATE TOUR
  // =====================================================

  const handleUpdateTour = async () => {
    if (!tourEditForm.tour_code.trim()) {
      alert("Vui lòng nhập mã tour");
      return;
    }

    if (!tourEditForm.tour_name.trim()) {
      alert("Vui lòng nhập tên tour");
      return;
    }

    if (
      tourEditForm.departure_date &&
      tourEditForm.return_date &&
      tourEditForm.return_date < tourEditForm.departure_date
    ) {
      alert("Ngày về không được nhỏ hơn ngày đi");
      return;
    }

    try {
      setSaving(true);

      await APIToken.put(`/invoice-tours/${tourId}`, {
        tour_code: tourEditForm.tour_code.trim(),

        tour_name: tourEditForm.tour_name.trim(),

        customer_name: tourEditForm.customer_name.trim(),

        departure_date: tourEditForm.departure_date || null,

        return_date: tourEditForm.return_date || null,

        output_amount: Number(tourEditForm.output_amount || 0),

        note: tourEditForm.note.trim(),
      });

      setEditTour(false);

      await getTourDetail();

      showToast("Cập nhật thông tin tour thành công");
    } catch (error) {
      console.error("handleUpdateTour:", error);

      alert(error.response?.data?.message || "Không thể cập nhật tour");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // OPEN ADD SERVICE
  // =====================================================

  const handleOpenServiceForm = () => {
    // đóng các form khác
    setEditTour(false);
    setEditingServiceId(null);

    setServiceForm({
      service_type: "",
      service_name: "",
      supplier_name: "",
      description: "",
      service_amount: "",
      required_invoice_amount: "",
      note: "",
    });

    setShowServiceForm(true);

    setTimeout(() => {
      document.getElementById("cit-add-service-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // =====================================================
  // ADD SERVICE
  // =====================================================

  const handleAddService = async () => {
    if (!serviceForm.service_type) {
      alert("Vui lòng chọn loại dịch vụ");
      return;
    }

    if (!serviceForm.service_name.trim()) {
      alert("Vui lòng nhập tên dịch vụ");
      return;
    }

    try {
      setSaving(true);

      await APIToken.post(`/invoice-tours/${tourId}/services/add`, {
        service_type: serviceForm.service_type,

        service_name: serviceForm.service_name.trim(),

        supplier_name: serviceForm.supplier_name.trim(),

        description: serviceForm.description.trim(),

        service_amount: Number(serviceForm.service_amount || 0),

        required_invoice_amount: Number(
          serviceForm.required_invoice_amount || 0,
        ),

        note: serviceForm.note.trim(),
      });

      setShowServiceForm(false);

      await getTourDetail();

      showToast("Thêm dịch vụ thành công");
    } catch (error) {
      console.error("handleAddService:", error);

      alert(error.response?.data?.message || "Không thể thêm dịch vụ");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // OPEN EDIT SERVICE
  // =====================================================

  const handleOpenEditService = (service) => {
    // nếu bấm lại đúng service đang mở
    // thì đóng form
    if (Number(editingServiceId) === Number(service.service_id)) {
      setEditingServiceId(null);
      return;
    }

    setEditTour(false);
    setShowServiceForm(false);

    setEditingServiceId(service.service_id);

    setServiceEditForm({
      service_type: service.service_type || "",

      service_name: service.service_name || "",

      supplier_name: service.supplier_name || "",

      description: service.description || "",

      service_amount: service.service_amount || "",

      required_invoice_amount: service.required_invoice_amount || "",

      note: service.note || "",
    });

    setTimeout(() => {
      document
        .getElementById(`cit-edit-service-${service.service_id}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 100);
  };

  // =====================================================
  // UPDATE SERVICE
  // =====================================================

  const handleUpdateService = async (serviceId) => {
    if (!serviceEditForm.service_type) {
      alert("Vui lòng chọn loại dịch vụ");
      return;
    }

    if (!serviceEditForm.service_name.trim()) {
      alert("Vui lòng nhập tên dịch vụ");
      return;
    }

    try {
      setSaving(true);

      await APIToken.put(`/invoice-tour-services/${serviceId}`, {
        service_type: serviceEditForm.service_type,

        service_name: serviceEditForm.service_name.trim(),

        supplier_name: serviceEditForm.supplier_name.trim(),

        description: serviceEditForm.description.trim(),

        service_amount: Number(serviceEditForm.service_amount || 0),

        required_invoice_amount: Number(
          serviceEditForm.required_invoice_amount || 0,
        ),

        note: serviceEditForm.note.trim(),
      });

      setEditingServiceId(null);

      await getTourDetail();

      showToast("Cập nhật dịch vụ thành công");
    } catch (error) {
      console.error("handleUpdateService:", error);

      alert(error.response?.data?.message || "Không thể cập nhật dịch vụ");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE SERVICE
  // =====================================================

  const handleDeleteService = async (service) => {
    const ok = window.confirm(
      `Bạn có chắc chắn muốn xóa dịch vụ "${
        service.service_name || service.service_type
      }" không?\n\nCác hóa đơn thuộc dịch vụ này cũng có thể bị xóa.`,
    );

    if (!ok) return;

    try {
      setSaving(true);

      await APIToken.delete(`/invoice-tour-services/${service.service_id}`);

      if (Number(editingServiceId) === Number(service.service_id)) {
        setEditingServiceId(null);
      }

      await getTourDetail();

      showToast("Xóa dịch vụ thành công");
    } catch (error) {
      console.error("handleDeleteService:", error);

      alert(error.response?.data?.message || "Không thể xóa dịch vụ");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // STATUS SERVICE
  // =====================================================

  const getServiceStatus = (service) => {
    const required = Number(service.required_invoice_amount || 0);

    const received = Number(service.invoiced_amount || 0);

    if (required <= 0) {
      return {
        label: "Không yêu cầu HĐ",
        className: "cit-status-neutral",
        icon: null,
      };
    }

    if (received >= required) {
      return {
        label: "Đã đối soát",
        className: "cit-status-success",
        icon: <FaCheckCircle />,
      };
    }

    if (received > 0) {
      return {
        label: "Chưa đủ",
        className: "cit-status-warning",
        icon: <FaExclamationTriangle />,
      };
    }

    return {
      label: "Chưa có HĐ",
      className: "cit-status-danger",
      icon: <FaTimesCircle />,
    };
  };

  // =====================================================
  // TOUR STATUS
  // =====================================================

  const getTourStatus = () => {
    if (!tour) return null;

    const required = Number(tour.total_required_invoice || 0);

    const received = Number(tour.total_invoice_received || 0);

    const missing = Number(tour.total_missing_invoice || 0);

    if (required <= 0) {
      return {
        label: "Chưa khai báo hóa đơn",
        className: "cit-main-status-neutral",
      };
    }

    if (missing <= 0 && received >= required) {
      return {
        label: "Đã đối soát đủ",
        className: "cit-main-status-success",
      };
    }

    if (received > 0) {
      return {
        label: "Đang đối soát",
        className: "cit-main-status-warning",
      };
    }

    return {
      label: "Chưa đối soát",
      className: "cit-main-status-danger",
    };
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading && !tour) {
    return (
      <div className="cit-loading">
        <Spinner animation="border" />

        <div>Đang tải chi tiết tour...</div>
      </div>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (!tour) {
    return <div className="cit-loading">Không tìm thấy tour</div>;
  }

  const tourStatus = getTourStatus();

  const totalRequired = Number(tour.total_required_invoice || 0);

  const totalReceived = Number(tour.total_invoice_received || 0);

  const progress =
    totalRequired > 0
      ? Math.min(100, Math.round((totalReceived / totalRequired) * 100))
      : 0;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="cit-page">
      {/* =================================================
          TOP BAR
      ================================================= */}

      <div className="cit-topbar">
        <Button
          variant="light"
          className="cit-back-btn"
          onClick={() => navigate("/check-invoices")}
          title="Quay lại danh sách tour"
        >
          <BsArrowLeft />

          <span>Danh sách tour</span>
        </Button>

        <div className="cit-top-actions">
          {/* SỬA TOUR */}

          <Button
            variant="outline-primary"
            className="cit-btn-edit-tour"
            onClick={handleOpenEditTour}
            title="Sửa thông tin tour"
          >
            <FaEdit />

            <span>Sửa tour</span>
          </Button>

          {/* THÊM DỊCH VỤ */}

          <Button
            className="cit-btn-add-service"
            onClick={handleOpenServiceForm}
            title="Thêm dịch vụ"
          >
            <FaPlus />

            <span>Thêm dịch vụ</span>
          </Button>

          {/* ĐỐI SOÁT */}

          <Button
            variant="success"
            className="cit-btn-reconcile"
            onClick={() => navigate(`/check-invoice/${tourId}`)}
            title="Đối soát hóa đơn"
          >
            <BsReceipt />

            <span>Đối soát</span>
          </Button>
        </div>
      </div>

      {/* =================================================
          TOUR HEADER
      ================================================= */}

      <div className="cit-tour-header">
        <div className="cit-tour-main-info">
          <div className="cit-tour-code">{tour.tour_code}</div>

          <h1>{tour.tour_name}</h1>

          <div className="cit-tour-meta">
            <div>
              <BsBuilding />

              <span>{tour.customer_name || "---"}</span>
            </div>

            <div>
              <BsCalendar3 />

              <span>
                {formatDate(tour.departure_date)}

                {" - "}

                {formatDate(tour.return_date)}
              </span>
            </div>
          </div>
        </div>

        <div className={`cit-main-status ${tourStatus.className}`}>
          {tourStatus.label}
        </div>
      </div>

      {/* =================================================
          FORM SỬA TOUR
      ================================================= */}

      {editTour && (
        <div className="cit-edit-card">
          <div className="cit-form-header">
            <div>
              <h3>Điều chỉnh thông tin tour</h3>

              <p>Cập nhật thông tin cơ bản của tour</p>
            </div>

            <button
              type="button"
              className="cit-close-form-btn"
              onClick={() => setEditTour(false)}
              title="Đóng"
            >
              <FaTimes />
            </button>
          </div>

          <div className="cit-form-grid">
            {/* MÃ TOUR */}

            <Form.Group>
              <Form.Label>Mã tour *</Form.Label>

              <Form.Control
                value={tourEditForm.tour_code}
                onChange={(e) =>
                  setTourEditForm({
                    ...tourEditForm,

                    tour_code: e.target.value,
                  })
                }
              />
            </Form.Group>

            {/* TÊN TOUR */}

            <Form.Group>
              <Form.Label>Tên tour *</Form.Label>

              <Form.Control
                value={tourEditForm.tour_name}
                onChange={(e) =>
                  setTourEditForm({
                    ...tourEditForm,

                    tour_name: e.target.value,
                  })
                }
              />
            </Form.Group>

            {/* KHÁCH HÀNG */}

            <Form.Group>
              <Form.Label>Khách hàng</Form.Label>

              <Form.Control
                value={tourEditForm.customer_name}
                onChange={(e) =>
                  setTourEditForm({
                    ...tourEditForm,

                    customer_name: e.target.value,
                  })
                }
              />
            </Form.Group>

            {/* SỐ XUẤT */}

            <Form.Group>
              <Form.Label>Số tiền xuất khách</Form.Label>

              <Form.Control
                type="number"
                inputMode="numeric"
                value={tourEditForm.output_amount}
                onChange={(e) =>
                  setTourEditForm({
                    ...tourEditForm,

                    output_amount: e.target.value,
                  })
                }
              />

              {tourEditForm.output_amount && (
                <Form.Text className="cit-money-preview">
                  {formatMoney(tourEditForm.output_amount)}
                </Form.Text>
              )}
            </Form.Group>

            {/* NGÀY ĐI */}

            <Form.Group>
              <Form.Label>Ngày đi</Form.Label>

              <Form.Control
                type="date"
                value={tourEditForm.departure_date}
                onChange={(e) =>
                  setTourEditForm({
                    ...tourEditForm,

                    departure_date: e.target.value,
                  })
                }
              />
            </Form.Group>

            {/* NGÀY VỀ */}

            <Form.Group>
              <Form.Label>Ngày về</Form.Label>

              <Form.Control
                type="date"
                value={tourEditForm.return_date}
                onChange={(e) =>
                  setTourEditForm({
                    ...tourEditForm,

                    return_date: e.target.value,
                  })
                }
              />
            </Form.Group>

            {/* NOTE */}

            <Form.Group className="cit-full">
              <Form.Label>Ghi chú</Form.Label>

              <Form.Control
                as="textarea"
                rows={2}
                value={tourEditForm.note}
                onChange={(e) =>
                  setTourEditForm({
                    ...tourEditForm,

                    note: e.target.value,
                  })
                }
              />
            </Form.Group>
          </div>

          <div className="cit-form-actions">
            <Button
              variant="light"
              onClick={() => setEditTour(false)}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button onClick={handleUpdateTour} disabled={saving}>
              {saving ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <FaSave />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="cit-summary-grid">
        <SummaryCard
          title="Tổng xuất khách"
          value={formatMoney(tour.output_amount)}
        />

        <SummaryCard
          title="Tổng chi phí"
          value={formatMoney(tour.total_service_amount)}
        />

        <SummaryCard
          title="Cần lấy hóa đơn"
          value={formatMoney(tour.total_required_invoice)}
        />

        <SummaryCard
          title="Đã lấy hóa đơn"
          value={formatMoney(tour.total_invoice_received)}
          type="success"
        />

        <SummaryCard
          title="Còn thiếu"
          value={formatMoney(tour.total_missing_invoice)}
          type="danger"
        />

        <SummaryCard
          title="Số dịch vụ"
          value={`${tour.services?.length || 0} dịch vụ`}
        />
      </div>

      {/* =================================================
          PROGRESS
      ================================================= */}

      <div className="cit-progress-card">
        <div className="cit-progress-header">
          <div>
            <h3>Tiến độ đối soát</h3>

            <p>Tình trạng hóa đơn đầu vào của tour</p>
          </div>

          <strong>{progress}%</strong>
        </div>

        <div className="cit-progress-track">
          <div
            className="cit-progress-value"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="cit-progress-money">
          <span>
            Đã lấy <strong>{formatMoney(tour.total_invoice_received)}</strong>
          </span>

          <span>/ {formatMoney(tour.total_required_invoice)}</span>
        </div>
      </div>

      {/* =================================================
          FORM THÊM DỊCH VỤ
      ================================================= */}

      {showServiceForm && (
        <div className="cit-add-service-card" id="cit-add-service-form">
          <div className="cit-form-header">
            <div>
              <h3>Thêm dịch vụ</h3>

              <p>Khai báo dịch vụ thuộc tour</p>
            </div>

            <button
              type="button"
              className="cit-close-form-btn"
              onClick={() => setShowServiceForm(false)}
            >
              <FaTimes />
            </button>
          </div>

          <ServiceFormFields
            form={serviceForm}
            setForm={setServiceForm}
            formatMoney={formatMoney}
          />

          <div className="cit-form-actions">
            <Button
              variant="light"
              onClick={() => setShowServiceForm(false)}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button onClick={handleAddService} disabled={saving}>
              {saving ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <FaPlus />
                  <span>Lưu dịch vụ</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* =================================================
          SERVICE HEADER
      ================================================= */}

      <div className="cit-section-header">
        <div>
          <h2>Dịch vụ trong tour</h2>

          <p>Chi tiết chi phí và tình trạng hóa đơn từng dịch vụ</p>
        </div>
      </div>

      {/* =================================================
          DESKTOP SERVICE
      ================================================= */}

      <div className="cit-service-table-wrap">
        <div className="table-responsive">
          <table className="cit-table">
            <thead>
              <tr>
                <th>Dịch vụ</th>
                <th>Nhà cung cấp</th>
                <th>Chi phí</th>
                <th>Cần lấy HĐ</th>
                <th>Đã lấy</th>
                <th>Còn thiếu</th>
                <th>Trạng thái</th>
                <th>Tác vụ</th>
              </tr>
            </thead>

            <tbody>
              {tour.services?.map((service) => {
                const status = getServiceStatus(service);

                return (
                  <React.Fragment key={service.service_id}>
                    <tr>
                      {/* SERVICE */}

                      <td>
                        <div className="cit-service-name">
                          {service.service_name || service.service_type}
                        </div>

                        <div className="cit-service-type">
                          {service.service_type}
                        </div>
                      </td>

                      {/* NCC */}

                      <td>{service.supplier_name || "---"}</td>

                      {/* CHI PHÍ */}

                      <td>{formatMoney(service.service_amount)}</td>

                      {/* CẦN LẤY */}

                      <td>{formatMoney(service.required_invoice_amount)}</td>

                      {/* ĐÃ LẤY */}

                      <td className="cit-money-success">
                        {formatMoney(service.invoiced_amount)}
                      </td>

                      {/* CÒN THIẾU */}

                      <td
                        className={
                          Number(service.missing_amount || 0) > 0
                            ? "cit-money-danger"
                            : "cit-money-success"
                        }
                      >
                        {formatMoney(service.missing_amount)}
                      </td>

                      {/* STATUS */}

                      <td>
                        <span className={`cit-status ${status.className}`}>
                          {status.icon}

                          {status.label}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td>
                        <div className="cit-service-actions">
                          <button
                            type="button"
                            className="cit-edit-service-btn"
                            onClick={() => handleOpenEditService(service)}
                            title="Sửa dịch vụ"
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="cit-delete-service-btn"
                            onClick={() => handleDeleteService(service)}
                            title="Xóa dịch vụ"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* EDIT SERVICE DESKTOP */}

                    {Number(editingServiceId) ===
                      Number(service.service_id) && (
                      <tr className="cit-edit-service-row">
                        <td colSpan="8">
                          <EditServiceForm
                            service={service}
                            form={serviceEditForm}
                            setForm={setServiceEditForm}
                            formatMoney={formatMoney}
                            saving={saving}
                            onCancel={() => setEditingServiceId(null)}
                            onSave={() =>
                              handleUpdateService(service.service_id)
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {!tour.services?.length && (
                <tr>
                  <td colSpan="8" className="cit-empty">
                    Tour chưa có dịch vụ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
          MOBILE SERVICE
      ================================================= */}

      <div className="cit-mobile-services">
        {tour.services?.map((service) => {
          const status = getServiceStatus(service);

          const isEditing =
            Number(editingServiceId) === Number(service.service_id);

          return (
            <div className="cit-mobile-service" key={service.service_id}>
              {/* HEADER */}

              <div className="cit-mobile-service-head">
                <div className="cit-mobile-service-info">
                  <h4>{service.service_name || service.service_type}</h4>

                  <p>{service.supplier_name || "Chưa có nhà cung cấp"}</p>
                </div>

                <span className={`cit-status ${status.className}`}>
                  {status.icon}

                  {status.label}
                </span>
              </div>

              {/* MONEY */}

              <div className="cit-mobile-service-grid">
                <MobileMoney
                  label="Chi phí"
                  value={formatMoney(service.service_amount)}
                />

                <MobileMoney
                  label="Cần HĐ"
                  value={formatMoney(service.required_invoice_amount)}
                />

                <MobileMoney
                  label="Đã lấy"
                  value={formatMoney(service.invoiced_amount)}
                  type="success"
                />

                <MobileMoney
                  label="Còn thiếu"
                  value={formatMoney(service.missing_amount)}
                  type={
                    Number(service.missing_amount || 0) > 0
                      ? "danger"
                      : "success"
                  }
                />
              </div>

              {/* ACTION */}

              <div className="cit-mobile-service-actions">
                <button
                  type="button"
                  className="cit-edit-service-btn"
                  onClick={() => handleOpenEditService(service)}
                  title="Sửa dịch vụ"
                >
                  <FaEdit />
                </button>

                <button
                  type="button"
                  className="cit-delete-service-btn"
                  onClick={() => handleDeleteService(service)}
                  title="Xóa dịch vụ"
                >
                  <FaTrash />
                </button>
              </div>

              {/* EDIT MOBILE */}

              {isEditing && (
                <EditServiceForm
                  service={service}
                  form={serviceEditForm}
                  setForm={setServiceEditForm}
                  formatMoney={formatMoney}
                  saving={saving}
                  onCancel={() => setEditingServiceId(null)}
                  onSave={() => handleUpdateService(service.service_id)}
                />
              )}
            </div>
          );
        })}

        {!tour.services?.length && (
          <div className="cit-mobile-empty">
            <BsReceipt size={38} />

            <h4>Chưa có dịch vụ</h4>

            <p>Thêm dịch vụ để bắt đầu quản lý tour.</p>

            <Button onClick={handleOpenServiceForm}>
              <FaPlus />
              Thêm dịch vụ
            </Button>
          </div>
        )}
      </div>

      {/* =================================================
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

// =====================================================
// SERVICE FORM FIELDS
// =====================================================

const ServiceFormFields = ({ form, setForm, formatMoney }) => {
  return (
    <div className="cit-form-grid">
      {/* TYPE */}

      <Form.Group>
        <Form.Label>Loại dịch vụ *</Form.Label>

        <Form.Select
          value={form.service_type}
          onChange={(e) =>
            setForm({
              ...form,
              service_type: e.target.value,
            })
          }
        >
          <option value="">-- Chọn dịch vụ --</option>

          <option value="HOTEL">Khách sạn</option>

          <option value="TRANSPORT">Xe vận chuyển</option>

          <option value="RESTAURANT">Nhà hàng</option>

          <option value="TICKET">Vé tham quan</option>

          <option value="GALA">Gala Dinner</option>

          <option value="TEAMBUILDING">Team Building</option>

          <option value="GUIDE">Hướng dẫn viên</option>

          <option value="OTHER">Dịch vụ khác</option>
        </Form.Select>
      </Form.Group>

      {/* NAME */}

      <Form.Group>
        <Form.Label>Tên dịch vụ *</Form.Label>

        <Form.Control
          value={form.service_name}
          onChange={(e) =>
            setForm({
              ...form,
              service_name: e.target.value,
            })
          }
          placeholder="VD: Ăn tối ngày 1"
        />
      </Form.Group>

      {/* SUPPLIER */}

      <Form.Group>
        <Form.Label>Nhà cung cấp</Form.Label>

        <Form.Control
          value={form.supplier_name}
          onChange={(e) =>
            setForm({
              ...form,
              supplier_name: e.target.value,
            })
          }
          placeholder="Tên nhà cung cấp"
        />
      </Form.Group>

      {/* SERVICE AMOUNT */}

      <Form.Group>
        <Form.Label>Chi phí</Form.Label>

        <Form.Control
          type="number"
          inputMode="numeric"
          value={form.service_amount}
          onChange={(e) =>
            setForm({
              ...form,
              service_amount: e.target.value,
            })
          }
        />

        {form.service_amount && (
          <Form.Text className="cit-money-preview">
            {formatMoney(form.service_amount)}
          </Form.Text>
        )}
      </Form.Group>

      {/* REQUIRED INVOICE */}

      <Form.Group>
        <Form.Label>Cần lấy hóa đơn</Form.Label>

        <Form.Control
          type="number"
          inputMode="numeric"
          value={form.required_invoice_amount}
          onChange={(e) =>
            setForm({
              ...form,

              required_invoice_amount: e.target.value,
            })
          }
        />

        {form.required_invoice_amount && (
          <Form.Text className="cit-money-preview">
            {formatMoney(form.required_invoice_amount)}
          </Form.Text>
        )}
      </Form.Group>

      {/* DESCRIPTION */}

      <Form.Group className="cit-full">
        <Form.Label>Mô tả</Form.Label>

        <Form.Control
          as="textarea"
          rows={2}
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
        />
      </Form.Group>

      {/* NOTE */}

      <Form.Group className="cit-full">
        <Form.Label>Ghi chú</Form.Label>

        <Form.Control
          as="textarea"
          rows={2}
          value={form.note}
          onChange={(e) =>
            setForm({
              ...form,
              note: e.target.value,
            })
          }
        />
      </Form.Group>
    </div>
  );
};

// =====================================================
// EDIT SERVICE FORM
// =====================================================

const EditServiceForm = ({
  service,
  form,
  setForm,
  formatMoney,
  saving,
  onCancel,
  onSave,
}) => {
  return (
    <div
      className="cit-edit-service-form"
      id={`cit-edit-service-${service.service_id}`}
    >
      <div className="cit-edit-service-header">
        <div>
          <strong>Điều chỉnh dịch vụ</strong>

          <span>{service.service_name || service.service_type}</span>
        </div>
      </div>

      <ServiceFormFields
        form={form}
        setForm={setForm}
        formatMoney={formatMoney}
      />

      <div className="cit-form-actions">
        <Button variant="light" onClick={onCancel} disabled={saving}>
          Hủy
        </Button>

        <Button onClick={onSave} disabled={saving}>
          {saving ? (
            <Spinner size="sm" />
          ) : (
            <>
              <FaSave />

              <span>Lưu thay đổi</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// =====================================================
// SUMMARY CARD
// =====================================================

const SummaryCard = ({ title, value, type = "" }) => {
  return (
    <div className={`cit-summary-card ${type}`}>
      <span>{title}</span>

      <strong>{value}</strong>
    </div>
  );
};

// =====================================================
// MOBILE MONEY
// =====================================================

const MobileMoney = ({ label, value, type = "" }) => {
  return (
    <div className="cit-mobile-money">
      <span>{label}</span>

      <strong className={type ? `cit-money-${type}` : ""}>{value}</strong>
    </div>
  );
};

export default CheckInvoiceTourDetail;
