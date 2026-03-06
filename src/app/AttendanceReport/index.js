import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Table,
  Spinner,
  Badge,
  InputGroup,
  Container,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import {
  FaUserCircle,
  FaCalendarAlt,
  FaSearch,
  FaClock,
  FaMapMarkerAlt,
  FaMobileAlt,
} from "react-icons/fa";
import APIToken from "../../config/APIToken";
import "./index.css";

const AttendanceReport = () => {
  // Hàm bổ trợ để lấy định dạng yyyy-mm-dd
  const formatDateString = (date) => date.toISOString().split("T")[0];

  // Khởi tạo mặc định: Đầu tháng và Hiện tại
  const getDefaultDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    // Lưu ý: toISOString() có thể bị lệch múi giờ, dùng cách này để an toàn với date input
    const offset = now.getTimezoneOffset() * 60000;
    const localToday = new Date(now - offset).toISOString().split("T")[0];
    const localFirstDay = new Date(firstDay - offset)
      .toISOString()
      .split("T")[0];

    return { localFirstDay, localToday };
  };

  const { localFirstDay, localToday } = getDefaultDates();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [fromDate, setFromDate] = useState(localToday);
  const [toDate, setToDate] = useState(localToday);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await APIToken.get("/user/get");
        setUsers(res.data.data || res.data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách nhân viên", err);
      }
    };
    fetchUsers();
  }, []);

  const handleFetchReport = async () => {
    setLoading(true);
    setFetched(true);
    try {
      const res = await APIToken.post("/getAttendanceHistory", {
        fromDate,
        toDate,
        userId: parseInt(selectedUser),
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu chấm công", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="admin-report-wrapper py-4">
      <Card className="report-filter-card mb-4 border-0 shadow-sm">
        <Card.Body>
          <h4
            className="mb-4 text-primary fw-bold text-uppercase"
            style={{ fontSize: "1.2rem", letterSpacing: "1px" }}
          >
            <FaSearch className="me-2" /> Báo cáo chấm công nhân viên
          </h4>
          <Row className="g-3 align-items-end">
            <Col lg={4} md={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">
                  CHỌN NHÂN VIÊN
                </Form.Label>
                <InputGroup className="custom-input-group">
                  <InputGroup.Text>
                    <FaUserCircle />
                  </InputGroup.Text>
                  <Form.Select
                    className="shadow-none"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="">-- Tất cả nhân viên --</option>
                    {users.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.user_id + "-" + u.name}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col lg={3} md={6} sm={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">
                  TỪ NGÀY
                </Form.Label>
                <InputGroup className="custom-input-group">
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>
                  <Form.Control
                    type="date"
                    className="shadow-none"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col lg={3} md={6} sm={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary">
                  ĐẾN NGÀY
                </Form.Label>
                <InputGroup className="custom-input-group">
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>
                  <Form.Control
                    type="date"
                    className="shadow-none"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col lg={2} md={12}>
              <Button
                variant="primary"
                className="w-100 fw-bold py-2 btn-search-report border-0 shadow-sm"
                onClick={handleFetchReport}
                disabled={loading}
              >
                {loading ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  "TRUY XUẤT"
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="report-content-card border-0 shadow-sm">
        <div className="table-responsive">
          <Table hover className="align-middle mb-0">
            <thead>
              <tr>
                <th className="ps-4">Ngày làm việc</th>
                <th>Nhân viên</th>
                <th>Giờ vào (Check-in)</th>
                <th>Giờ ra (Check-out)</th>
                <th>Tổng giờ làm</th>
                <th>Thiết bị / IP</th>
                <th className="text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {!fetched ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="empty-state">
                      <FaSearch
                        size={40}
                        className="mb-3 text-muted opacity-25"
                      />
                      <p className="text-muted">
                        Vui lòng chọn nhân viên để xem lịch sử chấm công
                      </p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-5 text-muted fst-italic"
                  >
                    Không tìm thấy dữ liệu chấm công trong khoảng thời gian này.
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item.userId}>
                    <td className="ps-4">
                      <div className="fw-bold text-dark">
                        {new Date(item.workDate).toLocaleDateString("vi-VN")}
                      </div>
                      <small className="text-muted text-capitalize">
                        {new Date(item.workDate).toLocaleDateString("vi-VN", {
                          weekday: "long",
                        })}
                      </small>
                    </td>
                    {/* Cột Nhân viên mới thêm */}
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                          style={{
                            width: "32px",
                            height: "32px",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                          }}
                        >
                          {item.fullName
                            ? item.fullName.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                        <div>
                          <div
                            className="fw-bold text-dark"
                            style={{ fontSize: "0.9rem" }}
                          >
                            {item.fullName || "N/A"}
                          </div>
                          <small
                            className="text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            User: {item.userId}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaClock className="text-success me-2" />
                        <span>
                          {item.checkIn
                            ? new Date(item.checkIn).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                },
                              )
                            : "--:--"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaClock className="text-danger me-2" />
                        <span>
                          {item.checkOut
                            ? new Date(item.checkOut).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                },
                              )
                            : "-:-"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge
                        bg="light"
                        className="text-dark border fw-medium px-3 py-2"
                        style={{ fontSize: "0.85rem" }}
                      >
                        {(() => {
                          // 1. Nếu thiếu checkIn hoặc thiếu checkOut thì không tính toán
                          if (!item.checkIn || !item.checkOut)
                            return "0.00 giờ";

                          const start = new Date(item.checkIn);
                          const end = new Date(item.checkOut);

                          // 2. Tính toán hiệu số giờ
                          const diffInMs = end - start;
                          const diffHours = diffInMs / (1000 * 60 * 60);

                          // 3. Đảm bảo kết quả không âm và hiển thị 2 số thập phân
                          return `${Math.max(0, diffHours).toFixed(2)} giờ`;
                        })()}
                      </Badge>
                    </td>
                    <td>
                      <div className="device-info">
                        <div
                          className="small text-truncate"
                          style={{ maxWidth: "150px" }}
                        >
                          <FaMobileAlt className="me-1 text-muted" />{" "}
                          {item.deviceIdUsed || "N/A"}
                        </div>
                        <div className="small text-muted">
                          <FaMapMarkerAlt className="me-1 text-muted" />{" "}
                          {item.ipAddress || "---"}
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <Badge
                        bg={
                          item.status === "ON_TIME"
                            ? "success"
                            : item.status === "LATE"
                              ? "danger"
                              : "secondary"
                        }
                        className="status-badge"
                      >
                        {item.status === "ON_TIME"
                          ? "Đúng giờ"
                          : item.status === "LATE"
                            ? "Đi trễ"
                            : "Vắng mặt"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </Container>
  );
};

export default AttendanceReport;
