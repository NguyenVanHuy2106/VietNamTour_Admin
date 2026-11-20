import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, Badge, Button, Spinner, Table } from "react-bootstrap";

import {
  FaArrowLeft,
  FaSyncAlt,
  FaBuilding,
  FaClipboardList,
  FaCalendarAlt,
  FaUserTie,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFilePdf,
  FaFileAlt,
  FaExternalLinkAlt,
  FaUsers,
  FaInfoCircle,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaDatabase,
  FaFolderOpen,
} from "react-icons/fa";

import { useLocation, useNavigate } from "react-router-dom";

import APIToken from "../../config/APIToken";

import "./QuotationRequestDetail.css";

// ==========================================================
// VIET NAM TOUR ERP
// QUOTATION REQUEST DETAIL
//
// RECEIVE:
// navigate("/quotation-request-detail", {
//   state: {
//     requestId: item.request_id
//   }
// });
//
// ADMIN WEB:
// GET /api/quotationRequest/:id
//
// TEAM:
// GET /api/quotationRequest/team/:id
//
// API cần trả:
// data: {
//   ...quotationRequest,
//   items: [],
//   attachments: []
// }
// ==========================================================

// ==========================================================
// CONFIG
// ==========================================================

const STATUS_OPTIONS = {
  RECEIVED: {
    label: "Đã tạo mới",
    className: "RECEIVED",
  },
  PROCESSING: {
    label: "Đang thực hiện",
    className: "PROCESSING",
  },
  SUBMITTED: {
    label: "Đã nộp báo giá",
    className: "SUBMITTED",
  },
  WON: {
    label: "Trúng báo giá",
    className: "WON",
  },
  LOST: {
    label: "Không trúng báo giá",
    className: "LOST",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "CANCELLED",
  },
  CONTACTED: {
    label: "Đã liên hệ",
    className: "CONTACTED",
  },
  COMPLETED: {
    label: "Hoàn tất",
    className: "COMPLETED",
  },
};

const SOURCE_LABELS = {
  MANUAL: "Nhập thủ công",
  PROCUREMENT: "Mua sắm công",
};

const RECEPTION_LABELS = {
  ONLINE: "Trực tuyến (Online)",
  OFFLINE: "Trực tiếp (Offline)",
  OTHER: "Khác",
};

// ==========================================================
// HELPERS
// ==========================================================

const getError = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Không thể lấy chi tiết yêu cầu báo giá."
  );
};

const isEmpty = (value) => {
  return value === null || value === undefined || value === "";
};

const display = (value) => {
  return isEmpty(value) ? "—" : String(value);
};

const formatDate = (value, withTime = false) => {
  if (!value) return "—";

  const raw = String(value);

  // PostgreSQL DATE: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
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

const formatNumber = (value) => {
  if (isEmpty(value)) return "—";

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 3,
  }).format(number);
};

const formatMoney = (value) => {
  if (isEmpty(value)) return "—";

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("vi-VN").format(number) + " VNĐ";
};

const formatFileSize = (bytes) => {
  if (isEmpty(bytes)) return "";

  const number = Number(bytes);

  if (!Number.isFinite(number)) return "";

  if (number < 1024) {
    return `${number} B`;
  }

  if (number < 1024 * 1024) {
    return `${(number / 1024).toFixed(1)} KB`;
  }

  return `${(number / (1024 * 1024)).toFixed(2)} MB`;
};

// ==========================================================
// NORMALIZE API RESPONSE
// ==========================================================

