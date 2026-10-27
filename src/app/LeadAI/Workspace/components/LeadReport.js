import React, { useEffect, useMemo, useState } from "react";

import { Button, Spinner } from "react-bootstrap";

import {
  FaBuilding,
  FaCalendarAlt,
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaSyncAlt,
  FaUserTie,
} from "react-icons/fa";

import APIToken from "../../../../config/APIToken";

// ==========================================================
// STATUS INFO
// ==========================================================

const getStatusInfo = (status) => {
  const map = {
    ASSIGNED: {
      label: "Mới nhận",
      className: "report-status-assigned",
    },

    CONTACTING: {
      label: "Đang liên hệ",
      className: "report-status-contacting",
    },

    INTERESTED: {
      label: "Quan tâm",
      className: "report-status-interested",
    },

    FOLLOW_UP: {
      label: "Cần chăm sóc lại",
      className: "report-status-followup",
    },

    NOT_INTERESTED: {
      label: "Không quan tâm",
      className: "report-status-not-interested",
    },

    CONVERTED: {
      label: "Đã chuyển đổi",
      className: "report-status-converted",
    },
  };

  return (
    map[status] || {
      label: status || "-",
      className: "report-status-default",
    }
  );
};

// ==========================================================
// FORMAT DATE
// ==========================================================

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
};

// ==========================================================
// COMPONENT
// ==========================================================

