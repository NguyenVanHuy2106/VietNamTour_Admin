import React, { useState, useEffect, useMemo } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { useNavigate } from "react-router-dom";

import { BsCaretLeft, BsCaretRight, BsSearch, BsEye } from "react-icons/bs";

import { FaPlus, FaRegFileAlt, FaTags, FaFolderOpen } from "react-icons/fa";

import { CiTrash, CiEdit } from "react-icons/ci";

import {
  Button,
  Modal,
  Form,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";

import "./index.css";

const GuideTravelList = () => {
  const navigate = useNavigate();

  const [dataPost, setDataPost] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");

  const itemsPerPage = 10;

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);

  const [alertMessage, setAlertMessage] = useState("");

  const [toastVariant, setToastVariant] = useState("success");

  const [openModalDelete, setOpenModalDelete] = useState(false);

  const [deleteId, setDeleteId] = useState(null);

  const [deletePostTitle, setDeletePostTitle] = useState("");

  /* =====================================================
     INIT
  ===================================================== */

  useEffect(() => {
    getData();
  }, []);

  /* =====================================================
     GET DATA
  ===================================================== */

  const getData = async () => {
    try {
      setLoading(true);

      const response = await API.get("/post/get");

      setDataPost(
        response.data && response.data.data ? response.data.data : [],
      );
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài viết:", error);

      showToast("danger", "Không thể tải danh sách bài viết.");
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     TOAST
  ===================================================== */

  const showToast = (variant, message) => {
    setToastVariant(variant);
    setAlertMessage(message);
    setSuccessAlertOpen(true);
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const handleAddBlog = () => {
    navigate("/guide-travel");
  };

  const handleGoToDetail = (post_id) => {
    navigate("/guide-travel-detail", {
      state: {
        postId: post_id,
      },
    });
  };

  const handleGoToEdit = (post_id) => {
    navigate("/guide-travel-edit", {
      state: {
        postId: post_id,
      },
    });
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleOpenModalDelete = (post) => {
    setDeleteId(post.post_id);
    setDeletePostTitle(post.title || "");
    setOpenModalDelete(true);
  };

  const handleCloseModalDelete = () => {
    setOpenModalDelete(false);
    setDeleteId(null);
    setDeletePostTitle("");
  };

  const handleAgreeDelete = async () => {
    if (!deleteId) return;

    try {
      setLoading(true);

      const response = await APIToken.delete(`/post/delete/${deleteId}`);

      if (response.status === 200) {
        showToast("success", "Xoá bài viết thành công.");

        await getData();

        /*
          Nếu xoá item cuối cùng của page
          thì lùi về page trước.
        */

        const remainingItems = filteredData.length - 1;

        const newTotalPages = Math.max(
          1,
          Math.ceil(remainingItems / itemsPerPage),
        );

        if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
        }
      }
    } catch (error) {
      console.error("Lỗi xóa bài viết:", error);

      showToast(
        "danger",
        error &&
          error.response &&
          error.response.data &&
          error.response.data.message
          ? error.response.data.message
          : "Không thể xoá bài viết.",
      );
    } finally {
      setLoading(false);
      handleCloseModalDelete();
    }
  };

  /* =====================================================
     CATEGORY LIST
  ===================================================== */

  const categories = useMemo(() => {
    const result = [];

    dataPost.forEach((post) => {
      const category = post.category_name || "";

      if (category && result.indexOf(category) === -1) {
        result.push(category);
      }
    });

    return result.sort();
  }, [dataPost]);

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return dataPost.filter((item) => {
      const title = item.title ? item.title.toLowerCase() : "";

      const description = item.description
        ? item.description.toLowerCase()
        : "";

      const category = item.category_name || "";

      const matchSearch =
        !keyword ||
        title.indexOf(keyword) !== -1 ||
        description.indexOf(keyword) !== -1;

      const matchCategory = !categoryFilter || category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [dataPost, searchTerm, categoryFilter]);

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,

    currentPage * itemsPerPage,
  );

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalTagCount = useMemo(() => {
    const tags = [];

    dataPost.forEach((post) => {
      const postTags = Array.isArray(post.tags) ? post.tags : [];

      postTags.forEach((tag) => {
        if (tag && tags.indexOf(tag.tag_id) === -1) {
          tags.push(tag.tag_id);
        }
      });
    });

    return tags.length;
  }, [dataPost]);

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  /* =====================================================
     RESET FILTER
  ===================================================== */

  const handleResetFilter = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="gt-container">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="gt-header">
        <div className="gt-header-info">
          <div className="gt-header-title-row">
            <div>
              <h2>Quản lý bài viết</h2>

              <p>
                Quản lý nội dung cẩm nang, tin tức và bài viết du lịch trên
                website.
              </p>
            </div>

            <span className="gt-total-badge">{dataPost.length} bài viết</span>
          </div>
        </div>

        <Button className="gt-btn-add" onClick={handleAddBlog}>
          <FaPlus />

          <span>Thêm bài viết</span>
        </Button>
      </div>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="gt-stats-grid">
        <div className="gt-stat-card">
          <div className="gt-stat-icon blue">
            <FaRegFileAlt />
          </div>

          <div>
            <span>Tổng bài viết</span>

            <strong>{dataPost.length}</strong>
          </div>
        </div>

        <div className="gt-stat-card">
          <div className="gt-stat-icon green">
            <FaFolderOpen />
          </div>

          <div>
            <span>Danh mục</span>

            <strong>{categories.length}</strong>
          </div>
        </div>

        <div className="gt-stat-card">
          <div className="gt-stat-icon orange">
            <FaTags />
          </div>

          <div>
            <span>Tags đang dùng</span>

            <strong>{totalTagCount}</strong>
          </div>
        </div>

        <div className="gt-stat-card">
          <div className="gt-stat-icon purple">
            <BsSearch />
          </div>

          <div>
            <span>Kết quả hiện tại</span>

            <strong>{filteredData.length}</strong>
          </div>
        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="gt-content-card">
        {/* ===============================================
            TOOLBAR
        =============================================== */}

        <div className="gt-toolbar">
          <div className="gt-toolbar-left">
            <div className="gt-search-box">
              <BsSearch />

              <input
                type="text"
                placeholder="Tìm theo tiêu đề hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);

                  setCurrentPage(1);
                }}
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                >
                  ×
                </button>
              )}
            </div>

            <Form.Select
              className="gt-category-filter"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);

                setCurrentPage(1);
              }}
            >
              <option value="">Tất cả danh mục</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Form.Select>

            {(searchTerm || categoryFilter) && (
              <button
                type="button"
                className="gt-reset-filter"
                onClick={handleResetFilter}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div className="gt-result-count">
            Hiển thị <strong>{currentItems.length}</strong> /{" "}
            <strong>{filteredData.length}</strong> bài viết
          </div>
        </div>

        {/* ===============================================
            DESKTOP TABLE
        =============================================== */}

        <div className="gt-table-desktop">
          <div className="table-responsive">
            <table className="gt-table">
              <thead>
                <tr>
                  <th className="gt-col-id">Mã</th>

                  <th className="gt-col-post">Bài viết</th>

                  <th className="gt-col-category">Danh mục</th>

                  <th className="gt-col-tags">Tags</th>

                  <th className="gt-col-date">Ngày tạo</th>

                  <th className="gt-col-user">Người tạo</th>

                  <th className="gt-col-action">Tác vụ</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="gt-loading-cell">
                      <Spinner animation="border" variant="primary" />

                      <span>Đang tải dữ liệu...</span>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((post) => {
                    const postTags = Array.isArray(post.tags) ? post.tags : [];

                    return (
                      <tr key={post.post_id}>
                        {/* ID */}

                        <td>
                          <span className="gt-id">#{post.post_id}</span>
                        </td>

                        {/* POST */}

                        <td>
                          <div className="gt-post-cell">
                            <div className="gt-img-wrapper">
                              {post.thumbnail_url ? (
                                <img
                                  src={post.thumbnail_url}
                                  alt={post.title}
                                />
                              ) : (
                                <div className="gt-no-image">
                                  <FaRegFileAlt />
                                </div>
                              )}
                            </div>

                            <div className="gt-post-info">
                              <button
                                type="button"
                                className="gt-title-link"
                                onClick={() => handleGoToDetail(post.post_id)}
                              >
                                {post.title}
                              </button>

                              <div className="gt-desc-short">
                                {post.description || "Chưa có mô tả ngắn."}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY */}

                        <td>
                          <span className="gt-cat-badge">
                            {post.category_name || "Chưa phân loại"}
                          </span>
                        </td>

                        {/* TAG */}

                        <td>
                          <div className="gt-tag-container">
                            {postTags.slice(0, 2).map((tag) => (
                              <span key={tag.tag_id} className="gt-tag-badge">
                                #{tag.tag_name}
                              </span>
                            ))}

                            {postTags.length > 2 && (
                              <span className="gt-tag-more">
                                +{postTags.length - 2}
                              </span>
                            )}

                            {postTags.length === 0 && (
                              <span className="gt-empty-value">—</span>
                            )}
                          </div>
                        </td>

                        {/* DATE */}

                        <td>
                          <span className="gt-date">
                            {formatDate(post.created_at)}
                          </span>
                        </td>

                        {/* USER */}

                        <td>
                          <span className="gt-user">
                            {post.created_by || "—"}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td>
                          <div className="gt-actions">
                            <button
                              type="button"
                              className="gt-btn view"
                              title="Xem chi tiết"
                              onClick={() => handleGoToDetail(post.post_id)}
                            >
                              <BsEye />
                            </button>

                            <button
                              type="button"
                              className="gt-btn edit"
                              title="Chỉnh sửa"
                              onClick={() => handleGoToEdit(post.post_id)}
                            >
                              <CiEdit />
                            </button>

                            <button
                              type="button"
                              className="gt-btn delete"
                              title="Xóa"
                              onClick={() => handleOpenModalDelete(post)}
                            >
                              <CiTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="gt-empty-table">
                      <div className="gt-empty-icon">
                        <BsSearch />
                      </div>

                      <strong>Không tìm thấy bài viết</strong>

                      <span>Thử thay đổi từ khóa hoặc bộ lọc danh mục.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===============================================
            MOBILE CARD
        =============================================== */}

        <div className="gt-mobile-list">
          {loading ? (
            <div className="gt-mobile-loading">
              <Spinner animation="border" variant="primary" />

              <span>Đang tải dữ liệu...</span>
            </div>
          ) : currentItems.length > 0 ? (
            currentItems.map((post) => {
              const postTags = Array.isArray(post.tags) ? post.tags : [];

              return (
                <div className="gt-mobile-card" key={post.post_id}>
                  <div
                    className="gt-mobile-image"
                    onClick={() => handleGoToDetail(post.post_id)}
                  >
                    {post.thumbnail_url ? (
                      <img src={post.thumbnail_url} alt={post.title} />
                    ) : (
                      <div className="gt-no-image">
                        <FaRegFileAlt />
                      </div>
                    )}

                    <span className="gt-mobile-id">#{post.post_id}</span>
                  </div>

                  <div className="gt-mobile-body">
                    <span className="gt-cat-badge">
                      {post.category_name || "Chưa phân loại"}
                    </span>

                    <h3 onClick={() => handleGoToDetail(post.post_id)}>
                      {post.title}
                    </h3>

                    <p>{post.description || "Chưa có mô tả ngắn."}</p>

                    {postTags.length > 0 && (
                      <div className="gt-mobile-tags">
                        {postTags.slice(0, 3).map((tag) => (
                          <span key={tag.tag_id}>#{tag.tag_name}</span>
                        ))}
                      </div>
                    )}

                    <div className="gt-mobile-meta">
                      <span>{formatDate(post.created_at)}</span>

                      <span>Người tạo: {post.created_by || "—"}</span>
                    </div>

                    <div className="gt-mobile-actions">
                      <button
                        className="view"
                        onClick={() => handleGoToDetail(post.post_id)}
                      >
                        <BsEye />
                        Xem
                      </button>

                      <button
                        className="edit"
                        onClick={() => handleGoToEdit(post.post_id)}
                      >
                        <CiEdit />
                        Sửa
                      </button>

                      <button
                        className="delete"
                        onClick={() => handleOpenModalDelete(post)}
                      >
                        <CiTrash />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="gt-mobile-empty">
              <BsSearch />

              <strong>Không tìm thấy bài viết</strong>

              <span>Hãy thử thay đổi bộ lọc.</span>
            </div>
          )}
        </div>

        {/* ===============================================
            PAGINATION
        =============================================== */}

        <div className="gt-pagination">
          <div className="gt-page-summary">
            <span>
              Trang <strong>{currentPage}</strong> /{" "}
              <strong>{totalPages}</strong>
            </span>
          </div>

          <div className="gt-page-btns">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((value) => value - 1)}
              title="Trang trước"
            >
              <BsCaretLeft />
            </button>

            <div className="gt-current-page">{currentPage}</div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((value) => value + 1)}
              title="Trang sau"
            >
              <BsCaretRight />
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          DELETE MODAL
      ================================================= */}

      <Modal
        show={openModalDelete}
        onHide={handleCloseModalDelete}
        centered
        size="sm"
      >
        <div className="gt-delete-modal">
          <div className="gt-delete-icon">
            <CiTrash />
          </div>

          <h5>Xóa bài viết?</h5>

          <p>Bạn có chắc chắn muốn xóa bài viết:</p>

          <strong className="gt-delete-title">{deletePostTitle}</strong>

          <div className="gt-delete-warning">
            Thao tác này không thể hoàn tác.
          </div>

          <div className="gt-delete-actions">
            <Button variant="light" onClick={handleCloseModalDelete}>
              Hủy
            </Button>

            <Button
              variant="danger"
              onClick={handleAgreeDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Đang xóa...
                </>
              ) : (
                "Xác nhận xóa"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* =================================================
          TOAST
      ================================================= */}

      <ToastContainer position="top-end" className="p-3">
        <Toast
          bg={toastVariant}
          show={successAlertOpen}
          onClose={() => setSuccessAlertOpen(false)}
          delay={3500}
          autohide
        >
          <Toast.Body className="text-white fw-bold">{alertMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default GuideTravelList;
