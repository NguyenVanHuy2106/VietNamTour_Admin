import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";

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
} from "react-icons/bs";

import API from "../../config/APINoToken";
import "./index.css";

const ITEMS_PER_PAGE = 10;

const FALLBACK_CONTRACTS = [
  {
    contract_id: 1,
    contract_code: "2655/HĐVC2026",
    contract_name:
      "Tổ chức gói thầu tham quan nghỉ dưỡng cho viên chức, người lao động BVĐK Khánh Hội 2026",
    customer_id: 1,
    customer_name: "Bệnh viện Đa khoa Khánh Hội",
    contract_type: "travel",
    total_amount: 179000000,
    signed_date: "2026-07-30",
    status: "signed",
    created_by_name: "Nguyễn Văn Huy",
  },
  {
    contract_id: 2,
    contract_code: "2188/HDDL2026",
    contract_name: "Tour du lịch hè 2026 - Công ty TNHH Thương mại Minh Phát",
    customer_id: 2,
    customer_name: "Công ty TNHH Thương mại Minh Phát",
    contract_type: "travel",
    total_amount: 256780000,
    signed_date: "2026-07-28",
    status: "processing",
    created_by_name: "Trần Thị Mai",
  },
  {
    contract_id: 3,
    contract_code: "1987/HDSK2026",
    contract_name: "Tổ chức chương trình Team Building Công ty CP Đầu tư ABC",
    customer_id: 3,
    customer_name: "Công ty CP Đầu tư ABC",
    contract_type: "event",
    total_amount: 98500000,
    signed_date: "2026-07-25",
    status: "signed",
    created_by_name: "Lê Hoàng Nam",
  },
  {
    contract_id: 4,
    contract_code: "1723/HĐVC2026",
    contract_name: "Tham quan nghỉ dưỡng cho CBCNV Công ty CP Xây dựng 123",
    customer_id: 4,
    customer_name: "Công ty CP Xây dựng 123",
    contract_type: "travel",
    total_amount: 145600000,
    signed_date: "2026-07-20",
    status: "processing",
    created_by_name: "Nguyễn Văn Huy",
  },
  {
    contract_id: 5,
    contract_code: "1532/HDSK2026",
    contract_name:
      "Tổ chức sự kiện ra mắt sản phẩm mới Công ty TNHH Công nghệ XYZ",
    customer_id: 5,
    customer_name: "Công ty TNHH Công nghệ XYZ",
    contract_type: "event",
    total_amount: 320000000,
    signed_date: "2026-07-18",
    status: "signed",
    created_by_name: "Trần Thị Mai",
  },
  {
    contract_id: 6,
    contract_code: "1399/HĐVC2026",
    contract_name: "Tour nghỉ dưỡng Phú Quốc 2026",
    customer_id: 6,
    customer_name: "Công ty CP Dược phẩm DEF",
    contract_type: "travel",
    total_amount: 210450000,
    signed_date: "2026-07-15",
    status: "liquidated",
    created_by_name: "Lê Hoàng Nam",
  },
  {
    contract_id: 7,
    contract_code: "1288/HDDL2026",
    contract_name: "Tour xuyên Việt 2026",
    customer_id: 7,
    customer_name: "Công ty TNHH Thương mại GHI",
    contract_type: "travel",
    total_amount: 185300000,
    signed_date: "2026-07-12",
    status: "processing",
    created_by_name: "Nguyễn Văn Huy",
  },
];

const FALLBACK_CUSTOMERS = [
  {
    customer_id: 1,
    customer_name: "Bệnh viện Đa khoa Khánh Hội",
  },
  {
    customer_id: 2,
    customer_name: "Công ty TNHH Thương mại Minh Phát",
  },
  {
    customer_id: 3,
    customer_name: "Công ty CP Đầu tư ABC",
  },
  {
    customer_id: 4,
    customer_name: "Công ty CP Xây dựng 123",
  },
];

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

