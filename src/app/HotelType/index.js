import React, { useEffect, useMemo, useState } from "react";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";

import { FaPlus, FaHotel, FaSyncAlt } from "react-icons/fa";

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

const HotelType = () => {
  // ========================================================
  // DATA
  // ========================================================

  const [dataHotelType, setDataHotelType] = useState([]);

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

  const [tFHotelTypeValue, setTFHotelTypeValue] = useState("");

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

      const response = await API.get("/hotelType/get");

      setDataHotelType(response?.data?.data || []);
    } catch (err) {
      console.error("get HotelType error:", err);

      showToast(
        err?.response?.data?.message || "Không thể tải danh sách loại nơi ở.",
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

    setTFHotelTypeValue("");

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

    setCurrentId(item.hoteltypeid);

    setTFHotelTypeValue(item.hoteltypename || "");

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
    const name = tFHotelTypeValue.trim();

    if (!name) {
      setError("Vui lòng nhập tên loại nơi ở.");

      setIsError(true);

      return;
    }

    try {
      setSaving(true);

      setIsError(false);

      const payload = {
        hoteltypename: name,

        description: tFDesValue.trim(),

        created_by: userId,
      };

      let response;

      if (editMode) {
        response = await APIToken.put(
          `/hotelType/update/${currentId}`,
          payload,
        );
      } else {
        response = await APIToken.post("/hotelType/add", payload);
      }

      if (response.status === 200 || response.status === 201) {
        showToast(
          editMode
            ? "Cập nhật loại nơi ở thành công."
            : "Thêm loại nơi ở thành công.",
        );

        setOpenModal(false);

        await getData();
      }
    } catch (err) {
      console.error("save HotelType error:", err);

      showToast(
        err?.response?.data?.message || "Không thể lưu loại nơi ở.",
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
    setDeleteId(item.hoteltypeid);

    setDeleteName(item.hoteltypename || "");

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

      const response = await APIToken.delete(`/hotelType/delete/${deleteId}`);

      if (response.status === 200) {
        showToast("Xóa loại nơi ở thành công.");

        setOpenModalDelete(false);

        setDeleteId(null);

        setDeleteName("");

        await getData();
      }
    } catch (err) {
      console.error("delete HotelType error:", err);

      showToast(
        err?.response?.data?.message || "Không thể xóa loại nơi ở.",
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
      return dataHotelType;
    }

    return dataHotelType.filter((item) => {
      const name = String(item.hoteltypename || "").toLowerCase();

      const description = String(item.description || "").toLowerCase();

      return name.includes(keyword) || description.includes(keyword);
    });
  }, [dataHotelType, searchTerm]);

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
    <div className="ht-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="ht-header">
        <div className="ht-header-info">
          <div className="ht-eyebrow">VIỆT NAM TOUR · KHAI BÁO</div>

          <h2>
            <FaHotel />
            Quản lý loại nơi ở
          </h2>

          <p>
            Quản lý danh mục các loại hình lưu trú như khách sạn, resort, villa,
            homestay...
          </p>
        </div>

        <div className="ht-header-actions">
          <button
            type="button"
            className="ht-refresh-btn"
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

          <Button className="ht-btn-add" onClick={handleOpenAdd}>
            <FaPlus />
            Thêm loại nơi ở
          </Button>
        </div>
      </div>

      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <div className="ht-toolbar">
        <div className="ht-toolbar-info">
          <strong>Danh sách loại nơi ở</strong>

          <span>
            Có <b>{filteredData.length}</b> loại nơi ở
          </span>
        </div>

        <div className="ht-search">
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

      <div className="ht-content-card">
        {loading ? (
          <div className="ht-loading">
            <Spinner animation="border" />

            <span>Đang tải danh sách loại nơi ở...</span>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="ht-empty">
            <FaHotel />

            <h4>Chưa có dữ liệu</h4>

            <p>Không tìm thấy loại nơi ở phù hợp.</p>

            {!searchTerm && (
              <Button className="ht-empty-add" onClick={handleOpenAdd}>
                <FaPlus />
                Thêm loại nơi ở đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="ht-table-wrapper">
              <table className="ht-table">
                <thead>
                  <tr>
                    <th className="ht-col-id">Mã</th>

                    <th>Loại nơi ở</th>

                    <th>Mô tả</th>

                    <th>Người tạo</th>

                    <th>Ngày tạo</th>

                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((item) => (
                    <tr key={item.hoteltypeid}>
                      {/* ID */}

                      <td>
                        <span className="ht-id">#{item.hoteltypeid}</span>
                      </td>

                      {/* NAME */}

                      <td>
                        <div className="ht-name">
                          <div className="ht-name-icon">
                            <FaHotel />
                          </div>

                          <strong>{item.hoteltypename || "-"}</strong>
                        </div>
                      </td>

                      {/* DESCRIPTION */}

                      <td>
                        <div
                          className="ht-desc-cell"
                          title={item.description || ""}
                        >
                          {item.description || "Chưa có mô tả"}
                        </div>
                      </td>

                      {/* CREATOR */}

                      <td>
                        <span className="ht-user">
                          {item.created_by ? `NV #${item.created_by}` : "Admin"}
                        </span>
                      </td>

                      {/* CREATED DATE */}

                      <td>
                        <span className="ht-date">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString(
                                "vi-VN",
                              )
                            : "-"}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="text-center">
                        <div className="ht-actions">
                          <button
                            type="button"
                            className="ht-action-btn edit"
                            title="Chỉnh sửa"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <CiEdit />
                          </button>

                          <button
                            type="button"
                            className="ht-action-btn delete"
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

            <div className="ht-pagination">
              <div className="ht-pagination-info">
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

              <div className="ht-pagination-control">
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
        dialogClassName="ht-form-modal"
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>
            <div className="ht-modal-icon">
              {editMode ? <CiEdit /> : <FaPlus />}
            </div>

            <div>
              <strong>
                {editMode ? "Cập nhật loại nơi ở" : "Thêm loại nơi ở"}
              </strong>

              <span>
                {editMode
                  ? "Điều chỉnh thông tin loại hình lưu trú trong hệ thống."
                  : "Khai báo thêm một loại hình lưu trú mới."}
              </span>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="ht-form-group">
              <Form.Label>
                Tên loại nơi ở<span className="ht-required">*</span>
              </Form.Label>

              <Form.Control
                autoFocus
                value={tFHotelTypeValue}
                placeholder="Ví dụ: Khách sạn 4 sao, Resort, Villa..."
                isInvalid={isError}
                onChange={(e) => {
                  setTFHotelTypeValue(e.target.value);

                  if (e.target.value.trim()) {
                    setIsError(false);
                  }
                }}
              />

              <Form.Control.Feedback type="invalid">
                {error}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="ht-form-group">
              <Form.Label>Mô tả</Form.Label>

              <Form.Control
                as="textarea"
                rows={4}
                value={tFDesValue}
                placeholder="Nhập mô tả ngắn về loại nơi ở..."
                onChange={(e) => setTFDesValue(e.target.value)}
              />

              <div className="ht-character-count">
                {tFDesValue.length} ký tự
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            className="ht-modal-cancel"
            disabled={saving}
            onClick={handleCloseModal}
          >
            Hủy
          </Button>

          <Button
            className="ht-modal-save"
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
        dialogClassName="ht-delete-modal"
      >
        <div className="ht-delete-content">
          <div className="ht-delete-icon">
            <CiTrash />
          </div>

          <h4>Xóa loại nơi ở?</h4>

          <p>
            Bạn có chắc chắn muốn xóa{" "}
            <strong>{deleteName || "loại nơi ở này"}</strong>?
          </p>

          <div className="ht-delete-warning">
            Dữ liệu sau khi xóa có thể không khôi phục được.
          </div>

          <div className="ht-delete-actions">
            <Button
              className="ht-delete-cancel"
              disabled={deleting}
              onClick={() => setOpenModalDelete(false)}
            >
              Hủy
            </Button>

            <Button
              className="ht-delete-confirm"
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
          <Toast.Body className="text-white ht-toast-body">
            {alertMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default HotelType;
