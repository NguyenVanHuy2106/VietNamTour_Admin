import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
  ToastContainer,
  Toast,
} from "react-bootstrap";

import {
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaFileImport,
  FaEye,
  FaEdit,
  FaTrash,
  FaUsers,
  FaHistory,
  FaExternalLinkAlt,
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaDatabase,
  FaFileInvoiceDollar,
} from "react-icons/fa";

import APIToken from "../../config/APIToken";
import ProcurementImportModal from "./ProcurementImportModal";

import "./index.css";

// ============================================================
// CONFIG
// ============================================================

const BASE_API = "/quotationRequest";
const TEAM_API = "/quotationTeam";
const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "RECEIVED", label: "Tạo mới" },
  { value: "PROCESSING", label: "Đang thực hiện" },
  { value: "SUBMITTED", label: "Đã nộp báo giá" },
  { value: "WON", label: "Trúng báo giá" },
  { value: "LOST", label: "Không trúng báo giá" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "CONTACTED", label: "Đã liên hệ (cũ)" },
  { value: "COMPLETED", label: "Hoàn tất (cũ)" },
];

const STATUS_LABEL = Object.fromEntries(
  STATUS_OPTIONS.map((item) => [item.value, item.label]),
);

const SOURCE_LABEL = {
  MANUAL: "Nhập thủ công",
  PROCUREMENT: "Mua sắm công",
};

const EMPTY_FORM = {
  notification_code: "",
  notification_id: "",
  notification_type: "",
  request_name: "",
  package_name: "",
  procuring_entity: "",
  publish_date: "",
  closing_date: "",
  location: "",
  quantity: "",
  unit: "",
  package_price: "",
  source_type: "MANUAL",
  source_url: "",
  extraction_status: "",
  notes: "",
  team_id: "",
  quotation_validity: "",
};

// ============================================================
// HELPERS
// ============================================================

const getUserId = () => {
  const id = Number(localStorage.getItem("userId"));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const getError = (error) => {
  const data = error?.response?.data;

  return data?.message || error?.message || "Đã xảy ra lỗi. Vui lòng thử lại.";
};

const unwrap = (response) => response?.data?.data;

const money = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Chưa có";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? `${new Intl.NumberFormat("vi-VN").format(number)} đ`
    : String(value);
};

