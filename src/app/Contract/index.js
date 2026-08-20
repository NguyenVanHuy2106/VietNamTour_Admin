import React, { useEffect, useState } from "react";

import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

import {
  BsCaretLeftFill,
  BsCaretRightFill,
  BsDownload,
  BsEye,
  BsFileEarmarkPdf,
  BsFunnel,
  BsPencil,
  BsPlusLg,
  BsSearch,
  BsThreeDotsVertical,
  BsTrash,
} from "react-icons/bs";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import "./index.css";

// ============================================================
// CONFIG
// ============================================================

const ITEMS_PER_PAGE = 10;

// ============================================================
// STATUS
// ============================================================

const STATUS_OPTIONS = [
  {
    value: "",
    label: "Tất cả trạng thái",
  },
  {
    value: "draft",
    label: "Nháp",
  },
  {
    value: "signed",
    label: "Đã ký kết",
  },
  {
    value: "processing",
    label: "Đang thực hiện",
  },
  {
    value: "liquidated",
    label: "Đã thanh lý",
  },
  {
    value: "cancelled",
    label: "Đã hủy",
  },
];

// ============================================================
// CONTRACT TYPE
// ============================================================

const CONTRACT_TYPES = [
  {
    value: "",
    label: "Tất cả loại hợp đồng",
  },
  {
    value: "travel",
    label: "Hợp đồng dịch vụ du lịch",
  },
  {
    value: "event",
    label: "Hợp đồng dịch vụ sự kiện",
  },
  {
    value: "transport",
    label: "Hợp đồng vận chuyển",
  },
];

// ============================================================
// FORMAT MONEY
// ============================================================

const formatMoney = (value) => {
  const amount = Number(value) || 0;

  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
};

// ============================================================
// FORMAT DATE
// ============================================================

