import React, { useEffect, useMemo, useState } from "react";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { BsCaretLeft, BsCaretRight, BsSearch } from "react-icons/bs";

import { FaPlus, FaBus, FaSyncAlt, FaImage } from "react-icons/fa";

import { CiTrash, CiEdit } from "react-icons/ci";

import {
  Button,
  Modal,
  Form,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";

import ImageCDNCloud from "../../components/ImageCDNCloud";

import "./index.css";

// ==========================================================
// CONFIG
// ==========================================================

const ITEMS_PER_PAGE = 10;

// ==========================================================
// COMPONENT
// ==========================================================

const VehicleType = () => {
  // ========================================================
  // DATA
  // ========================================================

  const [dataVehicleType, setDataVehicleType] = useState([]);

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

  const [tFVehicleTypeValue, setTFVehicleTypeValue] = useState("");

  const [tFDesValue, setTFDesValue] = useState("");

  const [imageLink, setImageLink] = useState("");

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

      const response = await API.get("/vehicleType/get");

      setDataVehicleType(response?.data?.data || []);
    } catch (err) {
      console.error("get VehicleType error:", err);

      showToast(
        err?.response?.data?.message ||
          "Không thể tải danh sách loại phương tiện.",
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

    setTFVehicleTypeValue("");

    setTFDesValue("");

    setImageLink("");

    setIsError(false);

    setError("");

    setOpenModal(true);
  };

  // ========================================================
  // OPEN EDIT
  // ========================================================

  const handleOpenEdit = (item) => {
    setEditMode(true);

    setCurrentId(item.vehicletypeid);

    setTFVehicleTypeValue(item.vehicletypename || "");

    setTFDesValue(item.description || "");

    setImageLink(item.vehicletypeicon || "");

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
    const name = tFVehicleTypeValue.trim();

    if (!name) {
      setError("Vui lòng nhập tên loại phương tiện.");

      setIsError(true);

      return;
    }

    try {
      setSaving(true);

      setIsError(false);

      const payload = {
        vehicletypename: name,

        vehicletypeicon: imageLink,

        description: tFDesValue.trim(),

        created_by: userId,
      };

      let response;

      if (editMode) {
        response = await APIToken.put(
          `/vehicleType/update/${currentId}`,
          payload,
        );
      } else {
        response = await APIToken.post("/vehicleType/add", payload);
      }

      if (response.status === 200 || response.status === 201) {
        showToast(
          editMode
            ? "Cập nhật loại phương tiện thành công."
            : "Thêm loại phương tiện thành công.",
        );

        setOpenModal(false);

        await getData();
      }
    } catch (err) {
      console.error("save VehicleType error:", err);

      showToast(
        err?.response?.data?.message || "Không thể lưu loại phương tiện.",
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
    setDeleteId(item.vehicletypeid);

    setDeleteName(item.vehicletypename || "");

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

      const response = await APIToken.delete(`/vehicleType/delete/${deleteId}`);

      if (response.status === 200) {
        showToast("Xóa loại phương tiện thành công.");

        setOpenModalDelete(false);

        setDeleteId(null);

        setDeleteName("");

        await getData();
      }
    } catch (err) {
      console.error("delete VehicleType error:", err);

      showToast(
        err?.response?.data?.message || "Không thể xóa loại phương tiện.",
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
      return dataVehicleType;
    }

    return dataVehicleType.filter((item) => {
      const name = String(item.vehicletypename || "").toLowerCase();

      const description = String(item.description || "").toLowerCase();

      return name.includes(keyword) || description.includes(keyword);
    });
  }, [dataVehicleType, searchTerm]);

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
    <div className="vt-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="vt-header">
        <div className="vt-header-info">
          <div className="vt-eyebrow">VIỆT NAM TOUR · KHAI BÁO</div>

          <h2>
            <FaBus />
            Quản lý loại phương tiện
          </h2>

          <p>
            Quản lý danh mục phương tiện vận chuyển như xe khách, limousine, máy
            bay, tàu hỏa...
          </p>
        </div>

        <div className="vt-header-actions">
          <button
            type="button"
            className="vt-refresh-btn"
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

          <Button className="vt-btn-add" onClick={handleOpenAdd}>
            <FaPlus />
            Thêm phương tiện
          </Button>
        </div>
      </div>

      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <div className="vt-toolbar">
        <div className="vt-toolbar-info">
          <strong>Danh sách loại phương tiện</strong>

          <span>
            Có <b>{filteredData.length}</b> loại phương tiện
          </span>
        </div>

        <div className="vt-search">
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

      <div className="vt-content-card">
        {loading ? (
          <div className="vt-loading">
            <Spinner animation="border" />

            <span>Đang tải danh sách loại phương tiện...</span>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="vt-empty">
            <FaBus />

            <h4>Chưa có dữ liệu</h4>

            <p>Không tìm thấy loại phương tiện phù hợp.</p>

            {!searchTerm && (
              <Button className="vt-empty-add" onClick={handleOpenAdd}>
                <FaPlus />
                Thêm phương tiện đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="vt-table-wrapper">
              <table className="vt-table">
                <thead>
                  <tr>
                    <th className="vt-col-id">Mã</th>

                    <th className="vt-col-image">Hình ảnh</th>

                    <th>Loại phương tiện</th>

                    <th>Mô tả</th>

                    <th>Ngày tạo</th>

                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((item) => (
                    <tr key={item.vehicletypeid}>
                      {/* ID */}

                      <td>
                        <span className="vt-id">#{item.vehicletypeid}</span>
                      </td>

                      {/* IMAGE */}

                      <td>
                        <div className="vt-img-container">
                          {item.vehicletypeicon ? (
                            <img
                              src={item.vehicletypeicon}
                              alt={item.vehicletypename || "Phương tiện"}
                              className="vt-icon-img"
                            />
                          ) : (
                            <FaBus />
                          )}
                        </div>
                      </td>

                      {/* NAME */}

                      <td>
                        <div className="vt-name">
                          <div className="vt-name-icon">
                            <FaBus />
                          </div>

                          <strong>{item.vehicletypename || "-"}</strong>
                        </div>
                      </td>

                      {/* DESCRIPTION */}

                      <td>
                        <div
                          className="vt-desc-text"
                          title={item.description || ""}
                        >
                          {item.description || "Chưa có mô tả"}
                        </div>
                      </td>

                      {/* DATE */}

                      <td>
                        <span className="vt-date">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString(
                                "vi-VN",
                              )
                            : "-"}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="text-center">
                        <div className="vt-actions">
                          <button
                            type="button"
                            className="vt-action-btn edit"
                            title="Chỉnh sửa"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <CiEdit />
                          </button>

                          <button
                            type="button"
                            className="vt-action-btn delete"
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

            <div className="vt-pagination">
              <div className="vt-pagination-info">
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

              <div className="vt-pagination-control">
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
        dialogClassName="vt-form-modal"
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>
            <div className="vt-modal-icon">
              {editMode ? <CiEdit /> : <FaPlus />}
            </div>

            <div>
              <strong>
                {editMode
                  ? "Cập nhật loại phương tiện"
                  : "Thêm loại phương tiện"}
              </strong>

              <span>
                {editMode
                  ? "Điều chỉnh thông tin phương tiện trong hệ thống."
                  : "Khai báo thêm một loại phương tiện mới."}
              </span>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="vt-form-group">
              <Form.Label>
                Tên loại phương tiện
                <span className="vt-required">*</span>
              </Form.Label>

              <Form.Control
                autoFocus
                value={tFVehicleTypeValue}
                placeholder="Ví dụ: Xe 45 chỗ, Limousine, Máy bay..."
                isInvalid={isError}
                onChange={(e) => {
                  setTFVehicleTypeValue(e.target.value);

                  if (e.target.value.trim()) {
                    setIsError(false);
                  }
                }}
              />

              <Form.Control.Feedback type="invalid">
                {error}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="vt-form-group">
              <Form.Label>Mô tả</Form.Label>

              <Form.Control
                as="textarea"
                rows={4}
                value={tFDesValue}
                placeholder="Nhập mô tả ngắn về loại phương tiện..."
                onChange={(e) => setTFDesValue(e.target.value)}
              />

              <div className="vt-character-count">
                {tFDesValue.length} ký tự
              </div>
            </Form.Group>

            {/* IMAGE */}

            <Form.Group className="vt-form-group">
              <Form.Label>Hình ảnh đại diện</Form.Label>

              <div className="vt-upload-box">
                <div className="vt-upload-title">
                  <FaImage />

                  <div>
                    <strong>Tải hình phương tiện</strong>

                    <span>Chọn hình ảnh đại diện cho loại phương tiện.</span>
                  </div>
                </div>

                <ImageCDNCloud onUploadSuccess={(url) => setImageLink(url)} />

                {imageLink && (
                  <div className="vt-image-preview">
                    <img src={imageLink} alt="Preview" />

                    <div>
                      <strong>Hình ảnh hiện tại</strong>

                      <span>Ảnh sẽ được sử dụng làm hình đại diện.</span>
                    </div>
                  </div>
                )}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            className="vt-modal-cancel"
            disabled={saving}
            onClick={handleCloseModal}
          >
            Hủy
          </Button>

          <Button
            className="vt-modal-save"
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
        dialogClassName="vt-delete-modal"
      >
        <div className="vt-delete-content">
          <div className="vt-delete-icon">
            <CiTrash />
          </div>

          <h4>Xóa loại phương tiện?</h4>

          <p>
            Bạn có chắc chắn muốn xóa{" "}
            <strong>{deleteName || "loại phương tiện này"}</strong>?
          </p>

          <div className="vt-delete-warning">
            Dữ liệu sau khi xóa có thể không khôi phục được.
          </div>

          <div className="vt-delete-actions">
            <Button
              className="vt-delete-cancel"
              disabled={deleting}
              onClick={() => setOpenModalDelete(false)}
            >
              Hủy
            </Button>

            <Button
              className="vt-delete-confirm"
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
          <Toast.Body className="text-white vt-toast-body">
            {alertMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default VehicleType;
