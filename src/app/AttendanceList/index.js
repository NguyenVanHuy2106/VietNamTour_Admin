import React, { useEffect, useState } from "react";

import APIToken from "../../config/APIToken";

import { BsCaretLeft, BsCaretRight } from "react-icons/bs";

import { FaClock, FaCheckCircle } from "react-icons/fa";

import {
  Badge,
  Button,
  Form,
  InputGroup,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";

import "./index.css";

const AttendanceList = () => {
  // ==========================================================
  // DATA
  // ==========================================================

  const [dataHistory, setDataHistory] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);

  // ==========================================================
  // DATE
  // ==========================================================

  const today = new Date().toISOString().split("T")[0];

  const firstDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  )
    .toISOString()
    .split("T")[0];

  const [fromDate, setFromDate] = useState(firstDayOfMonth);

  const [toDate, setToDate] = useState(today);

  // ==========================================================
  // USER
  // ==========================================================

  const userId = localStorage.getItem("userId");

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const itemsPerPage = 10;

  // ==========================================================
  // LOAD INIT
  // ==========================================================

  useEffect(() => {
    getAttendanceData();
  }, []);

  // ==========================================================
  // GET ATTENDANCE
  // ==========================================================

  const getAttendanceData = async () => {
    try {
      setLoading(true);

      const response = await APIToken.post("/getAttendanceHistory", {
        fromDate: fromDate,
        toDate: toDate,
        userId: parseInt(userId),
      });

      if (response?.data?.success) {
        setDataHistory(response?.data?.data || []);
      } else {
        setDataHistory([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu chấm công:", error);

      console.error("Backend:", error?.response?.data);

      setDataHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // PAGINATION DATA
  // ==========================================================

  const indexOfLastItem = currentPage * itemsPerPage;

  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentItems = dataHistory.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.max(Math.ceil(dataHistory.length / itemsPerPage), 1);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const handleSearch = () => {
    setCurrentPage(1);

    getAttendanceData();
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatWorkDate = (value) => {
    if (!value) {
      return "---";
    }

    return new Date(value).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // ==========================================================
  // FORMAT TIME
  // ==========================================================

  const formatTime = (value) => {
    if (!value) {
      return "---";
    }

    return new Date(value).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // ==========================================================
  // WORKING HOURS
  // ==========================================================

  const getWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) {
      return "---";
    }

    const start = new Date(checkIn);

    const end = new Date(checkOut);

    const diffInMs = end - start;

    if (diffInMs <= 0) {
      return "0.00 giờ";
    }

    const diffHours = diffInMs / (1000 * 60 * 60);

    return `${diffHours.toFixed(2)} giờ`;
  };

  // ==========================================================
  // STATUS
  // ==========================================================

  const renderStatus = (item) => {
    if (!item.checkIn) {
      return (
        <Badge bg="secondary" className="attendance-status-badge">
          Vắng mặt
        </Badge>
      );
    }

    if (item.status === "LATE") {
      return (
        <Badge bg="danger" className="attendance-status-badge">
          <FaClock className="me-1" />
          Đi trễ
        </Badge>
      );
    }

    if (item.status === "ON_TIME") {
      return (
        <Badge bg="success" className="attendance-status-badge">
          <FaCheckCircle className="me-1" />
          Đúng giờ
        </Badge>
      );
    }

    return (
      <Badge bg="primary" className="attendance-status-badge">
        Đã chấm công
      </Badge>
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="attendance-page-container">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="dashboard-header">
        <div className="header-text">
          <h2>Lịch sử Chấm công</h2>

          <p>Xem chi tiết thời gian làm việc của bạn</p>
        </div>

        {/* ===================================================
            FILTER
        =================================================== */}

        <div className="header-actions">
          {/* FROM DATE */}

          <div className="filter-item-wrapper">
            <InputGroup className="date-filter">
              <InputGroup.Text>Từ ngày</InputGroup.Text>

              <Form.Control
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </InputGroup>
          </div>

          {/* TO DATE */}

          <div className="filter-item-wrapper">
            <InputGroup className="date-filter">
              <InputGroup.Text>Đến ngày</InputGroup.Text>

              <Form.Control
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </InputGroup>
          </div>

          {/* SEARCH */}

          <Button variant="primary" onClick={handleSearch} disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang tải...
              </>
            ) : (
              "Tìm kiếm"
            )}
          </Button>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="content-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Ngày làm việc</th>

                <th>Giờ vào</th>

                <th>Giờ ra</th>

                <th>Tổng giờ</th>

                <th>Thiết bị</th>

                <th>IP chấm công</th>

                <th className="text-center">Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="attendance-empty">
                    <Spinner animation="border" variant="primary" />

                    <span>Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr key={item.id || `${item.workDate}-${index}`}>
                    {/* DATE */}

                    <td
                      data-label="Ngày làm việc"
                      className="attendance-date-cell"
                    >
                      {formatWorkDate(item.workDate)}
                    </td>

                    {/* CHECK IN */}

                    <td data-label="Giờ vào">
                      <div className="attendance-time">
                        <FaClock className="attendance-checkin-icon" />

                        <span>{formatTime(item.checkIn)}</span>
                      </div>
                    </td>

                    {/* CHECK OUT */}

                    <td data-label="Giờ ra">
                      <div className="attendance-time">
                        <FaClock className="attendance-checkout-icon" />

                        <span>{formatTime(item.checkOut)}</span>
                      </div>
                    </td>

                    {/* TOTAL HOURS */}

                    <td data-label="Tổng giờ">
                      <Badge bg="info" className="attendance-hours-badge">
                        {getWorkingHours(item.checkIn, item.checkOut)}
                      </Badge>
                    </td>

                    {/* DEVICE */}

                    <td data-label="Thiết bị">
                      <span className="attendance-device">
                        {item.deviceIdUsed || "---"}
                      </span>
                    </td>

                    {/* IP */}

                    <td data-label="IP chấm công">
                      <span className="attendance-ip">
                        {item.ipAddress || "---"}
                      </span>
                    </td>

                    {/* STATUS */}

                    <td data-label="Trạng thái" className="text-center">
                      {renderStatus(item)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="attendance-empty">
                    Không có dữ liệu chấm công trong khoảng thời gian này
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            PAGINATION
        =================================================== */}

        {dataHistory.length > 0 && totalPages > 1 && (
          <div className="pagination-wrapper">
            <p>
              Trang <strong>{currentPage}</strong> / {totalPages}
            </p>

            <div className="custom-pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((value) => Math.max(value - 1, 1))
                }
                title="Trang trước"
              >
                <BsCaretLeft />
              </button>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((value) => Math.min(value + 1, totalPages))
                }
                title="Trang sau"
              >
                <BsCaretRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          TOAST
      ===================================================== */}

      <ToastContainer position="top-end" className="p-3">
        <Toast
          bg="success"
          show={successAlertOpen}
          onClose={() => setSuccessAlertOpen(false)}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">
            Cập nhật dữ liệu thành công!
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default AttendanceList;