const formatDate = (value) => {
  if (!value) {
    return "---";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
};

// ============================================================
// STATUS META
// ============================================================

const getStatusMeta = (status) => {
  const statusMap = {
    draft: {
      label: "Nháp",
      className: "draft",
    },

    signed: {
      label: "Đã ký kết",
      className: "signed",
    },

    processing: {
      label: "Đang thực hiện",
      className: "processing",
    },

    liquidated: {
      label: "Đã thanh lý",
      className: "liquidated",
    },

    cancelled: {
      label: "Đã hủy",
      className: "cancelled",
    },
  };

  return (
    statusMap[status] || {
      label: "Không xác định",
      className: "draft",
    }
  );
};

// ============================================================
// TYPE LABEL
// ============================================================

const getTypeLabel = (type) => {
  const map = {
    travel: "Hợp đồng dịch vụ du lịch",

    event: "Hợp đồng dịch vụ sự kiện",

    transport: "Hợp đồng vận chuyển",
  };

  return map[type] || "Không xác định";
};

// ============================================================
// CONTRACT LIST
// ============================================================

const ContractList = () => {
  // ==========================================================
  // DATA
  // ==========================================================

  const [contracts, setContracts] = useState([]);

  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(false);

  // ==========================================================
  // FILTER
  // ==========================================================

  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");

  const [status, setStatus] = useState("");

  const [contractType, setContractType] = useState("");

  const [customerId, setCustomerId] = useState("");

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const [currentPage, setCurrentPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,

    limit: ITEMS_PER_PAGE,

    total: 0,

    total_pages: 1,
  });

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const [stats, setStats] = useState({
    total: 0,

    draft: 0,

    signed: 0,

    processing: 0,

    liquidated: 0,

    cancelled: 0,
  });

  // ==========================================================
  // LOAD INIT
  // ==========================================================

  useEffect(() => {
    //getCustomers();

    getContractStatistics();
  }, []);

  // ==========================================================
  // LOAD CONTRACT
  // ==========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      getContracts();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    currentPage,
    searchTerm,
    status,
    contractType,
    customerId,
    fromDate,
    toDate,
  ]);

  // ==========================================================
  // GET CONTRACTS
  // ==========================================================

  const getContracts = async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,

        limit: ITEMS_PER_PAGE,
      };

      // ================================================
      // SEARCH
      // ================================================

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // ================================================
      // STATUS
      // ================================================

      if (status) {
        params.status = status;
      }

      // ================================================
      // TYPE
      // ================================================

      if (contractType) {
        params.contract_type = contractType;
      }

      // ================================================
      // CUSTOMER
      // ================================================

      if (customerId) {
        params.customer_id = customerId;
      }

      // ================================================
      // DATE
      // ================================================

      if (fromDate) {
        params.from_date = fromDate;
      }

      if (toDate) {
        params.to_date = toDate;
      }

      // ================================================
      // CALL API
      // ================================================

      const response = await API.get("/contracts/get", {
        params,
      });

      const contractData = response?.data?.data || [];

      setContracts(contractData);

      setPagination(
        response?.data?.pagination || {
          page: currentPage,

          limit: ITEMS_PER_PAGE,

          total: contractData.length,

          total_pages: 1,
        },
      );
    } catch (error) {
      console.error("Lỗi lấy danh sách hợp đồng:", error);

      console.error("Backend:", error?.response?.data);

      setContracts([]);

      setPagination({
        page: 1,

        limit: ITEMS_PER_PAGE,

        total: 0,

        total_pages: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // GET CUSTOMERS
  // ==========================================================

  // const getCustomers = async () => {
  //   try {
  //     const response = await API.get("/customers/get");

  //     setCustomers(response?.data?.data || []);
  //   } catch (error) {
  //     console.error("Lỗi lấy khách hàng:", error);

  //     setCustomers([]);
  //   }
  // };

  // ==========================================================
  // GET STATISTICS
  // ==========================================================

  const getContractStatistics = async () => {
    try {
      const response = await API.get("/contracts/statistics");

      const data = response?.data?.data || {};

      setStats({
        total: Number(data.total) || 0,

        draft: Number(data.draft) || 0,

        signed: Number(data.signed) || 0,

        processing: Number(data.processing) || 0,

        liquidated: Number(data.liquidated) || 0,

        cancelled: Number(data.cancelled) || 0,
      });
    } catch (error) {
      console.error("Lỗi thống kê hợp đồng:", error);
    }
  };

  // ==========================================================
  // RESET FILTER
  // ==========================================================

  const resetFilters = () => {
    setSearchTerm("");

    setStatus("");

    setContractType("");

    setCustomerId("");

    setFromDate("");

    setToDate("");

    setCurrentPage(1);
  };

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const goTo = (path) => {
    window.location.href = path;
  };

  // ==========================================================
  // DELETE CONTRACT
  // ==========================================================

  const handleDeleteContract = async (contractId, contractCode) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa hợp đồng ${contractCode || ""}?`,
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await APIToken.delete(`/contracts/delete/${contractId}`);

      alert("Xóa hợp đồng thành công");

      // ================================================
      // LOAD LẠI DATA
      // ================================================

      await getContracts();

      await getContractStatistics();
    } catch (error) {
      console.error("Lỗi xóa hợp đồng:", error);

      console.error("Backend:", error?.response?.data);

      alert(error?.response?.data?.message || "Không thể xóa hợp đồng");
    }
  };

  // ==========================================================
  // EXPORT
  // ==========================================================

  const handleExportExcel = () => {
    console.log("Xuất Excel");
  };

  const handleExportPDF = () => {
    console.log("Xuất PDF");
  };

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    Number(pagination.total_pages) || 1,

    1,
  );

  const totalResults = Number(pagination.total) || 0;

  const startIndex =
    totalResults > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;

  const endIndex = Math.min(
    currentPage * ITEMS_PER_PAGE,

    totalResults,
  );

  // ==========================================================
  // PAGE NUMBER
  // ==========================================================

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages,
        },

        (_, index) => index + 1,
      );
    }

    let startPage = Math.max(currentPage - 2, 1);

    let endPage = startPage + 4;

    if (endPage > totalPages) {
      endPage = totalPages;

      startPage = totalPages - 4;
    }

    return Array.from(
      {
        length: endPage - startPage + 1,
      },

      (_, index) => startPage + index,
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="ct-container">
      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="ct-breadcrumb">
        <span>Hợp đồng</span>

        <span>/</span>

        <strong>Danh sách hợp đồng</strong>
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="ct-header">
        <div className="ct-header-info">
          <h2>Danh sách hợp đồng</h2>

          <p>Quản lý tất cả hợp đồng dịch vụ du lịch</p>
        </div>

        <div className="ct-header-actions">
          {/* =================================================
              EXPORT EXCEL
          ================================================= */}

          <Button
            variant="light"
            className="ct-outline-btn"
            onClick={handleExportExcel}
          >
            <BsDownload />

            <span>Xuất Excel</span>
          </Button>

          {/* =================================================
              EXPORT PDF
          ================================================= */}

          <Button
            variant="light"
            className="ct-outline-btn"
            onClick={handleExportPDF}
          >
            <BsFileEarmarkPdf />

            <span>Xuất PDF</span>
          </Button>

          {/* =================================================
              FILTER
          ================================================= */}

          <Button variant="light" className="ct-outline-btn">
            <BsFunnel />

            <span>Bộ lọc</span>
          </Button>

          {/* =================================================
              ADD
          ================================================= */}

          <Button className="ct-add-btn" onClick={() => goTo("/contract-add")}>
            <BsPlusLg />

            <span>Thêm hợp đồng</span>
          </Button>
        </div>
      </div>

      {/* =====================================================
          FILTER CARD
      ===================================================== */}

      <div className="ct-filter-card">
        <div className="ct-filter-grid">
          {/* =================================================
              SEARCH
          ================================================= */}

          <InputGroup className="ct-search">
            <Form.Control
              value={searchTerm}
              placeholder="Nhập số hợp đồng, tên hợp đồng..."
              onChange={(event) => {
                setSearchTerm(event.target.value);

                setCurrentPage(1);
              }}
            />

            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
          </InputGroup>

          {/* =================================================
              CUSTOMER
          ================================================= */}

          {/* <Form.Select
            value={customerId}
            onChange={(event) => {
              setCustomerId(event.target.value);

              setCurrentPage(1);
            }}
          >
            <option value="">Chọn khách hàng</option>

            {customers.map((customer) => (
              <option key={customer.customer_id} value={customer.customer_id}>
                {customer.customer_name}
              </option>
            ))}
          </Form.Select> */}

          {/* =================================================
              TYPE
          ================================================= */}

          <Form.Select
            value={contractType}
            onChange={(event) => {
              setContractType(event.target.value);

              setCurrentPage(1);
            }}
          >
            {CONTRACT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Form.Select>

          {/* =================================================
              STATUS
          ================================================= */}

          <Form.Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);

              setCurrentPage(1);
            }}
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Form.Select>

          {/* =================================================
              DATE
          ================================================= */}

          <div className="ct-date-range">
            <Form.Control
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);

                setCurrentPage(1);
              }}
            />

            <span>—</span>

            <Form.Control
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);

                setCurrentPage(1);
              }}
            />
          </div>

          {/* =================================================
              RESET
          ================================================= */}
        </div>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="ct-stat-grid">
        {/* ===================================================
            TOTAL
        =================================================== */}

        <div className="ct-stat-card blue">
          <div className="ct-stat-icon">📄</div>

          <div>
            <span>Tổng số hợp đồng</span>

            <strong>{stats.total}</strong>

            <small>Quản lý toàn bộ hợp đồng</small>
          </div>
        </div>

        {/* ===================================================
            SIGNED
        =================================================== */}

        <div className="ct-stat-card green">
          <div className="ct-stat-icon">✓</div>

          <div>
            <span>Đã ký kết</span>

            <strong>{stats.signed}</strong>

            <small>Hợp đồng đã hoàn tất ký</small>
          </div>
        </div>

        {/* ===================================================
            PROCESSING
        =================================================== */}

        <div className="ct-stat-card yellow">
          <div className="ct-stat-icon">◷</div>

          <div>
            <span>Đang thực hiện</span>

            <strong>{stats.processing}</strong>

            <small>Hợp đồng đang triển khai</small>
          </div>
        </div>

        {/* ===================================================
            LIQUIDATED
        =================================================== */}

        <div className="ct-stat-card red">
          <div className="ct-stat-icon">×</div>

          <div>
            <span>Đã thanh lý</span>

            <strong>{stats.liquidated}</strong>

            <small>Hợp đồng đã kết thúc</small>
          </div>
        </div>
      </div>

      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      <div className="ct-content-card">
        {/* ===================================================
            TABLE TOP
        =================================================== */}

        <div className="ct-table-top">
          <span>
            Hiển thị <strong>{ITEMS_PER_PAGE}</strong> kết quả
          </span>

          <span>
            Tổng cộng <strong>{totalResults}</strong> hợp đồng
          </span>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="table-responsive">
          <table className="ct-table">
            <thead>
              <tr>
                <th>
                  <Form.Check />
                </th>

                <th>Số hợp đồng</th>

                <th>Tên hợp đồng</th>

                <th>Khách hàng</th>

                <th>Loại hợp đồng</th>

                <th className="text-end">Tổng giá trị (đã VAT)</th>

                <th>Ngày ký</th>

                <th>Trạng thái</th>

                <th>Người tạo</th>

                <th className="text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {/* =================================================
                  LOADING
              ================================================= */}

              {loading ? (
                <tr>
                  <td colSpan="10" className="ct-empty">
                    <Spinner animation="border" size="sm" />

                    <span className="ms-2">Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : contracts.length > 0 ? (
                contracts.map((item) => {
                  const statusMeta = getStatusMeta(item.status);

                  return (
                    <tr key={item.contract_id}>
                      <td data-label="">
                        <Form.Check />
                      </td>

                      <td data-label="Số hợp đồng">
                        <button
                          type="button"
                          className="ct-code-link"
                          onClick={() =>
                            goTo(`/contracts/detail/${item.contract_id}`)
                          }
                        >
                          {item.contract_code}
                        </button>
                      </td>

                      <td
                        data-label="Tên hợp đồng"
                        className="ct-contract-name"
                      >
                        {item.contract_name}
                      </td>

                      <td data-label="Khách hàng">
                        {item.customer_name || "---"}
                      </td>

                      <td data-label="Loại hợp đồng">
                        <span
                          className={`ct-type-badge ${
                            item.contract_type || ""
                          }`}
                        >
                          {getTypeLabel(item.contract_type)}
                        </span>
                      </td>

                      <td
                        data-label="Tổng giá trị"
                        className="text-end ct-money"
                      >
                        {formatMoney(item.total_amount)}
                      </td>

                      <td data-label="Ngày ký">
                        {formatDate(item.signed_date)}
                      </td>

                      <td data-label="Trạng thái">
                        <span className={`ct-status ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </td>

                      <td data-label="Người tạo">
                        {item.created_by_name || item.created_by || "---"}
                      </td>

                      <td data-label="Thao tác" className="ct-action-cell">
                        <div className="ct-actions">
                          <button
                            type="button"
                            title="Xem hợp đồng"
                            aria-label="Xem hợp đồng"
                            onClick={() =>
                              goTo(`/contracts/detail/${item.contract_id}`)
                            }
                          >
                            <BsEye />
                          </button>

                          <button
                            type="button"
                            title="Sửa hợp đồng"
                            aria-label="Sửa hợp đồng"
                            onClick={() =>
                              navigate(`/contracts/edit/${item.contract_id}`)
                            }
                          >
                            <BsPencil />
                          </button>

                          <button
                            type="button"
                            title="Xóa hợp đồng"
                            aria-label="Xóa hợp đồng"
                            onClick={() =>
                              handleDeleteContract(
                                item.contract_id,
                                item.contract_code,
                              )
                            }
                          >
                            <BsTrash />
                          </button>

                          <button
                            type="button"
                            title="Thao tác khác"
                            aria-label="Thao tác khác"
                          >
                            <BsThreeDotsVertical />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                // =============================================
                // EMPTY
                // =============================================

                <tr>
                  <td colSpan="10" className="ct-empty">
                    Không tìm thấy hợp đồng phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            PAGINATION
        =================================================== */}

        <div className="ct-pagination">
          <span>
            Hiển thị {startIndex} đến {endIndex} của {totalResults} kết quả
          </span>

          <div className="ct-page-btns">
            {/* =================================================
                PREVIOUS
            ================================================= */}

            <button
              type="button"
              disabled={currentPage === 1 || loading}
              onClick={() =>
                setCurrentPage((value) =>
                  Math.max(
                    value - 1,

                    1,
                  ),
                )
              }
            >
              <BsCaretLeftFill />
            </button>

            {/* =================================================
                PAGE
            ================================================= */}

            {getPageNumbers().map((page) => (
              <button
                type="button"
                key={page}
                className={currentPage === page ? "active" : ""}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            {/* =================================================
                NEXT
            ================================================= */}

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() =>
                setCurrentPage((value) =>
                  Math.min(
                    value + 1,

                    totalPages,
                  ),
                )
              }
            >
              <BsCaretRightFill />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractList;
