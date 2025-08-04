import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { BsCaretLeft, BsCaretRight } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import { CiTrash, CiEdit } from "react-icons/ci";
import { Button, Modal, Form, Spinner, Toast } from "react-bootstrap";
import "./index.css";
import ImageCDNCloud from "../../components/ImageCDNCloud";

const Customer = () => {
  const [dataCustomer, setDataCustomer] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [checked, setChecked] = useState(true);
  const [imageLink, setImageLink] = useState("");

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [tFCustomerName, setTFCustomerName] = useState("");
  const [tFDesValue, setTFDesValue] = useState("");

  let userId = localStorage.getItem("userId");
  const itemsPerPage = 10;
  let [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null); // lưu id cần xoá

  const [openModalDelete, setOpenModalDelete] = useState(false);
  const handleCloseModalDelete = () => {
    setOpenModalDelete(false);
  };

  const handleOpenModalDelete = (id) => {
    setOpenModalDelete(true);
    setDeleteId(id);
  };

  const handleAgrreDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/customer/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xoá khách hàng thành công");
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
  const handleUploadSuccess = (url) => {
    setImageLink(url);
  };

  const getData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/customer/get");
      setDataCustomer(response.data.data || []);
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách loại Tour:",
        error.response || error
      );
    } finally {
      setLoading(false); // ✅ Luôn tắt loading sau khi xong
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setIsError(false);
    setError("");
  };

  const handleOpenModal = () => setOpenModal(true);

  const handleAgrre = async () => {
    if (tFCustomerName.length === 0) {
      setError("Vui lòng nhập tên danh mục");
      setIsError(true);
    } else {
      try {
        setLoading(true);
        const response = await APIToken.post("/customer/add", {
          customername: tFCustomerName,
          customerfieldtypeid: 1,
          customerlogo: imageLink,
          description: tFDesValue,
          created_by: userId,
        });
        if (response.status === 201) {
          setAlertMessage("Thêm mới khách hàng thành công");
          setSuccessAlertOpen(true);
        }
      } catch (error) {
        return error;
      } finally {
        setLoading(false);
        getData();
        setOpenModal(false);
        setTFCustomerName("");
        setTFDesValue("");
      }
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataCustomer.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(dataCustomer.length / itemsPerPage));

  return (
    <div className="container">
      <div
        style={{
          borderBottom: "1px #000000 solid",
          fontSize: 25,
          padding: 10,
        }}
      >
        Loại tour
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
            <th style={{ width: "10%" }}>Mã khách hàng</th>
            <th style={{ width: "20%" }}>Tên khách hàng</th>
            <th style={{ width: "15%" }}>Mô tả</th>
            <th style={{ width: "10%" }}>Logo</th>
            {/* <th style={{ width: "10%" }}>Lĩnh vực</th> */}
            <th style={{ width: "15%" }}>Người thêm</th>
            <th style={{ width: "12%" }}>Ngày thêm</th>
            <th style={{ width: "10%" }}>Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((customer) => (
              <tr key={customer.customerid}>
                <td>{customer.customerid}</td>
                <td>{customer.customername}</td>
                <td>{customer.description}</td>
                <td>
                  {customer.customerlogo ? (
                    <img
                      src={customer.customerlogo}
                      alt={customer.customername}
                      width={150}
                      height={80}
                    />
                  ) : null}
                </td>
                {/* <td>{customer.customerfieldtypeid}</td> */}
                {/* <td>
                  {customer.status === 1
                    ? "Hoạt động"
                    : customer.status === 2
                    ? "Không hoạt động"
                    : "Không rõ"}
                </td> */}

                <td>{customer.created_by}</td>
                <td>{customer.created_at}</td>
                <td>
                  <div className="d-flex">
                    <div className="Edit" style={{ marginRight: 10 }}>
                      <CiEdit />
                    </div>
                    <div
                      className="Trash"
                      style={{ marginLeft: 10 }}
                      onClick={() => handleOpenModalDelete(customer.customerid)}
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

      {/* Pagination */}
      {dataCustomer.length > itemsPerPage && (
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

      {/* Modal Add */}
      <Modal show={openModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm mới khách hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="tourtypeName">
              <Form.Label>Tên khách hàng</Form.Label>
              <Form.Control
                type="text"
                value={tFCustomerName}
                onChange={(e) => setTFCustomerName(e.target.value)}
                isInvalid={isError}
                isValid={!!tFCustomerName}
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
            <div className="form-group mt-3">
              <Form.Label>Ảnh Banner</Form.Label>
              <ImageCDNCloud onUploadSuccess={handleUploadSuccess} />
            </div>
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
          <Button variant="primary" onClick={handleAgrre}>
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

      {/* Delete Modal */}
      <Modal show={openModalDelete} onHide={handleCloseModalDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Xoá khách hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn xoá khách hàng này không?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModalDelete}>
            Huỷ
          </Button>
          <Button variant="danger" onClick={handleAgrreDelete}>
            Xoá
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Customer;
