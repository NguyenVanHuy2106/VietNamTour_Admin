import React, { useEffect, useMemo, useState } from "react";

import { Button, Modal, Spinner } from "react-bootstrap";

import {
  FaBuilding,
  FaCalendarAlt,
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaMapMarkerAlt,
  FaSearch,
  FaSyncAlt,
  FaUserCheck,
  FaUsers,
  FaUserTie,
} from "react-icons/fa";

import APIToken from "../../../config/APIToken";

import "./index.css";

// ==========================================================
// CONFIG
// ==========================================================

const STAFF_PAGE_SIZE = 6;

// ==========================================================
// STATUS
// ==========================================================

const STATUS_OPTIONS = [
  {
    value: "",
    label: "Tất cả trạng thái",
  },
  {
    value: "ASSIGNED",
    label: "Mới nhận",
  },
  {
    value: "CONTACTING",
    label: "Đang liên hệ",
  },
  {
    value: "INTERESTED",
    label: "Quan tâm",
  },
  {
    value: "FOLLOW_UP",
    label: "Cần chăm sóc lại",
  },
  {
    value: "NOT_INTERESTED",
    label: "Không quan tâm",
  },
  {
    value: "CONVERTED",
    label: "Đã chuyển đổi",
  },
];

const getStatusInfo = (status) => {
  const map = {
    ASSIGNED: {
      label: "Mới nhận",
      className: "admin-lead-status-assigned",
    },

    CONTACTING: {
      label: "Đang liên hệ",
      className: "admin-lead-status-contacting",
    },

    INTERESTED: {
      label: "Quan tâm",
      className: "admin-lead-status-interested",
    },

    FOLLOW_UP: {
      label: "Cần chăm sóc lại",
      className: "admin-lead-status-followup",
    },

    NOT_INTERESTED: {
      label: "Không quan tâm",
      className: "admin-lead-status-not-interested",
    },

    CONVERTED: {
      label: "Đã chuyển đổi",
      className: "admin-lead-status-converted",
    },
  };

  return (
    map[status] || {
      label: status || "-",
      className: "admin-lead-status-default",
    }
  );
};

// ==========================================================
// DATE
// ==========================================================

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
};

// ==========================================================
// MAIN COMPONENT
// ==========================================================

