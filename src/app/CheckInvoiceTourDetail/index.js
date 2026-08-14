// src/pages/CheckInvoiceTourDetail.js

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { Button, Spinner } from "react-bootstrap";

import {
  BsArrowLeft,
  BsBuilding,
  BsCalendar3,
  BsReceipt,
  BsArrowRight,
} from "react-icons/bs";

import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";

import "./index.css";

const CheckInvoiceTourDetail = () => {
  const { tourId } = useParams();
  const navigate = useNavigate();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(false);

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

  if (loading) {
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
        >
          <BsArrowLeft />

          <span>Danh sách tour</span>
        </Button>

        <Button onClick={() => navigate(`/check-invoice/${tour.tour_id}`)}>
          <BsReceipt />

          <span>Đối soát hóa đơn</span>
        </Button>
      </div>

      {/* =================================================
          TOUR HEADER
      ================================================= */}

      <div className="cit-tour-header">
        <div>
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
          SERVICE HEADER
      ================================================= */}

      <div className="cit-section-header">
        <div>
          <h2>Dịch vụ trong tour</h2>

          <p>Chi tiết chi phí và tình trạng hóa đơn từng dịch vụ</p>
        </div>
      </div>

      {/* =================================================
          DESKTOP TABLE
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

                <th></th>
              </tr>
            </thead>

            <tbody>
              {tour.services?.map((service) => {
                const status = getServiceStatus(service);

                return (
                  <tr key={service.service_id}>
                    {/* DỊCH VỤ */}

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

                    {/* DETAIL */}
                  </tr>
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
          MOBILE SERVICES
      ================================================= */}

      <div className="cit-mobile-services">
        {tour.services?.map((service) => {
          const status = getServiceStatus(service);

          return (
            <div className="cit-mobile-service" key={service.service_id}>
              {/* HEADER */}

              <div className="cit-mobile-service-head">
                <div>
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

              {/* BUTTON */}
            </div>
          );
        })}
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
