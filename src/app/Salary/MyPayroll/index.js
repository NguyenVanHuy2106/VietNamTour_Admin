import React, { useEffect, useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";

import {
  FaMoneyBillWave,
  FaCalendarAlt,
  FaEye,
  FaUser,
  FaBriefcase,
  FaCheckCircle,
  FaWallet,
  FaClock,
  FaShieldAlt,
  FaMinusCircle,
  FaPlusCircle,
  FaFileInvoiceDollar,
  FaSyncAlt,
} from "react-icons/fa";

import APIToken from "../../../config/APIToken";

import "./index.css";

// ==========================================================
// FORMAT TIỀN
// ==========================================================

const formatMoney = (value) => {
  const number = Number(value || 0);

  return number.toLocaleString("vi-VN");
};

// ==========================================================
// FORMAT NGÀY
// ==========================================================

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
};

// ==========================================================
// FORMAT CÔNG
// ==========================================================

const formatWorkDay = (value) => {
  const number = Number(value || 0);

  if (Number.isInteger(number)) {
    return number;
  }

  return number.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
};

// ==========================================================
// LOẠI NHÂN SỰ
// ==========================================================

const getEmployeeTypeLabel = (type) => {
  const map = {
    OFFICIAL: "Nhân viên chính thức",
    PROBATION: "Nhân viên thử việc",
    INTERN: "Thực tập sinh",
    PART_TIME: "Nhân viên bán thời gian",
    COLLABORATOR: "Cộng tác viên",
  };

  return map[type] || type || "-";
};

// ==========================================================
// COMPONENT
// ==========================================================

