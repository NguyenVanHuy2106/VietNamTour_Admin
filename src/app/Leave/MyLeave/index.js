import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";

import {
  FaCalendarAlt,
  FaCalendarCheck,
  FaCheckCircle,
  FaClock,
  FaHourglassHalf,
  FaPlus,
  FaSyncAlt,
  FaTimesCircle,
  FaUser,
  FaUserCheck,
  FaUmbrellaBeach,
} from "react-icons/fa";

import APIToken from "../../../config/APIToken";

import "./index.css";

// ==========================================================
// CONFIG
// ==========================================================

const DEFAULT_APPROVER = {
  user_id: 1001,
  name: "Nguyễn Văn Huy",
  position: "Phó Giám đốc",
};

const SYSTEM_YEAR = new Date().getFullYear();

// ==========================================================
// FORMAT NGÀY
// ==========================================================

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
};

// ==========================================================
// FORMAT NGÀY PHÉP
// ==========================================================

const formatLeaveDay = (value) => {
  const number = Number(value || 0);

  if (Number.isInteger(number)) {
    return number;
  }

  return number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

// ==========================================================
// STATUS
// ==========================================================

const getStatusInfo = (status) => {
  const map = {
    PENDING: {
      label: "Chờ duyệt",
      className: "my-leave-status-pending",
      icon: <FaHourglassHalf />,
    },

    APPROVED: {
      label: "Đã duyệt",
      className: "my-leave-status-approved",
      icon: <FaCheckCircle />,
    },

    REJECTED: {
      label: "Từ chối",
      className: "my-leave-status-rejected",
      icon: <FaTimesCircle />,
    },

    CANCELLED: {
      label: "Đã hủy",
      className: "my-leave-status-cancelled",
      icon: <FaTimesCircle />,
    },
  };

  return (
    map[status] || {
      label: status || "-",
      className: "my-leave-status-default",
      icon: null,
    }
  );
};

// ==========================================================
// TÍNH SỐ NGÀY LÀM VIỆC DỰ KIẾN
// Thứ 2 -> Thứ 6
// Backend vẫn là nơi tính chính thức
// ==========================================================

const countWeekdays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return 0;
  }

  let total = 0;

  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();

    if (day !== 0 && day !== 6) {
      total += 1;
    }

    current.setDate(current.getDate() + 1);
  }

  return total;
};

// ==========================================================
// COMPONENT
// ==========================================================

