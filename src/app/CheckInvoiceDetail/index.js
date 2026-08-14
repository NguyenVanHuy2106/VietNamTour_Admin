// src/pages/CheckInvoiceDetail.js

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { Button, Form, Spinner, Toast, ToastContainer } from "react-bootstrap";

import {
  BsArrowLeft,
  BsCalendar3,
  BsBuilding,
  BsReceipt,
} from "react-icons/bs";

import {
  FaPlus,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTrash,
  FaEdit,
} from "react-icons/fa";

import { MdOutlinePendingActions } from "react-icons/md";

import "./index.css";

const CheckInvoiceDetail = () => {
  const { tourId } = useParams();

  const navigate = useNavigate();

  // =====================================================
  // TOUR
  // =====================================================

  const [tour, setTour] = useState(null);

  const [loading, setLoading] = useState(false);

  // =====================================================
  // FORM THÊM DỊCH VỤ
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
  // FORM THÊM HÓA ĐƠN
  // =====================================================

  const [invoiceService, setInvoiceService] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: "",
    invoice_date: "",
    invoice_amount: "",
    supplier_name: "",
    note: "",
  });

  // =====================================================
  // TOAST
  // =====================================================

  const [toastOpen, setToastOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState("");

  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {
    getTourDetail();
  }, [tourId]);

  // =====================================================
  // GET TOUR
  // =====================================================

  const getTourDetail = async () => {
    try {
      setLoading(true);

      const response = await API.get(`/invoice-tours/${tourId}/summary`);

      setTour(response.data?.data || null);
    } catch (error) {
      console.error("getTourDetail error:", error);
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
  // TRẠNG THÁI DỊCH VỤ
  // =====================================================

  const getStatusInfo = (service) => {
    if (service.status === "COMPLETED") {
      return {
        label: "Đã đủ",
        className: "cid-status-success",
        icon: <FaCheckCircle />,
      };
    }

    if (service.status === "PARTIAL") {
      return {
        label: "Còn thiếu",
        className: "cid-status-warning",
        icon: <FaExclamationTriangle />,
      };
    }

    return {
      label: "Chưa có HĐ",
      className: "cid-status-danger",
      icon: <MdOutlinePendingActions />,
    };
  };

  // =====================================================
  // MỞ FORM THÊM DỊCH VỤ
  // =====================================================

  const handleOpenServiceForm = () => {
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // THÊM DỊCH VỤ
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
      setLoading(true);

      await APIToken.post(`/invoice-tours/${tourId}/services/add`, {
        ...serviceForm,

        service_amount: Number(serviceForm.service_amount || 0),

        required_invoice_amount: Number(
          serviceForm.required_invoice_amount || 0,
        ),
      });

      setToastMessage("Thêm dịch vụ thành công");

      setToastOpen(true);

      setShowServiceForm(false);

      await getTourDetail();
    } catch (error) {
      console.error("handleAddService error:", error);

      alert(error.response?.data?.message || "Không thể thêm dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // XÓA DỊCH VỤ
  // =====================================================

  const handleDeleteService = async (serviceId, serviceName) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa dịch vụ "${
        serviceName || ""
      }" không?\n\nCác hóa đơn thuộc dịch vụ này cũng có thể bị xóa.`,
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);

      await APIToken.delete(`/invoice-tour-services/${serviceId}`);

      // nếu đang mở form HĐ của service vừa xóa
      if (Number(invoiceService?.service_id) === Number(serviceId)) {
        setInvoiceService(null);
      }

      setToastMessage("Xóa dịch vụ thành công");

      setToastOpen(true);

      await getTourDetail();
    } catch (error) {
      console.error("handleDeleteService error:", error);

      alert(error.response?.data?.message || "Không thể xóa dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // MỞ / ĐÓNG FORM THÊM HÓA ĐƠN
  // =====================================================

  const handleOpenInvoiceForm = (service) => {
    // Nếu đang mở đúng dịch vụ đó
    // thì click + lần nữa sẽ đóng form

    if (Number(invoiceService?.service_id) === Number(service.service_id)) {
      setInvoiceService(null);

      return;
    }

    // Lưu service đang thêm hóa đơn

    setInvoiceService(service);

    // Reset form

    setInvoiceForm({
      invoice_number: "",
      invoice_date: "",
      invoice_amount: "",
      supplier_name: service.supplier_name || "",
      note: "",
    });

    // Scroll xuống form sau khi React render

    setTimeout(() => {
      const element = document.getElementById(
        `invoice-form-${service.service_id}`,
      );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 150);
  };

  // =====================================================
  // THÊM HÓA ĐƠN
  // =====================================================

  const handleAddInvoice = async () => {
    if (!invoiceService?.service_id) {
      return;
    }

    if (!invoiceForm.invoice_amount) {
      alert("Vui lòng nhập số tiền hóa đơn");

      return;
    }

    if (Number(invoiceForm.invoice_amount) <= 0) {
      alert("Số tiền hóa đơn phải lớn hơn 0");

      return;
    }

    try {
      setLoading(true);

      await APIToken.post(
        `/invoice-tour-services/${invoiceService.service_id}/invoices/add`,
        {
          invoice_number: invoiceForm.invoice_number,

          invoice_date: invoiceForm.invoice_date || null,

          invoice_amount: Number(invoiceForm.invoice_amount),

          supplier_name: invoiceForm.supplier_name,

          note: invoiceForm.note,
        },
      );

      setToastMessage("Thêm hóa đơn thành công");

      setToastOpen(true);

      // Đóng form

      setInvoiceService(null);

      // Reload dữ liệu để số tiền update

      await getTourDetail();
    } catch (error) {
      console.error("handleAddInvoice error:", error);

      alert(error.response?.data?.message || "Không thể thêm hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId, invoiceNumber) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa hóa đơn ${
        invoiceNumber ? `"${invoiceNumber}"` : `#${invoiceId}`
      } không?`,
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);

      await APIToken.delete(`/invoice-service-invoices/${invoiceId}`);

      setToastMessage("Xóa hóa đơn thành công");
      setToastOpen(true);

      // Load lại để tính lại:
      // Đã lấy / Còn thiếu / Trạng thái
      await getTourDetail();
    } catch (error) {
      console.error("handleDeleteInvoice error:", error);

      alert(error.response?.data?.message || "Không thể xóa hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading && !tour) {
    return (
      <div className="cid-loading">
        <Spinner animation="border" />

        <div>Đang tải thông tin tour...</div>
      </div>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (!tour) {
    return <div className="cid-not-found">Không tìm thấy tour</div>;
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="cid-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="cid-top">
        {/* NÚT QUAY LẠI */}

        <Button
          variant="light"
          className="cid-back"
          onClick={() => navigate("/check-invoices")}
        >
          <BsArrowLeft />
          <span>Danh sách tour</span>
        </Button>

        {/* ACTION BÊN PHẢI */}

        <div className="cid-top-actions">
          <Button
            className="cid-btn-add-service"
            onClick={handleOpenServiceForm}
          >
            <FaPlus />
            <span>Thêm dịch vụ</span>
          </Button>
        </div>
      </div>

      {/* =================================================
          TOUR INFORMATION
      ================================================= */}

      <div className="cid-tour-card">
        <div className="cid-tour-code">{tour.tour_code}</div>

        <h2>{tour.tour_name}</h2>

        <div className="cid-tour-meta">
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

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="cid-summary">
        <SummaryBox
          title="Xuất khách"
          value={formatMoney(tour.output_amount)}
        />

        <SummaryBox
          title="Cần lấy hóa đơn"
          value={formatMoney(tour.total_required_invoice)}
        />

        <SummaryBox
          title="Đã lấy"
          value={formatMoney(tour.total_invoice_received)}
          type="success"
        />

        <SummaryBox
          title="Còn thiếu"
          value={formatMoney(tour.total_missing_invoice)}
          type="danger"
        />
      </div>

      {/* =================================================
          FORM THÊM DỊCH VỤ
      ================================================= */}

      {showServiceForm && (
        <div className="cid-form-card">
          <div className="cid-form-header">
            <div>
              <h4>Thêm dịch vụ</h4>

              <p>Khai báo dịch vụ cần đối soát hóa đơn</p>
            </div>

            <button type="button" onClick={() => setShowServiceForm(false)}>
              ×
            </button>
          </div>

          <div className="cid-form-grid">
            {/* LOẠI DỊCH VỤ */}

            <Form.Group>
              <Form.Label>Loại dịch vụ *</Form.Label>

              <Form.Select
                value={serviceForm.service_type}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,

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

            {/* TÊN DỊCH VỤ */}

            <Form.Group>
              <Form.Label>Tên dịch vụ *</Form.Label>

              <Form.Control
                value={serviceForm.service_name}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,

                    service_name: e.target.value,
                  })
                }
                placeholder="VD: Khách sạn 2 đêm"
              />
            </Form.Group>

            {/* NCC */}

            <Form.Group>
              <Form.Label>Nhà cung cấp</Form.Label>

              <Form.Control
                value={serviceForm.supplier_name}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,

                    supplier_name: e.target.value,
                  })
                }
                placeholder="Tên nhà cung cấp"
              />
            </Form.Group>

            {/* CHI PHÍ */}

            <Form.Group>
              <Form.Label>Chi phí</Form.Label>

              <Form.Control
                type="number"
                inputMode="numeric"
                value={serviceForm.service_amount}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,

                    service_amount: e.target.value,
                  })
                }
                placeholder="0"
              />

              {serviceForm.service_amount && (
                <Form.Text>{formatMoney(serviceForm.service_amount)}</Form.Text>
              )}
            </Form.Group>

            {/* CẦN LẤY HĐ */}

            <Form.Group>
              <Form.Label>Cần lấy hóa đơn</Form.Label>

              <Form.Control
                type="number"
                inputMode="numeric"
                value={serviceForm.required_invoice_amount}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,

                    required_invoice_amount: e.target.value,
                  })
                }
                placeholder="0"
              />

              {serviceForm.required_invoice_amount && (
                <Form.Text>
                  {formatMoney(serviceForm.required_invoice_amount)}
                </Form.Text>
              )}
            </Form.Group>

            {/* DESCRIPTION */}

            <Form.Group className="cid-full">
              <Form.Label>Mô tả</Form.Label>

              <Form.Control
                as="textarea"
                rows={2}
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,

                    description: e.target.value,
                  })
                }
              />
            </Form.Group>

            {/* NOTE */}

            <Form.Group className="cid-full">
              <Form.Label>Ghi chú</Form.Label>

              <Form.Control
                as="textarea"
                rows={2}
                value={serviceForm.note}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,

                    note: e.target.value,
                  })
                }
              />
            </Form.Group>
          </div>

          <div className="cid-form-actions">
            <Button variant="light" onClick={() => setShowServiceForm(false)}>
              Hủy
            </Button>

            <Button onClick={handleAddService} disabled={loading}>
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <FaPlus /> Lưu dịch vụ
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* =================================================
          SERVICES HEADER
      ================================================= */}

      <div className="cid-section-header">
        <div>
          <h3>Dịch vụ tour</h3>

          <p>{tour.services?.length || 0} dịch vụ</p>
        </div>
      </div>

      {/* =================================================
          SERVICES
      ================================================= */}

      <div className="cid-services">
        {tour.services?.map((service) => {
          const status = getStatusInfo(service);

          const isInvoiceFormOpen =
            Number(invoiceService?.service_id) === Number(service.service_id);

          return (
            <div className="cid-service-card" key={service.service_id}>
              {/* =========================================
                  HEADER DỊCH VỤ
              ========================================= */}

              <div className="cid-service-head">
                <div className="cid-service-info">
                  <div className="cid-service-name">
                    {service.service_name || service.service_type}
                  </div>

                  <div className="cid-service-supplier">
                    {service.supplier_name || "Chưa có nhà cung cấp"}
                  </div>
                </div>

                <div className="cid-service-head-right">
                  {/* STATUS */}

                  <div className={`cid-status ${status.className}`}>
                    {status.icon}

                    <span>{status.label}</span>
                  </div>

                  {/* THÊM HÓA ĐƠN */}

                  <button
                    type="button"
                    className={`cid-btn-add-invoice-small ${
                      isInvoiceFormOpen ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      handleOpenInvoiceForm(service);
                    }}
                    title={isInvoiceFormOpen ? "Đóng" : "Thêm hóa đơn"}
                  >
                    <FaPlus />
                  </button>

                  {/* XÓA DỊCH VỤ */}

                  {/* <button
                    type="button"
                    className="cid-btn-delete-service"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      handleDeleteService(
                        service.service_id,
                        service.service_name,
                      );
                    }}
                    title="Xóa dịch vụ"
                  >
                    <FaTrash />
                  </button> */}
                </div>
              </div>

              {/* =========================================
                  MONEY
              ========================================= */}

              <div className="cid-service-summary">
                <ServiceMoney
                  label="Chi phí"
                  value={formatMoney(service.service_amount)}
                />

                <ServiceMoney
                  label="Cần lấy"
                  value={formatMoney(service.required_invoice_amount)}
                />

                <ServiceMoney
                  label="Đã lấy"
                  value={formatMoney(service.invoiced_amount)}
                  type="success"
                />

                <ServiceMoney
                  label="Còn thiếu"
                  value={formatMoney(service.missing_amount)}
                  type={
                    Number(service.missing_amount || 0) > 0
                      ? "danger"
                      : "success"
                  }
                />
              </div>

              {/* =========================================
                  DANH SÁCH HÓA ĐƠN ĐÃ NHẬN
              ========================================= */}

              {/* =========================================
    DANH SÁCH HÓA ĐƠN ĐÃ NHẬN
========================================= */}

              {service.invoices?.length > 0 && (
                <div className="cid-invoices">
                  <div className="cid-invoices-title">
                    <span>Hóa đơn đã nhận</span>

                    <span>{service.invoices.length} hóa đơn</span>
                  </div>

                  {service.invoices.map((invoice) => (
                    <div className="cid-invoice" key={invoice.invoice_id}>
                      {/* ICON */}

                      <div className="cid-invoice-icon">
                        <FaFileInvoiceDollar />
                      </div>

                      {/* THÔNG TIN */}

                      <div className="cid-invoice-info">
                        <strong>
                          {invoice.invoice_number
                            ? `HĐ ${invoice.invoice_number}`
                            : `Hóa đơn #${invoice.invoice_id}`}
                        </strong>

                        <div className="cid-invoice-meta">
                          {invoice.invoice_date && (
                            <span>{formatDate(invoice.invoice_date)}</span>
                          )}

                          {invoice.supplier_name && (
                            <span>{invoice.supplier_name}</span>
                          )}
                        </div>
                      </div>

                      {/* SỐ TIỀN */}

                      <div className="cid-invoice-value">
                        {formatMoney(invoice.invoice_amount)}
                      </div>

                      {/* XÓA */}

                      {/* <button
                        type="button"
                        className="cid-btn-delete-invoice"
                        title="Xóa hóa đơn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          handleDeleteInvoice(
                            invoice.invoice_id,
                            invoice.invoice_number,
                          );
                        }}
                      >
                        <FaTrash />
                      </button> */}
                    </div>
                  ))}
                </div>
              )}

              {/* =========================================
                  FORM THÊM HÓA ĐƠN INLINE
              ========================================= */}

              {isInvoiceFormOpen && (
                <div
                  className="cid-inline-invoice-form"
                  id={`invoice-form-${service.service_id}`}
                >
                  {/* HEADER FORM */}

                  <div className="cid-inline-title">
                    <div>
                      <strong>Thêm hóa đơn</strong>

                      <span>
                        {service.service_name || service.service_type}
                      </span>
                    </div>

                    <div className="cid-inline-missing">
                      <span>Còn cần lấy</span>

                      <strong>{formatMoney(service.missing_amount)}</strong>
                    </div>
                  </div>

                  {/* FORM */}

                  <div className="cid-invoice-form-grid">
                    {/* SỐ HÓA ĐƠN */}

                    <Form.Group>
                      <Form.Label>Số hóa đơn</Form.Label>

                      <Form.Control
                        value={invoiceForm.invoice_number}
                        onChange={(e) =>
                          setInvoiceForm({
                            ...invoiceForm,

                            invoice_number: e.target.value,
                          })
                        }
                        placeholder="VD: 00001234"
                      />
                    </Form.Group>

                    {/* NGÀY HÓA ĐƠN */}

                    <Form.Group>
                      <Form.Label>Ngày hóa đơn</Form.Label>

                      <Form.Control
                        type="date"
                        value={invoiceForm.invoice_date}
                        onChange={(e) =>
                          setInvoiceForm({
                            ...invoiceForm,

                            invoice_date: e.target.value,
                          })
                        }
                      />
                    </Form.Group>

                    {/* SỐ TIỀN */}

                    <Form.Group>
                      <Form.Label>Số tiền hóa đơn *</Form.Label>

                      <Form.Control
                        type="number"
                        inputMode="numeric"
                        value={invoiceForm.invoice_amount}
                        onChange={(e) =>
                          setInvoiceForm({
                            ...invoiceForm,

                            invoice_amount: e.target.value,
                          })
                        }
                        placeholder="Nhập số tiền"
                      />

                      {invoiceForm.invoice_amount && (
                        <Form.Text className="cid-money-preview">
                          {formatMoney(invoiceForm.invoice_amount)}
                        </Form.Text>
                      )}
                    </Form.Group>

                    {/* NCC */}

                    <Form.Group>
                      <Form.Label>Nhà cung cấp</Form.Label>

                      <Form.Control
                        value={invoiceForm.supplier_name}
                        onChange={(e) =>
                          setInvoiceForm({
                            ...invoiceForm,

                            supplier_name: e.target.value,
                          })
                        }
                        placeholder="Nhà cung cấp"
                      />
                    </Form.Group>

                    {/* GHI CHÚ */}

                    <Form.Group className="cid-full">
                      <Form.Label>Ghi chú</Form.Label>

                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={invoiceForm.note}
                        onChange={(e) =>
                          setInvoiceForm({
                            ...invoiceForm,

                            note: e.target.value,
                          })
                        }
                        placeholder="Ghi chú nếu có..."
                      />
                    </Form.Group>
                  </div>

                  {/* ACTIONS */}

                  <div className="cid-inline-actions">
                    <Button
                      variant="light"
                      onClick={() => setInvoiceService(null)}
                      disabled={loading}
                    >
                      Hủy
                    </Button>

                    <Button onClick={handleAddInvoice} disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner size="sm" className="me-1" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <FaFileInvoiceDollar />

                          <span>Lưu hóa đơn</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* =================================================
            EMPTY SERVICE
        ================================================= */}

        {!tour.services?.length && (
          <div className="cid-empty">
            <BsReceipt size={45} />

            <h4>Tour chưa có dịch vụ</h4>

            <p>Thêm khách sạn, xe, nhà hàng... để bắt đầu đối soát.</p>

            <Button onClick={handleOpenServiceForm}>
              <FaPlus />

              <span>Thêm dịch vụ đầu tiên</span>
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
// SUMMARY BOX
// =====================================================

const SummaryBox = ({ title, value, type = "" }) => {
  return (
    <div className={`cid-summary-box ${type}`}>
      <div className="cid-summary-label">{title}</div>

      <div className="cid-summary-value">{value}</div>
    </div>
  );
};

// =====================================================
// SERVICE MONEY
// =====================================================

const ServiceMoney = ({ label, value, type = "" }) => {
  return (
    <div className="cid-service-money">
      <div>{label}</div>

      <strong className={type}>{value}</strong>
    </div>
  );
};

export default CheckInvoiceDetail;
