import React, { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Form,
  Modal,
  Spinner,
  Table,
  Row,
  Col,
} from "react-bootstrap";

import {
  FaFileInvoiceDollar,
  FaSyncAlt,
  FaEye,
  FaHistory,
  FaEdit,
  FaUsers,
  FaSearch,
  FaExternalLinkAlt,
} from "react-icons/fa";

import APIToken from "../../config/APIToken";

import "./index.css";

// ==========================================================
// CONFIG
// ==========================================================

const API = "/quotationRequest/team";
const PAGE_SIZE = 20;

const STATUSES = [
  { value: "RECEIVED", label: "Đã tiếp nhận" },
  { value: "PROCESSING", label: "Đang thực hiện" },
  { value: "SUBMITTED", label: "Đã nộp báo giá" },
  { value: "WON", label: "Trúng báo giá" },
  { value: "LOST", label: "Không trúng báo giá" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "CONTACTED", label: "Đã liên hệ (trạng thái cũ)" },
  { value: "COMPLETED", label: "Hoàn tất (trạng thái cũ)" },
];

const LABELS = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));

const TRANSITIONS = {
  RECEIVED: ["PROCESSING", "CANCELLED"],

  PROCESSING: ["SUBMITTED", "CANCELLED"],

  CONTACTED: ["PROCESSING", "SUBMITTED", "CANCELLED"],

  SUBMITTED: ["PROCESSING", "WON", "LOST", "CANCELLED"],

  COMPLETED: ["SUBMITTED", "WON", "LOST"],

  WON: [],
  LOST: [],
  CANCELLED: [],
};

const SOURCE = {
  MANUAL: "Nhập thủ công",
  PROCUREMENT: "Mua sắm công",
};

// ==========================================================
// HELPERS
// ==========================================================

const getError = (err) =>
  err?.response?.data?.message || err?.message || "Có lỗi xảy ra.";

