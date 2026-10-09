import React, { useEffect, useState } from "react";

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
  FaCheckCircle,
} from "react-icons/fa";

import APIToken from "../../config/APIToken";

import "./index.css";

const AttendanceReport = () => {
  // ==========================================================
  // DATE
  // ==========================================================

  const getDefaultDates = () => {
    const now = new Date();

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const offset = now.getTimezoneOffset() * 60000;

    const localToday = new Date(now - offset).toISOString().split("T")[0];

    const localFirstDay = new Date(firstDay - offset)
      .toISOString()
      .split("T")[0];

    return {
      localFirstDay,
      localToday,
    };
  };

  const { localFirstDay, localToday } = getDefaultDates();

  // ==========================================================
  // DATA
  // ==========================================================

  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] = useState("");

  const [fromDate, setFromDate] = useState(localToday);

  const [toDate, setToDate] = useState(localToday);

  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(false);

  const [fetched, setFetched] = useState(false);

  // ==========================================================
  // ADJUST ATTENDANCE
  // ==========================================================

  const [showAdjustModal, setShowAdjustModal] = useState(false);

  const [savingAdjust, setSavingAdjust] = useState(false);

  const [adjustForm, setAdjustForm] = useState({
    userId: "",
    workDate: localToday,
    checkIn: "09:00",
    checkOut: "17:00",
    reason: "",
  });

  // ==========================================================
  // GET USERS
  // ==========================================================

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await APIToken.get("/user/get");

        const userData = res?.data?.data || res?.data || [];

        const sortedUsers = [...userData].sort(
          (a, b) => Number(b.user_id) - Number(a.user_id),
        );

        setUsers(sortedUsers);
      } catch (err) {
        console.error("Lỗi lấy danh sách nhân viên", err);
      }
    };

    fetchUsers();
  }, []);

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatWorkDate = (value) => {
    if (!value) {
      return "---";
    }

    return new Date(value).toLocaleDateString("vi-VN");
  };

  const formatWeekday = (value) => {
    if (!value) {
      return "";
    }

    return new Date(value).toLocaleDateString("vi-VN", {
      weekday: "long",
    });
  };

  // ==========================================================
  // FORMAT TIME
  // ==========================================================

  const formatTime = (value) => {
    if (!value) {
      return "--:--";
    }

    return new Date(value).toLocaleTimeString("vi-VN", {
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
      return "0.00 giờ";
    }

    const start = new Date(checkIn);

    const end = new Date(checkOut);

    const diffInMs = end - start;

    const diffHours = diffInMs / (1000 * 60 * 60);

    return `${Math.max(0, diffHours).toFixed(2)} giờ`;
  };

  // ==========================================================
  // OPEN ADD ATTENDANCE
  // ==========================================================

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

  // ==========================================================
  // ADJUST ATTENDANCE
  // ==========================================================

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

      alert(res?.data?.message || "Kéo công thành công.");

      setShowAdjustModal(false);

      await handleFetchReport();
    } catch (err) {
      console.error("Lỗi kéo công:", err);

      alert(
        err?.response?.data?.message || "Không thể kéo công. Vui lòng thử lại.",
      );
    } finally {
      setSavingAdjust(false);
    }
  };

  // ==========================================================
  // GET REPORT
  // ==========================================================

  const handleFetchReport = async () => {
    setLoading(true);

    setFetched(true);

    try {
      const payload = {
        fromDate,
        toDate,
      };

      if (selectedUser) {
        payload.userId = parseInt(selectedUser);
      }

      const res = await APIToken.post("/getAttendanceHistory", payload);

      setData(res?.data?.data || []);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu chấm công", err);

      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // STATUS
  // ==========================================================

  const renderStatus = (item) => {
    if (item.status === "ON_TIME") {
      return (
        <Badge bg="success" className="status-badge">
          Đúng giờ
        </Badge>
      );
    }

    if (item.status === "LATE") {
      return (
        <Badge bg="danger" className="status-badge">
          Đi trễ
        </Badge>
      );
    }

    return (
      <Badge bg="secondary" className="status-badge">
        Vắng mặt
      </Badge>
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Container fluid className="admin-report-wrapper">
      {/* =====================================================
          FILTER
      ===================================================== */}

      <Card className="report-filter-card border-0">
        <Card.Body>
          <div className="report-filter-title">
            <FaSearch />

            <span>Báo cáo chấm công nhân viên</span>
          </div>

          <Row className="g-3 align-items-end">
            {/* EMPLOYEE */}

            <Col lg={4} md={12}>
              <Form.Group>
                <Form.Label className="report-label">Chọn nhân viên</Form.Label>

                <InputGroup className="custom-input-group">
                  <InputGroup.Text>
                    <FaUserCircle />
                  </InputGroup.Text>

                  <Form.Select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="">-- Tất cả nhân viên --</option>

                    {users.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.user_id} - {u.name}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Form.Group>
            </Col>

            {/* FROM DATE */}

            <Col lg={3} md={6} sm={6}>
              <Form.Group>
                <Form.Label className="report-label">Từ ngày</Form.Label>

                <InputGroup className="custom-input-group">
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>

                  <Form.Control
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            {/* TO DATE */}

            <Col lg={3} md={6} sm={6}>
              <Form.Group>
                <Form.Label className="report-label">Đến ngày</Form.Label>

                <InputGroup className="custom-input-group">
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>

                  <Form.Control
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            {/* SEARCH */}

            <Col lg={2} md={12}>
              <Button
                className="w-100 btn-search-report"
                onClick={handleFetchReport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Đang tải
                  </>
                ) : (
                  "TRUY XUẤT"
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* =====================================================
          REPORT HEADER
      ===================================================== */}

      <div className="report-list-header">
        <div>
          <h5>Danh sách chấm công</h5>

          <small>Theo dõi và điều chỉnh dữ liệu chấm công nhân viên</small>
        </div>

        <Button
          variant="warning"
          className="btn-adjust-attendance"
          onClick={handleOpenAddAttendance}
        >
          <FaUserClock />

          <span>Kéo công</span>
        </Button>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <Card className="report-content-card border-0">
        <div className="table-responsive report-table-responsive">
          <Table hover className="report-table align-middle mb-0">
            <thead>
              <tr>
                <th>Ngày làm việc</th>

                <th>Nhân viên</th>

                <th>Giờ vào</th>

                <th>Giờ ra</th>

                <th>Tổng giờ</th>

                <th>Thiết bị / IP</th>

                <th className="text-center">Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="report-empty-cell">
                    <Spinner animation="border" variant="primary" />

                    <span>Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : !fetched ? (
                <tr>
                  <td colSpan="7" className="report-empty-cell">
                    <div className="empty-state">
                      <FaSearch />

                      <p>
                        Chọn nhân viên và khoảng thời gian để xem lịch sử chấm
                        công
                      </p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="report-empty-cell">
                    Không tìm thấy dữ liệu chấm công trong khoảng thời gian này.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={item.id || `${item.userId}-${item.workDate}-${index}`}
                  >
                    {/* DATE */}

                    <td data-label="Ngày làm việc">
                      <div className="report-date">
                        <strong>{formatWorkDate(item.workDate)}</strong>

                        <small>{formatWeekday(item.workDate)}</small>
                      </div>
                    </td>

                    {/* EMPLOYEE */}

                    <td data-label="Nhân viên">
                      <div className="report-user">
                        <div className="report-user-avatar">
                          {item.fullName
                            ? item.fullName.trim().charAt(0).toUpperCase()
                            : "U"}
                        </div>

                        <div className="report-user-info">
                          <strong>{item.fullName || "N/A"}</strong>

                          <small>ID: {item.userId}</small>
                        </div>
                      </div>
                    </td>

                    {/* CHECK IN */}

                    <td data-label="Giờ vào">
                      <div className="report-time">
                        <FaClock className="checkin" />

                        <span>{formatTime(item.checkIn)}</span>
                      </div>
                    </td>

                    {/* CHECK OUT */}

                    <td data-label="Giờ ra">
                      <div className="report-time">
                        <FaClock className="checkout" />

                        <span>
                          {item.checkOut ? formatTime(item.checkOut) : "--:--"}
                        </span>
                      </div>
                    </td>

                    {/* TOTAL */}

                    <td data-label="Tổng giờ">
                      <Badge bg="light" className="report-hours-badge">
                        {getWorkingHours(item.checkIn, item.checkOut)}
                      </Badge>
                    </td>

                    {/* DEVICE */}

                    <td data-label="Thiết bị / IP">
                      <div className="device-info">
                        <div>
                          <FaMobileAlt />

                          <span>{item.deviceIdUsed || "N/A"}</span>
                        </div>

                        <div>
                          <FaMapMarkerAlt />

                          <span>{item.ipAddress || "---"}</span>
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}

                    <td data-label="Trạng thái" className="text-center">
                      {renderStatus(item)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* =====================================================
          ADJUST MODAL
      ===================================================== */}

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
        keyboard={!savingAdjust}
      >
        <Modal.Header closeButton={!savingAdjust}>
          <Modal.Title className="adjust-modal-title">
            <div className="adjust-modal-icon">
              <FaUserClock />
            </div>

            <div>
              <strong>Kéo công nhân viên</strong>

              <small>Thêm mới hoặc điều chỉnh giờ chấm công</small>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="adjust-info-box">
            <FaCheckCircle />

            <span>
              Hệ thống sẽ tự động tạo công nếu ngày này chưa có dữ liệu. Nếu đã
              có, dữ liệu chấm công sẽ được cập nhật.
            </span>
          </div>

          <Row className="g-3">
            {/* EMPLOYEE */}

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

            {/* DATE */}

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

            {/* CHECK IN */}

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

            {/* CHECK OUT */}

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

            {/* STANDARD */}

            <Col md={12}>
              <div className="standard-time-box">
                <div>
                  <strong>Giờ làm việc chuẩn</strong>

                  <small>Nhấn để tự động điền giờ làm việc</small>
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

            {/* REASON */}

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

                <div className="adjust-counter">
                  {adjustForm.reason.length}
                  /500
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer className="adjust-modal-footer">
          <Button
            variant="light"
            disabled={savingAdjust}
            onClick={() => setShowAdjustModal(false)}
          >
            Hủy
          </Button>

          <Button
            variant="primary"
            className="btn-save-adjust"
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
                Xác nhận kéo công
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AttendanceReport;
