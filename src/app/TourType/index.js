import React, { useEffect, useMemo, useState } from "react";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";

import { FaPlus, FaRoute, FaSyncAlt } from "react-icons/fa";

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

// ==========================================================
// CONFIG
// ==========================================================

const ITEMS_PER_PAGE = 10;

// ==========================================================
// COMPONENT
// ==========================================================

const TourType = () => {
  // ========================================================
  // DATA
  // ========================================================

  const [dataTourType, setDataTourType] = useState([]);

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
  // FORM MODAL
  // ========================================================

  const [openModal, setOpenModal] = useState(false);

  const [editMode, setEditMode] = useState(false);

  const [currentId, setCurrentId] = useState(null);

  const [tFTourTypeValue, setTFTourTypeValue] = useState("");

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

      const response = await API.get("/tourType/get");

      setDataTourType(response?.data?.data || []);
    } catch (err) {
      console.error("get TourType error:", err);

      showToast(
        err?.response?.data?.message || "Không thể tải danh sách loại tour.",
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

    setTFTourTypeValue("");

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

    setCurrentId(item.tourtypeid);

    setTFTourTypeValue(item.tourtypename || "");

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
    const name = tFTourTypeValue.trim();

    if (!name) {
      setError("Vui lòng nhập tên loại tour.");

      setIsError(true);

      return;
    }

    try {
      setSaving(true);

      setIsError(false);

      const payload = {
        tourtypename: name,

        description: tFDesValue.trim(),

        created_by: userId,
      };

      let response;

      if (editMode) {
        response = await APIToken.put(`/tourType/update/${currentId}`, payload);
      } else {
        response = await APIToken.post("/tourType/add", payload);
      }

      if (response.status === 200 || response.status === 201) {
        showToast(
          editMode
            ? "Cập nhật loại tour thành công."
            : "Thêm loại tour thành công.",
        );

        setOpenModal(false);

        await getData();
      }
    } catch (err) {
      console.error("save TourType error:", err);

      showToast(
        err?.response?.data?.message || "Không thể lưu loại tour.",
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
    setDeleteId(item.tourtypeid);

    setDeleteName(item.tourtypename || "");

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

      const response = await APIToken.delete(`/tourType/delete/${deleteId}`);

      if (response.status === 200) {
        showToast("Xóa loại tour thành công.");

        setOpenModalDelete(false);

        setDeleteId(null);

        setDeleteName("");

        await getData();
      }
    } catch (err) {
      console.error("delete TourType error:", err);

      showToast(
        err?.response?.data?.message || "Không thể xóa loại tour.",
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
      return dataTourType;
    }

    return dataTourType.filter((item) => {
      const name = String(item.tourtypename || "").toLowerCase();

      const description = String(item.description || "").toLowerCase();

      return name.includes(keyword) || description.includes(keyword);
    });
  }, [dataTourType, searchTerm]);

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
    <div className="tt-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="tt-header">
        <div className="tt-header-info">
          <div className="tt-eyebrow">VIỆT NAM TOUR · KHAI BÁO</div>

          <h2>
            <FaRoute />
            Quản lý loại tour
          </h2>

          <p>
            Quản lý danh mục các loại hình tour và dịch vụ đang sử dụng trong hệ
            thống.
          </p>
        </div>

        <div className="tt-header-actions">
          <button
            type="button"
            className="tt-refresh-btn"
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

          <Button className="tt-btn-add" onClick={handleOpenAdd}>
            <FaPlus />
            Thêm loại tour
          </Button>
        </div>
      </div>

      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <div className="tt-toolbar">
        <div className="tt-toolbar-info">
          <strong>Danh sách loại tour</strong>

          <span>
            Có <b>{filteredData.length}</b> loại tour
          </span>
        </div>

        <div className="tt-search">
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

      <div className="tt-content-card">
        {loading ? (
          <div className="tt-loading">
            <Spinner animation="border" />

            <span>Đang tải danh sách loại tour...</span>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="tt-empty">
            <FaRoute />

            <h4>Chưa có dữ liệu</h4>

            <p>Không tìm thấy loại tour phù hợp.</p>

            {!searchTerm && (
              <Button className="tt-empty-add" onClick={handleOpenAdd}>
                <FaPlus />
                Thêm loại tour đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="tt-table-wrapper">
              <table className="tt-table">
                <thead>
                  <tr>
                    <th className="tt-col-id">Mã</th>

                    <th>Tên loại tour</th>

                    <th>Mô tả</th>

                    <th>Người tạo</th>

                    <th className="text-center">Trạng thái</th>

                    <th className="text-center">Tác vụ</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((item) => (
                    <tr key={item.tourtypeid}>
                      {/* ID */}

                      <td>
                        <span className="tt-id">#{item.tourtypeid}</span>
                      </td>

                      {/* NAME */}

                      <td>
                        <div className="tt-name">
                          <div className="tt-name-icon">
                            <FaRoute />
                          </div>

                          <strong>{item.tourtypename || "-"}</strong>
                        </div>
                      </td>

                      {/* DESCRIPTION */}

                      <td>
                        <div
                          className="tt-desc-cell"
                          title={item.description || ""}
                        >
                          {item.description || "Chưa có mô tả"}
                        </div>
                      </td>

                      {/* CREATOR */}

                      <td>
                        <span className="tt-user">
                          {item.created_by ? `NV #${item.created_by}` : "Admin"}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td className="text-center">
                        <span
                          className={`tt-status ${
                            Number(item.status) === 1 ? "active" : "inactive"
                          }`}
                        >
                          <span className="tt-status-dot" />

                          {Number(item.status) === 1 ? "Hoạt động" : "Tạm dừng"}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="text-center">
                        <div className="tt-actions">
                          <button
                            type="button"
                            className="tt-action-btn edit"
                            title="Chỉnh sửa"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <CiEdit />
                          </button>

                          <button
                            type="button"
                            className="tt-action-btn delete"
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

            {/* ==============================================
                PAGINATION
            ============================================== */}

            <div className="tt-pagination">
              <div className="tt-pagination-info">
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

              <div className="tt-pagination-control">
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
        dialogClassName="tt-form-modal"
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>
            <div className="tt-modal-icon">
              {editMode ? <CiEdit /> : <FaPlus />}
            </div>

            <div>
              <strong>
                {editMode ? "Cập nhật loại tour" : "Thêm loại tour"}
              </strong>

              <span>
                {editMode
                  ? "Điều chỉnh thông tin loại tour trong hệ thống."
                  : "Khai báo thêm một loại tour mới."}
              </span>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="tt-form-group">
              <Form.Label>
                Tên loại tour
                <span className="tt-required">*</span>
              </Form.Label>

              <Form.Control
                autoFocus
                value={tFTourTypeValue}
                placeholder="Ví dụ: Tour trong nước"
                isInvalid={isError}
                onChange={(e) => {
                  setTFTourTypeValue(e.target.value);

                  if (e.target.value.trim()) {
                    setIsError(false);
                  }
                }}
              />

              <Form.Control.Feedback type="invalid">
                {error}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="tt-form-group">
              <Form.Label>Mô tả</Form.Label>

              <Form.Control
                as="textarea"
                rows={4}
                value={tFDesValue}
                placeholder="Nhập mô tả ngắn về loại tour..."
                onChange={(e) => setTFDesValue(e.target.value)}
              />

              <div className="tt-character-count">
                {tFDesValue.length} ký tự
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            className="tt-modal-cancel"
            disabled={saving}
            onClick={handleCloseModal}
          >
            Hủy
          </Button>

          <Button
            className="tt-modal-save"
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
        dialogClassName="tt-delete-modal"
      >
        <div className="tt-delete-content">
          <div className="tt-delete-icon">
            <CiTrash />
          </div>

          <h4>Xóa loại tour?</h4>

          <p>
            Bạn có chắc chắn muốn xóa{" "}
            <strong>{deleteName || "loại tour này"}</strong>?
          </p>

          <div className="tt-delete-warning">
            Dữ liệu sau khi xóa có thể không khôi phục được.
          </div>

          <div className="tt-delete-actions">
            <Button
              className="tt-delete-cancel"
              disabled={deleting}
              onClick={() => setOpenModalDelete(false)}
            >
              Hủy
            </Button>

            <Button
              className="tt-delete-confirm"
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
          <Toast.Body className="text-white tt-toast-body">
            {alertMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default TourType;
