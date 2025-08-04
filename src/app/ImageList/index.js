import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import { BsCaretLeft, BsCaretRight } from "react-icons/bs";
import { FaPlus, FaRegTrashAlt } from "react-icons/fa";
import { Modal, Button, Form, Toast, Spinner } from "react-bootstrap";
import { RingLoader } from "react-spinners";
import ImageUploader from "../../components/ImageUploader";
import APIToken from "../../config/APIToken";
import { CiTrash, CiEdit } from "react-icons/ci";
import { FetchImages } from "../../components/FetchImages";

const ImageList = () => {
  const [imageList, setImageList] = useState([]);
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [openModalDelete, setOpenModalDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const loadImages = async () => {
    const images = await FetchImages();
    setImageList(images);
  };
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = imageList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(imageList.length / itemsPerPage));

  const handleOpenModalDelete = (id) => {
    setOpenModalDelete(true);
    setDeleteId(id);
  };
  useEffect(() => {
    loadImages();
  }, []);
  return (
    <div className="" style={{ marginLeft: "50px", marginRight: "50px" }}>
      <table className="table table-striped mt-2">
        <thead>
          <tr>
            <th style={{ width: "10%" }}>ID hình</th>
            <th style={{ width: "15%" }}>Hình ảnh</th>
            <th style={{ width: "15%" }}>URL</th>
            <th style={{ width: "8%" }}>Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((image) => (
              <tr key={image.id}>
                <td>{image.id}</td>

                <td>
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.name}
                      style={{
                        maxWidth: "220px", // Giới hạn tối đa 220px ngang
                        maxHeight: "70px", // Giới hạn tối đa 70px cao
                        width: "auto", // Chiều ngang tự động theo tỉ lệ
                        height: "auto", // Chiều cao tự động theo tỉ lệ
                        objectFit: "contain", // Nếu hình dài hoặc cao hơn thì thu gọn mà không bị mất nội dung
                      }}
                    />
                  ) : null}
                </td>
                <td>{image.url}</td>

                <td>
                  <div className="d-flex">
                    <div className="Edit" style={{ marginRight: 10 }}>
                      <CiEdit />
                    </div>
                    <div
                      className="Trash"
                      style={{ marginLeft: 10 }}
                      onClick={() => handleOpenModalDelete(image.id)}
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
      {imageList.length > itemsPerPage && (
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
    </div>
  );
};

export default ImageList;