const formatMoney = (value) => {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))} đ`;
};

const formatDate = (value) => {
  if (!value) {
    return "---";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
};

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

const getTypeLabel = (type) => {
  const typeMap = {
    travel: "Hợp đồng dịch vụ du lịch",
    event: "Hợp đồng dịch vụ sự kiện",
    transport: "Hợp đồng vận chuyển",
  };

  return typeMap[type] || "---";
};

const ContractList = () => {
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [contractType, setContractType] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getContracts();
    getCustomers();
  }, []);

  const getContracts = async () => {
    try {
      setLoading(true);

      const response = await API.get("/contracts/get");

      const responseData = response?.data?.data || [];

      if (responseData.length > 0) {
        setContracts(responseData);
      } else {
        setContracts(FALLBACK_CONTRACTS);
      }
    } catch (error) {
      console.error("Không tải được danh sách hợp đồng:", error);

      setContracts(FALLBACK_CONTRACTS);
    } finally {
      setLoading(false);
    }
  };

  const getCustomers = async () => {
    try {
      const response = await API.get("/customers/get");

      const responseData = response?.data?.data || [];

      if (responseData.length > 0) {
        setCustomers(responseData);
      } else {
        setCustomers(FALLBACK_CUSTOMERS);
      }
    } catch (error) {
      console.error("Không tải được danh sách khách hàng:", error);

      setCustomers(FALLBACK_CUSTOMERS);
    }
  };

  const filteredContracts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return contracts.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.contract_code?.toLowerCase().includes(keyword) ||
        item.contract_name?.toLowerCase().includes(keyword) ||
        item.customer_name?.toLowerCase().includes(keyword);

      const matchesStatus = !status || item.status === status;

      const matchesType = !contractType || item.contract_type === contractType;

      const matchesCustomer =
        !customerId || String(item.customer_id) === String(customerId);

      const signedDate = item.signed_date ? new Date(item.signed_date) : null;

      const matchesFromDate =
        !fromDate || (signedDate && signedDate >= new Date(fromDate));

      const matchesToDate =
        !toDate || (signedDate && signedDate <= new Date(`${toDate}T23:59:59`));

      return (
        matchesKeyword &&
        matchesStatus &&
        matchesType &&
        matchesCustomer &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    contracts,
    searchTerm,
    status,
    contractType,
    customerId,
    fromDate,
    toDate,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredContracts.length / ITEMS_PER_PAGE),
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const endIndex = currentPage * ITEMS_PER_PAGE;

  const currentItems = filteredContracts.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    return {
      total: contracts.length,

      signed: contracts.filter((item) => item.status === "signed").length,

      processing: contracts.filter((item) => item.status === "processing")
        .length,

      liquidated: contracts.filter((item) => item.status === "liquidated")
        .length,
    };
  }, [contracts]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatus("");
    setContractType("");
    setCustomerId("");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const goTo = (path) => {
    window.location.href = path;
  };

  const handleExportExcel = () => {
    console.log("Xuất Excel");
  };

  const handleExportPDF = () => {
    console.log("Xuất PDF");
  };

  return (
    <div className="ct-container">
      <div className="ct-breadcrumb">
        <span>Hợp đồng</span>
        <span>/</span>
        <strong>Danh sách hợp đồng</strong>
      </div>

      <div className="ct-header">
        <div className="ct-header-info">
          <h2>Danh sách hợp đồng</h2>

          <p>Quản lý tất cả hợp đồng dịch vụ du lịch</p>
        </div>

        <div className="ct-header-actions">
          <Button
            variant="light"
            className="ct-outline-btn"
            onClick={handleExportExcel}
          >
            <BsDownload />

            <span>Xuất Excel</span>
          </Button>

          <Button
            variant="light"
            className="ct-outline-btn"
            onClick={handleExportPDF}
          >
            <BsFileEarmarkPdf />

            <span>Xuất PDF</span>
          </Button>

          <Button variant="light" className="ct-outline-btn">
            <BsFunnel />

            <span>Bộ lọc</span>
          </Button>

          <Button className="ct-add-btn" onClick={() => goTo("/contract-add")}>
            <BsPlusLg />

            <span>Thêm hợp đồng</span>
          </Button>
        </div>
      </div>

      <div className="ct-filter-card">
        <div className="ct-filter-grid">
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

          <Form.Select
            value={customerId}
            onChange={(event) => {
              setCustomerId(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Chọn khách hàng</option>

            {customers.map((item) => (
              <option key={item.customer_id} value={item.customer_id}>
                {item.customer_name}
              </option>
            ))}
          </Form.Select>

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

          <Button
            variant="light"
            className="ct-reset-btn"
            onClick={resetFilters}
          >
            Làm mới
          </Button>
        </div>
      </div>

      <div className="ct-stat-grid">
        <div className="ct-stat-card blue">
          <div className="ct-stat-icon">📄</div>

          <div>
            <span>Tổng số hợp đồng</span>

            <strong>{stats.total}</strong>

            <small>Quản lý toàn bộ hợp đồng</small>
          </div>
        </div>

        <div className="ct-stat-card green">
          <div className="ct-stat-icon">✓</div>

          <div>
            <span>Đã ký kết</span>

            <strong>{stats.signed}</strong>

            <small>Hợp đồng đã hoàn tất ký</small>
          </div>
        </div>

        <div className="ct-stat-card yellow">
          <div className="ct-stat-icon">◷</div>

          <div>
            <span>Đang thực hiện</span>

            <strong>{stats.processing}</strong>

            <small>Hợp đồng đang triển khai</small>
          </div>
        </div>

        <div className="ct-stat-card red">
          <div className="ct-stat-icon">×</div>

          <div>
            <span>Đã thanh lý</span>

            <strong>{stats.liquidated}</strong>

            <small>Hợp đồng đã kết thúc</small>
          </div>
        </div>
      </div>

      <div className="ct-content-card">
        <div className="ct-table-top">
          <span>
            Hiển thị <strong>{ITEMS_PER_PAGE}</strong> kết quả
          </span>

          <span>
            Tổng cộng <strong>{filteredContracts.length}</strong> hợp đồng
          </span>
        </div>

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
              {loading ? (
                <tr>
                  <td colSpan="10" className="ct-empty">
                    <Spinner animation="border" size="sm" />

                    <span className="ms-2">Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((item) => {
                  const statusMeta = getStatusMeta(item.status);

                  return (
                    <tr key={item.contract_id}>
                      <td>
                        <Form.Check />
                      </td>

                      <td>
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

                      <td className="ct-contract-name">{item.contract_name}</td>

                      <td>{item.customer_name || "---"}</td>

                      <td>
                        <span className={`ct-type-badge ${item.contract_type}`}>
                          {getTypeLabel(item.contract_type)}
                        </span>
                      </td>

                      <td className="text-end ct-money">
                        {formatMoney(item.total_amount)}
                      </td>

                      <td>{formatDate(item.signed_date)}</td>

                      <td>
                        <span className={`ct-status ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </td>

                      <td>
                        {item.created_by_name || item.created_by || "Admin"}
                      </td>

                      <td>
                        <div className="ct-actions">
                          <button
                            type="button"
                            title="Xem hợp đồng"
                            onClick={() =>
                              goTo(`/contracts/detail/${item.contract_id}`)
                            }
                          >
                            <BsEye />
                          </button>

                          <button
                            type="button"
                            title="Sửa hợp đồng"
                            onClick={() =>
                              goTo(`/contracts/edit/${item.contract_id}`)
                            }
                          >
                            <BsPencil />
                          </button>

                          <button type="button" title="Thao tác khác">
                            <BsThreeDotsVertical />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="ct-empty">
                    Không tìm thấy hợp đồng phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ct-pagination">
          <span>
            Hiển thị {filteredContracts.length ? startIndex + 1 : 0} đến{" "}
            {Math.min(endIndex, filteredContracts.length)} của{" "}
            {filteredContracts.length} kết quả
          </span>

          <div className="ct-page-btns">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((value) => value - 1)}
            >
              <BsCaretLeftFill />
            </button>

            {Array.from(
              {
                length: Math.min(totalPages, 5),
              },
              (_, index) => index + 1,
            ).map((page) => (
              <button
                type="button"
                key={page}
                className={currentPage === page ? "active" : ""}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((value) => value + 1)}
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
