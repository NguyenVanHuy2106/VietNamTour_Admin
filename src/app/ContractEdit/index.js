import React, { useEffect, useMemo, useState } from "react";

import {
  Accordion,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";

import { BsArrowLeft, BsEye, BsPlus, BsSave, BsTrash } from "react-icons/bs";

import { useNavigate, useParams } from "react-router-dom";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { numberToVietnamese } from "../../components/NumberToVietnamese";

import "./index.css";

// ============================================================
// CONTRACT EDIT
// ============================================================

const ContractEdit = () => {
  const navigate = useNavigate();

  const { contractId } = useParams();

  // ==========================================================
  // USER
  // ==========================================================

  const userId = localStorage.getItem("userId");

  // ==========================================================
  // STATE
  // ==========================================================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState([]);

  const [showPreview, setShowPreview] = useState(false);

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);

  const [alertMessage, setAlertMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================================
  // FORM DATA
  //
  // GIỐNG CONTRACT ADD + CONTRACT DETAIL
  // ==========================================================

  const [formData, setFormData] = useState({
    contract_code: "",

    contract_name: "",

    contract_type: 1,

    template_id: "",

    signed_date: "",

    signed_place: "",

    // ========================================================
    // BÊN A
    // ========================================================

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

    // ========================================================
    // BÊN B
    // ========================================================

    company_name: "",

    company_address: "",

    company_phone: "",

    company_tax_code: "",

    company_bank_account: "",

    company_rep_name: "",

    company_rep_title: "",

    company_rep_note: "",

    // ========================================================
    // ĐIỀU 1
    // ========================================================

    work_content: "",

    service_content: "",

    tour_program: "",

    priority_documents: "",

    extra_volume: "",

    // ========================================================
    // VAT
    // ========================================================

    vat_type: "INCLUDED",

    vat_rate: 8,

    vat_amount: 0,

    contract_value: 0,

    total_amount: 0,

    amount_in_words: "",

    // ========================================================
    // TẠM ỨNG
    // ========================================================

    is_advance: false,

    advance_calc_type: "PERCENT",

    advance_percent: 0,

    advance_amount: 0,

    advance_date: 15,

    advance_due_date: "",

    included_services: "",
    excluded_services: "",
    late_payment: "",

    // ========================================================
    // ĐIỀU 3
    // ========================================================

    payment_content: "",

    payment_schedule_content: "",

    // ========================================================
    // ĐIỀU 4 - 11
    // ========================================================

    article_4: "",

    article_5: "",

    article_6: "",

    article_7: "",

    article_8: "",

    article_9: "",

    article_10: "",

    article_11: "",

    // ========================================================
    // LEGAL
    // ========================================================

    legal_bases: [],

    // ========================================================
    // OTHER
    // ========================================================

    status: "",

    note: "",
  });

  // ==========================================================
  // DEPARTURES
  // ==========================================================

  const [departures, setDepartures] = useState([]);

  // ==========================================================
  // PRICE ITEMS
  // ==========================================================

  const [priceItems, setPriceItems] = useState([]);

  // ==========================================================
  // LOAD
  // ==========================================================

  useEffect(() => {
    getCustomers();

    getContractDetail();
  }, [contractId]);

  // ==========================================================
  // GET CUSTOMERS
  // ==========================================================

  const getCustomers = async () => {
    try {
      const response = await API.get("/customers/get");

      setCustomers(response?.data?.data || []);
    } catch (error) {
      console.error("Không tải được khách hàng:", error);

      setCustomers([]);
    }
  };

  // ==========================================================
  // GET CONTRACT DETAIL
  // ==========================================================

  const getContractDetail = async () => {
    try {
      setLoading(true);

      setErrorMessage("");

      // ====================================================
      // API ĐÚNG THEO CONTRACT DETAIL CỦA BẠN
      // ====================================================

      const response = await API.get(`/contracts/get/${contractId}`);

      const data = response?.data?.data;

      console.log("CONTRACT DETAIL:", data);

      if (!data) {
        throw new Error("Không tìm thấy hợp đồng");
      }

      // ====================================================
      // BÊN A
      // ====================================================

      const customer =
        data.customer_profile ||
        (data.parties || []).find((item) => Number(item.party_type) === 1) ||
        {};

      // ====================================================
      // BÊN B
      // ====================================================

      const company =
        data.company_profile ||
        (data.parties || []).find((item) => Number(item.party_type) === 2) ||
        {};

      // ====================================================
      // REPRESENTATIVE A
      // ====================================================

      const customerRep =
        data.customer_representative ||
        (data.representatives || []).find(
          (item) => Number(item.rep_type) === 1,
        ) ||
        {};

      // ====================================================
      // REPRESENTATIVE B
      // ====================================================

      const companyRep =
        data.company_representative ||
        (data.representatives || []).find(
          (item) => Number(item.rep_type) === 2,
        ) ||
        {};

      // ====================================================
      // CONTENT
      // ====================================================

      const content = data.contract_content || {};

      // ====================================================
      // ADVANCE
      // ====================================================

      const advance = data.advance || {};

      // ====================================================
      // VAT TYPE
      // ====================================================

      let vatType = "INCLUDED";

      if (data.vat_type === "EXCLUDED") {
        vatType = "EXCLUDED";
      } else if (data.vat_type === "NO_VAT") {
        vatType = "NO_VAT";
      } else if (Number(data.vat_type) === 2) {
        vatType = "EXCLUDED";
      } else if (Number(data.vat_type) === 3) {
        vatType = "NO_VAT";
      }

      // ====================================================
      // ADVANCE CALC TYPE
      // ====================================================

      let advanceCalcType = "PERCENT";

      if (advance.calc_type === "AMOUNT" || Number(advance.calc_type) === 2) {
        advanceCalcType = "AMOUNT";
      }

      // ====================================================
      // SET FORM
      // ====================================================

      setFormData({
        contract_code: data.contract_code || "",

        contract_name: data.contract_name || "",

        contract_type: data.contract_type_id || data.contract_type || 1,

        template_id: data.template_id || "",

        signed_date: data.signed_date
          ? String(data.signed_date).substring(0, 10)
          : "",

        signed_place: data.signed_place || "",

        // ==================================================
        // BÊN A
        // ==================================================

        customer_id: data.customer_id || "",

        customer_name: customer?.company_name || data.customer_name || "",

        customer_address: customer?.address || "",

        customer_phone: customer?.phone || "",

        customer_tax_code: customer?.tax_code || "",

        customer_budget_code: customer?.budget_code || "",

        customer_bank_account: customer?.bank_account || "",

        customer_rep_name: customerRep?.rep_name || "",

        customer_rep_title: customerRep?.rep_title || "",

        customer_rep_note: customerRep?.note || "",

        // ==================================================
        // BÊN B
        // ==================================================

        company_name: company?.company_name || "",

        company_address: company?.address || "",

        company_phone: company?.phone || "",

        company_tax_code: company?.tax_code || "",

        company_bank_account: company?.bank_account || "",

        company_rep_name: companyRep?.rep_name || "",

        company_rep_title: companyRep?.rep_title || "",

        company_rep_note: companyRep?.note || "",

        // ==================================================
        // ARTICLE 1
        // ==================================================

        work_content: content.work_content || "",

        service_content: content.service_content || "",

        tour_program: content.tour_program || "",

        priority_documents: content.priority_documents || "",

        extra_volume: content.extra_volume || "",

        // ==================================================
        // VAT
        // ==================================================

        vat_type: vatType,

        vat_rate: Number(data.vat_rate || 0),

        vat_amount: Number(data.vat_amount || 0),

        contract_value: Number(data.contract_value || 0),

        total_amount: Number(data.total_amount || 0),

        amount_in_words: data.amount_in_words || "",

        // ==================================================
        // ADVANCE
        // ==================================================

        is_advance: Boolean(advance.is_advance),

        advance_calc_type: advanceCalcType,

        advance_percent: Number(
          advance.advance_rate ?? advance.advance_percent ?? 0,
        ),

        advance_amount: Number(advance.advance_amount || 0),

        advance_date: advance.due_date || 15,

        advance_due_date: advance.payment_date || "",

        included_services: content.included_services || "",

        excluded_services: content.excluded_services || "",

        late_payment: content.late_payment || "",

        // ==================================================
        // ARTICLE 3
        // ==================================================

        payment_content: content.payment_content || "",

        payment_schedule_content: content.payment_schedule_content || "",

        // ==================================================
        // ARTICLE 4 - 11
        // ==================================================

        article_4: content.article_4 || "",

        article_5: content.article_5 || "",

        article_6: content.article_6 || "",

        article_7: content.article_7 || "",

        article_8: content.article_8 || "",

        article_9: content.article_9 || "",

        article_10: content.article_10 || "",

        article_11: content.article_11 || "",

        // ==================================================
        // LEGAL
        // ==================================================

        legal_bases: (data.legal_bases || []).map((item, index) => ({
          id: item.legal_basis_id || item.id || index + 1,

          legal_basis_id: item.legal_basis_id,

          content: item.content || "",
        })),

        status: data.status || "",

        note: data.note || "",
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
          price_id: item.price_id || item.price_item_id,

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

      console.error("Status:", error?.response?.status);

      console.error("URL:", error?.config?.url);

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

  const contractAmount = useMemo(() => {
    const lineTotal = priceItems.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);

      const unitPrice = Number(item.unit_price || 0);

      return sum + quantity * unitPrice;
    }, 0);

    const vatRate = Number(formData.vat_rate || 0);

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

    return {
      lineTotal: Math.round(lineTotal),

      contractValue: Math.round(contractValue),

      vatAmount: Math.round(vatAmount),

      totalAmount: Math.round(totalAmount),
    };
  }, [priceItems, formData.vat_type, formData.vat_rate]);

  // ==========================================================
  // CALCULATED ADVANCE
  // ==========================================================

  const calculatedAdvanceAmount = useMemo(() => {
    if (!formData.is_advance) {
      return 0;
    }

    if (formData.advance_calc_type === "AMOUNT") {
      return Number(formData.advance_amount || 0);
    }

    return Math.round(
      Number(contractAmount.totalAmount || 0) *
        (Number(formData.advance_percent || 0) / 100),
    );
  }, [
    formData.is_advance,

    formData.advance_calc_type,

    formData.advance_percent,

    formData.advance_amount,

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
  // FORM CHANGE
  // ==========================================================

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,

      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ==========================================================
  // VAT TYPE
  // ==========================================================

  const handleVatTypeChange = (event) => {
    setFormData((previous) => ({
      ...previous,

      vat_type: event.target.value,
    }));
  };

  // ==========================================================
  // CUSTOMER
  // ==========================================================

  const handleCustomerInput = (event) => {
    const value = event.target.value;

    const customer = customers.find((item) => item.customer_name === value);

    if (customer) {
      setFormData((prev) => ({
        ...prev,

        customer_id: customer.customer_id,

        customer_name: customer.customer_name,

        customer_address: customer.address || "",

        customer_phone: customer.phone || "",

        customer_tax_code: customer.tax_code || "",

        customer_budget_code: customer.budget_code || "",

        customer_bank_account: customer.bank_account || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,

        customer_id: "",

        customer_name: value,
      }));
    }
  };

  // ==========================================================
  // LEGAL BASIS
  // ==========================================================

  const handleLegalBasisChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,

      legal_bases: prev.legal_bases.map((item, i) =>
        i === index
          ? {
              ...item,

              content: value,
            }
          : item,
      ),
    }));
  };

  const handleAddLegalBasis = () => {
    setFormData((prev) => ({
      ...prev,

      legal_bases: [
        ...prev.legal_bases,

        {
          id: Date.now(),

          content: "Căn cứ ",
        },
      ],
    }));
  };

  const handleRemoveLegalBasis = (index) => {
    setFormData((prev) => ({
      ...prev,

      legal_bases: prev.legal_bases.filter((_, i) => i !== index),
    }));
  };

  // ==========================================================
  // DEPARTURES
  // ==========================================================

  const handleDepartureChange = (index, field, value) => {
    setDepartures((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,

              [field]: value,
            }
          : item,
      ),
    );
  };

  const addDeparture = () => {
    setDepartures((previous) => [
      ...previous,

      {
        departure_name: `Đợt ${String(previous.length + 1).padStart(2, "0")}`,

        start_date: "",

        end_date: "",
      },
    ]);
  };

  const removeDeparture = (index) => {
    if (departures.length <= 1) {
      return;
    }

    setDepartures((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  // ==========================================================
  // PRICE ITEM
  // ==========================================================

  const handlePriceItemChange = (index, field, value) => {
    setPriceItems((previous) =>
      previous.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const updatedItem = {
          ...item,

          [field]: value,
        };

        updatedItem.amount =
          (Number(updatedItem.quantity || 0) || 0) *
          (Number(updatedItem.unit_price || 0) || 0);

        return updatedItem;
      }),
    );
  };

  const addPriceItem = () => {
    setPriceItems((previous) => [
      ...previous,

      {
        item_name: "",

        quantity: 1,

        unit: "Người",

        unit_price: 0,

        amount: 0,
      },
    ]);
  };

  const removePriceItem = (index) => {
    if (priceItems.length <= 1) {
      return;
    }

    setPriceItems((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  // ==========================================================
  // FORMAT
  // ==========================================================

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "...../...../..........";
    }

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",

      month: "2-digit",

      year: "numeric",
    }).format(date);
  };

  // ==========================================================
  // VALIDATE
  // ==========================================================

  const validateForm = () => {
    if (!formData.contract_code.trim()) {
      alert("Không có số hợp đồng");

      return false;
    }

    if (!formData.contract_name.trim()) {
      alert("Vui lòng nhập tên hợp đồng");

      return false;
    }

    if (!formData.customer_name.trim()) {
      alert("Vui lòng nhập Bên A");

      return false;
    }

    if (priceItems.length === 0) {
      alert("Hợp đồng phải có ít nhất một dòng bảng giá");

      return false;
    }

    return true;
  };

  // ==========================================================
  // BUILD PAYLOAD
  //
  // GIỐNG CONTRACT ADD
  // ==========================================================

  const buildPayload = () => {
    return {
      // ====================================================
      // CONTRACT
      // ====================================================

      contract_code: formData.contract_code,

      contract_name: formData.contract_name,

      contract_type: Number(formData.contract_type || 1),

      template_id: formData.template_id || null,

      customer_id: formData.customer_id || null,

      signed_date: formData.signed_date || null,

      signed_place: formData.signed_place,

      // ====================================================
      // MONEY
      // ====================================================

      vat_type: formData.vat_type,

      vat_rate: Number(formData.vat_rate || 0),

      contract_value: Number(contractAmount.contractValue || 0),

      vat_amount: Number(contractAmount.vatAmount || 0),

      total_amount: Number(contractAmount.totalAmount || 0),

      amount_in_words: numberToVietnamese(contractAmount.totalAmount || 0),

      // ====================================================
      // STATUS
      // ====================================================

      status: formData.status,

      updated_by: Number(userId) || null,

      note: formData.note,

      // ====================================================
      // CUSTOMER PROFILE
      // ====================================================

      customer_profile: {
        company_name: formData.customer_name,

        tax_code: formData.customer_tax_code,

        budget_code: formData.customer_budget_code,

        address: formData.customer_address,

        phone: formData.customer_phone,

        bank_account: formData.customer_bank_account,
      },

      // ====================================================
      // COMPANY PROFILE
      // ====================================================

      company_profile: {
        company_name: formData.company_name,

        tax_code: formData.company_tax_code,

        budget_code: "",

        address: formData.company_address,

        phone: formData.company_phone,

        bank_account: formData.company_bank_account,
      },

      // ====================================================
      // REPRESENTATIVES
      // ====================================================

      representatives: [
        {
          rep_type: "CUSTOMER",

          rep_name: formData.customer_rep_name,

          rep_title: formData.customer_rep_title,

          note: formData.customer_rep_note,
        },

        {
          rep_type: "COMPANY",

          rep_name: formData.company_rep_name,

          rep_title: formData.company_rep_title,

          note: formData.company_rep_note,
        },
      ],

      // ====================================================
      // LEGAL BASES
      // ====================================================

      legal_bases: formData.legal_bases
        .filter((item) => item.content?.trim())
        .map((item) => ({
          content: item.content.trim(),
        })),

      // ====================================================
      // CONTENT
      // ====================================================

      contract_content: {
        work_content: formData.work_content,

        service_content: formData.service_content,

        tour_program: formData.tour_program,

        priority_documents: formData.priority_documents,

        extra_volume: formData.extra_volume,

        payment_content: formData.payment_content,

        payment_schedule_content: formData.payment_schedule_content,
        included_services: formData.included_services,

        excluded_services: formData.excluded_services,
        late_payment: formData.late_payment,

        article_4: formData.article_4,

        article_5: formData.article_5,

        article_6: formData.article_6,

        article_7: formData.article_7,

        article_8: formData.article_8,

        article_9: formData.article_9,

        article_10: formData.article_10,

        article_11: formData.article_11,
      },

      // ====================================================
      // DEPARTURES
      // ====================================================

      departures: departures.map((item, index) => ({
        departure_id: item.departure_id,

        departure_name:
          item.departure_name || `Đợt ${String(index + 1).padStart(2, "0")}`,

        start_date: item.start_date,

        end_date: item.end_date,
      })),

      // ====================================================
      // PRICE ITEMS
      // ====================================================

      price_items: priceItems.map((item) => {
        const quantity = Number(item.quantity || 0);

        const unitPrice = Number(item.unit_price || 0);

        return {
          price_id: item.price_id,

          item_name: item.item_name,

          quantity,

          unit: item.unit || "",

          unit_price: unitPrice,

          amount: quantity * unitPrice,
        };
      }),

      // ====================================================
      // ADVANCE
      // ====================================================

      advance: {
        is_advance: Boolean(formData.is_advance),

        calc_type: formData.advance_calc_type,

        advance_percent:
          formData.advance_calc_type === "PERCENT"
            ? Number(formData.advance_percent || 0)
            : 0,

        advance_rate:
          formData.advance_calc_type === "PERCENT"
            ? Number(formData.advance_percent || 0)
            : 0,

        advance_amount: formData.is_advance
          ? Number(calculatedAdvanceAmount || 0)
          : 0,

        due_date: formData.advance_date ? Number(formData.advance_date) : null,

        payment_date: formData.advance_due_date || null,

        note: "",
      },
    };
  };

  // ==========================================================
  // UPDATE
  // ==========================================================

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const payload = buildPayload();

      console.log("UPDATE CONTRACT PAYLOAD:", payload);

      // ====================================================
      // API UPDATE
      //
      // Nếu route BE của bạn là:
      // PUT /api/contracts/update/:id
      // thì dòng này là đúng.
      // ====================================================

      const response = await APIToken.put(
        `/contracts/update/${contractId}`,

        payload,
      );

      if (response.status === 200 || response.status === 201) {
        setAlertMessage("Cập nhật hợp đồng thành công");

        setSuccessAlertOpen(true);

        setTimeout(() => {
          navigate(`/contracts/detail/${contractId}`);
        }, 800);
      }
    } catch (error) {
      console.error("UPDATE CONTRACT ERROR:", error);

      console.error("Backend:", error?.response?.data);

      alert(error?.response?.data?.message || "Không thể cập nhật hợp đồng");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // BACK
  // ==========================================================

  const handleBack = () => {
    navigate(`/contracts/detail/${contractId}`);
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

  if (errorMessage) {
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

          <Button onClick={() => navigate("/contracts")}>
            <BsArrowLeft />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER
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

        <strong>Chỉnh sửa hợp đồng</strong>
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="contract-page-header">
        <div>
          <h2>Chỉnh sửa Hợp đồng</h2>

          <p>{formData.contract_code}</p>
        </div>

        <div className="contract-header-actions">
          <Button
            variant="light"
            className="contract-btn-outline"
            onClick={handleBack}
          >
            <BsArrowLeft />
            Quay lại
          </Button>

          <Button
            variant="light"
            className="contract-btn-outline"
            onClick={() => setShowPreview(true)}
          >
            <BsEye />
            Xem trước
          </Button>

          <Button
            className="contract-btn-primary"
            onClick={handleUpdate}
            disabled={saving}
          >
            {saving ? <Spinner size="sm" /> : <BsSave />}

            {saving ? "Đang lưu..." : "Cập nhật hợp đồng"}
          </Button>
        </div>
      </div>

      {/* =====================================================
          DOCUMENT
      ===================================================== */}

      <div className="contract-document">
        {/* ===================================================
            HEADER CONTRACT
        =================================================== */}

        <section className="contract-national-header">
          <h5>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h5>

          <p>Độc lập – Tự do – Hạnh phúc</p>

          <h1>HỢP ĐỒNG DỊCH VỤ</h1>

          {/* =================================================
              CONTRACT NAME
          ================================================= */}

          <div className="contract-package-row">
            <Form.Control
              as="textarea"
              rows={2}
              name="contract_name"
              value={formData.contract_name}
              onChange={handleChange}
              placeholder="Nhập tên gói thầu"
              className="contract-package-input"
            />
          </div>

          {/* =================================================
              CONTRACT CODE
          ================================================= */}

          <div className="contract-basic-info">
            <div className="contract-basic-item">
              <label>Số:</label>

              <input
                type="text"
                name="contract_code"
                value={formData.contract_code || ""}
                readOnly
                className="contract-basic-input contract-code-input"
              />
            </div>

            <div className="contract-basic-item">
              <label>Ngày ký:</label>

              <input
                type="date"
                name="signed_date"
                value={formData.signed_date || ""}
                onChange={handleChange}
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
              {formData.legal_bases.map((item, index) => (
                <div className="legal-basis-row" key={item.id || index}>
                  <div className="legal-basis-index">{index + 1}.</div>

                  <textarea
                    className="legal-basis-input"
                    value={item.content}
                    onChange={(e) =>
                      handleLegalBasisChange(
                        index,

                        e.target.value,
                      )
                    }
                    rows={2}
                    placeholder="Nhập nội dung căn cứ..."
                  />

                  <button
                    type="button"
                    className="legal-basis-delete"
                    onClick={() => handleRemoveLegalBasis(index)}
                    title="Xóa căn cứ"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="legal-basis-add-btn"
                onClick={handleAddLegalBasis}
              >
                + Thêm căn cứ
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================
            PARTY
        =================================================== */}

        <section className="contract-party-grid">
          {/* =================================================
              PARTY A
          ================================================= */}

          <div className="contract-party-card">
            <h3>BÊN A – CHỦ ĐẦU TƯ</h3>

            <ContractInput label="Tên đơn vị" required>
              <Form.Control
                list="customerList"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleCustomerInput}
                placeholder="Nhập tên khách hàng..."
              />

              <datalist id="customerList">
                {customers.map((customer) => (
                  <option
                    key={customer.customer_id}
                    value={customer.customer_name}
                  />
                ))}
              </datalist>
            </ContractInput>

            <ContractInput label="Địa chỉ" required>
              <Form.Control
                name="customer_address"
                value={formData.customer_address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ..."
              />
            </ContractInput>

            <ContractInput label="Điện thoại">
              <Form.Control
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleChange}
              />
            </ContractInput>

            <ContractInput label="Mã số thuế">
              <Form.Control
                name="customer_tax_code"
                value={formData.customer_tax_code}
                onChange={handleChange}
              />
            </ContractInput>

            <ContractInput label="Mã QHNS">
              <Form.Control
                name="customer_budget_code"
                value={formData.customer_budget_code}
                onChange={handleChange}
              />
            </ContractInput>

            <ContractInput label="Tài khoản">
              <Form.Control
                name="customer_bank_account"
                value={formData.customer_bank_account}
                onChange={handleChange}
              />
            </ContractInput>

            <Row className="g-2">
              <Col md={7}>
                <ContractInput label="Đại diện" required>
                  <Form.Control
                    name="customer_rep_name"
                    value={formData.customer_rep_name}
                    onChange={handleChange}
                  />
                </ContractInput>
              </Col>

              <Col md={5}>
                <ContractInput label="Chức vụ" required>
                  <Form.Control
                    name="customer_rep_title"
                    value={formData.customer_rep_title}
                    onChange={handleChange}
                  />
                </ContractInput>
              </Col>
            </Row>

            <ContractInput label="Ghi chú">
              <Form.Control
                name="customer_rep_note"
                value={formData.customer_rep_note}
                onChange={handleChange}
              />
            </ContractInput>
          </div>

          {/* =================================================
              PARTY B
          ================================================= */}

          <div className="contract-party-card">
            <h3>BÊN B – NHÀ THẦU</h3>

            <ContractInput label="Tên đơn vị" required>
              <Form.Control
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
              />
            </ContractInput>

            <ContractInput label="Địa chỉ" required>
              <Form.Control
                name="company_address"
                value={formData.company_address}
                onChange={handleChange}
              />
            </ContractInput>

            <ContractInput label="Điện thoại">
              <Form.Control
                name="company_phone"
                value={formData.company_phone}
                onChange={handleChange}
              />
            </ContractInput>

            <ContractInput label="Mã số thuế">
              <Form.Control
                name="company_tax_code"
                value={formData.company_tax_code}
                onChange={handleChange}
              />
            </ContractInput>

            <ContractInput label="Tài khoản NH">
              <Form.Control
                name="company_bank_account"
                value={formData.company_bank_account}
                onChange={handleChange}
              />
            </ContractInput>

            <ContractInput label="Đại diện" required>
              <Form.Control
                name="company_rep_name"
                value={formData.company_rep_name}
                onChange={handleChange}
              />
            </ContractInput>

            <ContractInput label="Chức vụ" required>
              <Form.Control
                name="company_rep_title"
                value={formData.company_rep_title}
                onChange={handleChange}
              />
            </ContractInput>

            <ContractInput label="Ghi chú">
              <Form.Control
                name="company_rep_note"
                value={formData.company_rep_note}
                onChange={handleChange}
              />
            </ContractInput>
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
              <ContractClause title="1.1. Nội dung công việc">
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="work_content"
                  value={formData.work_content}
                  onChange={handleChange}
                />

                <Form.Control
                  as="textarea"
                  rows={3}
                  className="mt-2"
                  name="service_content"
                  value={formData.service_content}
                  onChange={handleChange}
                />
              </ContractClause>

              <ContractClause title="1.2. Chương trình tham quan">
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="tour_program"
                  value={formData.tour_program}
                  onChange={handleChange}
                />
              </ContractClause>

              <ContractClause title="1.3. Thời gian thực hiện">
                <div className="contract-departure-list">
                  {departures.map((item, index) => (
                    <div
                      className="contract-departure-row"
                      key={item.departure_id || index}
                    >
                      {departures.length > 1 && (
                        <span className="contract-departure-label">
                          {item.departure_name ||
                            `Đợt ${String(index + 1).padStart(2, "0")}`}
                        </span>
                      )}

                      <span>Từ ngày</span>

                      <Form.Control
                        type="date"
                        className="contract-departure-date"
                        value={item.start_date}
                        onChange={(event) =>
                          handleDepartureChange(
                            index,

                            "start_date",

                            event.target.value,
                          )
                        }
                      />

                      <span>đến ngày</span>

                      <Form.Control
                        type="date"
                        className="contract-departure-date"
                        value={item.end_date}
                        onChange={(event) =>
                          handleDepartureChange(
                            index,

                            "end_date",

                            event.target.value,
                          )
                        }
                      />

                      {departures.length > 1 && (
                        <button
                          type="button"
                          className="contract-remove-btn"
                          onClick={() => removeDeparture(index)}
                        >
                          <BsTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="light"
                  className="contract-small-add"
                  onClick={addDeparture}
                >
                  <BsPlus />
                  Thêm đợt
                </Button>
              </ContractClause>

              <ContractClause title="1.4. Thứ tự ưu tiên áp dụng hồ sơ hợp đồng">
                <Form.Control
                  as="textarea"
                  rows={6}
                  name="priority_documents"
                  value={formData.priority_documents}
                  onChange={handleChange}
                />
              </ContractClause>

              <ContractClause title="1.5. Khối lượng phát sinh ngoài hợp đồng">
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="extra_volume"
                  value={formData.extra_volume}
                  onChange={handleChange}
                />
              </ContractClause>
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

              {/* ===============================================
                  VAT TYPE
              =============================================== */}

              <div className="contract-vat-setting">
                <span className="contract-vat-setting-label">
                  Cách tính VAT:
                </span>

                <Form.Check
                  type="radio"
                  id="vat-type-included-edit"
                  name="vat_type"
                  value="INCLUDED"
                  label="Đơn giá đã bao gồm VAT"
                  checked={formData.vat_type === "INCLUDED"}
                  onChange={handleVatTypeChange}
                />

                <Form.Check
                  type="radio"
                  id="vat-type-excluded-edit"
                  name="vat_type"
                  value="EXCLUDED"
                  label="Đơn giá chưa VAT, cộng VAT thêm"
                  checked={formData.vat_type === "EXCLUDED"}
                  onChange={handleVatTypeChange}
                />

                <Form.Check
                  type="radio"
                  id="vat-type-no-vat-edit"
                  name="vat_type"
                  value="NO_VAT"
                  label="Hợp đồng không tính VAT"
                  checked={formData.vat_type === "NO_VAT"}
                  onChange={handleVatTypeChange}
                />
              </div>

              {/* ===============================================
                  PRICE TABLE
              =============================================== */}

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

                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {priceItems.map((item, index) => (
                      <tr key={item.price_id || index}>
                        <td>{index + 1}</td>

                        <td>
                          <Form.Control
                            value={item.item_name}
                            onChange={(event) =>
                              handlePriceItemChange(
                                index,

                                "item_name",

                                event.target.value,
                              )
                            }
                          />
                        </td>

                        <td>
                          <Form.Control
                            type="number"
                            value={item.quantity}
                            onChange={(event) =>
                              handlePriceItemChange(
                                index,

                                "quantity",

                                event.target.value,
                              )
                            }
                          />
                        </td>

                        <td>
                          <Form.Control
                            value={item.unit}
                            onChange={(event) =>
                              handlePriceItemChange(
                                index,

                                "unit",

                                event.target.value,
                              )
                            }
                          />
                        </td>

                        <td>
                          <Form.Control
                            type="number"
                            value={item.unit_price}
                            onChange={(event) =>
                              handlePriceItemChange(
                                index,

                                "unit_price",

                                event.target.value,
                              )
                            }
                          />
                        </td>

                        <td className="contract-money-cell">
                          {formatCurrency(
                            Number(item.quantity || 0) *
                              Number(item.unit_price || 0),
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="contract-remove-btn"
                            onClick={() => removePriceItem(index)}
                          >
                            <BsTrash />
                          </button>
                        </td>
                      </tr>
                    ))}

                    <tr className="contract-total-row">
                      <td colSpan={5}>
                        {formData.vat_type === "INCLUDED" &&
                          "Tổng cộng (Đã bao gồm VAT)"}

                        {formData.vat_type === "EXCLUDED" &&
                          "Tổng cộng (Chưa bao gồm VAT)"}

                        {formData.vat_type === "NO_VAT" &&
                          "Tổng giá trị hợp đồng"}
                      </td>

                      <td>{formatCurrency(contractAmount.lineTotal)}</td>

                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Button
                variant="light"
                className="contract-small-add"
                onClick={addPriceItem}
              >
                <BsPlus />
                Thêm dòng
              </Button>

              {/* ===============================================
                  FINANCE
              =============================================== */}

              <div className="contract-finance-grid">
                {formData.vat_type === "INCLUDED" && (
                  <ContractInput label="Tổng giá trị đã bao gồm VAT">
                    <Form.Control
                      readOnly
                      value={formatCurrency(contractAmount.totalAmount)}
                    />
                  </ContractInput>
                )}

                {formData.vat_type === "EXCLUDED" && (
                  <>
                    <ContractInput label="Giá trị chưa VAT">
                      <Form.Control
                        readOnly
                        value={formatCurrency(contractAmount.contractValue)}
                      />
                    </ContractInput>

                    <ContractInput label="VAT (%)">
                      <Form.Control
                        type="number"
                        min="0"
                        name="vat_rate"
                        value={formData.vat_rate}
                        onChange={handleChange}
                      />
                    </ContractInput>

                    <ContractInput label="Tiền VAT">
                      <Form.Control
                        readOnly
                        value={formatCurrency(contractAmount.vatAmount)}
                      />
                    </ContractInput>

                    <ContractInput label="Tổng giá trị">
                      <Form.Control
                        readOnly
                        value={formatCurrency(contractAmount.totalAmount)}
                      />
                    </ContractInput>
                  </>
                )}

                {formData.vat_type === "NO_VAT" && (
                  <ContractInput label="Tổng giá trị hợp đồng">
                    <Form.Control
                      readOnly
                      value={formatCurrency(contractAmount.totalAmount)}
                    />
                  </ContractInput>
                )}
              </div>

              <ContractInput label="Bằng chữ">
                <Form.Control
                  readOnly
                  value={numberToVietnamese(contractAmount.totalAmount)}
                />
              </ContractInput>
              <ContractClause title="2.3. Dịch vụ bao gồm">
                <Form.Control
                  as="textarea"
                  rows={6}
                  name="included_services"
                  value={formData.included_services || ""}
                  onChange={handleChange}
                  placeholder="Nhập nội dung dịch vụ bao gồm..."
                />
              </ContractClause>

              <ContractClause title="2.4. Dịch vụ không bao gồm">
                <Form.Control
                  as="textarea"
                  rows={6}
                  name="excluded_services"
                  value={formData.excluded_services || ""}
                  onChange={handleChange}
                  placeholder="Nhập nội dung dịch vụ không bao gồm..."
                />
              </ContractClause>
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
              {/* ===============================================
                  PAYMENT CONTENT
              =============================================== */}

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  3.1. Phương thức thanh toán
                </Form.Label>

                <Form.Control
                  as="textarea"
                  rows={3}
                  name="payment_content"
                  value={formData.payment_content}
                  onChange={handleChange}
                />
              </Form.Group>

              {/* ===============================================
                  ADVANCE
              =============================================== */}

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">3.2. Tạm ứng</Form.Label>

                <Form.Check
                  type="switch"
                  label="Hợp đồng có tạm ứng"
                  name="is_advance"
                  checked={formData.is_advance}
                  onChange={handleChange}
                  className="mb-3"
                />

                {formData.is_advance && (
                  <Row>
                    <Col md={3}>
                      <ContractInput label="Cách tính">
                        <Form.Select
                          name="advance_calc_type"
                          value={formData.advance_calc_type}
                          onChange={handleChange}
                        >
                          <option value="PERCENT">Theo tỷ lệ (%)</option>

                          <option value="AMOUNT">Theo số tiền</option>
                        </Form.Select>
                      </ContractInput>
                    </Col>

                    {formData.advance_calc_type === "PERCENT" && (
                      <Col md={3}>
                        <ContractInput label="Tỷ lệ tạm ứng (%)">
                          <Form.Control
                            type="number"
                            name="advance_percent"
                            value={formData.advance_percent}
                            onChange={handleChange}
                            min={0}
                            max={100}
                          />
                        </ContractInput>
                      </Col>
                    )}

                    <Col md={3}>
                      <ContractInput label="Số tiền tạm ứng">
                        <Form.Control
                          type="text"
                          name="advance_amount"
                          value={formatCurrency(calculatedAdvanceAmount)}
                          onChange={(event) => {
                            if (formData.advance_calc_type === "PERCENT") {
                              return;
                            }

                            const rawValue = event.target.value.replace(
                              /\D/g,
                              "",
                            );

                            setFormData((prev) => ({
                              ...prev,

                              advance_amount: rawValue,
                            }));
                          }}
                          readOnly={formData.advance_calc_type === "PERCENT"}
                        />
                      </ContractInput>
                    </Col>

                    <Col md={3}>
                      <ContractInput label="Số ngày thanh toán">
                        <Form.Control
                          type="number"
                          name="advance_date"
                          value={formData.advance_date}
                          onChange={handleChange}
                          min={0}
                        />
                      </ContractInput>
                    </Col>

                    <Col md={3}>
                      <ContractInput label="Ngày tạm ứng">
                        <Form.Control
                          type="date"
                          name="advance_due_date"
                          value={formData.advance_due_date}
                          onChange={handleChange}
                        />
                      </ContractInput>
                    </Col>
                  </Row>
                )}
              </Form.Group>

              {/* ===============================================
                  PAYMENT SCHEDULE
              =============================================== */}

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  3.3. Tiến độ thanh toán
                </Form.Label>

                <Form.Control
                  as="textarea"
                  rows={4}
                  name="payment_schedule_content"
                  value={formData.payment_schedule_content}
                  onChange={handleChange}
                />
              </Form.Group>

              {/* ===============================================
                  PAYMENT PREVIEW
              =============================================== */}

              <div className="payment-preview-box">
                {formData.is_advance && (
                  <p className="payment-preview-text">
                    <strong>a) Tạm ứng hợp đồng:</strong> Bên A tạm ứng cho Bên
                    B{" "}
                    {formData.advance_calc_type === "PERCENT"
                      ? `${formData.advance_percent || 0}% giá trị hợp đồng`
                      : `số tiền ${formatCurrency(
                          formData.advance_amount,
                        )} đồng`}
                    , tương đương số tiền{" "}
                    <strong>
                      {formatCurrency(calculatedAdvanceAmount)} đồng
                    </strong>
                    .
                  </p>
                )}

                <p className="payment-preview-text">
                  <strong>
                    {formData.is_advance ? "b)" : "a)"} Thanh toán giá trị còn
                    lại:
                  </strong>{" "}
                  Bên A thanh toán cho Bên B số tiền còn lại{" "}
                  {formData.is_advance ? "sau khi trừ giá trị đã tạm ứng" : ""}{" "}
                  và các khoản chi phí phát sinh (nếu có), trong vòng{" "}
                  <strong>{formData.advance_date || 15} ngày</strong> sau khi
                  Bên B hoàn thành dịch vụ và cung cấp đầy đủ hồ sơ thanh toán
                  hợp lệ.
                </p>
              </div>
              <ContractClause title="3.4. Chậm thanh toán">
                <Form.Control
                  as="textarea"
                  rows={6}
                  name="late_payment"
                  value={formData.late_payment || ""}
                  onChange={handleChange}
                  placeholder="Nhập nội dung quy định về chậm thanh toán..."
                />
              </ContractClause>
            </Accordion.Body>
          </Accordion.Item>

          {/* =================================================
              ARTICLE 4
          ================================================= */}

          <ArticleEditor
            eventKey="3"
            title="Điều 4. Quyền và trách nhiệm của Bên A"
            name="article_4"
            value={formData.article_4}
            onChange={handleChange}
            rows={18}
          />

          {/* =================================================
              ARTICLE 5
          ================================================= */}

          <ArticleEditor
            eventKey="4"
            title="Điều 5. Quyền và trách nhiệm của Bên B"
            name="article_5"
            value={formData.article_5}
            onChange={handleChange}
            rows={20}
          />

          {/* =================================================
              ARTICLE 6
          ================================================= */}

          <ArticleEditor
            eventKey="5"
            title="Điều 6. Quản lý, xác nhận và thanh toán chi phí phát sinh"
            name="article_6"
            value={formData.article_6}
            onChange={handleChange}
            rows={16}
          />

          {/* =================================================
              ARTICLE 7
          ================================================= */}

          <ArticleEditor
            eventKey="6"
            title="Điều 7. Sự kiện bất khả kháng"
            name="article_7"
            value={formData.article_7}
            onChange={handleChange}
            rows={16}
          />

          {/* =================================================
              ARTICLE 8
          ================================================= */}

          <ArticleEditor
            eventKey="7"
            title="Điều 8. Phạt vi phạm hợp đồng và bồi thường thiệt hại"
            name="article_8"
            value={formData.article_8}
            onChange={handleChange}
            rows={18}
          />

          {/* =================================================
              ARTICLE 9
          ================================================= */}

          <ArticleEditor
            eventKey="8"
            title="Điều 9. Luật áp dụng và giải quyết tranh chấp"
            name="article_9"
            value={formData.article_9}
            onChange={handleChange}
            rows={16}
          />

          {/* =================================================
              ARTICLE 10
          ================================================= */}

          <ArticleEditor
            eventKey="9"
            title="Điều 10. Bảo mật thông tin và dữ liệu cá nhân"
            name="article_10"
            value={formData.article_10}
            onChange={handleChange}
            rows={14}
          />

          {/* =================================================
              ARTICLE 11
          ================================================= */}

          <ArticleEditor
            eventKey="10"
            title="Điều 11. Điều khoản chung"
            name="article_11"
            value={formData.article_11}
            onChange={handleChange}
            rows={14}
          />
        </Accordion>
      </div>

      {/* =====================================================
          PREVIEW
      ===================================================== */}

      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        dialogClassName="contract-preview-modal"
        contentClassName="contract-preview-modal-content"
        centered
      >
        <Modal.Header closeButton className="contract-preview-modal-header">
          <Modal.Title>Xem trước hợp đồng</Modal.Title>
        </Modal.Header>

        <Modal.Body className="contract-preview-modal-body">
          <ContractPreview
            formData={formData}
            departures={departures}
            priceItems={priceItems}
            contractAmount={contractAmount}
            calculatedAdvanceAmount={calculatedAdvanceAmount}
            remainingPaymentAmount={remainingPaymentAmount}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </Modal.Body>

        <Modal.Footer className="contract-preview-modal-footer">
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Đóng
          </Button>

          <Button variant="primary" onClick={() => window.print()}>
            In hợp đồng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* =====================================================
          TOAST
      ===================================================== */}

      <ToastContainer position="top-end" className="p-3">
        <Toast
          bg="success"
          show={successAlertOpen}
          onClose={() => setSuccessAlertOpen(false)}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white fw-bold">{alertMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

// ============================================================
// ARTICLE EDITOR
// ============================================================

const ArticleEditor = ({
  eventKey,

  title,

  name,

  value,

  onChange,

  rows = 16,
}) => {
  return (
    <Accordion.Item eventKey={eventKey}>
      <Accordion.Header>{title}</Accordion.Header>

      <Accordion.Body>
        <Form.Control
          as="textarea"
          rows={rows}
          name={name}
          value={value || ""}
          onChange={onChange}
        />
      </Accordion.Body>
    </Accordion.Item>
  );
};

// ============================================================
// CONTRACT INPUT
// ============================================================

const ContractInput = ({
  label,

  required = false,

  children,
}) => {
  return (
    <div className="contract-input-row">
      <label>
        {label}

        {required && <span className="contract-required">*</span>}
      </label>

      <div>{children}</div>
    </div>
  );
};

// ============================================================
// CONTRACT CLAUSE
// ============================================================

const ContractClause = ({
  title,

  children,
}) => {
  return (
    <div className="contract-clause">
      <h4>{title}</h4>

      {children}
    </div>
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
// PREVIEW INFO ROW
// ẨN NẾU KHÔNG CÓ VALUE
// ============================================================

const PreviewInfoRow = ({
  label,

  value,
}) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  return (
    <div className="preview-info-row">
      <span className="preview-info-label">{label}</span>

      <span>:</span>

      <span>{value}</span>
    </div>
  );
};

// ============================================================
// PREVIEW
// ============================================================

const ContractPreview = ({
  formData,

  departures,

  priceItems,

  contractAmount,

  calculatedAdvanceAmount,

  remainingPaymentAmount,

  formatCurrency,

  formatDate,
}) => {
  // ==========================================================
  // RENDER NORMAL TEXT
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
  // ARTICLE CONTENT
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
        //
        // CSS hiện tại của bạn đã xử lý:
        // dòng đầu thụt vào,
        // dòng sau quay về cùng lề 4.2.
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

        // ================================================
        // NORMAL
        // ================================================

        return (
          <p key={`paragraph-${index}`} className="preview-contract-paragraph">
            {value}
          </p>
        );
      });
  };

  // ==========================================================
  // RETURN PREVIEW
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
          {formData.legal_bases
            .filter((item) => item.content?.trim())
            .map((item, index) => (
              <p key={item.id || index} className="preview-paragraph">
                {item.content}
              </p>
            ))}
        </section>

        {/* ===================================================
            PARTY A
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

          <PreviewInfoRow
            label="Mã QHNS"
            value={formData.customer_budget_code}
          />

          <PreviewInfoRow
            label="Tài khoản"
            value={formData.customer_bank_account}
          />

          {(formData.customer_rep_name || formData.customer_rep_title) && (
            <div className="preview-info-row">
              <span className="preview-info-label">Đại diện</span>

              <span>:</span>

              <span>{formData.customer_rep_name}</span>

              {formData.customer_rep_title && (
                <>
                  <span className="preview-inline-title">Chức vụ:</span>

                  <span>{formData.customer_rep_title}</span>
                </>
              )}
            </div>
          )}

          {formData.customer_rep_note && (
            <p className="preview-note">{formData.customer_rep_note}</p>
          )}

          <p className="preview-party-closing">
            Sau đây gọi tắt là <strong>Bên A</strong>.
          </p>
        </section>

        {/* ===================================================
            PARTY B
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

          {(formData.company_rep_name || formData.company_rep_title) && (
            <div className="preview-info-row">
              <span className="preview-info-label">Đại diện</span>

              <span>:</span>

              <span>{formData.company_rep_name}</span>

              {formData.company_rep_title && (
                <>
                  <span className="preview-inline-title">Chức vụ:</span>

                  <span>{formData.company_rep_title}</span>
                </>
              )}
            </div>
          )}

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

          {renderArticleContent(formData.priority_documents)}

          <h3>1.5. Khối lượng phát sinh ngoài hợp đồng</h3>

          {renderArticleContent(formData.extra_volume)}
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
                      Thuế giá trị gia tăng ({Number(formData.vat_rate || 0)}%)
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
            {numberToVietnamese(contractAmount.totalAmount)}.
          </p>

          <h3>2.2. Giá trị thanh toán</h3>

          <p className="preview-paragraph">
            Giá trị thanh toán thực tế được xác định trên cơ sở khối lượng dịch
            vụ thực tế đã thực hiện, số lượng người tham gia thực tế, các khối
            lượng phát sinh được chấp thuận và các khoản giảm trừ theo thỏa
            thuận của các bên.
          </p>
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

          {formData.company_bank_account && (
            <p className="preview-paragraph preview-indent">
              – Tài khoản ngân hàng: {formData.company_bank_account}.
            </p>
          )}

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
                <strong>{formatCurrency(calculatedAdvanceAmount)} đồng</strong>.
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
        </section>

        {/* ===================================================
            ARTICLE 4 - 11
        =================================================== */}

        <PreviewArticle
          title="ĐIỀU 4. QUYỀN VÀ TRÁCH NHIỆM CỦA BÊN A"
          content={formData.article_4}
          renderArticleContent={renderArticleContent}
        />

        <PreviewArticle
          title="ĐIỀU 5. QUYỀN VÀ TRÁCH NHIỆM CỦA BÊN B"
          content={formData.article_5}
          renderArticleContent={renderArticleContent}
        />

        <PreviewArticle
          title="ĐIỀU 6. QUẢN LÝ, XÁC NHẬN VÀ THANH TOÁN CHI PHÍ PHÁT SINH"
          content={formData.article_6}
          renderArticleContent={renderArticleContent}
        />

        <PreviewArticle
          title="ĐIỀU 7. SỰ KIỆN BẤT KHẢ KHÁNG"
          content={formData.article_7}
          renderArticleContent={renderArticleContent}
        />

        <PreviewArticle
          title="ĐIỀU 8. PHẠT VI PHẠM HỢP ĐỒNG VÀ BỒI THƯỜNG THIỆT HẠI"
          content={formData.article_8}
          renderArticleContent={renderArticleContent}
        />

        <PreviewArticle
          title="ĐIỀU 9. LUẬT ÁP DỤNG VÀ GIẢI QUYẾT TRANH CHẤP"
          content={formData.article_9}
          renderArticleContent={renderArticleContent}
        />

        <PreviewArticle
          title="ĐIỀU 10. BẢO MẬT THÔNG TIN VÀ DỮ LIỆU CÁ NHÂN"
          content={formData.article_10}
          renderArticleContent={renderArticleContent}
        />

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

            {formData.customer_rep_title && (
              <p className="preview-signature-position">
                {formData.customer_rep_title}
              </p>
            )}

            <div className="preview-signature-space" />

            <p className="preview-signature-name">
              {cleanRepresentativeName(formData.customer_rep_name)}
            </p>
          </div>

          <div className="preview-signature-box">
            <p className="preview-signature-title">ĐẠI DIỆN BÊN B</p>

            {formData.company_rep_title && (
              <p className="preview-signature-position">
                {formData.company_rep_title}
              </p>
            )}

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

// ============================================================
// EXPORT
// ============================================================

export default ContractEdit;
