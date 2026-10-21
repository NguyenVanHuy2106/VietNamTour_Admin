import React, { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  Nav,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";

import {
  FaArrowLeft,
  FaCalculator,
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaExclamationTriangle,
  FaHistory,
  FaMoneyBillWave,
  FaRedo,
  FaSearch,
  FaUsers,
} from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import APIToken from "../../../config/APIToken";

import "./index.css";

const PayrollWorkspace = () => {
  const { periodId } = useParams();

  const navigate = useNavigate();

  // ==========================================================
  // TAB
  // ==========================================================

  const [activeTab, setActiveTab] = useState("ATTENDANCE");

  // ==========================================================
  // DATA
  // ==========================================================

  const [period, setPeriod] = useState(null);

  const [attendances, setAttendances] = useState([]);

  const [payrolls, setPayrolls] = useState([]);

  const [logs, setLogs] = useState([]);

  // ==========================================================
  // LOADING
  // ==========================================================

  const [loading, setLoading] = useState(true);

  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [payrollLoading, setPayrollLoading] = useState(false);

  const [logLoading, setLogLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [syncingAttendance, setSyncingAttendance] = useState(false);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [attendanceSearch, setAttendanceSearch] = useState("");

  const [payrollSearch, setPayrollSearch] = useState("");

  // ==========================================================
  // ATTENDANCE ADJUST MODAL
  // ==========================================================

  const [showAttendanceAdjust, setShowAttendanceAdjust] = useState(false);

  const [selectedAttendance, setSelectedAttendance] = useState(null);

  const [attendanceAdjustForm, setAttendanceAdjustForm] = useState({
    adjustment_type: "ADD",
    adjustment_value: "",
    adjustment_date: "",
    reason: "",
  });

  // ==========================================================
  // PAYROLL DETAIL
  // ==========================================================

  const [showPayrollDetail, setShowPayrollDetail] = useState(false);

  const [selectedPayroll, setSelectedPayroll] = useState(null);

  // ==========================================================
  // PAYROLL ADJUST
  // ==========================================================

  const [showPayrollAdjust, setShowPayrollAdjust] = useState(false);

  const [payrollAdjustForm, setPayrollAdjustForm] = useState({
    adjustment_type: "ALLOWANCE",
    adjustment_name: "",
    amount: "",
    note: "",
  });

  // ==========================================================
  // FETCH PERIOD
  // ==========================================================

  const fetchPeriod = async () => {
    try {
      const res = await APIToken.get(`/salary/period/get/${periodId}`);

      setPeriod(res?.data?.data || null);
    } catch (error) {
      console.error("Lỗi lấy kỳ lương:", error);
    }
  };

  // ==========================================================
  // FETCH ATTENDANCE
  // ==========================================================

  const fetchAttendances = async () => {
    try {
      setAttendanceLoading(true);

      const res = await APIToken.get("/salary/attendance/get", {
        params: {
          payroll_period_id: periodId,
        },
      });

      setAttendances(res?.data?.data || []);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu công:", error);

      setAttendances([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // ==========================================================
  // FETCH PAYROLL
  // ==========================================================

  const fetchPayrolls = async () => {
    try {
      setPayrollLoading(true);

      const res = await APIToken.get(`/salary/payroll/period/${periodId}`);

      setPayrolls(res?.data?.data || []);
    } catch (error) {
      console.error("Lỗi lấy bảng lương:", error);

      setPayrolls([]);
    } finally {
      setPayrollLoading(false);
    }
  };

  // ==========================================================
  // FETCH LOG
  // ==========================================================

  const fetchLogs = async () => {
    try {
      setLogLoading(true);

      const res = await APIToken.get("/salary/log/get", {
        params: {
          payroll_period_id: periodId,
        },
      });

      setLogs(res?.data?.data || []);
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);

      setLogs([]);
    } finally {
      setLogLoading(false);
    }
  };

  // ==========================================================
  // REFRESH ALL
  // ==========================================================

  const refreshAll = async () => {
    try {
      setLoading(true);

      await Promise.all([fetchPeriod(), fetchAttendances(), fetchPayrolls()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, [periodId]);

  useEffect(() => {
    if (activeTab === "HISTORY") {
      fetchLogs();
    }
  }, [activeTab]);

  // ==========================================================
  // FORMAT
  // ==========================================================

  const formatDate = (value) => {
    if (!value) {
      return "---";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "---";
    }

    return new Date(value).toLocaleString("vi-VN");
  };

  const formatMoney = (value) => {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
  };

  const formatWorkDay = (value) => {
    const number = Number(value || 0);

    if (Number.isInteger(number)) {
      return number;
    }

    return number.toFixed(1);
  };

  // ==========================================================
  // PERIOD STATUS
  // ==========================================================

  const getPeriodStatus = (status) => {
    switch (status) {
      case "OPEN":
        return {
          label: "Đang xử lý công",
          variant: "warning",
        };

      case "ATTENDANCE_CONFIRMED":
        return {
          label: "Đã xác nhận công",
          variant: "info",
        };

      case "CALCULATED":
        return {
          label: "Đã tính lương",
          variant: "primary",
        };

      case "PUBLISHED":
        return {
          label: "Đã công bố",
          variant: "success",
        };

      case "CLOSED":
        return {
          label: "Đã đóng kỳ",
          variant: "secondary",
        };

      default:
        return {
          label: status || "---",
          variant: "secondary",
        };
    }
  };

  // ==========================================================
  // EMPLOYEE TYPE
  // ==========================================================

  const getEmployeeTypeInfo = (type) => {
    switch (type) {
      case "OFFICIAL":
        return {
          label: "Chính thức",
          variant: "primary",
        };

      case "PROBATION":
        return {
          label: "Thử việc",
          variant: "info",
        };

      case "INTERN":
        return {
          label: "Thực tập",
          variant: "warning",
        };

      case "PART_TIME":
        return {
          label: "Bán thời gian",
          variant: "secondary",
        };

      case "COLLABORATOR":
        return {
          label: "Cộng tác viên",
          variant: "dark",
        };

      default:
        return {
          label: type || "---",
          variant: "secondary",
        };
    }
  };

  // ==========================================================
  // ATTENDANCE STATUS
  // ==========================================================

  const renderAttendanceStatus = (status) => {
    if (status === "CONFIRMED") {
      return <Badge bg="success">Đã xác nhận</Badge>;
    }

    if (status === "CHANGED") {
      return (
        <Badge bg="warning" text="dark">
          Công đã thay đổi
        </Badge>
      );
    }

    return <Badge bg="secondary">Chưa xác nhận</Badge>;
  };

  // ==========================================================
  // PAYROLL STATUS
  // ==========================================================

  const renderPayrollStatus = (status) => {
    if (status === "CALCULATED") {
      return <Badge bg="primary">Đã tính</Badge>;
    }

    if (status === "OUTDATED") {
      return <Badge bg="danger">Cần tính lại</Badge>;
    }

    if (status === "PUBLISHED") {
      return <Badge bg="success">Đã công bố</Badge>;
    }

    return <Badge bg="secondary">Chưa tính</Badge>;
  };

  // ==========================================================
  // FILTER ATTENDANCE
  // ==========================================================

  const filteredAttendances = useMemo(() => {
    const search = attendanceSearch.trim().toLowerCase();

    if (!search) {
      return attendances;
    }

    return attendances.filter((item) => {
      const name = item.user?.name || item.employee_name || "";

      const position = item.user?.position || item.employee_position || "";

      const type = item.employee_type || "";

      return (
        name.toLowerCase().includes(search) ||
        position.toLowerCase().includes(search) ||
        type.toLowerCase().includes(search)
      );
    });
  }, [attendances, attendanceSearch]);

  // ==========================================================
  // FILTER PAYROLL
  // ==========================================================

  const filteredPayrolls = useMemo(() => {
    const search = payrollSearch.trim().toLowerCase();

    if (!search) {
      return payrolls;
    }

    return payrolls.filter((item) => {
      const name = item.employee_name || item.user?.name || "";

      const position = item.employee_position || "";

      return (
        name.toLowerCase().includes(search) ||
        position.toLowerCase().includes(search)
      );
    });
  }, [payrolls, payrollSearch]);

  // ==========================================================
  // ATTENDANCE SUMMARY
  // ==========================================================

  const attendanceSummary = useMemo(() => {
    const total = attendances.length;

    const confirmed = attendances.filter(
      (item) => item.status === "CONFIRMED",
    ).length;

    const changed = attendances.filter(
      (item) => item.status === "CHANGED",
    ).length;

    return {
      total,

      confirmed,

      changed,

      pending: total - confirmed,
    };
  }, [attendances]);

  // ==========================================================
  // SYNC ATTENDANCE
  // Backend tự:
  // - query timekeeping
  // - tính công thực tế
  // - lấy employee_type
  // - tính standard_work_days từng người
  // ==========================================================

  const handleSyncAttendance = async () => {
    if (!period) {
      alert("Không tìm thấy kỳ lương.");

      return;
    }

    const confirmed = window.confirm(
      `Lấy dữ liệu chấm công từ ${formatDate(
        period.start_date,
      )} đến ${formatDate(
        period.end_date,
      )}?\n\nHệ thống sẽ tự tính công thực tế và công chuẩn riêng cho từng nhân viên.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSyncingAttendance(true);

      const res = await APIToken.post("/salary/attendance/sync", {
        payroll_period_id: Number(periodId),
      });

      alert(res?.data?.message || "Đồng bộ dữ liệu công thành công.");

      await refreshAll();
    } catch (error) {
      console.error("Sync attendance error:", error);

      alert(
        error?.response?.data?.message || "Không thể lấy dữ liệu chấm công.",
      );
    } finally {
      setSyncingAttendance(false);
    }
  };

  // ==========================================================
  // OPEN ATTENDANCE ADJUST
  // ==========================================================

  const handleOpenAttendanceAdjust = (item) => {
    setSelectedAttendance(item);

    setAttendanceAdjustForm({
      adjustment_type: "ADD",

      adjustment_value: "",

      adjustment_date: "",

      reason: "",
    });

    setShowAttendanceAdjust(true);
  };

  // ==========================================================
  // SAVE ATTENDANCE ADJUSTMENT
  // ==========================================================

  const handleAttendanceAdjust = async () => {
    if (!selectedAttendance) {
      return;
    }

    if (Number(attendanceAdjustForm.adjustment_value) <= 0) {
      alert("Số công điều chỉnh phải lớn hơn 0.");

      return;
    }

    if (!attendanceAdjustForm.reason.trim()) {
      alert("Vui lòng nhập lý do điều chỉnh.");

      return;
    }

    try {
      setActionLoading(true);

      const res = await APIToken.post(
        `/salary/attendance/adjust/${selectedAttendance.payroll_attendance_id}`,
        {
          adjustment_type: attendanceAdjustForm.adjustment_type,

          adjustment_value: Number(attendanceAdjustForm.adjustment_value),

          adjustment_date: attendanceAdjustForm.adjustment_date || null,

          reason: attendanceAdjustForm.reason.trim(),
        },
      );

      alert(res?.data?.message || "Điều chỉnh công thành công.");

      setShowAttendanceAdjust(false);

      await refreshAll();
    } catch (error) {
      console.error("Attendance adjustment error:", error);

      alert(error?.response?.data?.message || "Không thể điều chỉnh công.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // CONFIRM ONE
  // ==========================================================

  const handleConfirmAttendance = async (item) => {
    try {
      setActionLoading(true);

      const res = await APIToken.post(
        `/salary/attendance/confirm/${item.payroll_attendance_id}`,
      );

      alert(res?.data?.message || "Xác nhận công thành công.");

      await refreshAll();
    } catch (error) {
      console.error("Confirm attendance error:", error);

      alert(error?.response?.data?.message || "Không thể xác nhận công.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // CONFIRM ALL
  // ==========================================================

  const handleConfirmAll = async () => {
    if (!window.confirm("Xác nhận toàn bộ công của nhân viên trong kỳ này?")) {
      return;
    }

    try {
      setActionLoading(true);

      const res = await APIToken.post("/salary/attendance/confirm-all", {
        payroll_period_id: Number(periodId),
      });

      alert(res?.data?.message || "Đã xác nhận toàn bộ công.");

      await refreshAll();
    } catch (error) {
      console.error("Confirm all attendance error:", error);

      alert(
        error?.response?.data?.message || "Không thể xác nhận toàn bộ công.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // CALCULATE PAYROLL
  // ==========================================================

  const handleCalculatePayroll = async () => {
    try {
      setActionLoading(true);

      const res = await APIToken.post(`/salary/payroll/calculate/${periodId}`);

      alert(res?.data?.message || "Tính lương thành công.");

      await refreshAll();

      setActiveTab("PAYROLL");
    } catch (error) {
      console.error("Calculate payroll error:", error);

      alert(error?.response?.data?.message || "Không thể tính lương.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // PUBLISH
  // ==========================================================

  const handlePublish = async () => {
    if (!window.confirm("Bạn chắc chắn muốn công bố bảng lương này?")) {
      return;
    }

    try {
      setActionLoading(true);

      const res = await APIToken.post(`/salary/payroll/publish/${periodId}`);

      alert(res?.data?.message || "Công bố bảng lương thành công.");

      await refreshAll();
    } catch (error) {
      console.error("Publish payroll error:", error);

      alert(error?.response?.data?.message || "Không thể công bố bảng lương.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // PAYROLL DETAIL
  // ==========================================================

  const handleOpenPayrollDetail = (item) => {
    setSelectedPayroll(item);

    setShowPayrollDetail(true);
  };

  // ==========================================================
  // OPEN PAYROLL ADJUST
  // ==========================================================

  const handleOpenPayrollAdjust = (type) => {
    setPayrollAdjustForm({
      adjustment_type: type,

      adjustment_name: "",

      amount: "",

      note: "",
    });

    setShowPayrollAdjust(true);
  };

  // ==========================================================
  // SAVE PAYROLL ADJUSTMENT
  // ==========================================================

  const handlePayrollAdjustment = async () => {
    if (!selectedPayroll) {
      return;
    }

    if (!payrollAdjustForm.adjustment_name.trim()) {
      alert("Vui lòng nhập nội dung điều chỉnh.");

      return;
    }

    if (Number(payrollAdjustForm.amount) <= 0) {
      alert("Số tiền phải lớn hơn 0.");

      return;
    }

    try {
      setActionLoading(true);

      const res = await APIToken.post("/salary/payroll/adjustment/add", {
        employee_payroll_id: selectedPayroll.employee_payroll_id,

        adjustment_type: payrollAdjustForm.adjustment_type,

        adjustment_name: payrollAdjustForm.adjustment_name.trim(),

        amount: Number(payrollAdjustForm.amount),

        note: payrollAdjustForm.note.trim() || null,
      });

      alert(res?.data?.message || "Thêm điều chỉnh thành công.");

      setShowPayrollAdjust(false);

      setShowPayrollDetail(false);

      await refreshAll();
    } catch (error) {
      console.error("Payroll adjustment error:", error);

      alert(
        error?.response?.data?.message || "Không thể thêm điều chỉnh lương.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // CONDITIONS
  // ==========================================================

  const allConfirmed =
    attendances.length > 0 &&
    attendances.every((item) => item.status === "CONFIRMED");

  const hasOutdatedPayroll = payrolls.some(
    (item) => item.status === "OUTDATED",
  );

  const canPublish =
    payrolls.length > 0 &&
    payrolls.every((item) => item.status === "CALCULATED");

  // ==========================================================
  // LOADING PAGE
  // ==========================================================

  if (loading && !period) {
    return (
      <Container fluid className="payroll-workspace-page">
        <div className="workspace-loading">
          <Spinner animation="border" />

          <span>Đang tải kỳ lương...</span>
        </div>
      </Container>
    );
  }

  const periodStatus = getPeriodStatus(period?.status);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Container fluid className="payroll-workspace-page">
      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        className="workspace-back-btn"
        onClick={() => navigate("/PayrollPeriods")}
      >
        <FaArrowLeft />
        Quay lại danh sách kỳ lương
      </button>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <Card className="workspace-header-card border-0">
        <Card.Body>
          <div className="workspace-header">
            <div className="workspace-title-row">
              <div className="workspace-main-icon">
                <FaMoneyBillWave />
              </div>

              <div>
                <h4>{period?.period_name || "Kỳ lương"}</h4>

                <div className="workspace-subtitle">
                  <span>
                    <FaCalendarAlt />

                    {formatDate(period?.start_date)}

                    {" - "}

                    {formatDate(period?.end_date)}
                  </span>

                  <span>
                    <FaClock />
                    Công chuẩn được tính riêng theo từng nhân viên
                  </span>
                </div>
              </div>
            </div>

            <Badge bg={periodStatus.variant} className="workspace-status">
              {periodStatus.label}
            </Badge>
          </div>

          {/* COMPANY RULE */}

          <div className="company-working-rule">
            <div className="working-rule-item">
              <FaCalendarAlt />

              <span>Nhân viên full-time: Thứ 2 - Thứ 6</span>
            </div>

            <div className="working-rule-item">
              <FaClock />

              <span>Ca sáng: 09:00 - 12:00</span>
            </div>

            <div className="working-rule-item">
              <FaClock />

              <span>Ca chiều: 13:00 - 17:00</span>
            </div>
          </div>

          {/* SUMMARY */}

          <Row className="g-3 workspace-summary">
            <Col xl={3} md={6}>
              <div className="summary-card">
                <div>
                  <small>Nhân viên</small>

                  <strong>{attendanceSummary.total}</strong>
                </div>

                <FaUsers />
              </div>
            </Col>

            <Col xl={3} md={6}>
              <div className="summary-card success">
                <div>
                  <small>Đã xác nhận</small>

                  <strong>{attendanceSummary.confirmed}</strong>
                </div>

                <FaCheckCircle />
              </div>
            </Col>

            <Col xl={3} md={6}>
              <div className="summary-card warning">
                <div>
                  <small>Chờ xác nhận</small>

                  <strong>{attendanceSummary.pending}</strong>
                </div>

                <FaClock />
              </div>
            </Col>

            <Col xl={3} md={6}>
              <div className="summary-card primary">
                <div>
                  <small>Bảng lương</small>

                  <strong>{payrolls.length}</strong>
                </div>

                <FaCalculator />
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <Card className="workspace-main-card border-0">
        {/* TABS */}

        <div className="workspace-tabs">
          <Nav
            variant="tabs"
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key)}
          >
            <Nav.Item>
              <Nav.Link eventKey="ATTENDANCE">
                <FaClock />
                Công
              </Nav.Link>
            </Nav.Item>

            <Nav.Item>
              <Nav.Link eventKey="PAYROLL">
                <FaMoneyBillWave />
                Bảng lương
                {hasOutdatedPayroll && <span className="tab-alert-dot" />}
              </Nav.Link>
            </Nav.Item>

            <Nav.Item>
              <Nav.Link eventKey="HISTORY">
                <FaHistory />
                Lịch sử
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>

        {/* =====================================================
            ATTENDANCE TAB
        ===================================================== */}

        {activeTab === "ATTENDANCE" && (
          <div className="workspace-tab-body">
            <div className="workspace-section-header">
              <div>
                <h5>Xác nhận ngày công</h5>

                <small>
                  Công chuẩn và công thực tế được hệ thống tự tính theo từng
                  nhân viên
                </small>
              </div>

              <div className="workspace-header-actions">
                <Button
                  variant="outline-primary"
                  disabled={syncingAttendance || actionLoading}
                  onClick={handleSyncAttendance}
                >
                  {syncingAttendance ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      Đang lấy...
                    </>
                  ) : (
                    <>
                      <FaRedo />

                      {attendances.length > 0
                        ? "Cập nhật lại công"
                        : "Lấy dữ liệu chấm công"}
                    </>
                  )}
                </Button>

                <Button
                  variant="success"
                  disabled={actionLoading || attendances.length === 0}
                  onClick={handleConfirmAll}
                >
                  <FaCheck />
                  Xác nhận tất cả
                </Button>
              </div>
            </div>

            {/* ALERT */}

            {attendanceSummary.changed > 0 && (
              <Alert variant="warning">
                <FaExclamationTriangle className="me-2" />
                Có <strong>{attendanceSummary.changed}</strong> nhân viên có dữ
                liệu công thay đổi. Vui lòng xác nhận lại trước khi tính lương.
              </Alert>
            )}

            {/* SEARCH */}

            <div className="workspace-search-row">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>

                <Form.Control
                  placeholder="Tìm theo tên, vị trí..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                />
              </InputGroup>
            </div>

            {/* TABLE */}

            <div className="table-responsive">
              <Table hover className="workspace-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Nhân viên</th>

                    <th>Loại nhân sự</th>

                    <th className="text-center">Công chuẩn</th>

                    <th className="text-center">Công chấm công</th>

                    <th className="text-center">Điều chỉnh</th>

                    <th className="text-center">Công tính lương</th>

                    <th>Trạng thái</th>

                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {attendanceLoading ? (
                    <tr>
                      <td colSpan="8" className="workspace-empty">
                        <Spinner animation="border" />

                        <span>Đang tải dữ liệu...</span>
                      </td>
                    </tr>
                  ) : filteredAttendances.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="workspace-empty">
                        <div className="attendance-empty-state">
                          <FaClock />

                          <strong>Chưa có dữ liệu chấm công</strong>

                          <span>
                            {formatDate(period?.start_date)}

                            {" - "}

                            {formatDate(period?.end_date)}
                          </span>

                          <small>
                            Backend sẽ tự tính công chuẩn và công thực tế của
                            từng nhân viên
                          </small>

                          <Button
                            variant="primary"
                            size="sm"
                            disabled={syncingAttendance}
                            onClick={handleSyncAttendance}
                          >
                            {syncingAttendance ? (
                              <>
                                <Spinner
                                  animation="border"
                                  size="sm"
                                  className="me-2"
                                />
                                Đang lấy...
                              </>
                            ) : (
                              <>
                                <FaRedo className="me-2" />
                                Lấy dữ liệu chấm công
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAttendances.map((item) => {
                      const employeeType =
                        item.employee_type ||
                        item.salary_config?.employee_type ||
                        item.user?.employee_type;

                      const typeInfo = getEmployeeTypeInfo(employeeType);

                      return (
                        <tr key={item.payroll_attendance_id}>
                          {/* EMPLOYEE */}

                          <td data-label="Nhân viên">
                            <div className="workspace-user">
                              <div className="workspace-avatar">
                                {String(
                                  item.user?.name || item.employee_name || "U",
                                )
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {item.user?.name ||
                                    item.employee_name ||
                                    "---"}
                                </strong>

                                <small>
                                  {item.user?.position ||
                                    item.employee_position ||
                                    `ID: ${item.user_id}`}
                                </small>
                              </div>
                            </div>
                          </td>

                          {/* EMPLOYEE TYPE */}

                          <td data-label="Loại nhân sự">
                            <Badge
                              bg={typeInfo.variant}
                              className="employee-type-badge"
                            >
                              {typeInfo.label}
                            </Badge>
                          </td>

                          {/* STANDARD */}

                          <td data-label="Công chuẩn" className="text-center">
                            <div className="standard-workday-box">
                              <strong>
                                {formatWorkDay(item.standard_work_days)}
                              </strong>

                              <small>ngày</small>
                            </div>
                          </td>

                          {/* ACTUAL */}

                          <td
                            data-label="Công chấm công"
                            className="text-center"
                          >
                            <div className="system-workday">
                              <strong>
                                {formatWorkDay(item.attendance_work_days)}
                              </strong>

                              <small>thực tế</small>
                            </div>
                          </td>

                          {/* ADJUSTMENT */}

                          <td data-label="Điều chỉnh" className="text-center">
                            <span
                              className={
                                Number(item.adjustment_work_days || 0) >= 0
                                  ? "workday-plus"
                                  : "workday-minus"
                              }
                            >
                              {Number(item.adjustment_work_days || 0) > 0
                                ? "+"
                                : ""}

                              {formatWorkDay(item.adjustment_work_days)}
                            </span>
                          </td>

                          {/* CONFIRMED */}

                          <td
                            data-label="Công tính lương"
                            className="text-center"
                          >
                            <span className="confirmed-workday">
                              {formatWorkDay(item.confirmed_work_days)}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td data-label="Trạng thái">
                            {renderAttendanceStatus(item.status)}

                            <small className="version-text">
                              Công V{item.attendance_version}
                            </small>
                          </td>

                          {/* ACTION */}

                          <td data-label="Thao tác" className="text-end">
                            <div className="workspace-row-actions">
                              <Button
                                variant="outline-warning"
                                onClick={() => handleOpenAttendanceAdjust(item)}
                              >
                                <FaEdit />
                                +/- Công
                              </Button>

                              {item.status !== "CONFIRMED" && (
                                <Button
                                  variant="success"
                                  disabled={actionLoading}
                                  onClick={() => handleConfirmAttendance(item)}
                                >
                                  <FaCheck />
                                  Xác nhận
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>

            {/* FOOTER */}

            {attendances.length > 0 && (
              <div className="workspace-action-footer">
                <div>
                  {!allConfirmed ? (
                    <span className="action-warning">
                      <FaExclamationTriangle />
                      Còn {attendanceSummary.pending} nhân viên chưa xác nhận
                      công
                    </span>
                  ) : (
                    <span className="action-success">
                      <FaCheckCircle />
                      Toàn bộ công đã được xác nhận
                    </span>
                  )}
                </div>

                <Button
                  variant="primary"
                  disabled={!allConfirmed || actionLoading}
                  onClick={handleCalculatePayroll}
                >
                  {actionLoading ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <FaCalculator />

                      {payrolls.length > 0 ? "TÍNH LẠI LƯƠNG" : "TÍNH LƯƠNG"}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            PAYROLL TAB
        ===================================================== */}

        {activeTab === "PAYROLL" && (
          <div className="workspace-tab-body">
            <div className="workspace-section-header">
              <div>
                <h5>Bảng lương</h5>

                <small>Kiểm tra chi tiết lương trước khi công bố</small>
              </div>

              <div className="workspace-header-actions">
                <Button
                  variant={hasOutdatedPayroll ? "warning" : "outline-primary"}
                  disabled={!allConfirmed || actionLoading}
                  onClick={handleCalculatePayroll}
                >
                  <FaRedo />

                  {payrolls.length === 0 ? "Tính lương" : "Tính lại"}
                </Button>

                <Button
                  variant="success"
                  disabled={
                    !canPublish ||
                    actionLoading ||
                    period?.status === "PUBLISHED"
                  }
                  onClick={handlePublish}
                >
                  <FaCheckCircle />

                  {period?.status === "PUBLISHED" ? "Đã công bố" : "Công bố"}
                </Button>
              </div>
            </div>

            {hasOutdatedPayroll && (
              <Alert variant="danger">
                <FaExclamationTriangle className="me-2" />
                Có dữ liệu lương cần tính lại do công hoặc khoản điều chỉnh đã
                thay đổi.
              </Alert>
            )}

            {/* SEARCH */}

            <div className="workspace-search-row">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>

                <Form.Control
                  placeholder="Tìm nhân viên..."
                  value={payrollSearch}
                  onChange={(e) => setPayrollSearch(e.target.value)}
                />
              </InputGroup>
            </div>

            {/* TABLE */}

            <div className="table-responsive">
              <Table hover className="workspace-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Nhân viên</th>

                    <th>Loại</th>

                    <th className="text-center">Công</th>

                    <th>Lương theo công</th>

                    <th>Phụ cấp</th>

                    <th>Bảo hiểm</th>

                    <th>Thưởng / Trừ</th>

                    <th>Thực nhận</th>

                    <th>Trạng thái</th>

                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {payrollLoading ? (
                    <tr>
                      <td colSpan="10" className="workspace-empty">
                        <Spinner animation="border" />
                      </td>
                    </tr>
                  ) : filteredPayrolls.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="workspace-empty">
                        Chưa tính bảng lương.
                      </td>
                    </tr>
                  ) : (
                    filteredPayrolls.map((item) => {
                      const typeInfo = getEmployeeTypeInfo(item.employee_type);

                      return (
                        <tr key={item.employee_payroll_id}>
                          <td data-label="Nhân viên">
                            <div className="workspace-user">
                              <div className="workspace-avatar">
                                {String(
                                  item.employee_name || item.user?.name || "U",
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {item.employee_name ||
                                    item.user?.name ||
                                    "---"}
                                </strong>

                                <small>{item.employee_position || "---"}</small>
                              </div>
                            </div>
                          </td>

                          <td data-label="Loại">
                            <Badge
                              bg={typeInfo.variant}
                              className="employee-type-badge"
                            >
                              {typeInfo.label}
                            </Badge>
                          </td>

                          <td data-label="Công" className="text-center">
                            <div className="payroll-workday-ratio">
                              <strong>
                                {formatWorkDay(item.actual_work_days)}
                              </strong>

                              <span>/</span>

                              <small>
                                {formatWorkDay(item.standard_work_days)}
                              </small>
                            </div>
                          </td>

                          <td data-label="Lương theo công">
                            {formatMoney(item.attendance_salary)}
                          </td>

                          <td data-label="Phụ cấp">
                            {formatMoney(
                              Number(item.fixed_allowance || 0) +
                                Number(item.additional_allowance || 0),
                            )}
                          </td>

                          <td data-label="Bảo hiểm">
                            {formatMoney(item.total_insurance_amount)}
                          </td>

                          <td data-label="Thưởng / Trừ">
                            <div className="bonus-deduct">
                              <span className="bonus">
                                +{formatMoney(item.bonus_amount)}
                              </span>

                              <span className="deduct">
                                -{formatMoney(item.deduction_amount)}
                              </span>
                            </div>
                          </td>

                          <td data-label="Thực nhận">
                            <strong className="net-salary">
                              {formatMoney(item.net_salary)}
                            </strong>
                          </td>

                          <td data-label="Trạng thái">
                            {renderPayrollStatus(item.status)}

                            <small className="version-text">
                              Lương V{item.payroll_version}
                            </small>
                          </td>

                          <td data-label="Thao tác" className="text-end">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleOpenPayrollDetail(item)}
                            >
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        )}

        {/* =====================================================
            HISTORY TAB
        ===================================================== */}

        {activeTab === "HISTORY" && (
          <div className="workspace-tab-body">
            <div className="workspace-section-header">
              <div>
                <h5>Lịch sử thao tác</h5>

                <small>Theo dõi thay đổi công và bảng lương</small>
              </div>
            </div>

            {logLoading ? (
              <div className="workspace-empty">
                <Spinner animation="border" />
              </div>
            ) : logs.length === 0 ? (
              <div className="workspace-empty">Chưa có lịch sử thao tác.</div>
            ) : (
              <div className="payroll-timeline">
                {logs.map((item) => (
                  <div className="timeline-item" key={item.payroll_log_id}>
                    <div className="timeline-dot" />

                    <div className="timeline-content">
                      <div className="timeline-top">
                        <strong>{item.action}</strong>

                        <span>{formatDateTime(item.created_at)}</span>
                      </div>

                      <p>{item.description || "Thao tác hệ thống"}</p>

                      <small>
                        Người thực hiện: {item.creator?.name || "---"}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* =====================================================
          ATTENDANCE ADJUST MODAL
      ===================================================== */}

      <Modal
        show={showAttendanceAdjust}
        onHide={() => {
          if (!actionLoading) {
            setShowAttendanceAdjust(false);
          }
        }}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton={!actionLoading}>
          <Modal.Title>Điều chỉnh công</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="adjust-employee-box">
            <div className="adjust-employee-title">
              <div className="workspace-avatar">
                {String(
                  selectedAttendance?.user?.name ||
                    selectedAttendance?.employee_name ||
                    "U",
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {selectedAttendance?.user?.name ||
                    selectedAttendance?.employee_name ||
                    "---"}
                </strong>

                <small>
                  {selectedAttendance?.user?.position ||
                    selectedAttendance?.employee_position ||
                    "---"}
                </small>
              </div>
            </div>

            <div className="adjust-current-work">
              <div>
                <span>Công chuẩn</span>

                <strong>
                  {formatWorkDay(selectedAttendance?.standard_work_days)}
                </strong>
              </div>

              <div>
                <span>Công chấm</span>

                <strong>
                  {formatWorkDay(selectedAttendance?.attendance_work_days)}
                </strong>
              </div>

              <div>
                <span>Điều chỉnh</span>

                <strong>
                  {Number(selectedAttendance?.adjustment_work_days || 0) > 0
                    ? "+"
                    : ""}

                  {formatWorkDay(selectedAttendance?.adjustment_work_days)}
                </strong>
              </div>

              <div>
                <span>Công tính lương</span>

                <strong className="adjust-final-value">
                  {formatWorkDay(selectedAttendance?.confirmed_work_days)}
                </strong>
              </div>
            </div>
          </div>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Loại điều chỉnh</Form.Label>

                <Form.Select
                  value={attendanceAdjustForm.adjustment_type}
                  disabled={actionLoading}
                  onChange={(e) =>
                    setAttendanceAdjustForm({
                      ...attendanceAdjustForm,

                      adjustment_type: e.target.value,
                    })
                  }
                >
                  <option value="ADD">Cộng công</option>

                  <option value="DEDUCT">Trừ công</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Số công</Form.Label>

                <Form.Control
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="VD: 0.5 hoặc 1"
                  value={attendanceAdjustForm.adjustment_value}
                  disabled={actionLoading}
                  onChange={(e) =>
                    setAttendanceAdjustForm({
                      ...attendanceAdjustForm,

                      adjustment_value: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label>Ngày điều chỉnh</Form.Label>

                <Form.Control
                  type="date"
                  min={period?.start_date || undefined}
                  max={period?.end_date || undefined}
                  value={attendanceAdjustForm.adjustment_date}
                  disabled={actionLoading}
                  onChange={(e) =>
                    setAttendanceAdjustForm({
                      ...attendanceAdjustForm,

                      adjustment_date: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label>Lý do điều chỉnh</Form.Label>

                <Form.Control
                  as="textarea"
                  rows={3}
                  maxLength={500}
                  placeholder="VD: Quên chấm công, đi tour, nghỉ phép có lương..."
                  value={attendanceAdjustForm.reason}
                  disabled={actionLoading}
                  onChange={(e) =>
                    setAttendanceAdjustForm({
                      ...attendanceAdjustForm,

                      reason: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="light"
            disabled={actionLoading}
            onClick={() => setShowAttendanceAdjust(false)}
          >
            Hủy
          </Button>

          <Button
            variant="warning"
            disabled={actionLoading}
            onClick={handleAttendanceAdjust}
          >
            {actionLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <FaCheck className="me-2" />
                Xác nhận điều chỉnh
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* =====================================================
          PAYROLL DETAIL MODAL
      ===================================================== */}

      <Modal
        show={showPayrollDetail}
        onHide={() => setShowPayrollDetail(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết bảng lương</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedPayroll && (
            <>
              <div className="payroll-detail-user">
                <div className="workspace-avatar large">
                  {String(selectedPayroll.employee_name || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h5>{selectedPayroll.employee_name}</h5>

                  <small>{selectedPayroll.employee_position || "---"}</small>

                  <div className="payroll-detail-type">
                    {(() => {
                      const info = getEmployeeTypeInfo(
                        selectedPayroll.employee_type,
                      );

                      return <Badge bg={info.variant}>{info.label}</Badge>;
                    })()}
                  </div>
                </div>
              </div>

              <div className="payroll-detail-grid">
                <div>
                  <span>Công chuẩn</span>

                  <strong>
                    {formatWorkDay(selectedPayroll.standard_work_days)}
                  </strong>
                </div>

                <div>
                  <span>Công thực tế</span>

                  <strong>
                    {formatWorkDay(selectedPayroll.actual_work_days)}
                  </strong>
                </div>

                <div>
                  <span>Lương cơ bản</span>

                  <strong>{formatMoney(selectedPayroll.base_salary)}</strong>
                </div>

                <div>
                  <span>Lương theo công</span>

                  <strong>
                    {formatMoney(selectedPayroll.attendance_salary)}
                  </strong>
                </div>

                <div>
                  <span>Phụ cấp cố định</span>

                  <strong>
                    {formatMoney(selectedPayroll.fixed_allowance)}
                  </strong>
                </div>

                <div>
                  <span>Phụ cấp thêm</span>

                  <strong>
                    {formatMoney(selectedPayroll.additional_allowance)}
                  </strong>
                </div>

                <div>
                  <span>BHXH</span>

                  <strong>
                    {formatMoney(selectedPayroll.social_insurance_amount)}
                  </strong>
                </div>

                <div>
                  <span>BHYT</span>

                  <strong>
                    {formatMoney(selectedPayroll.health_insurance_amount)}
                  </strong>
                </div>

                <div>
                  <span>BHTN</span>

                  <strong>
                    {formatMoney(selectedPayroll.unemployment_insurance_amount)}
                  </strong>
                </div>

                <div>
                  <span>Thưởng</span>

                  <strong className="detail-positive">
                    +{formatMoney(selectedPayroll.bonus_amount)}
                  </strong>
                </div>

                <div>
                  <span>Khấu trừ</span>

                  <strong className="detail-negative">
                    -{formatMoney(selectedPayroll.deduction_amount)}
                  </strong>
                </div>

                <div>
                  <span>Thuế TNCN</span>

                  <strong>
                    {formatMoney(selectedPayroll.personal_income_tax)}
                  </strong>
                </div>
              </div>

              <div className="net-salary-box">
                <span>THỰC NHẬN</span>

                <strong>{formatMoney(selectedPayroll.net_salary)}</strong>
              </div>

              {selectedPayroll.status !== "PUBLISHED" && (
                <div className="payroll-detail-actions">
                  <Button
                    variant="outline-primary"
                    onClick={() => handleOpenPayrollAdjust("ALLOWANCE")}
                  >
                    + Phụ cấp
                  </Button>

                  <Button
                    variant="outline-success"
                    onClick={() => handleOpenPayrollAdjust("BONUS")}
                  >
                    + Thưởng
                  </Button>

                  <Button
                    variant="outline-danger"
                    onClick={() => handleOpenPayrollAdjust("DEDUCTION")}
                  >
                    + Khấu trừ
                  </Button>
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* =====================================================
          PAYROLL ADJUST MODAL
      ===================================================== */}

      <Modal
        show={showPayrollAdjust}
        onHide={() => {
          if (!actionLoading) {
            setShowPayrollAdjust(false);
          }
        }}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton={!actionLoading}>
          <Modal.Title>Điều chỉnh bảng lương</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Loại điều chỉnh</Form.Label>

            <Form.Select
              value={payrollAdjustForm.adjustment_type}
              disabled={actionLoading}
              onChange={(e) =>
                setPayrollAdjustForm({
                  ...payrollAdjustForm,

                  adjustment_type: e.target.value,
                })
              }
            >
              <option value="ALLOWANCE">Phụ cấp</option>

              <option value="BONUS">Thưởng</option>

              <option value="DEDUCTION">Khấu trừ</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Nội dung</Form.Label>

            <Form.Control
              placeholder="VD: Phụ cấp tour"
              value={payrollAdjustForm.adjustment_name}
              disabled={actionLoading}
              onChange={(e) =>
                setPayrollAdjustForm({
                  ...payrollAdjustForm,

                  adjustment_name: e.target.value,
                })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Số tiền</Form.Label>

            <InputGroup>
              <Form.Control
                type="number"
                min="0"
                value={payrollAdjustForm.amount}
                disabled={actionLoading}
                onChange={(e) =>
                  setPayrollAdjustForm({
                    ...payrollAdjustForm,

                    amount: e.target.value,
                  })
                }
              />

              <InputGroup.Text>VNĐ</InputGroup.Text>
            </InputGroup>
          </Form.Group>

          <Form.Group>
            <Form.Label>Ghi chú</Form.Label>

            <Form.Control
              as="textarea"
              rows={3}
              maxLength={500}
              value={payrollAdjustForm.note}
              disabled={actionLoading}
              onChange={(e) =>
                setPayrollAdjustForm({
                  ...payrollAdjustForm,

                  note: e.target.value,
                })
              }
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="light"
            disabled={actionLoading}
            onClick={() => setShowPayrollAdjust(false)}
          >
            Hủy
          </Button>

          <Button
            variant="primary"
            disabled={actionLoading}
            onClick={handlePayrollAdjustment}
          >
            {actionLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang lưu...
              </>
            ) : (
              "Lưu điều chỉnh"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PayrollWorkspace;
