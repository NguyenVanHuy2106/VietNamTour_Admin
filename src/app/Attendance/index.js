import React, { useState, useEffect } from "react";
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

const Attendance = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null); // null, 'success', 'error'
  const [deviceInfo, setDeviceInfo] = useState("Đang xác định...");
  const [historyList, setHistoryList] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);

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
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.user_id || 1001;

      const response = await APIToken.post("/getUserAtendance", {
        userId: userId,
      });

      if (response.data.success) {
        const data = response.data.data;
        setHistoryList(data);

        // LOGIC KIỂM TRA NGÀY HÔM NAY
        const todayStr = new Date().toLocaleDateString("en-CA"); // Định dạng YYYY-MM-DD chuẩn

        const todayRecord = data.find((item) => {
          const recordDate = new Date(item.workDate).toLocaleDateString(
            "en-CA",
          );
          return recordDate === todayStr;
        });

        if (todayRecord) {
          setAttendanceStatus("success");
          setMessage(
            `Bạn đã hoàn thành chấm công hôm nay lúc ${new Date(todayRecord.checkIn).toLocaleTimeString("vi-VN")}`,
          );
        } else {
          setAttendanceStatus(null); // Chưa chấm thì để null để hiện nút
        }
      }
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);
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
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await APIToken.post("/submitAtendance", {
        user_id: user?.user_id || 1001,
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
            ) : attendanceStatus === "success" ? (
              <div className="success-ui fade-in">
                <CheckCircle2 size={70} color="#28a745" />
                <h2 className="success-title" style={{ color: "#28a745" }}>
                  Đã chấm công
                </h2>
                <p className="success-desc">{message}</p>
              </div>
            ) : (
              <div className="action-ui">
                {attendanceStatus === "error" && (
                  <div className="error-box">
                    <AlertCircle size={18} /> {message}
                  </div>
                )}
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
                <h3 className="user-name">Nguyễn Huy</h3>
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
            <h3 className="section-title">
              <History size={20} /> Lịch sử chấm công
            </h3>
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
                        ? new Date(item.checkIn).toLocaleTimeString("vi-VN")
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
