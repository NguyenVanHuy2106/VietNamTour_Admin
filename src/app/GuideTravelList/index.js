import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { useNavigate } from "react-router-dom";
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

const GuideTravelList = () => {
  const navigate = useNavigate();
  const [dataPost, setDataPost] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [openModalDelete, setOpenModalDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/post/get");
      setDataPost(response.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài viết:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlog = () => navigate("/guide-travel");

  const handleGoToDetail = (post_id) => {
    navigate("/guide-travel-detail", { state: { postId: post_id } });
  };

  const handleOpenModalDelete = (id) => {
    setDeleteId(id);
    setOpenModalDelete(true);
  };

  const handleAgrreDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/post/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xoá bài viết thành công ✨");
        setSuccessAlertOpen(true);
        getData();
      }
    } catch (error) {
      console.error("Lỗi xóa bài viết");
    } finally {
      setLoading(false);
      setOpenModalDelete(false);
    }
  };

  // Filter & Pagination logic
  const filteredData = dataPost.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="gt-container">
      <div className="gt-header">
        <div className="gt-header-info">
          <h2>QUẢN LÝ BÀI VIẾT</h2>
          <p>Danh sách các bài viết hướng dẫn du lịch</p>
        </div>
        <div className="gt-header-actions">
          <InputGroup className="gt-search-bar">
            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm tiêu đề bài viết..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </InputGroup>
          <Button
            variant="primary"
            className="gt-btn-add"
            onClick={handleAddBlog}
          >
            <FaPlus /> <span>Thêm mới</span>
          </Button>
        </div>
      </div>

      <div className="gt-content-card">
        <div className="table-responsive">
          <table className="gt-table">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>Mã</th>
                <th style={{ width: "20%" }}>Tiêu đề</th>
                <th style={{ width: "15%" }}>Ảnh</th>
                <th style={{ width: "15%" }}>Tags</th>
                <th style={{ width: "12%" }}>Danh mục</th>
                <th style={{ width: "12%" }}>Người tạo</th>
                <th style={{ width: "13%" }} className="text-center">
                  Tác vụ
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((post) => (
                  <tr key={post.post_id}>
                    <td>
                      <span className="gt-id">#{post.post_id}</span>
                    </td>
                    <td>
                      <div
                        className="gt-title-link"
                        onClick={() => handleGoToDetail(post.post_id)}
                      >
                        {post.title}
                      </div>
                      <div className="gt-desc-short">{post.description}</div>
                    </td>
                    <td>
                      <div className="gt-img-wrapper">
                        <img
                          src={
                            post.thumbnail_url ||
                            "https://via.placeholder.com/150x100"
                          }
                          alt={post.title}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="gt-tag-container">
                        {post.tags?.map((tag) => (
                          <Badge
                            key={tag.tag_id}
                            bg="light"
                            text="dark"
                            className="gt-tag-badge"
                          >
                            #{tag.tag_name}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      <Badge bg="info" className="gt-cat-badge">
                        {post.category_name}
                      </Badge>
                    </td>
                    <td>
                      <span className="gt-user">{post.created_by}</span>
                    </td>
                    <td>
                      <div className="gt-actions">
                        <button className="gt-btn edit">
                          <CiEdit />
                        </button>
                        <button
                          className="gt-btn delete"
                          onClick={() => handleOpenModalDelete(post.post_id)}
                        >
                          <CiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    Không tìm thấy bài viết nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="gt-pagination">
          <span className="gt-page-info">
            Trang {currentPage} / {totalPages}
          </span>
          <div className="gt-page-btns">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((v) => v - 1)}
            >
              <BsCaretLeft />
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((v) => v + 1)}
            >
              <BsCaretRight />
            </button>
          </div>
        </div>
      </div>

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
            Dữ liệu bài viết sẽ bị xóa vĩnh viễn.
          </p>
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
          <Toast.Body className="text-white fw-bold">{alertMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default GuideTravelList;
