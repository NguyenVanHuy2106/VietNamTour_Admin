import React, { useEffect, useMemo, useState } from "react";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";

import { FaPlus, FaRegClock, FaSyncAlt } from "react-icons/fa";

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

const TimeType = () => {
  // ========================================================
  // DATA
  // ========================================================

  const [dataTimeType, setDataTimeType] = useState([]);

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

  const [tFTimeTypeValue, setTFTimeTypeValue] = useState("");

  const [tFDesValue, setTFDesValue] = useState("");

  const [status, setStatus] = useState(1);

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

      const response = await API.get("/timeType/get");

      setDataTimeType(response?.data?.data || []);
    } catch (err) {
      console.error("get TimeType error:", err);

      showToast(
        err?.response?.data?.message ||
          "Không thể tải danh sách loại thời gian.",
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

    setTFTimeTypeValue("");

    setTFDesValue("");

    setStatus(1);

    setIsError(false);

    setError("");

    setOpenModal(true);
  };

  // ========================================================
  // OPEN EDIT
  // ========================================================

  const handleOpenEdit = (item) => {
    setEditMode(true);

    setCurrentId(item.timetypeid);

    setTFTimeTypeValue(item.timetypename || "");

    setTFDesValue(item.description || "");

    setStatus(Number(item.status) || 1);

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
    const name = tFTimeTypeValue.trim();

    if (!name) {
      setError("Vui lòng nhập tên loại thời gian.");

      setIsError(true);

      return;
    }

    try {
      setSaving(true);

      setIsError(false);

      const payload = {
        timetypename: name,

        description: tFDesValue.trim(),

        status: status,

        created_by: userId,
      };

      let response;

      if (editMode) {
        response = await APIToken.put(`/timeType/update/${currentId}`, payload);
      } else {
        response = await APIToken.post("/timeType/add", payload);
      }

      if (response.status === 200 || response.status === 201) {
        showToast(
          editMode
            ? "Cập nhật loại thời gian thành công."
            : "Thêm loại thời gian thành công.",
        );

        setOpenModal(false);

        await getData();
      }
    } catch (err) {
      console.error("save TimeType error:", err);

      showToast(
        err?.response?.data?.message || "Không thể lưu loại thời gian.",
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
    setDeleteId(item.timetypeid);

    setDeleteName(item.timetypename || "");

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

      const response = await APIToken.delete(`/timeType/delete/${deleteId}`);

      if (response.status === 200) {
        showToast("Xóa loại thời gian thành công.");

        setOpenModalDelete(false);

        setDeleteId(null);

        setDeleteName("");

        await getData();
      }
    } catch (err) {
      console.error("delete TimeType error:", err);

      showToast(
        err?.response?.data?.message || "Không thể xóa loại thời gian.",
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
      return dataTimeType;
    }

    return dataTimeType.filter((item) => {
      const name = String(item.timetypename || "").toLowerCase();

      const description = String(item.description || "").toLowerCase();

      return name.includes(keyword) || description.includes(keyword);
    });
  }, [dataTimeType, searchTerm]);

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
    <div className="timet-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="timet-header">
        <div className="timet-header-info">
          <div className="timet-eyebrow">VIỆT NAM TOUR · KHAI BÁO</div>

          <h2>
            <FaRegClock />
            Quản lý loại thời gian
          </h2>

          <p>
            Quản lý danh mục các khung thời gian sử dụng cho chương trình tour.
          </p>
        </div>

        <div className="timet-header-actions">
          <button
            type="button"
            className="timet-refresh-btn"
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

          <Button className="timet-btn-add" onClick={handleOpenAdd}>
            <FaPlus />
            Thêm loại thời gian
          </Button>
        </div>
      </div>

      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <div className="timet-toolbar">
        <div className="timet-toolbar-info">
          <strong>Danh sách loại thời gian</strong>

          <span>
            Có <b>{filteredData.length}</b> loại thời gian
          </span>
        </div>

        <div className="timet-search">
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

      <div className="timet-content-card">
        {loading ? (
          <div className="timet-loading">
            <Spinner animation="border" />

            <span>Đang tải danh sách loại thời gian...</span>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="timet-empty">
            <FaRegClock />

            <h4>Chưa có dữ liệu</h4>

            <p>Không tìm thấy loại thời gian phù hợp.</p>

            {!searchTerm && (
              <Button className="timet-empty-add" onClick={handleOpenAdd}>
                <FaPlus />
                Thêm loại thời gian đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="timet-table-wrapper">
              <table className="timet-table">
                <thead>
                  <tr>
                    <th className="timet-col-id">Mã</th>

                    <th>Tên loại</th>

                    <th>Mô tả</th>

                    <th>Người tạo</th>

                    <th className="text-center">Trạng thái</th>

                    <th className="text-center">Tác vụ</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((item) => (
                    <tr key={item.timetypeid}>
                      {/* ID */}

                      <td>
                        <span className="timet-id">#{item.timetypeid}</span>
                      </td>

                      {/* NAME */}

                      <td>
                        <div className="timet-name">
                          <div className="timet-name-icon">
                            <FaRegClock />
                          </div>

                          <strong>{item.timetypename || "-"}</strong>
                        </div>
                      </td>

                      {/* DESCRIPTION */}

                      <td>
                        <div
                          className="timet-desc-cell"
                          title={item.description || ""}
                        >
                          {item.description || "Chưa có mô tả"}
                        </div>
                      </td>

                      {/* USER */}

                      <td>
                        <span className="timet-user">
                          {item.created_by ? `NV #${item.created_by}` : "Admin"}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td className="text-center">
                        <span
                          className={`timet-status ${
                            Number(item.status) === 1 ? "active" : "inactive"
                          }`}
                        >
                          <span className="timet-status-dot" />

                          {Number(item.status) === 1 ? "Hoạt động" : "Tạm dừng"}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="text-center">
                        <div className="timet-actions">
                          <button
                            type="button"
                            className="timet-action-btn edit"
                            title="Chỉnh sửa"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <CiEdit />
                          </button>

                          <button
                            type="button"
                            className="timet-action-btn delete"
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

            <div className="timet-pagination">
              <div className="timet-pagination-info">
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

              <div className="timet-pagination-control">
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
        dialogClassName="timet-form-modal"
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>
            <div className="timet-modal-icon">
              {editMode ? <CiEdit /> : <FaPlus />}
            </div>

            <div>
              <strong>
                {editMode ? "Cập nhật loại thời gian" : "Thêm loại thời gian"}
              </strong>

              <span>
                {editMode
                  ? "Điều chỉnh thông tin loại thời gian trong hệ thống."
                  : "Khai báo thêm một loại thời gian mới."}
              </span>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            {/* NAME */}

            <Form.Group className="timet-form-group">
              <Form.Label>
                Tên loại thời gian
                <span className="timet-required">*</span>
              </Form.Label>

              <Form.Control
                autoFocus
                value={tFTimeTypeValue}
                placeholder="Ví dụ: 2 ngày 1 đêm, 3 ngày 2 đêm..."
                isInvalid={isError}
                onChange={(e) => {
                  setTFTimeTypeValue(e.target.value);

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

            <Form.Group className="timet-form-group">
              <Form.Label>Mô tả</Form.Label>

              <Form.Control
                as="textarea"
                rows={4}
                value={tFDesValue}
                placeholder="Nhập mô tả ngắn về loại thời gian..."
                onChange={(e) => setTFDesValue(e.target.value)}
              />

              <div className="timet-character-count">
                {tFDesValue.length} ký tự
              </div>
            </Form.Group>

            {/* STATUS */}

            <Form.Group className="timet-form-group">
              <Form.Label>Trạng thái</Form.Label>

              <div className="timet-status-switch-box">
                <div>
                  <strong>
                    {status === 1 ? "Đang hoạt động" : "Tạm dừng"}
                  </strong>

                  <span>
                    {status === 1
                      ? "Loại thời gian này đang được phép sử dụng."
                      : "Loại thời gian này đang tạm ngưng sử dụng."}
                  </span>
                </div>

                <Form.Check
                  type="switch"
                  id="time-type-status-switch"
                  checked={status === 1}
                  onChange={(e) => setStatus(e.target.checked ? 1 : 2)}
                />
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            className="timet-modal-cancel"
            disabled={saving}
            onClick={handleCloseModal}
          >
            Hủy
          </Button>

          <Button
            className="timet-modal-save"
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
        dialogClassName="timet-delete-modal"
      >
        <div className="timet-delete-content">
          <div className="timet-delete-icon">
            <CiTrash />
          </div>

          <h4>Xóa loại thời gian?</h4>

          <p>
            Bạn có chắc chắn muốn xóa{" "}
            <strong>{deleteName || "loại thời gian này"}</strong>?
          </p>

          <div className="timet-delete-warning">
            Dữ liệu sau khi xóa có thể không khôi phục được.
          </div>

          <div className="timet-delete-actions">
            <Button
              className="timet-delete-cancel"
              disabled={deleting}
              onClick={() => setOpenModalDelete(false)}
            >
              Hủy
            </Button>

            <Button
              className="timet-delete-confirm"
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
          <Toast.Body className="text-white timet-toast-body">
            {alertMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default TimeType;
