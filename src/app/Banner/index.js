import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";
import { FaPlus, FaImage } from "react-icons/fa";
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

const Banner = () => {
  const [dataBanner, setDataBanner] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 5; // Banner ảnh to nên để ít item mỗi trang

  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [tFBannerValue, setTFBannerValue] = useState("");
  const [tFDesValue, setTFDesValue] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [status, setStatus] = useState(1);

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
      const response = await API.get("/banner/get");
      setDataBanner(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setTFBannerValue("");
    setTFDesValue("");
    setImageLink("");
    setStatus(1);
    setIsError(false);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setCurrentId(item.bannerid);
    setTFBannerValue(item.bannername);
    setTFDesValue(item.description);
    setImageLink(item.bannerurl);
    setStatus(item.status || 1);
    setIsError(false);
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (tFBannerValue.trim().length === 0) {
      setError("Vui lòng nhập tên banner");
      setIsError(true);
      return;
    }
    try {
      setLoading(true);
      const payload = {
        bannername: tFBannerValue,
        bannerurl: imageLink,
        description: tFDesValue,
        status: status,
        created_by: userId,
      };

      let response;
      if (editMode) {
        response = await APIToken.put(`/banner/update/${currentId}`, payload);
      } else {
        response = await APIToken.post("/banner/add", payload);
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
      const response = await APIToken.delete(`/banner/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xoá banner thành công");
        setSuccessAlertOpen(true);
        getData();
      }
    } finally {
      setLoading(false);
      setOpenModalDelete(false);
    }
  };

  const filteredData = dataBanner.filter((item) =>
    item.bannername.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bn-container">
      <div className="bn-header">
        <div className="bn-header-info">
          <h2>Quản Lý Banner</h2>
          <p>
            Cấu hình hình ảnh trình chiếu tại trang chủ và các trang sự kiện
          </p>
        </div>
        <div className="bn-header-actions">
          <InputGroup className="bn-search-bar">
            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm tên banner..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </InputGroup>
          <Button
            variant="primary"
            className="bn-btn-add"
            onClick={handleOpenAdd}
          >
            <FaPlus /> <span>Thêm Banner</span>
          </Button>
        </div>
      </div>

      <div className="bn-content-card">
        <div className="table-responsive">
          <table className="bn-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Hình ảnh</th>
                <th>Tên Banner</th>
                <th>Người tạo</th>
                <th>Trạng thái</th>
                <th className="text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.bannerid}>
                    <td>
                      <span className="bn-id-label">#{item.bannerid}</span>
                    </td>
                    <td>
                      <div className="bn-img-preview">
                        {item.bannerurl ? (
                          <img src={item.bannerurl} alt="banner" />
                        ) : (
                          <div className="bn-no-img">
                            <FaImage />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{item.bannername}</div>
                      <div className="small text-muted bn-desc-truncate">
                        {item.description}
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="border">
                        {item.created_by || "Admin"}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={item.status === 1 ? "success" : "secondary"}>
                        {item.status === 1 ? "Hoạt động" : "Ẩn"}
                      </Badge>
                    </td>
                    <td>
                      <div className="bn-actions">
                        <button
                          className="bn-action-btn edit"
                          onClick={() => handleOpenEdit(item)}
                          disabled={true}
                        >
                          <CiEdit size={20} />
                        </button>
                        <button
                          className="bn-action-btn delete"
                          onClick={() => handleOpenModalDelete(item.bannerid)}
                        >
                          <CiTrash size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    Chưa có banner nào được tạo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bn-pagination">
          <span className="text-muted small">
            Tổng số: {filteredData.length} banner
          </span>
          <div className="bn-page-nav">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((v) => v - 1)}
            >
              <BsCaretLeft />
            </button>
            <button className="bn-page-current">{currentPage}</button>
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
      <Modal
        show={openModal}
        onHide={() => setOpenModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="border-0 px-4 pt-4">
          <Modal.Title className="fw-bold">
            {editMode ? "Cập Nhật Banner" : "Tạo Banner Mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <Form>
            <div className="row">
              <div className="col-md-7">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Tên Banner</Form.Label>
                  <Form.Control
                    value={tFBannerValue}
                    onChange={(e) => setTFBannerValue(e.target.value)}
                    isInvalid={isError}
                    placeholder="Nhập tên chương trình khuyến mãi/sự kiện..."
                  />
                  <Form.Control.Feedback type="invalid">
                    {error}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Mô tả ngắn</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={tFDesValue}
                    onChange={(e) => setTFDesValue(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold d-block">
                    Trạng thái hiển thị
                  </Form.Label>
                  <Form.Check
                    type="switch"
                    label={status === 1 ? "Đang bật" : "Đang tắt"}
                    checked={status === 1}
                    onChange={(e) => setStatus(e.target.checked ? 1 : 2)}
                  />
                </Form.Group>
              </div>
              <div className="col-md-5">
                <Form.Label className="fw-bold">Hình ảnh Banner</Form.Label>
                <ImageCDNCloud onUploadSuccess={(url) => setImageLink(url)} />
                {imageLink && (
                  <div className="mt-2 border rounded p-1 bg-light">
                    <img
                      src={imageLink}
                      alt="preview"
                      className="img-fluid rounded"
                      style={{
                        maxHeight: "150px",
                        width: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pb-4">
          <Button variant="light" onClick={() => setOpenModal(false)}>
            Hủy bỏ
          </Button>
          <Button variant="primary" onClick={handleSave} className="px-4">
            {loading ? <Spinner size="sm" /> : "Lưu banner"}
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
          <h5 className="mt-3 fw-bold">Xóa banner này?</h5>
          <p className="text-muted small">
            Ảnh sẽ bị gỡ khỏi giao diện trang chủ ngay lập tức.
          </p>
          <div className="d-flex gap-2 justify-content-center mt-4">
            <Button variant="light" onClick={() => setOpenModalDelete(false)}>
              Đóng
            </Button>
            <Button variant="danger" onClick={handleAgreeDelete}>
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
          <Toast.Body className="text-white fw-bold">{alertMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default Banner;
