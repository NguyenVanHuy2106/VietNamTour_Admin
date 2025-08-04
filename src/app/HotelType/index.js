import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { BsCaretLeft, BsCaretRight } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import {
  Modal,
  Button,
  Checkbox,
  Alert,
  Spinner,
  Row,
  Col,
  Toast,
} from "react-bootstrap";
import { CiTrash, CiEdit } from "react-icons/ci";

import "./index.css";

const HotelType = () => {
  const [dataHotelType, setDataHotelType] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [checked, setChecked] = useState(true);

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [tFHotelTypeValue, setTFHotelTypeValue] = useState("");
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

  const handleAgrreDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/hotelType/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xoá loại nơi ở thành công");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteId(null);
      setLoading(false);
      setOpenModalDelete(false);
      getData();
    }
  };

  const getData = async () => {
    try {
      const response = await API.get("/hotelType/get");
      setDataHotelType(response.data.data || []);
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách loại Tour:",
        error.response || error
      );
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setIsError(false);
    setError("");
  };

  const handleOpenModal = () => setOpenModal(true);

  const handleAgrre = async () => {
    if (tFHotelTypeValue.length === 0) {
      setError("Vui long nhap tên loại nơi ở ");
      setIsError(true);
    } else {
      try {
        setLoading(true);
        const response = await APIToken.post("/hotelType/add", {
          hoteltypename: tFHotelTypeValue,
          description: tFDesValue,
          created_by: userId,
        });

        if (response.status === 201) {
          setAlertMessage("Thêm mới loại tour thành công");
          setSuccessAlertOpen(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        getData();
        setOpenModal(false);
        setTFDesValue("");
        setTFHotelTypeValue("");
      }
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataHotelType.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(
    1,
    Math.ceil(dataHotelType.length / itemsPerPage)
  );

  return (
    <div className="container mt-1">
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
        LOẠI NƠI Ở
      </div>
      <div className="plus" style={{ marginRight: "50px" }}>
        <Button variant="primary" onClick={handleOpenModal}>
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
            <th style={{ width: "10%" }}>Mã loại nơi ở</th>
            <th style={{ width: "25%" }}>Tên loại nơi ở</th>
            <th style={{ width: "20%" }}>Mô tả</th>
            <th style={{ width: "20%" }}>Người thêm</th>
            <th style={{ width: "15%" }}>Ngày thêm</th>
            <th style={{ width: "15%" }}>Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((hotelType) => (
              <tr key={hotelType.hoteltypeid}>
                <td>{hotelType.hoteltypeid}</td>
                <td>{hotelType.hoteltypename}</td>
                <td>{hotelType.description}</td>
                <td>{hotelType.created_by}</td>
                <td>{hotelType.created_at}</td>
                <td>
                  <div className="d-flex">
                    <div className="Edit" style={{ marginRight: 10 }}>
                      <CiEdit />
                    </div>
                    <div
                      className="Trash"
                      style={{ marginLeft: 10 }}
                      onClick={() =>
                        handleOpenModalDelete(hotelType.hoteltypeid)
                      }
                    >
                      <CiTrash />
                    </div>
                  </div>
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

      {dataHotelType.length > itemsPerPage && (
        <div className="d-flex justify-content-center mt-3">
          <nav>
            <ul className="pagination">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
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
          </nav>
        </div>
      )}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <Spinner animation="border" role="status" />
          </div>
        </div>
      )}

      <Modal show={openModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm mới loại nơi ở</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Tên loại nơi ở"
              value={tFHotelTypeValue}
              onChange={(e) => setTFHotelTypeValue(e.target.value)}
            />
            {isError && <div className="text-danger">{error}</div>}
          </div>
          <div className="mb-3">
            <textarea
              className="form-control"
              placeholder="Mô tả"
              rows="4"
              value={tFDesValue}
              onChange={(e) => setTFDesValue(e.target.value)}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Quay lại
          </Button>
          <Button variant="primary" onClick={handleAgrre}>
            Đồng ý
          </Button>
        </Modal.Footer>
      </Modal>

      <Toast
        onClose={() => setSuccessAlertOpen(false)}
        show={successAlertOpen}
        delay={3000}
        autohide
        className="position-fixed top-0 end-0 m-3"
      >
        <Toast.Body>{alertMessage}</Toast.Body>
      </Toast>

      <Modal show={openModalDelete} onHide={handleCloseModalDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xoá</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn xoá?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModalDelete}>
            Đóng
          </Button>
          <Button variant="danger" onClick={handleAgrreDelete}>
            Xoá
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HotelType;
