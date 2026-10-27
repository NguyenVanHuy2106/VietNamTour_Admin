import React, { useEffect, useMemo, useState } from "react";

import { Button, Modal, Spinner } from "react-bootstrap";

import {
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaEnvelope,
  FaEye,
  FaGlobe,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaSave,
  FaSearch,
  FaSyncAlt,
  FaUser,
  FaUserTie,
} from "react-icons/fa";

import APIToken from "../../../../config/APIToken";

// ==========================================================
// STATUS OPTIONS
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

// ==========================================================
// STATUS INFO
// ==========================================================

const getStatusInfo = (status) => {
  const map = {
    ASSIGNED: {
      label: "Mới nhận",
      className: "my-company-status-assigned",
    },

    CONTACTING: {
      label: "Đang liên hệ",
      className: "my-company-status-contacting",
    },

    INTERESTED: {
      label: "Quan tâm",
      className: "my-company-status-interested",
    },

    FOLLOW_UP: {
      label: "Cần chăm sóc lại",
      className: "my-company-status-followup",
    },

    NOT_INTERESTED: {
      label: "Không quan tâm",
      className: "my-company-status-not-interested",
    },

    CONVERTED: {
      label: "Đã chuyển đổi",
      className: "my-company-status-converted",
    },
  };

  return (
    map[status] || {
      label: status || "-",
      className: "my-company-status-default",
    }
  );
};

// ==========================================================
// FORMAT DATE
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
// FORMAT DATETIME-LOCAL
// ==========================================================

const formatInputDateTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();

  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
};

// ==========================================================
// COMPONENT
// ==========================================================

