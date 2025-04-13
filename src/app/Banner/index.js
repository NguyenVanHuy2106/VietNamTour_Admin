import React, { useState, useEffect } from "react";

import API from "../../config/APINoToken";
import { BsCaretLeft, BsCaretRight } from "react-icons/bs";
import { FaPlus, FaRegTrashAlt } from "react-icons/fa";

import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { TextField } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Snackbar from "@mui/material/Snackbar";
import Button from "@mui/material/Button";
import { RingLoader } from "react-spinners";
import Backdrop from "@mui/material/Backdrop";
import { makeStyles } from "@material-ui/core/styles";
import ImageUploader from "../../components/ImageUploader";
import APIToken from "../../config/APIToken";

import { CiTrash, CiEdit } from "react-icons/ci";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff",
  },
}));
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

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
  const [deleteId, setDeleteId] = useState(null); // lưu id cần xoá

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
      <Button color="secondary" size="small" onClick={handleAgrreDelete}>
        OK
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleCloseModalDelete}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
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
    setImageLink(url);
    //console.log("🔗 Link ảnh cần lưu DB:", url);
  };
  const handleAgrre = async () => {
    if (tFBannerValue.length === 0) {
      setError("Vui lòng nhập tên Banner");
      setIsError(true);
    } else {
      try {
        setLoading(true);
        //console.log("Huy 2");
        const response = await APIToken.post("/banner/add", {
          bannername: tFBannerValue,
          bannerurl: imageLink,
          description: tFDesValue,
          created_by: userId,
        });
        //console.log(response);

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

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataBanner.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(dataBanner.length / itemsPerPage));

  return (
    <div className="container">
      <div
        style={{
          borderBottom: "1px #000000 solid",
          fontSize: 25,
          padding: 10,
        }}
      >
        Banner
      </div>
      <div className="plus" style={{ marginRight: "50px" }}>
        <Button variant="contained" onClick={handleOpenModal}>
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

      {/* Pagination - Luôn giữ vị trí, không thay đổi kích thước */}
      {dataBanner.length > itemsPerPage && (
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
      <div>
        <Modal
          open={openModal}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <div
              className="border-bottom fw-bold"
              style={{ paddingBottom: "20px" }}
            >
              Thêm banner (2200x700px)
            </div>
            <div style={{ marginLeft: 37, marginTop: 12 }}>
              {imageLink ? (
                <img
                  src={imageLink}
                  alt="Selected file"
                  width={440}
                  height={140}
                />
              ) : null}
              <div className="d-flex mt-3">
                <div
                  style={{
                    marginRight: 10,
                  }}
                >
                  Chọn icon:{" "}
                </div>
                <ImageUploader onUploadSuccess={handleUploadSuccess} />
              </div>
            </div>
            <div
              className="d-flex align-items-center flex-column"
              style={{ marginTop: 20 }}
            >
              <TextField
                required
                id="outlined-basic"
                label="Tên banner"
                variant="outlined"
                style={{ width: "90%" }}
                onChange={(newValue) => setTFBannerValue(newValue.target.value)}
                helperText={error}
                error={isError}
              />

              <TextField
                id="outlined-multiline-flexible"
                label="Mô tả"
                multiline
                rows={6}
                style={{ width: "90%", marginTop: 20 }}
                onChange={(newValue) => setTFDesValue(newValue.target.value)}
              />
            </div>
            <div style={{ marginTop: 10, marginLeft: 37 }}>
              Kích hoạt{" "}
              <Checkbox
                disabled
                checked={checked}
                //onChange={handleChange}
              />
            </div>
            <div
              className="d-flex justify-content-center"
              style={{ marginTop: 20 }}
            >
              <div style={{ marginRight: 20 }}>
                <Button variant="outlined" onClick={handleCloseModal}>
                  Quay lại
                </Button>
              </div>
              <div style={{ marginLeft: 20 }}>
                <Button variant="contained" onClick={handleAgrre}>
                  Đồng ý
                </Button>
              </div>
            </div>
          </Box>
        </Modal>
      </div>
      <Snackbar
        open={successAlertOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessAlertOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        message={alertMessage}
        //action={action}
      />
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={openModalDelete}
        onClose={handleCloseModalDelete}
        message="Bạn có chắc chắn xoá"
        action={action}
      />
    </div>
  );
};

export default Banner;
