import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { BsCaretLeft, BsCaretRight } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import { CiTrash, CiEdit } from "react-icons/ci";

import { Modal, Button, Form, Spinner, Alert, Toast } from "react-bootstrap";
import "./index.css";

const TimeType = () => {
  const [dataTimeType, setDataTimeType] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [checked] = useState(true);
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [tFTimeTypeValue, setTFTimeTypeValue] = useState("");
  const [tFDesValue, setTFDesValue] = useState("");

  let userId = localStorage.getItem("userId");
  let [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [openModalDelete, setOpenModalDelete] = useState(false);

  const handleCloseModalDelete = () => setOpenModalDelete(false);

  const handleOpenModalDelete = (id) => {
    setOpenModalDelete(true);
    setDeleteId(id);
  };

  const handleAgreeDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/timeType/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xoá loại phương tiện thành công");
        setSuccessAlertOpen(true);
      }
    } catch (error) {
      return error;
    } finally {
      setDeleteId(null);
      setLoading(false);
      setOpenModalDelete(false);
      getData();
    }
  };

  const getData = async () => {
    try {
      const response = await API.get("/timeType/get");
      setDataTimeType(response.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách loại Tour:", error);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setIsError(false);
    setError("");
  };

  const handleOpenModal = () => setOpenModal(true);

  const handleAgree = async () => {
    if (tFTimeTypeValue.length === 0) {
      setError("Vui lòng nhập tên loại thời gian");
      setIsError(true);
    } else {
      try {
        setLoading(true);
        const response = await APIToken.post("/timeType/add", {
          timetypename: tFTimeTypeValue,
          description: tFDesValue,
          created_by: userId,
        });

        if (response.status === 201) {
          setAlertMessage("Thêm mới loại thời gian thành công");
          setSuccessAlertOpen(true);
        }
      } catch (error) {
        return error;
      } finally {
        setLoading(false);
        getData();
        setOpenModal(false);
      }
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataTimeType.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(dataTimeType.length / itemsPerPage));

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
        LOẠI THỜI GIAN
      </div>
      <div className="d-flex justify-content-end my-3">
        <Button variant="primary" onClick={handleOpenModal}>
          <FaPlus className="me-2" /> Thêm mới
        </Button>
      </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>Mã loại</th>
            <th>Tên loại thời gian</th>
            <th>Mô tả</th>
            <th>Người thêm</th>
            <th>Ngày thêm</th>
            <th>Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <tr key={item.timetypeid}>
                <td>{item.timetypeid}</td>
                <td>{item.timetypename}</td>
                <td>{item.description}</td>
                <td>{item.created_by}</td>
                <td>{item.created_at}</td>
                <td>
                  <CiEdit className="me-2" />
                  <CiTrash
                    onClick={() => handleOpenModalDelete(item.timetypeid)}
                    style={{ cursor: "pointer" }}
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {dataTimeType.length > itemsPerPage && (
        <div className="d-flex justify-content-center mt-3">
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <BsCaretLeft />
              </button>
            </li>
            {[...Array(totalPages)].map((_, index) => (
              <li
                key={index}
                className={`page-item ${
                  currentPage === index + 1 ? "active" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              </li>
            ))}
            <li
              className={`page-item ${
                currentPage === totalPages ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <BsCaretRight />
              </button>
            </li>
          </ul>
        </div>
      )}

      <Modal show={openModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm mới loại thời gian</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="tourtypeName">
              <Form.Label>Tên loại thời gian</Form.Label>
              <Form.Control
                type="text"
                value={tFTimeTypeValue}
                onChange={(e) => setTFTimeTypeValue(e.target.value)}
                isInvalid={isError}
                isValid={!!tFTimeTypeValue}
              />
              <Form.Control.Feedback type="invalid">
                {error}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="tourtypeDescription">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={tFDesValue}
                onChange={(e) => setTFDesValue(e.target.value)}
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Kích hoạt"
              checked={checked}
              disabled
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Đóng
          </Button>
          <Button variant="primary" onClick={handleAgree}>
            {loading ? (
              <Spinner
                animation="border"
                variant="light"
                size="sm"
                className="mr-2"
              />
            ) : (
              "Thêm"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Success Alert */}
      <Toast
        onClose={() => setSuccessAlertOpen(false)}
        show={successAlertOpen}
        delay={3000}
        autohide
        className="position-fixed top-0 end-0 m-3"
      >
        <Toast.Body>{alertMessage}</Toast.Body>
      </Toast>

      <Modal show={openModalDelete} onHide={handleCloseModalDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xoá</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn xoá không?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModalDelete}>
            Huỷ
          </Button>
          <Button variant="danger" onClick={handleAgreeDelete}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      {loading && (
        <div className="text-center mt-3">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}
    </div>
  );
};

export default TimeType;
