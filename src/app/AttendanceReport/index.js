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
  Modal,
} from "react-bootstrap";

import {
  FaUserCircle,
  FaCalendarAlt,
  FaSearch,
  FaClock,
  FaMapMarkerAlt,
  FaMobileAlt,
  FaUserClock,
  FaEdit,
  FaCheckCircle,
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
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [savingAdjust, setSavingAdjust] = useState(false);

  const [adjustForm, setAdjustForm] = useState({
    userId: "",
    workDate: localToday,
    checkIn: "09:00",
    checkOut: "17:00",
    reason: "",
  });

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

  const handleOpenAddAttendance = () => {
    setAdjustForm({
      userId: selectedUser || "",
      workDate: localToday,
      checkIn: "09:00",
      checkOut: "17:00",
      reason: "",
    });

    setShowAdjustModal(true);
  };
  const handleOpenEditAttendance = (item) => {
    setAdjustForm({
      userId: String(item.userId),

      workDate:
        typeof item.workDate === "string" ? item.workDate.substring(0, 10) : "",

      checkIn: item.checkIn ? item.checkIn.substring(11, 16) : "09:00",

      checkOut: item.checkOut ? item.checkOut.substring(11, 16) : "17:00",

      reason: item.adjustReason || "",
    });

    setShowAdjustModal(true);
  };
  const handleAdjustAttendance = async () => {
    if (!adjustForm.userId) {
      alert("Vui lòng chọn nhân viên.");
      return;
    }

    if (!adjustForm.workDate) {
      alert("Vui lòng chọn ngày làm việc.");
      return;
    }

    if (!adjustForm.checkIn) {
      alert("Vui lòng nhập giờ vào.");
      return;
    }

    if (!adjustForm.reason.trim()) {
      alert("Vui lòng nhập lý do kéo công.");
      return;
    }

    if (adjustForm.checkOut && adjustForm.checkOut <= adjustForm.checkIn) {
      alert("Giờ ra phải lớn hơn giờ vào.");
      return;
    }

    try {
      setSavingAdjust(true);

      const res = await APIToken.post("/admin/adjustAttendance", {
        userId: Number(adjustForm.userId),
        workDate: adjustForm.workDate,
        checkIn: adjustForm.checkIn,
        checkOut: adjustForm.checkOut || null,
        reason: adjustForm.reason.trim(),
      });

      alert(res.data.message || "Kéo công thành công.");

      setShowAdjustModal(false);

      await handleFetchReport();
    } catch (err) {
      console.error("Lỗi kéo công:", err);

      alert(
        err.response?.data?.message || "Không thể kéo công. Vui lòng thử lại.",
      );
    } finally {
      setSavingAdjust(false);
    }
  };
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-0 fw-bold text-dark">Danh sách chấm công</h5>
          <small className="text-muted">
            Theo dõi và điều chỉnh dữ liệu chấm công nhân viên
          </small>
        </div>

        <Button
          variant="warning"
          className="btn-adjust-attendance fw-bold px-4"
          onClick={handleOpenAddAttendance}
        >
          <FaUserClock className="me-2" />
          KÉO CÔNG
        </Button>
      </div>
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
                data.map((item) => (
                  <tr key={item.id}>
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
      <Modal
        show={showAdjustModal}
        onHide={() => {
          if (!savingAdjust) {
            setShowAdjustModal(false);
          }
        }}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton={!savingAdjust}>
          <Modal.Title className="d-flex align-items-center">
            <div className="adjust-modal-icon me-3">
              <FaUserClock />
            </div>

            <div>
              <div className="fw-bold">Kéo công nhân viên</div>

              <small className="text-muted fw-normal">
                Thêm mới hoặc điều chỉnh giờ chấm công
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="adjust-info-box mb-4">
            <FaCheckCircle className="me-2 text-success" />
            Hệ thống sẽ tự động tạo công nếu ngày này chưa có dữ liệu. Nếu đã
            có, dữ liệu chấm công sẽ được cập nhật.
          </div>

          <Row className="g-4">
            {/* NHÂN VIÊN */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="adjust-label">
                  Nhân viên
                  <span className="text-danger ms-1">*</span>
                </Form.Label>

                <InputGroup className="adjust-input-group">
                  <InputGroup.Text>
                    <FaUserCircle />
                  </InputGroup.Text>

                  <Form.Select
                    value={adjustForm.userId}
                    onChange={(e) =>
                      setAdjustForm({
                        ...adjustForm,
                        userId: e.target.value,
                      })
                    }
                    disabled={savingAdjust}
                  >
                    <option value="">-- Chọn nhân viên --</option>

                    {users.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.user_id} - {u.name}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Form.Group>
            </Col>

            {/* NGÀY LÀM VIỆC */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="adjust-label">
                  Ngày làm việc
                  <span className="text-danger ms-1">*</span>
                </Form.Label>

                <InputGroup className="adjust-input-group">
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>

                  <Form.Control
                    type="date"
                    value={adjustForm.workDate}
                    max={localToday}
                    onChange={(e) =>
                      setAdjustForm({
                        ...adjustForm,
                        workDate: e.target.value,
                      })
                    }
                    disabled={savingAdjust}
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            {/* GIỜ VÀO */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="adjust-label">
                  Giờ vào
                  <span className="text-danger ms-1">*</span>
                </Form.Label>

                <InputGroup className="adjust-input-group">
                  <InputGroup.Text>
                    <FaClock className="text-success" />
                  </InputGroup.Text>

                  <Form.Control
                    type="time"
                    value={adjustForm.checkIn}
                    onChange={(e) =>
                      setAdjustForm({
                        ...adjustForm,
                        checkIn: e.target.value,
                      })
                    }
                    disabled={savingAdjust}
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            {/* GIỜ RA */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="adjust-label">Giờ ra</Form.Label>

                <InputGroup className="adjust-input-group">
                  <InputGroup.Text>
                    <FaClock className="text-danger" />
                  </InputGroup.Text>

                  <Form.Control
                    type="time"
                    value={adjustForm.checkOut}
                    onChange={(e) =>
                      setAdjustForm({
                        ...adjustForm,
                        checkOut: e.target.value,
                      })
                    }
                    disabled={savingAdjust}
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            {/* GIỜ CHUẨN */}
            <Col md={12}>
              <div className="standard-time-box">
                <div>
                  <div className="fw-bold">Giờ làm việc chuẩn</div>

                  <small className="text-muted">
                    Nhấn để tự động điền giờ làm việc
                  </small>
                </div>

                <Button
                  variant="outline-success"
                  size="sm"
                  disabled={savingAdjust}
                  onClick={() =>
                    setAdjustForm({
                      ...adjustForm,
                      checkIn: "09:00",
                      checkOut: "17:00",
                    })
                  }
                >
                  <FaClock className="me-2" />
                  09:00 - 17:00
                </Button>
              </div>
            </Col>

            {/* LÝ DO */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="adjust-label">
                  Lý do kéo công
                  <span className="text-danger ms-1">*</span>
                </Form.Label>

                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Ví dụ: Nhân viên quên chấm công khi đến văn phòng..."
                  value={adjustForm.reason}
                  maxLength={500}
                  onChange={(e) =>
                    setAdjustForm({
                      ...adjustForm,
                      reason: e.target.value,
                    })
                  }
                  disabled={savingAdjust}
                  className="adjust-reason"
                />

                <div className="text-end mt-1">
                  <small className="text-muted">
                    {adjustForm.reason.length}/500
                  </small>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer className="adjust-modal-footer">
          <Button
            variant="light"
            className="px-4"
            disabled={savingAdjust}
            onClick={() => setShowAdjustModal(false)}
          >
            Hủy
          </Button>

          <Button
            variant="primary"
            className="px-4 fw-bold btn-save-adjust"
            disabled={savingAdjust}
            onClick={handleAdjustAttendance}
          >
            {savingAdjust ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <FaCheckCircle className="me-2" />
                XÁC NHẬN KÉO CÔNG
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AttendanceReport;
