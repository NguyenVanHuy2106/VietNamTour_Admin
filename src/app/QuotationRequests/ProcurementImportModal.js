import React, { useCallback, useEffect, useRef, useState } from "react";

import { Alert, Button, Modal, Spinner, ProgressBar } from "react-bootstrap";

import {
  FaFilePdf,
  FaFileImport,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCloudUploadAlt,
  FaDatabase,
} from "react-icons/fa";

import APIToken from "../../config/APIToken";

import "./ProcurementImportModal.css";

// ==========================================================
// VIET NAM TOUR ERP - AUTO IMPORT QUOTATION PDF
//
// CHỌN PDF
//   -> POST /quotationRequest/import-from-pdf
//   -> Nhận JSON
//   -> POST /quotationRequest/save-import
//   -> Lưu database
//   -> Đóng Modal
//   -> onSaved() để parent hiện Toast
//
// Không cần nút Phân tích / Lưu.
// ==========================================================

const IMPORT_API = "/quotationRequest/import-from-pdf";
const SAVE_API = "/quotationRequest/save-import";

const MAX_FILE_SIZE = 15 * 1024 * 1024;

// ==========================================================
// HELPERS
// ==========================================================

const getError = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Đã xảy ra lỗi. Vui lòng thử lại."
  );
};

const formatDate = (value) => {
  if (!value) return "—";

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  return String(value);
};

