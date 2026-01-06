import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";
import { FaPlus, FaRegUser } from "react-icons/fa";
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
import ImageCDNCloud from "../../components/ImageCDNCloud";
import "./index.css";

const Customer = () => {
  const [dataCustomer, setDataCustomer] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [imageLink, setImageLink] = useState("");
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [tFCustomerName, setTFCustomerName] = useState("");
  const [tFDesValue, setTFDesValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [openModalDelete, setOpenModalDelete] = useState(false);

  let userId = localStorage.getItem("userId");
  const itemsPerPage = 6; // Giảm số lượng để giao diện thoáng hơn

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/customer/get");
      setDataCustomer(response.data.data || []);
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setOpenModal(true);
    setTFCustomerName("");
    setTFDesValue("");
    setImageLink("");
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setIsError(false);
  };

  const handleAgrre = async () => {
    if (!tFCustomerName.trim()) {
      setError("Vui lòng nhập tên khách hàng");
      setIsError(true);
      return;
    }
    try {
      setLoading(true);
      const response = await APIToken.post("/customer/add", {
        customername: tFCustomerName,
        customerfieldtypeid: 1,
        customerlogo: imageLink,
        description: tFDesValue,
        created_by: userId,
      });
      if (response.status === 201) {
        setAlertMessage("Thêm khách hàng thành công ✨");
        setSuccessAlertOpen(true);
        getData();
        handleCloseModal();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgrreDelete = async () => {
    try {
      setLoading(true);
      await APIToken.delete(`/customer/delete/${deleteId}`);
      setAlertMessage("Đã xóa dữ liệu khách hàng");
      setSuccessAlertOpen(true);
      getData();
    } finally {
      setOpenModalDelete(false);
      setLoading(false);
    }
  };

  // Logic tìm kiếm & phân trang
  const filteredData = dataCustomer.filter((item) =>
    item.customername.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="customer-page-container">
      {/* Header & Search */}
      <div className="dashboard-header">
        <div className="header-text">
          <h2>Đối tác & Khách hàng</h2>
          <p>Quản lý danh sách đối tác chiến lược của công ty</p>
        </div>
        <div className="header-actions">
          <InputGroup className="search-bar">
            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm tên khách hàng..."
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Button
            variant="primary"
            className="btn-add"
            onClick={handleOpenModal}
          >
            <FaPlus /> <span>Thêm mới</span>
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="content-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Thông tin đối tác</th>
                <th>Mô tả</th>
                <th>Người tạo</th>
                <th>Ngày tạo</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((customer) => (
                  <tr key={customer.customerid}>
                    <td className="text-muted">#{customer.customerid}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="logo-wrapper">
                          {customer.customerlogo ? (
                            <img src={customer.customerlogo} alt="logo" />
                          ) : (
                            <FaRegUser size={20} color="#ccc" />
                          )}
                        </div>
                        <div className="ms-3">
                          <div className="fw-bold">{customer.customername}</div>
                          <Badge bg="light" text="dark" className="border">
                            Partner
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div
                        className="text-truncate"
                        style={{ maxWidth: "200px" }}
                      >
                        {customer.description || "---"}
                      </div>
                    </td>
                    <td>
                      <span className="user-tag">
                        {customer.created_by || "Admin"}
                      </span>
                    </td>
                    <td>
                      {new Date(customer.created_at).toLocaleDateString(
                        "vi-VN"
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action edit">
                          <CiEdit />
                        </button>
                        <button
                          className="btn-action delete"
                          onClick={() => {
                            setDeleteId(customer.customerid);
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
                    Không tìm thấy dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Pagination */}
        <div className="pagination-wrapper">
          <p className="mb-0 text-muted">
            Trang {currentPage} / {totalPages}
          </p>
          <div className="custom-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((v) => v - 1)}
            >
              <BsCaretLeft />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((v) => v + 1)}
            >
              <BsCaretRight />
            </button>
          </div>
        </div>
      </div>

      {/* Modals & Alerts */}
      <Modal show={openModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Thêm đối tác mới</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <Form>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Tên khách hàng</Form.Label>
                  <Form.Control
                    placeholder="VD: VinPearl, VietJet..."
                    value={tFCustomerName}
                    onChange={(e) => setTFCustomerName(e.target.value)}
                    isInvalid={isError}
                  />
                  <Form.Control.Feedback type="invalid">
                    {error}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Mô tả chi tiết</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={tFDesValue}
                    onChange={(e) => setTFDesValue(e.target.value)}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6 text-center">
                <Form.Label className="fw-bold d-block text-start">
                  Logo đối tác
                </Form.Label>
                <div className="upload-preview-area">
                  <ImageCDNCloud onUploadSuccess={(url) => setImageLink(url)} />
                  {imageLink && (
                    <img
                      src={imageLink}
                      className="img-preview mt-2"
                      alt="Preview"
                    />
                  )}
                </div>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={handleCloseModal}>
            Hủy bỏ
          </Button>
          <Button variant="primary" onClick={handleAgrre} disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Lưu dữ liệu"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={openModalDelete}
        onHide={() => setOpenModalDelete(false)}
        centered
      >
        <div className="p-4 text-center">
          <CiTrash size={50} color="#dc3545" />
          <h4 className="mt-3">Xác nhận xóa?</h4>
          <p className="text-muted">Hành động này không thể hoàn tác.</p>
          <div className="d-flex gap-2 justify-content-center mt-4">
            <Button variant="light" onClick={() => setOpenModalDelete(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleAgrreDelete}>
              Xác nhận xóa
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

export default Customer;