const formatDate = (value, withTime = false) => {
  if (!value) return "—";

  // DATEONLY từ PostgreSQL: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [y, m, d] = String(value).split("-");
    return `${d}/${m}/${y}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }
      : {}),
  }).format(date);
};

const getDeadlineRemaining = (dateValue) => {
  if (!dateValue) return null;

  // Chỉ lấy phần ngày YYYY-MM-DD.
  // Tránh sai lệch do UTC và múi giờ.
  const match = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return null;

  const [, year, month, day] = match;

  // Ngày hiện tại theo giờ Việt Nam
  const todayVN = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [ty, tm, td] = todayVN.split("-").map(Number);

  const currentDate = Date.UTC(ty, tm - 1, td);
  const deadlineDate = Date.UTC(Number(year), Number(month) - 1, Number(day));

  const days = Math.round((deadlineDate - currentDate) / 86400000);

  if (days < 0) {
    return {
      text: `Đã hết hạn`,
      type: "expired",
    };
  }

  if (days === 0) {
    return {
      text: "Hạn hôm nay",
      type: "today",
    };
  }

  if (days === 1) {
    return {
      text: "Còn 1 ngày",
      type: "soon",
    };
  }

  return {
    text: `Còn ${days} ngày`,
    type: days <= 3 ? "soon" : "normal",
  };
};

// Backend nhận DD/MM/YYYY
const dateToInput = (value) => {
  if (!value) return "";

  const str = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/");
    return `${y}-${m}-${d}`;
  }

  return "";
};

const dateFromInput = (value) => {
  if (!value) return null;

  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
};

// Chuyển closing_date sang datetime-local giờ Việt Nam.
const dateTimeToInput = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type) => parts.find((item) => item.type === type)?.value || "";

  return (
    `${get("year")}-${get("month")}-${get("day")}` +
    `T${get("hour")}:${get("minute")}`
  );
};

// Không dùng new Date(datetime-local) vì máy người dùng
// có thể không ở múi giờ Việt Nam.
const dateTimeFromInput = (value) => {
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);

  if (!match) return null;

  const [, y, m, d, hh, mm] = match;

  return `${d}/${m}/${y} ${hh}:${mm}`;
};

const isOverdue = (item) => {
  if (!item?.closing_date || item.status === "COMPLETED") {
    return false;
  }

  const date = new Date(item.closing_date);

  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
};

const normalizeApiRequest = (item = {}) => ({
  ...item,
  request_id: item.request_id,
  notification_code: item.notification_code ?? item.notificationCode ?? "",
  request_name: item.request_name ?? item.requestName ?? "",
  procuring_entity: item.procuring_entity ?? item.procuringEntity ?? "",
  closing_date: item.closing_date ?? item.closingDate ?? null,
  publish_date: item.publish_date ?? item.publishDate ?? null,
  team_id: item.team_id ?? item.teamId ?? null,
  source_url: item.source_url ?? item.sourceUrl ?? "",
  source_type: item.source_type ?? item.sourceType ?? "MANUAL",
  package_price: item.package_price ?? item.packagePrice ?? null,
  attachments: Array.isArray(item.attachments) ? item.attachments : [],
});

const toForm = (item = {}) => ({
  notification_code: item.notification_code || "",
  notification_id: item.notification_id || "",
  notification_type: item.notification_type || "",
  request_name: item.request_name || "",
  package_name: item.package_name || "",
  procuring_entity: item.procuring_entity || "",
  publish_date: dateToInput(item.publish_date),
  closing_date: dateTimeToInput(item.closing_date),
  location: item.location || "",
  quantity: item.quantity ?? "",
  unit: item.unit || "",
  package_price: item.package_price ?? "",
  source_type: item.source_type || "MANUAL",
  source_url: item.source_url || "",
  extraction_status: item.extraction_status || "",
  notes: item.notes || "",
  team_id:
    item.team_id === null || item.team_id === undefined
      ? ""
      : String(item.team_id),
  quotation_validity: item.quotation_validity ?? "",
});

const toPayload = (form) => ({
  notification_code: form.notification_code.trim() || null,
  notification_id: form.notification_id.trim() || null,
  notification_type: form.notification_type.trim() || null,
  request_name: form.request_name.trim(),
  package_name: form.package_name.trim() || null,
  procuring_entity: form.procuring_entity.trim() || null,
  publish_date: dateFromInput(form.publish_date),
  closing_date: dateTimeFromInput(form.closing_date),
  location: form.location.trim() || null,
  quantity: form.quantity === "" ? null : Number(form.quantity),
  unit: form.unit.trim() || null,
  package_price: form.package_price === "" ? null : Number(form.package_price),
  source_type: form.source_type,
  source_url: form.source_url.trim() || null,
  extraction_status: form.extraction_status || null,
  notes: form.notes.trim() || null,
  quotation_validity: form.quotation_validity.trim() || null,
});

// ============================================================
// COMPONENT
// ============================================================

export default function QuotationRequests() {
  // Data
  const [requests, setRequests] = useState([]);
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState(null);

  // Pagination / search
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    total_pages: 0,
  });

  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const navigate = useNavigate();
  const handleGoToDetail = (requestId) => {
    navigate("/quotation-request-detail", {
      state: {
        requestId: requestId,
      },
    });
  };

  const openDetail = (item) => {
    handleGoToDetail(item.request_id);
  };

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "success",
  });

  const showToast = (message, variant = "success") => {
    setToast({
      show: true,
      message,
      variant,
    });
  };

  // Modals
  const [showImport, setShowImport] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [attachments, setAttachments] = useState([]);

  const [assignTeamId, setAssignTeamId] = useState("");
  const [assignReason, setAssignReason] = useState("");

  const [newStatus, setNewStatus] = useState("RECEIVED");
  const [statusReason, setStatusReason] = useState("");

  const [deleteReason, setDeleteReason] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const activeTeams = teams.filter((team) => Number(team.status) === 1);

  // ============================================================
  // FETCH DATA
  // ============================================================

  const loadTeams = useCallback(async () => {
    try {
      const response = await APIToken.get(TEAM_API);
      const payload = unwrap(response);

      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.rows)
          ? payload.rows
          : Array.isArray(payload?.teams)
            ? payload.teams
            : [];

      setTeams(list);
    } catch (err) {
      console.error("Load quotation teams:", err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await APIToken.get(`${BASE_API}/stats`);
      setStats(unwrap(response) || null);
    } catch (err) {
      console.error("Load quotation stats:", err);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: PAGE_SIZE,
      };

      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (teamFilter) params.team_id = teamFilter;
      if (sourceFilter) params.source_type = sourceFilter;

      const response = await APIToken.get(BASE_API, {
        params,
      });

      const data = unwrap(response);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.rows)
          ? data.rows
          : [];

      setRequests(list.map(normalizeApiRequest));

      setPagination(
        response.data?.pagination || {
          page,
          limit: PAGE_SIZE,
          total: list.length,
          total_pages: 1,
        },
      );
    } catch (err) {
      setError(getError(err));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, teamFilter, sourceFilter]);

  useEffect(() => {
    loadTeams();
    loadStats();
  }, [loadTeams, loadStats]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const refresh = async () => {
    await Promise.all([loadRequests(), loadStats(), loadTeams()]);
  };

  const afterMutation = async (message) => {
    showToast(message, "success");
    setError("");

    setPage(1);

    await Promise.all([loadStats(), loadTeams(), loadRequests()]);
  };

  // ============================================================
  // FORM
  // ============================================================

  const updateForm = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setAttachments([]);
    setError("");
    setShowForm(true);
  };

  const openEdit = async (item) => {
    try {
      setSaving(true);
      setError("");

      const response = await APIToken.get(`${BASE_API}/${item.request_id}`);

      const detail = normalizeApiRequest(unwrap(response));

      setEditing(detail);
      setForm(toForm(detail));
      setAttachments(detail.attachments || []);
      setShowDetail(false);
      setShowForm(true);
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const addAttachment = () => {
    setAttachments((current) => [
      ...current,
      {
        file_name: "",
        download_url: "",
      },
    ]);
  };

  const updateAttachment = (index, key, value) => {
    setAttachments((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
  };

  const removeAttachment = (index) => {
    setAttachments((current) => current.filter((_, i) => i !== index));
  };

  const handleSaveForm = async (event) => {
    event.preventDefault();

    if (!form.request_name.trim()) {
      setError("Vui lòng nhập tên yêu cầu báo giá.");
      return;
    }

    const userId = getUserId();

    if (!userId) {
      setError("Không tìm thấy userId. Vui lòng đăng nhập lại.");
      return;
    }

    if (
      attachments.some(
        (item) => !(item.file_name ?? item.fileName ?? "").trim(),
      )
    ) {
      setError("Vui lòng nhập tên tài liệu đính kèm.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...toPayload(form),
        attachments: attachments.map((file) => ({
          file_name: (file.file_name ?? file.fileName ?? "").trim(),
          download_url:
            (file.download_url ?? file.downloadUrl ?? "").trim() || null,
          storage_url: file.storage_url ?? file.storageUrl ?? null,
          file_type: file.file_type ?? file.fileType ?? null,
          file_size: file.file_size ?? file.fileSize ?? null,
        })),
      };

      if (editing) {
        await APIToken.put(`${BASE_API}/${editing.request_id}`, {
          ...payload,
          updated_by: userId,
        });
      } else {
        await APIToken.post(BASE_API, {
          ...payload,
          team_id: form.team_id ? Number(form.team_id) : null,
          created_by: userId,
        });
      }

      const message = editing
        ? "Đã cập nhật yêu cầu báo giá."
        : "Đã thêm yêu cầu báo giá vào hệ thống.";

      setShowForm(false);
      setEditing(null);
      await afterMutation(message);
    } catch (err) {
      const message = getError(err);

      showToast(message, "danger");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // IMPORT FROM PROCUREMENT
  // ============================================================

  // Import modal tự gọi POST /quotationRequest/save-import; không tạo trùng tại đây.

  const handleImportedQuote = async () => {
    // save-import đã lưu database thành công.
    // Không gọi thêm API tạo yêu cầu thủ công.

    setShowImport(false);
    setError("");

    // Hiện Toast thành công góc trên bên phải.
    showToast("Thêm yêu cầu báo giá thành công!", "success");

    // Quay về trang đầu để xem yêu cầu mới.
    setPage(1);

    try {
      await Promise.all([loadRequests(), loadStats(), loadTeams()]);
    } catch (err) {
      console.error("Không thể tải lại danh sách:", err);
    }
  };

  // ============================================================
  // DETAIL
  // ============================================================

  // ============================================================
  // ASSIGN TEAM
  // ============================================================

  const openAssign = (item) => {
    setSelected(item);
    setAssignTeamId(item.team_id == null ? "" : String(item.team_id));
    setAssignReason("");
    setError("");
    setShowAssign(true);
  };

  const handleAssign = async () => {
    const userId = getUserId();

    if (Number(selected.team_id) === Number(assignTeamId)) {
      setError("Yêu cầu đã thuộc nhóm này.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await APIToken.put(`${BASE_API}/${selected.request_id}/assign`, {
        team_id: assignTeamId === "" ? null : Number(assignTeamId),
        performed_by: userId,
        reason: assignReason.trim() || null,
      });

      setShowAssign(false);
      await afterMutation("Đã phân công nhóm thành công.");
    } catch (err) {
      const message = getError(err);

      showToast(message, "danger");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  const openStatus = (item) => {
    setSelected(item);

    const manualStatuses = ["SUBMITTED", "WON", "LOST", "CANCELLED"];

    setNewStatus(
      manualStatuses.includes(item.status) ? item.status : "SUBMITTED",
    );

    setStatusReason("");
    setError("");
    setShowStatus(true);
  };

  const handleStatus = async () => {
    const userId = getUserId();

    if (!userId || !selected) {
      setError("Không xác định được người thực hiện.");
      return;
    }

    if (newStatus === selected.status) {
      setError("Vui lòng chọn trạng thái khác hiện tại.");
      return;
    }
    if (!selected?.team_id) {
      setError(
        "Yêu cầu chưa có nhóm phụ trách. Vui lòng phân công nhóm trước.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await APIToken.put(`${BASE_API}/${selected.request_id}/status`, {
        status: newStatus,
        performed_by: userId,
        reason: statusReason.trim() || null,
      });

      setShowStatus(false);
      await afterMutation("Đã cập nhật trạng thái.");
    } catch (err) {
      const message = getError(err);

      showToast(message, "danger");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // HISTORY
  // ============================================================

  const openHistory = async (item) => {
    setSelected(item);
    setHistory([]);
    setError("");
    setShowHistory(true);
    setHistoryLoading(true);

    try {
      const response = await APIToken.get(
        `${BASE_API}/${item.request_id}/history`,
        {
          params: {
            page: 1,
            limit: 100,
          },
        },
      );

      const data = unwrap(response);

      setHistory(
        Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [],
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setHistoryLoading(false);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const openDelete = (item) => {
    setSelected(item);
    setDeleteReason("");
    setError("");
    setShowDelete(true);
  };

  const handleDelete = async () => {
    const userId = getUserId();

    if (!userId || !selected) {
      setError("Không xác định được yêu cầu hoặc người thực hiện.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await APIToken.delete(`${BASE_API}/${selected.request_id}`, {
        data: {
          performed_by: userId,
          reason: deleteReason.trim() || null,
        },
      });

      setShowDelete(false);
      await afterMutation("Đã xóa yêu cầu báo giá.");
    } catch (err) {
      const message = getError(err);

      showToast(message, "danger");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // FILTER / PAGINATION
  // ============================================================

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
  };

  const resetFilters = () => {
    setSearchText("");
    setSearch("");
    setStatusFilter("");
    setTeamFilter("");
    setSourceFilter("");
    setPage(1);
  };

  const changePage = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.total_pages || loading) {
      return;
    }

    setPage(nextPage);
  };

  // ============================================================
  // UI HELPERS
  // ============================================================

  const getTeamName = (item) => {
    if (item.team?.team_name) {
      return item.team.team_name;
    }

    const team = teams.find(
      (entry) => Number(entry.team_id) === Number(item.team_id),
    );

    return team?.team_name || "Chưa phân công";
  };

  const statusBadge = (status) => (
    <Badge
      bg="light"
      className={`vqr-status vqr-status-${status || "RECEIVED"}`}
    >
      {STATUS_LABEL[status] || status || "—"}
    </Badge>
  );

  const renderField = (label, value) => (
    <Col md={6} className="mb-3">
      <div className="vqr-detail-label">{label}</div>
      <div className="vqr-detail-value">
        {value === null || value === undefined || value === "" ? "—" : value}
      </div>
    </Col>
  );

  const renderFormField = (label, name, options = {}) => {
    const {
      type = "text",
      required = false,
      as,
      rows = 3,
      placeholder,
      disabled = false,
    } = options;

    return (
      <Form.Group className="mb-3">
        <Form.Label>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </Form.Label>

        <Form.Control
          as={as}
          rows={as === "textarea" ? rows : undefined}
          type={as ? undefined : type}
          value={form[name]}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          min={type === "number" ? 0 : undefined}
          onChange={(event) => updateForm(name, event.target.value)}
        />
      </Form.Group>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="vqr-page">
      <div className="procurement-workspace-header">
        <div>
          <div className="procurement-workspace-eyebrow">
            VIỆT NAM TOUR · QUOTATION REQUEST
          </div>

          <h2>
            <FaFileInvoiceDollar />
            Quản lý yêu cầu báo giá
          </h2>

          <p>
            Tiếp nhận, phân công và theo dõi yêu cầu báo giá của Việt Nam Tour.
          </p>
        </div>

        <div className="vqr-heading-actions">
          <Button
            variant="outline-secondary"
            onClick={refresh}
            disabled={loading}
          >
            <FaSyncAlt className="me-2" />
            Làm mới
          </Button>

          <Button variant="outline-primary" onClick={() => setShowImport(true)}>
            <FaFileImport className="me-2" />
            Import PDF
          </Button>

          <Button className="vqr-primary" onClick={openCreate}>
            <FaPlus className="me-2" />
            Thêm yêu cầu
          </Button>
        </div>
      </div>

      {error &&
        !showForm &&
        !showAssign &&
        !showStatus &&
        !showDelete &&
        !showHistory && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

      {/* =========================
          STATISTICS
      ========================= */}

      <div className="vqr-stats">
        {[
          {
            label: "Tổng yêu cầu",
            value: stats?.total ?? "—",
            icon: <FaClipboardList />,
          },
          {
            label: "Tạo mới",
            value: stats?.received ?? "—",
            icon: <FaClock />,
          },
          {
            label: "Đang xử lý",
            value: stats?.processing ?? "—",
            icon: <FaUsers />,
          },
          {
            label: "Hoàn tất",
            value: stats?.completed ?? "—",
            icon: <FaCheckCircle />,
          },
          {
            label: "Quá hạn",
            value: stats?.overdue ?? "—",
            icon: <FaExclamationTriangle />,
            danger: true,
          },
        ].map((item) => (
          <div
            className={`vqr-stat ${item.danger ? "vqr-stat-danger" : ""}`}
            key={item.label}
          >
            <div className="vqr-stat-icon">{item.icon}</div>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* =========================
          FILTERS
      ========================= */}

      <div className="vqr-panel">
        <Form onSubmit={handleSearch}>
          <Row className="g-2 align-items-end">
            <Col xl={5} lg={12}>
              <Form.Label>Tìm kiếm</Form.Label>
              <div className="vqr-search">
                <FaSearch />
                <Form.Control
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Mã RQ, tên yêu cầu, đơn vị mời..."
                />
              </div>
            </Col>

            <Col xl={2} md={4}>
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                {STATUS_OPTIONS.map((item) => (
                  <option value={item.value} key={item.value}>
                    {item.label}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col xl={2} md={4}>
              <Form.Label>Nhóm kinh doanh</Form.Label>
              <Form.Select
                value={teamFilter}
                onChange={(e) => {
                  setTeamFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả nhóm</option>
                {teams.map((team) => (
                  <option value={team.team_id} key={team.team_id}>
                    {team.team_name}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col xl={2} md={4}>
              <Form.Label>Nguồn</Form.Label>
              <Form.Select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả nguồn</option>
                <option value="PROCUREMENT">Mua sắm công</option>
                <option value="MANUAL">Nhập thủ công</option>
              </Form.Select>
            </Col>

            <Col xl={1} md={12}>
              <Button type="submit" variant="primary" className="w-100">
                Lọc
              </Button>
            </Col>
          </Row>

          <div className="vqr-filter-footer">
            <span>
              Tổng cộng: <strong>{pagination.total ?? 0}</strong> yêu cầu
            </span>

            <Button variant="link" size="sm" onClick={resetFilters}>
              Xóa bộ lọc
            </Button>
          </div>
        </Form>
      </div>

      {/* =========================
          DATA TABLE
      ========================= */}

      <div className="vqr-panel vqr-table-panel">
        <div className="table-responsive">
          <Table hover className="vqr-table align-middle">
            <thead>
              <tr>
                <th style={{ width: 50 }}>STT</th>
                <th style={{ minWidth: 145 }}>Mã yêu cầu</th>
                <th className="vqr-content-column">Tên báo giá</th>
                {/* <th style={{ minWidth: 170 }}>Đơn vị</th> */}
                <th style={{ minWidth: 130 }}>Hạn nộp báo giá</th>
                <th className="vqr-validity-column">Hiệu lực báo giá</th>
                <th style={{ minWidth: 155 }}>Nhóm phụ trách</th>
                <th>Trạng thái</th>
                <th style={{ minWidth: 190 }}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    Chưa có yêu cầu báo giá phù hợp.
                  </td>
                </tr>
              ) : (
                requests.map((item, index) => (
                  <tr key={item.request_id}>
                    <td>{(page - 1) * PAGE_SIZE + index + 1}</td>

                    <td>
                      <strong className="vqr-code">
                        {item.notification_code || `#${item.request_id}`}
                      </strong>
                      <div className="vqr-small-muted">
                        {SOURCE_LABEL[item.source_type] || "—"}
                      </div>
                    </td>

                    <td className="vqr-content-column">
                      <button
                        className="vqr-title-button"
                        onClick={() => openDetail(item)}
                      >
                        {item.request_name}
                      </button>
                      <div className="vqr-small-muted">
                        {item.location || "Chưa có địa điểm"}
                      </div>
                      <div className="vqr-small-muted">
                        Đơn vị: {item.procuring_entity || "—"}
                      </div>
                    </td>

                    {/* <td className="vqr-cell-text">
                      {item.procuring_entity || "—"}
                    </td> */}

                    <td>
                      <div className="vqr-deadline-cell">
                        <span className="vqr-deadline-date">
                          {formatDate(
                            item.closing_date || item.reception_end_date,
                          )}
                        </span>

                        {(() => {
                          const remaining = getDeadlineRemaining(
                            item.closing_date || item.reception_end_date,
                          );

                          if (!remaining) return null;

                          return (
                            <span
                              className={`vqr-deadline-remaining vqr-deadline-${remaining.type}`}
                            >
                              {remaining.text}
                            </span>
                          );
                        })()}
                      </div>
                    </td>

                    <td className="vqr-validity-column">
                      <span
                        className="vqr-validity-text"
                        title={item.quotation_validity || ""}
                      >
                        {item.quotation_validity || "—"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`vqr-team-badge vqr-team-clickable ${
                          item.team_id
                            ? "vqr-team-assigned"
                            : "vqr-team-unassigned"
                        }`}
                        title="Bấm để phân công hoặc chuyển nhóm"
                        onClick={() => openAssign(item)}
                      >
                        <FaUsers className="vqr-team-icon" />

                        <span className="vqr-team-name">
                          {getTeamName(item)}
                        </span>
                      </button>
                    </td>

                    <td>
                      <button
                        className="vqr-badge-button"
                        onClick={() => openStatus(item)}
                      >
                        {statusBadge(item.status)}
                      </button>
                    </td>

                    <td>
                      <div className="vqr-table-actions">
                        <Button
                          size="sm"
                          variant="light"
                          title="Xem chi tiết"
                          onClick={() => openDetail(item)}
                        >
                          <FaEye />
                        </Button>

                        <Button
                          size="sm"
                          variant="light"
                          title="Chỉnh sửa"
                          onClick={() => openEdit(item)}
                        >
                          <FaEdit />
                        </Button>

                        <Button
                          size="sm"
                          variant="light"
                          title="Phân công nhóm"
                          onClick={() => openAssign(item)}
                        >
                          <FaUsers />
                        </Button>

                        <Button
                          size="sm"
                          variant="light"
                          title="Lịch sử"
                          onClick={() => openHistory(item)}
                        >
                          <FaHistory />
                        </Button>

                        <Button
                          size="sm"
                          variant="light"
                          className="vqr-delete-icon"
                          title="Xóa"
                          onClick={() => openDelete(item)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        <div className="vqr-pagination">
          <span>
            Trang {pagination.page || page} /{" "}
            {Math.max(1, pagination.total_pages || 0)}
          </span>

          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => changePage(page - 1)}
            >
              Trước
            </Button>

            <Button
              variant="outline-secondary"
              size="sm"
              disabled={page >= pagination.total_pages || loading}
              onClick={() => changePage(page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>

      {/* =========================
          IMPORT MODAL
      ========================= */}

      <ProcurementImportModal
        show={showImport}
        onHide={() => setShowImport(false)}
        onSaved={handleImportedQuote}
        mode="web-admin"
      />

      {/* =========================
          CREATE / EDIT MODAL
      ========================= */}

      <Modal
        show={showForm}
        onHide={() => {
          if (!saving) setShowForm(false);
        }}
        size="lg"
        centered
        scrollable
      >
        <Form onSubmit={handleSaveForm}>
          <Modal.Header closeButton={!saving}>
            <Modal.Title>
              {editing ? "Chỉnh sửa yêu cầu báo giá" : "Thêm yêu cầu báo giá"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
              <Col md={7}>
                {renderFormField("Tên yêu cầu báo giá", "request_name", {
                  required: true,
                  as: "textarea",
                  rows: 2,
                })}
              </Col>

              <Col md={5}>
                <Form.Group className="mb-3">
                  <Form.Label>Nhóm kinh doanh</Form.Label>

                  <Form.Select
                    value={form.team_id}
                    disabled={!!editing}
                    onChange={(e) => updateForm("team_id", e.target.value)}
                  >
                    <option value="">Chưa phân công</option>
                    {activeTeams.map((team) => (
                      <option key={team.team_id} value={team.team_id}>
                        {team.team_name}
                      </option>
                    ))}
                  </Form.Select>
                  {editing && (
                    <Form.Text>
                      Để chuyển nhóm, sử dụng nút Phân công trên danh sách.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                {renderFormField("Mã yêu cầu báo giá", "notification_code", {
                  placeholder: "RQ2600...",
                })}
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nguồn dữ liệu</Form.Label>

                  <Form.Select
                    value={form.source_type}
                    onChange={(e) => updateForm("source_type", e.target.value)}
                  >
                    <option value="MANUAL">Nhập thủ công</option>
                    <option value="PROCUREMENT">Mua sắm công</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                {renderFormField("Đơn vị yêu cầu báo giá", "procuring_entity")}
              </Col>

              <Col md={12}>
                {renderFormField("Tên gói thầu", "package_name")}
              </Col>

              <Col md={6}>
                {renderFormField("Ngày đăng tải", "publish_date", {
                  type: "date",
                })}
              </Col>

              <Col md={6}>
                {renderFormField("Hạn tiếp nhận báo giá", "closing_date", {
                  type: "datetime-local",
                })}
              </Col>
              <Col md={6}>
                {renderFormField(
                  "Thời gian có hiệu lực tối thiểu của báo giá",
                  "quotation_validity",
                  {
                    placeholder: "VD: 3 ngày kể từ ngày 21/11/2026",
                  },
                )}
              </Col>

              <Col md={6}>
                {renderFormField("Địa điểm thực hiện", "location")}
              </Col>

              <Col md={3}>
                {renderFormField("Khối lượng", "quantity", { type: "number" })}
              </Col>

              <Col md={3}>{renderFormField("Đơn vị tính", "unit")}</Col>

              <Col md={6}>
                {renderFormField("Giá gói thầu (VNĐ)", "package_price", {
                  type: "number",
                })}
              </Col>

              <Col md={6}>
                {renderFormField("Loại thông báo", "notification_type")}
              </Col>

              <Col md={12}>
                {renderFormField("Link nguồn", "source_url", {
                  placeholder: "https://muasamcong.mof.gov.vn/...",
                })}
              </Col>

              <Col md={12}>
                {renderFormField("Ghi chú nội bộ", "notes", {
                  as: "textarea",
                  rows: 3,
                })}
              </Col>
            </Row>

            <div className="vqr-attachments-heading">
              <strong>Tài liệu đính kèm</strong>
              <Button
                size="sm"
                variant="outline-primary"
                type="button"
                onClick={addAttachment}
              >
                <FaPlus className="me-1" />
                Thêm tài liệu
              </Button>
            </div>

            {attachments.map((file, index) => (
              <Row className="g-2 mb-2" key={index}>
                <Col md={5}>
                  <Form.Control
                    placeholder="Tên tài liệu"
                    value={file.file_name ?? file.fileName ?? ""}
                    onChange={(e) =>
                      updateAttachment(index, "file_name", e.target.value)
                    }
                  />
                </Col>

                <Col md={6}>
                  <Form.Control
                    placeholder="Link tải (nếu có)"
                    value={file.download_url ?? file.downloadUrl ?? ""}
                    onChange={(e) =>
                      updateAttachment(index, "download_url", e.target.value)
                    }
                  />
                </Col>

                <Col md={1}>
                  <Button
                    type="button"
                    variant="outline-danger"
                    className="w-100"
                    onClick={() => removeAttachment(index)}
                  >
                    <FaTrash />
                  </Button>
                </Col>
              </Row>
            ))}

            {attachments.length === 0 && (
              <div className="vqr-small-muted">Chưa có tài liệu đính kèm.</div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="outline-secondary"
              disabled={saving}
              onClick={() => setShowForm(false)}
            >
              Hủy
            </Button>

            <Button type="submit" className="vqr-primary" disabled={saving}>
              {saving && (
                <Spinner size="sm" animation="border" className="me-2" />
              )}
              {editing ? "Lưu thay đổi" : "Thêm vào hệ thống"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* =========================
          DETAIL MODAL
      ========================= */}

      <Modal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết yêu cầu báo giá</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selected && (
            <>
              <div className="vqr-detail-title">{selected.request_name}</div>

              <div className="mb-3">{statusBadge(selected.status)}</div>

              <Row>
                {renderField("Mã thông báo", selected.notification_code)}
                {renderField("Nguồn", SOURCE_LABEL[selected.source_type])}
                {renderField("Đơn vị mời", selected.procuring_entity)}
                {renderField("Nhóm phụ trách", getTeamName(selected))}
                {renderField("Tên gói thầu", selected.package_name)}
                {renderField("Địa điểm", selected.location)}
                {renderField(
                  "Ngày đăng tải",
                  formatDate(selected.publish_date),
                )}
                {renderField(
                  "Hạn nhận báo giá",
                  formatDate(selected.closing_date, true),
                )}
                {renderField(
                  "Thời gian có hiệu lực tối thiểu của báo giá",
                  selected.quotation_validity,
                )}
                {renderField("Giá gói thầu", money(selected.package_price))}
                {renderField(
                  "Khối lượng",
                  selected.quantity == null
                    ? "—"
                    : `${selected.quantity} ${selected.unit || ""}`,
                )}
                {renderField("Ngày tạo", formatDate(selected.created_at, true))}
                {renderField("Người tạo (ID)", selected.created_by)}
              </Row>

              {selected.notes && (
                <div className="vqr-detail-note">
                  <strong>Ghi chú</strong>
                  <p>{selected.notes}</p>
                </div>
              )}

              {selected.source_url && (
                <div className="mb-3">
                  <a
                    href={selected.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaExternalLinkAlt className="me-2" />
                    Xem thông báo nguồn
                  </a>
                </div>
              )}

              <h6>Tài liệu đính kèm</h6>

              {selected.attachments?.length ? (
                <div className="vqr-detail-files">
                  {selected.attachments.map((file, index) => {
                    const url = file.storage_url || file.download_url;

                    return (
                      <div
                        key={file.attachment_id || index}
                        className="vqr-detail-file"
                      >
                        <span>{file.file_name}</span>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Mở file
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted">Chưa có tài liệu.</p>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowDetail(false)}
          >
            Đóng
          </Button>

          <Button
            onClick={() => {
              const item = selected;
              setShowDetail(false);
              openEdit(item);
            }}
          >
            <FaEdit className="me-2" />
            Chỉnh sửa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* =========================
          ASSIGN MODAL
      ========================= */}

      <Modal
        show={showAssign}
        onHide={() => !saving && setShowAssign(false)}
        centered
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>Phân công nhóm kinh doanh</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="mb-3">
            <strong>{selected?.request_name}</strong>
            <div className="vqr-small-muted mt-1">
              Nhóm hiện tại: {selected ? getTeamName(selected) : "—"}
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Nhóm tiếp nhận mới</Form.Label>

            <Form.Select
              value={assignTeamId}
              onChange={(e) => setAssignTeamId(e.target.value)}
            >
              <option value="">Chọn nhóm kinh doanh</option>

              {activeTeams.map((team) => (
                <option key={team.team_id} value={team.team_id}>
                  {team.team_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Lý do phân công / chuyển nhóm</Form.Label>

            <Form.Control
              as="textarea"
              rows={3}
              value={assignReason}
              onChange={(e) => setAssignReason(e.target.value)}
              placeholder="Nhập lý do (nếu có)"
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowAssign(false)}
            disabled={saving}
          >
            Hủy
          </Button>

          <Button onClick={handleAssign} disabled={saving}>
            {saving ? "Đang lưu..." : "Xác nhận"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* =========================
          STATUS MODAL
      ========================= */}

      <Modal
        show={showStatus}
        onHide={() => !saving && setShowStatus(false)}
        centered
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>Cập nhật trạng thái</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <p className="fw-semibold">{selected?.request_name}</p>

          <Form.Group className="mb-3">
            <Form.Label>Trạng thái mới</Form.Label>

            <Form.Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {STATUS_OPTIONS.filter((item) =>
                ["SUBMITTED", "WON", "LOST", "CANCELLED"].includes(item.value),
              ).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Ghi chú cập nhật</Form.Label>

            <Form.Control
              as="textarea"
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Ví dụ: Đã gửi báo giá cho khách hàng"
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowStatus(false)}
            disabled={saving}
          >
            Hủy
          </Button>

          <Button onClick={handleStatus} disabled={saving}>
            {saving ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* =========================
          HISTORY MODAL
      ========================= */}

      <Modal
        show={showHistory}
        onHide={() => setShowHistory(false)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Lịch sử xử lý yêu cầu</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <p className="fw-semibold">{selected?.request_name}</p>

          {historyLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-muted py-3">Chưa có lịch sử xử lý.</div>
          ) : (
            <div className="vqr-timeline">
              {history.map((item) => (
                <div key={item.log_id} className="vqr-timeline-item">
                  <div className="vqr-timeline-top">
                    <strong>{item.action}</strong>
                    <span>{formatDate(item.created_at, true)}</span>
                  </div>

                  <div>
                    Người thực hiện: <strong>#{item.performed_by}</strong>
                  </div>

                  {item.old_status !== item.new_status && item.new_status && (
                    <div>
                      Trạng thái: {STATUS_LABEL[item.old_status] || "—"}
                      {" → "}
                      {STATUS_LABEL[item.new_status] || item.new_status}
                    </div>
                  )}

                  {item.new_team_id != null &&
                    String(item.old_team_id) !== String(item.new_team_id) && (
                      <div>
                        Nhóm: {item.old_team_id || "—"}
                        {" → "}
                        {item.new_team_id}
                      </div>
                    )}

                  {item.reason && <p className="mb-0 mt-1">{item.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowHistory(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* =========================
          DELETE MODAL
      ========================= */}

      <Modal
        show={showDelete}
        onHide={() => !saving && setShowDelete(false)}
        centered
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>Xóa yêu cầu báo giá</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <p>Bạn có chắc muốn xóa yêu cầu:</p>

          <strong>{selected?.request_name}</strong>

          <Alert variant="warning" className="mt-3">
            Yêu cầu sẽ được xóa mềm và vẫn giữ lịch sử trong PostgreSQL.
          </Alert>

          <Form.Group>
            <Form.Label>Lý do xóa</Form.Label>

            <Form.Control
              as="textarea"
              rows={3}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Nhập lý do (nếu có)"
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowDelete(false)}
            disabled={saving}
          >
            Hủy
          </Button>

          <Button variant="danger" onClick={handleDelete} disabled={saving}>
            {saving ? "Đang xóa..." : "Xác nhận xóa"}
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="vqr-toast-container">
        <Toast
          show={toast.show}
          onClose={() =>
            setToast((prev) => ({
              ...prev,
              show: false,
            }))
          }
          delay={3000}
          autohide
          className={`vqr-toast vqr-toast-${toast.variant}`}
        >
          <Toast.Body>
            <div className="vqr-toast-content">
              {toast.variant === "danger" ? (
                <FaExclamationTriangle className="vqr-toast-icon" />
              ) : (
                <FaCheckCircle className="vqr-toast-icon" />
              )}

              <div className="vqr-toast-text">
                <strong>
                  {toast.variant === "danger"
                    ? "Không thành công"
                    : "Thành công"}
                </strong>

                <span>{toast.message}</span>
              </div>

              <button
                type="button"
                className="vqr-toast-close"
                onClick={() =>
                  setToast((prev) => ({
                    ...prev,
                    show: false,
                  }))
                }
                aria-label="Đóng thông báo"
              >
                ×
              </button>
            </div>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
