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
  Row,
  Spinner,
  Table,
} from "react-bootstrap";

import {
  FaBriefcase,
  FaCalendarAlt,
  FaCheckCircle,
  FaCoins,
  FaEdit,
  FaHistory,
  FaMoneyBillWave,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaUserCircle,
} from "react-icons/fa";

import APIToken from "../../../config/APIToken";

import "./index.css";

const SalaryConfig = () => {
  // ==========================================================
  // DATA
  // ==========================================================

  const [users, setUsers] = useState([]);
  const [salaryConfigs, setSalaryConfigs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  // ==========================================================
  // FILTER
  // ==========================================================

  const [keyword, setKeyword] = useState("");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("1");

  // ==========================================================
  // MODAL
  // ==========================================================

  const [showModal, setShowModal] = useState(false);

  const [modalMode, setModalMode] = useState("CREATE");

  // CREATE
  // EDIT
  // NEW_VERSION

  const [selectedConfig, setSelectedConfig] = useState(null);

  // ==========================================================
  // HISTORY
  // ==========================================================

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [historyUser, setHistoryUser] = useState(null);

  // ==========================================================
  // FORM
  // ==========================================================

  const initialForm = {
    user_id: "",
    employee_type: "OFFICIAL",
    salary_name: "",
    base_salary: "",
    fixed_allowance: "",

    salary_by_attendance: true,

    has_social_insurance: true,
    has_health_insurance: true,
    has_unemployment_insurance: true,

    insurance_salary: "",

    has_personal_income_tax: false,

    effective_from: "",
    effective_to: "",

    note: "",
  };

  const [form, setForm] = useState(initialForm);

  // ==========================================================
  // GET USERS
  // ==========================================================

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      const res = await APIToken.get("/user/get");

      const userData = res?.data?.data || res?.data || [];

      const sorted = [...userData].sort(
        (a, b) => Number(b.user_id) - Number(a.user_id),
      );

      setUsers(sorted);
    } catch (error) {
      console.error("Lỗi lấy nhân viên:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // ==========================================================
  // GET SALARY CONFIG
  // ==========================================================

  const fetchSalaryConfigs = async () => {
    try {
      setLoading(true);

      const params = {};

      if (employeeTypeFilter) {
        params.employee_type = employeeTypeFilter;
      }

      if (statusFilter !== "") {
        params.status = statusFilter;
      }

      const res = await APIToken.get("/salary/config/get", {
        params,
      });

      setSalaryConfigs(res?.data?.data || []);
    } catch (error) {
      console.error("Lỗi lấy cấu hình lương:", error);

      setSalaryConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSalaryConfigs();
  }, []);

  // ==========================================================
  // FILTER LOCAL
  // ==========================================================

  const filteredConfigs = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    if (!search) {
      return salaryConfigs;
    }

    return salaryConfigs.filter((item) => {
      const user = item.user || {};

      return (
        String(user.name || "")
          .toLowerCase()
          .includes(search) ||
        String(user.email || "")
          .toLowerCase()
          .includes(search) ||
        String(user.position || "")
          .toLowerCase()
          .includes(search) ||
        String(item.salary_name || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [salaryConfigs, keyword]);

  // ==========================================================
  // FORMAT
  // ==========================================================

  const formatMoney = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString("vi-VN") + " đ";
  };

  const formatDate = (value) => {
    if (!value) {
      return "---";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN");
  };

  const getEmployeeTypeLabel = (type) => {
    switch (type) {
      case "OFFICIAL":
        return "Chính thức";

      case "PROBATION":
        return "Thử việc";

      case "INTERN":
        return "Thực tập";

      case "PART_TIME":
        return "Bán thời gian";

      case "COLLABORATOR":
        return "Cộng tác viên";

      default:
        return type || "---";
    }
  };

  const getEmployeeTypeVariant = (type) => {
    switch (type) {
      case "OFFICIAL":
        return "primary";

      case "PROBATION":
        return "warning";

      case "INTERN":
        return "info";

      case "PART_TIME":
        return "secondary";

      default:
        return "dark";
    }
  };

  // ==========================================================
  // CHANGE EMPLOYEE TYPE
  // ==========================================================

  const handleEmployeeTypeChange = (value) => {
    if (value === "INTERN") {
      setForm({
        ...form,

        employee_type: value,

        has_social_insurance: false,
        has_health_insurance: false,
        has_unemployment_insurance: false,

        insurance_salary: "",
      });

      return;
    }

    if (value === "OFFICIAL") {
      setForm({
        ...form,

        employee_type: value,

        has_social_insurance: true,
        has_health_insurance: true,
        has_unemployment_insurance: true,
      });

      return;
    }

    setForm({
      ...form,
      employee_type: value,
    });
  };

  // ==========================================================
  // OPEN CREATE
  // ==========================================================

  const handleOpenCreate = () => {
    setModalMode("CREATE");

    setSelectedConfig(null);

    setForm(initialForm);

    setShowModal(true);
  };

  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  const handleOpenEdit = (item) => {
    setModalMode("EDIT");

    setSelectedConfig(item);

    setForm({
      user_id: item.user_id || "",
      employee_type: item.employee_type || "OFFICIAL",
      salary_name: item.salary_name || "",

      base_salary: item.base_salary || "",
      fixed_allowance: item.fixed_allowance || "",

      salary_by_attendance: item.salary_by_attendance !== false,

      has_social_insurance: item.has_social_insurance || false,

      has_health_insurance: item.has_health_insurance || false,

      has_unemployment_insurance: item.has_unemployment_insurance || false,

      insurance_salary: item.insurance_salary || "",

      has_personal_income_tax: item.has_personal_income_tax || false,

      effective_from: item.effective_from || "",

      effective_to: item.effective_to || "",

      note: item.note || "",
    });

    setShowModal(true);
  };

  // ==========================================================
  // OPEN NEW VERSION
  // ==========================================================

  const handleOpenNewVersion = (item) => {
    setModalMode("NEW_VERSION");

    setSelectedConfig(item);

    setForm({
      user_id: item.user_id || "",
      employee_type: item.employee_type || "OFFICIAL",
      salary_name: item.salary_name || "",

      base_salary: item.base_salary || "",
      fixed_allowance: item.fixed_allowance || "",

      salary_by_attendance: item.salary_by_attendance !== false,

      has_social_insurance: item.has_social_insurance || false,

      has_health_insurance: item.has_health_insurance || false,

      has_unemployment_insurance: item.has_unemployment_insurance || false,

      insurance_salary: item.insurance_salary || "",

      has_personal_income_tax: item.has_personal_income_tax || false,

      effective_from: "",
      effective_to: "",

      note: "",
    });

    setShowModal(true);
  };

  // ==========================================================
  // VALIDATE
  // ==========================================================

  const validateForm = () => {
    if (!form.user_id) {
      alert("Vui lòng chọn nhân viên.");

      return false;
    }

    if (!form.employee_type) {
      alert("Vui lòng chọn loại nhân sự.");

      return false;
    }

    if (!form.base_salary || Number(form.base_salary) < 0) {
      alert("Vui lòng nhập lương cơ bản hợp lệ.");

      return false;
    }

    if (!form.effective_from) {
      alert("Vui lòng nhập ngày bắt đầu áp dụng.");

      return false;
    }

    const hasInsurance =
      form.has_social_insurance ||
      form.has_health_insurance ||
      form.has_unemployment_insurance;

    if (
      hasInsurance &&
      (!form.insurance_salary || Number(form.insurance_salary) <= 0)
    ) {
      alert("Vui lòng nhập mức lương đóng bảo hiểm.");

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
        ...form,

        user_id: Number(form.user_id),

        base_salary: Number(form.base_salary || 0),

        fixed_allowance: Number(form.fixed_allowance || 0),

        insurance_salary:
          form.has_social_insurance ||
          form.has_health_insurance ||
          form.has_unemployment_insurance
            ? Number(form.insurance_salary || 0)
            : null,

        effective_to: form.effective_to || null,

        note: form.note.trim() || null,
      };

      let res;

      if (modalMode === "CREATE") {
        res = await APIToken.post("/salary/config/add", payload);
      }

      if (modalMode === "EDIT") {
        res = await APIToken.post(
          `/salary/config/update/${selectedConfig.salary_config_id}`,
          payload,
        );
      }

      if (modalMode === "NEW_VERSION") {
        res = await APIToken.post(
          `/salary/config/new-version/${selectedConfig.salary_config_id}`,
          payload,
        );
      }

      alert(res?.data?.message || "Lưu cấu hình lương thành công.");

      setShowModal(false);

      await fetchSalaryConfigs();
    } catch (error) {
      console.error("Lỗi lưu cấu hình lương:", error);

      alert(error?.response?.data?.message || "Không thể lưu cấu hình lương.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // HISTORY
  // ==========================================================

  const handleOpenHistory = async (item) => {
    try {
      setShowHistoryModal(true);

      setHistoryLoading(true);

      setSalaryHistory([]);

      setHistoryUser(item.user || null);

      const res = await APIToken.get(`/salary/config/user/${item.user_id}`);

      setHistoryUser(res?.data?.data?.user || item.user || null);

      setSalaryHistory(res?.data?.data?.configs || []);
    } catch (error) {
      console.error("Lỗi lấy lịch sử lương:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ==========================================================
  // TITLE MODAL
  // ==========================================================

  const getModalTitle = () => {
    if (modalMode === "EDIT") {
      return "Cập nhật cấu hình lương";
    }

    if (modalMode === "NEW_VERSION") {
      return "Tạo phiên bản lương mới";
    }

    return "Khai báo lương nhân viên";
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Container fluid className="salary-config-page">
      {/* FILTER */}

      <Card className="salary-filter-card border-0">
        <Card.Body>
          <div className="salary-page-title">
            <div className="salary-title-icon">
              <FaMoneyBillWave />
            </div>

            <div>
              <h4>Khai báo lương nhân viên</h4>

              <p>
                Quản lý loại nhân sự, mức lương, phụ cấp và thông tin bảo hiểm
              </p>
            </div>
          </div>

          <Row className="g-3 align-items-end">
            <Col xl={5} lg={5} md={12}>
              <Form.Group>
                <Form.Label className="salary-label">Tìm nhân viên</Form.Label>

                <InputGroup className="salary-input-group">
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>

                  <Form.Control
                    placeholder="Tên, email, chức vụ..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col xl={3} lg={3} md={6}>
              <Form.Group>
                <Form.Label className="salary-label">Loại nhân sự</Form.Label>

                <Form.Select
                  className="salary-select"
                  value={employeeTypeFilter}
                  onChange={(e) => setEmployeeTypeFilter(e.target.value)}
                >
                  <option value="">-- Tất cả --</option>

                  <option value="OFFICIAL">Chính thức</option>

                  <option value="PROBATION">Thử việc</option>

                  <option value="INTERN">Thực tập</option>

                  <option value="PART_TIME">Bán thời gian</option>

                  <option value="COLLABORATOR">Cộng tác viên</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xl={2} lg={2} md={6}>
              <Form.Group>
                <Form.Label className="salary-label">Trạng thái</Form.Label>

                <Form.Select
                  className="salary-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="1">Đang áp dụng</option>

                  <option value="0">Ngừng áp dụng</option>

                  <option value="">Tất cả</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xl={2} lg={2} md={12}>
              <Button
                className="salary-search-btn w-100"
                disabled={loading}
                onClick={fetchSalaryConfigs}
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

      {/* LIST HEADER */}

      <div className="salary-list-header">
        <div>
          <h5>Danh sách khai báo lương</h5>

          <small>{filteredConfigs.length} cấu hình được tìm thấy</small>
        </div>

        <Button className="salary-add-btn" onClick={handleOpenCreate}>
          <FaPlus />
          <span>Khai báo lương</span>
        </Button>
      </div>

      {/* TABLE */}

      <Card className="salary-table-card border-0">
        <div className="table-responsive">
          <Table hover className="salary-table align-middle mb-0">
            <thead>
              <tr>
                <th>Nhân viên</th>

                <th>Loại nhân sự</th>

                <th>Lương cơ bản</th>

                <th>Phụ cấp</th>

                <th>Bảo hiểm</th>

                <th>Áp dụng</th>

                <th>Trạng thái</th>

                <th className="text-end">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="salary-empty">
                    <Spinner animation="border" />

                    <span>Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="salary-empty">
                    Chưa có cấu hình lương.
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((item) => (
                  <tr key={item.salary_config_id}>
                    <td data-label="Nhân viên">
                      <div className="salary-user">
                        <div className="salary-avatar">
                          {item.user?.name?.trim().charAt(0).toUpperCase() ||
                            "U"}
                        </div>

                        <div>
                          <strong>{item.user?.name || "---"}</strong>

                          <small>
                            {item.user?.position || "Chưa cập nhật chức vụ"}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td data-label="Loại nhân sự">
                      <Badge bg={getEmployeeTypeVariant(item.employee_type)}>
                        {getEmployeeTypeLabel(item.employee_type)}
                      </Badge>
                    </td>

                    <td data-label="Lương cơ bản">
                      <strong className="salary-money">
                        {formatMoney(item.base_salary)}
                      </strong>
                    </td>

                    <td data-label="Phụ cấp">
                      {formatMoney(item.fixed_allowance)}
                    </td>

                    <td data-label="Bảo hiểm">
                      {item.has_social_insurance ||
                      item.has_health_insurance ||
                      item.has_unemployment_insurance ? (
                        <div className="insurance-value">
                          <FaShieldAlt />

                          <div>
                            <strong>Có tham gia</strong>

                            <small>
                              Mức đóng: {formatMoney(item.insurance_salary)}
                            </small>
                          </div>
                        </div>
                      ) : (
                        <Badge bg="light" text="dark">
                          Không tham gia
                        </Badge>
                      )}
                    </td>

                    <td data-label="Áp dụng">
                      <div className="salary-period">
                        <strong>{formatDate(item.effective_from)}</strong>

                        <small>
                          đến{" "}
                          {item.effective_to
                            ? formatDate(item.effective_to)
                            : "Hiện tại"}
                        </small>
                      </div>
                    </td>

                    <td data-label="Trạng thái">
                      {Number(item.status) === 1 ? (
                        <Badge bg="success">Đang áp dụng</Badge>
                      ) : (
                        <Badge bg="secondary">Ngừng áp dụng</Badge>
                      )}
                    </td>

                    <td data-label="Thao tác" className="text-end">
                      <div className="salary-actions">
                        <Button
                          variant="light"
                          title="Lịch sử lương"
                          onClick={() => handleOpenHistory(item)}
                        >
                          <FaHistory />
                        </Button>

                        <Button
                          variant="outline-primary"
                          title="Chỉnh sửa"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <FaEdit />
                        </Button>

                        <Button
                          variant="primary"
                          title="Tạo phiên bản lương mới"
                          onClick={() => handleOpenNewVersion(item)}
                        >
                          <FaPlus />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* CREATE / EDIT MODAL */}

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
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title className="salary-modal-title">
            <div className="salary-modal-icon">
              <FaCoins />
            </div>

            <div>
              <strong>{getModalTitle()}</strong>

              <small>Thiết lập thông tin áp dụng cho nhân viên</small>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {modalMode === "NEW_VERSION" && (
            <div className="salary-info-box">
              <FaCheckCircle />

              <span>
                Cấu hình hiện tại sẽ được kết thúc trước ngày áp dụng mới. Hệ
                thống vẫn giữ nguyên lịch sử lương cũ.
              </span>
            </div>
          )}

          <Row className="g-3">
            {/* USER */}

            <Col md={12}>
              <Form.Group>
                <Form.Label className="salary-modal-label">
                  Nhân viên
                  <span className="text-danger ms-1">*</span>
                </Form.Label>

                <InputGroup className="salary-modal-input">
                  <InputGroup.Text>
                    <FaUserCircle />
                  </InputGroup.Text>

                  <Form.Select
                    value={form.user_id}
                    disabled={saving || modalMode !== "CREATE"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        user_id: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Chọn nhân viên --</option>

                    {users.map((user) => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.user_id} - {user.name}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Form.Group>
            </Col>

            {/* TYPE */}

            <Col md={6}>
              <Form.Group>
                <Form.Label className="salary-modal-label">
                  Loại nhân sự
                </Form.Label>

                <InputGroup className="salary-modal-input">
                  <InputGroup.Text>
                    <FaBriefcase />
                  </InputGroup.Text>

                  <Form.Select
                    value={form.employee_type}
                    disabled={saving}
                    onChange={(e) => handleEmployeeTypeChange(e.target.value)}
                  >
                    <option value="OFFICIAL">Nhân viên chính thức</option>

                    <option value="PROBATION">Nhân viên thử việc</option>

                    <option value="INTERN">Thực tập sinh</option>

                    <option value="PART_TIME">Bán thời gian</option>

                    <option value="COLLABORATOR">Cộng tác viên</option>
                  </Form.Select>
                </InputGroup>
              </Form.Group>
            </Col>

            {/* NAME */}

            <Col md={6}>
              <Form.Group>
                <Form.Label className="salary-modal-label">
                  Tên cấu hình
                </Form.Label>

                <Form.Control
                  value={form.salary_name}
                  disabled={saving}
                  placeholder="VD: Lương chính thức"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      salary_name: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>

            {/* BASE */}

            <Col md={6}>
              <Form.Group>
                <Form.Label className="salary-modal-label">
                  Lương cơ bản
                  <span className="text-danger ms-1">*</span>
                </Form.Label>

                <InputGroup>
                  <Form.Control
                    type="number"
                    min="0"
                    value={form.base_salary}
                    disabled={saving}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        base_salary: e.target.value,
                      })
                    }
                  />

                  <InputGroup.Text>VNĐ</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>

            {/* ALLOWANCE */}

            <Col md={6}>
              <Form.Group>
                <Form.Label className="salary-modal-label">
                  Phụ cấp cố định
                </Form.Label>

                <InputGroup>
                  <Form.Control
                    type="number"
                    min="0"
                    value={form.fixed_allowance}
                    disabled={saving}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fixed_allowance: e.target.value,
                      })
                    }
                  />

                  <InputGroup.Text>VNĐ</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={12}>
              <div className="salary-switch-box">
                <div>
                  <strong>Tính lương theo ngày công</strong>

                  <small>
                    Lương thực tế = lương cơ bản / công chuẩn × công thực tế
                  </small>
                </div>

                <Form.Check
                  type="switch"
                  checked={form.salary_by_attendance}
                  disabled={saving}
                  onChange={(e) =>
                    setForm({
                      ...form,

                      salary_by_attendance: e.target.checked,
                    })
                  }
                />
              </div>
            </Col>

            {/* INSURANCE */}

            <Col md={12}>
              <div className="salary-section-title">
                <FaShieldAlt />
                Thông tin bảo hiểm
              </div>
            </Col>

            <Col md={4}>
              <Form.Check
                type="switch"
                label="BHXH"
                checked={form.has_social_insurance}
                disabled={saving}
                onChange={(e) =>
                  setForm({
                    ...form,

                    has_social_insurance: e.target.checked,
                  })
                }
              />
            </Col>

            <Col md={4}>
              <Form.Check
                type="switch"
                label="BHYT"
                checked={form.has_health_insurance}
                disabled={saving}
                onChange={(e) =>
                  setForm({
                    ...form,

                    has_health_insurance: e.target.checked,
                  })
                }
              />
            </Col>

            <Col md={4}>
              <Form.Check
                type="switch"
                label="BHTN"
                checked={form.has_unemployment_insurance}
                disabled={saving}
                onChange={(e) =>
                  setForm({
                    ...form,

                    has_unemployment_insurance: e.target.checked,
                  })
                }
              />
            </Col>

            {(form.has_social_insurance ||
              form.has_health_insurance ||
              form.has_unemployment_insurance) && (
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="salary-modal-label">
                    Mức lương đóng bảo hiểm
                  </Form.Label>

                  <InputGroup>
                    <Form.Control
                      type="number"
                      min="0"
                      value={form.insurance_salary}
                      disabled={saving}
                      onChange={(e) =>
                        setForm({
                          ...form,

                          insurance_salary: e.target.value,
                        })
                      }
                    />

                    <InputGroup.Text>VNĐ</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            )}

            {/* DATE */}

            <Col md={6}>
              <Form.Group>
                <Form.Label className="salary-modal-label">
                  Ngày bắt đầu áp dụng
                </Form.Label>

                <InputGroup className="salary-modal-input">
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>

                  <Form.Control
                    type="date"
                    value={form.effective_from}
                    disabled={saving}
                    onChange={(e) =>
                      setForm({
                        ...form,

                        effective_from: e.target.value,
                      })
                    }
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="salary-modal-label">
                  Ngày kết thúc
                </Form.Label>

                <InputGroup className="salary-modal-input">
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>

                  <Form.Control
                    type="date"
                    value={form.effective_to}
                    disabled={saving || modalMode === "NEW_VERSION"}
                    onChange={(e) =>
                      setForm({
                        ...form,

                        effective_to: e.target.value,
                      })
                    }
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            {/* PIT */}

            <Col md={12}>
              <Form.Check
                type="switch"
                label="Áp dụng thuế thu nhập cá nhân"
                checked={form.has_personal_income_tax}
                disabled={saving}
                onChange={(e) =>
                  setForm({
                    ...form,

                    has_personal_income_tax: e.target.checked,
                  })
                }
              />
            </Col>

            {/* NOTE */}

            <Col md={12}>
              <Form.Group>
                <Form.Label className="salary-modal-label">Ghi chú</Form.Label>

                <Form.Control
                  as="textarea"
                  rows={3}
                  maxLength={500}
                  value={form.note}
                  disabled={saving}
                  placeholder="Ghi chú cấu hình lương..."
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

        <Modal.Footer>
          <Button
            variant="light"
            disabled={saving}
            onClick={() => setShowModal(false)}
          >
            Hủy
          </Button>

          <Button
            variant="primary"
            className="salary-save-btn"
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
                Lưu cấu hình
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* HISTORY */}

      <Modal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaHistory className="me-2" />
            Lịch sử lương
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {historyUser && (
            <div className="history-user-box">
              <div className="salary-avatar">
                {historyUser.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div>
                <strong>{historyUser.name}</strong>

                <small>{historyUser.position || "Chưa có chức vụ"}</small>
              </div>
            </div>
          )}

          {historyLoading ? (
            <div className="salary-empty">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table hover responsive className="salary-table">
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Lương</th>
                  <th>BH</th>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                </tr>
              </thead>

              <tbody>
                {salaryHistory.map((item) => (
                  <tr key={item.salary_config_id}>
                    <td>{getEmployeeTypeLabel(item.employee_type)}</td>

                    <td>{formatMoney(item.base_salary)}</td>

                    <td>
                      {item.insurance_salary
                        ? formatMoney(item.insurance_salary)
                        : "---"}
                    </td>

                    <td>{formatDate(item.effective_from)}</td>

                    <td>
                      {item.effective_to
                        ? formatDate(item.effective_to)
                        : "Hiện tại"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SalaryConfig;
