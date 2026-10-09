import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Form,
  InputGroup,
  Modal,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  BsCaretLeftFill,
  BsCaretRightFill,
  BsEye,
  BsEyeSlash,
  BsPencil,
  BsPlusLg,
  BsSearch,
  BsPeople,
  BsPersonCheck,
  BsShieldCheck,
  BsPersonX,
} from "react-icons/bs";

import APIToken from "../../config/APIToken";

import "./index.css";

const ITEMS_PER_PAGE = 10;

// ============================================================
// ROLE OPTIONS
// ============================================================

const ROLE_OPTIONS = [
  {
    value: "",
    label: "Tất cả quyền",
  },
  {
    value: "admin",
    label: "Quản trị viên",
  },
  {
    value: "NV",
    label: "Nhân viên",
  },
];

// ============================================================
// STATUS OPTIONS
// ============================================================

const STATUS_OPTIONS = [
  {
    value: "",
    label: "Tất cả trạng thái",
  },
  {
    value: "1",
    label: "Đang hoạt động",
  },
  {
    value: "0",
    label: "Ngừng hoạt động",
  },
];

// ============================================================
// FORMAT DATE
// ============================================================

const formatDate = (value) => {
  if (!value) {
    return "---";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
};

// ============================================================
// NORMALIZE TEXT
// ============================================================

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("vi");
};

// ============================================================
// ROLE META
// ============================================================

const getRoleMeta = (role) => {
  if (role === "admin") {
    return {
      label: "Quản trị viên",
      className: "admin",
    };
  }

  return {
    label: "Nhân viên",
    className: "employee",
  };
};

// ============================================================
// STATUS META
// ============================================================

const getStatusMeta = (status) => {
  const active = Number(status) === 1;

  if (active) {
    return {
      label: "Đang hoạt động",
      className: "active",
    };
  }

  return {
    label: "Ngừng hoạt động",
    className: "inactive",
  };
};

// ============================================================
// EMPLOYEE LIST
// ============================================================

