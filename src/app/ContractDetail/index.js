import React, { useEffect, useMemo, useState } from "react";

import { Accordion, Button, Modal, Spinner } from "react-bootstrap";

import {
  BsArrowLeft,
  BsEye,
  BsFileEarmarkPdf,
  BsFileEarmarkWord,
  BsPencil,
  BsPrinter,
} from "react-icons/bs";

import { useNavigate, useParams } from "react-router-dom";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { numberToVietnamese } from "../../components/NumberToVietnamese";

import "../ContractAdd/index.css";

// ============================================================
// FORMAT MONEY
// ============================================================

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
};

// ============================================================
// FORMAT DATE
// ============================================================

const formatDate = (value) => {
  if (!value) {
    return "...../...../..........";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

// ============================================================
// STATUS META
// ============================================================

const getStatusMeta = (status) => {
  const map = {
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
    map[status] || {
      label: "Không xác định",
      className: "draft",
    }
  );
};

// ============================================================
// CLEAN REPRESENTATIVE NAME
// ============================================================

const cleanRepresentativeName = (value) => {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/^\((Ông|Bà)\)\s*/i, "")
    .replace(/^(Ông|Bà)[\s.:]*/i, "")
    .trim();
};

// ============================================================
// CONTRACT DETAIL
// ============================================================

const ContractDetail = () => {
  const navigate = useNavigate();

  const { contractId } = useParams();

  // ==========================================================
  // STATE
  // ==========================================================

  const [loading, setLoading] = useState(true);

  const [contract, setContract] = useState(null);

  const [showPreview, setShowPreview] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================================
  // DATA FORMAT GIỐNG CONTRACT ADD
  // ==========================================================

  const [formData, setFormData] = useState({
    contract_code: "",

    contract_name: "",

    contract_type: 1,

    template_id: "",

    signed_date: "",

    signed_place: "",

    customer_id: "",

    customer_name: "",

    customer_address: "",

    customer_phone: "",

    customer_tax_code: "",

    customer_budget_code: "",

    customer_bank_account: "",

    customer_rep_name: "",

    customer_rep_title: "",

    customer_rep_note: "",

    company_name: "",

    company_address: "",

    company_phone: "",

    company_tax_code: "",

    company_bank_account: "",

    company_rep_name: "",

    company_rep_title: "",

    company_rep_note: "",

    work_content: "",

    service_content: "",

    tour_program: "",

    priority_documents: "",

    extra_volume: "",

    vat_type: "INCLUDED",

    vat_rate: 0,

    vat_amount: 0,

    contract_value: 0,

    total_amount: 0,

    amount_in_words: "",

    is_advance: false,

    advance_calc_type: "PERCENT",

    advance_percent: 0,

    advance_amount: 0,

    advance_date: 15,

    advance_due_date: "",

    payment_content: "",

    payment_schedule_content: "",
    included_services: "",
    excluded_services: "",
    late_payment: "",

    article_4: "",

    article_5: "",

    article_6: "",

    article_7: "",

    article_8: "",

    article_9: "",

    article_10: "",

    article_11: "",

    legal_bases: [],

    status: "",
  });

  const [departures, setDepartures] = useState([]);

  const [priceItems, setPriceItems] = useState([]);

  // ==========================================================
  // LOAD
  // ==========================================================

  useEffect(() => {
    getContractDetail();
  }, [contractId]);

  // ==========================================================
  // GET DETAIL
  // ==========================================================

  const getContractDetail = async () => {
    try {
      setLoading(true);

      setErrorMessage("");

      const response = await API.get(`/contracts/get/${contractId}`);

      const data = response?.data?.data;

      if (!data) {
        throw new Error("Không tìm thấy hợp đồng");
      }

      setContract(data);

      // ====================================================
      // BÊN A / BÊN B
      // ====================================================

      const customer =
        data.customer_profile ||
        (data.parties || []).find((item) => Number(item.party_type) === 1);

      const company =
        data.company_profile ||
        (data.parties || []).find((item) => Number(item.party_type) === 2);

      // ====================================================
      // ĐẠI DIỆN
      // ====================================================

      const customerRep =
        data.customer_representative ||
        (data.representatives || []).find(
          (item) => Number(item.rep_type) === 1,
        );

      const companyRep =
        data.company_representative ||
        (data.representatives || []).find(
          (item) => Number(item.rep_type) === 2,
        );

      const content = data.contract_content || {};

      const advance = data.advance || {};

      // ====================================================
      // VAT TYPE
      // ====================================================

      let vatType = "INCLUDED";

      if (Number(data.vat_type) === 2) {
        vatType = "EXCLUDED";
      }

      if (Number(data.vat_type) === 3) {
        vatType = "NO_VAT";
      }

      // ====================================================
      // FORM DATA
      // ====================================================

      setFormData({
        contract_code: data.contract_code || "",

        contract_name: data.contract_name || "",

        contract_type: data.contract_type_id || data.contract_type || 1,

        template_id: data.template_id || "",

        signed_date: data.signed_date || "",

        signed_place: data.signed_place || "",

        // ================================================
        // BÊN A
        // ================================================

        customer_id: data.customer_id || "",

        customer_name: customer?.company_name || "",

        customer_address: customer?.address || "",

        customer_phone: customer?.phone || "",

        customer_tax_code: customer?.tax_code || "",

        customer_budget_code: customer?.budget_code || "",

        customer_bank_account: customer?.bank_account || "",

        customer_rep_name: customerRep?.rep_name || "",

        customer_rep_title: customerRep?.rep_title || "",

        customer_rep_note: customerRep?.note || "",

        // ================================================
        // BÊN B
        // ================================================

        company_name: company?.company_name || "",

        company_address: company?.address || "",

        company_phone: company?.phone || "",

        company_tax_code: company?.tax_code || "",

        company_bank_account: company?.bank_account || "",

        company_rep_name: companyRep?.rep_name || "",

        company_rep_title: companyRep?.rep_title || "",

        company_rep_note: companyRep?.note || "",

        // ================================================
        // ĐIỀU 1
        // ================================================

        work_content: content.work_content || "",

        service_content: content.service_content || "",

        tour_program: content.tour_program || "",

        priority_documents: content.priority_documents || "",

        extra_volume: content.extra_volume || "",

        // ================================================
        // VAT
        // ================================================

        vat_type: vatType,

        vat_rate: Number(data.vat_rate || 0),

        vat_amount: Number(data.vat_amount || 0),

        contract_value: Number(data.contract_value || 0),

        total_amount: Number(data.total_amount || 0),

        amount_in_words: data.amount_in_words || "",

        // ================================================
        // TẠM ỨNG
        // ================================================

        is_advance: Boolean(advance.is_advance),

        advance_calc_type:
          Number(advance.calc_type) === 2 ? "AMOUNT" : "PERCENT",

        advance_percent: Number(advance.advance_rate || 0),

        advance_amount: Number(advance.advance_amount || 0),

        advance_date: advance.due_date || 15,

        advance_due_date: advance.payment_date || "",

        included_services: content.included_services || "",

        excluded_services: content.excluded_services || "",

        late_payment: content.late_payment || "",

        // ================================================
        // ĐIỀU 3
        // ================================================

        payment_content: content.payment_content || "",

        payment_schedule_content: content.payment_schedule_content || "",

        // ================================================
        // ĐIỀU 4 - 11
        // ================================================

        article_4: content.article_4 || "",

        article_5: content.article_5 || "",

        article_6: content.article_6 || "",

        article_7: content.article_7 || "",

        article_8: content.article_8 || "",

        article_9: content.article_9 || "",

        article_10: content.article_10 || "",

        article_11: content.article_11 || "",

        // ================================================
        // LEGAL BASE
        // ================================================

        legal_bases: (data.legal_bases || []).map((item, index) => ({
          id: item.legal_basis_id || index + 1,

          content: item.content || "",
        })),

        status: data.status || "",
      });

      // ====================================================
      // DEPARTURES
      // ====================================================

      setDepartures(
        (data.departures || []).map((item, index) => ({
          departure_id: item.departure_id,

          departure_name:
            item.departure_name || `Đợt ${String(index + 1).padStart(2, "0")}`,

          start_date: item.start_date || "",

          end_date: item.end_date || "",
        })),
      );

      // ====================================================
      // PRICE ITEMS
      // ====================================================

      setPriceItems(
        (data.price_items || []).map((item) => ({
          price_id: item.price_id,

          item_name: item.item_name || "",

          quantity: Number(item.quantity || 0),

          unit: item.unit || "",

          unit_price: Number(item.unit_price || 0),

          amount: Number(item.amount || 0),
        })),
      );
    } catch (error) {
      console.error("getContractDetail error:", error);

      console.error("Backend:", error?.response?.data);

      setErrorMessage(
        error?.response?.data?.message ||
          error.message ||
          "Không thể tải hợp đồng",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CONTRACT AMOUNT
  // ==========================================================
  const formatContractDate = (value) => {
    if (!value) return "";

    const date = String(value).substring(0, 10);

    const [year, month, day] = date.split("-");

    if (!year || !month || !day) {
      return value;
    }

    return `${day}/${month}/${year}`;
  };
  const contractAmount = useMemo(() => {
    const lineTotal = priceItems.reduce((sum, item) => {
      return (
        sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
      );
    }, 0);

    const vatRate = Number(formData.vat_rate) || 0;

    let contractValue = lineTotal;

    let vatAmount = 0;

    let totalAmount = lineTotal;

    if (formData.vat_type === "EXCLUDED") {
      vatAmount = lineTotal * (vatRate / 100);

      totalAmount = lineTotal + vatAmount;
    }

    if (formData.vat_type === "INCLUDED" || formData.vat_type === "NO_VAT") {
      vatAmount = 0;

      totalAmount = lineTotal;
    }

    /*
     * Ưu tiên giá trị DB.
     * Nếu DB đã có total_amount thì
     * dùng đúng số đã lưu.
     */

    return {
      lineTotal: Math.round(lineTotal),

      contractValue: Number(formData.contract_value || contractValue),

      vatAmount: Number(formData.vat_amount || vatAmount),

      totalAmount: Number(formData.total_amount || totalAmount),
    };
  }, [
    priceItems,

    formData.vat_type,

    formData.vat_rate,

    formData.contract_value,

    formData.vat_amount,

    formData.total_amount,
  ]);

  // ==========================================================
  // ADVANCE
  // ==========================================================

  const calculatedAdvanceAmount = useMemo(() => {
    if (!formData.is_advance) {
      return 0;
    }

    if (formData.advance_calc_type === "AMOUNT") {
      return Number(formData.advance_amount || 0);
    }

    /*
     * Ưu tiên số tiền đã lưu trong DB.
     */

    if (Number(formData.advance_amount) > 0) {
      return Number(formData.advance_amount);
    }

    return Math.round(
      Number(contractAmount.totalAmount || 0) *
        (Number(formData.advance_percent || 0) / 100),
    );
  }, [
    formData.is_advance,

    formData.advance_calc_type,

    formData.advance_amount,

    formData.advance_percent,

    contractAmount.totalAmount,
  ]);

  // ==========================================================
  // REMAINING
  // ==========================================================

  const remainingPaymentAmount = Math.max(
    Number(contractAmount.totalAmount || 0) -
      Number(calculatedAdvanceAmount || 0),

    0,
  );

  // ==========================================================
  // STATUS
  // ==========================================================

  const statusMeta = getStatusMeta(contract?.status);

  // ==========================================================
  // ACTION
  // ==========================================================

  const handleBack = () => {
    navigate("/contract");
  };

  const handleEdit = () => {
    navigate(`/contracts/edit/${contractId}`);
  };

  const handleViewContract = () => {
    setShowPreview(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // ==========================================================
  // EXPORT PDF
  // ==========================================================

  // ==========================================================
  // EXPORT PDF
  // ==========================================================

  const handleExportPDF = async () => {
    try {
      const response = await APIToken.get(
        `/contracts/export-pdf/${contractId}`,
        {
          responseType: "blob",
        },
      );

      // ================================================
      // TẠO BLOB
      // ================================================

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      // ================================================
      // URL TẠM
      // ================================================

      const url = window.URL.createObjectURL(blob);

      // ================================================
      // FILE NAME
      // ================================================

      const fileName = `${String(formData.contract_code || "hop-dong")
        .replace(/[\/\\:*?"<>|]/g, "-")
        .replace(/\s+/g, "_")}.pdf`;

      // ================================================
      // DOWNLOAD
      // ================================================

      const link = document.createElement("a");

      link.href = url;

      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export PDF error:", error);

      alert("Không thể xuất PDF hợp đồng");
    }
  };

  // ==========================================================
  // EXPORT WORD
  // ==========================================================
  // ==========================================================
  // EXPORT WORD
  // ==========================================================

  const handleExportWord = async () => {
    try {
      const response = await APIToken.get(
        `/contracts/export-word/${contractId}`,
        {
          responseType: "blob",
        },
      );

      // ================================================
      // BLOB
      // ================================================

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // ================================================
      // URL
      // ================================================

      const url = window.URL.createObjectURL(blob);

      // ================================================
      // FILE NAME
      // ================================================

      const fileName = `${String(formData.contract_code || "hop-dong")
        .replace(/[\/\\:*?"<>|]/g, "-")
        .replace(/\s+/g, "_")}.docx`;

      // ================================================
      // DOWNLOAD
      // ================================================

      const link = document.createElement("a");

      link.href = url;

      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export Word error:", error);

      alert("Không thể xuất Word hợp đồng");
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div
        className="contract-create-container"
        style={{
          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          minHeight: "70vh",

          gap: 12,
        }}
      >
        <Spinner animation="border" />

        <span>Đang tải hợp đồng...</span>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (errorMessage || !contract) {
    return (
      <div className="contract-create-container">
        <div
          className="contract-document"
          style={{
            textAlign: "center",

            padding: 50,
          }}
        >
          <h3>Không thể tải hợp đồng</h3>

          <p>{errorMessage}</p>

          <Button onClick={handleBack}>
            <BsArrowLeft />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER DETAIL
  // ==========================================================

  return (
    <div className="contract-create-container">
      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="contract-breadcrumb">
        <span>Hợp đồng</span>

        <span>/</span>

        <span>Danh sách hợp đồng</span>

        <span>/</span>

        <strong>Chi tiết hợp đồng</strong>
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="contract-page-header">
        <div>
          <h2>Chi tiết Hợp đồng</h2>

          <p>{formData.contract_code}</p>

          <span className={`ct-status ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
        </div>

        <div className="contract-header-actions">
          {/* =================================================
              BACK
          ================================================= */}

          <Button
            variant="light"
            className="contract-btn-outline"
            onClick={handleBack}
          >
            <BsArrowLeft />
            Quay lại
          </Button>

          {/* =================================================
              EDIT
          ================================================= */}

          <Button
            variant="light"
            className="contract-btn-outline"
            onClick={handleEdit}
          >
            <BsPencil />
            Sửa hợp đồng
          </Button>

          {/* =================================================
              VIEW
          ================================================= */}

          <Button
            variant="light"
            className="contract-btn-outline"
            onClick={handleViewContract}
          >
            <BsEye />
            Xem hợp đồng
          </Button>

          {/* =================================================
              PDF
          ================================================= */}

          <Button
            variant="light"
            className="contract-btn-outline"
            onClick={handleExportPDF}
          >
            <BsFileEarmarkPdf />
            Xuất PDF
          </Button>

          {/* =================================================
              WORD
          ================================================= */}

          <Button className="contract-btn-primary" onClick={handleExportWord}>
            <BsFileEarmarkWord />
            Xuất Word
          </Button>
        </div>
      </div>

      {/* =====================================================
          MAIN DOCUMENT
      ===================================================== */}

      <div className="contract-document">
        {/* ===================================================
            HEADER
        =================================================== */}

        <section className="contract-national-header">
          <h5>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h5>

          <p>Độc lập – Tự do – Hạnh phúc</p>

          <h1>HỢP ĐỒNG DỊCH VỤ</h1>

          <div className="contract-package-row">
            <textarea
              rows={2}
              value={formData.contract_name}
              readOnly
              className="form-control contract-package-input"
            />
          </div>

          <div className="contract-basic-info">
            <div className="contract-basic-item">
              <label>Số:</label>

              <input
                type="text"
                value={contract?.contract_code || ""}
                readOnly
                className="contract-basic-input contract-code-input"
              />
            </div>

            <div className="contract-basic-item">
              <label>Ngày ký:</label>

              <input
                type="text"
                value={formatContractDate(contract?.signed_date)}
                readOnly
                className="contract-basic-input contract-date-input"
              />
            </div>
          </div>

          {/* =================================================
              LEGAL BASE
          ================================================= */}

          <div className="contract-section legal-bases-section">
            <div className="contract-section-header">
              <span>Căn cứ ký kết hợp đồng</span>
            </div>

            <div className="contract-section-body">
              {formData.legal_bases.length > 0 ? (
                formData.legal_bases.map((item, index) => (
                  <div className="legal-basis-row" key={item.id || index}>
                    <div className="legal-basis-index">{index + 1}.</div>

                    <textarea
                      className="legal-basis-input"
                      value={item.content}
                      readOnly
                      rows={2}
                    />
                  </div>
                ))
              ) : (
                <div>Chưa có căn cứ pháp lý</div>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================
            PARTIES
        =================================================== */}

        <section className="contract-party-grid">
          {/* =================================================
              BÊN A
          ================================================= */}

          <div className="contract-party-card">
            <h3>BÊN A – CHỦ ĐẦU TƯ</h3>

            <ReadOnlyInput label="Tên đơn vị" value={formData.customer_name} />

            <ReadOnlyInput label="Địa chỉ" value={formData.customer_address} />

            <ReadOnlyInput label="Điện thoại" value={formData.customer_phone} />

            <ReadOnlyInput
              label="Mã số thuế"
              value={formData.customer_tax_code}
            />

            <ReadOnlyInput
              label="Mã QHNS"
              value={formData.customer_budget_code}
            />

            <ReadOnlyInput
              label="Tài khoản"
              value={formData.customer_bank_account}
            />

            <ReadOnlyInput
              label="Đại diện"
              value={formData.customer_rep_name}
            />

            <ReadOnlyInput
              label="Chức vụ"
              value={formData.customer_rep_title}
            />

            <ReadOnlyInput label="Ghi chú" value={formData.customer_rep_note} />
          </div>

          {/* =================================================
              BÊN B
          ================================================= */}

          <div className="contract-party-card">
            <h3>BÊN B – NHÀ THẦU</h3>

            <ReadOnlyInput label="Tên đơn vị" value={formData.company_name} />

            <ReadOnlyInput label="Địa chỉ" value={formData.company_address} />

            <ReadOnlyInput label="Điện thoại" value={formData.company_phone} />

            <ReadOnlyInput
              label="Mã số thuế"
              value={formData.company_tax_code}
            />

            <ReadOnlyInput
              label="Tài khoản NH"
              value={formData.company_bank_account}
            />

            <ReadOnlyInput label="Đại diện" value={formData.company_rep_name} />

            <ReadOnlyInput label="Chức vụ" value={formData.company_rep_title} />

            <ReadOnlyInput label="Ghi chú" value={formData.company_rep_note} />
          </div>
        </section>

        {/* ===================================================
            ACCORDION
        =================================================== */}

        <Accordion
          defaultActiveKey={["0", "1", "2"]}
          alwaysOpen
          className="contract-accordion"
        >
          {/* =================================================
              ARTICLE 1
          ================================================= */}

          <Accordion.Item eventKey="0">
            <Accordion.Header>Điều 1. Nội dung hợp đồng</Accordion.Header>

            <Accordion.Body>
              <ReadOnlyClause
                title="1.1. Nội dung công việc"
                content={formData.work_content}
              />

              <ReadOnlyClause
                title="1.1. Nội dung dịch vụ"
                content={formData.service_content}
              />

              <ReadOnlyClause
                title="1.2. Chương trình tham quan"
                content={formData.tour_program}
              />

              <div className="contract-clause">
                <h4>1.3. Thời gian thực hiện</h4>

                <div className="contract-departure-list">
                  {departures.map((item, index) => (
                    <div
                      className="contract-departure-row"
                      key={item.departure_id || index}
                    >
                      {departures.length > 1 && (
                        <span className="contract-departure-label">
                          {item.departure_name}
                        </span>
                      )}

                      <span>Từ ngày</span>

                      <input
                        type="date"
                        className="form-control contract-departure-date"
                        value={item.start_date}
                        readOnly
                      />

                      <span>đến ngày</span>

                      <input
                        type="date"
                        className="form-control contract-departure-date"
                        value={item.end_date}
                        readOnly
                      />
                    </div>
                  ))}
                </div>
              </div>

              <ReadOnlyClause
                title="1.4. Thứ tự ưu tiên áp dụng hồ sơ hợp đồng"
                content={formData.priority_documents}
              />

              <ReadOnlyClause
                title="1.5. Khối lượng phát sinh ngoài hợp đồng"
                content={formData.extra_volume}
              />
            </Accordion.Body>
          </Accordion.Item>

          {/* =================================================
              ARTICLE 2
          ================================================= */}

          <Accordion.Item eventKey="1">
            <Accordion.Header>
              Điều 2. Giá hợp đồng, giá dịch vụ và giá trị thanh toán
            </Accordion.Header>

            <Accordion.Body>
              <h4 className="contract-subsection-title">
                2.1. Giá trị hợp đồng
              </h4>

              <div className="table-responsive">
                <table className="contract-price-table">
                  <thead>
                    <tr>
                      <th>STT</th>

                      <th>Hạng mục</th>

                      <th>Số lượng</th>

                      <th>ĐVT</th>

                      <th>Đơn giá</th>

                      <th>Thành tiền</th>
                    </tr>
                  </thead>

                  <tbody>
                    {priceItems.map((item, index) => (
                      <tr key={item.price_id || index}>
                        <td>{index + 1}</td>

                        <td>{item.item_name}</td>

                        <td>{formatCurrency(item.quantity)}</td>

                        <td>{item.unit}</td>

                        <td>{formatCurrency(item.unit_price)}</td>

                        <td className="contract-money-cell">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}

                    <tr className="contract-total-row">
                      <td colSpan={5}>
                        {formData.vat_type === "INCLUDED" &&
                          "Tổng cộng (Đã bao gồm VAT)"}

                        {formData.vat_type === "EXCLUDED" &&
                          "Tổng cộng sau VAT"}

                        {formData.vat_type === "NO_VAT" &&
                          "Tổng giá trị hợp đồng"}
                      </td>

                      <td>{formatCurrency(contractAmount.totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ReadOnlyInput
                label="Bằng chữ"
                value={
                  formData.amount_in_words ||
                  numberToVietnamese(contractAmount.totalAmount)
                }
              />
              <ReadOnlyClause
                title="2.3. Dịch vụ bao gồm"
                content={formData.included_services}
              />

              <ReadOnlyClause
                title="2.4. Dịch vụ không bao gồm"
                content={formData.excluded_services}
              />
            </Accordion.Body>
          </Accordion.Item>

          {/* =================================================
              ARTICLE 3
          ================================================= */}

          <Accordion.Item eventKey="2">
            <Accordion.Header>
              Điều 3. Phương thức và tiến độ thanh toán
            </Accordion.Header>

            <Accordion.Body>
              <ReadOnlyClause
                title="3.1. Phương thức thanh toán"
                content={formData.payment_content}
              />

              <div className="contract-clause">
                <h4>3.2. Tạm ứng</h4>

                {formData.is_advance ? (
                  <>
                    <ReadOnlyInput
                      label="Cách tính"
                      value={
                        formData.advance_calc_type === "PERCENT"
                          ? "Theo tỷ lệ (%)"
                          : "Theo số tiền"
                      }
                    />

                    {formData.advance_calc_type === "PERCENT" && (
                      <ReadOnlyInput
                        label="Tỷ lệ tạm ứng"
                        value={`${formData.advance_percent}%`}
                      />
                    )}

                    <ReadOnlyInput
                      label="Số tiền tạm ứng"
                      value={`${formatCurrency(calculatedAdvanceAmount)} đồng`}
                    />

                    <ReadOnlyInput
                      label="Số ngày thanh toán phần còn lại"
                      value={`${formData.advance_date} ngày`}
                    />
                  </>
                ) : (
                  <p>Hợp đồng không có tạm ứng.</p>
                )}
              </div>

              <ReadOnlyClause
                title="3.3. Tiến độ thanh toán"
                content={formData.payment_schedule_content}
              />
              <ReadOnlyClause
                title="3.4. Chậm thanh toán"
                content={formData.late_payment}
              />
            </Accordion.Body>
          </Accordion.Item>

          {/* =================================================
              ARTICLE 4
          ================================================= */}

          <ReadOnlyArticle
            eventKey="3"
            title="Điều 4. Quyền và trách nhiệm của Bên A"
            content={formData.article_4}
          />

          {/* =================================================
              ARTICLE 5
          ================================================= */}

          <ReadOnlyArticle
            eventKey="4"
            title="Điều 5. Quyền và trách nhiệm của Bên B"
            content={formData.article_5}
          />

          {/* =================================================
              ARTICLE 6
          ================================================= */}

          <ReadOnlyArticle
            eventKey="5"
            title="Điều 6. Quản lý, xác nhận và thanh toán chi phí phát sinh"
            content={formData.article_6}
          />

          {/* =================================================
              ARTICLE 7
          ================================================= */}

          <ReadOnlyArticle
            eventKey="6"
            title="Điều 7. Sự kiện bất khả kháng"
            content={formData.article_7}
          />

          {/* =================================================
              ARTICLE 8
          ================================================= */}

          <ReadOnlyArticle
            eventKey="7"
            title="Điều 8. Phạt vi phạm hợp đồng và bồi thường thiệt hại"
            content={formData.article_8}
          />

          {/* =================================================
              ARTICLE 9
          ================================================= */}

          <ReadOnlyArticle
            eventKey="8"
            title="Điều 9. Luật áp dụng và giải quyết tranh chấp"
            content={formData.article_9}
          />

          {/* =================================================
              ARTICLE 10
          ================================================= */}

          <ReadOnlyArticle
            eventKey="9"
            title="Điều 10. Bảo mật thông tin và dữ liệu cá nhân"
            content={formData.article_10}
          />

          {/* =================================================
              ARTICLE 11
          ================================================= */}

          <ReadOnlyArticle
            eventKey="10"
            title="Điều 11. Điều khoản chung"
            content={formData.article_11}
          />
        </Accordion>
      </div>

      {/* =====================================================
          PREVIEW HỢP ĐỒNG
          GIỐNG CONTRACT ADD
      ===================================================== */}

      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        dialogClassName="contract-preview-modal"
        contentClassName="contract-preview-modal-content"
        centered
      >
        <Modal.Header closeButton className="contract-preview-modal-header">
          <Modal.Title>Xem hợp đồng</Modal.Title>
        </Modal.Header>

        <Modal.Body className="contract-preview-modal-body">
          <ContractPreview
            formData={formData}
            departures={departures}
            priceItems={priceItems}
            contractAmount={contractAmount}
            calculatedAdvanceAmount={calculatedAdvanceAmount}
            remainingPaymentAmount={remainingPaymentAmount}
          />
        </Modal.Body>

        <Modal.Footer className="contract-preview-modal-footer">
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Đóng
          </Button>

          <Button variant="primary" onClick={handlePrint}>
            <BsPrinter />
            In hợp đồng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// ============================================================
// READ ONLY INPUT
// ============================================================

const ReadOnlyInput = ({ label, value }) => {
  return (
    <div className="contract-input-row">
      <label>{label}</label>

      <div>
        <input className="form-control" value={value || ""} readOnly />
      </div>
    </div>
  );
};

// ============================================================
// READ ONLY CLAUSE
// ============================================================

const ReadOnlyClause = ({ title, content }) => {
  return (
    <div className="contract-clause">
      <h4>{title}</h4>

      <textarea
        className="form-control"
        rows={5}
        value={content || ""}
        readOnly
      />
    </div>
  );
};

// ============================================================
// READ ONLY ARTICLE
// ============================================================

const ReadOnlyArticle = ({ eventKey, title, content }) => {
  return (
    <Accordion.Item eventKey={eventKey}>
      <Accordion.Header>{title}</Accordion.Header>

      <Accordion.Body>
        <textarea
          className="form-control"
          rows={16}
          value={content || ""}
          readOnly
        />
      </Accordion.Body>
    </Accordion.Item>
  );
};

// ============================================================
// CONTRACT PREVIEW
// ============================================================

const ContractPreview = ({
  formData,

  departures,

  priceItems,

  contractAmount,

  calculatedAdvanceAmount,

  remainingPaymentAmount,
}) => {
  // ==========================================================
  // AMOUNT WORD
  // ==========================================================

  const totalAmountInWords = numberToVietnamese(
    contractAmount.totalAmount || 0,
  );

  const advanceAmountInWords = numberToVietnamese(calculatedAdvanceAmount || 0);

  // ==========================================================
  // RENDER TEXT
  // ==========================================================

  const renderTextLines = (content) => {
    if (!content) {
      return null;
    }

    return String(content)
      .split("\n")
      .map((line, index) => (
        <p key={`${index}-${line}`} className="preview-paragraph">
          {line || "\u00A0"}
        </p>
      ));
  };

  // ==========================================================
  // RENDER ARTICLE
  // ==========================================================

  const renderArticleContent = (content) => {
    if (!content || !String(content).trim()) {
      return (
        <p className="preview-empty-content">Chưa có nội dung điều khoản.</p>
      );
    }

    return String(content)
      .split("\n")
      .map((line, index) => {
        const value = line.trim();

        if (!value) {
          return <div key={`empty-${index}`} className="preview-empty-line" />;
        }

        // ================================================
        // 4.1.
        // ================================================

        const clauseMatch = value.match(/^(\d+\.\d+\.)\s*(.*)$/);

        if (clauseMatch) {
          return (
            <h3 key={`clause-${index}`} className="preview-clause-title">
              {clauseMatch[1]} {clauseMatch[2]}
            </h3>
          );
        }

        // ================================================
        // a)
        // ================================================

        const letterMatch = value.match(/^([a-zA-ZđĐ]\))\s*(.*)$/);

        if (letterMatch) {
          return (
            <p key={`letter-${index}`} className="preview-letter-paragraph">
              {letterMatch[1]} {letterMatch[2]}
            </p>
          );
        }

        // ================================================
        // BULLET
        // ================================================

        const bulletMatch = value.match(/^([-–•])\s*(.*)$/);

        if (bulletMatch) {
          return (
            <p key={`bullet-${index}`} className="preview-bullet-paragraph">
              {bulletMatch[1]} {bulletMatch[2]}
            </p>
          );
        }

        // ================================================
        // NUMBER
        // ================================================

        const numberMatch = value.match(/^(\d+\.)\s+(.*)$/);

        if (numberMatch) {
          return (
            <p key={`number-${index}`} className="preview-number-paragraph">
              {numberMatch[1]} {numberMatch[2]}
            </p>
          );
        }

        return (
          <p key={`paragraph-${index}`} className="preview-contract-paragraph">
            {value}
          </p>
        );
      });
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="contract-preview-wrapper">
      <div className="contract-preview-paper">
        {/* ===================================================
            HEADER
        =================================================== */}

        <section className="preview-heading">
          <div className="preview-heading-grid">
            <div className="preview-heading-right">
              <p className="preview-national-title">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </p>

              <p className="preview-national-subtitle">
                Độc lập – Tự do – Hạnh phúc
              </p>

              <div className="preview-national-line" />
            </div>
          </div>

          <h1 className="preview-contract-title">HỢP ĐỒNG DỊCH VỤ</h1>

          <p className="preview-contract-code">
            Số: {formData.contract_code || "...../....."}
          </p>
        </section>

        {/* ===================================================
            LEGAL BASE
        =================================================== */}

        <section className="preview-legal-basis">
          <div className="preview-legal-bases">
            {formData.legal_bases.map((item, index) => (
              <p key={item.id || index} className="preview-paragraph">
                {item.content}
              </p>
            ))}
          </div>
        </section>

        {/* ===================================================
            BÊN A
        =================================================== */}

        <section className="preview-party-section">
          <h2 className="preview-party-title">
            BÊN A: {formData.customer_name || "CHƯA NHẬP TÊN BÊN A"}
          </h2>

          <PreviewInfoRow label="Địa chỉ" value={formData.customer_address} />

          <PreviewInfoRow label="Điện thoại" value={formData.customer_phone} />

          <PreviewInfoRow
            label="Mã số thuế"
            value={formData.customer_tax_code}
          />

          {formData.customer_budget_code && (
            <PreviewInfoRow
              label="Mã QHNS"
              value={formData.customer_budget_code}
            />
          )}

          <PreviewInfoRow
            label="Tài khoản"
            value={formData.customer_bank_account}
          />

          <div className="preview-info-row">
            <span className="preview-info-label">Đại diện</span>

            <span>:</span>

            <span>
              {formData.customer_rep_name || "................................"}
            </span>

            <span className="preview-inline-title">Chức vụ:</span>

            <span>
              {formData.customer_rep_title ||
                "................................"}
            </span>
          </div>

          {formData.customer_rep_note && (
            <p className="preview-note">{formData.customer_rep_note}</p>
          )}

          <p className="preview-party-closing">
            Sau đây gọi tắt là <strong>Bên A</strong>.
          </p>
        </section>

        {/* ===================================================
            BÊN B
        =================================================== */}

        <section className="preview-party-section">
          <h2 className="preview-party-title">
            BÊN B: {formData.company_name || "CHƯA NHẬP TÊN BÊN B"}
          </h2>

          <PreviewInfoRow label="Địa chỉ" value={formData.company_address} />

          <PreviewInfoRow label="Điện thoại" value={formData.company_phone} />

          <PreviewInfoRow
            label="Mã số thuế"
            value={formData.company_tax_code}
          />

          <PreviewInfoRow
            label="Tài khoản"
            value={formData.company_bank_account}
          />

          <div className="preview-info-row">
            <span className="preview-info-label">Đại diện</span>

            <span>:</span>

            <span>{formData.company_rep_name}</span>

            <span className="preview-inline-title">Chức vụ:</span>

            <span>{formData.company_rep_title}</span>
          </div>

          {formData.company_rep_note && (
            <p className="preview-note">{formData.company_rep_note}</p>
          )}

          <p className="preview-party-closing">
            Sau đây gọi tắt là <strong>Bên B</strong>.
          </p>
        </section>

        {/* ===================================================
            INTRO
        =================================================== */}

        <p className="preview-introduction">
          Các bên cùng nhau thỏa thuận ký kết Hợp đồng dịch vụ du lịch lữ hành
          (“Hợp đồng”) với các điều khoản và điều kiện sau:
        </p>

        {/* ===================================================
            ARTICLE 1
        =================================================== */}

        <section className="preview-article">
          <h2>ĐIỀU 1. NỘI DUNG HỢP ĐỒNG</h2>

          <h3>1.1. Nội dung công việc</h3>

          {renderTextLines(formData.work_content)}

          {renderTextLines(formData.service_content)}

          <h3>1.2. Chương trình tham quan</h3>

          {renderTextLines(formData.tour_program)}

          <h3>1.3. Thời gian thực hiện</h3>

          {departures.map((item, index) => (
            <div key={item.departure_id || index} className="preview-departure">
              {departures.length > 1 && (
                <>
                  <strong>
                    {item.departure_name ||
                      `Đợt ${String(index + 1).padStart(2, "0")}`}
                    :
                  </strong>{" "}
                </>
              )}
              Từ ngày <strong>{formatDate(item.start_date)}</strong> đến ngày{" "}
              <strong>{formatDate(item.end_date)}</strong>
            </div>
          ))}

          <h3>1.4. Thứ tự ưu tiên áp dụng hồ sơ hợp đồng</h3>

          {renderTextLines(formData.priority_documents)}

          <h3>1.5. Khối lượng phát sinh ngoài hợp đồng</h3>

          {renderTextLines(formData.extra_volume)}
        </section>

        {/* ===================================================
            ARTICLE 2
        =================================================== */}

        <section className="preview-article">
          <h2>ĐIỀU 2. GIÁ HỢP ĐỒNG, GIÁ DỊCH VỤ VÀ GIÁ TRỊ THANH TOÁN</h2>

          <h3>2.1. Giá trị hợp đồng</h3>

          <table className="preview-price-table">
            <thead>
              <tr>
                <th>STT</th>

                <th>Hạng mục/Tuyến tour</th>

                <th>Số lượng</th>

                <th>ĐVT</th>

                <th>Đơn giá</th>

                <th>Thành tiền</th>
              </tr>
            </thead>

            <tbody>
              {priceItems.map((item, index) => {
                const amount =
                  Number(item.quantity || 0) * Number(item.unit_price || 0);

                return (
                  <tr key={item.price_id || index}>
                    <td>{index + 1}</td>

                    <td className="preview-table-text">
                      {item.item_name || "Chưa nhập hạng mục"}
                    </td>

                    <td>{formatCurrency(item.quantity)}</td>

                    <td>{item.unit || ""}</td>

                    <td className="preview-money">
                      {formatCurrency(item.unit_price)}
                    </td>

                    <td className="preview-money">{formatCurrency(amount)}</td>
                  </tr>
                );
              })}

              {formData.vat_type === "EXCLUDED" && (
                <>
                  <tr>
                    <td colSpan={5} className="preview-total-label">
                      Cộng tiền dịch vụ chưa VAT
                    </td>

                    <td className="preview-money">
                      {formatCurrency(contractAmount.contractValue)}
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={5} className="preview-total-label">
                      Thuế giá trị gia tăng ({Number(formData.vat_rate || 0)}
                      %)
                    </td>

                    <td className="preview-money">
                      {formatCurrency(contractAmount.vatAmount)}
                    </td>
                  </tr>
                </>
              )}

              <tr className="preview-total-row">
                <td colSpan={5} className="preview-total-label">
                  {formData.vat_type === "INCLUDED"
                    ? "Tổng cộng (Đã bao gồm VAT)"
                    : formData.vat_type === "EXCLUDED"
                      ? "Tổng giá trị sau VAT"
                      : "Tổng giá trị hợp đồng"}
                </td>

                <td className="preview-money">
                  {formatCurrency(contractAmount.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>

          <p className="preview-amount-words">
            <strong>Bằng chữ:</strong>{" "}
            {formData.amount_in_words || totalAmountInWords || "Không đồng"}.
          </p>

          <h3>2.2. Giá trị thanh toán</h3>

          <p className="preview-paragraph">
            Giá trị thanh toán thực tế được xác định trên cơ sở khối lượng dịch
            vụ thực tế đã thực hiện, số lượng người tham gia thực tế, các khối
            lượng phát sinh được chấp thuận và các khoản giảm trừ theo thỏa
            thuận của các bên.
          </p>
          <h3>2.3. Dịch vụ bao gồm</h3>

          {renderArticleContent(formData.included_services)}

          <h3>2.4. Dịch vụ không bao gồm</h3>

          {renderArticleContent(formData.excluded_services)}
        </section>

        {/* ===================================================
            ARTICLE 3
        =================================================== */}

        <section className="preview-article">
          <h2>ĐIỀU 3. PHƯƠNG THỨC VÀ TIẾN ĐỘ THANH TOÁN</h2>

          <h3>3.1. Đồng tiền thanh toán</h3>

          <p className="preview-paragraph">
            Đồng tiền sử dụng trong thanh toán là Việt Nam đồng (VNĐ).
          </p>

          <h3>3.2. Phương thức thanh toán</h3>

          {renderTextLines(formData.payment_content)}

          <p className="preview-paragraph preview-indent">
            – Tên tài khoản:{" "}
            {formData.vat_type === "NO_VAT"
              ? cleanRepresentativeName(formData.company_rep_name)
              : "CTY TNHH TM DL VA SU KIEN VIET NAM"}
            ;
          </p>

          <p className="preview-paragraph preview-indent">
            – Tài khoản ngân hàng: {formData.company_bank_account}.
          </p>

          <h3>3.3. Tiến độ thanh toán</h3>

          {formData.is_advance ? (
            <>
              <p className="preview-paragraph">
                <strong>a) Tạm ứng hợp đồng:</strong> Bên A tạm ứng cho Bên B{" "}
                {formData.advance_calc_type === "PERCENT"
                  ? `${Number(
                      formData.advance_percent || 0,
                    )}% giá trị hợp đồng, `
                  : ""}
                tương đương số tiền{" "}
                <strong>{formatCurrency(calculatedAdvanceAmount)} đồng</strong>{" "}
                (Bằng chữ: {advanceAmountInWords} đồng).
              </p>

              <p className="preview-paragraph">
                <strong>b) Thanh toán giá trị còn lại:</strong> Bên A thanh toán
                cho Bên B số tiền còn lại sau khi trừ giá trị đã tạm ứng, dự
                kiến là{" "}
                <strong>{formatCurrency(remainingPaymentAmount)} đồng</strong>{" "}
                và các khoản chi phí phát sinh (nếu có), trong vòng{" "}
                <strong>{formData.advance_date || 15} ngày</strong> sau khi Bên
                B hoàn thành dịch vụ và cung cấp đầy đủ hồ sơ thanh toán hợp lệ.
              </p>
            </>
          ) : (
            <p className="preview-paragraph">
              Bên A thanh toán cho Bên B 100% giá trị thanh toán sau khi Bên B
              hoàn thành dịch vụ, hai bên nghiệm thu và Bên B cung cấp đầy đủ hồ
              sơ thanh toán hợp lệ.
            </p>
          )}

          {renderTextLines(formData.payment_schedule_content)}
          <h3>3.4. Chậm thanh toán</h3>

          {renderArticleContent(formData.late_payment)}
        </section>

        {/* ===================================================
            ARTICLE 4
        =================================================== */}

        <PreviewArticle
          title="ĐIỀU 4. QUYỀN VÀ TRÁCH NHIỆM CỦA BÊN A"
          content={formData.article_4}
          renderArticleContent={renderArticleContent}
        />

        {/* ===================================================
            ARTICLE 5
        =================================================== */}

        <PreviewArticle
          title="ĐIỀU 5. QUYỀN VÀ TRÁCH NHIỆM CỦA BÊN B"
          content={formData.article_5}
          renderArticleContent={renderArticleContent}
        />

        {/* ===================================================
            ARTICLE 6
        =================================================== */}

        <PreviewArticle
          title="ĐIỀU 6. QUẢN LÝ, XÁC NHẬN VÀ THANH TOÁN CHI PHÍ PHÁT SINH"
          content={formData.article_6}
          renderArticleContent={renderArticleContent}
        />

        {/* ===================================================
            ARTICLE 7
        =================================================== */}

        <PreviewArticle
          title="ĐIỀU 7. SỰ KIỆN BẤT KHẢ KHÁNG"
          content={formData.article_7}
          renderArticleContent={renderArticleContent}
        />

        {/* ===================================================
            ARTICLE 8
        =================================================== */}

        <PreviewArticle
          title="ĐIỀU 8. PHẠT VI PHẠM HỢP ĐỒNG VÀ BỒI THƯỜNG THIỆT HẠI"
          content={formData.article_8}
          renderArticleContent={renderArticleContent}
        />

        {/* ===================================================
            ARTICLE 9
        =================================================== */}

        <PreviewArticle
          title="ĐIỀU 9. LUẬT ÁP DỤNG VÀ GIẢI QUYẾT TRANH CHẤP"
          content={formData.article_9}
          renderArticleContent={renderArticleContent}
        />

        {/* ===================================================
            ARTICLE 10
        =================================================== */}

        <PreviewArticle
          title="ĐIỀU 10. BẢO MẬT THÔNG TIN VÀ DỮ LIỆU CÁ NHÂN"
          content={formData.article_10}
          renderArticleContent={renderArticleContent}
        />

        {/* ===================================================
            ARTICLE 11
        =================================================== */}

        <PreviewArticle
          title="ĐIỀU 11. ĐIỀU KHOẢN CHUNG"
          content={formData.article_11}
          renderArticleContent={renderArticleContent}
        />

        {/* ===================================================
            SIGNATURE
        =================================================== */}

        <section className="preview-signature-section">
          <div className="preview-signature-box">
            <p className="preview-signature-title">ĐẠI DIỆN BÊN A</p>

            <p className="preview-signature-position">
              {formData.customer_rep_title || "CHỨC VỤ"}
            </p>

            <div className="preview-signature-space" />

            <p className="preview-signature-name">
              {cleanRepresentativeName(formData.customer_rep_name)}
            </p>
          </div>

          <div className="preview-signature-box">
            <p className="preview-signature-title">ĐẠI DIỆN BÊN B</p>

            <p className="preview-signature-position">
              {formData.company_rep_title || "GIÁM ĐỐC"}
            </p>

            <div className="preview-signature-space" />

            <p className="preview-signature-name">
              {cleanRepresentativeName(formData.company_rep_name)}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

// ============================================================
// PREVIEW INFO ROW
// ============================================================

const PreviewInfoRow = ({ label, value }) => {
  return (
    <div className="preview-info-row">
      <span className="preview-info-label">{label}</span>

      <span>:</span>

      <span>{value || "................................"}</span>
    </div>
  );
};

// ============================================================
// PREVIEW ARTICLE
// ============================================================

const PreviewArticle = ({
  title,

  content,

  renderArticleContent,
}) => {
  return (
    <section className="preview-article">
      <h2>{title}</h2>

      {renderArticleContent(content)}
    </section>
  );
};

export default ContractDetail;
