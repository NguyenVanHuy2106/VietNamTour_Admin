import React, { useEffect, useState } from "react";

import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";

import {
  FaCalendarAlt,
  FaCheckCircle,
  FaPlus,
  FaShieldAlt,
} from "react-icons/fa";

import APIToken from "../../../config/APIToken";

import "./index.css";

const InsuranceConfig = () => {
  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const initialForm = {
    effective_from: "",
    effective_to: "",

    employee_social_rate: "0.08",
    employee_health_rate: "0.015",
    employee_unemployment_rate: "0.01",

    employer_social_rate: "0.175",
    employer_health_rate: "0.03",
    employer_unemployment_rate: "0.01",

    note: "",
  };

  const [form, setForm] = useState(initialForm);

  // ==========================================================
  // GET
  // ==========================================================

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await APIToken.get("/salary/insurance/get");

      setData(res?.data?.data || []);
    } catch (error) {
      console.error("Lỗi lấy cấu hình BH:", error);

      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================================
  // FORMAT
  // ==========================================================

  const formatDate = (value) => {
    if (!value) {
      return "---";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN");
  };

  const formatPercent = (value) => {
    return `${(Number(value || 0) * 100).toLocaleString("vi-VN", {
      maximumFractionDigits: 3,
    })}%`;
  };

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSave = async () => {
    if (!form.effective_from) {
      alert("Vui lòng nhập ngày bắt đầu áp dụng.");

      return;
    }

    try {
      setSaving(true);

      const payload = {
        effective_from: form.effective_from,

        effective_to: form.effective_to || null,

        employee_social_rate: Number(form.employee_social_rate || 0),

        employee_health_rate: Number(form.employee_health_rate || 0),

        employee_unemployment_rate: Number(
          form.employee_unemployment_rate || 0,
        ),

        employer_social_rate: Number(form.employer_social_rate || 0),

        employer_health_rate: Number(form.employer_health_rate || 0),

        employer_unemployment_rate: Number(
          form.employer_unemployment_rate || 0,
        ),

        note: form.note.trim() || null,
      };

      const res = await APIToken.post("/salary/insurance/add", payload);

      alert(res?.data?.message || "Tạo cấu hình bảo hiểm thành công.");

      setShowModal(false);

      setForm(initialForm);

      await fetchData();
    } catch (error) {
      console.error("Lỗi tạo cấu hình BH:", error);

      alert(
        error?.response?.data?.message || "Không thể tạo cấu hình bảo hiểm.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container fluid className="insurance-config-page">
      <Card className="insurance-header-card border-0">
        <Card.Body>
          <div className="insurance-heading">
            <div className="insurance-heading-icon">
              <FaShieldAlt />
            </div>

            <div>
              <h4>Cấu hình bảo hiểm</h4>

              <p>Quản lý tỷ lệ bảo hiểm áp dụng khi tính lương nhân viên</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="insurance-list-header">
        <div>
          <h5>Danh sách cấu hình bảo hiểm</h5>

          <small>Thiết lập theo từng thời kỳ áp dụng</small>
        </div>

        <Button
          className="insurance-add-btn"
          onClick={() => {
            setForm(initialForm);

            setShowModal(true);
          }}
        >
          <FaPlus />

          <span>Thêm cấu hình</span>
        </Button>
      </div>

      <Card className="insurance-table-card border-0">
        <div className="table-responsive">
          <Table hover className="insurance-table align-middle mb-0">
            <thead>
              <tr>
                <th>Hiệu lực</th>

                <th>BHXH NV</th>

                <th>BHYT NV</th>

                <th>BHTN NV</th>

                <th>BHXH Cty</th>

                <th>BHYT Cty</th>

                <th>BHTN Cty</th>

                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="insurance-empty">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="insurance-empty">
                    Chưa có cấu hình bảo hiểm.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.insurance_config_id}>
                    <td data-label="Hiệu lực">
                      <strong>{formatDate(item.effective_from)}</strong>

                      <small className="d-block text-muted">
                        đến{" "}
                        {item.effective_to
                          ? formatDate(item.effective_to)
                          : "Hiện tại"}
                      </small>
                    </td>

                    <td data-label="BHXH NV">
                      {formatPercent(item.employee_social_rate)}
                    </td>

                    <td data-label="BHYT NV">
                      {formatPercent(item.employee_health_rate)}
                    </td>

                    <td data-label="BHTN NV">
                      {formatPercent(item.employee_unemployment_rate)}
                    </td>

                    <td data-label="BHXH Cty">
                      {formatPercent(item.employer_social_rate)}
                    </td>

                    <td data-label="BHYT Cty">
                      {formatPercent(item.employer_health_rate)}
                    </td>

                    <td data-label="BHTN Cty">
                      {formatPercent(item.employer_unemployment_rate)}
                    </td>

                    <td data-label="Trạng thái">
                      {Number(item.status) === 1 ? (
                        <Badge bg="success">Đang áp dụng</Badge>
                      ) : (
                        <Badge bg="secondary">Ngừng áp dụng</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* MODAL */}

      <Modal
        show={showModal}
        onHide={() => {
          if (!saving) {
            setShowModal(false);
          }
        }}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title className="insurance-modal-title">
            <div className="insurance-modal-icon">
              <FaShieldAlt />
            </div>

            <div>
              <strong>Thêm cấu hình bảo hiểm</strong>

              <small>Nhập tỷ lệ dưới dạng số thập phân, ví dụ 0.08 = 8%</small>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="insurance-label">
                  Ngày bắt đầu
                </Form.Label>

                <InputGroup className="insurance-input">
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>

                  <Form.Control
                    type="date"
                    value={form.effective_from}
                    onChange={(e) =>
                      setForm({
                        ...form,

                        effective_from: e.target.value,
                      })
                    }
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="insurance-label">
                  Ngày kết thúc
                </Form.Label>

                <InputGroup className="insurance-input">
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>

                  <Form.Control
                    type="date"
                    value={form.effective_to}
                    onChange={(e) =>
                      setForm({
                        ...form,

                        effective_to: e.target.value,
                      })
                    }
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={12}>
              <div className="insurance-section">Người lao động đóng</div>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="insurance-label">BHXH</Form.Label>

                <Form.Control
                  type="number"
                  step="0.001"
                  value={form.employee_social_rate}
                  onChange={(e) =>
                    setForm({
                      ...form,

                      employee_social_rate: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="insurance-label">BHYT</Form.Label>

                <Form.Control
                  type="number"
                  step="0.001"
                  value={form.employee_health_rate}
                  onChange={(e) =>
                    setForm({
                      ...form,

                      employee_health_rate: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="insurance-label">BHTN</Form.Label>

                <Form.Control
                  type="number"
                  step="0.001"
                  value={form.employee_unemployment_rate}
                  onChange={(e) =>
                    setForm({
                      ...form,

                      employee_unemployment_rate: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <div className="insurance-section">Doanh nghiệp đóng</div>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="insurance-label">BHXH</Form.Label>

                <Form.Control
                  type="number"
                  step="0.001"
                  value={form.employer_social_rate}
                  onChange={(e) =>
                    setForm({
                      ...form,

                      employer_social_rate: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="insurance-label">BHYT</Form.Label>

                <Form.Control
                  type="number"
                  step="0.001"
                  value={form.employer_health_rate}
                  onChange={(e) =>
                    setForm({
                      ...form,

                      employer_health_rate: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="insurance-label">BHTN</Form.Label>

                <Form.Control
                  type="number"
                  step="0.001"
                  value={form.employer_unemployment_rate}
                  onChange={(e) =>
                    setForm({
                      ...form,

                      employer_unemployment_rate: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="insurance-label">Ghi chú</Form.Label>

                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.note}
                  onChange={(e) =>
                    setForm({
                      ...form,

                      note: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="light"
            disabled={saving}
            onClick={() => setShowModal(false)}
          >
            Hủy
          </Button>

          <Button variant="primary" disabled={saving} onClick={handleSave}>
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <FaCheckCircle className="me-2" />
                Lưu cấu hình
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InsuranceConfig;