const Report = () => {
  // ========================================================
  // STATE
  // ========================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [report, setReport] = useState({
    summary: {
      total: 0,
      assigned: 0,
      contacting: 0,
      interested: 0,
      follow_up: 0,
      not_interested: 0,
      converted: 0,
    },

    performance: {
      conversion_rate: 0,
      overdue_follow_up: 0,
      upcoming_follow_up: 0,
    },

    upcoming: [],
  });

  // ========================================================
  // FETCH REPORT
  // ========================================================

  const fetchReport = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await APIToken.get("/lead-ai/my-companies/report");

      const data = response?.data?.data || {};

      setReport({
        summary: {
          total: Number(data?.summary?.total || 0),

          assigned: Number(data?.summary?.assigned || 0),

          contacting: Number(data?.summary?.contacting || 0),

          interested: Number(data?.summary?.interested || 0),

          follow_up: Number(data?.summary?.follow_up || 0),

          not_interested: Number(data?.summary?.not_interested || 0),

          converted: Number(data?.summary?.converted || 0),
        },

        performance: {
          conversion_rate: Number(data?.performance?.conversion_rate || 0),

          overdue_follow_up: Number(data?.performance?.overdue_follow_up || 0),

          upcoming_follow_up: Number(
            data?.performance?.upcoming_follow_up || 0,
          ),
        },

        upcoming: Array.isArray(data?.upcoming) ? data.upcoming : [],
      });
    } catch (error) {
      console.error("fetch report error:", error);

      alert(error?.response?.data?.message || "Không thể tải báo cáo Lead AI.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ========================================================
  // LOAD
  // ========================================================

  useEffect(() => {
    fetchReport();
  }, []);

  // ========================================================
  // SHORTCUT
  // ========================================================

  const summary = report.summary;

  const performance = report.performance;

  const upcoming = report.upcoming;

  // ========================================================
  // STATUS ROWS
  // ========================================================

  const statusRows = useMemo(
    () => [
      {
        label: "Mới nhận",
        value: summary.assigned,
        className: "assigned",
      },

      {
        label: "Đang liên hệ",
        value: summary.contacting,
        className: "contacting",
      },

      {
        label: "Quan tâm",
        value: summary.interested,
        className: "interested",
      },

      {
        label: "Cần chăm sóc lại",
        value: summary.follow_up,
        className: "followup",
      },

      {
        label: "Không quan tâm",
        value: summary.not_interested,
        className: "not-interested",
      },

      {
        label: "Đã chuyển đổi",
        value: summary.converted,
        className: "converted",
      },
    ],
    [summary],
  );

  // ========================================================
  // MAX
  // ========================================================

  const maxStatusValue = Math.max(
    ...statusRows.map((item) => Number(item.value || 0)),
    1,
  );

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="lead-report-loading">
        <Spinner animation="border" />

        <span>Đang tổng hợp báo cáo...</span>
      </div>
    );
  }

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="lead-report">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="lead-report-heading">
        <div>
          <h3>
            <FaChartBar />
            Báo cáo Lead AI
          </h3>

          <p>Tổng quan tình trạng và hiệu quả chăm sóc khách hàng của bạn.</p>
        </div>

        <Button
          className="lead-report-refresh-btn"
          disabled={refreshing}
          onClick={() => fetchReport(true)}
        >
          {refreshing ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <FaSyncAlt />
          )}
          Làm mới
        </Button>
      </div>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="lead-report-summary">
        <ReportCard
          icon={<FaBuilding />}
          label="Tổng công ty"
          value={summary.total}
        />

        <ReportCard
          icon={<FaPhoneAlt />}
          label="Đang liên hệ"
          value={summary.contacting}
          type="contacting"
        />

        <ReportCard
          icon={<FaUserTie />}
          label="Quan tâm"
          value={summary.interested}
          type="interested"
        />

        <ReportCard
          icon={<FaCheckCircle />}
          label="Đã chuyển đổi"
          value={summary.converted}
          type="converted"
        />
      </div>

      {/* ==================================================
          MAIN GRID
      ================================================== */}

      <div className="lead-report-main-grid">
        {/* ================================================
            STATUS
        ================================================ */}

        <div className="lead-report-card">
          <div className="lead-report-card-title">
            <div>
              <strong>Tình trạng Lead</strong>

              <span>Phân bổ công ty theo trạng thái hiện tại</span>
            </div>
          </div>

          <div className="lead-report-status-list">
            {statusRows.map((item) => {
              const width =
                item.value === 0
                  ? 0
                  : Math.max(
                      5,
                      Math.round((item.value / maxStatusValue) * 100),
                    );

              return (
                <div className="lead-report-status-row" key={item.label}>
                  <div className="lead-report-status-info">
                    <span>{item.label}</span>

                    <strong>{item.value}</strong>
                  </div>

                  <div className="lead-report-status-track">
                    <div
                      className={`lead-report-status-bar status-${item.className}`}
                      style={{
                        width: `${width}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================
            PERFORMANCE
        ================================================ */}

        <div className="lead-report-card">
          <div className="lead-report-card-title">
            <div>
              <strong>Hiệu quả chăm sóc</strong>

              <span>Các chỉ số cần chú ý</span>
            </div>
          </div>

          <div className="lead-report-performance">
            <PerformanceItem
              icon={<FaCheckCircle />}
              label="Tỷ lệ chuyển đổi"
              value={`${performance.conversion_rate}%`}
              type="success"
            />

            <PerformanceItem
              icon={<FaExclamationTriangle />}
              label="Follow-up quá hạn"
              value={performance.overdue_follow_up}
              type="danger"
            />

            <PerformanceItem
              icon={<FaCalendarAlt />}
              label="Follow-up 7 ngày tới"
              value={performance.upcoming_follow_up}
              type="primary"
            />
          </div>
        </div>
      </div>

      {/* ==================================================
          UPCOMING
      ================================================== */}

      <div className="lead-report-card lead-report-upcoming">
        <div className="lead-report-card-title">
          <div>
            <strong>Lịch chăm sóc sắp tới</strong>

            <span>10 công ty có lịch follow-up gần nhất</span>
          </div>

          <FaClock />
        </div>

        {upcoming.length === 0 ? (
          <div className="lead-report-empty">
            <FaCalendarAlt />

            <strong>Chưa có lịch chăm sóc</strong>

            <span>Các công ty có ngày follow-up sẽ xuất hiện tại đây.</span>
          </div>
        ) : (
          <div className="lead-report-upcoming-list">
            {upcoming.map((company) => {
              const statusInfo = getStatusInfo(company.lead_status);

              return (
                <div className="lead-report-upcoming-item" key={company.id}>
                  <div className="lead-report-upcoming-company">
                    <div className="lead-report-company-icon">
                      <FaBuilding />
                    </div>

                    <div>
                      <strong>{company.name || "-"}</strong>

                      <span>
                        <FaMapMarkerAlt />

                        {company.formatted_address || "Chưa có địa chỉ"}
                      </span>
                    </div>
                  </div>

                  <div className="lead-report-upcoming-contact">
                    <span>Người liên hệ</span>

                    <strong>{company.contact_person || "Chưa cập nhật"}</strong>

                    {company.contact_phone && (
                      <small>{company.contact_phone}</small>
                    )}
                  </div>

                  <div className="lead-report-upcoming-date">
                    <span>Follow-up</span>

                    <strong>{formatDateTime(company.next_follow_up_at)}</strong>
                  </div>

                  <div>
                    <span
                      className={`lead-report-status ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================================
// REPORT CARD
// ==========================================================

const ReportCard = ({ icon, label, value, type = "" }) => {
  return (
    <div
      className={`lead-report-summary-card ${
        type ? `report-summary-${type}` : ""
      }`}
    >
      <div className="lead-report-summary-icon">{icon}</div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </div>
  );
};

// ==========================================================
// PERFORMANCE ITEM
// ==========================================================

const PerformanceItem = ({ icon, label, value, type }) => {
  return (
    <div className={`lead-report-performance-item performance-${type}`}>
      <div className="lead-report-performance-icon">{icon}</div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </div>
  );
};

export default Report;