const normalizeDetail = (response) => {
  const root = response?.data || {};

  if (root.success === false) {
    throw new Error(root.message || "Không thể lấy dữ liệu chi tiết.");
  }

  const raw = root.data || root;

  const request = raw.request || raw.quotationRequest || raw;

  const items = Array.isArray(request.items)
    ? request.items
    : Array.isArray(request.quotation_items)
      ? request.quotation_items
      : Array.isArray(raw.items)
        ? raw.items
        : [];

  const attachments = Array.isArray(request.attachments)
    ? request.attachments
    : Array.isArray(raw.attachments)
      ? raw.attachments
      : [];

  return {
    ...request,

    request_id: request.request_id ?? request.requestId,

    notification_code:
      request.notification_code ?? request.notificationCode ?? "",

    request_name: request.request_name ?? request.requestName ?? "",

    procuring_entity: request.procuring_entity ?? request.procuringEntity ?? "",

    items: [...items].sort(
      (a, b) => Number(a.item_no || 0) - Number(b.item_no || 0),
    ),

    attachments,
  };
};

// ==========================================================
// REUSABLE FIELD
// ==========================================================

const DetailField = ({ label, value, full = false, important = false }) => {
  return (
    <div
      className={[
        "vqr-detail-field",
        full ? "vqr-detail-field-full" : "",
        important ? "vqr-detail-field-important" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="vqr-detail-field-label">{label}</div>

      <div className="vqr-detail-field-value">
        {isEmpty(value) ? "—" : value}
      </div>
    </div>
  );
};

// ==========================================================
// REUSABLE SECTION
// ==========================================================

const DetailSection = ({ icon, title, description, count, children }) => {
  return (
    <section className="vqr-detail-section">
      <div className="vqr-detail-section-heading">
        <div className="vqr-detail-section-heading-left">
          <span className="vqr-detail-section-icon">{icon}</span>

          <div className="vqr-detail-section-heading-text">
            <h3>{title}</h3>

            {description && <p>{description}</p>}
          </div>
        </div>

        {count !== undefined && (
          <span className="vqr-detail-section-count">{count} hạng mục</span>
        )}
      </div>

      <div className="vqr-detail-section-body">{children}</div>
    </section>
  );
};

// ==========================================================
// MAIN COMPONENT
// ==========================================================

export default function QuotationRequestDetail() {
  const navigate = useNavigate();
  const location = useLocation();

  // ========================================================
  // GET REQUEST ID FROM NAVIGATE STATE
  // ========================================================

  const requestId = location.state?.requestId;

  // ========================================================
  // ROLE
  // ========================================================

  const role = String(localStorage.getItem("role") || "")
    .trim()
    .toLowerCase();

  const isWebAdmin = role === "admin";

  // ========================================================
  // STATE
  // ========================================================

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ========================================================
  // LOAD DETAIL
  // ========================================================

  const loadDetail = useCallback(
    async (isRefresh = false) => {
      const id = Number(requestId);

      if (!Number.isSafeInteger(id) || id <= 0) {
        setRequest(null);
        setError(
          "Không tìm thấy mã yêu cầu báo giá. Vui lòng quay lại danh sách.",
        );
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await APIToken.get(`/quotationRequest/detail/${id}`);

        const detail = normalizeDetail(response);

        setRequest(detail);
      } catch (err) {
        console.error("[QUOTATION_REQUEST_DETAIL]", err);

        setError(getError(err));

        if (!isRefresh) {
          setRequest(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [requestId, isWebAdmin],
  );

  // ========================================================
  // LOAD ON MOUNT
  // ========================================================

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // ========================================================
  // NAVIGATION
  // ========================================================

  const handleBack = () => {
    navigate(-1);
  };

  // ========================================================
  // DERIVED VALUES
  // ========================================================

  const status = useMemo(() => {
    if (!request) return null;

    return (
      STATUS_OPTIONS[request.status] || {
        label: request.status || "Chưa xác định",
        className: "UNKNOWN",
      }
    );
  }, [request]);

  const items = useMemo(() => {
    return Array.isArray(request?.items) ? request.items : [];
  }, [request]);

  const attachments = useMemo(() => {
    return Array.isArray(request?.attachments) ? request.attachments : [];
  }, [request]);

  const teamName = useMemo(() => {
    if (!request) return "—";

    return (
      request.team?.team_name ||
      request.team_name ||
      (request.team_id ? `Nhóm #${request.team_id}` : "Chưa phân nhóm")
    );
  }, [request]);

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="vqr-detail-page">
      <div className="vqr-detail-container">
        {/* ================================================
            TOOLBAR
        ================================================ */}

        <div className="vqr-detail-toolbar">
          <Button
            variant="outline-secondary"
            onClick={handleBack}
            className="vqr-detail-back"
          >
            <FaArrowLeft />
            <span>Quay trở lại</span>
          </Button>

          <Button
            variant="outline-primary"
            onClick={() => loadDetail(true)}
            disabled={loading || refreshing || !requestId}
            className="vqr-detail-refresh"
          >
            {refreshing ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <FaSyncAlt />
            )}

            <span>Làm mới</span>
          </Button>
        </div>

        {/* ================================================
            ERROR
        ================================================ */}

        {error && (
          <Alert variant="danger" className="vqr-detail-alert">
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        )}

        {/* ================================================
            LOADING
        ================================================ */}

        {loading && !request && (
          <div className="vqr-detail-loading">
            <Spinner animation="border" variant="primary" />

            <strong>Đang tải yêu cầu báo giá...</strong>

            <span>Hệ thống đang lấy thông tin chi tiết.</span>
          </div>
        )}

        {/* ================================================
            EMPTY
        ================================================ */}

        {!loading && !request && (
          <div className="vqr-detail-empty">
            <FaFolderOpen />

            <strong>Không có dữ liệu yêu cầu báo giá</strong>

            <p>Yêu cầu không tồn tại hoặc tài khoản không có quyền truy cập.</p>

            <Button variant="primary" onClick={handleBack}>
              Quay lại danh sách
            </Button>
          </div>
        )}

        {/* ================================================
            DETAIL
        ================================================ */}

        {request && (
          <>
            {/* ============================================
                PAGE HEADER
            ============================================ */}

            <div className="vqr-detail-header">
              <div className="vqr-detail-header-content">
                <div className="vqr-detail-eyebrow">
                  <FaFileInvoiceDollar />
                  VIỆT NAM TOUR · QUẢN LÝ YÊU CẦU BÁO GIÁ
                </div>

                <h1>{display(request.request_name)}</h1>

                <div className="vqr-detail-header-meta">
                  <span className="vqr-detail-code">
                    <FaFileAlt />

                    {display(request.notification_code)}
                  </span>

                  <span className="vqr-detail-source">
                    <FaDatabase />

                    {SOURCE_LABELS[request.source_type] ||
                      display(request.source_type)}
                  </span>
                </div>
              </div>

              <div className="vqr-detail-header-right">
                <Badge
                  bg="light"
                  className={`vqr-detail-status vqr-detail-status-${status?.className}`}
                >
                  {status?.label}
                </Badge>

                <div className="vqr-detail-team">
                  <span className="vqr-detail-team-label">
                    <FaUsers />
                    Nhóm thực hiện
                  </span>

                  <strong className="vqr-detail-team-name">{teamName}</strong>
                </div>
              </div>
            </div>

            {/* ============================================
                THÔNG TIN GÓI THẦU
            ============================================ */}

            <DetailSection
              icon={<FaBuilding />}
              title="Thông tin gói thầu"
              description="Thông tin tổng quan về yêu cầu báo giá"
            >
              <div className="vqr-detail-grid">
                <DetailField
                  label="Tên gói thầu"
                  value={request.package_name || request.request_name}
                  full
                  important
                />

                <DetailField
                  label="Tên yêu cầu báo giá"
                  value={request.request_name}
                  full
                />

                <DetailField
                  label="Đơn vị yêu cầu báo giá"
                  value={request.procuring_entity}
                  full
                />

                <DetailField
                  label="Mã yêu cầu báo giá"
                  value={request.notification_code}
                />

                <DetailField
                  label="Ngày đăng tải"
                  value={formatDate(request.publish_date)}
                />

                <DetailField
                  label="Phân loại báo giá"
                  value={
                    request.notification_type === "es-ycbg"
                      ? "Gói thầu hàng hóa / dịch vụ"
                      : request.notification_type
                  }
                />

                <DetailField
                  label="Giá gói thầu"
                  value={formatMoney(request.package_price)}
                />

                <DetailField
                  label="Địa điểm thực hiện"
                  value={request.location}
                  full
                />
              </div>
            </DetailSection>

            {/* ============================================
                LIÊN HỆ
            ============================================ */}

            <DetailSection
              icon={<FaUserTie />}
              title="Thông tin liên hệ"
              description="Người phụ trách tiếp nhận báo giá"
            >
              <div className="vqr-detail-grid">
                <DetailField label="Họ và tên" value={request.contact_name} />

                <DetailField label="Chức vụ" value={request.contact_position} />

                <DetailField
                  label="Số điện thoại"
                  value={
                    request.contact_phone ? (
                      <a
                        href={`tel:${request.contact_phone}`}
                        className="vqr-detail-link"
                      >
                        <FaPhoneAlt />
                        {request.contact_phone}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />

                <DetailField
                  label="Email"
                  value={
                    request.contact_email ? (
                      <a
                        href={`mailto:${request.contact_email}`}
                        className="vqr-detail-link"
                      >
                        <FaEnvelope />
                        {request.contact_email}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />

                <DetailField
                  label="Địa chỉ liên hệ"
                  value={request.contact_address}
                  full
                />
              </div>
            </DetailSection>

            {/* ============================================
                THỜI GIAN TIẾP NHẬN
            ============================================ */}

            <DetailSection
              icon={<FaCalendarAlt />}
              title="Thời gian tiếp nhận báo giá"
              description="Thời hạn, hình thức tiếp nhận và hiệu lực báo giá"
            >
              <div className="vqr-detail-grid">
                <DetailField
                  label="Hình thức tiếp nhận"
                  value={
                    RECEPTION_LABELS[request.reception_method] ||
                    request.reception_method
                  }
                />

                <DetailField
                  label="Ngày bắt đầu tiếp nhận"
                  value={formatDate(request.reception_start_date)}
                />

                <DetailField
                  label="Ngày kết thúc tiếp nhận"
                  value={formatDate(request.reception_end_date)}
                  important
                />

                <DetailField
                  label="Thời hạn đóng báo giá"
                  value={
                    request.closing_date
                      ? formatDate(request.closing_date, true)
                      : formatDate(request.reception_end_date)
                  }
                />

                <DetailField
                  label="Thời gian có hiệu lực tối thiểu"
                  value={request.quotation_validity}
                  full
                />

                <DetailField
                  label="Ngày thực hiện dịch vụ"
                  value={formatDate(request.execution_date)}
                />
              </div>
            </DetailSection>

            {/* ============================================
                DANH MỤC HÀNG HÓA / DỊCH VỤ
            ============================================ */}

            <DetailSection
              icon={<FaClipboardList />}
              title="Danh mục hàng hóa / dịch vụ"
              description="Nội dung chi tiết các hạng mục cần báo giá"
              count={items.length}
            >
              {items.length > 0 ? (
                <div className="vqr-items-table-container">
                  <Table
                    hover
                    className="vqr-detail-items-table vqr-items-table-v2"
                  >
                    <colgroup>
                      <col style={{ width: "5%" }} />
                      <col style={{ width: "25%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                    </colgroup>

                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Danh mục hàng hóa / dịch vụ</th>
                        <th>Mô tả hàng hóa / dịch vụ</th>
                        <th>Địa điểm thực hiện</th>
                        <th>Khối lượng</th>
                        <th>Đơn vị</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.item_id || index}>
                          <td className="vqr-item-stt">
                            {item.item_no || index + 1}
                          </td>

                          <td className="vqr-item-title">
                            {display(item.item_name)}
                          </td>

                          <td className="vqr-item-description">
                            {display(item.description)}
                          </td>

                          <td className="vqr-item-location">
                            {display(item.location)}
                          </td>

                          <td className="vqr-item-quantity">
                            {formatNumber(item.quantity)}
                          </td>

                          <td className="vqr-item-unit">
                            {display(item.unit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="vqr-detail-items-empty">
                  <FaClipboardList />

                  <strong>Chưa có danh mục hàng hóa / dịch vụ</strong>

                  <p>
                    API chi tiết chưa trả danh sách items hoặc yêu cầu chưa có
                    hạng mục.
                  </p>
                </div>
              )}
            </DetailSection>

            {/* ============================================
                ATTACHMENTS
            ============================================ */}

            <DetailSection
              icon={<FaFilePdf />}
              title="Tài liệu đính kèm"
              description="Các tài liệu liên quan đến yêu cầu báo giá"
            >
              {attachments.length > 0 ? (
                <div className="vqr-detail-file-list">
                  {attachments.map((attachment, index) => {
                    const fileUrl =
                      attachment.download_url || attachment.storage_url;

                    const isPdf = String(attachment.file_name || "")
                      .toLowerCase()
                      .endsWith(".pdf");

                    return (
                      <div
                        className="vqr-detail-file"
                        key={attachment.attachment_id || index}
                      >
                        <div className="vqr-detail-file-left">
                          <div className="vqr-detail-file-icon">
                            {isPdf ? <FaFilePdf /> : <FaFileAlt />}
                          </div>

                          <div className="vqr-detail-file-content">
                            <strong>
                              {attachment.file_name || "Tài liệu đính kèm"}
                            </strong>

                            <div className="vqr-detail-file-meta">
                              {attachment.page_count && (
                                <span>{attachment.page_count} trang</span>
                              )}

                              {attachment.file_size && (
                                <span>
                                  {formatFileSize(attachment.file_size)}
                                </span>
                              )}

                              {attachment.document_role === "SOURCE_PDF" && (
                                <span className="vqr-detail-file-tag">
                                  PDF gốc
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="vqr-detail-file-action"
                          >
                            <FaDownload />
                            Xem / Tải
                          </a>
                        ) : (
                          <span className="vqr-detail-file-unavailable">
                            Chưa có đường dẫn tải
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="vqr-detail-no-file">
                  <FaFilePdf />

                  <span>Chưa có tài liệu đính kèm.</span>
                </div>
              )}
            </DetailSection>

            {/* ============================================
                QUẢN LÝ NỘI BỘ
            ============================================ */}

            <DetailSection
              icon={<FaUsers />}
              title="Thông tin quản lý nội bộ"
              description="Trạng thái xử lý và phân công nhóm"
            >
              <div className="vqr-detail-grid">
                <DetailField
                  label="Trạng thái hiện tại"
                  value={status?.label}
                  important
                />

                <DetailField label="Nhóm phụ trách" value={teamName} />

                <DetailField
                  label="Ngày tạo yêu cầu"
                  value={formatDate(request.created_at, true)}
                />

                <DetailField
                  label="Người tạo (ID)"
                  value={request.created_by}
                />

                <DetailField
                  label="Thời gian phân công"
                  value={formatDate(request.assigned_at, true)}
                />

                <DetailField
                  label="Người phân công (ID)"
                  value={request.assigned_by}
                />

                <DetailField label="Ghi chú" value={request.notes} full />
              </div>
            </DetailSection>

            {/* ============================================
                SOURCE LINK
            ============================================ */}

            {request.source_url && (
              <div className="vqr-detail-source-box">
                <div>
                  <FaExternalLinkAlt />

                  <span>Liên kết yêu cầu báo giá gốc</span>
                </div>

                <a
                  href={request.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mở trang nguồn
                  <FaExternalLinkAlt />
                </a>
              </div>
            )}

            {/* ============================================
                FOOTER
            ============================================ */}

            <div className="vqr-detail-bottom-actions">
              <Button variant="outline-secondary" onClick={handleBack}>
                <FaArrowLeft className="me-2" />
                Quay trở lại
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
