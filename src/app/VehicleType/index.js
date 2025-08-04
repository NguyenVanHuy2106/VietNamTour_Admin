import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import { BsCaretLeft, BsCaretRight } from "react-icons/bs";
import { FaPlus, FaRegTrashAlt } from "react-icons/fa";
import {
  Modal,
  Button,
  Table,
  Form,
  Alert,
  Toast,
  Spinner,
} from "react-bootstrap";
import { RingLoader } from "react-spinners";
import ImageUploader from "../../components/ImageUploader";
import APIToken from "../../config/APIToken";
import { CiTrash, CiEdit } from "react-icons/ci";

import "./index.css";

const VehicleType = () => {
  const [dataVehicleType, setDataVehicleType] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [checked, setChecked] = useState(true);
  const [url, setUrl] = useState("");
  const [imageLink, setImageLink] = useState("");

  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  let [loading, setLoading] = useState(false);

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [tFVehicleTypeValue, setTFVehicleTypeValue] = useState("");
  const [tFDesValue, setTFDesValue] = useState("");
  const [deleteId, setDeleteId] = useState(null); // lưu id cần xoá

  let userId = localStorage.getItem("userId");

  const itemsPerPage = 10;

  const [openModalDelete, setOpenModalDelete] = useState(false);
  const handleCloseModalDelete = () => setOpenModalDelete(false);
  const handleOpenModalDelete = (id) => {
    setOpenModalDelete(true);
    setDeleteId(id);
  };

  const handleAgrreDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/vehicleType/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xoá loại phương tiện thành công");
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
      const response = await API.get("/vehicleType/get");
      setDataVehicleType(response.data.data || []);
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách loại Tour:",
        error.response || error
      );
    }
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    setImageLink("");
    setIsError(false);
    setError("");
  };

  const handleUploadSuccess = (url) => {
    setImageLink(url);
  };

  const handleAgrre = async () => {
    if (tFVehicleTypeValue.length === 0) {
      setError("Vui lòng nhập tên loại phương tiện");
      setIsError(true);
    } else {
      try {
        setLoading(true);
        const response = await APIToken.post("/vehicleType/add", {
          vehicletypename: tFVehicleTypeValue,
          vehicletypeicon: imageLink,
          description: tFDesValue,
          created_by: userId,
        });
        if (response.status === 201) {
          setAlertMessage("Thêm mới loại phương tiện thành công");
          setSuccessAlertOpen(true);
        }
      } catch (error) {
        return error;
      } finally {
        setLoading(false);
        getData();
        setOpenModal(false);
        setImageLink("");
      }
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataVehicleType.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(
    1,
    Math.ceil(dataVehicleType.length / itemsPerPage)
  );

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
        LOẠI PHƯƠNG TIỆN
      </div>
      <div className="plus" style={{ marginRight: "50px" }}>
        <Button variant="primary" onClick={handleOpenModal}>
          <FaPlus size={16} style={{ marginRight: "8px" }} />
          Thêm mới
        </Button>
      </div>

      <Table striped className="mt-2">
        <thead>
          <tr>
            <th style={{ width: "10%" }}>Mã loại tour</th>
            <th style={{ width: "25%" }}>Tên loại tour</th>
            <th style={{ width: "15%" }}>Mô tả</th>
            <th style={{ width: "10%" }}>Icon</th>
            <th style={{ width: "17%" }}>Người thêm</th>
            <th style={{ width: "15%" }}>Ngày thêm</th>
            <th style={{ width: "10%" }}>Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((vehicleType) => (
              <tr key={vehicleType.vehicletypeid}>
                <td>{vehicleType.vehicletypeid}</td>
                <td>{vehicleType.vehicletypename}</td>
                <td>{vehicleType.description}</td>
                <td>
                  {vehicleType.vehicletypeicon ? (
                    <img
                      src={vehicleType.vehicletypeicon}
                      alt="Icon"
                      width={50}
                      height={50}
                    />
                  ) : null}
                </td>
                <td>{vehicleType.created_by}</td>
                <td>{vehicleType.created_at}</td>
                <td>
                  <div className="d-flex">
                    <div className="Edit" style={{ marginRight: 10 }}>
                      <CiEdit />
                    </div>
                    <div
                      className="Trash"
                      style={{ marginLeft: 10 }}
                      onClick={() =>
                        handleOpenModalDelete(vehicleType.vehicletypeid)
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
              <td colSpan="7" className="text-center">
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {dataVehicleType.length > itemsPerPage && (
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
      {/* Loading Spinner */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <Spinner animation="border" role="status" />
          </div>
        </div>
      )}
      <Toast
        onClose={() => setSuccessAlertOpen(false)}
        show={successAlertOpen}
        delay={3000}
        autohide
        className="position-fixed top-0 end-0 m-3"
      >
        <Toast.Body>{alertMessage}</Toast.Body>
      </Toast>

      {/* Modal thêm mới */}
      <Modal show={openModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm mới loại phương tiện</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formVehicleTypeName">
              <Form.Label>Tên loại phương tiện</Form.Label>
              <Form.Control
                type="text"
                value={tFVehicleTypeValue}
                onChange={(e) => setTFVehicleTypeValue(e.target.value)}
                placeholder="Nhập tên loại phương tiện"
                isInvalid={isError}
              />
              <Form.Control.Feedback type="invalid">
                {error}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="formDescription">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={tFDesValue}
                onChange={(e) => setTFDesValue(e.target.value)}
                placeholder="Nhập mô tả"
              />
            </Form.Group>

            <Form.Group controlId="formFile">
              <Form.Label>Icon</Form.Label>
              <ImageUploader onUploadSuccess={handleUploadSuccess} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleAgrre} disabled={loading}>
            {loading ? <RingLoader size={20} color="#fff" /> : "Thêm mới"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal show={openModalDelete} onHide={handleCloseModalDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa loại phương tiện này không?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModalDelete}>
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleAgrreDelete}
            disabled={loading}
          >
            {loading ? <RingLoader size={20} color="#fff" /> : "Xóa"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VehicleType;