const MyCompanies = ({ onTotalChange }) => {
  // ========================================================
  // STATE - DATA
  // ========================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [processing, setProcessing] = useState(false);

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
  // STATE - FILTER
  // ========================================================

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [statusInput, setStatusInput] = useState("");

  const [status, setStatus] = useState("");

  // ========================================================
  // STATE - MODAL
  // ========================================================

  const [showDetail, setShowDetail] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState(null);

  // ========================================================
  // STATE - FORM
  // ========================================================

  const [form, setForm] = useState({
    lead_status: "ASSIGNED",

    contact_person: "",

    contact_position: "",

    contact_phone: "",

    contact_email: "",

    next_follow_up_at: "",

    staff_note: "",
  });

  // ========================================================
  // LOAD DATA
  // ========================================================

  useEffect(() => {
    fetchCompanies();
  }, [page, search, status]);

  // ========================================================
  // FETCH COMPANIES
  // ========================================================

  const fetchCompanies = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await APIToken.get("/lead-ai/my-companies", {
        params: {
          page,

          limit,

          search: search || undefined,

          status: status || undefined,
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

      if (typeof onTotalChange === "function") {
        onTotalChange(Number(pageData.total || 0));
      }
    } catch (error) {
      console.error("fetch my companies error:", error);

      alert(
        error?.response?.data?.message ||
          "Không thể tải danh sách công ty của tôi.",
      );
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };

  // ========================================================
  // SEARCH
  // ========================================================

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);

    setSearch(searchInput.trim());

    setStatus(statusInput);
  };

  // ========================================================
  // RESET FILTER
  // ========================================================

  const handleReset = () => {
    setSearchInput("");

    setStatusInput("");

    setSearch("");

    setStatus("");

    setPage(1);
  };

  // ========================================================
  // LOAD DETAIL
  // ========================================================

  const loadCompanyDetail = async (companyId) => {
    const response = await APIToken.get(`/lead-ai/my-companies/${companyId}`);

    const detail = response?.data?.data;

    if (!detail) {
      throw new Error("Không tìm thấy dữ liệu công ty.");
    }

    return detail;
  };

  // ========================================================
  // OPEN DETAIL
  // ========================================================

  const handleOpenDetail = async (company) => {
    if (!company?.id) {
      return;
    }

    try {
      setProcessing(true);

      const detail = await loadCompanyDetail(company.id);

      setSelectedCompany(detail);

      setForm({
        lead_status: detail.lead_status || "ASSIGNED",

        contact_person: detail.contact_person || "",

        contact_position: detail.contact_position || "",

        contact_phone: detail.contact_phone || "",

        contact_email: detail.contact_email || "",

        next_follow_up_at: formatInputDateTime(detail.next_follow_up_at),

        staff_note: detail.staff_note || "",
      });

      setIsEditing(false);

      setShowDetail(true);
    } catch (error) {
      console.error("load company detail error:", error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể tải chi tiết công ty.",
      );
    } finally {
      setProcessing(false);
    }
  };

  // ========================================================
  // CLOSE MODAL
  // ========================================================

  const handleCloseDetail = () => {
    if (processing) {
      return;
    }

    setShowDetail(false);

    setIsEditing(false);

    setSelectedCompany(null);
  };

  // ========================================================
  // START EDIT
  // ========================================================

  const handleStartEdit = () => {
    if (!selectedCompany) {
      return;
    }

    setForm({
      lead_status: selectedCompany.lead_status || "ASSIGNED",

      contact_person: selectedCompany.contact_person || "",

      contact_position: selectedCompany.contact_position || "",

      contact_phone: selectedCompany.contact_phone || "",

      contact_email: selectedCompany.contact_email || "",

      next_follow_up_at: formatInputDateTime(selectedCompany.next_follow_up_at),

      staff_note: selectedCompany.staff_note || "",
    });

    setIsEditing(true);
  };

  // ========================================================
  // CANCEL EDIT
  // ========================================================

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // ========================================================
  // FORM CHANGE
  // ========================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,

      [name]: value,
    }));
  };

  // ========================================================
  // SAVE CARE
  // ========================================================

  const handleSave = async () => {
    if (!selectedCompany?.id) {
      return;
    }

    try {
      setProcessing(true);

      await APIToken.put(`/lead-ai/my-companies/${selectedCompany.id}`, {
        lead_status: form.lead_status,

        contact_person: form.contact_person.trim() || null,

        contact_position: form.contact_position.trim() || null,

        contact_phone: form.contact_phone.trim() || null,

        contact_email: form.contact_email.trim() || null,

        next_follow_up_at: form.next_follow_up_at
          ? new Date(form.next_follow_up_at).toISOString()
          : null,

        staff_note: form.staff_note.trim() || null,
      });

      const updatedDetail = await loadCompanyDetail(selectedCompany.id);

      setSelectedCompany(updatedDetail);

      setForm({
        lead_status: updatedDetail.lead_status || "ASSIGNED",

        contact_person: updatedDetail.contact_person || "",

        contact_position: updatedDetail.contact_position || "",

        contact_phone: updatedDetail.contact_phone || "",

        contact_email: updatedDetail.contact_email || "",

        next_follow_up_at: formatInputDateTime(updatedDetail.next_follow_up_at),

        staff_note: updatedDetail.staff_note || "",
      });

      setIsEditing(false);

      await fetchCompanies(true);

      alert("Cập nhật chăm sóc thành công.");
    } catch (error) {
      console.error("update company care error:", error);

      alert(error?.response?.data?.message || "Không thể cập nhật chăm sóc.");
    } finally {
      setProcessing(false);
    }
  };

  // ========================================================
  // CURRENT PAGE STATS
  // ========================================================

  const stats = useMemo(() => {
    return companies.reduce(
      (result, item) => {
        if (item.lead_status === "ASSIGNED") {
          result.assigned += 1;
        }

        if (item.lead_status === "CONTACTING") {
          result.contacting += 1;
        }

        if (item.lead_status === "INTERESTED") {
          result.interested += 1;
        }

        return result;
      },
      {
        assigned: 0,
        contacting: 0,
        interested: 0,
      },
    );
  }, [companies]);

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="my-company-loading">
        <Spinner animation="border" />

        <span>Đang tải công ty của bạn...</span>
      </div>
    );
  }

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <>
      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="my-company-summary">
        <MySummaryCard
          icon={<FaBuilding />}
          label="Tổng công ty"
          value={pagination.total}
        />

        <MySummaryCard
          icon={<FaUserTie />}
          label="Mới nhận"
          value={stats.assigned}
          type="assigned"
        />

        <MySummaryCard
          icon={<FaPhoneAlt />}
          label="Đang liên hệ"
          value={stats.contacting}
          type="contacting"
        />

        <MySummaryCard
          icon={<FaCheckCircle />}
          label="Quan tâm"
          value={stats.interested}
          type="interested"
        />
      </div>

      {/* ==================================================
          FILTER
      ================================================== */}

      <div className="my-company-toolbar-card">
        <form className="my-company-toolbar" onSubmit={handleSearch}>
          <div className="my-company-search">
            <FaSearch />

            <input
              value={searchInput}
              placeholder="Tìm tên công ty, địa chỉ, SĐT, người liên hệ..."
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

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

          <Button type="submit" className="my-company-search-btn">
            <FaSearch />
            Tìm kiếm
          </Button>

          <Button
            type="button"
            className="my-company-reset-btn"
            onClick={handleReset}
          >
            Xóa lọc
          </Button>

          <Button
            type="button"
            className="my-company-refresh-btn"
            onClick={() => fetchCompanies(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <FaSyncAlt />
            )}
            Làm mới
          </Button>
        </form>
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="my-company-content-card">
        <div className="my-company-section-title">
          <div>
            <h4>Công ty của tôi</h4>

            <p>
              Bạn đang quản lý <strong>{pagination.total}</strong> công ty.
            </p>
          </div>

          <div className="my-company-page-info">
            Trang <strong>{pagination.page}</strong>/
            <strong>{Math.max(pagination.totalPages || 1, 1)}</strong>
          </div>
        </div>

        {/* ==================================================
            EMPTY
        ================================================== */}

        {companies.length === 0 ? (
          <div className="my-company-empty">
            <FaBuilding />

            <h4>Chưa có công ty</h4>

            <p>Hãy vào Workspace và nhận công ty để bắt đầu chăm sóc.</p>
          </div>
        ) : (
          <>
            {/* ================================================
                DESKTOP TABLE
            ================================================ */}

            <div className="my-company-table-wrapper">
              <table className="my-company-table">
                <thead>
                  <tr>
                    <th>Công ty</th>

                    <th>Địa chỉ</th>

                    <th>Liên hệ</th>

                    <th>Người liên hệ</th>

                    <th>Follow-up</th>

                    <th className="text-center">Trạng thái</th>

                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {companies.map((company) => {
                    const statusInfo = getStatusInfo(company.lead_status);

                    return (
                      <tr key={company.id}>
                        {/* COMPANY */}

                        <td>
                          <div className="my-company-name">
                            <div className="my-company-icon">
                              <FaBuilding />
                            </div>

                            <div>
                              <strong>{company.name || "-"}</strong>

                              <span>
                                Nhận: {formatDateTime(company.assigned_at)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* ADDRESS */}

                        <td>
                          <div className="my-company-address">
                            <FaMapMarkerAlt />

                            <span>{company.formatted_address || "-"}</span>
                          </div>
                        </td>

                        {/* COMPANY CONTACT */}

                        <td>
                          <div className="my-company-contact">
                            {company.phone ? (
                              <a href={`tel:${company.phone}`}>
                                <FaPhoneAlt />

                                {company.phone}
                              </a>
                            ) : (
                              <span>Chưa có SĐT</span>
                            )}

                            {company.website && (
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <FaGlobe />
                                Website
                              </a>
                            )}
                          </div>
                        </td>

                        {/* CONTACT PERSON */}

                        <td>
                          <div className="my-company-person">
                            <strong>
                              {company.contact_person || "Chưa cập nhật"}
                            </strong>

                            <span>{company.contact_position || "-"}</span>
                          </div>
                        </td>

                        {/* FOLLOW UP */}

                        <td>
                          <div className="my-company-followup">
                            <FaClock />

                            <span>
                              {formatDateTime(company.next_follow_up_at)}
                            </span>
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="text-center">
                          <span
                            className={`my-company-status ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td className="text-center">
                          <Button
                            className="my-company-care-btn"
                            onClick={() => handleOpenDetail(company)}
                          >
                            <FaEye />
                            Xem chi tiết
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ================================================
                MOBILE
            ================================================ */}

            <div className="my-company-mobile-list">
              {companies.map((company) => {
                const statusInfo = getStatusInfo(company.lead_status);

                return (
                  <div className="my-company-mobile-card" key={company.id}>
                    <div className="my-company-mobile-top">
                      <div className="my-company-name">
                        <div className="my-company-icon">
                          <FaBuilding />
                        </div>

                        <div>
                          <strong>{company.name || "-"}</strong>

                          <span>ID #{company.id}</span>
                        </div>
                      </div>

                      <span
                        className={`my-company-status ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="my-company-mobile-address">
                      <FaMapMarkerAlt />

                      <span>{company.formatted_address || "-"}</span>
                    </div>

                    <div className="my-company-mobile-grid">
                      <div>
                        <span>Người liên hệ</span>

                        <strong>
                          {company.contact_person || "Chưa cập nhật"}
                        </strong>
                      </div>

                      <div>
                        <span>Follow-up</span>

                        <strong>
                          {formatDateTime(company.next_follow_up_at)}
                        </strong>
                      </div>
                    </div>

                    <Button
                      className="my-company-mobile-care-btn"
                      onClick={() => handleOpenDetail(company)}
                    >
                      <FaEye />
                      Xem chi tiết phiếu
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* ================================================
                PAGINATION
            ================================================ */}

            <div className="my-company-pagination">
              <span>
                Hiển thị <strong>{companies.length}</strong> /
                <strong>{pagination.total}</strong> công ty
              </span>

              <div className="my-company-pagination-actions">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Trước
                </Button>

                <span>
                  {page} / {Math.max(pagination.totalPages || 1, 1)}
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
          DETAIL / CARE MODAL
      ================================================== */}

      <Modal
        show={showDetail}
        onHide={handleCloseDetail}
        centered
        dialogClassName="my-company-care-modal"
        backdrop={processing ? "static" : true}
        keyboard={!processing}
      >
        <Modal.Header closeButton={!processing}>
          <Modal.Title>
            <FaBuilding />
            Chi tiết phiếu chăm sóc
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedCompany && (
            <>
              {!isEditing ? (
                <>
                  {/* ========================================
                      COMPANY HEADER
                  ======================================== */}

                  <div className="care-ticket-top">
                    <div className="care-ticket-company">
                      <div className="care-ticket-company-icon">
                        <FaBuilding />
                      </div>

                      <div className="care-ticket-company-main">
                        <h3>{selectedCompany.name || "-"}</h3>

                        <p>
                          <FaMapMarkerAlt />

                          <span>
                            {selectedCompany.formatted_address ||
                              "Chưa có địa chỉ"}
                          </span>
                        </p>
                      </div>

                      <div className="care-ticket-status-wrap">
                        <span
                          className={`my-company-status ${
                            getStatusInfo(selectedCompany.lead_status).className
                          }`}
                        >
                          {getStatusInfo(selectedCompany.lead_status).label}
                        </span>

                        <small>
                          Nhận: {formatDateTime(selectedCompany.assigned_at)}
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* ========================================
                      2 COLUMNS
                  ======================================== */}

                  <div className="care-ticket-grid">
                    {/* ======================================
                        CONTACT PERSON
                    ====================================== */}

                    <div className="care-ticket-block">
                      <div className="care-ticket-block-title">
                        <FaUserTie />
                        Người liên hệ
                      </div>

                      <div className="care-ticket-contact-name">
                        {selectedCompany.contact_person || "Chưa cập nhật"}
                      </div>

                      <div className="care-ticket-contact-position">
                        {selectedCompany.contact_position ||
                          "Chưa cập nhật chức vụ"}
                      </div>

                      <div className="care-ticket-line">
                        <FaPhoneAlt />

                        {selectedCompany.contact_phone ? (
                          <a href={`tel:${selectedCompany.contact_phone}`}>
                            {selectedCompany.contact_phone}
                          </a>
                        ) : (
                          <span>Chưa cập nhật SĐT</span>
                        )}
                      </div>

                      <div className="care-ticket-line">
                        <FaEnvelope />

                        {selectedCompany.contact_email ? (
                          <a href={`mailto:${selectedCompany.contact_email}`}>
                            {selectedCompany.contact_email}
                          </a>
                        ) : (
                          <span>Chưa cập nhật email</span>
                        )}
                      </div>
                    </div>

                    {/* ======================================
                        CARE INFO
                    ====================================== */}

                    <div className="care-ticket-block">
                      <div className="care-ticket-block-title">
                        <FaCalendarAlt />
                        Thông tin chăm sóc
                      </div>

                      <div className="care-ticket-info-row">
                        <span>Follow-up</span>

                        <strong>
                          {formatDateTime(selectedCompany.next_follow_up_at)}
                        </strong>
                      </div>

                      <div className="care-ticket-info-row">
                        <span>SĐT công ty</span>

                        {selectedCompany.phone ? (
                          <a href={`tel:${selectedCompany.phone}`}>
                            <FaPhoneAlt />

                            {selectedCompany.phone}
                          </a>
                        ) : (
                          <strong>Chưa có</strong>
                        )}
                      </div>

                      <div className="care-ticket-info-row">
                        <span>Website</span>

                        {selectedCompany.website ? (
                          <a
                            href={selectedCompany.website}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <FaGlobe />
                            Mở website
                          </a>
                        ) : (
                          <strong>Chưa có</strong>
                        )}
                      </div>

                      <div className="care-ticket-info-row">
                        <span>Mã lead</span>

                        <strong>#{selectedCompany.id}</strong>
                      </div>
                    </div>
                  </div>

                  {/* ========================================
                      NOTE
                  ======================================== */}

                  <div className="care-ticket-note">
                    <div className="care-ticket-block-title">
                      <FaEdit />
                      Ghi chú chăm sóc
                    </div>

                    <div className="care-ticket-note-content">
                      {selectedCompany.staff_note ||
                        "Chưa có ghi chú chăm sóc."}
                    </div>
                  </div>
                </>
              ) : (
                /* ==========================================
                   EDIT FORM
                ========================================== */

                <div className="care-edit">
                  <div className="care-edit-title">
                    <FaEdit />
                    Cập nhật chăm sóc
                  </div>

                  <div className="care-edit-grid">
                    {/* STATUS */}

                    <div className="care-edit-group">
                      <label>Trạng thái</label>

                      <select
                        name="lead_status"
                        value={form.lead_status}
                        onChange={handleFormChange}
                      >
                        {STATUS_OPTIONS.filter((item) =>
                          Boolean(item.value),
                        ).map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* CONTACT PERSON */}

                    <div className="care-edit-group">
                      <label>Người liên hệ</label>

                      <div className="care-edit-input">
                        <FaUser />

                        <input
                          name="contact_person"
                          value={form.contact_person}
                          placeholder="VD: Nguyễn Văn A"
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>

                    {/* POSITION */}

                    <div className="care-edit-group">
                      <label>Chức vụ</label>

                      <div className="care-edit-input">
                        <FaUserTie />

                        <input
                          name="contact_position"
                          value={form.contact_position}
                          placeholder="VD: Trưởng phòng HCNS"
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>

                    {/* PHONE */}

                    <div className="care-edit-group">
                      <label>Số điện thoại</label>

                      <div className="care-edit-input">
                        <FaPhoneAlt />

                        <input
                          name="contact_phone"
                          value={form.contact_phone}
                          placeholder="SĐT người liên hệ"
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>

                    {/* EMAIL */}

                    <div className="care-edit-group">
                      <label>Email</label>

                      <div className="care-edit-input">
                        <FaEnvelope />

                        <input
                          type="email"
                          name="contact_email"
                          value={form.contact_email}
                          placeholder="Email người liên hệ"
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>

                    {/* FOLLOW UP */}

                    <div className="care-edit-group">
                      <label>Ngày follow-up</label>

                      <div className="care-edit-input">
                        <FaClock />

                        <input
                          type="datetime-local"
                          name="next_follow_up_at"
                          value={form.next_follow_up_at}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* NOTE */}

                  <div className="care-edit-group care-edit-note">
                    <label>Ghi chú chăm sóc</label>

                    <textarea
                      name="staff_note"
                      rows="5"
                      maxLength={3000}
                      value={form.staff_note}
                      placeholder="Nhập nội dung trao đổi, nhu cầu tour, số lượng khách, thời gian dự kiến..."
                      onChange={handleFormChange}
                    />

                    <small>{form.staff_note.length}/3000</small>
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>

        {/* ==================================================
            MODAL FOOTER
        ================================================== */}

        <Modal.Footer>
          {!isEditing ? (
            <>
              <Button
                variant="secondary"
                onClick={handleCloseDetail}
                disabled={processing}
              >
                Đóng
              </Button>

              <Button
                className="company-care-edit-btn"
                onClick={handleStartEdit}
                disabled={processing}
              >
                <FaEdit />
                Cập nhật chăm sóc
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={handleCancelEdit}
                disabled={processing}
              >
                Hủy
              </Button>

              <Button
                className="company-care-save-btn"
                onClick={handleSave}
                disabled={processing}
              >
                {processing ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <FaSave />
                )}
                Lưu cập nhật
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

// ==========================================================
// SUMMARY CARD
// ==========================================================

const MySummaryCard = ({ icon, label, value, type = "" }) => {
  return (
    <div className={`my-company-summary-card ${type ? `summary-${type}` : ""}`}>
      <div className="my-company-summary-icon">{icon}</div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </div>
  );
};

export default MyCompanies;
