import React, { useEffect, useMemo, useState } from "react";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";

import { FaPlus, FaImages, FaSyncAlt } from "react-icons/fa";

import { CiTrash, CiEdit } from "react-icons/ci";

import {
  Modal,
  Button,
  Form,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";

import "./index.css";

// ==========================================================
// CONFIG
// ==========================================================

const ITEMS_PER_PAGE = 10;

// ==========================================================
// COMPONENT
// ==========================================================

const ImageCategory = () => {
  // ========================================================
  // DATA
  // ========================================================

  const [dataImageCat, setDataImageCat] = useState([]);

  // ========================================================
  // LOADING
  // ========================================================

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  // ========================================================
  // SEARCH / PAGINATION
  // ========================================================

  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");

  // ========================================================
  // FORM
  // ========================================================

  const [openModal, setOpenModal] = useState(false);

  const [editMode, setEditMode] = useState(false);

  const [currentId, setCurrentId] = useState(null);

  const [tFImageCatValue, setTFImageCatValue] = useState("");

  const [tFDesValue, setTFDesValue] = useState("");

  const [isError, setIsError] = useState(false);

  const [error, setError] = useState("");

  // ========================================================
  // DELETE
  // ========================================================

  const [openModalDelete, setOpenModalDelete] = useState(false);

  const [deleteId, setDeleteId] = useState(null);

  const [deleteName, setDeleteName] = useState("");

  // ========================================================
  // TOAST
  // ========================================================

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);

  const [alertMessage, setAlertMessage] = useState("");

  const [toastType, setToastType] = useState("success");

  // ========================================================
  // USER
  // ========================================================

  const userId = localStorage.getItem("userId");

  // ========================================================
  // TOAST
  // ========================================================

  const showToast = (message, type = "success") => {
    setAlertMessage(message);
    setToastType(type);
    setSuccessAlertOpen(true);
  };

  // ========================================================
  // GET DATA
  // ========================================================

  const getData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await API.get("/imgCat/get");

      setDataImageCat(response?.data?.data || []);
    } catch (err) {
      console.error("get ImageCategory error:", err);

      showToast(
        err?.response?.data?.message ||
          "Không thể tải danh sách danh mục hình ảnh.",
        "danger",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ========================================================
  // FIRST LOAD
  // ========================================================

  useEffect(() => {
    getData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================================================
  // OPEN ADD
  // ========================================================

  const handleOpenAdd = () => {
    setEditMode(false);

    setCurrentId(null);

    setTFImageCatValue("");

    setTFDesValue("");

    setIsError(false);

    setError("");

    setOpenModal(true);
  };

  // ========================================================
  // OPEN EDIT
  // ========================================================

  const handleOpenEdit = (item) => {
    setEditMode(true);

    setCurrentId(item.id);

    setTFImageCatValue(item.name || "");

    setTFDesValue(item.description || "");

    setIsError(false);

    setError("");

    setOpenModal(true);
  };

  // ========================================================
  // CLOSE FORM
  // ========================================================

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setOpenModal(false);

    setIsError(false);

    setError("");
  };

  // ========================================================
  // SAVE
  // ========================================================

  const handleSave = async () => {
    const name = tFImageCatValue.trim();

    if (!name) {
      setError("Vui lòng nhập tên danh mục.");

      setIsError(true);

      return;
    }

    try {
      setSaving(true);

      setIsError(false);

      const payload = {
        name,

        description: tFDesValue.trim(),

        created_by: userId,
      };

      let response;

      if (editMode) {
        response = await APIToken.put(`/imgCat/update/${currentId}`, payload);
      } else {
        response = await APIToken.post("/imgCat/add", payload);
      }

      if (response.status === 200 || response.status === 201) {
        showToast(
          editMode
            ? "Cập nhật danh mục hình ảnh thành công."
            : "Thêm danh mục hình ảnh thành công.",
        );

        setOpenModal(false);

        await getData();
      }
    } catch (err) {
      console.error("save ImageCategory error:", err);

      showToast(
        err?.response?.data?.message || "Không thể lưu danh mục hình ảnh.",
        "danger",
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // OPEN DELETE
  // ========================================================

  const handleOpenDelete = (item) => {
    setDeleteId(item.id);

    setDeleteName(item.name || "");

    setOpenModalDelete(true);
  };

  // ========================================================
  // DELETE
  // ========================================================

  const handleAgreeDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      setDeleting(true);

      const response = await APIToken.delete(`/imgCat/delete/${deleteId}`);

      if (response.status === 200) {
        showToast("Xóa danh mục hình ảnh thành công.");

        setOpenModalDelete(false);

        setDeleteId(null);

        setDeleteName("");

        await getData();
      }
    } catch (err) {
      console.error("delete ImageCategory error:", err);

      showToast(
        err?.response?.data?.message || "Không thể xóa danh mục hình ảnh.",
        "danger",
      );
    } finally {
      setDeleting(false);
    }
  };

  // ========================================================
  // SEARCH
  // ========================================================

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return dataImageCat;
    }

    return dataImageCat.filter((item) => {
      const name = String(item.name || "").toLowerCase();

      const description = String(item.description || "").toLowerCase();

      return name.includes(keyword) || description.includes(keyword);
    });
  }, [dataImageCat, searchTerm]);

  // ========================================================
  // PAGINATION
  // ========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const indexOfFirstItem = (safePage - 1) * ITEMS_PER_PAGE;

  const currentItems = filteredData.slice(
    indexOfFirstItem,
    indexOfFirstItem + ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="imgc-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="imgc-header">
        <div className="imgc-header-info">
          <div className="imgc-eyebrow">VIỆT NAM TOUR · KHAI BÁO</div>

          <h2>
            <FaImages />
            Danh mục hình ảnh
          </h2>

          <p>Quản lý các nhóm phân loại hình ảnh sử dụng trong hệ thống.</p>
        </div>

        <div className="imgc-header-actions">
          <button
            type="button"
            className="imgc-refresh-btn"
            disabled={refreshing}
            onClick={() => getData(true)}
          >
            {refreshing ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <FaSyncAlt />
            )}
            Làm mới
          </button>

          <Button className="imgc-btn-add" onClick={handleOpenAdd}>
            <FaPlus />
            Thêm danh mục
          </Button>
        </div>
      </div>

      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <div className="imgc-toolbar">
        <div className="imgc-toolbar-info">
          <strong>Danh sách danh mục hình ảnh</strong>

          <span>
            Có <b>{filteredData.length}</b> danh mục
          </span>
        </div>

        <div className="imgc-search">
          <BsSearch />

          <input
            type="text"
            value={searchTerm}
            placeholder="Tìm tên hoặc mô tả..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="imgc-content-card">
        {loading ? (
          <div className="imgc-loading">
            <Spinner animation="border" />

            <span>Đang tải danh mục hình ảnh...</span>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="imgc-empty">
            <FaImages />

            <h4>Chưa có dữ liệu</h4>

            <p>Không tìm thấy danh mục hình ảnh phù hợp.</p>

            {!searchTerm && (
              <Button className="imgc-empty-add" onClick={handleOpenAdd}>
                <FaPlus />
                Thêm danh mục đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="imgc-table-wrapper">
              <table className="imgc-table">
                <thead>
                  <tr>
                    <th className="imgc-col-id">Mã</th>

                    <th>Tên danh mục</th>

                    <th>Mô tả</th>

                    <th>Người thêm</th>

                    <th className="text-center">Trạng thái</th>

                    <th className="text-center">Tác vụ</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((item) => (
                    <tr key={item.id}>
                      {/* ID */}

                      <td>
                        <span className="imgc-id">#{item.id}</span>
                      </td>

                      {/* NAME */}

                      <td>
                        <div className="imgc-name">
                          <div className="imgc-name-icon">
                            <FaImages />
                          </div>

                          <strong>{item.name || "-"}</strong>
                        </div>
                      </td>

                      {/* DESCRIPTION */}

                      <td>
                        <div
                          className="imgc-desc-cell"
                          title={item.description || ""}
                        >
                          {item.description || "Chưa có mô tả"}
                        </div>
                      </td>

                      {/* USER */}

                      <td>
                        <span className="imgc-user">
                          {item.created_by ? `NV #${item.created_by}` : "Admin"}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td className="text-center">
                        <span className="imgc-status active">
                          <span className="imgc-status-dot" />
                          Hoạt động
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="text-center">
                        <div className="imgc-actions">
                          <button
                            type="button"
                            className="imgc-action-btn edit"
                            title="Chỉnh sửa"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <CiEdit />
                          </button>

                          <button
                            type="button"
                            className="imgc-action-btn delete"
                            title="Xóa"
                            onClick={() => handleOpenDelete(item)}
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

            {/* ==================================================
                PAGINATION
            ================================================== */}

            <div className="imgc-pagination">
              <div className="imgc-pagination-info">
                Hiển thị <strong>{indexOfFirstItem + 1}</strong>
                {" - "}
                <strong>
                  {Math.min(
                    indexOfFirstItem + ITEMS_PER_PAGE,
                    filteredData.length,
                  )}
                </strong>
                {" / "}
                <strong>{filteredData.length}</strong>
              </div>

              <div className="imgc-pagination-control">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() =>
                    setCurrentPage((current) => Math.max(1, current - 1))
                  }
                >
                  <BsCaretLeft />
                </button>

                <span>
                  Trang <strong>{safePage}</strong>
                  {" / "}
                  <strong>{totalPages}</strong>
                </span>

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setCurrentPage((current) =>
                      Math.min(totalPages, current + 1),
                    )
                  }
                >
                  <BsCaretRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ==================================================
          FORM MODAL
      ================================================== */}

      <Modal
        show={openModal}
        onHide={handleCloseModal}
        centered
        backdrop={saving ? "static" : true}
        keyboard={!saving}
        dialogClassName="imgc-form-modal"
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>
            <div className="imgc-modal-icon">
              {editMode ? <CiEdit /> : <FaPlus />}
            </div>

            <div>
              <strong>
                {editMode
                  ? "Cập nhật danh mục hình ảnh"
                  : "Thêm danh mục hình ảnh"}
              </strong>

              <span>
                {editMode
                  ? "Điều chỉnh thông tin nhóm hình ảnh trong hệ thống."
                  : "Khai báo thêm một nhóm hình ảnh mới."}
              </span>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            {/* NAME */}

            <Form.Group className="imgc-form-group">
              <Form.Label>
                Tên danh mục hình
                <span className="imgc-required">*</span>
              </Form.Label>

              <Form.Control
                autoFocus
                value={tFImageCatValue}
                placeholder="Ví dụ: Hình ảnh tour, khách sạn, nhà hàng..."
                isInvalid={isError}
                onChange={(e) => {
                  setTFImageCatValue(e.target.value);

                  if (e.target.value.trim()) {
                    setIsError(false);
                  }
                }}
              />

              <Form.Control.Feedback type="invalid">
                {error}
              </Form.Control.Feedback>
            </Form.Group>

            {/* DESCRIPTION */}

            <Form.Group className="imgc-form-group">
              <Form.Label>Mô tả</Form.Label>

              <Form.Control
                as="textarea"
                rows={4}
                value={tFDesValue}
                placeholder="Nhập mô tả ngắn về danh mục hình ảnh..."
                onChange={(e) => setTFDesValue(e.target.value)}
              />

              <div className="imgc-character-count">
                {tFDesValue.length} ký tự
              </div>
            </Form.Group>

            {/* STATUS */}

            <Form.Group className="imgc-form-group">
              <Form.Label>Trạng thái</Form.Label>

              <div className="imgc-status-box">
                <div>
                  <strong>Đang hoạt động</strong>

                  <span>
                    Danh mục này đang được phép sử dụng trong hệ thống.
                  </span>
                </div>

                <Form.Check
                  type="switch"
                  checked
                  disabled
                  id="img-category-status"
                />
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            className="imgc-modal-cancel"
            disabled={saving}
            onClick={handleCloseModal}
          >
            Hủy
          </Button>

          <Button
            className="imgc-modal-save"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" />
                Đang lưu...
              </>
            ) : (
              <>
                {editMode ? <CiEdit /> : <FaPlus />}

                {editMode ? "Cập nhật" : "Thêm mới"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ==================================================
          DELETE MODAL
      ================================================== */}

      <Modal
        show={openModalDelete}
        onHide={() => {
          if (deleting) {
            return;
          }

          setOpenModalDelete(false);
        }}
        centered
        backdrop={deleting ? "static" : true}
        keyboard={!deleting}
        dialogClassName="imgc-delete-modal"
      >
        <div className="imgc-delete-content">
          <div className="imgc-delete-icon">
            <CiTrash />
          </div>

          <h4>Xóa danh mục hình ảnh?</h4>

          <p>
            Bạn có chắc chắn muốn xóa{" "}
            <strong>{deleteName || "danh mục này"}</strong>?
          </p>

          <div className="imgc-delete-warning">
            Dữ liệu sau khi xóa có thể không khôi phục được.
          </div>

          <div className="imgc-delete-actions">
            <Button
              className="imgc-delete-cancel"
              disabled={deleting}
              onClick={() => setOpenModalDelete(false)}
            >
              Hủy
            </Button>

            <Button
              className="imgc-delete-confirm"
              disabled={deleting}
              onClick={handleAgreeDelete}
            >
              {deleting ? (
                <>
                  <Spinner animation="border" size="sm" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <CiTrash />
                  Xác nhận xóa
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================================================
          TOAST
      ================================================== */}

      <ToastContainer position="top-end" className="p-3">
        <Toast
          bg={toastType}
          show={successAlertOpen}
          onClose={() => setSuccessAlertOpen(false)}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white imgc-toast-body">
            {alertMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default ImageCategory;
