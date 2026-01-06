import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
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
import "./index.css"; // Sử dụng file CSS riêng

const TourType = () => {
  const [dataTourType, setDataTourType] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [tFTourTypeValue, setTFTourTypeValue] = useState("");
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
      const response = await API.get("/tourType/get");
      setDataTourType(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setTFTourTypeValue("");
    setTFDesValue("");
    setIsError(false);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setCurrentId(item.tourtypeid);
    setTFTourTypeValue(item.tourtypename);
    setTFDesValue(item.description);
    setIsError(false);
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (tFTourTypeValue.trim().length === 0) {
      setError("Vui lòng nhập tên loại tour");
      setIsError(true);
      return;
    }
    try {
      setLoading(true);
      const payload = {
        tourtypename: tFTourTypeValue,
        description: tFDesValue,
        created_by: userId,
      };
      let response;
      if (editMode) {
        response = await APIToken.put(`/tourType/update/${currentId}`, payload);
      } else {
        response = await APIToken.post("/tourType/add", payload);
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
      const response = await APIToken.delete(`/tourType/delete/${deleteId}`);
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

  const filteredData = dataTourType.filter((item) =>
    item.tourtypename.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const currentItems = filteredData.slice(
    indexOfLastItem - itemsPerPage,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="tt-container">
      <div className="tt-header">
        <div className="tt-header-info">
          <h2>Quản lý Loại Tour</h2>
          <p>Danh mục các hình thức dịch vụ tour</p>
        </div>
        <div className="tt-header-actions">
          <InputGroup className="tt-search-bar">
            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm kiếm..."
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Button
            variant="primary"
            className="tt-btn-add"
            onClick={handleOpenAdd}
          >
            <FaPlus /> <span>Thêm mới</span>
          </Button>
        </div>
      </div>

      <div className="tt-content-card">
        <div className="table-responsive">
          <table className="tt-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên loại tour</th>
                <th>Mô tả</th>
                <th>Người tạo</th>
                <th>Trạng thái</th>
                <th className="text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.tourtypeid}>
                  <td>
                    <span className="tt-id">#{item.tourtypeid}</span>
                  </td>
                  <td className="fw-bold">{item.tourtypename}</td>
                  <td className="tt-desc-cell">{item.description || "---"}</td>
                  <td>
                    <span className="tt-user">
                      {item.created_by || "Admin"}
                    </span>
                  </td>
                  <td>
                    <Badge bg={item.status === 1 ? "success" : "secondary"}>
                      {item.status === 1 ? "Hoạt động" : "Tạm dừng"}
                    </Badge>
                  </td>
                  <td>
                    <div className="tt-actions">
                      <button
                        className="tt-btn edit"
                        onClick={() => handleOpenEdit(item)}
                        disabled={true}
                      >
                        <CiEdit />
                      </button>
                      <button
                        className="tt-btn delete"
                        onClick={() => {
                          setDeleteId(item.tourtypeid);
                          setOpenModalDelete(true);
                        }}
                      >
                        <CiTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tt-pagination">
          <span className="text-muted">
            Trang {currentPage} / {totalPages || 1}
          </span>
          <div className="tt-page-btns">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((v) => v - 1)}
            >
              <BsCaretLeft />
            </button>
            <button className="tt-page-active">{currentPage}</button>
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
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            {editMode ? "Sửa loại tour" : "Thêm loại tour"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Tên loại tour</Form.Label>
              <Form.Control
                value={tFTourTypeValue}
                onChange={(e) => setTFTourTypeValue(e.target.value)}
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
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setOpenModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {loading ? <Spinner size="sm" /> : "Lưu"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Delete */}
      <Modal
        show={openModalDelete}
        onHide={() => setOpenModalDelete(false)}
        centered
      >
        <div className="p-4 text-center">
          <CiTrash size={50} color="#dc3545" />
          <h4 className="mt-3">Bạn chắc chắn muốn xóa?</h4>
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
          <Toast.Body className="text-white">{alertMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default TourType;