const User = () => {
  const navigate = useNavigate();

  // ==========================================================
  // DATA
  // ==========================================================

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(false);

  // ==========================================================
  // FILTER
  // ==========================================================

  const [searchTerm, setSearchTerm] = useState("");

  const [role, setRole] = useState("");

  const [status, setStatus] = useState("");

  const [position, setPosition] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  // ==========================================================
  // ADD EMPLOYEE
  // ==========================================================

  const [showAddModal, setShowAddModal] = useState(false);

  const [addingEmployee, setAddingEmployee] = useState(false);

  const [addError, setAddError] = useState("");

  const [addSuccess, setAddSuccess] = useState("");

  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    role: "NV",
    email: "",
    phone: "",
    position: "",
    description: "",
    avatar: "",
    password: "",
    status: 1,
  });

  // ==========================================================
  // VIEW EMPLOYEE DETAIL
  // ==========================================================

  const [showDetailModal, setShowDetailModal] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  // ==========================================================
  // PAGINATION
  // ==========================================================

  const [currentPage, setCurrentPage] = useState(1);

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    getEmployees();
  }, []);

  // ==========================================================
  // GET EMPLOYEES
  // ==========================================================

  const getEmployees = async () => {
    try {
      setLoading(true);

      const response = await APIToken.get("/user/get");

      const data = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

      // ======================================================
      // CHỈ LẤY FIELD CẦN THIẾT
      // KHÔNG ĐƯA PASSWORD VÀO STATE
      // ======================================================

      const safeData = data
        .map((item) => ({
          user_id: item.user_id,
          name: item.name,
          role: item.role,
          email: item.email,
          phone: item.phone,
          position: item.position,
          description: item.description,
          avatar: item.avatar,
          created_by: item.created_by,
          created_at: item.created_at,
          status: item.status,
        }))
        .sort((a, b) => Number(b.user_id) - Number(a.user_id));

      setEmployees(safeData);
    } catch (error) {
      console.error("Lỗi lấy danh sách nhân viên:", error);

      console.error("Backend:", error?.response?.data);

      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // POSITION OPTIONS
  // ==========================================================

  const positionOptions = useMemo(() => {
    const values = employees
      .map((item) => String(item.position || "").trim())
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) => a.localeCompare(b, "vi"));
  }, [employees]);

  // ==========================================================
  // FILTER EMPLOYEES
  // ==========================================================

  const filteredEmployees = useMemo(() => {
    const keyword = normalizeText(searchTerm);

    return employees.filter((item) => {
      // ======================================================
      // SEARCH
      // ======================================================

      const matchSearch =
        !keyword ||
        [item.user_id, item.name, item.email, item.phone, item.position].some(
          (value) => normalizeText(value).includes(keyword),
        );

      // ======================================================
      // ROLE
      // ======================================================

      const matchRole = !role || item.role === role;

      // ======================================================
      // STATUS
      // ======================================================

      const matchStatus =
        status === "" || String(Number(item.status)) === status;

      // ======================================================
      // POSITION
      // ======================================================

      const matchPosition =
        !position || String(item.position || "").trim() === position;

      return matchSearch && matchRole && matchStatus && matchPosition;
    });
  }, [employees, searchTerm, role, status, position]);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const stats = useMemo(() => {
    return {
      total: employees.length,

      active: employees.filter((item) => Number(item.status) === 1).length,

      admin: employees.filter((item) => item.role === "admin").length,

      inactive: employees.filter((item) => Number(item.status) !== 1).length,
    };
  }, [employees]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalResults = filteredEmployees.length;

  const totalPages = Math.max(Math.ceil(totalResults / ITEMS_PER_PAGE), 1);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex =
    totalResults > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;

  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalResults);

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,

    currentPage * ITEMS_PER_PAGE,
  );

  // ==========================================================
  // PAGE NUMBERS
  // ==========================================================

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages,
        },

        (_, index) => index + 1,
      );
    }

    let startPage = Math.max(currentPage - 2, 1);

    let endPage = startPage + 4;

    if (endPage > totalPages) {
      endPage = totalPages;

      startPage = totalPages - 4;
    }

    return Array.from(
      {
        length: endPage - startPage + 1,
      },

      (_, index) => startPage + index,
    );
  };

  // ==========================================================
  // RESET FILTER
  // ==========================================================

  const resetFilters = () => {
    setSearchTerm("");

    setRole("");

    setStatus("");

    setPosition("");

    setCurrentPage(1);
  };

  // ==========================================================
  // CHANGE ADD EMPLOYEE FORM
  // ==========================================================

  const handleEmployeeFormChange = (event) => {
    const { name, value } = event.target;

    setEmployeeForm((prev) => ({
      ...prev,

      [name]: name === "status" ? Number(value) : value,
    }));
  };

  // ==========================================================
  // RESET ADD EMPLOYEE FORM
  // ==========================================================

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: "",
      role: "NV",
      email: "",
      phone: "",
      position: "",
      description: "",
      avatar: "",
      password: "",
      status: 1,
    });

    setAddError("");

    setAddSuccess("");
  };

  // ==========================================================
  // OPEN ADD EMPLOYEE MODAL
  // ==========================================================

  const handleOpenAddModal = () => {
    resetEmployeeForm();

    setShowAddModal(true);
  };

  // ==========================================================
  // CLOSE ADD EMPLOYEE MODAL
  // ==========================================================

  const handleCloseAddModal = () => {
    if (addingEmployee) {
      return;
    }

    setShowAddModal(false);

    resetEmployeeForm();
  };

  // ==========================================================
  // VALIDATE EMAIL
  // ==========================================================

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // ==========================================================
  // ADD EMPLOYEE
  // ==========================================================

  const handleAddEmployee = async (event) => {
    event.preventDefault();

    // ======================================================
    // VALIDATE
    // ======================================================

    if (!employeeForm.name.trim()) {
      setAddError("Vui lòng nhập họ và tên");

      return;
    }

    if (!employeeForm.email.trim()) {
      setAddError("Vui lòng nhập email");

      return;
    }

    if (!isValidEmail(employeeForm.email.trim())) {
      setAddError("Email không đúng định dạng");

      return;
    }

    if (!employeeForm.position.trim()) {
      setAddError("Vui lòng nhập chức vụ");

      return;
    }

    if (!employeeForm.role) {
      setAddError("Vui lòng chọn quyền tài khoản");

      return;
    }

    if (!employeeForm.password.trim()) {
      setAddError("Vui lòng nhập mật khẩu");

      return;
    }

    try {
      setAddingEmployee(true);

      setAddError("");

      setAddSuccess("");

      // ======================================================
      // CREATED BY
      // ======================================================

      let createdBy = 1001;

      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");

        if (userData?.user_id) {
          createdBy = userData.user_id;
        } else if (userData?.id) {
          createdBy = userData.id;
        }
      } catch (error) {
        console.error("Không đọc được user localStorage:", error);
      }

      // ======================================================
      // PAYLOAD
      // ======================================================

      const payload = {
        name: employeeForm.name.trim(),

        role: employeeForm.role,

        email: employeeForm.email.trim(),

        phone: employeeForm.phone.trim() || "",

        position: employeeForm.position.trim(),

        description: employeeForm.description.trim() || null,

        avatar: employeeForm.avatar.trim() || null,

        password: employeeForm.password,

        created_by: createdBy,

        created_at: new Date().toISOString(),

        status: Number(employeeForm.status),
      };

      console.log("Payload thêm nhân viên:", payload);

      // ======================================================
      // CALL API
      // ======================================================

      const response = await APIToken.post("/user/add", payload);

      console.log("Thêm nhân viên thành công:", response?.data);

      // ======================================================
      // SUCCESS
      // ======================================================

      setAddSuccess(response?.data?.message || "Thêm nhân viên thành công");

      // ======================================================
      // LOAD LẠI DANH SÁCH
      // ======================================================

      await getEmployees();

      // ======================================================
      // ĐÓNG MODAL
      // ======================================================

      setTimeout(() => {
        setShowAddModal(false);

        resetEmployeeForm();
      }, 800);
    } catch (error) {
      console.error("Lỗi thêm nhân viên:", error);

      console.error("Backend:", error?.response?.data);

      setAddError(error?.response?.data?.message || "Không thể thêm nhân viên");
    } finally {
      setAddingEmployee(false);
    }
  };

  // ==========================================================
  // OPEN DETAIL MODAL
  // ==========================================================

  const handleOpenDetailModal = (employee) => {
    setSelectedEmployee(employee);

    setShowDetailModal(true);
  };

  // ==========================================================
  // CLOSE DETAIL MODAL
  // ==========================================================

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);

    setSelectedEmployee(null);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="emp-container">
      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="emp-breadcrumb">
        <span>Nhân sự</span>

        <span>/</span>

        <strong>Danh sách nhân viên</strong>
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="emp-header">
        <div className="emp-header-info">
          <h2>Danh sách nhân viên</h2>

          <p>Quản lý tài khoản và thông tin nhân sự công ty</p>
        </div>

        <Button className="emp-add-btn" onClick={handleOpenAddModal}>
          <BsPlusLg />

          <span>Thêm nhân viên</span>
        </Button>
      </div>

      {/* =====================================================
          FILTER
      ===================================================== */}

      <div className="emp-filter-card">
        <div className="emp-filter-grid">
          {/* SEARCH */}

          <InputGroup className="emp-search">
            <Form.Control
              value={searchTerm}
              placeholder="Tìm tên, email, SĐT, mã nhân viên..."
              onChange={(event) => {
                setSearchTerm(event.target.value);

                setCurrentPage(1);
              }}
            />

            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
          </InputGroup>

          {/* ROLE */}

          <Form.Select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);

              setCurrentPage(1);
            }}
          >
            {ROLE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Form.Select>

          {/* POSITION */}

          <Form.Select
            value={position}
            onChange={(event) => {
              setPosition(event.target.value);

              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả chức vụ</option>

            {positionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Form.Select>

          {/* STATUS */}

          <Form.Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);

              setCurrentPage(1);
            }}
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Form.Select>

          {/* RESET */}

          <Button
            variant="light"
            className="emp-reset-btn"
            onClick={resetFilters}
          >
            Đặt lại
          </Button>
        </div>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="emp-stat-grid">
        {/* TOTAL */}

        <div className="emp-stat-card blue">
          <div className="emp-stat-icon">
            <BsPeople />
          </div>

          <div>
            <span>Tổng nhân sự</span>

            <strong>{stats.total}</strong>

            <small>Tất cả tài khoản nhân viên</small>
          </div>
        </div>

        {/* ACTIVE */}

        <div className="emp-stat-card green">
          <div className="emp-stat-icon">
            <BsPersonCheck />
          </div>

          <div>
            <span>Đang hoạt động</span>

            <strong>{stats.active}</strong>

            <small>Tài khoản đang được sử dụng</small>
          </div>
        </div>

        {/* ADMIN */}

        <div className="emp-stat-card purple">
          <div className="emp-stat-icon">
            <BsShieldCheck />
          </div>

          <div>
            <span>Quản trị viên</span>

            <strong>{stats.admin}</strong>

            <small>Tài khoản có quyền admin</small>
          </div>
        </div>

        {/* INACTIVE */}

        <div className="emp-stat-card red">
          <div className="emp-stat-icon">
            <BsPersonX />
          </div>

          <div>
            <span>Ngừng hoạt động</span>

            <strong>{stats.inactive}</strong>

            <small>Tài khoản đã vô hiệu hóa</small>
          </div>
        </div>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="emp-content-card">
        <div className="emp-table-top">
          <span>
            Hiển thị <strong>{paginatedEmployees.length}</strong> kết quả
          </span>

          <span>
            Tổng cộng <strong>{totalResults}</strong> nhân viên
          </span>
        </div>

        <div className="table-responsive">
          <table className="emp-table">
            <thead>
              <tr>
                <th>STT</th>

                <th>Nhân viên</th>

                <th>Liên hệ</th>

                <th>Chức vụ</th>

                <th>Quyền</th>

                <th>Ngày tạo</th>

                <th>Trạng thái</th>

                <th className="text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {/* =============================================
                  LOADING
              ============================================= */}

              {loading ? (
                <tr>
                  <td colSpan="8" className="emp-empty">
                    <Spinner animation="border" size="sm" />

                    <span className="ms-2">Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((item, index) => {
                  const roleMeta = getRoleMeta(item.role);

                  const statusMeta = getStatusMeta(item.status);

                  return (
                    <tr key={item.user_id}>
                      {/* STT */}

                      <td data-label="STT">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>

                      {/* EMPLOYEE */}

                      <td data-label="Nhân viên">
                        <div className="emp-person">
                          {item.avatar ? (
                            <img
                              className="emp-avatar"
                              src={item.avatar}
                              alt={item.name || "Avatar"}
                            />
                          ) : (
                            <div className="emp-avatar emp-avatar-fallback">
                              {String(item.name || "N")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div className="emp-person-info">
                            <button
                              type="button"
                              className="emp-name-link"
                              onClick={() =>
                                navigate(`/employees/detail/${item.user_id}`)
                              }
                            >
                              {item.name || "---"}
                            </button>

                            <small>ID: {item.user_id}</small>
                          </div>
                        </div>
                      </td>

                      {/* CONTACT */}

                      <td data-label="Liên hệ">
                        <div className="emp-contact">
                          <span>{item.email || "---"}</span>

                          <small>{item.phone || "Chưa có SĐT"}</small>
                        </div>
                      </td>

                      {/* POSITION */}

                      <td data-label="Chức vụ">{item.position || "---"}</td>

                      {/* ROLE */}

                      <td data-label="Quyền">
                        <span className={`emp-role ${roleMeta.className}`}>
                          {roleMeta.label}
                        </span>
                      </td>

                      {/* CREATED AT */}

                      <td data-label="Ngày tạo">
                        {formatDate(item.created_at)}
                      </td>

                      {/* STATUS */}

                      <td data-label="Trạng thái">
                        <span className={`emp-status ${statusMeta.className}`}>
                          <i />

                          {statusMeta.label}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td data-label="Thao tác" className="emp-action-cell">
                        <div className="emp-actions">
                          <button
                            type="button"
                            title="Xem nhân viên"
                            onClick={() => handleOpenDetailModal(item)}
                          >
                            <BsEye />
                          </button>

                          <button
                            type="button"
                            title="Sửa nhân viên"
                            // onClick={() =>
                            //   navigate(`/employees/edit/${item.user_id}`)
                            // }
                          >
                            <BsPencil />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* =============================================
                   EMPTY
                ============================================= */

                <tr>
                  <td colSpan="8" className="emp-empty">
                    Không tìm thấy nhân viên phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            PAGINATION
        =================================================== */}

        <div className="emp-pagination">
          <span>
            Hiển thị {startIndex} đến {endIndex} của {totalResults} kết quả
          </span>

          <div className="emp-page-btns">
            {/* PREVIOUS */}

            <button
              type="button"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage((value) => Math.max(value - 1, 1))}
            >
              <BsCaretLeftFill />
            </button>

            {/* PAGE */}

            {getPageNumbers().map((page) => (
              <button
                type="button"
                key={page}
                className={currentPage === page ? "active" : ""}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            {/* NEXT */}

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() =>
                setCurrentPage((value) => Math.min(value + 1, totalPages))
              }
            >
              <BsCaretRightFill />
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
    ADD EMPLOYEE MODAL
===================================================== */}

      <Modal
        show={showAddModal}
        onHide={handleCloseAddModal}
        centered
        size="lg"
        backdrop={addingEmployee ? "static" : true}
        keyboard={!addingEmployee}
      >
        <Form onSubmit={handleAddEmployee}>
          {/* =================================================
        HEADER
    ================================================= */}

          <Modal.Header closeButton={!addingEmployee}>
            <Modal.Title>Thêm nhân viên</Modal.Title>
          </Modal.Header>

          {/* =================================================
        BODY
    ================================================= */}

          <Modal.Body>
            {/* ERROR */}

            {addError && (
              <Alert variant="danger" className="mb-3">
                {addError}
              </Alert>
            )}

            {/* SUCCESS */}

            {addSuccess && (
              <Alert variant="success" className="mb-3">
                {addSuccess}
              </Alert>
            )}

            <div className="emp-add-form-grid">
              {/* =============================================
            NAME
        ============================================= */}

              <Form.Group className="emp-form-full">
                <Form.Label>
                  Họ và tên <span className="emp-required">*</span>
                </Form.Label>

                <Form.Control
                  type="text"
                  name="name"
                  value={employeeForm.name}
                  placeholder="Nhập họ và tên nhân viên"
                  onChange={handleEmployeeFormChange}
                  disabled={addingEmployee}
                  autoFocus
                />
              </Form.Group>

              {/* =============================================
            EMAIL
        ============================================= */}

              <Form.Group>
                <Form.Label>
                  Email <span className="emp-required">*</span>
                </Form.Label>

                <Form.Control
                  type="email"
                  name="email"
                  value={employeeForm.email}
                  placeholder="example@gmail.com"
                  onChange={handleEmployeeFormChange}
                  disabled={addingEmployee}
                />
              </Form.Group>

              {/* =============================================
            PHONE
        ============================================= */}

              <Form.Group>
                <Form.Label>Số điện thoại</Form.Label>

                <Form.Control
                  type="text"
                  name="phone"
                  value={employeeForm.phone}
                  placeholder="Nhập số điện thoại"
                  onChange={handleEmployeeFormChange}
                  disabled={addingEmployee}
                />
              </Form.Group>

              {/* =============================================
            POSITION
        ============================================= */}

              <Form.Group>
                <Form.Label>
                  Chức vụ <span className="emp-required">*</span>
                </Form.Label>

                <Form.Control
                  type="text"
                  name="position"
                  value={employeeForm.position}
                  placeholder="VD: Nhân viên kinh doanh"
                  onChange={handleEmployeeFormChange}
                  disabled={addingEmployee}
                />
              </Form.Group>

              {/* =============================================
            ROLE
        ============================================= */}

              <Form.Group>
                <Form.Label>
                  Quyền tài khoản <span className="emp-required">*</span>
                </Form.Label>

                <Form.Select
                  name="role"
                  value={employeeForm.role}
                  onChange={handleEmployeeFormChange}
                  disabled={addingEmployee}
                >
                  <option value="NV">Nhân viên</option>

                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>

              {/* =============================================
            PASSWORD
        ============================================= */}

              <Form.Group>
                <Form.Label>
                  Mật khẩu <span className="emp-required">*</span>
                </Form.Label>

                <div className="emp-password-wrap">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={employeeForm.password}
                    placeholder="Nhập mật khẩu tài khoản"
                    onChange={handleEmployeeFormChange}
                    disabled={addingEmployee}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="emp-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={addingEmployee}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <BsEyeSlash /> : <BsEye />}
                  </button>
                </div>
              </Form.Group>

              {/* =============================================
            STATUS
        ============================================= */}

              <Form.Group>
                <Form.Label>Trạng thái</Form.Label>

                <Form.Select
                  name="status"
                  value={employeeForm.status}
                  onChange={handleEmployeeFormChange}
                  disabled={addingEmployee}
                >
                  <option value={1}>Đang hoạt động</option>

                  <option value={0}>Ngừng hoạt động</option>
                </Form.Select>
              </Form.Group>

              {/* =============================================
            AVATAR
        ============================================= */}

              <Form.Group className="emp-form-full">
                <Form.Label>Avatar URL</Form.Label>

                <Form.Control
                  type="text"
                  name="avatar"
                  value={employeeForm.avatar}
                  placeholder="https://..."
                  onChange={handleEmployeeFormChange}
                  disabled={addingEmployee}
                />
              </Form.Group>

              {/* =============================================
            DESCRIPTION
        ============================================= */}

              <Form.Group className="emp-form-full">
                <Form.Label>Ghi chú</Form.Label>

                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={employeeForm.description}
                  placeholder="Nhập ghi chú nếu có"
                  onChange={handleEmployeeFormChange}
                  disabled={addingEmployee}
                />
              </Form.Group>
            </div>
          </Modal.Body>

          {/* =================================================
        FOOTER
    ================================================= */}

          <Modal.Footer>
            <Button
              type="button"
              variant="light"
              className="emp-modal-cancel"
              onClick={handleCloseAddModal}
              disabled={addingEmployee}
            >
              Hủy
            </Button>

            <Button
              type="submit"
              className="emp-modal-submit"
              disabled={addingEmployee}
            >
              {addingEmployee ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <BsPlusLg className="me-1" />
                  Thêm nhân viên
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* =====================================================
    EMPLOYEE DETAIL MODAL
===================================================== */}

      <Modal
        show={showDetailModal}
        onHide={handleCloseDetailModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết nhân viên</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedEmployee && (
            <div className="emp-detail">
              {/* =============================================
            PROFILE HEADER
        ============================================= */}

              <div className="emp-detail-header">
                {selectedEmployee.avatar ? (
                  <img
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.name}
                    className="emp-detail-avatar"
                  />
                ) : (
                  <div className="emp-detail-avatar emp-detail-avatar-fallback">
                    {String(selectedEmployee.name || "N")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="emp-detail-heading">
                  <h4>{selectedEmployee.name || "---"}</h4>

                  <span>
                    ID nhân viên: <strong>{selectedEmployee.user_id}</strong>
                  </span>

                  <div className="emp-detail-badges">
                    <span
                      className={`emp-role ${
                        getRoleMeta(selectedEmployee.role).className
                      }`}
                    >
                      {getRoleMeta(selectedEmployee.role).label}
                    </span>

                    <span
                      className={`emp-status ${
                        getStatusMeta(selectedEmployee.status).className
                      }`}
                    >
                      <i />

                      {getStatusMeta(selectedEmployee.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* =============================================
            INFORMATION
        ============================================= */}

              <div className="emp-detail-section">
                <div className="emp-detail-section-title">
                  Thông tin nhân viên
                </div>

                <div className="emp-detail-grid">
                  {/* NAME */}

                  <div className="emp-detail-item">
                    <span className="emp-detail-label">Họ và tên</span>

                    <strong>{selectedEmployee.name || "---"}</strong>
                  </div>

                  {/* EMAIL */}

                  <div className="emp-detail-item">
                    <span className="emp-detail-label">Email</span>

                    <strong>{selectedEmployee.email || "---"}</strong>
                  </div>

                  {/* PHONE */}

                  <div className="emp-detail-item">
                    <span className="emp-detail-label">Số điện thoại</span>

                    <strong>{selectedEmployee.phone || "---"}</strong>
                  </div>

                  {/* POSITION */}

                  <div className="emp-detail-item">
                    <span className="emp-detail-label">Chức vụ</span>

                    <strong>{selectedEmployee.position || "---"}</strong>
                  </div>

                  {/* ROLE */}

                  <div className="emp-detail-item">
                    <span className="emp-detail-label">Quyền tài khoản</span>

                    <strong>{getRoleMeta(selectedEmployee.role).label}</strong>
                  </div>

                  {/* STATUS */}

                  <div className="emp-detail-item">
                    <span className="emp-detail-label">Trạng thái</span>

                    <strong>
                      {getStatusMeta(selectedEmployee.status).label}
                    </strong>
                  </div>

                  {/* CREATED AT */}

                  <div className="emp-detail-item">
                    <span className="emp-detail-label">Ngày tạo</span>

                    <strong>{formatDate(selectedEmployee.created_at)}</strong>
                  </div>

                  {/* CREATED BY */}

                  <div className="emp-detail-item">
                    <span className="emp-detail-label">Người tạo</span>

                    <strong>{selectedEmployee.created_by || "---"}</strong>
                  </div>
                </div>
              </div>

              {/* =============================================
            DESCRIPTION
        ============================================= */}

              <div className="emp-detail-section">
                <div className="emp-detail-section-title">Ghi chú</div>

                <div className="emp-detail-description">
                  {selectedEmployee.description || "Không có ghi chú"}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="light"
            className="emp-modal-cancel"
            onClick={handleCloseDetailModal}
          >
            Đóng
          </Button>

          <Button
            className="emp-modal-submit"
            onClick={() => {
              handleCloseDetailModal();

              // if (selectedEmployee?.user_id) {
              //   navigate(`/employees/edit/${selectedEmployee.user_id}`);
              // }
            }}
          >
            <BsPencil className="me-2" />
            Chỉnh sửa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default User;
