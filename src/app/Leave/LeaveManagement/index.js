import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";

import {
  FaCalendarAlt,
  FaCalendarCheck,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaHourglassHalf,
  FaSyncAlt,
  FaTimesCircle,
  FaUser,
  FaUserCheck,
  FaUsers,
  FaUmbrellaBeach,
  FaWallet,
} from "react-icons/fa";

import APIToken from "../../../config/APIToken";

import "./index.css";

// ==========================================================
// SYSTEM YEAR
// ==========================================================

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
// FORMAT DATE TIME
// ==========================================================

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
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
      className: "leave-management-status-pending",
      icon: <FaHourglassHalf />,
    },

    APPROVED: {
      label: "Đã duyệt",
      className: "leave-management-status-approved",
      icon: <FaCheckCircle />,
    },

    REJECTED: {
      label: "Từ chối",
      className: "leave-management-status-rejected",
      icon: <FaTimesCircle />,
    },

    CANCELLED: {
      label: "Đã hủy",
      className: "leave-management-status-cancelled",
      icon: <FaTimesCircle />,
    },
  };

  return (
    map[status] || {
      label: status || "-",
      className: "leave-management-status-default",
      icon: null,
    }
  );
};

// ==========================================================
// COMPONENT
// ==========================================================

const LeaveManagement = () => {
  // ========================================================
  // USER ĐANG ĐĂNG NHẬP
  // ========================================================

  const userId = Number(localStorage.getItem("userId"));

  // ========================================================
  // STATE
  // ========================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [processing, setProcessing] = useState(false);

  const [year, setYear] = useState(SYSTEM_YEAR);

  const [activeTab, setActiveTab] = useState("PENDING");

  const [requests, setRequests] = useState([]);

  const [balances, setBalances] = useState([]);

  const [selectedRequest, setSelectedRequest] = useState(null);

  const [showDetail, setShowDetail] = useState(false);

  const [showReject, setShowReject] = useState(false);

  const [rejectReason, setRejectReason] = useState("");

  // ========================================================
  // LOAD
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

      const [requestsRes, balancesRes] = await Promise.all([
        APIToken.get("/requests", {
          params: {
            year,
          },
        }),

        APIToken.get("/balances", {
          params: {
            year,
          },
        }),
      ]);

      const requestData = requestsRes?.data?.data || [];

      const balanceResponseData = balancesRes?.data?.data;

      let balanceData = [];

      if (Array.isArray(balanceResponseData)) {
        balanceData = balanceResponseData;
      } else if (Array.isArray(balanceResponseData?.employees)) {
        balanceData = balanceResponseData.employees;
      }

      // ====================================================
      // CHỈ LẤY PHIẾU ĐƯỢC GỬI ĐẾN USER ĐANG ĐĂNG NHẬP
      // ====================================================

      const myRequests = requestData.filter(
        (item) => Number(item.approver_user_id) === Number(userId),
      );

      setRequests(myRequests);

      setBalances(balanceData);
    } catch (error) {
      console.error("fetch LeaveManagement error:", error);

      alert(
        error?.response?.data?.message ||
          "Không thể tải dữ liệu quản lý nghỉ phép.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ========================================================
  // GET BALANCE BY USER
  // ========================================================

  const getEmployeeBalance = (employeeId) => {
    return balances.find((item) => Number(item.user_id) === Number(employeeId));
  };

  // ========================================================
  // REQUEST STATS
  // ========================================================

  const stats = useMemo(() => {
    return requests.reduce(
      (result, item) => {
        result.total += 1;

        if (item.status === "PENDING") {
          result.pending += 1;
        }

        if (item.status === "APPROVED") {
          result.approved += 1;
        }

        if (item.status === "REJECTED") {
          result.rejected += 1;
        }

        if (item.status === "CANCELLED") {
          result.cancelled += 1;
        }

        return result;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
      },
    );
  }, [requests]);

  // ========================================================
  // FILTER TAB
  // ========================================================

  const displayRequests = useMemo(() => {
    if (activeTab === "ALL") {
      return requests;
    }

    return requests.filter((item) => item.status === activeTab);
  }, [requests, activeTab]);

  // ========================================================
  // VIEW DETAIL
  // ========================================================

  const handleViewDetail = (item) => {
    setSelectedRequest(item);

    setShowDetail(true);
  };

  // ========================================================
  // CLOSE DETAIL
  // ========================================================

  const handleCloseDetail = () => {
    if (processing) return;

    setShowDetail(false);

    setSelectedRequest(null);
  };

  // ========================================================
  // APPROVE
  // ========================================================

  const handleApprove = async (item) => {
    if (!item?.leave_request_id) return;

    const employeeName = item.name || `Nhân viên #${item.user_id}`;

    const confirmed = window.confirm(
      `Bạn có chắc muốn đồng ý phiếu nghỉ phép của ${employeeName}?\n\nThời gian: ${formatDate(
        item.start_date,
      )} - ${formatDate(item.end_date)}\nSố ngày: ${formatLeaveDay(
        item.total_days,
      )} ngày`,
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      await APIToken.put(`/request/${item.leave_request_id}/decision`, {
        decision: "APPROVED",
      });

      alert("Đã đồng ý phiếu nghỉ phép.");

      setShowDetail(false);
      setSelectedRequest(null);

      await fetchData(true);
    } catch (error) {
      console.error("approve leave error:", error);

      alert(
        error?.response?.data?.message || "Không thể duyệt phiếu nghỉ phép.",
      );
    } finally {
      setProcessing(false);
    }
  };

  // ========================================================
  // OPEN REJECT
  // ========================================================

  const handleOpenReject = (item) => {
    if (!item?.leave_request_id) return;

    setSelectedRequest(item);

    setRejectReason("");

    setShowDetail(false);

    setShowReject(true);
  };

  // ========================================================
  // CLOSE REJECT
  // ========================================================

  const handleCloseReject = () => {
    if (processing) return;

    setShowReject(false);

    setRejectReason("");

    setSelectedRequest(null);
  };

  // ========================================================
  // REJECT
  // ========================================================

  const handleReject = async () => {
    if (!selectedRequest?.leave_request_id) {
      return;
    }

    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }

    try {
      setProcessing(true);

      await APIToken.put(
        `/request/${selectedRequest.leave_request_id}/decision`,
        {
          decision: "REJECTED",
          reject_reason: rejectReason.trim(),
        },
      );

      alert("Đã từ chối phiếu nghỉ phép.");

      setShowReject(false);

      setRejectReason("");

      setSelectedRequest(null);

      await fetchData(true);
    } catch (error) {
      console.error("reject leave error:", error);

      alert(
        error?.response?.data?.message || "Không thể từ chối phiếu nghỉ phép.",
      );
    } finally {
      setProcessing(false);
    }
  };

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="leave-management-loading">
        <Spinner animation="border" />

        <div>Đang tải dữ liệu nghỉ phép...</div>
      </div>
    );
  }

  // ========================================================
  // USER ID NOT FOUND
  // ========================================================

  if (!userId) {
    return (
      <div className="leave-management-page">
        <div className="leave-management-empty">
          <FaUser />

          <h4>Không xác định được tài khoản đăng nhập</h4>

          <p>Vui lòng đăng nhập lại để sử dụng chức năng quản lý nghỉ phép.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leave-management-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="leave-management-header">
        <div>
          <div className="leave-management-eyebrow">VIỆT NAM TOUR</div>

          <h2>
            <FaUserCheck />
            Quản lý nghỉ phép
          </h2>

          <p>Xem và xử lý các phiếu nghỉ phép được gửi đến bạn.</p>
        </div>

        <Button
          className="leave-management-refresh-btn"
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
      </div>

      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <div className="leave-management-toolbar">
        <div className="leave-management-current-approver">
          <FaUserCheck />

          <div>
            <span>Người duyệt</span>

            <strong>Mã nhân viên #{userId}</strong>
          </div>
        </div>

        <div className="leave-management-year">
          <span>Năm</span>

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

      <div className="leave-management-summary">
        <SummaryCard
          icon={<FaUmbrellaBeach />}
          label="Tổng phiếu"
          value={stats.total}
        />

        <SummaryCard
          icon={<FaHourglassHalf />}
          label="Chờ duyệt"
          value={stats.pending}
          type="pending"
        />

        <SummaryCard
          icon={<FaCheckCircle />}
          label="Đã duyệt"
          value={stats.approved}
          type="approved"
        />

        <SummaryCard
          icon={<FaTimesCircle />}
          label="Từ chối"
          value={stats.rejected}
          type="rejected"
        />
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="leave-management-content-card">
        {/* ==============================================
            TABS
        ============================================== */}

        <div className="leave-management-tabs">
          <button
            type="button"
            className={activeTab === "PENDING" ? "active" : ""}
            onClick={() => setActiveTab("PENDING")}
          >
            <FaHourglassHalf />
            Chờ duyệt
            {stats.pending > 0 && (
              <span className="leave-management-tab-count">
                {stats.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            className={activeTab === "APPROVED" ? "active" : ""}
            onClick={() => setActiveTab("APPROVED")}
          >
            <FaCheckCircle />
            Đã duyệt
          </button>

          <button
            type="button"
            className={activeTab === "REJECTED" ? "active" : ""}
            onClick={() => setActiveTab("REJECTED")}
          >
            <FaTimesCircle />
            Từ chối
          </button>

          <button
            type="button"
            className={activeTab === "ALL" ? "active" : ""}
            onClick={() => setActiveTab("ALL")}
          >
            <FaCalendarAlt />
            Tất cả
          </button>
        </div>

        {/* ==============================================
            SECTION TITLE
        ============================================== */}

        <div className="leave-management-section-title">
          <div>
            <h4>
              {activeTab === "PENDING" && "Phiếu đang chờ duyệt"}

              {activeTab === "APPROVED" && "Phiếu đã duyệt"}

              {activeTab === "REJECTED" && "Phiếu đã từ chối"}

              {activeTab === "ALL" && "Tất cả phiếu nghỉ phép"}
            </h4>

            <p>
              {displayRequests.length} phiếu trong năm {year}.
            </p>
          </div>
        </div>

        {/* ==============================================
            EMPTY
        ============================================== */}

        {displayRequests.length === 0 ? (
          <div className="leave-management-empty">
            <FaCalendarCheck />

            <h4>Không có phiếu nghỉ phép</h4>

            <p>Hiện không có phiếu phù hợp với trạng thái đang chọn.</p>
          </div>
        ) : (
          <>
            {/* ============================================
                DESKTOP TABLE
            ============================================ */}

            <div className="leave-management-table-wrapper">
              <table className="leave-management-table">
                <thead>
                  <tr>
                    <th>Nhân viên</th>

                    <th>Thời gian nghỉ</th>

                    <th className="text-center">Số ngày</th>

                    <th>Lý do</th>

                    <th className="text-center">Phép khả dụng</th>

                    <th className="text-center">Trạng thái</th>

                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {displayRequests.map((item) => {
                    const status = getStatusInfo(item.status);

                    const employeeBalance = getEmployeeBalance(item.user_id);

                    return (
                      <tr key={item.leave_request_id}>
                        {/* EMPLOYEE */}

                        <td>
                          <div className="leave-management-employee">
                            <div className="leave-management-avatar">
                              {item.avatar ? (
                                <img
                                  src={item.avatar}
                                  alt={item.name || "Avatar"}
                                />
                              ) : (
                                <FaUser />
                              )}
                            </div>

                            <div>
                              <strong>
                                {item.name || `Nhân viên #${item.user_id}`}
                              </strong>

                              <span>
                                {item.position || `Mã NV: ${item.user_id}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* PERIOD */}

                        <td>
                          <div className="leave-management-period">
                            <FaCalendarAlt />

                            <span>{formatDate(item.start_date)}</span>

                            <span>→</span>

                            <span>{formatDate(item.end_date)}</span>
                          </div>
                        </td>

                        {/* DAYS */}

                        <td className="text-center">
                          <strong className="leave-management-days">
                            {formatLeaveDay(item.total_days)}
                          </strong>
                        </td>

                        {/* REASON */}

                        <td>
                          <div className="leave-management-reason">
                            {item.reason || "-"}
                          </div>
                        </td>

                        {/* BALANCE */}

                        <td className="text-center">
                          <div className="leave-management-balance">
                            <strong>
                              {employeeBalance
                                ? formatLeaveDay(
                                    employeeBalance.requestable_days,
                                  )
                                : "-"}
                            </strong>

                            <span>ngày</span>
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="text-center">
                          <span
                            className={`leave-management-status ${status.className}`}
                          >
                            {status.icon}

                            {status.label}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td className="text-center">
                          <div className="leave-management-actions">
                            <Button
                              className="leave-management-view-btn"
                              onClick={() => handleViewDetail(item)}
                            >
                              <FaEye />
                              Xem
                            </Button>

                            {item.status === "PENDING" && (
                              <>
                                <Button
                                  className="leave-management-approve-btn"
                                  disabled={processing}
                                  onClick={() => handleApprove(item)}
                                >
                                  <FaCheckCircle />
                                  Đồng ý
                                </Button>

                                <Button
                                  className="leave-management-reject-btn"
                                  disabled={processing}
                                  onClick={() => handleOpenReject(item)}
                                >
                                  <FaTimesCircle />
                                  Từ chối
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ============================================
                MOBILE
            ============================================ */}

            <div className="leave-management-mobile-list">
              {displayRequests.map((item) => {
                const status = getStatusInfo(item.status);

                const employeeBalance = getEmployeeBalance(item.user_id);

                return (
                  <div
                    className="leave-management-mobile-card"
                    key={item.leave_request_id}
                  >
                    <div className="leave-management-mobile-top">
                      <div className="leave-management-employee">
                        <div className="leave-management-avatar">
                          {item.avatar ? (
                            <img
                              src={item.avatar}
                              alt={item.name || "Avatar"}
                            />
                          ) : (
                            <FaUser />
                          )}
                        </div>

                        <div>
                          <strong>
                            {item.name || `Nhân viên #${item.user_id}`}
                          </strong>

                          <span>
                            {item.position || `Mã NV: ${item.user_id}`}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`leave-management-status ${status.className}`}
                      >
                        {status.icon}

                        {status.label}
                      </span>
                    </div>

                    <div className="leave-management-mobile-period">
                      <FaCalendarAlt />

                      <span>{formatDate(item.start_date)}</span>

                      <span>→</span>

                      <span>{formatDate(item.end_date)}</span>
                    </div>

                    <div className="leave-management-mobile-grid">
                      <div>
                        <span>Số ngày nghỉ</span>

                        <strong>{formatLeaveDay(item.total_days)} ngày</strong>
                      </div>

                      <div>
                        <span>Phép khả dụng</span>

                        <strong>
                          {employeeBalance
                            ? `${formatLeaveDay(
                                employeeBalance.requestable_days,
                              )} ngày`
                            : "-"}
                        </strong>
                      </div>
                    </div>

                    <div className="leave-management-mobile-reason">
                      <span>Lý do nghỉ</span>

                      <strong>{item.reason || "-"}</strong>
                    </div>

                    {item.status === "REJECTED" && item.reject_reason && (
                      <div className="leave-management-mobile-reject">
                        <span>Lý do từ chối</span>

                        <strong>{item.reject_reason}</strong>
                      </div>
                    )}

                    <div className="leave-management-mobile-actions">
                      <Button
                        className="leave-management-view-btn"
                        onClick={() => handleViewDetail(item)}
                      >
                        <FaEye />
                        Xem chi tiết
                      </Button>

                      {item.status === "PENDING" && (
                        <div>
                          <Button
                            className="leave-management-approve-btn"
                            disabled={processing}
                            onClick={() => handleApprove(item)}
                          >
                            <FaCheckCircle />
                            Đồng ý
                          </Button>

                          <Button
                            className="leave-management-reject-btn"
                            disabled={processing}
                            onClick={() => handleOpenReject(item)}
                          >
                            <FaTimesCircle />
                            Từ chối
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ==================================================
          DETAIL MODAL
      ================================================== */}

      <Modal
        show={showDetail}
        onHide={handleCloseDetail}
        size="lg"
        centered
        dialogClassName="leave-management-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCalendarCheck />
            Chi tiết phiếu nghỉ phép
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedRequest && (
            <LeaveRequestDetail
              request={selectedRequest}
              balance={getEmployeeBalance(selectedRequest.user_id)}
            />
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseDetail}
            disabled={processing}
          >
            Đóng
          </Button>

          {selectedRequest?.status === "PENDING" && (
            <>
              <Button
                className="leave-management-reject-modal-btn"
                disabled={processing}
                onClick={() => handleOpenReject(selectedRequest)}
              >
                <FaTimesCircle />
                Từ chối
              </Button>

              <Button
                className="leave-management-approve-modal-btn"
                disabled={processing}
                onClick={() => handleApprove(selectedRequest)}
              >
                {processing ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <FaCheckCircle />
                )}
                Đồng ý
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* ==================================================
          REJECT MODAL
      ================================================== */}

      <Modal
        show={showReject}
        onHide={handleCloseReject}
        centered
        dialogClassName="leave-management-reject-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTimesCircle />
            Từ chối phiếu nghỉ phép
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedRequest && (
            <>
              <div className="leave-management-reject-employee">
                <div className="leave-management-avatar">
                  <FaUser />
                </div>

                <div>
                  <span>Nhân viên</span>

                  <strong>
                    {selectedRequest.name ||
                      `Nhân viên #${selectedRequest.user_id}`}
                  </strong>

                  <small>
                    {formatDate(selectedRequest.start_date)}
                    {" - "}
                    {formatDate(selectedRequest.end_date)}
                    {" · "}
                    {formatLeaveDay(selectedRequest.total_days)}
                    {" ngày"}
                  </small>
                </div>
              </div>

              <div className="leave-management-form-group">
                <label>
                  Lý do từ chối <span>*</span>
                </label>

                <textarea
                  rows="5"
                  maxLength={1000}
                  placeholder="Nhập lý do từ chối phiếu nghỉ phép..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />

                <div className="leave-management-character-count">
                  {rejectReason.length}/1000
                </div>
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseReject}
            disabled={processing}
          >
            Đóng
          </Button>

          <Button
            className="leave-management-confirm-reject-btn"
            disabled={processing}
            onClick={handleReject}
          >
            {processing ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <FaTimesCircle />
            )}
            Xác nhận từ chối
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// ==========================================================
// SUMMARY
// ==========================================================

const SummaryCard = ({ icon, label, value, type = "" }) => {
  return (
    <div
      className={`leave-management-summary-card ${
        type ? `summary-${type}` : ""
      }`}
    >
      <div className="leave-management-summary-icon">{icon}</div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </div>
  );
};

// ==========================================================
// DETAIL
// ==========================================================

const LeaveRequestDetail = ({ request, balance }) => {
  const status = getStatusInfo(request.status);

  return (
    <div className="leave-request-detail">
      {/* HEADER */}

      <div className="leave-request-detail-header">
        <div>
          <div className="leave-request-detail-company">VIỆT NAM TOUR</div>

          <h3>PHIẾU ĐĂNG KÝ NGHỈ PHÉP</h3>

          <p>Phiếu #{request.leave_request_id}</p>
        </div>

        <span className={`leave-management-status ${status.className}`}>
          {status.icon}

          {status.label}
        </span>
      </div>

      {/* EMPLOYEE */}

      <div className="leave-request-detail-employee">
        <DetailInfo label="Nhân viên" value={request.name || "-"} />

        <DetailInfo label="Chức vụ" value={request.position || "-"} />

        <DetailInfo label="Mã nhân viên" value={request.user_id || "-"} />

        <DetailInfo label="Mã phiếu" value={`#${request.leave_request_id}`} />
      </div>

      {/* LEAVE */}

      <div className="leave-request-detail-section">
        <div className="leave-request-detail-section-title">
          <FaCalendarAlt />
          Thông tin nghỉ phép
        </div>

        <DetailRow label="Từ ngày" value={formatDate(request.start_date)} />

        <DetailRow label="Đến ngày" value={formatDate(request.end_date)} />

        <DetailRow
          label="Tổng số ngày nghỉ"
          value={`${formatLeaveDay(request.total_days)} ngày`}
          highlight
        />

        <DetailRow label="Lý do nghỉ" value={request.reason || "-"} />
      </div>

      {/* BALANCE */}

      <div className="leave-request-detail-section">
        <div className="leave-request-detail-section-title">
          <FaWallet />
          Quỹ phép nhân viên
        </div>

        <DetailRow
          label="Đã tích lũy"
          value={`${formatLeaveDay(balance?.accrued_days)} ngày`}
        />

        <DetailRow
          label="Đã sử dụng"
          value={`${formatLeaveDay(balance?.used_days)} ngày`}
        />

        <DetailRow
          label="Đang chờ duyệt"
          value={`${formatLeaveDay(balance?.pending_days)} ngày`}
        />

        <DetailRow
          label="Phép còn lại"
          value={`${formatLeaveDay(balance?.remaining_days)} ngày`}
        />

        <DetailRow
          label="Có thể đăng ký"
          value={`${formatLeaveDay(balance?.requestable_days)} ngày`}
          highlight
        />
      </div>

      {/* APPROVAL */}

      <div className="leave-request-detail-section">
        <div className="leave-request-detail-section-title">
          <FaUserCheck />
          Thông tin xử lý
        </div>

        <DetailRow
          label="Người duyệt"
          value={request.approver_name || `User #${request.approver_user_id}`}
        />

        {request.status === "APPROVED" && (
          <>
            <DetailRow label="Trạng thái" value="Đã duyệt" positive />

            <DetailRow
              label="Thời gian duyệt"
              value={formatDateTime(request.approved_at)}
            />
          </>
        )}

        {request.status === "REJECTED" && (
          <>
            <DetailRow label="Trạng thái" value="Từ chối" negative />

            <DetailRow
              label="Thời gian từ chối"
              value={formatDateTime(request.rejected_at)}
            />

            <DetailRow
              label="Lý do từ chối"
              value={request.reject_reason || "-"}
              negative
            />
          </>
        )}

        {request.status === "PENDING" && (
          <DetailRow label="Trạng thái" value="Đang chờ xử lý" />
        )}
      </div>
    </div>
  );
};

// ==========================================================
// DETAIL INFO
// ==========================================================

const DetailInfo = ({ label, value }) => {
  return (
    <div className="leave-request-detail-info">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
};

// ==========================================================
// DETAIL ROW
// ==========================================================

const DetailRow = ({
  label,
  value,
  highlight = false,
  positive = false,
  negative = false,
}) => {
  const classes = [
    highlight ? "detail-highlight" : "",
    positive ? "detail-positive" : "",
    negative ? "detail-negative" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="leave-request-detail-row">
      <span>{label}</span>

      <strong className={classes}>{value}</strong>
    </div>
  );
};

export default LeaveManagement;
