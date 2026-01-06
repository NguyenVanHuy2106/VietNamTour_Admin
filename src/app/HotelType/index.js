import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";
import { FaPlus, FaHotel } from "react-icons/fa";
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
import "./index.css";

const HotelType = () => {
  const [dataHotelType, setDataHotelType] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 8;

  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [tFHotelTypeValue, setTFHotelTypeValue] = useState("");
  const [tFDesValue, setTFDesValue] = useState("");
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
      const response = await API.get("/hotelType/get");
      setDataHotelType(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setTFHotelTypeValue("");
    setTFDesValue("");
    setIsError(false);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setCurrentId(item.hoteltypeid);
    setTFHotelTypeValue(item.hoteltypename);
    setTFDesValue(item.description);
    setIsError(false);
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (tFHotelTypeValue.trim().length === 0) {
      setError("Vui lòng nhập tên loại nơi ở");
      setIsError(true);
      return;
    }
    try {
      setLoading(true);
      const payload = {
        hoteltypename: tFHotelTypeValue,
        description: tFDesValue,
        created_by: userId,
      };
      let response;
      if (editMode) {
        response = await APIToken.put(
          `/hotelType/update/${currentId}`,
          payload
        );
      } else {
        response = await APIToken.post("/hotelType/add", payload);
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

  // Thêm hàm này vào trước phần return nếu nó chưa có hoặc bị sai tên
  const handleOpenModalDelete = (id) => {
    setDeleteId(id); // Lưu ID cần xóa
    setOpenModalDelete(true); // Mở Modal xác nhận
  };

  const handleAgreeDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/hotelType/delete/${deleteId}`);
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

  const filteredData = dataHotelType.filter((item) =>
    item.hoteltypename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="ht-container">
      {/* Header */}
      <div className="ht-header">
        <div className="ht-header-info">
          <h2>Loại Nơi Ở</h2>
          <p>Quản lý các loại hình lưu trú (Khách sạn, Resort, Homestay...)</p>
        </div>
        <div className="ht-header-actions">
          <InputGroup className="ht-search-bar">
            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm loại nơi ở..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </InputGroup>
          <Button
            variant="primary"
            className="ht-btn-add"
            onClick={handleOpenAdd}
          >
            <FaPlus /> <span>Thêm mới</span>
          </Button>
        </div>
      </div>

      {/* Content Card */}
      <div className="ht-content-card">
        <div className="table-responsive">
          <table className="ht-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Loại Nơi Ở</th>
                <th>Mô tả</th>
                <th>Người tạo</th>
                <th>Ngày tạo</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.hoteltypeid}>
                    <td>
                      <span className="ht-id-label">#{item.hoteltypeid}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="ht-icon-box">
                          <FaHotel />
                        </div>
                        <span className="ms-2 fw-bold">
                          {item.hoteltypename}
                        </span>
                      </div>
                    </td>
                    <td className="ht-desc-text">
                      {item.description || "---"}
                    </td>
                    <td>
                      <span className="ht-user-tag">
                        {item.created_by || "Admin"}
                      </span>
                    </td>
                    <td>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("vi-VN")
                        : "---"}
                    </td>
                    <td>
                      <div className="ht-actions">
                        <button
                          className="ht-action-btn edit"
                          onClick={() => handleOpenEdit(item)}
                          disabled={true} // Ví dụ disable khi đang loading
                        >
                          <CiEdit size={20} />
                        </button>
                        <button
                          className="ht-action-btn delete"
                          onClick={() =>
                            handleOpenModalDelete(item.hoteltypeid)
                          } // Đảm bảo tên này khớp với tên hàm bên dưới
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
                    Không có dữ liệu loại nơi ở
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="ht-pagination">
          <span className="text-muted">
            Trang {currentPage} / {totalPages || 1}
          </span>
          <div className="ht-page-nav">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((v) => v - 1)}
            >
              <BsCaretLeft />
            </button>
            <button className="ht-page-current">{currentPage}</button>
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
            {editMode ? "Cập Nhật Loại Nơi Ở" : "Thêm Loại Nơi Ở Mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Tên loại hình</Form.Label>
              <Form.Control
                placeholder="VD: Khách sạn 5 sao, Villa..."
                value={tFHotelTypeValue}
                onChange={(e) => setTFHotelTypeValue(e.target.value)}
                isInvalid={isError}
              />
              <Form.Control.Feedback type="invalid">
                {error}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Mô tả đặc điểm</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={tFDesValue}
                onChange={(e) => setTFDesValue(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pb-4">
          <Button variant="light" onClick={() => setOpenModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" className="px-4" onClick={handleSave}>
            {loading ? <Spinner size="sm" /> : "Lưu dữ liệu"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Delete */}
      <Modal
        show={openModalDelete}
        onHide={() => setOpenModalDelete(false)}
        centered
        size="sm"
      >
        <div className="p-4 text-center">
          <CiTrash size={50} color="#e63757" />
          <h5 className="mt-3 fw-bold">Xác nhận xóa?</h5>
          <p className="text-muted small">Hành động này không thể hoàn tác.</p>
          <div className="d-flex gap-2 justify-content-center mt-4">
            <Button variant="light" onClick={() => setOpenModalDelete(false)}>
              Đóng
            </Button>
            <Button variant="danger" onClick={handleAgreeDelete}>
              Xóa ngay
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

export default HotelType;
