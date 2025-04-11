import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { makeStyles } from "@material-ui/core/styles";

import { BsCaretLeft, BsCaretRight } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { TextField } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Snackbar from "@mui/material/Snackbar";
import Button from "@mui/material/Button";
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
  const classes = useStyles();
  let [loading, setLoading] = useState(false);

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
  const currentItems = dataHotelType.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(
    1,
    Math.ceil(dataHotelType.length / itemsPerPage)
  );

  return (
    <div className="container mt-1">
      <div
        style={{
          borderBottom: "1px #000000 solid",
          fontSize: 25,
          padding: 10,
        }}
      >
        Loại nơi ở
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
            <th style={{ width: "10%" }}>Mã loại nơi ở</th>
            <th style={{ width: "25%" }}>Tên loại nơi ở</th>
            <th style={{ width: "25%" }}>Mô tả</th>
            <th>Người thêm</th>
            <th style={{ width: "20%" }}>Ngày thêm</th>
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
              Thêm mới loại nơi ở
            </div>
            <div style={{ marginLeft: 37, marginTop: 12 }}></div>
            <div
              className="d-flex align-items-center flex-column"
              style={{ marginTop: 20 }}
            >
              <TextField
                required
                id="outlined-basic"
                label="Tên loại nơi ở"
                variant="outlined"
                style={{ width: "90%" }}
                onChange={(newValue) =>
                  setTFHotelTypeValue(newValue.target.value)
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
    </div>
  );
};

export default HotelType;