const dateText = (value, withTime = false) => {
  if (!value) return "—";

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [y, m, d] = String(value).split("-");
    return `${d}/${m}/${y}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

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

const money = (value) =>
  value == null || value === ""
    ? "—"
    : `${new Intl.NumberFormat("vi-VN").format(Number(value))} đ`;

// ==========================================================
// COMPONENT
// ==========================================================

export default function QuotationRequestsTeam() {
  // --------------------------------------------------------
  // DATA
  // --------------------------------------------------------

  const [rows, setRows] = useState([]);
  const [team, setTeam] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------------
  // FILTERS / PAGINATION
  // --------------------------------------------------------

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // --------------------------------------------------------
  // MODALS
  // --------------------------------------------------------

  const [selected, setSelected] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");

  // --------------------------------------------------------
  // PERMISSION
  //
  // Không lấy vai trò ADMIN nhóm từ localStorage.
  // API trả role thực tế theo bảng QuotationTeamMember.
  // --------------------------------------------------------

  const isTeamAdmin = false;
  const allowedStatuses = (TRANSITIONS[selected?.status] || [])
    .map((value) => STATUSES.find((status) => status.value === value))
    .filter(Boolean);

  // ========================================================
  // LOAD MY TEAM REQUESTS
  //
  // GET /api/quotationRequest/team/my-list
  // ========================================================

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: PAGE_SIZE,
      };

      if (search) {
        params.search = search;
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await APIToken.get(`${API}/my-list`, { params });

      if (response.data?.success === false) {
        throw new Error(response.data.message);
      }

      const data = response.data?.data;

      setRows(Array.isArray(data) ? data : data?.rows || []);

      setTeam(response.data?.team || null);

      setPages(Math.max(1, response.data?.pagination?.total_pages || 1));

      setTotal(response.data?.pagination?.total ?? 0);
    } catch (err) {
      setRows([]);
      setTeam(null);
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // ========================================================
  // GET DETAIL
  // ========================================================

  const openDetail = async (item) => {
    setSaving(true);
    setError("");

    try {
      const response = await APIToken.get(`${API}/${item.request_id}`);

      setSelected(response.data?.data);
      setDetailOpen(true);
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // GET HISTORY
  // ========================================================

  const openHistory = async (item) => {
    setSelected(item);
    setHistory([]);
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const response = await APIToken.get(`${API}/${item.request_id}/history`, {
        params: {
          page: 1,
          limit: 100,
        },
      });

      const data = response.data?.data;

      setHistory(Array.isArray(data) ? data : data?.rows || []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setHistoryLoading(false);
    }
  };

  // ========================================================
  // OPEN STATUS MODAL
  // ========================================================

  const openStatus = (item) => {
    if (!isTeamAdmin) return;

    const next = TRANSITIONS[item.status] || [];

    if (!next.length) return;

    setSelected(item);

    setNewStatus(next[0]);
    setReason("");
    setError("");

    setStatusOpen(true);
  };

  // ========================================================
  // UPDATE STATUS
  //
  // PUT /api/quotationRequest/team/:id/status
  //
  // Không truyền performed_by.
  // Backend lấy người thao tác từ JWT.
  // ========================================================

  const updateStatus = async () => {
    if (
      !isTeamAdmin ||
      !selected ||
      !allowedStatuses.some((status) => status.value === newStatus)
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await APIToken.put(`${API}/${selected.request_id}/status`, {
        status: newStatus,
        reason: reason.trim() || null,
      });

      setStatusOpen(false);

      setSuccess("Cập nhật trạng thái thành công.");

      await loadRequests();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // RENDER HELPERS
  // ========================================================

  const badge = (status) => (
    <Badge
      bg="light"
      className={`vqr-status vqr-status-${status || "RECEIVED"}`}
    >
      {LABELS[status] || status || "—"}
    </Badge>
  );

  const field = (label, value) => (
    <Col md={6} className="mb-3">
      <div className="vqr-detail-label">{label}</div>

      <div className="vqr-detail-value">
        {value == null || value === "" ? "—" : value}
      </div>
    </Col>
  );

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="vqr-page">
      {/* HEADER */}

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
            Danh sách yêu cầu báo giá được phân cho nhóm kinh doanh của bạn.
          </p>
        </div>

        <div className="vqr-heading-actions">
          <Button
            variant="outline-secondary"
            onClick={loadRequests}
            disabled={loading}
          >
            <FaSyncAlt className="me-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* NOTIFICATIONS */}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* TEAM INFORMATION */}

      {team && (
        <Alert variant="info">
          <FaUsers className="me-2" />

          <strong>{team.team_name}</strong>

          {" · "}

          {isTeamAdmin
            ? "Admin nhóm: được cập nhật trạng thái"
            : "Thành viên: chỉ được xem"}
        </Alert>
      )}

      {/* FILTERS */}

      <div className="vqr-panel">
        <Form
          onSubmit={(event) => {
            event.preventDefault();

            setPage(1);
            setSearch(searchInput.trim());
          }}
        >
          <Row className="g-2 align-items-end">
            <Col lg={7} md={7}>
              <Form.Label>Tìm kiếm</Form.Label>

              <div className="vqr-search">
                <FaSearch />

                <Form.Control
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Mã yêu cầu, tên báo giá, đơn vị mời..."
                />
              </div>
            </Col>

            <Col lg={3} md={3}>
              <Form.Label>Trạng thái</Form.Label>

              <Form.Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>

                {STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col lg={2} md={2}>
              <Button type="submit" className="w-100">
                Lọc
              </Button>
            </Col>
          </Row>

          <div className="vqr-filter-footer">
            <span>
              Tổng cộng: <strong>{total}</strong> yêu cầu
            </span>

            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setStatusFilter("");
                setPage(1);
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        </Form>
      </div>

      {/* DATA TABLE */}

      <div className="vqr-panel vqr-table-panel">
        <div className="table-responsive">
          <Table hover className="vqr-table align-middle">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã yêu cầu</th>
                <th className="vqr-content-column">Tên báo giá</th>
                <th>Đơn vị</th>
                <th>Hạn nộp báo giá</th>
                <th>Hiệu lực báo giá</th>
                <th>Nhóm phụ trách</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    <Spinner size="sm" animation="border" /> Đang tải...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    Chưa có yêu cầu báo giá phù hợp.
                  </td>
                </tr>
              ) : (
                rows.map((item, index) => (
                  <tr key={item.request_id}>
                    <td>{(page - 1) * PAGE_SIZE + index + 1}</td>

                    <td>
                      <strong className="vqr-code">
                        {item.notification_code || `#${item.request_id}`}
                      </strong>

                      <div className="vqr-small-muted">
                        {SOURCE[item.source_type] || "—"}
                      </div>
                    </td>

                    <td className="vqr-content-column">
                      <button
                        type="button"
                        className="vqr-title-button"
                        onClick={() => openDetail(item)}
                      >
                        {item.request_name}
                      </button>

                      <div className="vqr-small-muted">
                        {item.location || "Chưa có địa điểm"}
                      </div>
                    </td>

                    <td className="vqr-cell-text">
                      {item.procuring_entity || "—"}
                    </td>

                    <td>{dateText(item.closing_date, true)}</td>

                    <td className="vqr-validity-column">
                      <span className="vqr-validity-text">
                        {item.quotation_validity || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="vqr-team-badge vqr-team-assigned">
                        <FaUsers className="vqr-team-icon" />

                        <span className="vqr-team-name">
                          {item.team?.team_name || team?.team_name || "—"}
                        </span>
                      </span>
                    </td>

                    <td>{badge(item.status)}</td>

                    <td>
                      <div className="vqr-table-actions">
                        <Button
                          variant="light"
                          size="sm"
                          title="Xem chi tiết"
                          onClick={() => openDetail(item)}
                        >
                          <FaEye />
                        </Button>

                        <Button
                          variant="light"
                          size="sm"
                          title="Lịch sử"
                          onClick={() => openHistory(item)}
                        >
                          <FaHistory />
                        </Button>

                        {isTeamAdmin &&
                          (TRANSITIONS[item.status] || []).length > 0 && (
                            <Button
                              variant="light"
                              size="sm"
                              title="Cập nhật trạng thái"
                              onClick={() => openStatus(item)}
                            >
                              <FaEdit />
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* PAGINATION */}

        <div className="vqr-pagination">
          <span>
            Trang {page} / {pages}
          </span>

          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Trước
            </Button>

            <Button
              variant="outline-secondary"
              size="sm"
              disabled={page >= pages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}

      <Modal
        show={detailOpen}
        onHide={() => setDetailOpen(false)}
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

              <div className="mb-3">{badge(selected.status)}</div>

              <Row>
                {field("Mã yêu cầu", selected.notification_code)}

                {field("Nguồn", SOURCE[selected.source_type])}

                {field("Đơn vị mời", selected.procuring_entity)}

                {field(
                  "Nhóm phụ trách",
                  selected.team?.team_name || team?.team_name,
                )}

                {field("Tên gói thầu", selected.package_name)}

                {field("Địa điểm", selected.location)}

                {field("Ngày đăng tải", dateText(selected.publish_date))}

                {field(
                  "Hạn nộp báo giá",
                  dateText(selected.closing_date, true),
                )}

                {field("Hiệu lực báo giá", selected.quotation_validity)}

                {field("Giá gói thầu", money(selected.package_price))}

                {field(
                  "Khối lượng",
                  selected.quantity == null
                    ? "—"
                    : `${selected.quantity} ${selected.unit || ""}`,
                )}

                {field("Ngày tạo", dateText(selected.created_at, true))}
              </Row>

              {selected.notes && (
                <div className="vqr-detail-note">
                  <strong>Ghi chú</strong>
                  <p>{selected.notes}</p>
                </div>
              )}

              {selected.source_url && (
                <p>
                  <a
                    href={selected.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaExternalLinkAlt /> Xem thông báo nguồn
                  </a>
                </p>
              )}

              <h6>Tài liệu đính kèm</h6>

              {selected.attachments?.length ? (
                <div className="vqr-detail-files">
                  {selected.attachments.map((file, index) => (
                    <div
                      key={file.attachment_id || index}
                      className="vqr-detail-file"
                    >
                      <span>{file.file_name}</span>

                      {(file.storage_url || file.download_url) && (
                        <a
                          href={file.storage_url || file.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Mở file
                        </a>
                      )}
                    </div>
                  ))}
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
            onClick={() => setDetailOpen(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* HISTORY MODAL */}

      <Modal
        show={historyOpen}
        onHide={() => setHistoryOpen(false)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Lịch sử xử lý yêu cầu</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="fw-semibold">{selected?.request_name}</p>

          {historyLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-muted">Chưa có lịch sử.</p>
          ) : (
            <div className="vqr-timeline">
              {history.map((item) => (
                <div key={item.log_id} className="vqr-timeline-item">
                  <div className="vqr-timeline-top">
                    <strong>{item.action}</strong>

                    <span>{dateText(item.created_at, true)}</span>
                  </div>

                  <div>
                    Người thực hiện: <strong>#{item.performed_by}</strong>
                  </div>

                  {item.old_status !== item.new_status && item.new_status && (
                    <div>
                      Trạng thái: {LABELS[item.old_status] || "—"}
                      {" → "}
                      {LABELS[item.new_status] || item.new_status}
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
            onClick={() => setHistoryOpen(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* STATUS MODAL - ADMIN NHÓM */}

      <Modal
        show={statusOpen}
        onHide={() => !saving && setStatusOpen(false)}
        centered
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>Cập nhật trạng thái</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <p className="fw-semibold">{selected?.request_name}</p>

          <p className="text-muted">
            Hiện tại: {LABELS[selected?.status] || selected?.status}
          </p>

          <Form.Group className="mb-3">
            <Form.Label>Trạng thái mới</Form.Label>

            <Form.Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {allowedStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Ghi chú cập nhật</Form.Label>

            <Form.Control
              as="textarea"
              rows={3}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Lý do thay đổi trạng thái..."
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            disabled={saving}
            onClick={() => setStatusOpen(false)}
          >
            Hủy
          </Button>

          <Button
            onClick={updateStatus}
            disabled={saving || !allowedStatuses.length}
          >
            {saving ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
