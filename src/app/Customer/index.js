import React, { useState, useEffect } from "react";

import API from "../../config/APINoToken";
import { BsCaretLeft, BsCaretRight } from "react-icons/bs";
import { FaPlus, FaRegTrashAlt } from "react-icons/fa";
import { CiTrash, CiEdit } from "react-icons/ci";
import "./index.css";

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

const Customer = () => {
  const [dataCustomer, setDataCustomer] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [checked, setChecked] = useState(true);
  //   const [url, setUrl] = useState("");
  const [imageLink, setImageLink] = useState("");

  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  let [loading, setLoading] = useState(false);

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [tFCustomerValue, setTFCustomerValue] = useState("");
  const [tFDesValue, setTFDesValue] = useState("");

  let userId = localStorage.getItem("userId");
  const classes = useStyles();

  const itemsPerPage = 10;
  const getData = async () => {
    try {
      const response = await API.get("/customer/get");
      setDataCustomer(response.data.data || []);
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách khách hàng",
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
    if (tFCustomerValue.length === 0) {
      setError("Vui lòng nhập tên khách hàng");
      setIsError(true);
    } else {
      try {
        setLoading(true);
        //console.log("Huy 2");
        const response = await APIToken.post("/customer/add", {
          customername: tFCustomerValue,
          customerfieldtypeid: 1,
          customerlogo: imageLink,
          description: tFDesValue,
          created_by: userId,
        });
        //console.log("Thành công", response);

        if (response.status === 201) {
          setAlertMessage("Thêm mới banner thành công");
          setSuccessAlertOpen(true);
        }
      } catch (error) {
        //console.log("Thất bại", error);
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
            <th style={{ width: "10%" }}>Mã khách hàng</th>
            <th style={{ width: "20%" }}>Tên khách hàng</th>
            <th style={{ width: "15%" }}>Mô tả</th>
            <th style={{ width: "10%" }}>Logo</th>
            <th style={{ width: "10%" }}>Lĩnh vực</th>
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
                <td>{customer.customerfieldtypeid}</td>
                <td>{customer.created_by}</td>
                <td>{customer.created_at}</td>
                <td>
                  <div className="d-flex">
                    <div className="Edit" style={{ marginRight: 10 }}>
                      <CiEdit />
                    </div>
                    <div className="Trash" style={{ marginLeft: 10 }}>
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
              Thêm khách hàng (150x80px)
            </div>
            <div style={{ marginLeft: 37, marginTop: 12 }}>
              {imageLink ? (
                <img
                  src={imageLink}
                  alt="Selected file"
                  width={300}
                  height={160}
                />
              ) : null}
              <div className="d-flex mt-3">
                <div
                  style={{
                    marginRight: 10,
                  }}
                >
                  Chọn logo:{" "}
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
                label="Tên khách hàng"
                variant="outlined"
                style={{ width: "90%" }}
                onChange={(newValue) =>
                  setTFCustomerValue(newValue.target.value)
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

export default Customer;
