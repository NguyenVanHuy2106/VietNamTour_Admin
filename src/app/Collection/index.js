import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";
import { FaPlus, FaImages } from "react-icons/fa";
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

const Collection = () => {
  const [dataCollection, setDataCollection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [tFCollectionName, setTFCollectionName] = useState("");
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
      const response = await API.get("/collection/get");
      setDataCollection(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setTFCollectionName("");
    setTFDesValue("");
    setImageLink("");
    setIsError(false);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setCurrentId(item.collectionid);
    setTFCollectionName(item.collectionname);
    setTFDesValue(item.description);
    setImageLink(item.collectionurl);
    setIsError(false);
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (tFCollectionName.trim().length === 0) {
      setError("Vui lòng nhập tên hình ảnh");
      setIsError(true);
      return;
    }
    try {
      setLoading(true);
      const payload = {
        collectionname: tFCollectionName,
        collectionurl: imageLink,
        description: tFDesValue,
        created_by: userId,
      };
      let response;
      if (editMode) {
        response = await APIToken.put(
          `/collection/update/${currentId}`,
          payload
        );
      } else {
        response = await APIToken.post("/collection/add", payload);
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
      const response = await APIToken.delete(`/collection/delete/${deleteId}`);
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

  const filteredData = dataCollection.filter((item) =>
    item.collectionname.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2>Quản lý Hình Ảnh</h2>
          <p>Danh mục bộ sưu tập và album hình ảnh</p>
        </div>
        <div className="tt-header-actions">
          <InputGroup className="tt-search-bar">
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
                <th>Hình ảnh</th>
                <th>Tên bộ sưu tập</th>
                <th>Mô tả</th>
                <th>Người tạo</th>
                <th>Trạng thái</th>
                <th className="text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.collectionid}>
                  <td>
                    <span className="tt-id">#{item.collectionid}</span>
                  </td>
                  <td>
                    <div
                      style={{
                        width: "100px",
                        height: "60px",
                        overflow: "hidden",
                        borderRadius: "4px",
                        border: "1px solid #eee",
                      }}
                    >
                      {item.collectionurl ? (
                        <img
                          src={item.collectionurl}
                          alt="img"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 bg-light text-muted">
                          <FaImages />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="fw-bold">{item.collectionname}</td>
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
                          setDeleteId(item.collectionid);
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
      <Modal
        show={openModal}
        onHide={() => setOpenModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            {editMode ? "Sửa hình ảnh" : "Thêm hình ảnh"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row">
              <div className="col-md-7">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Tên hình ảnh</Form.Label>
                  <Form.Control
                    value={tFCollectionName}
                    onChange={(e) => setTFCollectionName(e.target.value)}
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
              </div>
              <div className="col-md-5">
                <Form.Label className="fw-bold">Tải lên hình ảnh</Form.Label>
                <ImageCDNCloud onUploadSuccess={(url) => setImageLink(url)} />
                {imageLink && (
                  <div className="mt-2 border rounded p-1">
                    <img
                      src={imageLink}
                      alt="preview"
                      style={{
                        width: "100%",
                        height: "120px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
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

export default Collection;
