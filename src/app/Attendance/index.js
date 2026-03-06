import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import {
  Clock,
  User,
  CheckCircle2,
  MapPin,
  Smartphone,
  History,
  Calendar,
  AlertCircle,
} from "lucide-react";

import { UAParser } from "ua-parser-js";

import FingerprintJS from "@fingerprintjs/fingerprintjs";

import APIToken from "../../config/APIToken";

import "./index.css";

import { Navigate } from "react-router-dom";

const Attendance = () => {
  const navigate = useNavigate();
  const userId = JSON.parse(localStorage.getItem("userId"));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [attendanceStatus, setAttendanceStatus] = useState(null); // null, 'success', 'error'

  const [deviceInfo, setDeviceInfo] = useState("Đang xác định...");

  const [historyList, setHistoryList] = useState([]);

  const [message, setMessage] = useState("");

  const [loadingHistory, setLoadingHistory] = useState(true);

  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");

  // 1. Khởi tạo dữ liệu khi vào trang

  useEffect(() => {
    // Nhận diện thiết bị

    const parser = new UAParser();

    const result = parser.getResult();

    const os = result.os.name || "";

    const browser = result.browser.name || "";

    const model = result.device.model || "";

    const vendor = result.device.vendor || "";
    const deviceName = model
      ? `${vendor} ${model} (${os})`
      : `${os} - ${browser}`;

    setDeviceInfo(deviceName);

    // Chạy đồng hồ thời gian thực

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Lấy lịch sử và kiểm tra trạng thái chấm công ngay khi vào trang

    fetchHistory();

    return () => clearInterval(timer);
  }, []);

  // HÀM LẤY LỊCH SỬ VÀ KIỂM TRA TRẠNG THÁI TRONG NGÀY

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await APIToken.post("/getUserAtendance", {
        userId: userId,
      });
      if (response.data.success) {
        const data = response.data.data;
        setHistoryList(data);

        const todayStr = new Date().toLocaleDateString("en-CA");
        const todayRecord = data.find(
          (item) =>
            new Date(item.workDate).toLocaleDateString("en-CA") === todayStr,
        );

        if (todayRecord) {
          // Xử lý Check-in
          setHasCheckedIn(true);
          setCheckInTime(
            todayRecord.checkIn
              ? todayRecord.checkIn.includes("T")
                ? todayRecord.checkIn.split("T")[1].substring(0, 5)
                : todayRecord.checkIn.split(" ")[1]?.substring(0, 5)
              : "",
          );

          // Xử lý Check-out
          if (todayRecord.checkOut) {
            setHasCheckedOut(true);
            setCheckOutTime(
              todayRecord.checkOut.includes("T")
                ? todayRecord.checkOut.split("T")[1].substring(0, 5)
                : todayRecord.checkOut.split(" ")[1]?.substring(0, 5),
            );
          }
        }
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // HÀM GỌI API CHẤM CÔNG

  const handlePressAttendance = async () => {
    setIsSubmitting(true);

    setMessage("");

    try {
      const fp = await FingerprintJS.load();

      const { visitorId } = await fp.get();

      //const user = JSON.parse(localStorage.getItem("user"));

      const response = await APIToken.post("/submitAtendance", {
        user_id: userId,
        deviceId: deviceInfo,
      });

      if (response.data.success) {
        setAttendanceStatus("success");

        setMessage(response.data.message);

        // Load lại lịch sử để cập nhật bảng và trạng thái nút

        fetchHistory();
      }
    } catch (error) {
      setAttendanceStatus("error");

      setMessage(error.response?.data?.message || "Lỗi hệ thống.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleCheckOut = async () => {
    setIsSubmitting(true);
    try {
      const response = await APIToken.post("/submitCheckOut", {
        // Đổi endpoint tương ứng
        user_id: userId,
        deviceId: deviceInfo,
      });

      if (response.data.success) {
        setIsCheckedOut(true);
        setMessage(response.data.message);
        fetchHistory(); // Load lại để cập nhật giao diện
      }
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi Check-out");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="attendance-container">
      <div className="page-header">
        <div>
          <h2 className="brand-title">VIỆT NAM TOUR</h2>

          <p className="sub-title">Hệ thống quản lý chấm công nội bộ</p>
        </div>

        <div className="live-date">
          <Calendar size={18} />

          <span>
            {currentTime.toLocaleDateString("vi-VN", {
              weekday: "long",

              day: "2-digit",

              month: "long",

              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <div className="attendance-layout">
        <div className="main-section">
          {/* CARD ĐỒNG HỒ */}

          <div className="card clock-card">
            <Clock size={48} className="icon-blue" />

            <h1 className="time-text">
              {currentTime.toLocaleTimeString("vi-VN", { hour12: false })}
            </h1>

            <p className="timezone-label">Múi giờ Việt Nam (GMT+7)</p>
          </div>

          {/* CARD HÀNH ĐỘNG - NƠI HIỆN NÚT HOẶC THÔNG BÁO THÀNH CÔNG */}

          <div className="card action-card">
            {loadingHistory ? (
              <p>Đang kiểm tra dữ liệu...</p>
            ) : (
              <div className="attendance-display-wrapper">
                {/* KHỐI 1: HIỂN THỊ KẾT QUẢ CHECK-IN */}
                {hasCheckedIn ? (
                  <div
                    className="success-ui fade-in"
                    style={{ marginBottom: hasCheckedOut ? "20px" : "0" }}
                  >
                    <CheckCircle2 size={60} color="#28a745" />
                    <h2
                      className="success-title"
                      style={{
                        color: "#28a745",
                        fontSize: "24px",
                        marginTop: "10px",
                      }}
                    >
                      Đã chấm công
                    </h2>
                    <p className="success-desc">
                      Bạn đã hoàn thành chấm công lúc {checkInTime}
                    </p>
                  </div>
                ) : (
                  /* Nút bấm Check-in nếu chưa có dữ liệu */
                  <div className="action-ui">
                    <p className="action-hint">
                      Đảm bảo bạn đang ở văn phòng Việt Nam Tour
                    </p>
                    <button
                      onClick={handlePressAttendance}
                      disabled={isSubmitting}
                      className={`main-btn ${isSubmitting ? "btn-disabled" : ""}`}
                    >
                      {isSubmitting ? "ĐANG XÁC THỰC..." : "XÁC NHẬN CHẤM CÔNG"}
                    </button>
                  </div>
                )}

                {/* Đường kẻ ngăn cách nhẹ nếu đang ở trạng thái chờ Check-out */}
                {hasCheckedIn && !hasCheckedOut && (
                  <div className="divider-dashed"></div>
                )}

                {/* KHỐI 2: HIỂN THỊ NÚT CHECK-OUT HOẶC KẾT QUẢ CHECK-OUT */}
                {hasCheckedIn &&
                  (hasCheckedOut ? (
                    /* Khối kết quả Check-out (Y hệt hình bạn gửi) */
                    <div
                      className="success-ui fade-in"
                      style={{ borderTop: "1px solid #eee", pt: "20px" }}
                    >
                      <CheckCircle2 size={60} color="#007bff" />
                      <h2
                        className="success-title"
                        style={{
                          color: "#007bff",
                          fontSize: "24px",
                          marginTop: "10px",
                        }}
                      >
                        Hẹn gặp lại!
                      </h2>
                      <p className="success-desc">
                        Bạn đã hoàn thành công việc hôm nay (Check-out lúc:{" "}
                        {checkOutTime})
                      </p>
                    </div>
                  ) : (
                    /* Nút Check-out nếu đã In nhưng chưa Out */
                    <div className="action-ui fade-in">
                      <button
                        onClick={handleCheckOut}
                        disabled={isSubmitting}
                        className={`main-btn btn-checkout ${isSubmitting ? "btn-disabled" : ""}`}
                      >
                        {isSubmitting
                          ? "ĐANG XỬ LÝ..."
                          : "XÁC NHẬN RA VỀ (CHECK OUT)"}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN CÁ NHÂN & LỊCH SỬ */}

        <div className="side-section">
          <div className="card profile-card">
            <div className="user-profile">
              <div className="avatar-box">
                <User size={30} color="#0056b3" />
              </div>

              <div>
                <span className="badge-working">Đang trực tuyến</span>
              </div>
            </div>

            <div className="device-info-list">
              <div className="info-item">
                <MapPin size={16} />{" "}
                <span>
                  WiFi: <strong>VN Tour_Office</strong>
                </span>
              </div>

              <div className="info-item">
                <Smartphone size={16} />{" "}
                <span>
                  Thiết bị: <strong>{deviceInfo}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="card history-card">
            <div className="d-flex justify-content-between">
              <h3 className="section-title">
                <History size={20} /> Lịch sử chấm công
              </h3>

              <div
                className="viewAll"
                onClick={() => navigate("/attendance-list")}
              >
                Xem tất cả
              </div>
            </div>

            <div className="history-list">
              {historyList.length > 0 ? (
                historyList.map((item, idx) => (
                  <div key={idx} className="history-row">
                    <div className="hist-day">
                      {new Date(item.workDate).toLocaleDateString("vi-VN", {
                        day: "2-digit",

                        month: "2-digit",

                        year: "numeric",
                      })}
                    </div>

                    <div className="hist-time">
                      {item.checkIn
                        ? item.checkIn.split("T")[1].substring(0, 8) // Lấy từ vị trí sau chữ T và lấy 8 ký tự (HH:mm:ss)
                        : "--:--"}
                    </div>

                    <div
                      className={`hist-status ${item.status === "ON_TIME" ? "" : "status-pending"}`}
                    >
                      {item.status === "ON_TIME" ? "Đúng giờ" : "Muộn"}
                    </div>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    textAlign: "center",

                    color: "#999",

                    marginTop: "10px",
                  }}
                >
                  Chưa có dữ liệu.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
