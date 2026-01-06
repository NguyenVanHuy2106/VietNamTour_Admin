import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import { CiTrash, CiEdit } from "react-icons/ci";
import {
  Modal,
  Button,
  Form,
  Spinner,
  Toast,
  ToastContainer,
  Badge,
  InputGroup,
} from "react-bootstrap";
import "./index.css"; // Đảm bảo đổi tên file CSS tương ứng

const ImageCategory = () => {
  const [dataImageCat, setDataImageCat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [tFImageCatValue, setTFImageCatValue] = useState("");
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
      const response = await API.get("/imgCat/get");
      setDataImageCat(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setTFImageCatValue("");
    setTFDesValue("");
    setIsError(false);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setCurrentId(item.id);
    setTFImageCatValue(item.name);
    setTFDesValue(item.description);
    setIsError(false);
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (tFImageCatValue.trim().length === 0) {
      setError("Vui lòng nhập tên danh mục");
      setIsError(true);
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: tFImageCatValue,
        description: tFDesValue,
        created_by: userId,
      };
      let response;
      if (editMode) {
        response = await APIToken.put(`/imgCat/update/${currentId}`, payload);
      } else {
        response = await APIToken.post("/imgCat/add", payload);
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

  const handleAgreeDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/imgCat/delete/${deleteId}`);
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

  const filteredData = dataImageCat.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const currentItems = filteredData.slice(
    indexOfLastItem - itemsPerPage,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="imgc-container">
      {/* Header đồng bộ layout TourType */}
      <div className="imgc-header">
        <div className="imgc-header-info">
          <h2>Danh mục hình ảnh</h2>
          <p>Quản lý các nhóm phân loại hình ảnh hệ thống</p>
        </div>
        <div className="imgc-header-actions">
          <InputGroup className="imgc-search-bar">
            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm kiếm..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </InputGroup>
          <Button
            variant="primary"
            className="imgc-btn-add"
            onClick={handleOpenAdd}
          >
            <FaPlus /> <span>Thêm mới</span>
          </Button>
        </div>
      </div>

      <div className="imgc-content-card">
        <div className="table-responsive">
          <table className="imgc-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th>Người thêm</th>
                <th>Trạng thái</th>
                <th className="text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="imgc-id">#{item.id}</span>
                    </td>
                    <td className="fw-bold">{item.name}</td>
                    <td className="imgc-desc-cell">
                      {item.description || "---"}
                    </td>
                    <td>
                      <span className="imgc-user">
                        {item.created_by || "Admin"}
                      </span>
                    </td>
                    <td>
                      <Badge bg="success">Hoạt động</Badge>
                    </td>
                    <td>
                      <div className="imgc-actions">
                        <button
                          className="imgc-btn edit"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <CiEdit />
                        </button>
                        <button
                          className="imgc-btn delete"
                          onClick={() => {
                            setDeleteId(item.id);
                            setOpenModalDelete(true);
                          }}
                        >
                          <CiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang đúng kiểu Customer/TourType */}
        <div className="imgc-pagination">
          <span className="text-muted">
            Trang {currentPage} / {totalPages || 1}
          </span>
          <div className="imgc-page-btns">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((v) => v - 1)}
            >
              <BsCaretLeft />
            </button>
            <button className="imgc-page-active">{currentPage}</button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((v) => v + 1)}
            >
              <BsCaretRight />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <Modal show={openModal} onHide={() => setOpenModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">
            {editMode ? "Sửa danh mục" : "Thêm danh mục mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Tên danh mục hình</Form.Label>
              <Form.Control
                value={tFImageCatValue}
                onChange={(e) => setTFImageCatValue(e.target.value)}
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
            <Form.Check
              type="switch"
              label="Kích hoạt danh mục"
              checked
              disabled
            />
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setOpenModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave} className="px-4">
            {loading ? <Spinner size="sm" /> : "Lưu"}
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
          <CiTrash size={50} color="#dc3545" />
          <h5 className="mt-3 fw-bold">Xác nhận xóa?</h5>
          <p className="text-muted small">Dữ liệu này sẽ bị xóa vĩnh viễn.</p>
          <div className="d-flex gap-2 justify-content-center mt-4">
            <Button variant="light" onClick={() => setOpenModalDelete(false)}>
              Đóng
            </Button>
            <Button variant="danger" onClick={handleAgreeDelete}>
              Xác nhận
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

export default ImageCategory;
