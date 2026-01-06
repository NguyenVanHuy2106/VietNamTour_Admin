import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { FaPlus } from "react-icons/fa";
import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";
import { CiTrash, CiEdit } from "react-icons/ci";
import {
  Modal,
  Button,
  Form,
  Toast,
  Spinner,
  ToastContainer,
  Badge,
  InputGroup,
} from "react-bootstrap";

import ImageCDNCloud from "../../components/ImageCDNCloud";
import "./index.css";

const Image = () => {
  let userId = localStorage.getItem("userId");

  const [dataImage, setDataImage] = useState([]);
  const [dataImageCat, setDataImageCat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [openModalDelete, setOpenModalDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Success Alert states
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Add states
  const [imageList, setImageList] = useState([]);
  const [dataImageAdd, setDataImageAdd] = useState({
    category_id: "",
    created_by: userId,
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/image/get");
      setDataImage(response.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách hình ảnh:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDataCat = async () => {
    try {
      const response = await API.get("/imgCat/get");
      setDataImageCat(response.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
    }
  };

  useEffect(() => {
    getData();
    getDataCat();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDataImageAdd((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    setImageList([]);
    setDataImageAdd({ ...dataImageAdd, category_id: "" });
  };

  const handleUploadSuccess = (urls) => {
    if (Array.isArray(urls)) {
      setImageList((prev) => [...prev, ...urls]);
    } else {
      setImageList((prev) => [...prev, urls]);
    }
  };

  const handleAgrre = async () => {
    if (!dataImageAdd.category_id || imageList.length === 0) {
      alert("Vui lòng chọn danh mục và tải hình ảnh lên!");
      return;
    }

    try {
      const payload = imageList.map((url) => ({
        name: "Hình ảnh",
        img_url: url,
        category_id: dataImageAdd.category_id,
        created_by: dataImageAdd.created_by,
      }));
      setLoading(true);
      const response = await APIToken.post("/image/add", payload);
      if (response.status === 201) {
        setAlertMessage("Thêm mới hình ảnh thành công ✨");
        setSuccessAlertOpen(true);
        handleCloseModal();
        getData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgrreDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/image/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xoá hình ảnh thành công");
        setSuccessAlertOpen(true);
        getData();
      }
    } finally {
      setDeleteId(null);
      setLoading(false);
      setOpenModalDelete(false);
    }
  };

  // Logic lọc và phân trang
  const filteredData = dataImage.filter(
    (item) =>
      item.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="im-container">
      {/* Header */}
      <div className="im-header">
        <div className="im-header-info">
          <h2>QUẢN LÝ HÌNH ẢNH</h2>
          <p>Lưu trữ và phân loại hình ảnh hệ thống</p>
        </div>
        <div className="im-header-actions">
          <InputGroup className="im-search-bar">
            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm theo danh mục hoặc mã..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </InputGroup>
          <Button
            variant="primary"
            className="im-btn-add"
            onClick={handleOpenModal}
          >
            <FaPlus /> <span>Thêm mới</span>
          </Button>
        </div>
      </div>

      <div className="im-content-card">
        <div className="table-responsive">
          <table className="im-table">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>Mã</th>
                <th style={{ width: "20%" }}>Danh mục</th>
                <th style={{ width: "25%" }}>Hình ảnh</th>
                <th style={{ width: "15%" }}>Người thêm</th>
                <th style={{ width: "15%" }}>Ngày thêm</th>
                <th style={{ width: "10%" }} className="text-center">
                  Tác vụ
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((image) => (
                  <tr key={image.id}>
                    <td>
                      <span className="im-id">#{image.id}</span>
                    </td>
                    <td>
                      <Badge bg="info" className="im-badge-cat">
                        {image.category_name}
                      </Badge>
                    </td>
                    <td>
                      {image.img_url && (
                        <div className="im-img-wrapper">
                          <img src={image.img_url} alt="thumbnail" />
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="im-user">{image.created_by}</span>
                    </td>
                    <td>
                      <small className="text-muted">{image.created_at}</small>
                    </td>
                    <td>
                      <div className="im-actions">
                        <button className="im-btn edit">
                          <CiEdit />
                        </button>
                        <button
                          className="im-btn delete"
                          onClick={() => {
                            setDeleteId(image.id);
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
                    Không có dữ liệu hình ảnh
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG: Chữ trái, Nút phải (Chuẩn Service) */}
        <div className="im-pagination">
          <span className="im-page-info">
            Trang {currentPage} / {totalPages}
          </span>
          <div className="im-page-btns">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((v) => Math.max(v - 1, 1))}
            >
              <BsCaretLeft />
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((v) => Math.min(v + 1, totalPages))}
            >
              <BsCaretRight />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add */}
      <Modal show={openModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Thêm mới hình ảnh</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Danh mục hình ảnh</Form.Label>
            <Form.Select
              name="category_id"
              value={dataImageAdd.category_id}
              onChange={handleChange}
            >
              <option value="">-- Chọn danh mục --</option>
              {dataImageCat.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Tải lên hình ảnh</Form.Label>
            <div className="im-upload-box">
              <ImageCDNCloud onUploadSuccess={handleUploadSuccess} />
            </div>
          </Form.Group>

          {imageList.length > 0 && (
            <div className="im-preview-grid">
              {imageList.map((url, index) => (
                <div key={index} className="im-preview-item">
                  <img src={url} alt="preview" />
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={handleCloseModal}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handleAgrre}
            disabled={loading}
            className="px-4"
          >
            {loading ? <Spinner size="sm" animation="border" /> : "Thêm mới"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal
        show={openModalDelete}
        onHide={() => setOpenModalDelete(false)}
        centered
        size="sm"
      >
        <div className="p-4 text-center">
          <CiTrash size={50} color="#dc3545" />
          <h5 className="mt-3 fw-bold">Xác nhận xóa?</h5>
          <p className="text-muted small">
            Hình ảnh này sẽ bị xóa khỏi hệ thống.
          </p>
          <div className="d-flex gap-2 justify-content-center mt-4">
            <Button variant="light" onClick={() => setOpenModalDelete(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleAgrreDelete}>
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

export default Image;
