import React, { useEffect, useState } from "react";

import { Button, Modal, Spinner } from "react-bootstrap";

import {
  FaBuilding,
  FaEdit,
  FaMapMarkerAlt,
  FaSave,
  FaTimes,
} from "react-icons/fa";

import APIToken from "../../../../config/APIToken";

const EntityEditModal = ({ show, entity, onHide, onSaved }) => {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    organization_name: "",
    address: "",
    representative_name: "",
    representative_position: "",
    phone: "",
    tax_code: "",
  });

  // ========================================================
  // LOAD ENTITY
  // ========================================================

  useEffect(() => {
    if (!entity) {
      return;
    }

    setForm({
      organization_name: entity.organization_name || "",

      address: entity.address || "",

      representative_name: entity.representative_name || "",

      representative_position: entity.representative_position || "",

      phone: entity.phone || "",

      tax_code: entity.tax_code || "",
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

    if (!form.organization_name.trim()) {
      alert("Tên đơn vị không được để trống.");

      return;
    }

    try {
      setSaving(true);

      const response = await APIToken.put(
        `/procurement/entities/${entity.id}`,
        {
          organization_name: form.organization_name.trim(),

          address: form.address.trim() || null,

          representative_name: form.representative_name.trim() || null,

          representative_position: form.representative_position.trim() || null,

          phone: form.phone.trim() || null,

          tax_code: form.tax_code.trim() || null,
        },
      );

      alert(response?.data?.message || "Đã cập nhật dữ liệu.");

      if (onSaved) {
        await onSaved(response?.data?.data);
      }
    } catch (error) {
      console.error("update procurement entity error:", error);

      alert(error?.response?.data?.message || "Không thể cập nhật dữ liệu.");
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
          <FaEdit />
          Cập nhật dữ liệu đơn vị
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
            <FaEdit />
            Thông tin đơn vị
          </div>

          <div className="procurement-care-form-grid">
            <FormGroup label="Tên đơn vị" full>
              <input
                value={form.organization_name}
                onChange={(e) =>
                  handleChange("organization_name", e.target.value)
                }
              />
            </FormGroup>

            <FormGroup label="Địa chỉ" full>
              <textarea
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Nhập địa chỉ đơn vị..."
              />
            </FormGroup>

            <FormGroup label="Người đại diện">
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

            <FormGroup label="Mã số thuế">
              <input
                value={form.tax_code}
                onChange={(e) => handleChange("tax_code", e.target.value)}
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
          Lưu thay đổi
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

export default EntityEditModal;
