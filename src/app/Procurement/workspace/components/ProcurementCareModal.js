import React, { useEffect, useState } from "react";

import { Button, Modal, Spinner } from "react-bootstrap";

import {
  FaBuilding,
  FaClipboardList,
  FaMapMarkerAlt,
  FaSave,
  FaTimes,
} from "react-icons/fa";

import APIToken from "../../../../config/APIToken";

const ProcurementCareModal = ({ show, entity, onHide, onSaved }) => {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    care_status: "NEW",

    representative_name: "",

    representative_position: "",

    phone: "",

    staff_note: "",

    next_follow_up_at: "",
  });

  // ========================================================
  // SYNC
  // ========================================================

  useEffect(() => {
    if (!entity) {
      return;
    }

    setForm({
      care_status: entity.care_status || "NEW",

      representative_name: entity.representative_name || "",

      representative_position: entity.representative_position || "",

      phone: entity.phone || "",

      staff_note: entity.staff_note || "",

      next_follow_up_at: formatDateTimeInput(entity.next_follow_up_at),
    });
  }, [entity]);

  // ========================================================
  // CHANGE
  // ========================================================

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,

      [field]: value,
    }));
  };

  // ========================================================
  // SAVE
  // ========================================================

  const handleSave = async () => {
    if (!entity?.id) {
      return;
    }

    try {
      setSaving(true);

      const response = await APIToken.put(
        `/procurement/entities/${entity.id}/care`,
        {
          care_status: form.care_status,

          representative_name: form.representative_name || null,

          representative_position: form.representative_position || null,

          phone: form.phone || null,

          staff_note: form.staff_note || null,

          next_follow_up_at: form.next_follow_up_at || null,
        },
      );

      alert(response?.data?.message || "Đã lưu thông tin chăm sóc.");

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      console.error("save procurement care error:", error);

      alert(error?.response?.data?.message || "Không thể lưu chăm sóc.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={saving ? undefined : onHide}
      centered
      size="lg"
      className="procurement-care-modal"
    >
      <Modal.Header>
        <Modal.Title>
          <FaClipboardList />
          Chăm sóc đơn vị
        </Modal.Title>

        <button
          type="button"
          className="procurement-modal-close"
          onClick={onHide}
          disabled={saving}
        >
          <FaTimes />
        </button>
      </Modal.Header>

      <Modal.Body>
        <div className="procurement-care-header">
          <div className="procurement-care-company-icon">
            <FaBuilding />
          </div>

          <div>
            <span className="procurement-care-eyebrow">
              {entity?.org_code || "ĐƠN VỊ"}
            </span>

            <h3>{entity?.organization_name || "-"}</h3>

            <p>
              <FaMapMarkerAlt />

              {entity?.address || "Chưa có địa chỉ"}
            </p>
          </div>
        </div>

        <div className="procurement-care-section">
          <div className="procurement-care-section-title">
            <FaClipboardList />
            Thông tin chăm sóc
          </div>

          <div className="procurement-care-form-grid">
            <FormGroup label="Trạng thái">
              <select
                value={form.care_status}
                onChange={(e) => handleChange("care_status", e.target.value)}
              >
                <option value="NEW">Mới nhận</option>

                <option value="CONTACTING">Đang liên hệ</option>

                <option value="CONTACTED">Đã liên hệ</option>

                <option value="INTERESTED">Có quan tâm</option>

                <option value="FOLLOW_UP">Cần theo dõi</option>

                <option value="SUCCESS">Thành công</option>

                <option value="NOT_INTERESTED">Không quan tâm</option>
              </select>
            </FormGroup>

            <FormGroup label="Người đại diện / liên hệ">
              <input
                value={form.representative_name}
                onChange={(e) =>
                  handleChange("representative_name", e.target.value)
                }
              />
            </FormGroup>

            <FormGroup label="Chức vụ">
              <input
                value={form.representative_position}
                onChange={(e) =>
                  handleChange("representative_position", e.target.value)
                }
              />
            </FormGroup>

            <FormGroup label="Số điện thoại">
              <input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </FormGroup>

            <FormGroup label="Lịch chăm sóc tiếp theo" full>
              <input
                type="datetime-local"
                value={form.next_follow_up_at}
                onChange={(e) =>
                  handleChange("next_follow_up_at", e.target.value)
                }
              />
            </FormGroup>

            <FormGroup label="Ghi chú chăm sóc" full>
              <textarea
                value={form.staff_note}
                onChange={(e) => handleChange("staff_note", e.target.value)}
                placeholder="Ví dụ: Đã gọi, dự kiến tổ chức nghỉ mát vào tháng 7..."
              />
            </FormGroup>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button
          className="procurement-modal-cancel-btn"
          onClick={onHide}
          disabled={saving}
        >
          Đóng
        </Button>

        <Button
          className="procurement-modal-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Spinner animation="border" size="sm" /> : <FaSave />}
          Lưu chăm sóc
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const FormGroup = ({ label, children, full = false }) => (
  <div className={`procurement-care-form-group ${full ? "full" : ""}`}>
    <label>{label}</label>

    {children}
  </div>
);

const formatDateTimeInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default ProcurementCareModal;