const MyPayroll = () => {
  // ========================================================
  // USER ID ĐANG ĐĂNG NHẬP
  // ========================================================

  const userId = Number(localStorage.getItem("userId"));

  // ========================================================
  // STATE
  // ========================================================

  const [loading, setLoading] = useState(true);

  const [loadingDetail, setLoadingDetail] = useState(false);

  const [payrolls, setPayrolls] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);

  const [detail, setDetail] = useState(null);

  const [showDetail, setShowDetail] = useState(false);

  // ========================================================
  // LOAD DATA
  // ========================================================

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchPayrolls();
  }, [userId]);

  // ========================================================
  // GET DANH SÁCH BẢNG LƯƠNG
  // ========================================================

  const fetchPayrolls = async () => {
    try {
      setLoading(true);

      const res = await APIToken.get("/salary/my-payroll", {
        params: {
          user_id: userId,
        },
      });

      const responseData = res?.data?.data;

      setPayrolls(responseData?.payrolls || []);

      setCurrentUser(responseData?.user || null);
    } catch (error) {
      console.error("fetchPayrolls error:", error);

      alert(error?.response?.data?.message || "Không thể tải bảng lương.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // XEM CHI TIẾT
  // ========================================================

  const handleViewDetail = async (payrollId) => {
    try {
      setLoadingDetail(true);

      setDetail(null);

      setShowDetail(true);

      const res = await APIToken.get(`/salary/my-payroll/${payrollId}`, {
        params: {
          user_id: userId,
        },
      });

      setDetail(res?.data?.data || null);
    } catch (error) {
      console.error("get payroll detail error:", error);

      setShowDetail(false);

      alert(
        error?.response?.data?.message || "Không thể xem chi tiết bảng lương.",
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  // ========================================================
  // CLOSE DETAIL
  // ========================================================

  const handleCloseDetail = () => {
    setShowDetail(false);
    setDetail(null);
  };

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="my-payroll-loading">
        <Spinner animation="border" />

        <div>Đang tải bảng lương...</div>
      </div>
    );
  }

  // ========================================================
  // USER ID NOT FOUND
  // ========================================================

  if (!userId) {
    return (
      <div className="my-payroll-page">
        <div className="my-payroll-empty">
          <FaUser />

          <h4>Không xác định được tài khoản đăng nhập</h4>

          <p>Vui lòng đăng nhập lại để xem bảng lương.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-payroll-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="my-payroll-header">
        <div>
          <div className="my-payroll-eyebrow">VIỆT NAM TOUR</div>

          <h2>
            <FaMoneyBillWave />
            Lương của tôi
          </h2>

          <p>Xem các kỳ lương đã được công bố.</p>
        </div>

        <Button className="my-payroll-refresh-btn" onClick={fetchPayrolls}>
          <FaSyncAlt />
          Làm mới
        </Button>
      </div>

      {/* ==================================================
          EMPLOYEE INFO
      ================================================== */}

      <div className="my-payroll-user-card">
        <div className="my-payroll-avatar">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt={currentUser?.name || "Avatar"} />
          ) : (
            <FaUser />
          )}
        </div>

        <div className="my-payroll-user-info">
          <span>Nhân viên</span>

          <h4>{currentUser?.name || `Nhân viên #${userId}`}</h4>

          <div className="my-payroll-user-meta">
            <span>
              <FaBriefcase />

              {currentUser?.position || "Chưa cập nhật chức vụ"}
            </span>

            <span>Mã nhân viên: {userId}</span>
          </div>
        </div>
      </div>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="my-payroll-summary">
        <div className="my-payroll-summary-card">
          <div className="summary-icon">
            <FaFileInvoiceDollar />
          </div>

          <div>
            <span>Tổng kỳ lương</span>

            <strong>{payrolls.length}</strong>
          </div>
        </div>

        <div className="my-payroll-summary-card">
          <div className="summary-icon">
            <FaCheckCircle />
          </div>

          <div>
            <span>Dữ liệu hiển thị</span>

            <strong className="summary-published">Đã công bố</strong>
          </div>
        </div>
      </div>

      {/* ==================================================
          PAYROLL LIST
      ================================================== */}

      <div className="my-payroll-content-card">
        <div className="my-payroll-section-title">
          <div>
            <h4>Danh sách bảng lương</h4>

            <p>Chọn một kỳ để xem phiếu lương chi tiết.</p>
          </div>
        </div>

        {payrolls.length === 0 ? (
          <div className="my-payroll-empty">
            <FaFileInvoiceDollar />

            <h4>Chưa có bảng lương</h4>

            <p>Hiện chưa có kỳ lương nào được công bố cho bạn.</p>
          </div>
        ) : (
          <>
            {/* ============================================
                DESKTOP TABLE
            ============================================ */}

            <div className="my-payroll-table-wrapper">
              <table className="my-payroll-table">
                <thead>
                  <tr>
                    <th>Kỳ lương</th>

                    <th>Thời gian</th>

                    <th className="text-center">Công chuẩn</th>

                    <th className="text-center">Công thực tế</th>

                    <th className="text-end">Thực nhận</th>

                    <th className="text-center">Trạng thái</th>

                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {payrolls.map((item) => (
                    <tr key={item.employee_payroll_id}>
                      <td>
                        <div className="period-name">
                          {item.period_name ||
                            item.period_code ||
                            `Kỳ #${item.payroll_period_id}`}
                        </div>

                        {item.period_code && (
                          <div className="period-code">{item.period_code}</div>
                        )}
                      </td>

                      <td>
                        <div className="period-date">
                          <FaCalendarAlt />

                          {formatDate(item.start_date)}

                          <span>→</span>

                          {formatDate(item.end_date)}
                        </div>
                      </td>

                      <td className="text-center">
                        <strong>
                          {formatWorkDay(item.standard_work_days)}
                        </strong>
                      </td>

                      <td className="text-center">
                        <strong>{formatWorkDay(item.actual_work_days)}</strong>
                      </td>

                      <td className="text-end">
                        <strong className="salary-net-value">
                          {formatMoney(item.net_salary)}₫
                        </strong>
                      </td>

                      <td className="text-center">
                        <span className="payroll-published-badge">
                          <FaCheckCircle />
                          Đã công bố
                        </span>
                      </td>

                      <td className="text-center">
                        <Button
                          className="view-payroll-btn"
                          onClick={() =>
                            handleViewDetail(item.employee_payroll_id)
                          }
                        >
                          <FaEye />
                          Xem kỳ lương
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ============================================
                MOBILE
            ============================================ */}

            <div className="my-payroll-mobile-list">
              {payrolls.map((item) => (
                <div
                  className="my-payroll-mobile-card"
                  key={item.employee_payroll_id}
                >
                  <div className="mobile-payroll-top">
                    <div>
                      <span>Kỳ lương</span>

                      <h5>
                        {item.period_name ||
                          item.period_code ||
                          `Kỳ #${item.payroll_period_id}`}
                      </h5>
                    </div>

                    <span className="payroll-published-badge">
                      <FaCheckCircle />
                      Đã công bố
                    </span>
                  </div>

                  <div className="mobile-period-date">
                    <FaCalendarAlt />

                    {formatDate(item.start_date)}

                    <span>→</span>

                    {formatDate(item.end_date)}
                  </div>

                  <div className="mobile-payroll-grid">
                    <div>
                      <span>Công chuẩn</span>

                      <strong>{formatWorkDay(item.standard_work_days)}</strong>
                    </div>

                    <div>
                      <span>Công thực tế</span>

                      <strong>{formatWorkDay(item.actual_work_days)}</strong>
                    </div>
                  </div>

                  <div className="mobile-net-salary">
                    <span>Thực nhận</span>

                    <strong>{formatMoney(item.net_salary)}₫</strong>
                  </div>

                  <Button
                    className="mobile-view-btn"
                    onClick={() => handleViewDetail(item.employee_payroll_id)}
                  >
                    <FaEye />
                    Xem phiếu lương
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ==================================================
          DETAIL MODAL
      ================================================== */}

      <Modal
        show={showDetail}
        onHide={handleCloseDetail}
        size="lg"
        centered
        dialogClassName="my-payroll-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileInvoiceDollar />
            Phiếu lương
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {loadingDetail ? (
            <div className="detail-loading">
              <Spinner animation="border" />

              <span>Đang tải phiếu lương...</span>
            </div>
          ) : detail ? (
            <PayrollDetail detail={detail} />
          ) : (
            <div className="detail-loading">Không có dữ liệu.</div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDetail}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// ==========================================================
// PAYROLL DETAIL
// ==========================================================

// const PayrollDetail = ({ detail }) => {
//   const employee = detail?.employee || {};

//   const period = detail?.period || {};

//   const attendance = detail?.attendance || {};

//   const salary = detail?.salary || {};

//   const insurance = detail?.insurance || {};

//   const adjustments = detail?.adjustments || [];

//   return (
//     <div className="payroll-detail">
//       {/* ================================================
//           COMPANY
//       ================================================ */}

//       <div className="payslip-brand">
//         <div className="payslip-brand-icon">VNT</div>

//         <div>
//           <strong>VIỆT NAM TOUR</strong>

//           <span>CÔNG TY TNHH THƯƠNG MẠI DU LỊCH VÀ SỰ KIỆN VIỆT NAM</span>
//         </div>
//       </div>

//       {/* ================================================
//           TITLE
//       ================================================ */}

//       <div className="payslip-title">
//         <h3>PHIẾU LƯƠNG</h3>

//         <p>{period.period_name || period.period_code || "Kỳ lương"}</p>

//         <span>
//           {formatDate(period.start_date)}
//           {" - "}
//           {formatDate(period.end_date)}
//         </span>
//       </div>

//       {/* ================================================
//           EMPLOYEE
//       ================================================ */}

//       <div className="payslip-employee">
//         <div>
//           <span>Nhân viên</span>

//           <strong>{employee.name || "-"}</strong>
//         </div>

//         <div>
//           <span>Chức vụ</span>

//           <strong>{employee.position || "-"}</strong>
//         </div>

//         <div>
//           <span>Loại nhân sự</span>

//           <strong>{getEmployeeTypeLabel(employee.employee_type)}</strong>
//         </div>

//         <div>
//           <span>Mã nhân viên</span>

//           <strong>{employee.user_id || "-"}</strong>
//         </div>
//       </div>

//       {/* ================================================
//           ATTENDANCE
//       ================================================ */}

//       <div className="payslip-section">
//         <div className="payslip-section-heading">
//           <FaClock />

//           <span>Ngày công</span>
//         </div>

//         <SalaryRow
//           label="Công chuẩn"
//           value={`${formatWorkDay(attendance.standard_work_days)} công`}
//         />

//         <SalaryRow
//           label="Công thực tế"
//           value={`${formatWorkDay(attendance.actual_work_days)} công`}
//           strong
//         />
//       </div>

//       {/* ================================================
//           INCOME
//       ================================================ */}

//       <div className="payslip-section">
//         <div className="payslip-section-heading">
//           <FaPlusCircle />

//           <span>Thu nhập</span>
//         </div>

//         <SalaryRow label="Lương cơ bản" money={salary.base_salary} />

//         <SalaryRow label="Lương theo công" money={salary.attendance_salary} />

//         <SalaryRow label="Phụ cấp cố định" money={salary.fixed_allowance} />

//         <SalaryRow label="Phụ cấp khác" money={salary.additional_allowance} />

//         <SalaryRow label="Thưởng" money={salary.bonus_amount} positive />

//         {adjustments
//           .filter((item) =>
//             ["ALLOWANCE", "BONUS", "ADD"].includes(item.adjustment_type),
//           )
//           .map((item) => (
//             <SalaryRow
//               key={item.payroll_adjustment_id}
//               label={item.adjustment_name || "Khoản cộng"}
//               money={item.amount}
//               positive
//               note={item.note}
//             />
//           ))}

//         <SalaryRow label="Tổng thu nhập" money={salary.gross_salary} total />
//       </div>

//       {/* ================================================
//           INSURANCE
//       ================================================ */}

//       <div className="payslip-section">
//         <div className="payslip-section-heading">
//           <FaShieldAlt />

//           <span>Bảo hiểm</span>
//         </div>

//         <SalaryRow
//           label="Mức lương đóng bảo hiểm"
//           money={insurance.insurance_salary}
//         />

//         <SalaryRow
//           label="BHXH"
//           money={insurance.social_insurance_amount}
//           negative
//         />

//         <SalaryRow
//           label="BHYT"
//           money={insurance.health_insurance_amount}
//           negative
//         />

//         <SalaryRow
//           label="BHTN"
//           money={insurance.unemployment_insurance_amount}
//           negative
//         />

//         <SalaryRow
//           label="Tổng bảo hiểm"
//           money={insurance.total_insurance_amount}
//           negative
//           total
//         />
//       </div>

//       {/* ================================================
//           DEDUCTION
//       ================================================ */}

//       <div className="payslip-section">
//         <div className="payslip-section-heading">
//           <FaMinusCircle />

//           <span>Khấu trừ</span>
//         </div>

//         <SalaryRow
//           label="Khấu trừ khác"
//           money={salary.deduction_amount}
//           negative
//         />

//         <SalaryRow
//           label="Thuế TNCN"
//           money={salary.personal_income_tax}
//           negative
//         />

//         {adjustments
//           .filter((item) =>
//             ["DEDUCTION", "DEDUCT"].includes(item.adjustment_type),
//           )
//           .map((item) => (
//             <SalaryRow
//               key={item.payroll_adjustment_id}
//               label={item.adjustment_name || "Khoản khấu trừ"}
//               money={item.amount}
//               negative
//               note={item.note}
//             />
//           ))}
//       </div>

//       {/* ================================================
//           NET
//       ================================================ */}

//       <div className="payslip-net">
//         <div>
//           <FaWallet />

//           <div>
//             <span>THỰC NHẬN</span>

//             <small>Số tiền thực nhận trong kỳ</small>
//           </div>
//         </div>

//         <strong>{formatMoney(salary.net_salary)}₫</strong>
//       </div>

//       <div className="payslip-status">
//         <FaCheckCircle />
//         Bảng lương đã được công bố
//       </div>
//     </div>
//   );
// };

const PayrollDetail = ({ detail }) => {
  const employee = detail?.employee || {};

  const period = detail?.period || {};

  const attendance = detail?.attendance || {};

  const salary = detail?.salary || {};

  const insurance = detail?.insurance || {};

  const adjustments = detail?.adjustments || [];

  const incomeAdjustments = adjustments.filter((item) =>
    ["ALLOWANCE", "BONUS", "ADD"].includes(item.adjustment_type),
  );

  const deductionAdjustments = adjustments.filter((item) =>
    ["DEDUCTION", "DEDUCT"].includes(item.adjustment_type),
  );

  return (
    <div className="payroll-detail compact-payslip">
      {/* ================================================
          HEADER
      ================================================ */}

      <div className="compact-payslip-header">
        <div>
          <div className="compact-company">VIỆT NAM TOUR</div>

          <h3>PHIẾU LƯƠNG</h3>

          <p>{period.period_name || period.period_code || "Kỳ lương"}</p>
        </div>

        <div className="compact-period">
          <span>Kỳ lương</span>

          <strong>
            {formatDate(period.start_date)}
            {" - "}
            {formatDate(period.end_date)}
          </strong>

          <div className="compact-published">
            <FaCheckCircle />
            Đã công bố
          </div>
        </div>
      </div>

      {/* ================================================
          EMPLOYEE
      ================================================ */}

      <div className="compact-employee-grid">
        <CompactInfo label="Nhân viên" value={employee.name || "-"} />

        <CompactInfo label="Chức vụ" value={employee.position || "-"} />

        <CompactInfo
          label="Loại nhân sự"
          value={getEmployeeTypeLabel(employee.employee_type)}
        />

        <CompactInfo label="Mã nhân viên" value={employee.user_id || "-"} />
      </div>

      {/* ================================================
          MAIN GRID
      ================================================ */}

      <div className="compact-payroll-grid">
        {/* LEFT */}

        <div className="compact-payroll-column">
          {/* CÔNG */}

          <div className="compact-section">
            <div className="compact-section-title">
              <FaClock />
              Ngày công
            </div>

            <CompactRow
              label="Công chuẩn"
              value={`${formatWorkDay(attendance.standard_work_days)} công`}
            />

            <CompactRow
              label="Công thực tế"
              value={`${formatWorkDay(attendance.actual_work_days)} công`}
              highlight
            />
          </div>

          {/* THU NHẬP */}

          <div className="compact-section">
            <div className="compact-section-title">
              <FaPlusCircle />
              Thu nhập
            </div>

            <CompactMoneyRow label="Lương cơ bản" value={salary.base_salary} />

            <CompactMoneyRow
              label="Lương theo công"
              value={salary.attendance_salary}
            />

            <CompactMoneyRow
              label="Phụ cấp cố định"
              value={salary.fixed_allowance}
            />

            {Number(salary.additional_allowance || 0) !== 0 && (
              <CompactMoneyRow
                label="Phụ cấp khác"
                value={salary.additional_allowance}
              />
            )}

            {Number(salary.bonus_amount || 0) !== 0 && (
              <CompactMoneyRow
                label="Thưởng"
                value={salary.bonus_amount}
                positive
              />
            )}

            {incomeAdjustments.map((item) => (
              <CompactMoneyRow
                key={item.payroll_adjustment_id}
                label={item.adjustment_name || "Khoản cộng"}
                value={item.amount}
                positive
              />
            ))}

            <CompactMoneyRow
              label="Tổng thu nhập"
              value={salary.gross_salary}
              total
            />
          </div>
        </div>

        {/* RIGHT */}

        <div className="compact-payroll-column">
          {/* BẢO HIỂM */}

          <div className="compact-section">
            <div className="compact-section-title">
              <FaShieldAlt />
              Bảo hiểm
            </div>

            <CompactMoneyRow
              label="Mức đóng BH"
              value={insurance.insurance_salary}
            />

            <CompactMoneyRow
              label="BHXH"
              value={insurance.social_insurance_amount}
              negative
            />

            <CompactMoneyRow
              label="BHYT"
              value={insurance.health_insurance_amount}
              negative
            />

            <CompactMoneyRow
              label="BHTN"
              value={insurance.unemployment_insurance_amount}
              negative
            />

            <CompactMoneyRow
              label="Tổng bảo hiểm"
              value={insurance.total_insurance_amount}
              negative
              total
            />
          </div>

          {/* KHẤU TRỪ */}

          <div className="compact-section">
            <div className="compact-section-title">
              <FaMinusCircle />
              Khấu trừ
            </div>

            {Number(salary.deduction_amount || 0) !== 0 && (
              <CompactMoneyRow
                label="Khấu trừ khác"
                value={salary.deduction_amount}
                negative
              />
            )}

            {Number(salary.personal_income_tax || 0) !== 0 && (
              <CompactMoneyRow
                label="Thuế TNCN"
                value={salary.personal_income_tax}
                negative
              />
            )}

            {deductionAdjustments.map((item) => (
              <CompactMoneyRow
                key={item.payroll_adjustment_id}
                label={item.adjustment_name || "Khoản khấu trừ"}
                value={item.amount}
                negative
              />
            ))}

            {Number(salary.deduction_amount || 0) === 0 &&
              Number(salary.personal_income_tax || 0) === 0 &&
              deductionAdjustments.length === 0 && (
                <div className="compact-no-data">
                  Không có khoản khấu trừ khác
                </div>
              )}
          </div>
        </div>
      </div>

      {/* ================================================
          NET SALARY
      ================================================ */}

      <div className="compact-net-salary">
        <div>
          <FaWallet />

          <div>
            <span>THỰC NHẬN</span>

            <small>Thu nhập sau bảo hiểm và khấu trừ</small>
          </div>
        </div>

        <strong>{formatMoney(salary.net_salary)}₫</strong>
      </div>
    </div>
  );
};

const CompactInfo = ({ label, value }) => {
  return (
    <div className="compact-info">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
};

const CompactRow = ({ label, value, highlight = false }) => {
  return (
    <div className="compact-row">
      <span>{label}</span>

      <strong className={highlight ? "compact-highlight" : ""}>{value}</strong>
    </div>
  );
};

const CompactMoneyRow = ({
  label,
  value,
  positive = false,
  negative = false,
  total = false,
}) => {
  const className = ["compact-row", total ? "compact-row-total" : ""]
    .filter(Boolean)
    .join(" ");

  const valueClass = [
    positive ? "compact-positive" : "",
    negative ? "compact-negative" : "",
    total ? "compact-total-value" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <span>{label}</span>

      <strong className={valueClass}>{formatMoney(value)} ₫</strong>
    </div>
  );
};

// ==========================================================
// SALARY ROW
// ==========================================================

const SalaryRow = ({
  label,
  money,
  value,
  strong = false,
  positive = false,
  negative = false,
  total = false,
  note,
}) => {
  return (
    <div
      className={["salary-row", total ? "salary-row-total" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        <span>{label}</span>

        {note && <small>{note}</small>}
      </div>

      <strong
        className={[
          strong ? "salary-row-strong" : "",

          positive ? "salary-row-positive" : "",

          negative ? "salary-row-negative" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value !== undefined ? value : `${formatMoney(money)} ₫`}
      </strong>
    </div>
  );
};

export default MyPayroll;
