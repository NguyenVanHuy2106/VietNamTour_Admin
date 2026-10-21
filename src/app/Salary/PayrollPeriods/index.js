import React, { useEffect, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  ProgressBar,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";

import {
  FaCalendarAlt,
  FaCheckCircle,
  FaEdit,
  FaExternalLinkAlt,
  FaMoneyCheckAlt,
  FaPlus,
  FaSearch,
  FaUsers,
  FaTrashAlt,
  FaExclamationTriangle,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import APIToken from "../../../config/APIToken";

import "./index.css";

const getPeriodStatusLabel = (status) => {
  const map = {
    OPEN: "Đang mở",

    ATTENDANCE_CONFIRMED: "Đã xác nhận công",

    CALCULATED: "Đã tính lương",

    PUBLISHED: "Đã công bố",

    CLOSED: "Đã đóng",
  };

  return map[status] || status || "-";
};

const PayrollPeriods = () => {
  const navigate = useNavigate();

  // ==========================================================
  // DATA
  // ==========================================================

  const [periods, setPeriods] = useState([]);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deletingPeriod, setDeletingPeriod] = useState(null);

  const [deleting, setDeleting] = useState(false);
  // ==========================================================
  // FILTER
  // ==========================================================

  const [keyword, setKeyword] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  // ==========================================================
  // MODAL
  // ==========================================================

  const [showModal, setShowModal] = useState(false);

  const [modalMode, setModalMode] = useState("CREATE");

  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // ==========================================================
  // FORM
  // ==========================================================

  const initialForm = {
    period_code: "",
    period_name: "",

    start_date: "",
    end_date: "",

    note: "",
  };

  const [form, setForm] = useState(initialForm);

  // ==========================================================
  // GET PERIODS
  // ==========================================================

  const handleOpenDelete = (period) => {
    if (!period) return;

    if (["PUBLISHED", "CLOSED"].includes(period.status)) {
      alert("Không thể xóa kỳ lương đã công bố hoặc đã đóng.");

      return;
    }

    setDeletingPeriod(period);

    setShowDeleteModal(true);
  };

  const handleCloseDelete = () => {
    if (deleting) return;

    setShowDeleteModal(false);

    setDeletingPeriod(null);
  };

  const handleDeletePeriod = async () => {
    if (!deletingPeriod) return;

    try {
      setDeleting(true);

      await APIToken.delete(
        `/salary/period/delete/${deletingPeriod.payroll_period_id}`,
      );

      setShowDeleteModal(false);

      setDeletingPeriod(null);

      alert("Xóa kỳ lương thành công.");

      // Hàm load lại danh sách kỳ lương của bạn
      await fetchPayrollPeriods();
    } catch (error) {
      console.error("Delete payroll period error:", error);

      alert(error?.response?.data?.message || "Không thể xóa kỳ lương.");
    } finally {
      setDeleting(false);
    }
  };

  const fetchPayrollPeriods = async () => {
    try {
      setLoading(true);

      const res = await APIToken.get("/salary/period/get");

      const data = res?.data?.data || [];

      setPeriods(data);
    } catch (error) {
      console.error("Lỗi lấy danh sách kỳ lương:", error);

      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollPeriods();
  }, []);

  const handleOpenWorkspace = (item) => {
    navigate(`/payrollWorkspace/${item.payroll_period_id}`);
  };
  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredPeriods = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return periods.filter((item) => {
      const matchKeyword =
        !search ||
        String(item.period_name || "")
          .toLowerCase()
          .includes(search) ||
        String(item.period_code || "")
          .toLowerCase()
          .includes(search);

      const matchStatus = !statusFilter || item.status === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [periods, keyword, statusFilter]);

  // ==========================================================
  // FORMAT
  // ==========================================================

  const formatDate = (value) => {
    if (!value) {
      return "---";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN");
  };

  const getStatusInfo = (status) => {
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

  const getProgress = (status) => {
    switch (status) {
      case "OPEN":
        return 20;

      case "ATTENDANCE_CONFIRMED":
        return 45;

      case "CALCULATED":
        return 75;

      case "PUBLISHED":
        return 100;

      case "CLOSED":
        return 100;

      default:
        return 0;
    }
  };

  // ==========================================================
  // OPEN CREATE
  // ==========================================================

  const handleOpenCreate = () => {
    setModalMode("CREATE");

    setSelectedPeriod(null);

    setForm(initialForm);

    setShowModal(true);
  };

  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  const handleOpenEdit = (item) => {
    setModalMode("EDIT");

    setSelectedPeriod(item);

    setForm({
      period_code: item.period_code || "",
      period_name: item.period_name || "",

      start_date: item.start_date || "",
      end_date: item.end_date || "",

      note: item.note || "",
    });

    setShowModal(true);
  };

  // ==========================================================
  // VALIDATE
  // ==========================================================

  const validateForm = () => {
    if (!form.period_code.trim()) {
      alert("Vui lòng nhập mã kỳ lương.");

      return false;
    }

    if (!form.period_name.trim()) {
      alert("Vui lòng nhập tên kỳ lương.");

      return false;
    }

    if (!form.start_date) {
      alert("Vui lòng chọn ngày bắt đầu.");

      return false;
    }

    if (!form.end_date) {
      alert("Vui lòng chọn ngày kết thúc.");

      return false;
    }

    if (form.end_date < form.start_date) {
      alert("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");

      return false;
    }

    return true;
  };

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        period_code: form.period_code.trim(),

        period_name: form.period_name.trim(),

        start_date: form.start_date,

        end_date: form.end_date,

        note: form.note.trim() || null,
      };

      let res;

      if (modalMode === "CREATE") {
        res = await APIToken.post("/salary/period/add", payload);
      }

      if (modalMode === "EDIT") {
        res = await APIToken.post(
          `/salary/period/update/${selectedPeriod.payroll_period_id}`,
          payload,
        );
      }

      alert(res?.data?.message || "Lưu kỳ lương thành công.");

      setShowModal(false);

      await fetchPayrollPeriods();
    } catch (error) {
      console.error("Lỗi lưu kỳ lương:", error);

      alert(error?.response?.data?.message || "Không thể lưu kỳ lương.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // OPEN WORKSPACE
  // ==========================================================

  // ==========================================================
  // AUTO NAME
  // ==========================================================

  const generatePeriodInfo = () => {
    if (!form.start_date || !form.end_date) {
      return;
    }

    const end = new Date(`${form.end_date}T00:00:00`);

    const month = String(end.getMonth() + 1).padStart(2, "0");

    const year = end.getFullYear();

    setForm((prev) => ({
      ...prev,

      period_code: prev.period_code || `SALARY_${year}_${month}`,

      period_name:
        prev.period_name ||
        `Lương ${formatDate(prev.start_date)} - ${formatDate(prev.end_date)}`,
    }));
  };

  useEffect(() => {
    if (modalMode === "CREATE") {
      generatePeriodInfo();
    }
  }, [form.start_date, form.end_date]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Container fluid className="payroll-period-page">
      {/* =====================================================
          HEADER / FILTER
      ===================================================== */}

      <Card className="payroll-period-filter-card border-0">
        <Card.Body>
          <div className="payroll-period-page-title">
            <div className="payroll-period-title-icon">
              <FaMoneyCheckAlt />
            </div>

            <div>
              <h4>Quản lý bảng lương</h4>

              <p>
                Quản lý kỳ lương, xác nhận công, tính lương và công bố bảng
                lương
              </p>
            </div>
          </div>

          <Row className="g-3 align-items-end">
            {/* SEARCH */}

            <Col xl={7} lg={7} md={12}>
              <Form.Group>
                <Form.Label className="payroll-period-label">
                  Tìm kỳ lương
                </Form.Label>

                <InputGroup className="payroll-period-input-group">
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>

                  <Form.Control
                    placeholder="Nhập tên hoặc mã kỳ lương..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            {/* STATUS */}

            <Col xl={3} lg={3} md={6}>
              <Form.Group>
                <Form.Label className="payroll-period-label">
                  Trạng thái
                </Form.Label>

                <Form.Select
                  className="payroll-period-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">-- Tất cả --</option>

                  <option value="OPEN">Đang xử lý công</option>

                  <option value="ATTENDANCE_CONFIRMED">Đã xác nhận công</option>

                  <option value="CALCULATED">Đã tính lương</option>

                  <option value="PUBLISHED">Đã công bố</option>

                  <option value="CLOSED">Đã đóng kỳ</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* REFRESH */}

            <Col xl={2} lg={2} md={6}>
              <Button
                className="payroll-period-search-btn w-100"
                onClick={fetchPayrollPeriods}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    ĐANG TẢI
                  </>
                ) : (
                  <>
                    <FaSearch className="me-2" />
                    TRUY XUẤT
                  </>
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* =====================================================
          LIST HEADER
      ===================================================== */}

      <div className="payroll-period-list-header">
        <div>
          <h5>Danh sách kỳ lương</h5>

          <small>{filteredPeriods.length} kỳ lương được tìm thấy</small>
        </div>

        <Button className="payroll-period-add-btn" onClick={handleOpenCreate}>
          <FaPlus />

          <span>Tạo kỳ lương</span>
        </Button>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <Card className="payroll-period-table-card border-0">
        <div className="table-responsive">
          <Table hover className="payroll-period-table align-middle mb-0">
            <thead>
              <tr>
                <th>Kỳ lương</th>

                <th>Thời gian</th>

                <th className="text-center">Công chuẩn</th>

                <th>Tiến độ</th>

                <th>Trạng thái</th>

                <th className="text-end">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="payroll-period-empty">
                    <Spinner animation="border" variant="primary" />

                    <span>Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : filteredPeriods.length === 0 ? (
                <tr>
                  <td colSpan="6" className="payroll-period-empty">
                    Chưa có kỳ lương.
                  </td>
                </tr>
              ) : (
                filteredPeriods.map((item) => {
                  const statusInfo = getStatusInfo(item.status);

                  const progress = getProgress(item.status);

                  return (
                    <tr key={item.payroll_period_id}>
                      {/* PERIOD */}

                      <td data-label="Kỳ lương">
                        <div className="payroll-period-name">
                          <div className="payroll-period-icon">
                            <FaCalendarAlt />
                          </div>

                          <div>
                            <strong>{item.period_name}</strong>

                            <small>{item.period_code}</small>
                          </div>
                        </div>
                      </td>

                      {/* DATE */}

                      <td data-label="Thời gian">
                        <div className="payroll-period-date">
                          <strong>{formatDate(item.start_date)}</strong>

                          <span>→</span>

                          <strong>{formatDate(item.end_date)}</strong>
                        </div>
                      </td>

                      {/* STANDARD DAYS */}

                      <td data-label="Công chuẩn" className="text-center">
                        <div className="payroll-workday-box">
                          <strong>
                            {Number(item.standard_work_days || 0)}
                          </strong>

                          <small>ngày</small>
                        </div>
                      </td>

                      {/* PROGRESS */}

                      <td data-label="Tiến độ">
                        <div className="payroll-period-progress">
                          <div className="payroll-period-progress-label">
                            <span>{statusInfo.label}</span>

                            <strong>{progress}%</strong>
                          </div>

                          <ProgressBar
                            now={progress}
                            variant={statusInfo.variant}
                          />
                        </div>
                      </td>

                      {/* STATUS */}

                      <td data-label="Trạng thái">
                        <Badge
                          bg={statusInfo.variant}
                          className="payroll-period-status"
                        >
                          {statusInfo.label}
                        </Badge>
                      </td>

                      {/* ACTION */}

                      <td data-label="Thao tác" className="text-end">
                        <div className="payroll-period-actions">
                          {!["PUBLISHED", "CLOSED"].includes(item.status) && (
                            <Button
                              variant="outline-secondary"
                              title="Chỉnh sửa kỳ lương"
                              onClick={() => handleOpenEdit(item)}
                            >
                              <FaEdit />
                            </Button>
                          )}

                          <Button
                            variant="primary"
                            className="btn-open-payroll"
                            onClick={() => handleOpenWorkspace(item)}
                          >
                            <FaExternalLinkAlt />

                            <span>
                              {item.status === "PUBLISHED"
                                ? "Xem kỳ lương"
                                : "Mở kỳ lương"}
                            </span>
                          </Button>
                          <div className="period-action-buttons">
                            <Button
                              className="period-delete-btn"
                              disabled={["PUBLISHED", "CLOSED"].includes(
                                item.status,
                              )}
                              onClick={() => handleOpenDelete(item)}
                              title={
                                ["PUBLISHED", "CLOSED"].includes(item.status)
                                  ? "Không thể xóa kỳ lương đã công bố hoặc đã đóng"
                                  : "Xóa kỳ lương"
                              }
                            >
                              <FaTrashAlt />
                              Xóa
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      <Modal
        show={showDeleteModal}
        onHide={handleCloseDelete}
        centered
        backdrop={deleting ? "static" : true}
        keyboard={!deleting}
        dialogClassName="delete-period-modal"
      >
        <Modal.Body>
          <div className="delete-period-content">
            <div className="delete-period-icon">
              <FaExclamationTriangle />
            </div>

            <h4>Xóa kỳ lương?</h4>

            <p className="delete-period-description">
              Bạn có chắc muốn xóa kỳ lương này không?
            </p>

            {deletingPeriod && (
              <div className="delete-period-info">
                <div>
                  <span>Kỳ lương</span>

                  <strong>
                    {deletingPeriod.period_name ||
                      deletingPeriod.period_code ||
                      `Kỳ #${deletingPeriod.payroll_period_id}`}
                  </strong>
                </div>

                <div>
                  <span>Thời gian</span>

                  <strong>
                    {formatDate(deletingPeriod.start_date)}
                    {" - "}
                    {formatDate(deletingPeriod.end_date)}
                  </strong>
                </div>

                <div>
                  <span>Trạng thái</span>

                  <strong>{getPeriodStatusLabel(deletingPeriod.status)}</strong>
                </div>
              </div>
            )}

            <div className="delete-period-warning">
              <FaExclamationTriangle />

              <span>
                Toàn bộ dữ liệu chấm công, điều chỉnh công, bảng lương, phụ cấp,
                thưởng, khấu trừ và lịch sử của kỳ này sẽ bị xóa.
              </span>
            </div>

            <div className="delete-period-actions">
              <Button
                className="delete-period-cancel-btn"
                onClick={handleCloseDelete}
                disabled={deleting}
              >
                Hủy
              </Button>

              <Button
                className="delete-period-confirm-btn"
                onClick={handleDeletePeriod}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <FaTrashAlt />
                    Xóa kỳ lương
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      <Modal
        show={showModal}
        onHide={() => {
          if (!saving) {
            setShowModal(false);
          }
        }}
        centered
        size="lg"
        backdrop="static"
        keyboard={!saving}
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title className="payroll-period-modal-title">
            <div className="payroll-period-modal-icon">
              <FaCalendarAlt />
            </div>

            <div>
              <strong>
                {modalMode === "CREATE" ? "Tạo kỳ lương" : "Cập nhật kỳ lương"}
              </strong>

              <small>
                Khai báo thời gian và số công chuẩn cho kỳ tính lương
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="payroll-period-info-box">
            <FaCheckCircle />

            <span>
              Sau khi tạo kỳ lương, bạn sẽ vào màn hình xử lý công để xác nhận
              ngày công trước khi tính lương.
            </span>
          </div>

          <Row className="g-3">
            {/* CODE */}

            <Col md={6}>
              <Form.Group>
                <Form.Label className="payroll-period-modal-label">
                  Mã kỳ lương
                  <span className="text-danger ms-1">*</span>
                </Form.Label>

                <Form.Control
                  value={form.period_code}
                  disabled={saving || modalMode === "EDIT"}
                  placeholder="SALARY_2026_10"
                  onChange={(e) =>
                    setForm({
                      ...form,

                      period_code: e.target.value.toUpperCase(),
                    })
                  }
                />
              </Form.Group>
            </Col>

            {/* NAME */}

            <Col md={6}>
              <Form.Group>
                <Form.Label className="payroll-period-modal-label">
                  Tên kỳ lương
                  <span className="text-danger ms-1">*</span>
                </Form.Label>

                <Form.Control
                  value={form.period_name}
                  disabled={saving}
                  placeholder="Lương tháng 10/2026"
                  onChange={(e) =>
                    setForm({
                      ...form,

                      period_name: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>

            {/* START */}

            <Col md={6}>
              <Form.Group>
                <Form.Label className="payroll-period-modal-label">
                  Từ ngày
                  <span className="text-danger ms-1">*</span>
                </Form.Label>

                <InputGroup className="payroll-period-modal-input">
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>

                  <Form.Control
                    type="date"
                    value={form.start_date}
                    disabled={saving}
                    onChange={(e) =>
                      setForm({
                        ...form,

                        start_date: e.target.value,
                      })
                    }
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            {/* END */}

            <Col md={6}>
              <Form.Group>
                <Form.Label className="payroll-period-modal-label">
                  Đến ngày
                  <span className="text-danger ms-1">*</span>
                </Form.Label>

                <InputGroup className="payroll-period-modal-input">
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>

                  <Form.Control
                    type="date"
                    value={form.end_date}
                    disabled={saving}
                    onChange={(e) =>
                      setForm({
                        ...form,

                        end_date: e.target.value,
                      })
                    }
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            {/* STANDARD DAYS */}

            {/* CURRENT INFO */}

            <Col md={6}>
              <div className="payroll-period-preview">
                <FaUsers />

                <div>
                  <strong>Nhân viên sẽ được nạp sau</strong>

                  <small>
                    Sau khi tạo kỳ, hệ thống sẽ nạp công của nhân viên vào kỳ
                    lương.
                  </small>
                </div>
              </div>
            </Col>

            {/* NOTE */}

            <Col md={12}>
              <Form.Group>
                <Form.Label className="payroll-period-modal-label">
                  Ghi chú
                </Form.Label>

                <Form.Control
                  as="textarea"
                  rows={3}
                  maxLength={500}
                  value={form.note}
                  disabled={saving}
                  placeholder="Nhập ghi chú nếu có..."
                  onChange={(e) =>
                    setForm({
                      ...form,

                      note: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer className="payroll-period-modal-footer">
          <Button
            variant="light"
            disabled={saving}
            onClick={() => setShowModal(false)}
          >
            Hủy
          </Button>

          <Button
            variant="primary"
            className="payroll-period-save-btn"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <FaCheckCircle className="me-2" />

                {modalMode === "CREATE" ? "Tạo kỳ lương" : "Lưu thay đổi"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PayrollPeriods;
