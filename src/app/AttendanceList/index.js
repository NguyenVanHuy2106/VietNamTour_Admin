import React, { useState, useEffect } from "react";
import APIToken from "../../config/APIToken";
import { BsCaretLeft, BsCaretRight, BsCalendarDate } from "react-icons/bs";
import { FaHistory, FaClock, FaCheckCircle } from "react-icons/fa";
import {
  Button,
  Form,
  Spinner,
  Toast,
  ToastContainer,
  Badge,
  InputGroup,
} from "react-bootstrap";
import "./index.css";

const AttendanceList = () => {
  const [dataHistory, setDataHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);

  // Khởi tạo ngày: từ đầu tháng đến hiện tại
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

  let userId = localStorage.getItem("userId");
  const itemsPerPage = 10;

  useEffect(() => {
    getAttendanceData();
  }, []);

  const getAttendanceData = async () => {
    try {
      setLoading(true);
      // Gọi API POST theo cấu trúc bạn cung cấp
      const response = await APIToken.post("/getAttendanceHistory", {
        fromDate: fromDate,
        toDate: toDate,
        userId: parseInt(userId),
      });

      if (response.data.success) {
        setDataHistory(response.data.data || []);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu chấm công:", error);
    } finally {
      setLoading(false);
    }
  };

  //   const formatWorkingTime = (checkIn, checkOut) => {
  //     if (!checkIn || !checkOut) return "---";

  //     const start = new Date(checkIn);
  //     const end = new Date(checkOut);
  //     const diffInMs = end - start;

  //     if (diffInMs <= 0) return "0 giờ";

  //     // Tính tổng số phút
  //     const totalMinutes = Math.floor(diffInMs / (1000 * 60));
  //     const hours = Math.floor(totalMinutes / 60);
  //     const minutes = totalMinutes % 60;

  //     // Trả về định dạng: 6 giờ 58 phút
  //     return `${hours} giờ ${minutes} phút`;
  //   };

  // Logic phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(dataHistory.length / itemsPerPage);

  const handleSearch = () => {
    setCurrentPage(1);
    getAttendanceData();
  };

  return (
    <div className="attendance-page-container">
      {/* Header & Filter */}
      <div className="dashboard-header">
        <div className="header-text">
          <h2>Lịch sử Chấm công</h2>
          <p>Xem chi tiết thời gian làm việc của bạn</p>
        </div>
        <div className="header-actions">
          <InputGroup className="date-filter">
            <InputGroup.Text>Từ ngày</InputGroup.Text>
            <Form.Control
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </InputGroup>
          <InputGroup className="date-filter">
            <InputGroup.Text>Đến ngày</InputGroup.Text>
            <Form.Control
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </InputGroup>
          <Button variant="primary" onClick={handleSearch} disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Tìm kiếm"}
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="content-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Ngày làm việc</th>
                <th>Giờ vào (Check-in)</th>
                <th>Giờ ra (Check-out)</th>
                <th>Tổng giờ</th>
                <th>Thiết bị</th>
                <th>IP chấm công</th>
                <th className="text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr key={index}>
                    <td className="fw-bold text-primary">
                      {new Date(item.workDate).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </td>
                    <td>
                      <FaClock className="me-2 text-success" />
                      {new Date(item.checkIn).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td>
                      <FaClock className="me-2 text-danger" />
                      {/* {new Date(item.checkOut).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })} */}{" "}
                      -/-
                    </td>
                    <td>
                      <Badge bg="info" className="p-2">
                        {(() => {
                          // Nếu không có checkIn thì không thể tính toán
                          if (!item.checkIn) return "---";

                          const start = new Date(item.checkIn);
                          let end;

                          if (item.checkOut) {
                            // Trường hợp 1: Có dữ liệu checkOut thực tế
                            end = new Date(item.checkOut);
                          } else {
                            // Trường hợp 2: Không có checkOut, mặc định lấy 16:00:00 cùng ngày với checkIn
                            end = new Date(start);
                            end.setHours(16, 0, 0, 0);
                          }

                          // Tính toán độ lệch giờ
                          const diffInMs = end - start;

                          // Nếu đi làm sau 16h (âm giờ) thì hiển thị 0.00
                          if (diffInMs <= 0) return "0.00 giờ";

                          const diffHours = diffInMs / (1000 * 60 * 60);

                          // Trả về định dạng y hệt cũ: ví dụ "6.97 giờ"
                          return `${diffHours.toFixed(2)} giờ`;
                        })()}
                      </Badge>
                    </td>
                    <td>
                      {item.deviceIdUsed ? `${item.deviceIdUsed}` : "---"}
                    </td>
                    <td>{item.ipAddress ? `${item.ipAddress}` : "---"}</td>

                    <td className="text-center">
                      {(() => {
                        // Nếu không có giờ vào -> Vắng
                        if (!item.checkIn) {
                          return (
                            <Badge bg="secondary" className="px-2 py-1">
                              Vắng mặt
                            </Badge>
                          );
                        }

                        // Nếu có giờ vào, xét trạng thái LATE hoặc ON_TIME
                        if (item.status === "LATE") {
                          return (
                            <Badge bg="danger" className="px-2 py-1">
                              <FaClock className="me-1" /> Đi trễ
                            </Badge>
                          );
                        }

                        if (item.status === "ON_TIME") {
                          return (
                            <Badge bg="success" className="px-2 py-1">
                              <FaCheckCircle className="me-1" /> Đúng giờ
                            </Badge>
                          );
                        }

                        // Trường hợp mặc định nếu có checkInTime nhưng status khác
                        return (
                          <Badge bg="primary" className="px-2 py-1">
                            Đã chấm công
                          </Badge>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    {loading ? (
                      <Spinner animation="border" variant="primary" />
                    ) : (
                      "Không có dữ liệu chấm công trong khoảng thời gian này"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-wrapper">
            <p className="mb-0 text-muted">
              Trang {currentPage} / {totalPages}
            </p>
            <div className="custom-pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((v) => v - 1)}
              >
                <BsCaretLeft />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((v) => v + 1)}
              >
                <BsCaretRight />
              </button>
            </div>
          </div>
        )}
      </div>

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
