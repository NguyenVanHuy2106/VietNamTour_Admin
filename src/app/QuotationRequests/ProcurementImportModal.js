import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  Form,
  Modal,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";

import {
  FaLink,
  FaSearch,
  FaFileImport,
  FaUsers,
  FaExternalLinkAlt,
  FaFilePdf,
  FaCheckCircle,
  FaBuilding,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";

import APIToken from "../../config/APIToken";
import "./ProcurementImportModal.css";

// ========================================================
// CONFIG
// ========================================================

const IMPORT_API = "/procurement/import-from-url";
const TEAM_API = "/quotationTeam";

const EMPTY_FORM = {
  notificationId: "",
  notificationCode: "",
  notificationType: "",
  packageName: "",
  requestName: "",
  procuringEntity: "",
  publishDate: "",
  closingDate: "",
  location: "",
  quantity: "",
  unit: "",
  packagePrice: "",
  attachments: [],
  sourceUrl: "",
  quotationValidity: "",
};

// ========================================================
// HELPERS
// ========================================================

const trim = (value) => String(value ?? "").trim();

const readError = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Có lỗi xảy ra. Vui lòng thử lại.";

const getCurrentUserId = () => {
  const raw = localStorage.getItem("userId");
  const id = Number(raw);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const getFirstMatch = (text, regex) => {
  if (!text) return "";

  const match = String(text).match(regex);

  return match?.[1] ? trim(match[1]) : "";
};

// ========================================================
// FALLBACK: TRÍCH XUẤT TỪ PAGE TEXT
//
// Chỉ áp dụng khi Backend trả extractionStatus=url_only.
// Các thông tin tách bằng regex cần được người dùng kiểm tra.
//
// Không tự đoán các trường chưa có dữ liệu.
// ========================================================

const extractFromPageText = (pageText) => {
  const text = trim(pageText);

  if (!text) return {};

  const requestName = getFirstMatch(
    text,
    /Tên yêu cầu báo giá\s+([\s\S]*?)\s+Đơn vị yêu cầu báo giá/i,
  );

  const procuringEntity = getFirstMatch(
    text,
    /Đơn vị yêu cầu báo giá\s+([\s\S]*?)\s+Phân loại báo giá/i,
  );

  const publishDate = getFirstMatch(
    text,
    /Ngày đăng tải\s+(\d{2}\/\d{2}\/\d{4})/i,
  );

  const location = getFirstMatch(
    text,
    /Địa điểm thực hiện\s+([\s\S]*?)\s+Thông tin liên hệ/i,
  );

  // ============================================================
  // HẠN TIẾP NHẬN BÁO GIÁ
  // ============================================================

  const deadlineMatch = text.match(
    /Thời hạn tiếp nhận báo giá\s+(\d{1,2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/i,
  );

  let closingDate = "";

  if (deadlineMatch) {
    closingDate = `${deadlineMatch[2]} ${deadlineMatch[1]}`;
  } else {
    closingDate = getFirstMatch(
      text,
      /Thời hạn tiếp nhận báo giá\s+từ ngày\s+\d{2}\/\d{2}\/\d{4}\s+đến ngày\s+(\d{2}\/\d{2}\/\d{4})/i,
    );
  }

  // ============================================================
  // THỜI GIAN CÓ HIỆU LỰC TỐI THIỂU CỦA BÁO GIÁ
  //
  // Ví dụ:
  // 3 ngày kể từ ngày 21/11/2026
  // 30 ngày kể từ ngày 22/11/2026
  // 60 ngày kể từ thời điểm đóng báo giá
  // ============================================================

  let quotationValidity = "";

  // Trường hợp có số ngày và ngày bắt đầu cụ thể.
  const validityWithDate = text.match(
    /Thời gian có hiệu lực tối thiểu của báo giá\s*:?\s*(\d+\s+ngày\s+kể từ ngày\s+\d{1,2}\/\d{1,2}\/\d{4})/i,
  );

  if (validityWithDate) {
    quotationValidity = trim(validityWithDate[1]);
  } else {
    // Trường hợp có số ngày nhưng không ghi ngày cụ thể.
    const validityOther = text.match(
      /Thời gian có hiệu lực tối thiểu của báo giá\s*:?\s*(\d+\s+ngày(?:\s+kể từ\s+(?:thời điểm|ngày)\s+[^.\r\n]{1,100})?)/i,
    );

    if (validityOther) {
      quotationValidity = trim(validityOther[1]);
    }
  }

  return {
    requestName,
    procuringEntity,
    publishDate,
    closingDate,
    location,
    quotationValidity,
  };
};

// ========================================================
// NORMALIZE API RESPONSE
// ========================================================

const normalizeResponse = (response, inputUrl) => {
  const root = response?.data || {};

  if (root.success === false) {
    throw new Error(root.message || "Trích xuất thất bại.");
  }

  const data = root.data || {};

  // Trích xuất bổ sung từ pageText khi Backend
  // không trả đầy đủ các trường dữ liệu.
  const fallback = extractFromPageText(data.pageText);

  const form = {
    notificationId: trim(data.notificationId),
    notificationCode: trim(data.notificationCode),
    notificationType: trim(data.notificationType),

    packageName: trim(data.packageName),

    requestName: trim(data.requestName) || fallback.requestName || "",

    procuringEntity:
      trim(data.procuringEntity) || fallback.procuringEntity || "",

    publishDate: trim(data.publishDate) || fallback.publishDate || "",

    closingDate: trim(data.closingDate) || fallback.closingDate || "",

    // ============================================================
    // HIỆU LỰC TỐI THIỂU CỦA BÁO GIÁ
    // ============================================================

    quotationValidity:
      trim(data.quotationValidity) ||
      trim(data.quotation_validity) ||
      fallback.quotationValidity ||
      "",

    location: trim(data.location) || fallback.location || "",

    quantity: data.quantity ?? "",
    unit: trim(data.unit),

    packagePrice: data.packagePrice ?? "",

    attachments: Array.isArray(data.attachments) ? data.attachments : [],

    sourceUrl: data.sourceUrl || inputUrl,
  };

  return {
    form,

    extractionStatus:
      root.extractionStatus || (data.requestName ? "complete" : "unknown"),

    extractionMessage: root.message || "",

    warnings: Array.isArray(root.warnings) ? root.warnings : [],
  };
};

// ========================================================
// DATE VALIDATION
// ========================================================

const isValidVietnameseDate = (value, requireTime = false) => {
  if (!value) return false;

  const match = trim(value).match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/,
  );

  if (!match) return false;

  if (requireTime && !match[4]) {
    return false;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);

  const date = new Date(year, month - 1, day, hour, minute);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute
  );
};

// ========================================================
// COMPONENT
// ========================================================

const ProcurementImportModal = ({ show, onHide, onSaved }) => {
  // ======================================================
  // FORM
  // ======================================================

  const [url, setUrl] = useState("");

  const [form, setForm] = useState({
    ...EMPTY_FORM,
  });

  // ======================================================
  // TEAMS
  // ======================================================

  const [teams, setTeams] = useState([]);

  const [selectedTeamId, setSelectedTeamId] = useState("");

  // ======================================================
  // LOADING
  // ======================================================

  const [extracting, setExtracting] = useState(false);

  const [loadingTeams, setLoadingTeams] = useState(false);

  const [saving, setSaving] = useState(false);

  // ======================================================
  // EXTRACTION STATUS
  // ======================================================

  const [extracted, setExtracted] = useState(false);

  const [extractionStatus, setExtractionStatus] = useState("");

  const [extractionMessage, setExtractionMessage] = useState("");

  const [warnings, setWarnings] = useState([]);

  const [error, setError] = useState("");
  const [teamError, setTeamError] = useState("");
  const getError = (error) => {
    const data = error?.response?.data;

    return (
      data?.message || error?.message || "Đã xảy ra lỗi. Vui lòng thử lại."
    );
  };
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "danger",
  });

  const showToast = (message, variant = "danger") => {
    setToast({
      show: true,
      message,
      variant,
    });
  };

  // ======================================================
  // UPDATE FIELDS
  // ======================================================

  const setField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // ======================================================
  // LOAD TEAM LIST
  // ======================================================

  const loadTeams = useCallback(async () => {
    try {
      setLoadingTeams(true);
      setTeamError("");

      const response = await APIToken.get(TEAM_API);

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Không thể lấy danh sách nhóm.",
        );
      }

      const list = response.data?.data;

      if (!Array.isArray(list)) {
        throw new Error("API danh sách nhóm không trả về mảng dữ liệu.");
      }

      setTeams(list.filter((team) => Number(team.status) === 1));
    } catch (err) {
      console.error("Load quotation teams error:", err);

      setTeamError(readError(err));
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      loadTeams();
    }
  }, [show, loadTeams]);

  // ======================================================
  // SELECTED TEAM
  // ======================================================

  const selectedTeam = useMemo(
    () => teams.find((team) => String(team.team_id) === String(selectedTeamId)),
    [teams, selectedTeamId],
  );

  // ======================================================
  // RESET MODAL
  // ======================================================

  const resetForm = () => {
    setUrl("");
    setForm({ ...EMPTY_FORM });
    setSelectedTeamId("");

    setExtracted(false);
    setExtractionStatus("");
    setExtractionMessage("");
    setWarnings([]);

    setError("");
    setTeamError("");
  };

  // ======================================================
  // CLOSE MODAL
  // ======================================================

  const closeModal = () => {
    if (extracting || saving) return;

    resetForm();
    onHide?.();
  };

  // ======================================================
  // VALIDATE SOURCE URL
  // ======================================================

  const validateUrl = (input) => {
    try {
      const parsed = new URL(input);

      if (parsed.protocol !== "https:") {
        return "Đường dẫn phải sử dụng HTTPS.";
      }

      if (parsed.hostname.toLowerCase() !== "muasamcong.mof.gov.vn") {
        return "Chỉ hỗ trợ URL từ " + "muasamcong.mof.gov.vn.";
      }

      return "";
    } catch {
      return "Đường dẫn URL không hợp lệ.";
    }
  };

  // ======================================================
  // EXTRACT PROCUREMENT DATA
  //
  // POST /api/procurement/import-from-url
  // ======================================================

  const handleExtract = async () => {
    if (extracting || saving) return;

    const inputUrl = trim(url);

    if (!inputUrl) {
      setError("Vui lòng dán đường dẫn yêu cầu báo giá.");
      return;
    }

    const urlError = validateUrl(inputUrl);

    if (urlError) {
      setError(urlError);
      return;
    }

    try {
      setExtracting(true);
      setError("");

      setExtracted(false);
      setExtractionStatus("");
      setExtractionMessage("");
      setWarnings([]);
      setForm({ ...EMPTY_FORM });

      const response = await APIToken.post(IMPORT_API, {
        url: inputUrl,
      });

      const result = normalizeResponse(response, inputUrl);

      setForm(result.form);

      setExtractionStatus(result.extractionStatus);

      setExtractionMessage(result.extractionMessage);

      setWarnings(result.warnings);

      setExtracted(true);
    } catch (err) {
      showToast(getError(err), "danger");
    } finally {
      setExtracting(false);
    }
  };

  // ======================================================
  // VALIDATE BEFORE SAVE
  // ======================================================

  const validateForm = () => {
    if (!extracted) {
      return "Vui lòng trích xuất dữ liệu trước.";
    }

    if (!trim(form.notificationCode)) {
      return "Chưa có mã yêu cầu báo giá.";
    }

    if (!trim(form.requestName)) {
      return "Vui lòng nhập tên yêu cầu báo giá.";
    }

    if (!trim(form.closingDate)) {
      return "Vui lòng nhập hạn nhận báo giá.";
    }

    if (!isValidVietnameseDate(form.closingDate, true)) {
      return "Hạn nhận báo giá phải có dạng " + "DD/MM/YYYY HH:mm.";
    }

    if (trim(form.publishDate) && !isValidVietnameseDate(form.publishDate)) {
      return "Ngày đăng tải phải có dạng DD/MM/YYYY.";
    }

    if (
      form.quantity !== "" &&
      (!Number.isFinite(Number(form.quantity)) || Number(form.quantity) < 0)
    ) {
      return "Khối lượng không hợp lệ.";
    }

    if (
      form.packagePrice !== "" &&
      form.packagePrice !== null &&
      (!Number.isFinite(Number(form.packagePrice)) ||
        Number(form.packagePrice) < 0)
    ) {
      return "Giá gói thầu không hợp lệ.";
    }

    return "";
  };

  // ======================================================
  // SAVE / SEND DATA TO PARENT
  //
  // onSaved(payload) sẽ đưa dữ liệu về
  // QuotationRequests/index.js.
  //
  // Việc ghi database phụ thuộc API lưu
  // yêu cầu báo giá của hệ thống ERP.
  // ======================================================

  const handleSave = async () => {
    if (saving || extracting) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const userId = getCurrentUserId();

    if (!userId) {
      setError(
        "Không tìm thấy userId đăng nhập trong " +
          "localStorage. Vui lòng đăng nhập lại.",
      );
      return;
    }

    if (typeof onSaved !== "function") {
      setError("Chưa cấu hình chức năng lưu " + "yêu cầu báo giá ở trang cha.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        notificationId: form.notificationId || null,

        notificationCode: trim(form.notificationCode),

        notificationType: form.notificationType || "es-ycbg",

        packageName: trim(form.packageName) || null,

        requestName: trim(form.requestName),

        procuringEntity: trim(form.procuringEntity) || null,

        publishDate: trim(form.publishDate) || null,

        closingDate: trim(form.closingDate),

        location: trim(form.location) || null,

        quantity: form.quantity === "" ? null : Number(form.quantity),

        unit: trim(form.unit) || null,

        packagePrice:
          form.packagePrice === "" || form.packagePrice === null
            ? null
            : Number(form.packagePrice),

        attachments: form.attachments,

        sourceUrl: form.sourceUrl,

        team_id: selectedTeamId ? Number(selectedTeamId) : null,

        created_by: userId,

        extractionStatus,
        quotationValidity: trim(form.quotationValidity) || null,
      };

      await onSaved(payload);

      resetForm();
      onHide?.();
    } catch (err) {
      showToast(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể lưu yêu cầu báo giá.",
        "danger",
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <>
      <Modal
        show={show}
        onHide={closeModal}
        centered
        size="xl"
        backdrop={extracting || saving ? "static" : true}
        keyboard={!extracting && !saving}
        dialogClassName="pim-modal"
      >
        {/* ==================================================
          HEADER
      ================================================== */}

        <Modal.Header closeButton={!extracting && !saving}>
          <Modal.Title>
            <span className="pim-title-icon">
              <FaFileImport />
            </span>

            <span className="pim-title-content">
              <strong>Nhập yêu cầu báo giá từ Mua sắm công</strong>

              <small>
                Trích xuất thông tin và phân công nhóm kinh doanh tiếp nhận
              </small>
            </span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* ================================================
            1. ĐƯỜNG DẪN YÊU CẦU BÁO GIÁ
        ================================================ */}

          <div className="pim-section">
            <div className="pim-section-heading">
              <strong>
                <FaLink />
                1. Đường dẫn yêu cầu báo giá
              </strong>

              <span>
                Sao chép đường dẫn chi tiết từ hệ thống Mua sắm công và dán vào
                bên dưới.
              </span>
            </div>

            <div className="pim-url-row">
              <div className="pim-url-input">
                <FaLink />

                <Form.Control
                  as="textarea"
                  rows={2}
                  value={url}
                  disabled={extracting || saving}
                  placeholder={
                    "https://muasamcong.mof.gov.vn/" +
                    "web/guest/contractor-selection?..."
                  }
                  onChange={(event) => {
                    setUrl(event.target.value);

                    // Đổi link thì kết quả trích xuất cũ
                    // không còn hợp lệ.
                    setExtracted(false);
                    setForm({ ...EMPTY_FORM });
                    setExtractionStatus("");
                    setExtractionMessage("");
                    setWarnings([]);
                    setError("");
                  }}
                />
              </div>

              <div className="pim-url-actions">
                <Button
                  type="button"
                  className="pim-extract-button"
                  disabled={extracting || saving}
                  onClick={handleExtract}
                >
                  {extracting ? (
                    <>
                      <Spinner size="sm" animation="border" />
                      Đang trích xuất...
                    </>
                  ) : (
                    <>
                      <FaSearch />
                      Trích xuất dữ liệu
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* ================================================
            2. PHÂN CÔNG NHÓM
            ĐƯA LÊN TRÊN THÔNG TIN TRÍCH XUẤT
        ================================================ */}

          <div className="pim-section pim-assignment-section">
            <div className="pim-section-heading">
              <strong>
                <FaUsers />
                2. Phân công nhóm kinh doanh tiếp nhận
              </strong>

              <span>
                Có thể chọn nhóm ngay từ đầu, không cần kéo xuống cuối biểu mẫu.
              </span>
            </div>

            <Form.Group>
              <Form.Label>Nhóm kinh doanh</Form.Label>

              <Form.Select
                value={selectedTeamId}
                disabled={loadingTeams || saving}
                onChange={(event) => {
                  setSelectedTeamId(event.target.value);

                  if (error) setError("");
                }}
              >
                <option value="">
                  {loadingTeams
                    ? "Đang tải nhóm kinh doanh..."
                    : "-- Chọn nhóm kinh doanh --"}
                </option>

                {teams.map((team) => (
                  <option key={team.team_id} value={team.team_id}>
                    {team.team_code}
                    {" — "}
                    {team.team_name}
                  </option>
                ))}
              </Form.Select>

              {teamError && (
                <div className="pim-team-error">
                  <FaExclamationTriangle />
                  {teamError}

                  <button type="button" onClick={loadTeams}>
                    Thử lại
                  </button>
                </div>
              )}

              {!loadingTeams && !teamError && teams.length === 0 && (
                <div className="pim-team-help">
                  Chưa có nhóm kinh doanh đang hoạt động. Vui lòng khai báo nhóm
                  trước.
                </div>
              )}

              {selectedTeam && (
                <div className="pim-team-selected">
                  <FaCheckCircle />

                  <span>
                    Nhóm tiếp nhận: <strong>{selectedTeam.team_name}</strong>
                  </span>
                </div>
              )}
            </Form.Group>
          </div>

          {/* ================================================
            ERROR
        ================================================ */}

          {/* ================================================
            3. THÔNG TIN SAU TRÍCH XUẤT
        ================================================ */}

          {extracted ? (
            <>
              {/* EXTRACTION STATUS */}

              <Alert
                variant={
                  extractionStatus === "url_only" ? "warning" : "success"
                }
                className="pim-alert pim-extraction-alert"
              >
                {extractionStatus === "url_only" ? (
                  <>
                    <FaInfoCircle className="me-2" />
                    <strong>Dữ liệu trích xuất chưa hoàn chỉnh.</strong> Backend
                    mới nhận diện URL. Một số thông tin được tách từ nội dung
                    trang web. Bạn cần kiểm tra và bổ sung trước khi lưu.
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="me-2" />
                    {extractionMessage || "Đã trích xuất dữ liệu thành công."}
                  </>
                )}
              </Alert>

              {/* WARNINGS */}

              {warnings.map((warning, index) => (
                <Alert variant="warning" className="pim-alert" key={index}>
                  {typeof warning === "string"
                    ? warning
                    : JSON.stringify(warning)}
                </Alert>
              ))}

              {/* BASIC INFORMATION */}

              <div className="pim-section">
                <div className="pim-section-heading">
                  <strong>
                    <FaFileImport />
                    3. Thông tin yêu cầu báo giá
                  </strong>

                  <span>
                    Dữ liệu tự động điền từ Mua sắm công. Bạn có thể kiểm tra và
                    chỉnh sửa.
                  </span>
                </div>

                <div className="pim-form-grid">
                  {/* NOTIFICATION CODE */}

                  <Form.Group>
                    <Form.Label>
                      Mã yêu cầu báo giá <em>*</em>
                    </Form.Label>

                    <Form.Control
                      value={form.notificationCode}
                      placeholder="RQ2600104558"
                      onChange={(event) =>
                        setField("notificationCode", event.target.value)
                      }
                    />
                  </Form.Group>

                  {/* TYPE */}

                  <Form.Group>
                    <Form.Label>Loại thông báo</Form.Label>

                    <Form.Control
                      value={form.notificationType}
                      placeholder="es-ycbg"
                      onChange={(event) =>
                        setField("notificationType", event.target.value)
                      }
                    />
                  </Form.Group>

                  {/* REQUEST NAME */}

                  <Form.Group className="pim-span-2">
                    <Form.Label>
                      Tên yêu cầu báo giá <em>*</em>
                    </Form.Label>

                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={form.requestName}
                      placeholder="Tên yêu cầu báo giá..."
                      onChange={(event) =>
                        setField("requestName", event.target.value)
                      }
                    />
                  </Form.Group>

                  {/* ENTITY */}

                  <Form.Group className="pim-span-2">
                    <Form.Label>Đơn vị yêu cầu báo giá</Form.Label>

                    <Form.Control
                      value={form.procuringEntity}
                      placeholder="Tên đơn vị..."
                      onChange={(event) =>
                        setField("procuringEntity", event.target.value)
                      }
                    />
                  </Form.Group>

                  {/* PACKAGE NAME */}

                  <Form.Group className="pim-span-2">
                    <Form.Label>Tên gói thầu</Form.Label>

                    <Form.Control
                      value={form.packageName}
                      placeholder="Chưa có thông tin"
                      onChange={(event) =>
                        setField("packageName", event.target.value)
                      }
                    />
                  </Form.Group>

                  {/* PUBLISH DATE */}

                  <Form.Group>
                    <Form.Label>Ngày đăng tải</Form.Label>

                    <Form.Control
                      value={form.publishDate}
                      placeholder="DD/MM/YYYY"
                      onChange={(event) =>
                        setField("publishDate", event.target.value)
                      }
                    />
                  </Form.Group>

                  {/* DEADLINE */}

                  <Form.Group>
                    <Form.Label>
                      Thời hạn nhận báo giá <em>*</em>
                    </Form.Label>

                    <Form.Control
                      value={form.closingDate}
                      placeholder="DD/MM/YYYY HH:mm"
                      onChange={(event) =>
                        setField("closingDate", event.target.value)
                      }
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Thời gian có hiệu lực tối thiểu của báo giá
                    </Form.Label>

                    <Form.Control
                      type="text"
                      maxLength={255}
                      value={form.quotationValidity || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          quotationValidity: e.target.value,
                        }))
                      }
                      placeholder="Ví dụ: 3 ngày kể từ ngày 21/11/2026"
                    />
                  </Form.Group>

                  {/* LOCATION */}

                  <Form.Group className="pim-span-2">
                    <Form.Label>Địa điểm thực hiện</Form.Label>

                    <Form.Control
                      value={form.location}
                      placeholder="Ví dụ: Tỉnh An Giang"
                      onChange={(event) =>
                        setField("location", event.target.value)
                      }
                    />
                  </Form.Group>

                  {/* QUANTITY */}

                  <Form.Group>
                    <Form.Label>Khối lượng</Form.Label>

                    <Form.Control
                      type="number"
                      min="0"
                      value={form.quantity}
                      placeholder="Ví dụ: 1"
                      onChange={(event) =>
                        setField("quantity", event.target.value)
                      }
                    />
                  </Form.Group>

                  {/* UNIT */}

                  <Form.Group>
                    <Form.Label>Đơn vị tính</Form.Label>

                    <Form.Control
                      value={form.unit}
                      placeholder="Ví dụ: gói"
                      onChange={(event) => setField("unit", event.target.value)}
                    />
                  </Form.Group>

                  {/* PACKAGE PRICE */}

                  <Form.Group className="pim-span-2">
                    <Form.Label>Giá gói thầu (VNĐ)</Form.Label>

                    <Form.Control
                      type="number"
                      min="0"
                      value={form.packagePrice}
                      placeholder="Chưa công bố"
                      onChange={(event) =>
                        setField("packagePrice", event.target.value)
                      }
                    />
                  </Form.Group>
                </div>

                {/* ATTACHMENTS */}

                <div className="pim-attachments">
                  <strong>
                    <FaFilePdf />
                    Tài liệu đính kèm
                  </strong>

                  {form.attachments.length > 0 ? (
                    form.attachments.map((file, index) => (
                      <div
                        className="pim-file"
                        key={`${file.fileName || "file"}-${index}`}
                      >
                        <FaFilePdf />

                        <span>{file.fileName || "Tài liệu"}</span>

                        {file.downloadUrl ? (
                          <a
                            href={file.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Tải tài liệu
                          </a>
                        ) : (
                          <small>Chưa có link tải</small>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>Chưa trích xuất được tài liệu đính kèm.</p>
                  )}
                </div>

                {/* SOURCE URL */}

                {form.sourceUrl && (
                  <a
                    className="pim-source"
                    href={form.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaExternalLinkAlt />
                    Mở yêu cầu báo giá gốc
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="pim-empty">
              {extracting ? (
                <>
                  <Spinner animation="border" />
                  <strong>Đang trích xuất thông tin...</strong>
                  <span>Hệ thống đang xử lý đường dẫn Mua sắm công.</span>
                </>
              ) : (
                <>
                  <FaFileImport />

                  <strong>Chưa có dữ liệu trích xuất</strong>

                  <span>
                    Dán đường dẫn Mua sắm công, chọn nhóm tiếp nhận và bấm Trích
                    xuất dữ liệu.
                  </span>
                </>
              )}
            </div>
          )}
        </Modal.Body>

        {/* ==================================================
          FOOTER
      ================================================== */}

        <Modal.Footer>
          <Button
            type="button"
            className="pim-cancel-button"
            disabled={extracting || saving}
            onClick={closeModal}
          >
            Hủy
          </Button>

          <Button
            type="button"
            className="pim-save-button"
            disabled={!extracted || extracting || saving}
            onClick={handleSave}
          >
            {saving ? (
              <>
                <Spinner size="sm" animation="border" />
                Đang lưu...
              </>
            ) : (
              <>
                <FaCheckCircle />
                Thêm vào hệ thống báo giá
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer position="top-end" className="pim-toast-container">
        <Toast
          show={toast.show}
          onClose={() =>
            setToast((prev) => ({
              ...prev,
              show: false,
            }))
          }
          autohide
          delay={3000}
          className={`pim-toast pim-toast-${toast.variant}`}
        >
          <Toast.Body>
            <div className="pim-toast-content">
              {toast.variant === "danger" ? (
                <FaExclamationTriangle className="pim-toast-icon" />
              ) : (
                <FaCheckCircle className="pim-toast-icon" />
              )}

              <div className="pim-toast-text">
                <strong>
                  {toast.variant === "danger"
                    ? "Không thành công"
                    : "Thành công"}
                </strong>

                <span>{toast.message}</span>
              </div>

              <button
                type="button"
                className="pim-toast-close"
                onClick={() =>
                  setToast((prev) => ({
                    ...prev,
                    show: false,
                  }))
                }
              >
                ×
              </button>
            </div>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default ProcurementImportModal;
