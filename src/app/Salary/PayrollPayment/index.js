import React, { useState } from "react";

import { Alert, Badge, Button, Form, Modal, Spinner } from "react-bootstrap";

import {
  FaCheckCircle,
  FaCopy,
  FaDownload,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaQrcode,
  FaUniversity,
  FaUser,
} from "react-icons/fa";

import APIToken from "../../../config/APIToken";

import "./index.css";

const PayrollPayment = ({ payroll, onPaid, onRefresh }) => {
  // ==========================================================
  // STATE
  // ==========================================================

  const [show, setShow] = useState(false);

  const [generating, setGenerating] = useState(false);

  const [markingPaid, setMarkingPaid] = useState(false);

  const [qrData, setQrData] = useState(null);

  const [paymentReference, setPaymentReference] = useState("");

  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN");
  };

  // ==========================================================
  // PAYMENT STATUS
  // ==========================================================

  const isPaid = payroll?.payment_status === "PAID";

  // ==========================================================
  // OPEN
  // ==========================================================

  const handleOpen = async () => {
    if (!payroll) {
      return;
    }

    if (payroll.status !== "PUBLISHED") {
      alert("Chỉ có thể thanh toán bảng lương đã công bố.");

      return;
    }

    if (isPaid) {
      alert("Bảng lương này đã được thanh toán.");

      return;
    }

    setShow(true);

    setQrData(null);

    setPaymentReference("");

    await generateQR();
  };

  // ==========================================================
  // CLOSE
  // ==========================================================

  const handleClose = () => {
    if (generating || markingPaid) {
      return;
    }

    setShow(false);

    setQrData(null);

    setPaymentReference("");
  };

  // ==========================================================
  // GENERATE QR
  // ==========================================================

  //   const generateQR = async () => {
  //     try {
  //       setGenerating(true);

  //       const employeePayrollId = payroll?.employee_payroll_id;

  //       if (!employeePayrollId) {
  //         throw new Error("Không tìm thấy employee_payroll_id.");
  //       }

  //       const res = await APIToken.post(
  //         `/salary/payroll/generate-qr/${employeePayrollId}`,
  //       );

  //       const data = res?.data?.data;

  //       if (!data || !data.qr_data_url) {
  //         throw new Error("Không nhận được mã QR.");
  //       }

  //       setQrData(data);
  //     } catch (error) {
  //       console.error("Generate payroll QR error:", error);

  //       setQrData(null);

  //       alert(
  //         error?.response?.data?.message ||
  //           error?.message ||
  //           "Không thể tạo mã QR thanh toán.",
  //       );
  //     } finally {
  //       setGenerating(false);
  //     }
  //   };

  const generateQR = async () => {
    try {
      setGenerating(true);

      setQrData(null);

      const employeePayrollId = payroll?.employee_payroll_id;

      if (!employeePayrollId) {
        alert("Không tìm thấy bảng lương của nhân viên.");

        return;
      }

      const res = await APIToken.post(
        `/salary/payroll/generate-qr/${employeePayrollId}`,
      );

      const data = res?.data?.data;

      if (!data || !data.qr_data_url) {
        alert("Chưa khai báo tài khoản nhận lương");

        return;
      }

      setQrData(data);
    } catch (error) {
      setQrData(null);

      const status = error?.response?.status;

      const message =
        error?.response?.data?.message || "Không thể tạo mã QR thanh toán.";

      // ======================================================
      // CÁC LỖI NGHIỆP VỤ BÌNH THƯỜNG
      // Chỉ thông báo cho user, không console.error
      // ======================================================

      if (status === 400 || status === 404) {
        alert(message);

        return;
      }

      // ======================================================
      // LỖI SERVER THẬT SỰ
      // mới log console
      // ======================================================

      console.error("Generate payroll QR error:", error);

      alert(message);
    } finally {
      setGenerating(false);
    }
  };

  // ==========================================================
  // COPY
  // ==========================================================

  const handleCopy = async (value, message) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(String(value));

      alert(message || "Đã sao chép.");
    } catch (error) {
      console.error("Copy error:", error);

      alert("Không thể sao chép.");
    }
  };

  // ==========================================================
  // DOWNLOAD QR
  // ==========================================================

  const handleDownloadQR = () => {
    if (!qrData?.qr_data_url) {
      return;
    }

    const link = document.createElement("a");

    link.href = qrData.qr_data_url;

    link.download = `VietQR_${qrData.user_id}_${qrData.payroll_period_id}.png`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  // ==========================================================
  // MARK PAID
  // ==========================================================

  const handleMarkPaid = async () => {
    if (!qrData) {
      return;
    }

    const confirmed = window.confirm(
      `Xác nhận đã chi lương?\n\n` +
        `Nhân viên: ${qrData.employee_name}\n` +
        `Số tiền: ${formatMoney(qrData.amount)} đ\n` +
        `STK: ${qrData.bank?.account_number}\n\n` +
        `Chỉ xác nhận khi bạn đã thực hiện chuyển khoản thành công.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMarkingPaid(true);

      const res = await APIToken.post(
        `/salary/payroll/mark-paid/${qrData.employee_payroll_id}`,
        {
          payment_reference: paymentReference.trim() || null,
        },
      );

      alert(res?.data?.message || "Đã xác nhận chi lương.");

      if (typeof onPaid === "function") {
        onPaid(res?.data?.data);
      }

      if (typeof onRefresh === "function") {
        await onRefresh();
      }

      setShow(false);

      setQrData(null);

      setPaymentReference("");
    } catch (error) {
      console.error("Mark payroll paid error:", error);

      alert(
        error?.response?.data?.message || "Không thể xác nhận đã chi lương.",
      );
    } finally {
      setMarkingPaid(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* =====================================================
          PAYMENT BUTTON
      ===================================================== */}

      {isPaid ? (
        <Badge bg="success" className="payroll-paid-badge">
          <FaCheckCircle />
          Đã chi lương
        </Badge>
      ) : (
        <Button
          type="button"
          className="payroll-payment-btn"
          disabled={payroll?.status !== "PUBLISHED"}
          onClick={handleOpen}
        >
          <FaQrcode />
          Thanh toán
        </Button>
      )}

      {/* =====================================================
          MODAL
      ===================================================== */}

      <Modal
        show={show}
        onHide={handleClose}
        centered
        size="lg"
        backdrop="static"
        keyboard={!generating && !markingPaid}
        className="payroll-qr-modal"
      >
        {/* HEADER */}

        <Modal.Header
          closeButton={!generating && !markingPaid}
          className="payroll-qr-header"
        >
          <div className="payroll-qr-title">
            <div className="payroll-qr-title-icon">
              <FaQrcode />
            </div>

            <div>
              <Modal.Title>Thanh toán lương bằng VietQR</Modal.Title>

              <p>Quét mã QR bằng ứng dụng ngân hàng để chuyển lương</p>
            </div>
          </div>
        </Modal.Header>

        {/* BODY */}

        <Modal.Body className="payroll-qr-body">
          {/* GENERATING */}

          {generating && (
            <div className="payroll-qr-loading">
              <Spinner animation="border" />

              <strong>Đang tạo mã VietQR...</strong>

              <span>
                Hệ thống đang lấy tài khoản nhận lương và số tiền thực nhận.
              </span>
            </div>
          )}

          {/* QR RESULT */}

          {!generating && qrData && (
            <>
              <Alert variant="warning" className="payroll-payment-warning">
                <FaExclamationTriangle />

                <div>
                  <strong>Kiểm tra trước khi chuyển khoản</strong>

                  <span>
                    Việc tạo mã QR không có nghĩa là lương đã được thanh toán.
                    Chỉ bấm <b>Đã chi lương</b> sau khi giao dịch ngân hàng
                    thành công.
                  </span>
                </div>
              </Alert>

              <div className="payroll-payment-layout">
                {/* QR */}

                <div className="payroll-qr-left">
                  <div className="payroll-qr-box">
                    <img
                      src={qrData.qr_data_url}
                      alt="VietQR thanh toán lương"
                    />
                  </div>

                  <Button
                    type="button"
                    className="payroll-download-qr-btn"
                    onClick={handleDownloadQR}
                  >
                    <FaDownload />
                    Tải mã QR
                  </Button>
                </div>

                {/* PAYMENT INFO */}

                <div className="payroll-payment-info">
                  {/* EMPLOYEE */}

                  <div className="payroll-payment-info-row">
                    <div className="payroll-payment-info-icon">
                      <FaUser />
                    </div>

                    <div>
                      <span>Nhân viên</span>

                      <strong>{qrData.employee_name}</strong>

                      <small>ID: {qrData.user_id}</small>
                    </div>
                  </div>

                  {/* BANK */}

                  <div className="payroll-payment-info-row">
                    <div className="payroll-payment-info-icon">
                      <FaUniversity />
                    </div>

                    <div>
                      <span>Ngân hàng</span>

                      <strong>
                        {qrData.bank?.short_name ||
                          qrData.bank?.code ||
                          qrData.bank?.name}
                      </strong>

                      <small>{qrData.bank?.name}</small>
                    </div>
                  </div>

                  {/* ACCOUNT */}

                  <div className="payroll-payment-detail-box">
                    <div>
                      <span>Số tài khoản</span>

                      <strong>{qrData.bank?.account_number}</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          qrData.bank?.account_number,
                          "Đã sao chép số tài khoản.",
                        )
                      }
                    >
                      <FaCopy />
                    </button>
                  </div>

                  {/* NAME */}

                  <div className="payroll-payment-detail-box">
                    <div>
                      <span>Chủ tài khoản</span>

                      <strong>{qrData.bank?.account_name}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* AMOUNT */}

              <div className="payroll-payment-amount-card">
                <div className="payroll-payment-amount-icon">
                  <FaMoneyBillWave />
                </div>

                <div>
                  <span>Số tiền chuyển khoản</span>

                  <strong>{formatMoney(qrData.amount)} đ</strong>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(qrData.amount, "Đã sao chép số tiền.")
                  }
                >
                  <FaCopy />
                </button>
              </div>

              {/* TRANSFER CONTENT */}

              <div className="payroll-transfer-content">
                <div>
                  <span>Nội dung chuyển khoản</span>

                  <strong>{qrData.transfer_content}</strong>
                </div>

                <Button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      qrData.transfer_content,
                      "Đã sao chép nội dung chuyển khoản.",
                    )
                  }
                >
                  <FaCopy />
                  Sao chép
                </Button>
              </div>

              {/* REFERENCE */}

              <div className="payroll-payment-reference">
                <Form.Group>
                  <Form.Label>Mã giao dịch / tham chiếu ngân hàng</Form.Label>

                  <Form.Control
                    value={paymentReference}
                    disabled={markingPaid}
                    maxLength={100}
                    placeholder="VD: MB202610220001 (không bắt buộc)"
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />

                  <Form.Text>
                    Có thể nhập mã giao dịch sau khi chuyển khoản để tiện đối
                    soát.
                  </Form.Text>
                </Form.Group>
              </div>
            </>
          )}

          {/* NO QR */}

          {!generating && !qrData && (
            <div className="payroll-qr-error">
              <FaExclamationTriangle />

              <strong>Không có mã QR</strong>

              <span>
                Kiểm tra lại tài khoản ngân hàng của nhân viên rồi thử lại.
              </span>

              <Button type="button" onClick={generateQR}>
                <FaQrcode />
                Tạo lại QR
              </Button>
            </div>
          )}
        </Modal.Body>

        {/* FOOTER */}

        {!generating && qrData && (
          <Modal.Footer className="payroll-qr-footer">
            <Button
              type="button"
              className="payroll-qr-close-btn"
              disabled={markingPaid}
              onClick={handleClose}
            >
              Đóng
            </Button>

            <Button
              type="button"
              className="payroll-mark-paid-btn"
              disabled={markingPaid}
              onClick={handleMarkPaid}
            >
              {markingPaid ? (
                <>
                  <Spinner animation="border" size="sm" />
                  Đang xác nhận...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Đã chi lương
                </>
              )}
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
};

export default PayrollPayment;
