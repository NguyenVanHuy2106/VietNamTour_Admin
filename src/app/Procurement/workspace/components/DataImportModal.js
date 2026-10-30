import React, { useState } from "react";

import { Button, Modal, Spinner } from "react-bootstrap";

import {
  FaCheckCircle,
  FaCloudUploadAlt,
  FaDatabase,
  FaTimes,
} from "react-icons/fa";

import APIToken from "../../../../config/APIToken";

const DataImportModal = ({ show, onHide, onCompleted }) => {
  const [rawText, setRawText] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (!rawText.trim()) {
      alert("Vui lòng paste JSON.");

      return;
    }

    try {
      setLoading(true);

      setResult(null);

      const response = await APIToken.post("/procurement/import", {
        raw_text: rawText.trim(),
      });

      setResult(response?.data?.data || null);

      if (onCompleted) {
        await onCompleted();
      }
    } catch (error) {
      console.error("procurement import error:", error);

      alert(error?.response?.data?.message || "Không thể import dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    setResult(null);

    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="lg"
      className="procurement-data-modal"
    >
      <Modal.Header>
        <Modal.Title>
          <FaCloudUploadAlt />
          Import dữ liệu Mua sắm công
        </Modal.Title>

        <button
          type="button"
          className="procurement-modal-close"
          onClick={handleClose}
        >
          <FaTimes />
        </button>
      </Modal.Header>

      <Modal.Body>
        <div className="procurement-data-status">
          <div className="procurement-data-status-icon">
            <FaDatabase />
          </div>

          <div>
            <span>NGUỒN DỮ LIỆU</span>

            <strong>Mua sắm công</strong>
          </div>
        </div>

        <textarea
          className="procurement-data-textarea"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`Paste nguyên JSON vào đây...\n\n{\n  "ebidOrgInfos": {\n    "content": [...]\n  }\n}`}
          disabled={loading}
        />

        {loading && (
          <div className="procurement-data-loading">
            <Spinner animation="border" />

            <div>Đang phân tích và lưu dữ liệu...</div>
          </div>
        )}

        {result && (
          <>
            <div className="procurement-data-completed">
              <FaCheckCircle />

              <div>
                <strong>Import hoàn tất</strong>

                <span>
                  Dữ liệu đã được phân tích và kiểm tra trùng mã định danh.
                </span>
              </div>
            </div>

            <div className="procurement-data-result-grid">
              <Result label="Tổng" value={result.total} />

              <Result label="Thêm mới" value={result.inserted} />

              <Result label="Trùng" value={result.duplicates} />

              <Result label="Bỏ qua" value={result.skipped} />

              <Result label="Lỗi" value={result.errors} />
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          className="procurement-modal-cancel-btn"
          onClick={handleClose}
          disabled={loading}
        >
          Đóng
        </Button>

        <Button
          className="procurement-modal-save-btn"
          onClick={handleImport}
          disabled={loading || !rawText.trim()}
        >
          {loading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <FaCloudUploadAlt />
          )}
          PHÂN TÍCH & LƯU
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const Result = ({ label, value }) => (
  <div className="procurement-data-result-item">
    <span>{label}</span>

    <strong>{value || 0}</strong>
  </div>
);

export default DataImportModal;
