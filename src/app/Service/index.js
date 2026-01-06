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
import "./index.css";

const Service = () => {
  const [dataService, setDataService] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [tFServiceValue, setTFServiceValue] = useState("");
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
      const response = await API.get("/services/get");
      setDataService(response.data.data || []);
    } catch (err) {
      console.error("Lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setTFServiceValue("");
    setTFDesValue("");
    setIsError(false);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setCurrentId(item.serviceid);
    setTFServiceValue(item.servicename);
    setTFDesValue(item.description);
    setIsError(false);
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (tFServiceValue.trim().length === 0) {
      setError("Vui lòng nhập tên dịch vụ");
      setIsError(true);
      return;
    }
    try {
      setLoading(true);
      const payload = {
        servicename: tFServiceValue,
        description: tFDesValue,
        created_by: userId,
      };
      let response;
      if (editMode) {
        response = await APIToken.put(`/services/update/${currentId}`, payload);
      } else {
        response = await APIToken.post("/services/add", payload);
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
      const response = await APIToken.delete(`/services/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xoá dịch vụ thành công");
        setSuccessAlertOpen(true);
        getData();
      }
    } finally {
      setLoading(false);
      setOpenModalDelete(false);
    }
  };

  const filteredData = dataService.filter((item) =>
    item.servicename.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const currentItems = filteredData.slice(
    indexOfLastItem - itemsPerPage,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div className="sv-header-info">
          <h2>Quản lý Dịch Vụ</h2>
          <p>Danh mục các dịch vụ tiện ích đi kèm</p>
        </div>
        <div className="sv-header-actions">
          <InputGroup className="sv-search-bar">
            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm kiếm dịch vụ..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </InputGroup>
          <Button
            variant="primary"
            className="sv-btn-add"
            onClick={handleOpenAdd}
          >
            <FaPlus /> <span>Thêm mới</span>
          </Button>
        </div>
      </div>

      <div className="sv-content-card">
        <div className="table-responsive">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên dịch vụ</th>
                <th>Mô tả</th>
                <th>Người tạo</th>
                <th>Trạng thái</th>
                <th className="text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.serviceid}>
                    <td>
                      <span className="sv-id">#{item.serviceid}</span>
                    </td>
                    <td className="fw-bold">{item.servicename}</td>
                    <td className="sv-desc-cell">
                      {item.description || "---"}
                    </td>
                    <td>
                      <span className="sv-user">
                        {item.created_by || "Admin"}
                      </span>
                    </td>
                    <td>
                      <Badge bg={item.status === 1 ? "success" : "secondary"}>
                        {item.status === 1 ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </td>
                    <td>
                      <div className="sv-actions">
                        <button
                          className="sv-btn edit"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <CiEdit />
                        </button>
                        <button
                          className="sv-btn delete"
                          onClick={() => {
                            setDeleteId(item.serviceid);
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
                  <td colSpan="6" className="text-center py-5">
                    Chưa có dữ liệu dịch vụ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="sv-pagination">
          <span className="text-muted">
            Trang {currentPage} / {totalPages || 1}
          </span>
          <div className="sv-page-btns">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((v) => v - 1)}
            >
              <BsCaretLeft />
            </button>
            <button className="sv-page-active">{currentPage}</button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((v) => v + 1)}
            >
              <BsCaretRight />
            </button>
          </div>
        </div>
      </div>

      <Modal show={openModal} onHide={() => setOpenModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">
            {editMode ? "Sửa dịch vụ" : "Thêm dịch vụ"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Tên dịch vụ</Form.Label>
              <Form.Control
                value={tFServiceValue}
                onChange={(e) => setTFServiceValue(e.target.value)}
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
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setOpenModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {loading ? <Spinner size="sm" /> : "Lưu"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={openModalDelete}
        onHide={() => setOpenModalDelete(false)}
        centered
        size="sm"
      >
        <div className="p-4 text-center">
          <CiTrash size={50} color="#dc3545" />
          <h5 className="mt-3 fw-bold">Xác nhận xóa?</h5>
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

export default Service;
