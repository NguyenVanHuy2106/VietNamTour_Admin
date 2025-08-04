import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import { BsCaretLeft, BsCaretRight } from "react-icons/bs";
import { FaPlus, FaRegTrashAlt } from "react-icons/fa";
import { Modal, Button, Form, Toast, Spinner } from "react-bootstrap";
import { RingLoader } from "react-spinners";
import ImageUploader from "../../components/ImageUploader";

import ImageCDNCloud from "../../components/ImageCDNCloud";
import APIToken from "../../config/APIToken";
import { CiTrash, CiEdit } from "react-icons/ci";

const Banner = () => {
  const [dataBanner, setDataBanner] = useState([]);
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

  const [tFBannerValue, setTFBannerValue] = useState("");
  const [tFDesValue, setTFDesValue] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  let userId = localStorage.getItem("userId");

  const itemsPerPage = 10;

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
      const response = await APIToken.delete(`/banner/delete/${deleteId}`);
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

  const action = (
    <React.Fragment>
      <Button variant="secondary" size="sm" onClick={handleAgrreDelete}>
        OK
      </Button>
      <Button
        size="sm"
        aria-label="close"
        variant="link"
        onClick={handleCloseModalDelete}
      >
        <CiTrash size={16} />
      </Button>
    </React.Fragment>
  );

  const getData = async () => {
    try {
      const response = await API.get("/banner/get");
      setDataBanner(response.data.data || []);
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
    //console.log(url);
    setImageLink(url);
  };
  const handleAgrre = async () => {
    if (tFBannerValue.length === 0) {
      setError("Vui lòng nhập tên Banner");
      setIsError(true);
    } else {
      try {
        setLoading(true);
        const response = await APIToken.post("/banner/add", {
          bannername: tFBannerValue,
          bannerurl: imageLink,
          description: tFDesValue,
          created_by: userId,
        });

        if (response.status === 201) {
          setAlertMessage("Thêm mới banner thành công");
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
  const currentItems = dataBanner.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(dataBanner.length / itemsPerPage));

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
        BANNER
      </div>
      <div className="d-flex justify-content-end mt-2">
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
            <th style={{ width: "10%" }}>Mã banner</th>
            <th style={{ width: "15%" }}>Tên banner</th>
            <th style={{ width: "15%" }}>Mô tả</th>
            <th style={{ width: "15%" }}>Banner</th>
            <th style={{ width: "15%" }}>Người thêm</th>
            <th style={{ width: "10%" }}>Ngày thêm</th>
            <th style={{ width: "8%" }}>Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((banner) => (
              <tr key={banner.bannerid}>
                <td>{banner.bannerid}</td>
                <td>{banner.bannername}</td>
                <td>{banner.description}</td>
                <td>
                  {banner.bannerurl ? (
                    <img
                      src={banner.bannerurl}
                      alt={banner.bannername}
                      width={220}
                      height={70}
                    />
                  ) : null}
                </td>
                <td>{banner.created_by}</td>
                <td>{banner.created_at}</td>
                <td>
                  <div className="d-flex">
                    <div className="Edit" style={{ marginRight: 10 }}>
                      <CiEdit />
                    </div>
                    <div
                      className="Trash"
                      style={{ marginLeft: 10 }}
                      onClick={() => handleOpenModalDelete(banner.bannerid)}
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

      {dataBanner.length > itemsPerPage && (
        <div className="d-flex justify-content-center mt-3">
          <nav>
            <ul className="pagination">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <Button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <BsCaretLeft />
                </Button>
              </li>
              {[...Array(totalPages)].map((_, index) => (
                <li
                  key={index}
                  className={`page-item ${
                    currentPage === index + 1 ? "active" : ""
                  }`}
                >
                  <Button
                    className="page-link"
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Button>
                </li>
              ))}
              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <Button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <BsCaretRight />
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Modal Add */}
      <Modal show={openModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm mới banner</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <Form.Label>Tên banner</Form.Label>
            <Form.Control
              type="text"
              value={tFBannerValue}
              onChange={(e) => setTFBannerValue(e.target.value)}
            />
          </div>
          <div className="form-group mt-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={tFDesValue}
              onChange={(e) => setTFDesValue(e.target.value)}
            />
          </div>
          <div className="form-group mt-3">
            <Form.Label>Ảnh Banner</Form.Label>
            <ImageCDNCloud onUploadSuccess={handleUploadSuccess} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Đóng
          </Button>
          <Button variant="primary" onClick={handleAgrre} disabled={loading}>
            {loading ? (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            ) : (
              "Thêm mới"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Alert */}
      <Toast
        show={successAlertOpen}
        onClose={() => setSuccessAlertOpen(false)}
        delay={3000}
        autohide
        style={{ position: "absolute", top: 20, right: 20 }}
      >
        <Toast.Body>{alertMessage}</Toast.Body>
      </Toast>
    </div>
  );
};

export default Banner;