const formatSize = (bytes) => {
  if (!bytes) return "0 KB";

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const validatePdf = (file) => {
  if (!file) {
    throw new Error("Vui lòng chọn file PDF.");
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Chỉ hỗ trợ file định dạng PDF.");
  }

  if (file.type && file.type !== "application/pdf") {
    throw new Error("File tải lên không phải PDF hợp lệ.");
  }

  if (file.size === 0) {
    throw new Error("File PDF đang rỗng.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Dung lượng PDF không được vượt quá 15 MB.");
  }
};

const validateExtractedData = (data) => {
  if (!data || typeof data !== "object") {
    throw new Error("API đọc PDF không trả về dữ liệu hợp lệ.");
  }

  if (!String(data.request_name || "").trim()) {
    throw new Error(
      "PDF chưa trích xuất được tên yêu cầu báo giá. " +
        "Vui lòng kiểm tra file hoặc tạo yêu cầu thủ công.",
    );
  }

  if (!String(data.procuring_entity || "").trim()) {
    throw new Error(
      "PDF chưa trích xuất được đơn vị yêu cầu báo giá. " +
        "Vui lòng kiểm tra file hoặc tạo yêu cầu thủ công.",
    );
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error(
      "PDF chưa trích xuất được danh mục dịch vụ. " +
        "Vui lòng kiểm tra file hoặc tạo yêu cầu thủ công.",
    );
  }

  const invalidItem = data.items.find(
    (item) => !String(item.item_name || "").trim(),
  );

  if (invalidItem) {
    throw new Error(
      "Có hạng mục dịch vụ chưa xác định được tên. " + "Vui lòng kiểm tra PDF.",
    );
  }
};

// ==========================================================
// POST MULTIPART
// ==========================================================

const uploadFormData = async (url, formData) => {
  const response = await APIToken.post(url, formData, {
    // Axios sẽ xử lý FormData/multipart.
    // Không truyền JSON string thay cho File.
    headers: {
      "Content-Type": "multipart/form-data",
    },

    timeout: 120000,
  });

  return response.data;
};

// ==========================================================
// COMPONENT
// ==========================================================

export default function ProcurementImportModal({
  show,
  onHide,
  onSaved,
  mode = "web-admin",
  teamId = null,
}) {
  const isTeamAdmin = mode === "team-admin";

  const inputRef = useRef(null);
  const busyRef = useRef(false);

  const [file, setFile] = useState(null);
  const [stage, setStage] = useState("IDLE");

  const [preview, setPreview] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [error, setError] = useState("");

  // ========================================================
  // RESET
  // ========================================================

  const reset = useCallback(() => {
    setFile(null);
    setStage("IDLE");
    setPreview(null);
    setWarnings([]);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    if (!show && !busyRef.current) {
      reset();
    }
  }, [show, reset]);

  const processing = stage === "READING" || stage === "SAVING";

  // ========================================================
  // AUTO IMPORT
  // ========================================================

  const handleSelectPdf = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    // Khóa đồng bộ để tránh gọi API trùng khi double click.
    if (busyRef.current) return;

    try {
      validatePdf(selectedFile);

      if (isTeamAdmin && !teamId) {
        throw new Error(
          "Không xác định được nhóm của Admin nhóm. " +
            "Vui lòng tải lại trang.",
        );
      }
    } catch (err) {
      setError(getError(err));

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    busyRef.current = true;

    setFile(selectedFile);
    setPreview(null);
    setWarnings([]);
    setError("");

    // ======================================================
    // BƯỚC 1: ĐỌC PDF
    // ======================================================

    setStage("READING");

    let extractedData = null;

    try {
      const importForm = new FormData();

      // QUAN TRỌNG:
      // Backend Multer đọc req.file từ field "file".
      importForm.append("file", selectedFile, selectedFile.name);

      const importResult = await uploadFormData(IMPORT_API, importForm);

      if (importResult?.success !== true || !importResult?.data) {
        throw new Error(
          importResult?.message || "Không thể trích xuất dữ liệu từ PDF.",
        );
      }

      extractedData = importResult.data;

      // Load dữ liệu vừa đọc lên Modal.
      setPreview(extractedData);

      setWarnings(
        Array.isArray(importResult.warnings) ? importResult.warnings : [],
      );

      // Không lưu PDF nếu thiếu dữ liệu bắt buộc.
      validateExtractedData(extractedData);

      // ====================================================
      // BƯỚC 2: TỰ ĐỘNG LƯU DATABASE
      // ====================================================

      setStage("SAVING");

      const payload = {
        ...extractedData,

        // Giữ nguyên các trường ngày từ API parser:
        // reception_start_date: YYYY-MM-DD
        // reception_end_date:   YYYY-MM-DD
        // execution_date:       YYYY-MM-DD
        // closing_date:         ISO hoặc null

        // Không tự đoán giờ đóng báo giá.
        closing_date: extractedData.closing_date || null,

        // Chuẩn hóa lại item_no.
        items: extractedData.items.map((item, index) => ({
          ...item,
          item_no: index + 1,
        })),

        // Admin web: chưa phân nhóm.
        // Admin nhóm: gửi ID để tham chiếu.
        // Backend bắt buộc xác minh lại role và team.
        team_id: isTeamAdmin ? Number(teamId) : null,
      };

      const saveForm = new FormData();

      // PDF gốc được gửi lại để lưu attachment.
      saveForm.append("file", selectedFile, selectedFile.name);

      // JSON từ API đọc PDF.
      saveForm.append("data", JSON.stringify(payload));

      const saveResult = await uploadFormData(SAVE_API, saveForm);

      if (saveResult?.success !== true || saveResult?.saved !== true) {
        throw new Error(
          saveResult?.message || "Không thể lưu yêu cầu báo giá.",
        );
      }

      // ====================================================
      // HOÀN TẤT
      // ====================================================

      setStage("SUCCESS");

      const savedRequest = saveResult.data;

      // Đóng Modal.
      onHide?.();

      // Thông báo cho trang cha để:
      // - Hiển thị Toast góc trên bên phải
      // - Tải lại danh sách và thống kê.
      //
      // Không gọi API thêm mới nào khác ở đây.
      if (typeof onSaved === "function") {
        try {
          await onSaved(savedRequest);
        } catch (refreshError) {
          // DB đã lưu thành công, nên lỗi refresh
          // không được báo thành lỗi import.
          console.error("[QUOTATION_REFRESH_ERROR]", refreshError);
        }
      }

      reset();
    } catch (err) {
      console.error("[QUOTATION_AUTO_IMPORT_ERROR]", err);

      setError(getError(err));
      setStage("ERROR");
    } finally {
      busyRef.current = false;
    }
  };

  // ========================================================
  // CLOSE
  // ========================================================

  const handleClose = () => {
    if (busyRef.current) return;

    reset();
    onHide?.();
  };

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      dialogClassName="pim-modal"
      backdrop={processing ? "static" : true}
      keyboard={!processing}
    >
      <Modal.Header closeButton={!processing}>
        <Modal.Title>
          <FaFileImport className="me-2" />
          Import yêu cầu báo giá từ PDF
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* ==============================================
            INTRO
        ============================================== */}

        <div className="pim-section">
          <div className="pim-section-heading">
            <strong>
              <FaCloudUploadAlt className="me-2" />
              Tải tài liệu yêu cầu báo giá
            </strong>

            <span>
              Chọn PDF để hệ thống tự động đọc dữ liệu và lưu yêu cầu báo giá.
            </span>
          </div>

          {isTeamAdmin ? (
            <Alert variant="info">
              <FaDatabase className="me-2" />
              Yêu cầu mới sẽ được phân về nhóm của bạn (ID: {teamId || "—"}).
            </Alert>
          ) : (
            <Alert variant="info">
              <FaDatabase className="me-2" />
              Yêu cầu mới sẽ được tạo ở trạng thái chưa phân nhóm. Admin có thể
              phân công sau.
            </Alert>
          )}

          {/* INPUT FILE */}

          <FormPdfInput
            inputRef={inputRef}
            disabled={processing}
            onChange={handleSelectPdf}
          />

          {file && (
            <div className="mt-3">
              <div className="d-flex align-items-center gap-2">
                <FaFilePdf style={{ color: "#d84d4d" }} />

                <strong
                  style={{
                    fontSize: 12,
                    overflowWrap: "anywhere",
                  }}
                >
                  {file.name}
                </strong>
              </div>

              <small className="text-muted">{formatSize(file.size)}</small>
            </div>
          )}
        </div>

        {/* ==============================================
            PROCESSING
        ============================================== */}

        {processing && (
          <div className="pim-section">
            <div className="d-flex align-items-center gap-3 mb-3">
              <Spinner
                animation="border"
                size="sm"
                style={{ color: "#1D61AD" }}
              />

              <div>
                <strong>
                  {stage === "READING"
                    ? "Đang phân tích file PDF..."
                    : "Đang lưu vào database..."}
                </strong>

                <div className="text-muted small mt-1">
                  {stage === "READING"
                    ? "Đang trích xuất thông tin yêu cầu báo giá."
                    : "Đã đọc PDF. Đang tạo yêu cầu và lưu tài liệu."}
                </div>
              </div>
            </div>

            <ProgressBar
              now={stage === "READING" ? 40 : 85}
              animated
              style={{ height: 7 }}
            />

            <small className="text-muted d-block mt-2">
              {stage === "READING"
                ? "Bước 1/2: Đọc dữ liệu"
                : "Bước 2/2: Lưu dữ liệu"}
            </small>
          </div>
        )}

        {/* ==============================================
            PREVIEW DURING SAVE
        ============================================== */}

        {preview && (
          <div className="pim-section">
            <div className="pim-section-heading">
              <strong>
                <FaCheckCircle className="me-2" />
                Dữ liệu đã trích xuất
              </strong>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="text-muted small">Mã yêu cầu báo giá</div>

                <strong>{preview.notification_code || "—"}</strong>
              </div>

              <div className="col-md-6">
                <div className="text-muted small">Đơn vị yêu cầu</div>

                <strong>{preview.procuring_entity || "—"}</strong>
              </div>

              <div className="col-12">
                <div className="text-muted small">Tên yêu cầu báo giá</div>

                <strong>{preview.request_name || "—"}</strong>
              </div>

              <div className="col-md-6">
                <div className="text-muted small">Hạn tiếp nhận báo giá</div>

                <strong>{formatDate(preview.reception_end_date)}</strong>
              </div>

              <div className="col-md-6">
                <div className="text-muted small">Số hạng mục</div>

                <strong>{preview.items?.length || 0}</strong>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
            WARNINGS
        ============================================== */}

        {warnings.length > 0 && stage === "ERROR" && (
          <Alert variant="warning">
            <FaExclamationTriangle className="me-2" />

            {warnings.map((warning, index) => (
              <div key={index}>
                {typeof warning === "string"
                  ? warning
                  : JSON.stringify(warning)}
              </div>
            ))}
          </Alert>
        )}

        {/* ==============================================
            ERROR
        ============================================== */}

        {error && (
          <Alert variant="danger">
            <FaExclamationTriangle className="me-2" />

            {error}

            <div className="mt-2 small">
              Bạn có thể chọn lại PDF để thử lại.
            </div>
          </Alert>
        )}

        {stage === "IDLE" && (
          <div className="pim-empty">
            <FaFilePdf />

            <strong>Chưa có tài liệu</strong>

            <span>
              Chọn PDF, hệ thống sẽ tự động xử lý và lưu vào cơ sở dữ liệu.
            </span>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={handleClose}
          disabled={processing}
        >
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ==========================================================
// FILE INPUT
// ==========================================================

function FormPdfInput({ inputRef, disabled, onChange }) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept=".pdf,application/pdf"
      className="form-control"
      disabled={disabled}
      onChange={onChange}
    />
  );
}
