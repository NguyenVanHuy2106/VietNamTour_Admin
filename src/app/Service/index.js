import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { BsCaretLeft, BsCaretRight } from "react-icons/bs";
import { CiTrash, CiEdit } from "react-icons/ci";
import IconButton from "@mui/material/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import CloseIcon from "@mui/icons-material/Close";
import Snackbar from "@mui/material/Snackbar";
import Button from "@mui/material/Button";
import { FaPlus } from "react-icons/fa";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { TextField } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import { RingLoader } from "react-spinners";
import Backdrop from "@mui/material/Backdrop";

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
const Service = () => {
  const [dataService, setDataService] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  let userId = localStorage.getItem("userId");
  const classes = useStyles();

  const [openModalDelete, setOpenModalDelete] = useState(false);
  const handleCloseModalDelete = () => {
    setOpenModalDelete(false);
  };
  let [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null); // lưu id cần xoá
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [checked, setChecked] = useState(true);

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [tFServiceValue, setTFServiceValue] = useState("");
  const [tFDesValue, setTFDesValue] = useState("");

  const handleCloseModal = () => {
    setOpenModal(false);
    setIsError(false);
    setError("");
  };

  const handleOpenModal = () => setOpenModal(true);

  const handleOpenModalDelete = (id) => {
    setOpenModalDelete(true);
    setDeleteId(id);
  };

  const handleAgrreDelete = async () => {
    try {
      setLoading(true);
      const response = await APIToken.delete(`/services/delete/${deleteId}`);
      if (response.status === 200) {
        setAlertMessage("Xoá loại nơi ở thành công");
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
      const response = await API.get("/services/get");
      setDataService(response.data.data || []);
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách loại Tour:",
        error.response || error
      );
    }
  };
  const handleAgrre = async () => {
    if (tFServiceValue.length === 0) {
      setError("Vui long nhap tên loại nơi ở ");
      setIsError(true);
    } else {
      try {
        setLoading(true);
        const response = await APIToken.post("/services/add", {
          servicename: tFServiceValue,
          description: tFDesValue,
          created_by: userId,
        });

        if (response.status === 201) {
          setAlertMessage("Thêm mới dịch vụ thành công");
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

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataService.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(dataService.length / itemsPerPage));

  return (
    <div className="container">
      <div
        style={{
          borderBottom: "1px #000000 solid",
          fontSize: 25,
          padding: 10,
        }}
      >
        Dịch vụ
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
            <th style={{ width: "10%" }}>Mã dịch vụ</th>
            <th style={{ width: "25%" }}>Tên dịch vụ</th>
            <th style={{ width: "20%" }}>Mô tả</th>

            <th style={{ width: "20%" }}>Người thêm</th>
            <th style={{ width: "15%" }}>Ngày thêm</th>
            <th style={{ width: "10%" }}>Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((service) => (
              <tr key={service.serviceid}>
                <td>{service.serviceid}</td>
                <td>{service.servicename}</td>
                <td>{service.description}</td>

                <td>{service.created_by}</td>
                <td>{service.created_at}</td>
                <td>
                  <div className="d-flex">
                    <div className="Edit" style={{ marginRight: 10 }}>
                      <CiEdit />
                    </div>
                    <div
                      className="Trash"
                      style={{ marginLeft: 10 }}
                      onClick={() => handleOpenModalDelete(service.serviceid)}
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
      {dataService.length > itemsPerPage && (
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
        {loading ? (
          <Backdrop className={classes.backdrop} open>
            <RingLoader color="#36d7b7" />
          </Backdrop>
        ) : null}
      </div>
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
              Thêm mới dịch vụ
            </div>
            <div style={{ marginLeft: 37, marginTop: 12 }}></div>
            <div
              className="d-flex align-items-center flex-column"
              style={{ marginTop: 20 }}
            >
              <TextField
                required
                id="outlined-basic"
                label="Tên loại dịch vụ"
                variant="outlined"
                style={{ width: "90%" }}
                onChange={(newValue) =>
                  setTFServiceValue(newValue.target.value)
                }
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

export default Service;