const MyLeave = () => {
  // ========================================================
  // USER ID ĐANG ĐĂNG NHẬP
  // ========================================================

  const userId = Number(localStorage.getItem("userId"));

  // ========================================================
  // STATE
  // ========================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [cancelLoadingId, setCancelLoadingId] = useState(null);

  const [year, setYear] = useState(SYSTEM_YEAR);

  const [balance, setBalance] = useState({
    accrued_days: 0,
    used_days: 0,
    pending_days: 0,
    remaining_days: 0,
    requestable_days: 0,
  });

  const [requests, setRequests] = useState([]);

  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  });

  // ========================================================
  // LOAD DATA
  // ========================================================

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchData();
  }, [userId, year]);

  // ========================================================
  // FETCH DATA
  // ========================================================

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [balanceRes, requestsRes] = await Promise.all([
        APIToken.get("/my-balance", {
          params: {
            year,
          },
        }),

        APIToken.get("/my-requests"),
      ]);

      const balanceData = balanceRes?.data?.data || {};

      setBalance({
        accrued_days: Number(balanceData?.accrued_days || 0),
        used_days: Number(balanceData?.used_days || 0),
        pending_days: Number(balanceData?.pending_days || 0),
        remaining_days: Number(balanceData?.remaining_days || 0),
        requestable_days: Number(balanceData?.requestable_days || 0),
      });

      setRequests(requestsRes?.data?.data || []);
    } catch (error) {
      console.error("fetch leave data error:", error);

      alert(
        error?.response?.data?.message || "Không thể tải dữ liệu phép năm.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ========================================================
  // DANH SÁCH THEO NĂM
  // ========================================================

  const displayRequests = useMemo(() => {
    return requests.filter((item) => {
      if (!item?.start_date) return false;

      const requestYear = new Date(`${item.start_date}T00:00:00`).getFullYear();

      return requestYear === year;
    });
  }, [requests, year]);

  // ========================================================
  // THỐNG KÊ PHIẾU
  // ========================================================

  const requestStats = useMemo(() => {
    return displayRequests.reduce(
      (result, item) => {
        if (item.status === "PENDING") {
          result.pending += 1;
        }

        if (item.status === "APPROVED") {
          result.approved += 1;
        }

        if (item.status === "REJECTED") {
          result.rejected += 1;
        }

        return result;
      },
      {
        pending: 0,
        approved: 0,
        rejected: 0,
      },
    );
  }, [displayRequests]);

  // ========================================================
  // SỐ NGÀY DỰ KIẾN TRÊN FORM
  // ========================================================

  const estimatedDays = useMemo(() => {
    return countWeekdays(form.start_date, form.end_date);
  }, [form.start_date, form.end_date]);

  // ========================================================
  // OPEN CREATE
  // ========================================================

  const handleOpenCreate = () => {
    setForm({
      start_date: "",
      end_date: "",
      reason: "",
    });

    setShowCreate(true);
  };

  // ========================================================
  // CLOSE CREATE
  // ========================================================

  const handleCloseCreate = () => {
    if (submitting) return;

    setShowCreate(false);

    setForm({
      start_date: "",
      end_date: "",
      reason: "",
    });
  };

  // ========================================================
  // CREATE REQUEST
  // ========================================================

  const handleCreateRequest = async () => {
    if (!form.start_date) {
      alert("Vui lòng chọn ngày bắt đầu nghỉ.");
      return;
    }

    if (!form.end_date) {
      alert("Vui lòng chọn ngày kết thúc nghỉ.");
      return;
    }

    const startDate = new Date(`${form.start_date}T00:00:00`);
    const endDate = new Date(`${form.end_date}T00:00:00`);

    if (startDate > endDate) {
      alert("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
      return;
    }

    if (estimatedDays <= 0) {
      alert("Khoảng thời gian đăng ký không có ngày làm việc.");
      return;
    }

    if (estimatedDays > Number(balance?.requestable_days || 0)) {
      alert(
        `Bạn hiện chỉ có thể đăng ký tối đa ${formatLeaveDay(
          balance?.requestable_days,
        )} ngày phép.`,
      );

      return;
    }

    try {
      setSubmitting(true);

      await APIToken.post("/request", {
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason?.trim() || null,

        // Người duyệt mặc định được thiết lập tại FE
        approver_user_id: DEFAULT_APPROVER.user_id,
      });

      setShowCreate(false);

      setForm({
        start_date: "",
        end_date: "",
        reason: "",
      });

      alert("Đã gửi phiếu đăng ký nghỉ phép.");

      await fetchData(true);
    } catch (error) {
      console.error("create leave request error:", error);

      alert(error?.response?.data?.message || "Không thể tạo phiếu nghỉ phép.");
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================================
  // CANCEL REQUEST
  // ========================================================

  const handleCancel = async (item) => {
    if (!item?.leave_request_id) return;

    const confirmCancel = window.confirm(
      `Bạn có chắc muốn hủy phiếu nghỉ từ ${formatDate(
        item.start_date,
      )} đến ${formatDate(item.end_date)} không?`,
    );

    if (!confirmCancel) return;

    try {
      setCancelLoadingId(item.leave_request_id);

      await APIToken.put(`/request/${item.leave_request_id}/cancel`);

      alert("Đã hủy phiếu nghỉ phép.");

      await fetchData(true);
    } catch (error) {
      console.error("cancel leave request error:", error);

      alert(error?.response?.data?.message || "Không thể hủy phiếu nghỉ phép.");
    } finally {
      setCancelLoadingId(null);
    }
  };

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="my-leave-loading">
        <Spinner animation="border" />

        <div>Đang tải dữ liệu phép năm...</div>
      </div>
    );
  }

  // ========================================================
  // USER ID NOT FOUND
  // ========================================================

  if (!userId) {
    return (
      <div className="my-leave-page">
        <div className="my-leave-empty">
          <FaUser />

          <h4>Không xác định được tài khoản đăng nhập</h4>

          <p>Vui lòng đăng nhập lại để xem phép năm.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-leave-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="my-leave-header">
        <div>
          <div className="my-leave-eyebrow">VIỆT NAM TOUR</div>

          <h2>
            <FaUmbrellaBeach />
            Phép năm của tôi
          </h2>

          <p>Theo dõi quỹ phép, lịch sử nghỉ và gửi đăng ký nghỉ phép.</p>
        </div>

        <div className="my-leave-header-actions">
          <Button
            className="my-leave-refresh-btn"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <FaSyncAlt />
            )}
            Làm mới
          </Button>

          <Button className="my-leave-create-btn" onClick={handleOpenCreate}>
            <FaPlus />
            Đăng ký nghỉ phép
          </Button>
        </div>
      </div>

      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <div className="my-leave-toolbar">
        <div>
          <span>Năm phép</span>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            <option value={SYSTEM_YEAR - 1}>{SYSTEM_YEAR - 1}</option>

            <option value={SYSTEM_YEAR}>{SYSTEM_YEAR}</option>

            <option value={SYSTEM_YEAR + 1}>{SYSTEM_YEAR + 1}</option>
          </select>
        </div>
      </div>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="my-leave-summary">
        <SummaryCard
          icon={<FaCalendarAlt />}
          label="Đã tích lũy"
          value={formatLeaveDay(balance?.accrued_days)}
          unit="ngày"
        />

        <SummaryCard
          icon={<FaCheckCircle />}
          label="Đã sử dụng"
          value={formatLeaveDay(balance?.used_days)}
          unit="ngày"
        />

        <SummaryCard
          icon={<FaHourglassHalf />}
          label="Đang chờ duyệt"
          value={formatLeaveDay(balance?.pending_days)}
          unit="ngày"
        />

        <SummaryCard
          icon={<FaCalendarCheck />}
          label="Có thể đăng ký"
          value={formatLeaveDay(balance?.requestable_days)}
          unit="ngày"
          highlight
        />
      </div>

      {/* ==================================================
          REQUEST STATS
      ================================================== */}

      <div className="my-leave-request-stats">
        <div>
          <span>Tổng phiếu năm {year}</span>

          <strong>{displayRequests.length}</strong>
        </div>

        <div>
          <span>Chờ duyệt</span>

          <strong className="stat-pending">{requestStats.pending}</strong>
        </div>

        <div>
          <span>Đã duyệt</span>

          <strong className="stat-approved">{requestStats.approved}</strong>
        </div>

        <div>
          <span>Từ chối</span>

          <strong className="stat-rejected">{requestStats.rejected}</strong>
        </div>
      </div>

      {/* ==================================================
          LIST
      ================================================== */}

      <div className="my-leave-content-card">
        <div className="my-leave-section-title">
          <div>
            <h4>Lịch sử đăng ký nghỉ phép</h4>

            <p>Danh sách các phiếu nghỉ phép của bạn trong năm {year}.</p>
          </div>
        </div>

        {displayRequests.length === 0 ? (
          <div className="my-leave-empty">
            <FaCalendarAlt />

            <h4>Chưa có phiếu nghỉ phép</h4>

            <p>Bạn chưa có đăng ký nghỉ phép nào trong năm {year}.</p>
          </div>
        ) : (
          <>
            {/* ============================================
                DESKTOP TABLE
            ============================================ */}

            <div className="my-leave-table-wrapper">
              <table className="my-leave-table">
                <thead>
                  <tr>
                    <th>Mã phiếu</th>

                    <th>Thời gian nghỉ</th>

                    <th className="text-center">Số ngày</th>

                    <th>Lý do</th>

                    <th>Người duyệt</th>

                    <th className="text-center">Trạng thái</th>

                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {displayRequests.map((item) => {
                    const status = getStatusInfo(item.status);

                    const isCancelling =
                      cancelLoadingId === item.leave_request_id;

                    return (
                      <tr key={item.leave_request_id}>
                        <td>
                          <div className="my-leave-request-code">
                            #{item.leave_request_id}
                          </div>
                        </td>

                        <td>
                          <div className="my-leave-period">
                            <FaCalendarAlt />

                            <span>{formatDate(item.start_date)}</span>

                            <span className="my-leave-period-arrow">→</span>

                            <span>{formatDate(item.end_date)}</span>
                          </div>
                        </td>

                        <td className="text-center">
                          <strong className="my-leave-days-value">
                            {formatLeaveDay(item.total_days)}
                          </strong>
                        </td>

                        <td>
                          <div className="my-leave-reason">
                            {item.reason || "-"}
                          </div>
                        </td>

                        <td>
                          <div className="my-leave-approver">
                            <strong>
                              {item.approver_name || DEFAULT_APPROVER.name}
                            </strong>

                            <span>
                              {item.approver_position ||
                                DEFAULT_APPROVER.position}
                            </span>
                          </div>
                        </td>

                        <td className="text-center">
                          <span
                            className={`my-leave-status ${status.className}`}
                          >
                            {status.icon}

                            {status.label}
                          </span>

                          {item.status === "REJECTED" && item.reject_reason && (
                            <div className="my-leave-reject-note">
                              {item.reject_reason}
                            </div>
                          )}
                        </td>

                        <td className="text-center">
                          {item.status === "PENDING" ? (
                            <Button
                              className="my-leave-cancel-btn"
                              disabled={isCancelling}
                              onClick={() => handleCancel(item)}
                            >
                              {isCancelling ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <FaTimesCircle />
                              )}
                              Hủy phiếu
                            </Button>
                          ) : (
                            <span className="my-leave-no-action">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ============================================
                MOBILE LIST
            ============================================ */}

            <div className="my-leave-mobile-list">
              {displayRequests.map((item) => {
                const status = getStatusInfo(item.status);

                const isCancelling = cancelLoadingId === item.leave_request_id;

                return (
                  <div
                    className="my-leave-mobile-card"
                    key={item.leave_request_id}
                  >
                    <div className="my-leave-mobile-top">
                      <div>
                        <span>Mã phiếu</span>

                        <h5>#{item.leave_request_id}</h5>
                      </div>

                      <span className={`my-leave-status ${status.className}`}>
                        {status.icon}

                        {status.label}
                      </span>
                    </div>

                    <div className="my-leave-mobile-period">
                      <FaCalendarAlt />

                      <span>{formatDate(item.start_date)}</span>

                      <span>→</span>

                      <span>{formatDate(item.end_date)}</span>
                    </div>

                    <div className="my-leave-mobile-grid">
                      <div>
                        <span>Số ngày nghỉ</span>

                        <strong>{formatLeaveDay(item.total_days)} ngày</strong>
                      </div>

                      <div>
                        <span>Người duyệt</span>

                        <strong>
                          {item.approver_name || DEFAULT_APPROVER.name}
                        </strong>
                      </div>
                    </div>

                    <div className="my-leave-mobile-reason">
                      <span>Lý do</span>

                      <strong>{item.reason || "-"}</strong>
                    </div>

                    {item.status === "REJECTED" && item.reject_reason && (
                      <div className="my-leave-mobile-reject">
                        <span>Lý do từ chối</span>

                        <strong>{item.reject_reason}</strong>
                      </div>
                    )}

                    {item.status === "PENDING" && (
                      <Button
                        className="my-leave-mobile-cancel-btn"
                        disabled={isCancelling}
                        onClick={() => handleCancel(item)}
                      >
                        {isCancelling ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <FaTimesCircle />
                        )}
                        Hủy phiếu
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ==================================================
          CREATE REQUEST MODAL
      ================================================== */}

      <Modal
        show={showCreate}
        onHide={handleCloseCreate}
        centered
        dialogClassName="my-leave-create-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCalendarCheck />
            Đăng ký nghỉ phép
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* ==============================================
              APPROVER
          ============================================== */}

          <div className="my-leave-form-group">
            <label>Người duyệt</label>

            <div className="my-leave-approver-card">
              <div className="my-leave-approver-avatar">
                <FaUserCheck />
              </div>

              <div className="my-leave-approver-info">
                <strong>{DEFAULT_APPROVER.name}</strong>

                <span>{DEFAULT_APPROVER.position}</span>

                <small>Mã nhân viên: {DEFAULT_APPROVER.user_id}</small>
              </div>

              <div className="my-leave-default-badge">Mặc định</div>
            </div>
          </div>

          {/* ==============================================
              DATES
          ============================================== */}

          <div className="my-leave-form-row">
            <div className="my-leave-form-group">
              <label>
                Từ ngày <span>*</span>
              </label>

              <input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    start_date: e.target.value,

                    end_date:
                      prev.end_date && e.target.value > prev.end_date
                        ? ""
                        : prev.end_date,
                  }))
                }
              />
            </div>

            <div className="my-leave-form-group">
              <label>
                Đến ngày <span>*</span>
              </label>

              <input
                type="date"
                min={form.start_date || undefined}
                value={form.end_date}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* ==============================================
              ESTIMATE
          ============================================== */}

          {form.start_date && form.end_date && (
            <div className="my-leave-estimate-box">
              <FaClock />

              <div>
                <span>Số ngày nghỉ dự kiến</span>

                <strong>{formatLeaveDay(estimatedDays)} ngày</strong>

                <small>
                  Tạm tính từ Thứ 2 đến Thứ 6. Số ngày chính thức do hệ thống
                  xác định khi gửi phiếu.
                </small>
              </div>
            </div>
          )}

          {/* ==============================================
              REASON
          ============================================== */}

          <div className="my-leave-form-group">
            <label>Lý do nghỉ</label>

            <textarea
              rows="4"
              maxLength={1000}
              value={form.reason}
              placeholder="Nhập lý do nghỉ phép..."
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
            />

            <div className="my-leave-character-count">
              {form.reason.length}/1000
            </div>
          </div>

          {/* ==============================================
              BALANCE
          ============================================== */}

          <div className="my-leave-balance-box">
            <div className="my-leave-balance-icon">
              <FaCalendarCheck />
            </div>

            <div>
              <span>Số phép hiện có thể đăng ký</span>

              <strong>{formatLeaveDay(balance?.requestable_days)} ngày</strong>

              <small>
                Đã tích lũy {formatLeaveDay(balance?.accrued_days)} ngày · Đã sử
                dụng {formatLeaveDay(balance?.used_days)} ngày
              </small>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseCreate}
            disabled={submitting}
          >
            Đóng
          </Button>

          <Button
            className="my-leave-submit-btn"
            onClick={handleCreateRequest}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" />
                Đang gửi...
              </>
            ) : (
              <>
                <FaCheckCircle />
                Gửi đăng ký
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// ==========================================================
// SUMMARY CARD
// ==========================================================

const SummaryCard = ({ icon, label, value, unit, highlight = false }) => {
  return (
    <div
      className={`my-leave-summary-card ${
        highlight ? "my-leave-summary-highlight" : ""
      }`}
    >
      <div className="my-leave-summary-icon">{icon}</div>

      <div>
        <span>{label}</span>

        <div className="my-leave-summary-value">
          <strong>{value}</strong>

          {unit && <small>{unit}</small>}
        </div>
      </div>
    </div>
  );
};

export default MyLeave;
