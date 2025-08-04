import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import { BsCaretLeft, BsCaretRight } from "react-icons/bs";
import { FaPlus, FaRegTrashAlt } from "react-icons/fa";
import { Modal, Button, Form, Toast, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import APIToken from "../../config/APIToken";
import { CiTrash, CiEdit } from "react-icons/ci";
import "./index.css";

const GuideTravelList = () => {
  const navigate = useNavigate();
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  let [loading, setLoading] = useState(false);
  const [dataPost, setDataPost] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);

  const [deleteId, setDeleteId] = useState(null);

  let userId = localStorage.getItem("userId");

  const itemsPerPage = 10;

  const [openModalDelete, setOpenModalDelete] = useState(false);
  const handleCloseModalDelete = () => {
    setOpenModalDelete(false);
  };

  const handleOpenModalDelete = (id) => {
    setOpenModalDelete(true);
    setDeleteId(id);
  };

  const getData = async () => {
    try {
      const response = await API.get("/post/get");
      setDataPost(response.data.data || []);
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách loại Tour:",
        error.response || error
      );
    }
  };

  const handleOpenModal = () => setOpenModal(true);

  const handleAddBlog = () => {
    navigate("/guide-travel");
  };
  const handleGoToDetail = (post_id) => {
    navigate("/guide-travel-detail", { state: { postId: post_id } });
  };
  const handleAgrreDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/post/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xoá bài viết thành công");
        setSuccessAlertOpen(true);
      }
    } catch (error) {
      setError("Có lỗi xảy ra khi xoá Tour");
    } finally {
      setDeleteId(null);
      setLoading(false);
      setOpenModalDelete(false);
      getData();
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataPost.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(dataPost.length / itemsPerPage));

  return (
    <div className="container">
      <div
        style={{
          borderBottom: "1px solid #1D61AD",
          fontSize: 20,
          paddingTop: 10,
          paddingBottom: 10,
          marginBottom: 20,
          color: "#1d61ad",
        }}
      >
        DANH SÁCH BÀI VIẾT
      </div>
      <div className="d-flex justify-content-end mt-2">
        <Button variant="primary" onClick={handleAddBlog}>
          <div
            style={{
              display: "flex",
              justifyItems: "center",
              alignItems: "center",
            }}
          >
            <FaPlus size={16} />
            <div
              style={{
                paddingLeft: "8px",
              }}
            >
              Thêm mới
            </div>
          </div>
        </Button>
      </div>
      <table className="table table-striped mt-2">
        <thead>
          <tr>
            <th style={{ width: "5%" }}>Mã</th>
            <th style={{ width: "12%" }}>Tiêu đề</th>
            <th style={{ width: "15%" }}>Mô tả ngắn</th>
            <th style={{ width: "10%" }}>Ảnh đại diện</th>
            <th style={{ width: "18%" }}>Thẻ tag</th>
            <th style={{ width: "10%" }}>Danh mục</th>
            <th style={{ width: "16%" }}>Người thêm</th>
            <th style={{ width: "10%" }}>Ngày thêm</th>
            <th style={{ width: "8%" }}>Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((post) => (
              <tr key={post.post_id}>
                <td>{post.post_id}</td>
                <td
                  className="detailLink"
                  onClick={() => handleGoToDetail(post.post_id)}
                >
                  {post.title}
                </td>
                <td>
                  <div className="line-clamp-5">{post.description}</div>
                </td>
                <td>
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt={post.title}
                      width={150}
                      height={100}
                    />
                  ) : null}
                </td>
                <td>
                  {post.tags && post.tags.length > 0 ? (
                    <div className="d-flex flex-wrap">
                      {post.tags.map((tag) => (
                        <div className="tag" key={tag.tag_id}>
                          {tag.tag_name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span>Không có tags</span>
                  )}
                </td>
                <td>{post.category_id + " - " + post.category_name}</td>
                <td>{post.created_by}</td>
                <td>{post.created_at}</td>
                <td>
                  <div className="d-flex">
                    <div className="Edit" style={{ marginRight: 10 }}>
                      <CiEdit />
                    </div>
                    <div
                      className="Trash"
                      style={{ marginLeft: 10 }}
                      onClick={() => handleOpenModalDelete(post.post_id)}
                    >
                      <CiTrash />
                    </div>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {dataPost.length > itemsPerPage && (
        <div className="d-flex justify-content-center mt-3">
          <nav>
            <ul className="pagination">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <Button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <BsCaretLeft />
                </Button>
              </li>
              {[...Array(totalPages)].map((_, index) => (
                <li
                  key={index}
                  className={`page-item ${
                    currentPage === index + 1 ? "active" : ""
                  }`}
                >
                  <Button
                    className="page-link"
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Button>
                </li>
              ))}
              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <Button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <BsCaretRight />
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Delete Modal */}
      <Modal show={openModalDelete} onHide={handleCloseModalDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Xoá Tour</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn xoá?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModalDelete}>
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleAgrreDelete}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : "Xoá"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Alert */}
      <Toast
        onClose={() => setSuccessAlertOpen(false)}
        show={successAlertOpen}
        delay={3000}
        autohide
        className="position-fixed top-0 end-0 m-3"
      >
        <Toast.Body>{alertMessage}</Toast.Body>
      </Toast>
    </div>
  );
};

export default GuideTravelList;