const AdminLeadManagement = () => {
  // ========================================================
  // PERMISSION
  // ========================================================

  const userId = Number(localStorage.getItem("userId"));

  const isAdmin = userId === 1001;

  // ========================================================
  // LOADING
  // ========================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [detailLoading, setDetailLoading] = useState(false);

  // ========================================================
  // DASHBOARD
  // ========================================================

  const [dashboard, setDashboard] = useState({
    summary: {
      total_assigned: 0,

      updated: 0,

      not_updated: 0,

      assigned: 0,

      contacting: 0,

      interested: 0,

      follow_up: 0,

      not_interested: 0,

      converted: 0,
    },

    performance: {
      update_rate: 0,

      conversion_rate: 0,

      overdue_follow_up: 0,

      upcoming_follow_up: 0,
    },
  });

  // ========================================================
  // STAFF PERFORMANCE
  // ========================================================

  const [staffPerformance, setStaffPerformance] = useState([]);

  const [staffPage, setStaffPage] = useState(1);

  // ========================================================
  // COMPANIES
  // ========================================================

  const [companies, setCompanies] = useState([]);

  const [page, setPage] = useState(1);

  const [limit] = useState(20);

  const [pagination, setPagination] = useState({
    page: 1,

    limit: 20,

    total: 0,

    totalPages: 1,
  });

  // ========================================================
  // FILTER INPUT
  // ========================================================

  const [searchInput, setSearchInput] = useState("");

  const [staffInput, setStaffInput] = useState("");

  const [statusInput, setStatusInput] = useState("");

  const [updatedInput, setUpdatedInput] = useState("ALL");

  const [overdueInput, setOverdueInput] = useState("ALL");

  // ========================================================
  // ACTIVE FILTER
  // ========================================================

  const [filters, setFilters] = useState({
    search: "",

    staff_id: "",

    status: "",

    updated: "ALL",

    overdue: "ALL",
  });

  // ========================================================
  // DETAIL
  // ========================================================

  const [showDetail, setShowDetail] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState(null);

  // ========================================================
  // FETCH DASHBOARD
  // ========================================================

  const fetchDashboard = async () => {
    const response = await APIToken.get("/lead-ai/admin/dashboard");

    const data = response?.data?.data;

    if (data) {
      setDashboard(data);
    }
  };

  // ========================================================
  // FETCH STAFF PERFORMANCE
  // ========================================================

  const fetchStaffPerformance = async () => {
    const response = await APIToken.get("/lead-ai/admin/staff-performance");

    const data = response?.data?.data;

    setStaffPerformance(Array.isArray(data) ? data : []);
  };

  // ========================================================
  // FETCH COMPANIES
  // ========================================================

  const fetchCompanies = async () => {
    const response = await APIToken.get("/lead-ai/admin/companies", {
      params: {
        page,

        limit,

        search: filters.search || undefined,

        staff_id: filters.staff_id || undefined,

        status: filters.status || undefined,

        updated: filters.updated || "ALL",

        overdue: filters.overdue || "ALL",
      },
    });

    const rows = response?.data?.data || [];

    const pageData = response?.data?.pagination || {
      page: 1,

      limit,

      total: 0,

      totalPages: 1,
    };

    setCompanies(rows);

    setPagination(pageData);
  };

  // ========================================================
  // LOAD ALL
  // ========================================================

  const loadAll = async (isRefresh = false) => {
    if (!isAdmin) {
      setLoading(false);

      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      await Promise.all([
        fetchDashboard(),

        fetchStaffPerformance(),

        fetchCompanies(),
      ]);
    } catch (error) {
      console.error("load admin Lead AI error:", error);

      alert(
        error?.response?.data?.message ||
          "Không thể tải dữ liệu quản trị Lead AI.",
      );
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };

  // ========================================================
  // FIRST LOAD
  // ========================================================

  useEffect(() => {
    loadAll();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================================================
  // RELOAD COMPANIES
  // ========================================================

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    if (loading) {
      return;
    }

    const load = async () => {
      try {
        await fetchCompanies();
      } catch (error) {
        console.error("fetch admin companies error:", error);
      }
    };

    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  // ========================================================
  // FILTER
  // ========================================================

  const handleFilter = (event) => {
    event.preventDefault();

    setPage(1);

    setFilters({
      search: searchInput.trim(),

      staff_id: staffInput,

      status: statusInput,

      updated: updatedInput,

      overdue: overdueInput,
    });
  };

  // ========================================================
  // RESET FILTER
  // ========================================================

  const handleReset = () => {
    setSearchInput("");

    setStaffInput("");

    setStatusInput("");

    setUpdatedInput("ALL");

    setOverdueInput("ALL");

    setPage(1);

    setFilters({
      search: "",

      staff_id: "",

      status: "",

      updated: "ALL",

      overdue: "ALL",
    });
  };

  // ========================================================
  // DETAIL
  // ========================================================

  const handleOpenDetail = async (company) => {
    if (!company?.id) {
      return;
    }

    try {
      setDetailLoading(true);

      setShowDetail(true);

      const response = await APIToken.get(
        `/lead-ai/admin/companies/${company.id}`,
      );

      setSelectedCompany(response?.data?.data || null);
    } catch (error) {
      console.error("fetch admin company detail:", error);

      setShowDetail(false);

      alert(error?.response?.data?.message || "Không thể tải phiếu chăm sóc.");
    } finally {
      setDetailLoading(false);
    }
  };

  // ========================================================
  // STAFF MAP
  // ========================================================

  const staffMap = useMemo(() => {
    const map = new Map();

    staffPerformance.forEach((staff) => {
      map.set(Number(staff.staff_id), staff);
    });

    return map;
  }, [staffPerformance]);

  // ========================================================
  // STAFF PAGINATION
  // ========================================================

  const staffTotalPages = Math.max(
    1,
    Math.ceil(staffPerformance.length / STAFF_PAGE_SIZE),
  );

  const safeStaffPage = Math.min(staffPage, staffTotalPages);

  const paginatedStaff = useMemo(() => {
    const start = (safeStaffPage - 1) * STAFF_PAGE_SIZE;

    const end = start + STAFF_PAGE_SIZE;

    return staffPerformance.slice(start, end);
  }, [staffPerformance, safeStaffPage]);

  useEffect(() => {
    if (staffPage > staffTotalPages) {
      setStaffPage(staffTotalPages);
    }
  }, [staffPage, staffTotalPages]);

  // ========================================================
  // ACCESS DENIED
  // ========================================================

  if (!isAdmin) {
    return (
      <div className="admin-lead-access-denied">
        <FaExclamationTriangle />

        <h3>Không có quyền truy cập</h3>

        <p>Trang này chỉ dành cho quản trị viên Lead AI.</p>
      </div>
    );
  }

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="admin-lead-loading">
        <Spinner animation="border" />

        <span>Đang tải dữ liệu quản trị...</span>
      </div>
    );
  }

  // ========================================================
  // SHORTCUT
  // ========================================================

  const summary = dashboard?.summary || {};

  const performance = dashboard?.performance || {};

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="admin-lead-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="admin-lead-header">
        <div>
          <div className="admin-lead-eyebrow">
            VIỆT NAM TOUR · LEAD AI ADMIN
          </div>

          <h2>
            <FaChartBar />
            Quản lý chăm sóc khách hàng
          </h2>

          <p>
            Theo dõi tình hình nhận và chăm sóc dữ liệu khách hàng của nhân
            viên.
          </p>
        </div>

        <Button
          className="admin-lead-refresh-btn"
          disabled={refreshing}
          onClick={() => loadAll(true)}
        >
          {refreshing ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <FaSyncAlt />
          )}
          Làm mới
        </Button>
      </div>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="admin-lead-summary">
        <SummaryCard
          icon={<FaBuilding />}
          label="Tổng đã giao"
          value={summary.total_assigned || 0}
        />

        <SummaryCard
          icon={<FaUserCheck />}
          label="Đã cập nhật"
          value={summary.updated || 0}
          type="updated"
        />

        <SummaryCard
          icon={<FaExclamationTriangle />}
          label="Chưa cập nhật"
          value={summary.not_updated || 0}
          type="warning"
        />

        <SummaryCard
          icon={<FaCheckCircle />}
          label="Đã chuyển đổi"
          value={summary.converted || 0}
          type="converted"
        />
      </div>

      {/* ==================================================
          PERFORMANCE
      ================================================== */}

      <div className="admin-lead-performance-grid">
        <PerformanceCard
          label="Tỷ lệ cập nhật"
          value={`${performance.update_rate || 0}%`}
          icon={<FaUserCheck />}
          type="primary"
        />

        <PerformanceCard
          label="Tỷ lệ chuyển đổi"
          value={`${performance.conversion_rate || 0}%`}
          icon={<FaCheckCircle />}
          type="success"
        />

        <PerformanceCard
          label="Follow-up quá hạn"
          value={performance.overdue_follow_up || 0}
          icon={<FaExclamationTriangle />}
          type="danger"
        />

        <PerformanceCard
          label="Follow-up 7 ngày tới"
          value={performance.upcoming_follow_up || 0}
          icon={<FaCalendarAlt />}
          type="calendar"
        />
      </div>

      {/* ==================================================
          STAFF PERFORMANCE TABLE
      ================================================== */}

      <div className="admin-staff-table-card">
        <div className="admin-staff-table-header">
          <div>
            <h4>
              <FaUsers />
              Hiệu suất nhân viên
            </h4>

            <p>Theo dõi tình hình nhận và xử lý lead của từng nhân viên.</p>
          </div>

          <div className="admin-staff-table-count">
            {staffPerformance.length} nhân viên
          </div>
        </div>

        {staffPerformance.length === 0 ? (
          <div className="admin-lead-empty-small">
            Chưa có dữ liệu nhân viên.
          </div>
        ) : (
          <>
            <div className="admin-staff-performance-wrapper">
              <table className="admin-staff-performance-table">
                <thead>
                  <tr>
                    <th>Nhân viên</th>

                    <th className="text-center">Đã nhận</th>

                    <th className="text-center">Đã cập nhật</th>

                    <th className="text-center">Chưa cập nhật</th>

                    <th className="text-center">Quan tâm</th>

                    <th className="text-center">Chuyển đổi</th>

                    <th className="text-center">Quá hạn</th>

                    <th className="text-center">Tỷ lệ cập nhật</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedStaff.map((staff) => (
                    <tr key={staff.staff_id}>
                      {/* STAFF */}

                      <td>
                        <div className="admin-staff-performance-user">
                          <div className="admin-staff-performance-avatar">
                            <FaUserTie />
                          </div>

                          <div>
                            <strong>
                              {staff.staff_name ||
                                `Nhân viên #${staff.staff_id}`}
                            </strong>

                            <span>
                              {staff.staff_position ||
                                `Mã NV ${staff.staff_id}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* TOTAL */}

                      <td className="text-center">
                        <strong className="staff-number-main">
                          {staff.total || 0}
                        </strong>
                      </td>

                      {/* UPDATED */}

                      <td className="text-center">
                        <span className="staff-number-success">
                          {staff.updated || 0}
                        </span>
                      </td>

                      {/* NOT UPDATED */}

                      <td className="text-center">
                        <span className="staff-number-warning">
                          {staff.not_updated || 0}
                        </span>
                      </td>

                      {/* INTERESTED */}

                      <td className="text-center">{staff.interested || 0}</td>

                      {/* CONVERTED */}

                      <td className="text-center">
                        <span className="staff-number-success">
                          {staff.converted || 0}
                        </span>
                      </td>

                      {/* OVERDUE */}

                      <td className="text-center">
                        <span
                          className={
                            Number(staff.overdue_follow_up || 0) > 0
                              ? "staff-number-danger"
                              : ""
                          }
                        >
                          {staff.overdue_follow_up || 0}
                        </span>
                      </td>

                      {/* UPDATE RATE */}

                      <td className="text-center">
                        <span className="admin-staff-rate-badge">
                          {staff.update_rate || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================================================
                STAFF PAGINATION
            ================================================ */}

            <div className="admin-staff-performance-pagination">
              <div>
                Hiển thị{" "}
                <strong>{(safeStaffPage - 1) * STAFF_PAGE_SIZE + 1}</strong>
                {" - "}
                <strong>
                  {Math.min(
                    safeStaffPage * STAFF_PAGE_SIZE,

                    staffPerformance.length,
                  )}
                </strong>
                {" / "}
                <strong>{staffPerformance.length}</strong>
              </div>

              <div className="admin-staff-pagination-control">
                <Button
                  disabled={safeStaffPage <= 1}
                  onClick={() =>
                    setStaffPage((current) =>
                      Math.max(
                        1,

                        current - 1,
                      ),
                    )
                  }
                >
                  Trước
                </Button>

                <span>
                  Trang <strong>{safeStaffPage}</strong>
                  {" / "}
                  <strong>{staffTotalPages}</strong>
                </span>

                <Button
                  disabled={safeStaffPage >= staffTotalPages}
                  onClick={() =>
                    setStaffPage((current) =>
                      Math.min(
                        staffTotalPages,

                        current + 1,
                      ),
                    )
                  }
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ==================================================
          FILTER
      ================================================== */}

      <div className="admin-lead-filter-card">
        <div className="admin-lead-filter-title">
          <FaFilter />
          Bộ lọc dữ liệu chăm sóc
        </div>

        <form className="admin-lead-filter-form" onSubmit={handleFilter}>
          {/* SEARCH */}

          <div className="admin-lead-search">
            <FaSearch />

            <input
              type="text"
              value={searchInput}
              placeholder="Tên công ty, SĐT, người liên hệ..."
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* STAFF */}

          <select
            value={staffInput}
            onChange={(e) => setStaffInput(e.target.value)}
          >
            <option value="">Tất cả nhân viên</option>

            {staffPerformance.map((staff) => (
              <option value={staff.staff_id} key={staff.staff_id}>
                {staff.staff_name || `Nhân viên #${staff.staff_id}`}
              </option>
            ))}
          </select>

          {/* STATUS */}

          <select
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value)}
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          {/* UPDATED */}

          <select
            value={updatedInput}
            onChange={(e) => setUpdatedInput(e.target.value)}
          >
            <option value="ALL">Tất cả cập nhật</option>

            <option value="YES">Đã cập nhật</option>

            <option value="NO">Chưa cập nhật</option>
          </select>

          {/* OVERDUE */}

          <select
            value={overdueInput}
            onChange={(e) => setOverdueInput(e.target.value)}
          >
            <option value="ALL">Tất cả follow-up</option>

            <option value="YES">Quá hạn</option>

            <option value="NO">Chưa quá hạn</option>
          </select>

          <Button type="submit" className="admin-lead-filter-btn">
            <FaSearch />
            Lọc
          </Button>

          <Button
            type="button"
            className="admin-lead-reset-btn"
            onClick={handleReset}
          >
            Xóa lọc
          </Button>
        </form>
      </div>

      {/* ==================================================
          COMPANY LIST
      ================================================== */}

      <div className="admin-lead-content-card">
        <div className="admin-lead-section-header">
          <div>
            <h4>Danh sách chăm sóc</h4>

            <p>
              Có <strong>{pagination.total}</strong> công ty đã được nhân viên
              nhận.
            </p>
          </div>

          <div className="admin-lead-page-number">
            Trang <strong>{pagination.page}</strong>/
            <strong>
              {Math.max(
                pagination.totalPages || 1,

                1,
              )}
            </strong>
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="admin-lead-empty">
            <FaBuilding />

            <h4>Không có dữ liệu</h4>

            <p>Không có công ty phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <>
            <div className="admin-lead-table-wrapper">
              <table className="admin-lead-table">
                <thead>
                  <tr>
                    <th>Công ty</th>

                    <th>Nhân viên</th>

                    <th>Ngày nhận</th>

                    <th>Người liên hệ</th>

                    <th>Follow-up</th>

                    <th className="text-center">Cập nhật</th>

                    <th className="text-center">Trạng thái</th>

                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {companies.map((company) => {
                    const statusInfo = getStatusInfo(company.lead_status);

                    const assignedStaff = staffMap.get(
                      Number(company.assigned_to),
                    );

                    return (
                      <tr
                        key={company.id}
                        className={
                          company.is_overdue ? "admin-lead-row-overdue" : ""
                        }
                      >
                        {/* COMPANY */}

                        <td>
                          <div className="admin-lead-company">
                            <div className="admin-lead-company-icon">
                              <FaBuilding />
                            </div>

                            <div>
                              <strong>{company.name || "-"}</strong>

                              <span>ID #{company.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* STAFF */}

                        <td>
                          <div className="admin-lead-staff-cell">
                            <FaUserTie />

                            <span>
                              {company.staff_name ||
                                assignedStaff?.staff_name ||
                                `NV #${company.assigned_to}`}
                            </span>
                          </div>
                        </td>

                        {/* ASSIGNED */}

                        <td>
                          <span className="admin-lead-date">
                            {formatDateTime(company.assigned_at)}
                          </span>
                        </td>

                        {/* CONTACT */}

                        <td>
                          <div className="admin-lead-contact-cell">
                            <strong>
                              {company.contact_person || "Chưa cập nhật"}
                            </strong>

                            <span>
                              {company.contact_phone || "Chưa có SĐT"}
                            </span>
                          </div>
                        </td>

                        {/* FOLLOW UP */}

                        <td>
                          <div
                            className={`admin-lead-followup ${
                              company.is_overdue ? "overdue" : ""
                            }`}
                          >
                            <FaClock />

                            <span>
                              {formatDateTime(company.next_follow_up_at)}
                            </span>
                          </div>
                        </td>

                        {/* UPDATED */}

                        <td className="text-center">
                          {company.has_updated ? (
                            <span className="admin-lead-update-badge updated">
                              <FaCheckCircle />
                              Đã cập nhật
                            </span>
                          ) : (
                            <span className="admin-lead-update-badge not-updated">
                              <FaExclamationTriangle />
                              Chưa cập nhật
                            </span>
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="text-center">
                          <span
                            className={`admin-lead-status ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td className="text-center">
                          <Button
                            className="admin-lead-view-btn"
                            onClick={() => handleOpenDetail(company)}
                          >
                            <FaEye />
                            Xem phiếu
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ============================================
                COMPANY PAGINATION
            ============================================ */}

            <div className="admin-lead-pagination">
              <span>
                Hiển thị <strong>{companies.length}</strong>
                {" / "}
                <strong>{pagination.total}</strong>
              </span>

              <div>
                <Button
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        1,

                        current - 1,
                      ),
                    )
                  }
                >
                  Trước
                </Button>

                <span>
                  {page} /{" "}
                  {Math.max(
                    pagination.totalPages || 1,

                    1,
                  )}
                </span>

                <Button
                  disabled={page >= Number(pagination.totalPages || 1)}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ==================================================
          DETAIL MODAL
      ================================================== */}

      <Modal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        centered
        size="lg"
        dialogClassName="admin-lead-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEye />
            Phiếu chăm sóc khách hàng
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {detailLoading ? (
            <div className="admin-lead-detail-loading">
              <Spinner animation="border" />

              <span>Đang tải phiếu chăm sóc...</span>
            </div>
          ) : (
            selectedCompany && (
              <>
                {/* COMPANY */}

                <div className="admin-care-company-header">
                  <div className="admin-care-company-icon">
                    <FaBuilding />
                  </div>

                  <div>
                    <h3>{selectedCompany.name || "-"}</h3>

                    <p>
                      <FaMapMarkerAlt />

                      {selectedCompany.formatted_address || "Chưa có địa chỉ"}
                    </p>
                  </div>
                </div>

                {/* META */}

                <div className="admin-care-meta-grid">
                  <CareItem
                    label="Nhân viên phụ trách"
                    value={
                      selectedCompany.staff_name ||
                      staffMap.get(Number(selectedCompany.assigned_to))
                        ?.staff_name ||
                      `Nhân viên #${selectedCompany.assigned_to}`
                    }
                  />

                  <CareItem
                    label="Ngày nhận"
                    value={formatDateTime(selectedCompany.assigned_at)}
                  />

                  <CareItem
                    label="Cập nhật gần nhất"
                    value={formatDateTime(selectedCompany.updated_at)}
                  />

                  <CareItem
                    label="Tình trạng cập nhật"
                    value={
                      selectedCompany.has_updated
                        ? "Đã cập nhật"
                        : "Chưa cập nhật"
                    }
                  />
                </div>

                {/* CONTACT */}

                <div className="admin-care-section">
                  <div className="admin-care-section-title">
                    <FaUserTie />
                    Người liên hệ
                  </div>

                  <div className="admin-care-info-grid">
                    <CareItem
                      label="Họ tên"
                      value={selectedCompany.contact_person || "Chưa cập nhật"}
                    />

                    <CareItem
                      label="Chức vụ"
                      value={
                        selectedCompany.contact_position || "Chưa cập nhật"
                      }
                    />

                    <CareItem
                      label="Số điện thoại"
                      value={selectedCompany.contact_phone || "Chưa cập nhật"}
                    />

                    <CareItem
                      label="Email"
                      value={selectedCompany.contact_email || "Chưa cập nhật"}
                    />
                  </div>
                </div>

                {/* COMPANY INFO */}

                <div className="admin-care-section">
                  <div className="admin-care-section-title">
                    <FaBuilding />
                    Thông tin công ty
                  </div>

                  <div className="admin-care-info-grid">
                    <CareItem
                      label="SĐT công ty"
                      value={selectedCompany.phone || "Chưa có"}
                    />

                    <CareItem
                      label="Website"
                      value={selectedCompany.website || "Chưa có"}
                    />
                  </div>
                </div>

                {/* CARE */}

                <div className="admin-care-section">
                  <div className="admin-care-section-title">
                    <FaCalendarAlt />
                    Thông tin chăm sóc
                  </div>

                  <div className="admin-care-info-grid">
                    <CareItem
                      label="Trạng thái"
                      value={getStatusInfo(selectedCompany.lead_status).label}
                    />

                    <CareItem
                      label="Follow-up"
                      value={formatDateTime(selectedCompany.next_follow_up_at)}
                    />
                  </div>

                  <div className="admin-care-note">
                    <span>Ghi chú chăm sóc</span>

                    <strong>
                      {selectedCompany.staff_note ||
                        "Chưa có ghi chú chăm sóc."}
                    </strong>
                  </div>
                </div>

                {/* OVERDUE */}

                {selectedCompany.is_overdue && (
                  <div className="admin-care-overdue-alert">
                    <FaExclamationTriangle />
                    Lead này đang quá hạn follow-up.
                  </div>
                )}
              </>
            )
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetail(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// ==========================================================
// SUMMARY CARD
// ==========================================================

const SummaryCard = ({
  icon,

  label,

  value,

  type = "",
}) => {
  return (
    <div className={`admin-lead-summary-card ${type ? `summary-${type}` : ""}`}>
      <div className="admin-lead-summary-icon">{icon}</div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </div>
  );
};

// ==========================================================
// PERFORMANCE CARD
// ==========================================================

const PerformanceCard = ({
  icon,

  label,

  value,

  type,
}) => {
  return (
    <div className={`admin-lead-performance-card performance-${type}`}>
      <div className="admin-lead-performance-icon">{icon}</div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </div>
  );
};

// ==========================================================
// CARE ITEM
// ==========================================================

const CareItem = ({
  label,

  value,
}) => {
  return (
    <div className="admin-care-item">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
};

export default AdminLeadManagement;
