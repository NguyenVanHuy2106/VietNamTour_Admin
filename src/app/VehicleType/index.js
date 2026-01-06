import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";
import { FaPlus, FaBus } from "react-icons/fa";
import { CiTrash, CiEdit } from "react-icons/ci";
import {
  Button,
  Modal,
  Form,
  Spinner,
  Toast,
  ToastContainer,
  Badge,
  InputGroup,
} from "react-bootstrap";
import ImageUploader from "../../components/ImageUploader";
import ImageCDNCloud from "../../components/ImageCDNCloud";
import "./index.css";

const VehicleType = () => {
  const [dataVehicleType, setDataVehicleType] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 8;

  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [tFVehicleTypeValue, setTFVehicleTypeValue] = useState("");
  const [tFDesValue, setTFDesValue] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState("");

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [openModalDelete, setOpenModalDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/vehicleType/get");
      setDataVehicleType(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setTFVehicleTypeValue("");
    setTFDesValue("");
    setImageLink("");
    setIsError(false);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setCurrentId(item.vehicletypeid);
    setTFVehicleTypeValue(item.vehicletypename);
    setTFDesValue(item.description);
    setImageLink(item.vehicletypeicon);
    setIsError(false);
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (tFVehicleTypeValue.trim().length === 0) {
      setError("Vui lòng nhập tên loại phương tiện");
      setIsError(true);
      return;
    }
    try {
      setLoading(true);
      const payload = {
        vehicletypename: tFVehicleTypeValue,
        vehicletypeicon: imageLink,
        description: tFDesValue,
        created_by: userId,
      };

      let response;
      if (editMode) {
        response = await APIToken.put(
          `/vehicleType/update/${currentId}`,
          payload
        );
      } else {
        response = await APIToken.post("/vehicleType/add", payload);
      }

      if (response.status === 200 || response.status === 201) {
        setAlertMessage(
          editMode ? "Cập nhật thành công ✨" : "Thêm mới thành công ✨"
        );
        setSuccessAlertOpen(true);
        setOpenModal(false);
        getData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModalDelete = (id) => {
    setDeleteId(id);
    setOpenModalDelete(true);
  };

  const handleAgreeDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/vehicleType/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xoá dữ liệu thành công");
        setSuccessAlertOpen(true);
        getData();
      }
    } finally {
      setLoading(false);
      setOpenModalDelete(false);
    }
  };

  const filteredData = dataVehicleType.filter((item) =>
    item.vehicletypename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="vt-container">
      {/* Header */}
      <div className="vt-header">
        <div className="vt-header-info">
          <h2>Loại Phương Tiện</h2>
          <p>
            Quản lý các phương tiện vận chuyển (Xe khách, Máy bay, Tàu hỏa...)
          </p>
        </div>
        <div className="vt-header-actions">
          <InputGroup className="vt-search-bar">
            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm phương tiện..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </InputGroup>
          <Button
            variant="primary"
            className="vt-btn-add"
            onClick={handleOpenAdd}
          >
            <FaPlus /> <span>Thêm mới</span>
          </Button>
        </div>
      </div>

      {/* Content Card */}
      <div className="vt-content-card">
        <div className="table-responsive">
          <table className="vt-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Icon</th>
                <th>Loại Phương Tiện</th>
                <th>Mô tả</th>
                <th>Ngày tạo</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.vehicletypeid}>
                    <td>
                      <span className="vt-id-label">#{item.vehicletypeid}</span>
                    </td>
                    <td>
                      <div className="vt-img-container">
                        {item.vehicletypeicon ? (
                          <img
                            src={item.vehicletypeicon}
                            alt="icon"
                            className="vt-icon-img"
                          />
                        ) : (
                          <FaBus color="#adb5bd" size={20} />
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="fw-bold">{item.vehicletypename}</span>
                    </td>
                    <td className="vt-desc-text">
                      {item.description || "---"}
                    </td>
                    <td>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("vi-VN")
                        : "---"}
                    </td>
                    <td>
                      <div className="vt-actions">
                        <button
                          className="vt-action-btn edit"
                          onClick={() => handleOpenEdit(item)}
                          disabled={true}
                        >
                          <CiEdit size={20} />
                        </button>
                        <button
                          className="vt-action-btn delete"
                          onClick={() =>
                            handleOpenModalDelete(item.vehicletypeid)
                          }
                        >
                          <CiTrash size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="vt-pagination">
          <span className="text-muted small">
            Tổng: {filteredData.length} kết quả
          </span>
          <div className="vt-page-nav">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((v) => v - 1)}
            >
              <BsCaretLeft />
            </button>
            <button className="vt-page-current">{currentPage}</button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((v) => v + 1)}
            >
              <BsCaretRight />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add/Edit */}
      <Modal show={openModal} onHide={() => setOpenModal(false)} centered>
        <Modal.Header closeButton className="border-0 px-4 pt-4">
          <Modal.Title className="fw-bold">
            {editMode ? "Cập Nhật Phương Tiện" : "Thêm Phương Tiện Mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Tên loại phương tiện</Form.Label>
              <Form.Control
                value={tFVehicleTypeValue}
                onChange={(e) => setTFVehicleTypeValue(e.target.value)}
                isInvalid={isError}
              />
              <Form.Control.Feedback type="invalid">
                {error}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={tFDesValue}
                onChange={(e) => setTFDesValue(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold d-block">Icon đại diện</Form.Label>
              <ImageCDNCloud onUploadSuccess={(url) => setImageLink(url)} />
              {imageLink && (
                <div className="mt-2 text-center border rounded p-2">
                  <img
                    src={imageLink}
                    alt="Preview"
                    style={{ height: "60px", objectFit: "contain" }}
                  />
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pb-4">
          <Button variant="light" onClick={() => setOpenModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Lưu thay đổi"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Xóa */}
      <Modal
        show={openModalDelete}
        onHide={() => setOpenModalDelete(false)}
        centered
        size="sm"
      >
        <div className="p-4 text-center">
          <CiTrash size={50} color="#e63757" />
          <h5 className="mt-3 fw-bold">Xác nhận xóa?</h5>
          <div className="d-flex gap-2 justify-content-center mt-4">
            <Button variant="light" onClick={() => setOpenModalDelete(false)}>
              Đóng
            </Button>
            <Button variant="danger" onClick={handleAgreeDelete}>
              Xóa
            </Button>
          </div>
        </div>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast
          bg="success"
          show={successAlertOpen}
          onClose={() => setSuccessAlertOpen(false)}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white fw-bold">{alertMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default VehicleType;
