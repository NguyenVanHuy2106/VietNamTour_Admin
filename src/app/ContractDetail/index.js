import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Accordion,
  Button,
  Modal,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import {
  BsArrowLeft,
  BsEye,
  BsFileEarmarkPdf,
  BsFileEarmarkWord,
  BsPencil,
  BsPrinter,
  BsFileEarmarkText,
  BsPlusLg,
  BsTrash,
  BsReceipt,
  BsCheck2Circle,
  BsFolder2Open,
} from "react-icons/bs";

import ContractForm08a from "../../components/ContractForm08a";
import { useNavigate, useParams } from "react-router-dom";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { numberToVietnamese } from "../../components/NumberToVietnamese";

import "./index.css";

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

// ============================================================
// VAT ITEM
// ============================================================

const normalizeSettlementVatType = (value, fallback = "NO_VAT") => {
  const raw = String(value || "").toUpperCase();

  if (raw === "INCLUDED" || raw === "EXCLUDED" || raw === "NO_VAT") {
    return raw;
  }

  const numeric = Number(value);

  if (numeric === 1) return "INCLUDED";
  if (numeric === 2) return "EXCLUDED";
  if (numeric === 3) return "NO_VAT";

  return fallback;
};

// ============================================================
// TÍNH GIÁ TRỊ 1 HẠNG MỤC NGHIỆM THU
// ============================================================

const calculateSettlementItemValues = (
  item = {},
  fallbackVatType = "NO_VAT",
  fallbackVatRate = 0,
  quantityField = "quantity_actual",
) => {
  const quantity = Number(item?.[quantityField] || 0);

  const unitPrice = Number(item?.unit_price || 0);

  const vatType = normalizeSettlementVatType(
    item?.vat_type,
    normalizeSettlementVatType(fallbackVatType, "NO_VAT"),
  );

  const vatRate =
    vatType === "NO_VAT"
      ? 0
      : Number(
          item?.vat_rate !== undefined && item?.vat_rate !== null
            ? item.vat_rate
            : fallbackVatRate,
        ) || 0;

  const linePrice = quantity * unitPrice;

  let amountBeforeVat = linePrice;

  let vatAmount = 0;

  let amountAfterVat = linePrice;

  // ==========================================================
  // ĐƠN GIÁ CHƯA VAT
  // ==========================================================

  if (vatType === "EXCLUDED") {
    amountBeforeVat = linePrice;

    vatAmount = amountBeforeVat * (vatRate / 100);

    amountAfterVat = amountBeforeVat + vatAmount;
  }

  // ==========================================================
  // ĐƠN GIÁ ĐÃ BAO GỒM VAT
  // ==========================================================

  if (vatType === "INCLUDED") {
    amountAfterVat = linePrice;

    if (vatRate > 0) {
      amountBeforeVat = amountAfterVat / (1 + vatRate / 100);

      vatAmount = amountAfterVat - amountBeforeVat;
    } else {
      amountBeforeVat = amountAfterVat;

      vatAmount = 0;
    }
  }

  // ==========================================================
  // KHÔNG VAT
  // ==========================================================

  if (vatType === "NO_VAT") {
    amountBeforeVat = linePrice;

    vatAmount = 0;

    amountAfterVat = linePrice;
  }

  return {
    quantity,

    unitPrice,

    vatType,

    vatRate,

    amountBeforeVat: Math.round(amountBeforeVat),

    vatAmount: Math.round(vatAmount),

    amountAfterVat: Math.round(amountAfterVat),
  };
};

// ============================================================
// TÍNH TỔNG BIÊN BẢN NGHIỆM THU
// ============================================================

const calculateAcceptanceValues = (
  items = [],
  fallbackVatType = "NO_VAT",
  fallbackVatRate = 0,
  quantityField = "quantity_actual",
) => {
  const vatGroupMap = new Map();

  let serviceTotal = 0;

  let vatAmount = 0;

  let totalAmount = 0;

  (items || []).forEach((item) => {
    const calculated = calculateSettlementItemValues(
      item,

      fallbackVatType,

      fallbackVatRate,

      quantityField,
    );

    serviceTotal += calculated.amountBeforeVat;

    vatAmount += calculated.vatAmount;

    totalAmount += calculated.amountAfterVat;

    const groupKey = `${calculated.vatType}_${calculated.vatRate}`;

    if (!vatGroupMap.has(groupKey)) {
      vatGroupMap.set(groupKey, {
        vat_type: calculated.vatType,

        vat_rate: calculated.vatRate,

        subtotal: 0,

        vat_amount: 0,

        total: 0,
      });
    }

    const group = vatGroupMap.get(groupKey);

    group.subtotal += calculated.amountBeforeVat;

    group.vat_amount += calculated.vatAmount;

    group.total += calculated.amountAfterVat;
  });

  const vatGroups = Array.from(vatGroupMap.values()).sort((a, b) => {
    if (a.vat_type === "NO_VAT" && b.vat_type !== "NO_VAT") {
      return 1;
    }

    if (b.vat_type === "NO_VAT" && a.vat_type !== "NO_VAT") {
      return -1;
    }

    return Number(a.vat_rate || 0) - Number(b.vat_rate || 0);
  });

  return {
    serviceTotal: Math.round(serviceTotal),

    vatAmount: Math.round(vatAmount),

    totalAmount: Math.round(totalAmount),

    vatGroups,
  };
};

const ContractDetail = () => {
  const navigate = useNavigate();
  const form08aRef = useRef(null);
  const { contractId } = useParams();
  const userId = localStorage.getItem("userId");

  // ==========================================================
  // STATE
  // ==========================================================

  const [loading, setLoading] = useState(true);

  const [contract, setContract] = useState(null);

  const [showPreview, setShowPreview] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================================
  // HỒ SƠ HỢP ĐỒNG
  // ==========================================================

  const [contractDocuments, setContractDocuments] = useState({
    settlements: [],
    form_08a: [],
    payments: [],
  });

  const [documentsLoading, setDocumentsLoading] = useState(false);

  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const [selectedDocumentType, setSelectedDocumentType] = useState("");

  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);

  const [showLiquidationModal, setShowLiquidationModal] = useState(false);

  const [showAcceptanceLiquidationModal, setShowAcceptanceLiquidationModal] =
    useState(false);

  const [activeTab, setActiveTab] = useState("DETAIL");
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  const [showSettlementPreview, setShowSettlementPreview] = useState(false);

  const [showSettlementEdit, setShowSettlementEdit] = useState(false);

  const [settlementLoading, setSettlementLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "success",
  });
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
    company_contact_address: "",

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

  const [acceptanceForm, setAcceptanceForm] = useState({
    acceptance_mode: "FULL",

    document_no: "",
    document_date: "",

    batch_no: null,

    service_from_date: "",
    service_to_date: "",

    contract_value: 0,

    quality_rating: "Tốt",
    other_comment: "Không",

    note: "",

    created_by: userId,

    // Có phát sinh hay không
    has_extra: false,

    items: [],
  });

  const [liquidationForm, setLiquidationForm] = useState({
    document_no: "",
    document_date: "",

    acceptance_settlement_id: null,
    acceptance_document_no: "",
    acceptance_document_date: "",

    items: [],

    vat_type: "INCLUDED",
    vat_rate: 0,

    subtotal: 0,
    vat_amount: 0,
    actual_value: 0,

    contract_value: 0,

    paid_amount: 0,
    remaining_amount: 0,

    note: "",

    created_by: userId,
  });

  // ==========================================================
  // LOAD
  // ==========================================================

  // ==========================================================
  // GET CONTRACT DOCUMENTS
  // ==========================================================
  const showToast = (message, variant = "success") => {
    setToast({
      show: true,
      message,
      variant,
    });
  };
  const getContractDocuments = async () => {
    try {
      setDocumentsLoading(true);

      const response = await API.get(`/contracts/${contractId}/documents`);

      const data = response?.data?.data || {};

      setContractDocuments({
        settlements: data.settlements || [],
        form_08a: data.form_08a || [],
        payments: data.payments || [],
      });
    } catch (error) {
      console.error("getContractDocuments error:", error);
      console.error("Backend:", error?.response?.data);

      setContractDocuments({
        settlements: [],
        form_08a: [],
        payments: [],
      });
    } finally {
      setDocumentsLoading(false);
    }
  };
  const getSettlementDetail = async (settlementId) => {
    try {
      setSettlementLoading(true);

      const response = await API.get(
        `/contracts/${contractId}/documents/${settlementId}`,
      );

      return response?.data?.data || null;
    } catch (error) {
      console.error("getSettlementDetail error:", error);
      console.error("Backend:", error?.response?.data);

      alert(error?.response?.data?.message || "Không thể tải biên bản");

      return null;
    } finally {
      setSettlementLoading(false);
    }
  };
  const getContractPaidAmount = () => {
    return (contractDocuments.payments || []).reduce((sum, payment) => {
      if (Number(payment.status) !== 1) {
        return sum;
      }

      const amount = Number(payment.amount || 0);

      if (
        payment.payment_type === "ADVANCE" ||
        payment.payment_type === "PAYMENT"
      ) {
        return sum + amount;
      }

      if (payment.payment_type === "REFUND") {
        return sum - amount;
      }

      return sum;
    }, 0);
  };

  const buildLiquidationItems = async () => {
    const acceptanceDocs = (contractDocuments.settlements || []).filter(
      (item) =>
        item.document_type === "ACCEPTANCE" && Number(item.status) === 1,
    );

    if (!acceptanceDocs.length) {
      return [];
    }

    const detailResponses = await Promise.all(
      acceptanceDocs.map((item) =>
        API.get(`/contracts/${contractId}/documents/${item.settlement_id}`),
      ),
    );

    const detailList = detailResponses
      .map((response) => response?.data?.data)
      .filter(Boolean);

    const itemMap = new Map();

    detailList.forEach((settlement) => {
      (settlement.items || []).forEach((item) => {
        const quantity = Number(item.quantity_actual || 0);

        const unitPrice = Number(item.unit_price || 0);

        const vatType = normalizeSettlementVatType(
          item.vat_type,
          formData.vat_type,
        );

        const vatRate =
          vatType === "NO_VAT"
            ? 0
            : Number(item.vat_rate ?? formData.vat_rate ?? 0);

        const isExtra =
          item.is_extra === true ||
          item.is_extra === 1 ||
          item.is_extra === "1" ||
          item.is_extra === "true";

        const amountBeforeVat =
          item.actual_amount !== null && item.actual_amount !== undefined
            ? Number(item.actual_amount || 0)
            : quantity * unitPrice;

        const itemVatAmount = Number(item.vat_amount || 0);

        const amountAfterVat =
          Number(item.amount_after_vat || 0) ||
          (vatType === "EXCLUDED"
            ? amountBeforeVat + itemVatAmount
            : amountBeforeVat);

        const key = [
          item.contract_item_id || "EXTRA",
          item.item_name || "",
          item.unit || "",
          unitPrice,
          vatType,
          vatRate,
          isExtra ? "EXTRA" : "CONTRACT",
        ].join("_");

        if (!itemMap.has(key)) {
          itemMap.set(key, {
            contract_item_id: item.contract_item_id || null,

            item_name: item.item_name || "",

            route_name: item.route_name || "",

            customer_type: item.customer_type || "",

            unit: item.unit || "",

            quantity: 0,

            unit_price: unitPrice,

            amount: 0,

            vat_type: vatType,

            vat_rate: vatRate,

            vat_amount: 0,

            amount_after_vat: 0,

            is_extra: isExtra,

            extra_note: item.extra_note || "",

            sort_order: item.sort_order || 1,
          });
        }

        const current = itemMap.get(key);

        // CỘNG DỒN NHIỀU ĐỢT NGHIỆM THU
        current.quantity += quantity;

        current.amount += amountBeforeVat;

        current.vat_amount += itemVatAmount;

        current.amount_after_vat += amountAfterVat;

        if (!current.extra_note && item.extra_note) {
          current.extra_note = item.extra_note;
        }
      });
    });

    return Array.from(itemMap.values())
      .filter(
        (item) =>
          Number(item.quantity || 0) !== 0 || Number(item.amount || 0) !== 0,
      )
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  };

  const calculateLiquidationValues = (items = []) => {
    const vatGroupMap = new Map();

    let subtotal = 0;
    let vatAmount = 0;
    let actualValue = 0;

    (items || []).forEach((item) => {
      const amountBeforeVat = Number(item.amount ?? item.actual_amount ?? 0);

      const itemVatAmount = Number(item.vat_amount || 0);

      const amountAfterVat = Number(
        item.amount_after_vat ?? amountBeforeVat + itemVatAmount,
      );

      const vatType = normalizeSettlementVatType(
        item.vat_type,
        formData.vat_type,
      );

      const vatRate =
        vatType === "NO_VAT"
          ? 0
          : Number(item.vat_rate ?? formData.vat_rate ?? 0);

      subtotal += amountBeforeVat;
      vatAmount += itemVatAmount;
      actualValue += amountAfterVat;

      const key = `${vatType}_${vatRate}`;

      if (!vatGroupMap.has(key)) {
        vatGroupMap.set(key, {
          vat_type: vatType,
          vat_rate: vatRate,
          subtotal: 0,
          vat_amount: 0,
          total: 0,
        });
      }

      const group = vatGroupMap.get(key);

      group.subtotal += amountBeforeVat;
      group.vat_amount += itemVatAmount;
      group.total += amountAfterVat;
    });

    return {
      subtotal: Math.round(subtotal),

      vat_amount: Math.round(vatAmount),

      actual_value: Math.round(actualValue),

      vatGroups: Array.from(vatGroupMap.values()),
    };
  };

  const calculateAcceptanceValues = (
    items = [],
    vatType,
    vatRate,
    quantityField = "quantity_actual",
  ) => {
    const serviceTotal = (items || []).reduce((sum, item) => {
      const quantity = Number(item?.[quantityField] || 0);
      const unitPrice = Number(item?.unit_price || 0);

      return sum + quantity * unitPrice;
    }, 0);

    const rate = Number(vatRate || 0);

    let vatAmount = 0;
    let totalAmount = serviceTotal;

    // ĐƠN GIÁ CHƯA BAO GỒM VAT
    if (vatType === "EXCLUDED") {
      vatAmount = serviceTotal * (rate / 100);
      totalAmount = serviceTotal + vatAmount;
    }

    // ĐƠN GIÁ ĐÃ BAO GỒM VAT
    if (vatType === "INCLUDED") {
      vatAmount = 0;
      totalAmount = serviceTotal;
    }

    // KHÔNG VAT
    if (vatType === "NO_VAT") {
      vatAmount = 0;
      totalAmount = serviceTotal;
    }

    return {
      serviceTotal,
      vatAmount,
      totalAmount,
    };
  };

  const handleLiquidationItemChange = (index, field, value) => {
    setLiquidationForm((prev) => {
      const items = [...(prev.items || [])];

      if (!items[index]) {
        return prev;
      }

      items[index] = {
        ...items[index],
        [field]: value,
      };

      items[index].amount =
        Number(items[index].quantity || 0) *
        Number(items[index].unit_price || 0);

      // TÍNH LẠI TOÀN BỘ GIÁ TRỊ THANH LÝ
      const calculated = calculateLiquidationValues(
        items,
        prev.vat_type,
        prev.vat_rate,
      );

      return {
        ...prev,

        items,

        subtotal: calculated.subtotal,

        vat_amount: calculated.vat_amount,

        actual_value: calculated.actual_value,

        remaining_amount:
          calculated.actual_value - Number(prev.paid_amount || 0),
      };
    });
  };

  const handleEditAcceptance = async (settlementId) => {
    try {
      // reset trạng thái edit cũ
      setSelectedSettlement(null);

      // đảm bảo modal thanh lý đóng
      setShowLiquidationModal(false);

      setSettlementLoading(true);

      const response = await API.get(
        `/contracts/${contractId}/documents/${settlementId}`,
      );

      const data = response?.data?.data;

      if (!data) {
        alert("Không tìm thấy biên bản nghiệm thu");
        return;
      }

      if (data.document_type !== "ACCEPTANCE") {
        alert("Hồ sơ này không phải biên bản nghiệm thu");
        return;
      }

      setSelectedSettlement(data);

      const settlementItems = data.items || [];

      // =========================================================
      // KIỂM TRA BIÊN BẢN CÓ HẠNG MỤC PHÁT SINH HAY KHÔNG
      // =========================================================
      const hasExtraItems = settlementItems.some(
        (item) =>
          item.is_extra === true ||
          item.is_extra === 1 ||
          item.is_extra === "1" ||
          item.is_extra === "true",
      );

      setAcceptanceForm({
        acceptance_mode:
          data.batch_no !== null && data.batch_no !== undefined
            ? "BATCH"
            : "FULL",

        document_no: data.document_no || "",

        document_date: data.document_date || "",

        batch_no: data.batch_no ?? null,

        service_from_date: data.service_from_date || "",

        service_to_date: data.service_to_date || "",

        contract_value: Number(
          data.contract_value || contractAmount.totalAmount || 0,
        ),

        quality_rating: data.quality_rating || "Tốt",

        other_comment: data.other_comment || "Không",

        note: data.note || "",

        created_by: data.created_by || userId,

        // =========================================================
        // CÓ PHÁT SINH
        // =========================================================
        has_extra: hasExtraItems,

        items: settlementItems.map((item, index) => {
          const isExtra =
            item.is_extra === true ||
            item.is_extra === 1 ||
            item.is_extra === "1" ||
            item.is_extra === "true";

          const vatType = normalizeSettlementVatType(
            item.vat_type,
            formData.vat_type,
          );

          return {
            settlement_item_id: item.settlement_item_id,

            contract_item_id: item.contract_item_id || null,

            item_name: item.item_name || "",

            route_name: item.route_name || "",

            customer_type: item.customer_type || "",

            unit: item.unit || "",

            quantity_contract: Number(item.quantity_contract || 0),

            quantity_actual: Number(item.quantity_actual || 0),

            unit_price: Number(item.unit_price || 0),

            contract_amount: Number(item.contract_amount || 0),

            actual_amount: Number(item.actual_amount || 0),

            // =========================
            // VAT
            // =========================

            vat_type: vatType,

            vat_rate:
              vatType === "NO_VAT"
                ? 0
                : Number(
                    item.vat_rate !== undefined && item.vat_rate !== null
                      ? item.vat_rate
                      : formData.vat_rate,
                  ) || 0,

            vat_amount: Number(item.vat_amount || 0),

            amount_after_vat: Number(item.amount_after_vat || 0),

            // =====================================================
            // PHÁT SINH
            // =====================================================

            is_extra: isExtra,

            extra_note: item.extra_note || "",

            sort_order: item.sort_order || index + 1,
          };
        }),
      });

      setShowAcceptanceModal(true);
    } catch (error) {
      console.error("handleEditAcceptance error:", error);

      console.error("Backend:", error?.response?.data);

      alert(
        error?.response?.data?.message || "Không thể tải biên bản nghiệm thu",
      );
    } finally {
      setSettlementLoading(false);
    }
  };
  const handleEditLiquidation = async (settlementId) => {
    try {
      setSelectedSettlement(null);

      setShowAcceptanceModal(false);

      setSettlementLoading(true);

      const response = await API.get(
        `/contracts/${contractId}/documents/${settlementId}`,
      );

      const data = response?.data?.data;

      if (!data) {
        alert("Không tìm thấy biên bản thanh lý");
        return;
      }

      if (data.document_type !== "LIQUIDATION") {
        alert("Hồ sơ này không phải biên bản thanh lý");
        return;
      }

      setSelectedSettlement(data);

      // ============================================================
      // CHUYỂN ITEM TỪ DB -> FORMAT CỦA liquidationForm
      // ============================================================

      const liquidationItems = (data.items || []).map((item, index) => {
        const vatType = normalizeSettlementVatType(
          item.vat_type,
          formData.vat_type,
        );

        const vatRate =
          vatType === "NO_VAT"
            ? 0
            : Number(
                item.vat_rate !== undefined && item.vat_rate !== null
                  ? item.vat_rate
                  : formData.vat_rate,
              ) || 0;

        const quantity = Number(item.quantity_actual || 0);

        const unitPrice = Number(item.unit_price || 0);

        const amount = Number(
          item.actual_amount !== undefined && item.actual_amount !== null
            ? item.actual_amount
            : quantity * unitPrice,
        );

        return {
          settlement_item_id: item.settlement_item_id || null,

          contract_item_id: item.contract_item_id || null,

          item_name: item.item_name || "",

          route_name: item.route_name || "",

          customer_type: item.customer_type || "",

          unit: item.unit || "",

          /*
           * Modal thanh lý hiện đang dùng:
           * item.quantity
           * item.amount
           *
           * nên cần convert từ DB.
           */
          quantity,

          quantity_actual: quantity,

          unit_price: unitPrice,

          amount,

          actual_amount: amount,

          // =========================
          // VAT
          // =========================

          vat_type: vatType,

          vat_rate: vatRate,

          vat_amount: Number(item.vat_amount || 0),

          amount_after_vat: Number(
            item.amount_after_vat !== undefined &&
              item.amount_after_vat !== null
              ? item.amount_after_vat
              : amount,
          ),

          // =========================
          // PHÁT SINH
          // =========================

          is_extra:
            item.is_extra === true ||
            item.is_extra === 1 ||
            item.is_extra === "1" ||
            item.is_extra === "true",

          extra_note: item.extra_note || "",

          sort_order: item.sort_order || index + 1,
        };
      });

      // ============================================================
      // TÍNH LẠI ĐỂ FORM EDIT LUÔN ĐỒNG BỘ
      // ============================================================

      const calculated = calculateLiquidationValues(liquidationItems);

      setLiquidationForm({
        document_no: data.document_no || "",

        document_date: data.document_date || "",

        acceptance_settlement_id: null,

        acceptance_document_no: "",

        acceptance_document_date: "",

        items: liquidationItems,

        vat_type: formData.vat_type,

        vat_rate: Number(formData.vat_rate || 0),

        subtotal: Number(data.subtotal ?? calculated.subtotal ?? 0),

        vat_amount: Number(data.vat_amount ?? calculated.vat_amount ?? 0),

        actual_value: Number(data.actual_value ?? calculated.actual_value ?? 0),

        contract_value: Number(
          data.contract_value || contractAmount.totalAmount || 0,
        ),

        paid_amount: Number(data.paid_amount || 0),

        remaining_amount: Number(
          data.remaining_amount ??
            Number(data.actual_value || 0) - Number(data.paid_amount || 0),
        ),

        note: data.note || "",

        created_by: data.created_by || userId,
      });

      setShowLiquidationModal(true);
    } catch (error) {
      console.error("handleEditLiquidation error:", error);

      console.error("Backend:", error?.response?.data);

      alert(
        error?.response?.data?.message || "Không thể tải biên bản thanh lý",
      );
    } finally {
      setSettlementLoading(false);
    }
  };

  const handleViewSettlement = async (settlementId) => {
    const data = await getSettlementDetail(settlementId);

    // console.log("SETTLEMENT DETAIL:", data);
    // console.log("SETTLEMENT ITEMS:", data?.items);

    if (!data) {
      return;
    }

    setSelectedSettlement(data);
    setShowSettlementPreview(true);
  };

  useEffect(() => {
    if (contractId) {
      getContractDetail();
      getContractDocuments();
    }
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
        company_contact_address: company?.company_contact_address || "",

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

  const handleAcceptanceItemChange = (index, field, value) => {
    setAcceptanceForm((prev) => {
      const items = [...(prev.items || [])];

      if (!items[index]) {
        return prev;
      }

      const currentItem = items[index];

      items[index] = {
        ...currentItem,
        [field]: value,
      };

      /*
       * ITEM HỢP ĐỒNG:
       * VAT phải luôn y hệt hợp đồng.
       */
      if (!items[index].is_extra) {
        items[index].vat_type = formData.vat_type;

        items[index].vat_rate =
          formData.vat_type === "NO_VAT" ? 0 : Number(formData.vat_rate || 0);
      }

      /*
       * ITEM PHÁT SINH:
       * vat_type cũng bắt buộc giống hợp đồng.
       */
      if (items[index].is_extra) {
        items[index].vat_type = formData.vat_type;

        if (formData.vat_type === "NO_VAT") {
          items[index].vat_rate = 0;
        } else {
          const validVatRates = [0, 8, 10];

          const currentRate = Number(items[index].vat_rate || 0);

          if (!validVatRates.includes(currentRate)) {
            items[index].vat_rate = Number(formData.vat_rate || 0);
          }
        }
      }

      const calculated = calculateSettlementItemValues(
        items[index],
        formData.vat_type,
        formData.vat_rate,
        "quantity_actual",
      );

      items[index].actual_amount = calculated.amountBeforeVat;

      items[index].vat_amount = calculated.vatAmount;

      items[index].amount_after_vat = calculated.amountAfterVat;

      return {
        ...prev,
        items,
      };
    });
  };

  const handleAddAcceptanceExtraItem = () => {
    setAcceptanceForm((prev) => {
      const contractVatType = formData.vat_type;

      return {
        ...prev,

        has_extra: true,

        items: [
          ...(prev.items || []),

          {
            settlement_item_id: null,

            contract_item_id: null,

            item_name: "",

            route_name: "",

            customer_type: "",

            unit: "",

            quantity_contract: 0,

            quantity_actual: 1,

            unit_price: 0,

            contract_amount: 0,

            actual_amount: 0,

            /*
             * PHÁT SINH LUÔN THEO KIỂU VAT HỢP ĐỒNG
             */
            vat_type: contractVatType,

            /*
             * Không VAT => bắt buộc 0.
             *
             * Có VAT => mặc định lấy rate hợp đồng,
             * sau đó cho chọn 0 / 8 / 10.
             */
            vat_rate:
              contractVatType === "NO_VAT" ? 0 : Number(formData.vat_rate || 0),

            vat_amount: 0,

            amount_after_vat: 0,

            is_extra: true,

            extra_note: "",

            sort_order: (prev.items || []).length + 1,
          },
        ],
      };
    });
  };

  const handleRemoveAcceptanceExtraItem = (index) => {
    setAcceptanceForm((prev) => {
      const target = (prev.items || [])[index];

      // Không cho xóa hạng mục hợp đồng
      if (!target?.is_extra) {
        return prev;
      }

      return {
        ...prev,

        items: (prev.items || [])
          .filter((_, itemIndex) => itemIndex !== index)
          .map((item, itemIndex) => ({
            ...item,

            sort_order: itemIndex + 1,
          })),
      };
    });
  };

  const contractAcceptanceValues = calculateAcceptanceValues(
    (priceItems || []).map((item) => ({
      ...item,

      quantity_contract: Number(item.quantity || 0),

      vat_type: formData.vat_type,

      vat_rate:
        formData.vat_type === "NO_VAT" ? 0 : Number(formData.vat_rate || 0),
    })),

    formData.vat_type,

    formData.vat_rate,

    "quantity_contract",
  );

  const actualAcceptanceValues = calculateAcceptanceValues(
    acceptanceForm.items || [],

    formData.vat_type,

    formData.vat_rate,

    "quantity_actual",
  );

  const getNextDocumentNumber = async (type, documentDate = null) => {
    try {
      let year = new Date().getFullYear();

      if (documentDate) {
        const parsedYear = Number(String(documentDate).substring(0, 4));

        if (!Number.isNaN(parsedYear)) {
          year = parsedYear;
        }
      }

      const response = await API.get("/contracts/documents/next-number", {
        params: {
          type,
          year,
        },
      });

      return response?.data?.data?.document_no || "";
    } catch (error) {
      console.error("getNextDocumentNumber error:", error);

      console.error("Backend:", error?.response?.data);

      return "";
    }
  };

  const handleSaveAcceptance = async () => {
    try {
      // ========================================================
      // VALIDATE
      // ========================================================

      if (!acceptanceForm.document_date) {
        alert("Vui lòng chọn ngày nghiệm thu");

        return;
      }

      if (
        !Array.isArray(acceptanceForm.items) ||
        acceptanceForm.items.length === 0
      ) {
        alert("Chưa có hạng mục nghiệm thu");

        return;
      }

      // ========================================================
      // VALIDATE HẠNG MỤC PHÁT SINH
      // ========================================================

      const invalidExtraIndex = (acceptanceForm.items || []).findIndex(
        (item) => {
          if (!item.is_extra) {
            return false;
          }

          const quantityActual = Number(item.quantity_actual || 0);

          const unitPrice = Number(item.unit_price || 0);

          return (
            !String(item.item_name || "").trim() ||
            !String(item.unit || "").trim() ||
            quantityActual <= 0 ||
            unitPrice < 0
          );
        },
      );

      if (invalidExtraIndex >= 0) {
        alert(
          `Hạng mục phát sinh dòng ${
            invalidExtraIndex + 1
          } chưa đầy đủ. Vui lòng nhập tên hạng mục, ĐVT, số lượng thực tế > 0 và đơn giá hợp lệ.`,
        );

        return;
      }

      // ========================================================
      // NORMALIZE ITEM
      // ========================================================

      const normalizedItems = (acceptanceForm.items || []).map(
        (item, index) => {
          const quantityContract = Number(item.quantity_contract || 0);

          const quantityActual = Number(item.quantity_actual || 0);

          const unitPrice = Number(item.unit_price || 0);

          /*
           * ITEM GỐC
           * → VAT THEO HỢP ĐỒNG
           *
           * ITEM PHÁT SINH
           * → VAT RIÊNG
           */
          const vatType = formData.vat_type;

          const vatRate =
            vatType === "NO_VAT"
              ? 0
              : item.is_extra
                ? [0, 8, 10].includes(Number(item.vat_rate))
                  ? Number(item.vat_rate)
                  : Number(formData.vat_rate || 0)
                : Number(formData.vat_rate || 0);

          const calculated = calculateSettlementItemValues(
            {
              ...item,

              quantity_actual: quantityActual,

              unit_price: unitPrice,

              vat_type: vatType,

              vat_rate: vatRate,
            },

            formData.vat_type,

            formData.vat_rate,

            "quantity_actual",
          );

          return {
            contract_item_id: item.contract_item_id || null,

            item_name: String(item.item_name || "").trim(),

            route_name: item.route_name || null,

            customer_type: item.customer_type || null,

            unit: String(item.unit || "").trim(),

            quantity_contract: quantityContract,

            quantity_actual: quantityActual,

            unit_price: unitPrice,

            contract_amount:
              Number(item.contract_amount || 0) || quantityContract * unitPrice,

            // ======================================
            // GIÁ TRỊ THỰC TẾ
            // ======================================

            actual_amount: calculated.amountBeforeVat,

            vat_type: calculated.vatType,

            vat_rate: calculated.vatRate,

            vat_amount: calculated.vatAmount,

            amount_after_vat: calculated.amountAfterVat,

            is_extra: Boolean(item.is_extra),

            extra_note: item.extra_note || null,

            sort_order: item.sort_order || index + 1,
          };
        },
      );

      // ========================================================
      // TỔNG BBNT
      // ========================================================

      const calculatedAcceptance = calculateAcceptanceValues(
        normalizedItems,

        formData.vat_type,

        formData.vat_rate,

        "quantity_actual",
      );

      // ========================================================
      // PAYLOAD
      // ========================================================

      const payload = {
        document_no: acceptanceForm.document_no,

        document_date: acceptanceForm.document_date,

        batch_no:
          acceptanceForm.acceptance_mode === "BATCH"
            ? acceptanceForm.batch_no
            : null,

        service_from_date: acceptanceForm.service_from_date || null,

        service_to_date: acceptanceForm.service_to_date || null,

        // Giá trị HĐ gốc
        contract_value: Number(contractAmount.totalAmount || 0),

        // Tổng trước VAT
        subtotal: Number(calculatedAcceptance.serviceTotal || 0),

        // Tổng VAT tất cả loại
        vat_amount: Number(calculatedAcceptance.vatAmount || 0),

        // Tổng cuối cùng
        actual_value: Number(calculatedAcceptance.totalAmount || 0),

        quality_rating: acceptanceForm.quality_rating,

        other_comment: acceptanceForm.other_comment,

        note: acceptanceForm.note,

        status: 1,

        items: normalizedItems,
      };

      // ========================================================
      // UPDATE
      // ========================================================

      if (selectedSettlement?.settlement_id) {
        await APIToken.put(
          `/contracts/${contractId}/documents/${selectedSettlement.settlement_id}`,

          payload,
        );

        showToast("Cập nhật biên bản nghiệm thu thành công");
      }

      // ========================================================
      // CREATE
      // ========================================================
      else {
        await APIToken.post(
          `/contracts/${contractId}/acceptances`,

          {
            ...payload,

            created_by: userId,
          },
        );

        showToast("Tạo biên bản nghiệm thu thành công");
      }

      setShowAcceptanceModal(false);

      setSelectedSettlement(null);

      await getContractDocuments();

      setActiveTab("DOCUMENTS");
    } catch (error) {
      console.error("handleSaveAcceptance error:", error);

      console.error("Backend:", error?.response?.data);

      alert(
        error?.response?.data?.message || "Không thể lưu biên bản nghiệm thu",
      );
    }
  };

  const handleSaveLiquidation = async () => {
    try {
      if (!liquidationForm.document_no) {
        alert("Không lấy được số biên bản thanh lý");

        return;
      }

      if (!liquidationForm.document_date) {
        alert("Vui lòng chọn ngày thanh lý");

        return;
      }

      if (!(liquidationForm.items || []).length) {
        alert("Biên bản thanh lý chưa có nội dung công việc");

        return;
      }

      const payload = {
        document_no: liquidationForm.document_no,

        document_date: liquidationForm.document_date,

        acceptance_settlement_id: null,

        contract_value: Number(liquidationForm.contract_value || 0),

        subtotal: Number(liquidationForm.subtotal || 0),

        vat_rate: Number(liquidationForm.vat_rate || 0),

        vat_amount: Number(liquidationForm.vat_amount || 0),

        actual_value: Number(liquidationForm.actual_value || 0),

        paid_amount: Number(liquidationForm.paid_amount || 0),

        remaining_amount: Number(liquidationForm.remaining_amount || 0),

        note: liquidationForm.note || "",

        created_by: userId,

        items: (liquidationForm.items || []).map((item, index) => ({
          contract_item_id: item.contract_item_id || null,

          item_name: item.item_name || "",

          route_name: item.route_name || null,

          customer_type: item.customer_type || null,

          unit: item.unit || "",

          quantity_actual: Number(item.quantity ?? item.quantity_actual ?? 0),

          unit_price: Number(item.unit_price || 0),

          actual_amount: Number(item.amount ?? item.actual_amount ?? 0),

          vat_type: item.vat_type || formData.vat_type,

          vat_rate: Number(item.vat_rate ?? formData.vat_rate ?? 0),

          vat_amount: Number(item.vat_amount || 0),

          amount_after_vat: Number(
            item.amount_after_vat ?? item.amount ?? item.actual_amount ?? 0,
          ),

          is_extra:
            item.is_extra === true ||
            item.is_extra === 1 ||
            item.is_extra === "1" ||
            item.is_extra === "true",

          extra_note: item.extra_note || null,

          sort_order: item.sort_order || index + 1,
        })),
      };

      // ============================================================
      // UPDATE / CREATE
      // ============================================================

      if (
        selectedSettlement?.settlement_id &&
        selectedSettlement?.document_type === "LIQUIDATION"
      ) {
        await APIToken.put(
          `/contracts/${contractId}/documents/${selectedSettlement.settlement_id}`,
          payload,
        );

        showToast("Cập nhật biên bản thanh lý thành công");
      } else {
        await APIToken.post(`/contracts/${contractId}/liquidations`, payload);

        showToast("Tạo biên bản thanh lý thành công");
      }

      setShowLiquidationModal(false);

      setSelectedSettlement(null);

      await getContractDocuments();

      setActiveTab("DOCUMENTS");
    } catch (error) {
      console.error("handleSaveLiquidation error:", error);

      console.error("Backend:", error?.response?.data);

      alert(
        error?.response?.data?.message || "Không thể tạo biên bản thanh lý",
      );
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
  // DOCUMENT STATISTICS
  // ==========================================================

  const settlements = contractDocuments.settlements || [];
  const form08as = contractDocuments.form_08a || [];

  const acceptances = settlements.filter(
    (item) => item.document_type === "ACCEPTANCE",
  );

  const totalAcceptedValue = (contractDocuments.settlements || [])
    .filter(
      (item) =>
        item.document_type === "ACCEPTANCE" && Number(item.status) === 1,
    )
    .reduce((sum, item) => sum + getSettlementDisplayValue(item), 0);
  // ==========================================================
  // TÍNH ĐỢT NGHIỆM THU TIẾP THEO
  // ==========================================================

  const batchNos = (contractDocuments.settlements || [])
    .filter(
      (item) =>
        item.document_type === "ACCEPTANCE" &&
        item.batch_no !== null &&
        item.batch_no !== undefined,
    )
    .map((item) => Number(item.batch_no))
    .filter((item) => !Number.isNaN(item) && item > 0);

  const nextBatchNo = batchNos.length > 0 ? Math.max(...batchNos) + 1 : 1;

  // Cho phép chọn tối thiểu 10 đợt
  const maxBatchOption = Math.max(departures?.length || 0, nextBatchNo, 10);

  const acceptanceBatchOptions = Array.from(
    { length: maxBatchOption },
    (_, index) => index + 1,
  );

  const liquidations = settlements.filter(
    (item) => item.document_type === "LIQUIDATION",
  );

  const acceptanceLiquidations = settlements.filter(
    (item) => item.document_type === "ACCEPTANCE_LIQUIDATION",
  );

  const totalContractDocuments = settlements.length + form08as.length;

  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case "ACCEPTANCE":
        return "Biên bản nghiệm thu";

      case "LIQUIDATION":
        return "Biên bản thanh lý";

      case "ACCEPTANCE_LIQUIDATION":
        return "Nghiệm thu & thanh lý";

      default:
        return type || "-";
    }
  };

  const handleSelectDocumentType = async (type) => {
    setSelectedSettlement(null);

    setSelectedDocumentType(type);

    setShowDocumentModal(false);
    setSelectedDocumentType(type);
    setShowDocumentModal(false);

    if (type === "ACCEPTANCE") {
      const today = new Date().toISOString().substring(0, 10);

      // ==========================================
      // LẤY SỐ BIÊN BẢN TIẾP THEO
      // ==========================================

      const nextDocumentNo = await getNextDocumentNumber("ACCEPTANCE", today);

      const firstDeparture = departures?.[0] || {};

      const lastDeparture = departures?.[departures.length - 1] || {};

      // ==========================================
      // GIÁ TRỊ THỰC TẾ
      // MẶC ĐỊNH COPY TỪ HỢP ĐỒNG
      // ==========================================

      const acceptanceItems = (priceItems || []).map((item, index) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unit_price || 0);

        const amount = Number(item.amount || 0) || quantity * unitPrice;

        return {
          contract_item_id: item.price_id || null,

          item_name: item.item_name || "",

          route_name: "",

          customer_type: "",

          unit: item.unit || "",

          quantity_contract: quantity,

          quantity_actual: quantity,

          unit_price: unitPrice,

          contract_amount: amount,

          /*
           * Với item hợp đồng:
           * giữ nguyên cách hiểu tiền như hợp đồng.
           */
          actual_amount: amount,

          vat_type: formData.vat_type,

          vat_rate:
            formData.vat_type === "NO_VAT" ? 0 : Number(formData.vat_rate || 0),

          vat_amount: 0,

          amount_after_vat: amount,

          is_extra: false,

          extra_note: "",

          sort_order: index + 1,
        };
      });

      setAcceptanceForm({
        acceptance_mode: "FULL",

        // SỐ BIÊN BẢN TỪ BE
        document_no: nextDocumentNo,

        document_date: today,

        batch_no: null,

        service_from_date: firstDeparture.start_date || "",

        service_to_date:
          lastDeparture.end_date || firstDeparture.end_date || "",

        contract_value: Number(contractAmount.totalAmount || 0),

        quality_rating: "Tốt",

        other_comment: "Không",

        note: "",

        created_by: userId,

        has_extra: false,
        items: acceptanceItems,
      });

      setShowAcceptanceModal(true);

      return;
    }

    if (type === "LIQUIDATION") {
      try {
        const today = new Date().toISOString().substring(0, 10);

        // ========================================================
        // LẤY BẢNG TỔNG HỢP TẤT CẢ NGHIỆM THU
        // ========================================================
        const liquidationItems = await buildLiquidationItems();

        // ========================================================
        // KHÔNG CÓ NGHIỆM THU -> KHÔNG CHO TẠO THANH LÝ
        // ========================================================
        if (!liquidationItems.length) {
          alert(
            "Hợp đồng chưa có biên bản nghiệm thu. Vui lòng tạo nghiệm thu trước khi lập biên bản thanh lý.",
          );

          return;
        }

        const nextDocumentNo = await getNextDocumentNumber(
          "LIQUIDATION",
          today,
        );

        const calculated = calculateLiquidationValues(
          liquidationItems,
          formData.vat_type,
          formData.vat_rate,
        );

        const paidAmount = getContractPaidAmount();

        setLiquidationForm({
          document_no: nextDocumentNo,

          document_date: today,

          // Không gắn vào một BBNT cụ thể
          acceptance_settlement_id: null,

          acceptance_document_no: "",

          acceptance_document_date: "",

          // Bảng tổng hợp tất cả nghiệm thu
          items: liquidationItems,

          // VAT theo hợp đồng
          vat_type: formData.vat_type,

          vat_rate: Number(formData.vat_rate || 0),

          subtotal: calculated.subtotal,

          vat_amount: calculated.vat_amount,

          actual_value: calculated.actual_value,

          contract_value: Number(contractAmount.totalAmount || 0),

          paid_amount: paidAmount,

          remaining_amount: calculated.actual_value - paidAmount,

          note: "",

          created_by: userId,
        });

        setShowLiquidationModal(true);

        return;
      } catch (error) {
        console.error("openLiquidation error:", error);

        console.error("Backend:", error?.response?.data);

        alert(
          error?.response?.data?.message ||
            "Không thể tổng hợp dữ liệu nghiệm thu để tạo biên bản thanh lý",
        );

        return;
      }
    }

    if (type === "ACCEPTANCE_LIQUIDATION") {
      setShowAcceptanceLiquidationModal(true);
      return;
    }

    if (type === "FORM_08A") {
      setShowDocumentModal(false);

      form08aRef.current?.openCreate();

      return;
    }
  };

  const handleAcceptanceExtraToggle = (checked) => {
    setAcceptanceForm((prev) => {
      if (!checked) {
        const newItems = (prev.items || [])
          .filter((item) => !item.is_extra)
          .map((item, index) => ({
            ...item,
            sort_order: index + 1,
          }));

        return {
          ...prev,

          has_extra: false,

          items: newItems,
        };
      }

      return {
        ...prev,

        has_extra: true,
      };
    });
  };

  const handleDeleteSettlement = async (settlementId) => {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa hồ sơ này không?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await APIToken.delete(
        `/contracts/${contractId}/documents/${settlementId}`,
      );

      await getContractDocuments();
    } catch (error) {
      console.error("deleteSettlement error:", error);
      console.error("Backend:", error?.response?.data);

      alert(error?.response?.data?.message || "Không thể xóa hồ sơ");
    }
  };

  // ==========================================================
  // EXPORT PDF BIÊN BẢN
  // ==========================================================

  const handleExportSettlementPDF = async (settlementId) => {
    try {
      // ======================================================
      // TÌM BIÊN BẢN ĐỂ LẤY document_no
      // ======================================================

      const allSettlements = [...(contractDocuments?.settlements || [])];

      let settlement = allSettlements.find(
        (item) => Number(item.settlement_id) === Number(settlementId),
      );

      // Nếu đang mở preview/edit thì ưu tiên dữ liệu chi tiết
      if (
        selectedSettlement &&
        Number(selectedSettlement.settlement_id) === Number(settlementId)
      ) {
        settlement = selectedSettlement;
      }

      // ======================================================
      // CALL API
      // ======================================================

      const response = await APIToken.get(
        `/contracts/${contractId}/documents/${settlementId}/export/pdf`,
        {
          responseType: "blob",
        },
      );

      // ======================================================
      // BLOB
      // ======================================================

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      // ======================================================
      // URL
      // ======================================================

      const url = window.URL.createObjectURL(blob);

      // ======================================================
      // FILE NAME = MÃ BIÊN BẢN
      // ======================================================

      const documentNo = settlement?.document_no || `bien-ban-${settlementId}`;

      const fileName = `${String(documentNo)
        .replace(/[\/\\:*?"<>|]/g, "-")
        .replace(/\s+/g, "_")}.pdf`;

      // ======================================================
      // DOWNLOAD
      // ======================================================

      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export settlement PDF error:", error);

      alert("Không thể xuất PDF biên bản");
    }
  };

  // ==========================================================
  // EXPORT WORD BIÊN BẢN
  // ==========================================================

  const handleExportSettlementWord = async (settlementId) => {
    try {
      // ======================================================
      // TÌM BIÊN BẢN ĐỂ LẤY document_no
      // ======================================================

      const allSettlements = [...(contractDocuments?.settlements || [])];

      let settlement = allSettlements.find(
        (item) => Number(item.settlement_id) === Number(settlementId),
      );

      // Nếu đang mở preview/edit thì ưu tiên dữ liệu chi tiết
      if (
        selectedSettlement &&
        Number(selectedSettlement.settlement_id) === Number(settlementId)
      ) {
        settlement = selectedSettlement;
      }

      // ======================================================
      // CALL API
      // ======================================================

      const response = await APIToken.get(
        `/contracts/${contractId}/documents/${settlementId}/export/word`,
        {
          responseType: "blob",
        },
      );

      // ======================================================
      // BLOB
      // ======================================================

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // ======================================================
      // URL
      // ======================================================

      const url = window.URL.createObjectURL(blob);

      // ======================================================
      // FILE NAME = MÃ BIÊN BẢN
      // ======================================================

      const documentNo = settlement?.document_no || `bien-ban-${settlementId}`;

      const fileName = `${String(documentNo)
        .replace(/[\/\\:*?"<>|]/g, "-")
        .replace(/\s+/g, "_")}.docx`;

      // ======================================================
      // DOWNLOAD
      // ======================================================

      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export settlement Word error:", error);

      alert("Không thể xuất Word biên bản");
    }
  };
  // ==========================================================
  // EXPORT PDF MẪU 08A
  // ==========================================================

  const handleExportForm08aPDF = async (form08aId) => {
    try {
      const form08a = (contractDocuments?.form08as || []).find(
        (item) => Number(item.form_08a_id) === Number(form08aId),
      );

      const response = await APIToken.get(
        `/contracts/${contractId}/form-08a/${form08aId}/export/pdf`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const documentNo = form08a?.document_no || `Mau-08A-${form08aId}`;

      const fileName = `${String(documentNo)
        .replace(/[\/\\:*?"<>|]/g, "-")
        .replace(/\s+/g, "_")}.pdf`;

      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export Form 08A PDF error:", error);

      alert("Không thể xuất PDF Mẫu 08A");
    }
  };

  // ==========================================================
  // EXPORT WORD MẪU 08A
  // ==========================================================

  const handleExportForm08aWord = async (form08aId) => {
    try {
      const form08a = (contractDocuments?.form08as || []).find(
        (item) => Number(item.form_08a_id) === Number(form08aId),
      );

      const response = await APIToken.get(
        `/contracts/${contractId}/form-08a/${form08aId}/export/word`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = window.URL.createObjectURL(blob);

      const documentNo = form08a?.document_no || `Mau-08A-${form08aId}`;

      const fileName = `${String(documentNo)
        .replace(/[\/\\:*?"<>|]/g, "-")
        .replace(/\s+/g, "_")}.docx`;

      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export Form 08A Word error:", error);

      alert("Không thể xuất Word Mẫu 08A");
    }
  };

  const handleDeleteForm08a = async (form08aId) => {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa Mẫu 08a này không?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await APIToken.delete(`/contracts/${contractId}/form-08a/${form08aId}`);

      await getContractDocuments();
    } catch (error) {
      console.error("deleteForm08a error:", error);

      alert(error?.response?.data?.message || "Không thể xóa Mẫu 08a");
    }
  };

  const getDocumentTypeClass = (type) => {
    switch (type) {
      case "ACCEPTANCE":
        return "acceptance";

      case "LIQUIDATION":
        return "liquidation";

      case "ACCEPTANCE_LIQUIDATION":
        return "acceptance-liquidation";

      default:
        return "";
    }
  };

  function getSettlementDisplayValue(item) {
    if (!item) return 0;

    /*
     * actual_value trong vn_contract_settlements
     * hiện đã là GIÁ TRỊ CUỐI CÙNG SAU VAT.
     *
     * NO_VAT:
     * actual_value = subtotal
     *
     * INCLUDED:
     * actual_value = tổng giá đã gồm VAT
     *
     * EXCLUDED:
     * actual_value = subtotal + vat_amount
     *
     * Vì vậy không cộng VAT thêm ở FE.
     */
    return Number(item.actual_value || 0);
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
      <div className="cd-tabs">
        <button
          type="button"
          className={`cd-tab ${activeTab === "DETAIL" ? "active" : ""}`}
          onClick={() => setActiveTab("DETAIL")}
        >
          Chi tiết hợp đồng
        </button>

        <button
          type="button"
          className={`cd-tab ${activeTab === "DOCUMENTS" ? "active" : ""}`}
          onClick={() => setActiveTab("DOCUMENTS")}
        >
          Nghiệm thu, thanh lý
          {totalContractDocuments > 0 && (
            <span className="cd-tab-count">{totalContractDocuments}</span>
          )}
        </button>
      </div>
      {/* =====================================================
          MAIN DOCUMENT
      ===================================================== */}
      {activeTab === "DETAIL" && (
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

              <ReadOnlyInput
                label="Tên đơn vị"
                value={formData.customer_name}
              />

              <ReadOnlyInput
                label="Địa chỉ"
                value={formData.customer_address}
              />

              <ReadOnlyInput
                label="Điện thoại"
                value={formData.customer_phone}
              />

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

              <ReadOnlyInput
                label="Ghi chú"
                value={formData.customer_rep_note}
              />
            </div>

            {/* =================================================
              BÊN B
          ================================================= */}

            <div className="contract-party-card">
              <h3>BÊN B – NHÀ THẦU</h3>

              <ReadOnlyInput label="Tên đơn vị" value={formData.company_name} />

              <ReadOnlyInput label="Địa chỉ" value={formData.company_address} />
              <ReadOnlyInput
                label="Liên hệ"
                value={formData.company_contact_address}
              />

              <ReadOnlyInput
                label="Điện thoại"
                value={formData.company_phone}
              />

              <ReadOnlyInput
                label="Mã số thuế"
                value={formData.company_tax_code}
              />

              <ReadOnlyInput
                label="Tài khoản NH"
                value={formData.company_bank_account}
              />

              <ReadOnlyInput
                label="Đại diện"
                value={formData.company_rep_name}
              />

              <ReadOnlyInput
                label="Chức vụ"
                value={formData.company_rep_title}
              />

              <ReadOnlyInput
                label="Ghi chú"
                value={formData.company_rep_note}
              />
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
                      {(priceItems || []).map((item, index) => {
                        const amount =
                          Number(item.quantity || 0) *
                          Number(item.unit_price || 0);

                        return (
                          <tr key={item.price_id || index}>
                            <td>{index + 1}</td>

                            <td>{item.item_name}</td>

                            {/* SỐ LƯỢNG */}
                            <td>
                              {Number(item.quantity || 0).toLocaleString(
                                "vi-VN",
                              )}
                            </td>

                            {/* ĐVT */}
                            <td>{item.unit}</td>

                            {/* ĐƠN GIÁ */}
                            <td className="cd-acceptance-money">
                              {formatCurrency(item.unit_price)}
                            </td>

                            {/* THÀNH TIỀN */}
                            <td className="cd-acceptance-money">
                              {formatCurrency(amount)}
                            </td>
                          </tr>
                        );
                      })}

                      {/* =====================================================
      EXCLUDED - ĐƠN GIÁ CHƯA BAO GỒM VAT
  ===================================================== */}
                      {formData.vat_type === "EXCLUDED" && (
                        <>
                          <tr className="contract-total-row">
                            <td colSpan={5}>Tổng tiền trước VAT</td>

                            <td className="cd-acceptance-money">
                              {formatCurrency(contractAmount.lineTotal)}
                            </td>
                          </tr>

                          <tr className="contract-total-row">
                            <td colSpan={5}>
                              Thuế GTGT ({Number(formData.vat_rate || 0)}%)
                            </td>

                            <td className="cd-acceptance-money">
                              {formatCurrency(contractAmount.vatAmount)}
                            </td>
                          </tr>

                          <tr className="contract-total-row">
                            <td colSpan={5}>Tổng cộng sau VAT</td>

                            <td className="cd-acceptance-money">
                              {formatCurrency(contractAmount.totalAmount)}
                            </td>
                          </tr>
                        </>
                      )}

                      {/* =====================================================
      INCLUDED - ĐƠN GIÁ ĐÃ BAO GỒM VAT
  ===================================================== */}
                      {formData.vat_type === "INCLUDED" && (
                        <tr className="contract-total-row">
                          <td colSpan={5}>Tổng cộng (Đã bao gồm VAT)</td>

                          <td>{formatCurrency(contractAmount.totalAmount)}</td>
                        </tr>
                      )}

                      {/* =====================================================
      NO VAT - KHÔNG TÍNH VAT
  ===================================================== */}
                      {formData.vat_type === "NO_VAT" && (
                        <tr className="contract-total-row">
                          <td colSpan={5}>Tổng giá trị hợp đồng</td>

                          <td>{formatCurrency(contractAmount.totalAmount)}</td>
                        </tr>
                      )}
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
      )}

      {/* =====================================================
    HỒ SƠ HỢP ĐỒNG
===================================================== */}

      {activeTab === "DOCUMENTS" && (
        <section className="cd-documents-section">
          <div className="cd-documents-header">
            <div>
              <div className="cd-documents-title">
                <BsFolder2Open />
                <div>
                  <h3>Hồ sơ nghiệm thu, thanh lý</h3>

                  <p>
                    Theo dõi nghiệm thu, thanh lý và các hồ sơ liên quan của hợp
                    đồng này
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="cd-document-create-btn"
              onClick={() => setShowDocumentModal(true)}
            >
              <BsPlusLg />
              Tạo hồ sơ
            </Button>
          </div>

          {/* SUMMARY */}

          <div className="cd-document-summary">
            <div className="cd-document-summary-card">
              <div className="cd-document-summary-icon acceptance">
                <BsCheck2Circle />
              </div>

              <div>
                <span>Biên bản nghiệm thu</span>
                <strong>{acceptances.length}</strong>
              </div>
            </div>

            <div className="cd-document-summary-card">
              <div className="cd-document-summary-icon liquidation">
                <BsFileEarmarkText />
              </div>

              <div>
                <span>Biên bản thanh lý</span>
                <strong>{liquidations.length}</strong>
              </div>
            </div>

            <div className="cd-document-summary-card">
              <div className="cd-document-summary-icon combined">
                <BsFileEarmarkText />
              </div>

              <div>
                <span>NT & Thanh lý</span>
                <strong>{acceptanceLiquidations.length}</strong>
              </div>
            </div>

            <div className="cd-document-summary-card">
              <div className="cd-document-summary-icon form08a">
                <BsReceipt />
              </div>

              <div>
                <span>Mẫu 08a</span>
                <strong>{form08as.length}</strong>
              </div>
            </div>
          </div>

          {/* DANH SÁCH */}

          <div className="cd-document-list-card">
            <div className="cd-document-list-header">
              <div>
                <strong>Danh sách hồ sơ</strong>

                <span>{totalContractDocuments} hồ sơ</span>
              </div>
            </div>

            {documentsLoading ? (
              <div className="cd-document-loading">
                <Spinner animation="border" size="sm" />
                <span>Đang tải hồ sơ...</span>
              </div>
            ) : totalContractDocuments === 0 ? (
              <div className="cd-document-empty">
                <BsFolder2Open />

                <strong>Chưa có hồ sơ</strong>

                <p>
                  Hợp đồng này chưa tạo biên bản nghiệm thu, thanh lý hoặc Mẫu
                  08a.
                </p>

                <Button onClick={() => setShowDocumentModal(true)}>
                  <BsPlusLg />
                  Tạo hồ sơ đầu tiên
                </Button>
              </div>
            ) : (
              <div className="cd-document-table-wrapper">
                <table className="cd-document-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Loại hồ sơ</th>
                      <th>Số hồ sơ</th>
                      <th>Ngày lập</th>
                      <th>Đợt</th>
                      <th>Giá trị</th>
                      <th>Người tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {settlements.map((item, index) => (
                      <tr key={`settlement-${item.settlement_id}`}>
                        <td>{index + 1}</td>

                        <td>
                          <span
                            className={`cd-document-type ${getDocumentTypeClass(
                              item.document_type,
                            )}`}
                          >
                            {getDocumentTypeLabel(item.document_type)}
                          </span>
                        </td>

                        <td>{item.document_no || "-"}</td>

                        <td>{formatContractDate(item.document_date) || "-"}</td>

                        <td>
                          {item.batch_no
                            ? `Đợt ${String(item.batch_no).padStart(2, "0")}`
                            : "-"}
                        </td>

                        <td className="cd-document-money">
                          {formatCurrency(getSettlementDisplayValue(item))} đ
                        </td>
                        <td>{item.created_by + " - " + item.fullname}</td>

                        <td>
                          <div className="cd-document-actions">
                            <button
                              type="button"
                              className="cd-doc-action view"
                              title="Xem"
                              onClick={() =>
                                handleViewSettlement(item.settlement_id)
                              }
                            >
                              <BsEye />
                            </button>

                            {item.document_type === "LIQUIDATION" && (
                              <button
                                type="button"
                                className="cd-doc-action edit"
                                title="Sửa"
                                onClick={() =>
                                  handleEditLiquidation(item.settlement_id)
                                }
                              >
                                <BsPencil />
                              </button>
                            )}
                            {item.document_type === "ACCEPTANCE" && (
                              <button
                                type="button"
                                className="cd-doc-action edit"
                                title="Sửa"
                                onClick={() =>
                                  handleEditAcceptance(item.settlement_id)
                                }
                              >
                                <BsPencil />
                              </button>
                            )}

                            <button
                              type="button"
                              className="cd-doc-action pdf"
                              title="Xuất PDF"
                              onClick={() =>
                                handleExportSettlementPDF(item.settlement_id)
                              }
                            >
                              <BsFileEarmarkPdf />
                            </button>
                            <button
                              type="button"
                              className="cd-doc-action word"
                              title="Xuất Word"
                              onClick={() =>
                                handleExportSettlementWord(item.settlement_id)
                              }
                            >
                              <BsFileEarmarkWord />
                            </button>

                            <button
                              type="button"
                              className="cd-doc-action delete"
                              title="Xóa"
                              onClick={() =>
                                handleDeleteSettlement(item.settlement_id)
                              }
                            >
                              <BsTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {form08as.map((item, index) => (
                      <tr key={`08a-${item.form_08a_id}`}>
                        <td>{settlements.length + index + 1}</td>

                        <td>
                          <span className="cd-document-type form08a">
                            Mẫu 08a
                          </span>
                        </td>

                        <td>{item.document_no || "-"}</td>

                        <td>{formatContractDate(item.document_date) || "-"}</td>

                        <td>-</td>

                        <td className="cd-document-money">
                          {formatCurrency(item.current_requested_payment)} đ
                        </td>
                        <td>{item.created_by + " - " + item.fullname}</td>
                        <td>
                          <div className="cd-document-actions">
                            <button
                              type="button"
                              className="cd-doc-action view"
                              onClick={() =>
                                form08aRef.current?.openPreview(
                                  item.form_08a_id,
                                )
                              }
                            >
                              <BsEye />
                            </button>

                            <button
                              type="button"
                              className="cd-doc-action edit"
                              onClick={() =>
                                form08aRef.current?.openEdit(item.form_08a_id)
                              }
                            >
                              <BsPencil />
                            </button>

                            <button
                              type="button"
                              className="cd-doc-action pdf"
                              title="Xuất PDF"
                              onClick={() =>
                                handleExportForm08aPDF(item.form_08a_id)
                              }
                            >
                              <BsFileEarmarkPdf />
                            </button>

                            <button
                              type="button"
                              className="cd-doc-action word"
                              title="Xuất Word"
                              onClick={() =>
                                handleExportForm08aWord(item.form_08a_id)
                              }
                            >
                              <BsFileEarmarkWord />
                            </button>

                            <button
                              type="button"
                              className="cd-doc-action delete"
                              onClick={() =>
                                handleDeleteForm08a(item.form_08a_id)
                              }
                            >
                              <BsTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
      {/* =====================================================
    MODAL CHỌN LOẠI HỒ SƠ
===================================================== */}

      <Modal
        show={showDocumentModal}
        onHide={() => setShowDocumentModal(false)}
        centered
        dialogClassName="cd-create-document-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Tạo hồ sơ hợp đồng</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="cd-create-document-description">
            Chọn loại hồ sơ cần tạo cho hợp đồng{" "}
            <strong>{formData.contract_code}</strong>
          </p>

          <div className="cd-create-document-options">
            <button
              type="button"
              className="cd-create-document-option"
              onClick={() => handleSelectDocumentType("ACCEPTANCE")}
            >
              <div className="cd-create-option-icon acceptance">
                <BsCheck2Circle />
              </div>

              <div>
                <strong>Biên bản nghiệm thu</strong>

                <span>Nghiệm thu khối lượng thực tế theo từng đợt</span>
              </div>
            </button>

            <button
              type="button"
              className="cd-create-document-option"
              onClick={() => handleSelectDocumentType("LIQUIDATION")}
            >
              <div className="cd-create-option-icon liquidation">
                <BsFileEarmarkText />
              </div>

              <div>
                <strong>Biên bản thanh lý</strong>

                <span>Thanh lý hợp đồng sau khi hoàn thành</span>
              </div>
            </button>

            <button
              type="button"
              className="cd-create-document-option"
              onClick={() => handleSelectDocumentType("ACCEPTANCE_LIQUIDATION")}
            >
              <div className="cd-create-option-icon combined">
                <BsFileEarmarkText />
              </div>

              <div>
                <strong>Biên bản nghiệm thu & thanh lý</strong>

                <span>Gộp nghiệm thu và thanh lý trong một hồ sơ</span>
              </div>
            </button>

            <button
              type="button"
              className="cd-create-document-option"
              onClick={() => handleSelectDocumentType("FORM_08A")}
            >
              <div className="cd-create-option-icon form08a">
                <BsReceipt />
              </div>

              <div>
                <strong>Mẫu số 08a</strong>

                <span>
                  Bảng xác định giá trị khối lượng công việc hoàn thành
                </span>
              </div>
            </button>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDocumentModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

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

      <Modal
        show={showAcceptanceModal}
        onHide={() => setShowAcceptanceModal(false)}
        centered
        size="xl"
        dialogClassName="cd-document-form-modal"
      >
        <Modal.Title>
          {selectedSettlement?.settlement_id
            ? "Chỉnh sửa biên bản nghiệm thu"
            : "Tạo biên bản nghiệm thu"}
        </Modal.Title>

        <Modal.Body>
          <div className="cd-form-section">
            <div className="cd-form-section-title">Thông tin biên bản</div>

            <div className="cd-form-grid">
              <div className="cd-form-group">
                <label>Số biên bản</label>

                <input
                  type="text"
                  className="form-control"
                  value={acceptanceForm.document_no || ""}
                  readOnly
                />
              </div>

              <div className="cd-form-group">
                <label>Ngày nghiệm thu</label>

                <input
                  type="date"
                  className="form-control"
                  value={acceptanceForm.document_date}
                  onChange={async (e) => {
                    const documentDate = e.target.value;

                    const nextDocumentNo = await getNextDocumentNumber(
                      "ACCEPTANCE",
                      documentDate,
                    );

                    setAcceptanceForm((prev) => ({
                      ...prev,

                      document_date: documentDate,

                      document_no: nextDocumentNo,
                    }));
                  }}
                />
              </div>

              {/* HÌNH THỨC NGHIỆM THU */}
              <div className="cd-form-group">
                <label>Hình thức nghiệm thu</label>

                <select
                  className="form-select"
                  value={acceptanceForm.acceptance_mode}
                  onChange={(e) => {
                    const mode = e.target.value;

                    const firstDeparture = departures?.[0] || {};

                    const lastDeparture =
                      departures?.[departures.length - 1] || {};

                    if (mode === "FULL") {
                      setAcceptanceForm({
                        ...acceptanceForm,

                        acceptance_mode: "FULL",
                        batch_no: null,

                        service_from_date: firstDeparture.start_date || "",

                        service_to_date:
                          lastDeparture.end_date ||
                          firstDeparture.end_date ||
                          "",
                      });
                    } else {
                      const departure = departures?.[nextBatchNo - 1] || {};

                      setAcceptanceForm((prev) => ({
                        ...prev,

                        acceptance_mode: "BATCH",
                        batch_no: nextBatchNo,

                        service_from_date: departure.start_date || "",

                        service_to_date: departure.end_date || "",
                      }));
                    }
                  }}
                >
                  <option value="FULL">Nghiệm thu toàn bộ hợp đồng</option>

                  <option value="BATCH">Nghiệm thu theo đợt</option>
                </select>
              </div>

              {/* CHỈ HIỆN KHI NGHIỆM THU THEO ĐỢT */}
              {acceptanceForm.acceptance_mode === "BATCH" && (
                <div className="cd-form-group">
                  <label>Đợt nghiệm thu</label>

                  <select
                    className="form-select"
                    value={acceptanceForm.batch_no ?? nextBatchNo}
                    onChange={(e) => {
                      const batch = Number(e.target.value);

                      // Nếu hợp đồng có thông tin thời gian tương ứng
                      // thì tự lấy. Không có thì vẫn cho chọn đợt.
                      const departure = departures?.[batch - 1];

                      setAcceptanceForm((prev) => ({
                        ...prev,

                        batch_no: batch,

                        service_from_date:
                          departure?.start_date || prev.service_from_date,

                        service_to_date:
                          departure?.end_date || prev.service_to_date,
                      }));
                    }}
                  >
                    {acceptanceBatchOptions.map((batchNo) => (
                      <option key={batchNo} value={batchNo}>
                        Đợt {String(batchNo).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="cd-form-group">
                <label>Giá trị hợp đồng</label>

                <input
                  className="form-control"
                  value={`${formatCurrency(acceptanceForm.contract_value)} đ`}
                  readOnly
                />
              </div>

              <div className="cd-form-group">
                <label>Từ ngày</label>

                <input
                  type="date"
                  className="form-control"
                  value={acceptanceForm.service_from_date}
                  onChange={(e) =>
                    setAcceptanceForm({
                      ...acceptanceForm,
                      service_from_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="cd-form-group">
                <label>Đến ngày</label>

                <input
                  type="date"
                  className="form-control"
                  value={acceptanceForm.service_to_date}
                  onChange={(e) =>
                    setAcceptanceForm({
                      ...acceptanceForm,
                      service_to_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="cd-extra-toggle-card">
                <div className="cd-extra-toggle-content">
                  <div className="cd-extra-toggle-icon">
                    <BsPlusLg />
                  </div>

                  <div>
                    <div className="cd-extra-toggle-title">
                      Phát sinh ngoài hợp đồng
                    </div>

                    <div className="cd-extra-toggle-description">
                      Bật nếu thực tế có thêm hạng mục, dịch vụ hoặc chi phí
                      phát sinh.
                    </div>
                  </div>
                </div>

                <label className="cd-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(acceptanceForm.has_extra)}
                    onChange={(e) =>
                      handleAcceptanceExtraToggle(e.target.checked)
                    }
                  />

                  <span className="cd-switch-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="cd-form-section">
            <div className="cd-form-section-title">
              1. Giá trị theo hợp đồng
            </div>

            <div className="table-responsive">
              <table className="cd-acceptance-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Nội dung</th>
                    <th>ĐVT</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>

                <tbody>
                  {priceItems.map((item, index) => (
                    <tr key={item.price_id || index}>
                      <td>{index + 1}</td>

                      <td>{item.item_name}</td>

                      <td>{item.unit}</td>

                      <td>
                        {Number(item.quantity || 0).toLocaleString("vi-VN")}
                      </td>

                      <td className="cd-acceptance-money">
                        {formatCurrency(item.unit_price)}
                      </td>

                      <td className="cd-acceptance-money">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}

                  {/* =============================
    EXCLUDED - CHƯA VAT
============================= */}

                  {formData.vat_type === "EXCLUDED" && (
                    <>
                      <tr className="cd-acceptance-total-row">
                        <td colSpan={3}></td>

                        <td colSpan={2} className="cd-liquidation-total-label">
                          Cộng tiền dịch vụ chưa VAT
                        </td>

                        <td>
                          {formatCurrency(
                            contractAcceptanceValues.serviceTotal,
                          )}{" "}
                          đ
                        </td>
                      </tr>

                      <tr className="cd-acceptance-total-row">
                        <td colSpan={3}></td>

                        <td colSpan={2} className="cd-liquidation-total-label">
                          Thuế GTGT ({formData.vat_rate}%)
                        </td>

                        <td>
                          {formatCurrency(contractAcceptanceValues.vatAmount)} đ
                        </td>
                      </tr>

                      <tr className="cd-acceptance-total-row">
                        <td colSpan={3}></td>

                        <td colSpan={2} className="cd-liquidation-total-label">
                          Tổng giá trị sau VAT
                        </td>

                        <td>
                          {formatCurrency(contractAcceptanceValues.totalAmount)}{" "}
                          đ
                        </td>
                      </tr>
                    </>
                  )}

                  {/* =============================
    INCLUDED - ĐÃ CÓ VAT
============================= */}

                  {formData.vat_type === "INCLUDED" && (
                    <tr className="cd-acceptance-total-row">
                      <td colSpan={3}></td>

                      <td colSpan={2} className="cd-liquidation-total-label">
                        Tổng giá trị hợp đồng
                      </td>

                      <td>
                        {formatCurrency(contractAcceptanceValues.totalAmount)} đ
                      </td>
                    </tr>
                  )}

                  {/* =============================
    NO VAT
============================= */}

                  {formData.vat_type === "NO_VAT" && (
                    <tr className="cd-acceptance-total-row">
                      <td colSpan={3}></td>

                      <td colSpan={2} className="cd-liquidation-total-label">
                        Tổng giá trị hợp đồng
                      </td>

                      <td>
                        {formatCurrency(contractAcceptanceValues.totalAmount)} đ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cd-amount-words-box">
              <strong>Bằng chữ:</strong>{" "}
              {numberToVietnamese(contractAcceptanceValues.totalAmount)}
            </div>
          </div>

          <div className="cd-form-section">
            <div className="cd-form-section-title">2. Giá trị thực tế</div>

            <div className="table-responsive">
              <table className="cd-acceptance-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Nội dung</th>
                    <th>ĐVT</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {(acceptanceForm.items || []).map((item, index) => {
                    const calculated = calculateSettlementItemValues(
                      item,
                      formData.vat_type,
                      formData.vat_rate,
                      "quantity_actual",
                    );

                    return (
                      <React.Fragment key={item.settlement_item_id || index}>
                        <tr
                          className={
                            item.is_extra ? "cd-acceptance-extra-row" : ""
                          }
                        >
                          <td>{index + 1}</td>

                          {/* NỘI DUNG */}
                          <td>
                            {item.is_extra ? (
                              <>
                                <div className="cd-extra-badge mb-1">
                                  Phát sinh
                                </div>

                                <input
                                  type="text"
                                  className="form-control"
                                  value={item.item_name || ""}
                                  placeholder="Nhập nội dung phát sinh..."
                                  onChange={(e) =>
                                    handleAcceptanceItemChange(
                                      index,
                                      "item_name",
                                      e.target.value,
                                    )
                                  }
                                />
                              </>
                            ) : (
                              item.item_name || ""
                            )}
                          </td>

                          {/* ĐVT */}
                          <td>
                            {item.is_extra ? (
                              <input
                                type="text"
                                className="form-control"
                                value={item.unit || ""}
                                placeholder="ĐVT"
                                onChange={(e) =>
                                  handleAcceptanceItemChange(
                                    index,
                                    "unit",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              item.unit || ""
                            )}
                          </td>

                          {/* SL */}
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="form-control"
                              value={item.quantity_actual ?? 0}
                              onChange={(e) =>
                                handleAcceptanceItemChange(
                                  index,
                                  "quantity_actual",
                                  e.target.value,
                                )
                              }
                            />
                          </td>

                          {/* ĐƠN GIÁ */}
                          <td>
                            {item.is_extra ? (
                              <input
                                type="number"
                                min="0"
                                className="form-control"
                                value={item.unit_price ?? 0}
                                onChange={(e) =>
                                  handleAcceptanceItemChange(
                                    index,
                                    "unit_price",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              formatCurrency(item.unit_price)
                            )}
                          </td>

                          {/* THÀNH TIỀN */}
                          <td className="cd-acceptance-money">
                            {formatCurrency(calculated.amountAfterVat)} đ
                          </td>

                          {/* XÓA */}
                          <td>
                            {item.is_extra && (
                              <button
                                type="button"
                                className="cd-remove-extra-btn"
                                onClick={() =>
                                  handleRemoveAcceptanceExtraItem(index)
                                }
                              >
                                <BsTrash />
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* ==========================================
                  CHỈ PHÁT SINH MỚI CÓ DÒNG THIẾT LẬP VAT
              ========================================== */}

                        {item.is_extra && (
                          <tr className="cd-extra-config-row">
                            <td></td>

                            <td colSpan={6}>
                              <div className="cd-extra-config">
                                <div>
                                  <strong>Hình thức giá:</strong>{" "}
                                  {formData.vat_type === "EXCLUDED"
                                    ? "Đơn giá chưa bao gồm VAT"
                                    : formData.vat_type === "INCLUDED"
                                      ? "Đơn giá đã bao gồm VAT"
                                      : "Không tính VAT"}
                                </div>

                                {formData.vat_type !== "NO_VAT" && (
                                  <div className="cd-extra-vat-rate">
                                    <label>Thuế suất VAT</label>

                                    <select
                                      className="form-select"
                                      value={Number(item.vat_rate || 0)}
                                      onChange={(e) =>
                                        handleAcceptanceItemChange(
                                          index,
                                          "vat_rate",
                                          Number(e.target.value),
                                        )
                                      }
                                    >
                                      <option value={0}>0%</option>
                                      <option value={8}>8%</option>
                                      <option value={10}>10%</option>
                                    </select>
                                  </div>
                                )}

                                <div>
                                  <strong>
                                    {formData.vat_type === "INCLUDED"
                                      ? "Đơn giá đã bao gồm VAT"
                                      : formData.vat_type === "EXCLUDED"
                                        ? `VAT ${Number(item.vat_rate || 0)}% cộng thêm`
                                        : "Không VAT"}
                                  </strong>
                                </div>
                              </div>

                              <input
                                type="text"
                                className="form-control cd-extra-note-input"
                                value={item.extra_note || ""}
                                placeholder="Ghi chú phát sinh (nếu có)"
                                onChange={(e) =>
                                  handleAcceptanceItemChange(
                                    index,
                                    "extra_note",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* CHỈ HIỆN NÚT KHI ĐÃ TICK */}
            {acceptanceForm.has_extra && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAddAcceptanceExtraItem}
                >
                  <BsPlusLg /> Thêm hạng mục phát sinh
                </Button>
              </div>
            )}
          </div>

          <div className="cd-form-section">
            <div className="cd-form-section-title">3. Đánh giá chất lượng</div>

            <div className="cd-form-group">
              <select
                className="form-select"
                value={acceptanceForm.quality_rating}
                onChange={(e) =>
                  setAcceptanceForm((prev) => ({
                    ...prev,
                    quality_rating: e.target.value,
                  }))
                }
              >
                <option value="Tốt">Tốt</option>
                <option value="Khá">Khá</option>
                <option value="Đạt">Đạt</option>
                <option value="Không đạt">Không đạt</option>
              </select>
            </div>
          </div>
          <div className="cd-form-section">
            <div className="cd-form-section-title">4. Ý kiến khác</div>

            <div className="cd-form-group">
              <textarea
                rows={3}
                className="form-control"
                value={acceptanceForm.other_comment}
                onChange={(e) =>
                  setAcceptanceForm((prev) => ({
                    ...prev,
                    other_comment: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAcceptanceModal(false)}
          >
            Đóng
          </Button>

          <Button variant="primary" onClick={handleSaveAcceptance}>
            {selectedSettlement?.settlement_id
              ? "Cập nhật biên bản"
              : "Lưu biên bản nghiệm thu"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showSettlementPreview}
        onHide={() => setShowSettlementPreview(false)}
        size="xl"
        centered
        dialogClassName="cd-document-preview-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedSettlement?.document_type === "ACCEPTANCE" &&
              "Biên bản nghiệm thu"}

            {selectedSettlement?.document_type === "LIQUIDATION" &&
              "Biên bản thanh lý"}

            {selectedSettlement?.document_type === "ACCEPTANCE_LIQUIDATION" &&
              "Biên bản nghiệm thu và thanh lý"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {settlementLoading ? (
            <div className="cd-document-loading">
              <Spinner animation="border" />
            </div>
          ) : (
            selectedSettlement && (
              <SettlementPreview
                settlement={selectedSettlement}
                formData={formData}
                contract={contract}
                priceItems={priceItems}
                contractAmount={contractAmount}
                acceptanceList={(contractDocuments.settlements || []).filter(
                  (item) =>
                    item.document_type === "ACCEPTANCE" &&
                    Number(item.status) === 1,
                )}
              />
            )
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowSettlementPreview(false)}
          >
            Đóng
          </Button>

          <Button
            variant="outline-success"
            // onClick={() =>
            //   handleExportSettlementPDF(selectedSettlement?.settlement_id)
            // }
          >
            <BsFileEarmarkPdf />
            Xuất PDF
          </Button>

          <Button
            variant="primary"
            // onClick={() =>
            //   handleExportSettlementWord(selectedSettlement?.settlement_id)
            // }
          >
            <BsFileEarmarkWord />
            Xuất Word
          </Button>
        </Modal.Footer>
      </Modal>
      {/* =====================================================
    MODAL TẠO BIÊN BẢN THANH LÝ
===================================================== */}
      <Modal
        show={showLiquidationModal}
        onHide={() => {
          setShowLiquidationModal(false);
          setSelectedSettlement(null);
        }}
        centered
        size="xl"
        dialogClassName="cd-document-form-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedSettlement?.document_type === "LIQUIDATION"
              ? "Chỉnh sửa biên bản thanh lý hợp đồng"
              : "Tạo biên bản thanh lý hợp đồng"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* =====================================================
        THÔNG TIN BIÊN BẢN
    ===================================================== */}

          <div className="cd-form-section">
            <div className="cd-form-section-title">Thông tin biên bản</div>

            <div className="cd-form-grid">
              <div className="cd-form-group">
                <label>Số biên bản thanh lý</label>

                <input
                  type="text"
                  className="form-control"
                  value={liquidationForm.document_no || ""}
                  readOnly
                />
              </div>

              <div className="cd-form-group">
                <label>Ngày thanh lý</label>

                <input
                  type="date"
                  className="form-control"
                  value={liquidationForm.document_date || ""}
                  onChange={async (e) => {
                    const documentDate = e.target.value;

                    const nextDocumentNo = await getNextDocumentNumber(
                      "LIQUIDATION",
                      documentDate,
                    );

                    setLiquidationForm((prev) => ({
                      ...prev,

                      document_date: documentDate,

                      document_no: nextDocumentNo,
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* =====================================================
        ĐIỀU 1 - BẢNG CHI TIẾT
    ===================================================== */}

          <div className="cd-form-section">
            <div className="cd-form-section-title">
              ĐIỀU 1. HÀNG HÓA / NỘI DUNG CÔNG VIỆC
            </div>

            <p className="cd-form-help-text">
              Giá trị mặc định lấy theo khối lượng đã nghiệm thu. Có thể điều
              chỉnh trước khi lập biên bản thanh lý.
            </p>

            <div className="table-responsive">
              <table className="cd-acceptance-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Nội dung công việc</th>
                    <th>Số lượng</th>
                    <th>Đơn vị tính</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>

                <tbody>
                  {(liquidationForm.items || []).map((item, index) => {
                    const amount =
                      Number(item.quantity || 0) * Number(item.unit_price || 0);

                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>

                        <td>
                          <textarea
                            rows={2}
                            className="form-control cd-liquidation-item-name"
                            value={item.item_name || ""}
                            onChange={(e) =>
                              handleLiquidationItemChange(
                                index,
                                "item_name",
                                e.target.value,
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            className="form-control"
                            value={item.quantity ?? 0}
                            onChange={(e) =>
                              handleLiquidationItemChange(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={item.unit || ""}
                            onChange={(e) =>
                              handleLiquidationItemChange(
                                index,
                                "unit",
                                e.target.value,
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            className="form-control"
                            value={item.unit_price ?? 0}
                            onChange={(e) =>
                              handleLiquidationItemChange(
                                index,
                                "unit_price",
                                e.target.value,
                              )
                            }
                          />
                        </td>

                        <td className="cd-acceptance-money">
                          {formatCurrency(amount)} đ
                        </td>
                      </tr>
                    );
                  })}

                  {/* =============================================
    VAT TYPE = EXCLUDED
    GIÁ CHƯA BAO GỒM VAT
============================================= */}

                  {liquidationForm.vat_type === "EXCLUDED" && (
                    <>
                      <tr className="cd-acceptance-total-row">
                        <td colSpan={3}></td>

                        <td colSpan={2} className="cd-liquidation-total-label">
                          Tổng tiền trước VAT
                        </td>

                        <td className="cd-acceptance-money">
                          {formatCurrency(liquidationForm.subtotal)} đ
                        </td>
                      </tr>

                      <tr className="cd-acceptance-total-row">
                        <td colSpan={3}></td>

                        <td colSpan={2} className="cd-liquidation-total-label">
                          Thuế GTGT ({liquidationForm.vat_rate}%)
                        </td>

                        <td className="cd-acceptance-money">
                          {formatCurrency(liquidationForm.vat_amount)} đ
                        </td>
                      </tr>

                      <tr className="cd-acceptance-total-row">
                        <td colSpan={3}></td>

                        <td colSpan={2} className="cd-liquidation-total-label">
                          Tổng giá trị quyết toán sau VAT
                        </td>

                        <td className="cd-acceptance-money">
                          {formatCurrency(liquidationForm.actual_value)} đ
                        </td>
                      </tr>
                    </>
                  )}

                  {liquidationForm.vat_type === "INCLUDED" && (
                    <tr className="cd-acceptance-total-row">
                      <td colSpan={3}></td>

                      <td colSpan={2} className="cd-liquidation-total-label">
                        Tổng giá trị quyết toán
                        <div className="cd-total-vat-note">
                          (Đã bao gồm VAT)
                        </div>
                      </td>

                      <td className="cd-acceptance-money">
                        {formatCurrency(liquidationForm.actual_value)} đ
                      </td>
                    </tr>
                  )}

                  {liquidationForm.vat_type === "NO_VAT" && (
                    <tr className="cd-acceptance-total-row">
                      <td colSpan={3}></td>

                      <td colSpan={2} className="cd-liquidation-total-label">
                        Tổng giá trị quyết toán
                      </td>

                      <td className="cd-acceptance-money">
                        {formatCurrency(liquidationForm.actual_value)} đ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cd-amount-words-box">
              <strong>Bằng chữ:</strong>{" "}
              {numberToVietnamese(Number(liquidationForm.actual_value || 0))}
            </div>
          </div>

          {/* =====================================================
        ĐIỀU 2 - GIÁ TRỊ THANH TOÁN
    ===================================================== */}

          <div className="cd-form-section">
            <div className="cd-form-section-title">
              ĐIỀU 2. GIÁ TRỊ THANH TOÁN THEO THỰC TẾ VÀ CÁC ĐIỀU KHOẢN KHÁC
            </div>

            <div className="cd-liquidation-payment-table">
              <div className="cd-liquidation-payment-row">
                <span>Tổng trị giá hợp đồng</span>

                <strong>
                  {formatCurrency(liquidationForm.contract_value)} VNĐ
                </strong>
              </div>

              <div className="cd-liquidation-payment-row">
                <span>Tổng trị quyết toán</span>

                <strong>
                  {formatCurrency(liquidationForm.actual_value)} VNĐ
                </strong>
              </div>

              <div className="cd-liquidation-payment-row">
                <span>Bên A đã thanh toán cho Bên B</span>

                <div className="cd-liquidation-inline-money">
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={liquidationForm.paid_amount}
                    onChange={(e) => {
                      const paidAmount = Number(e.target.value || 0);

                      setLiquidationForm((prev) => ({
                        ...prev,

                        paid_amount: paidAmount,

                        remaining_amount:
                          Number(prev.actual_value || 0) - paidAmount,
                      }));
                    }}
                  />

                  <span>VNĐ</span>
                </div>
              </div>

              <div className="cd-liquidation-payment-row remaining">
                <span>Số tiền Bên A còn phải thanh toán</span>

                <strong>
                  {formatCurrency(liquidationForm.remaining_amount)} VNĐ
                </strong>
              </div>
            </div>

            <div className="cd-liquidation-words">
              <p>
                <strong>Tổng trị giá hợp đồng bằng chữ:</strong>{" "}
                {numberToVietnamese(liquidationForm.contract_value)}
              </p>

              <p>
                <strong>Tổng trị quyết toán bằng chữ:</strong>{" "}
                {numberToVietnamese(liquidationForm.actual_value)}
              </p>

              <p>
                <strong>Đã thanh toán bằng chữ:</strong>{" "}
                {numberToVietnamese(liquidationForm.paid_amount)}
              </p>

              <p>
                <strong>Còn phải thanh toán bằng chữ:</strong>{" "}
                {numberToVietnamese(liquidationForm.remaining_amount)}
              </p>
            </div>
          </div>

          <div className="cd-form-section">
            <div className="cd-form-section-title">Nội dung khác</div>

            <textarea
              rows={4}
              className="form-control"
              value={liquidationForm.note || ""}
              onChange={(e) =>
                setLiquidationForm((prev) => ({
                  ...prev,
                  note: e.target.value,
                }))
              }
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowLiquidationModal(false);
              setSelectedSettlement(null);
            }}
          >
            Đóng
          </Button>

          <Button variant="primary" onClick={handleSaveLiquidation}>
            {selectedSettlement?.document_type === "LIQUIDATION"
              ? "Lưu thay đổi"
              : "Tạo biên bản thanh lý"}
          </Button>
        </Modal.Footer>
      </Modal>

      <ContractForm08a
        ref={form08aRef}
        contractId={contractId}
        contract={contract}
        formData={formData}
        settlements={contractDocuments.settlements || []}
        form08as={contractDocuments.form_08a || []}
        payments={contractDocuments.payments || []}
        contractValue={contractAmount.totalAmount}
        onChanged={getContractDocuments}
        showToast={showToast}
      />

      <ToastContainer
        position="top-end"
        className="p-3"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 99999,
        }}
      >
        <Toast
          show={toast.show}
          onClose={() =>
            setToast((prev) => ({
              ...prev,
              show: false,
            }))
          }
          delay={3000}
          autohide
        >
          <Toast.Body className="cd-toast-body">
            <BsCheck2Circle />

            <span>{toast.message}</span>
          </Toast.Body>
        </Toast>
      </ToastContainer>
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
          {formData.company_contact_address && (
            <PreviewInfoRow
              label="Liên hệ"
              value={formData.company_contact_address}
            />
          )}

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
                      Thuế GTGT ({Number(formData.vat_rate || 0)}
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

const SettlementActualValueTable = ({ items = [], formData }) => {
  const normalizeBoolean = (value) =>
    value === true || value === 1 || value === "1" || value === "true";

  // ============================================================
  // TÁCH HẠNG MỤC
  // ============================================================

  const contractItems = items.filter(
    (item) => !normalizeBoolean(item.is_extra),
  );

  const extraItems = items.filter((item) => normalizeBoolean(item.is_extra));

  const hasExtra = extraItems.length > 0;

  // ============================================================
  // RULE CỘT VAT
  // Chỉ hiện khi có phát sinh + hợp đồng có VAT
  // ============================================================

  const showVatColumn = hasExtra && formData.vat_type !== "NO_VAT";

  const tableColumnCount = showVatColumn ? 7 : 6;

  const summaryColSpan = showVatColumn ? 6 : 5;

  // ============================================================
  // TÍNH TỔNG
  // ============================================================

  let subtotal = 0;
  let vatAmount = 0;
  let totalAmount = 0;

  const vatGroupMap = new Map();

  items.forEach((item) => {
    const calculated = calculateSettlementItemValues(
      item,
      formData.vat_type,
      formData.vat_rate,
      "quantity_actual",
    );

    subtotal += Number(calculated.amountBeforeVat || 0);

    vatAmount += Number(calculated.vatAmount || 0);

    totalAmount += Number(calculated.amountAfterVat || 0);

    const vatType = calculated.vatType;

    const vatRate = Number(calculated.vatRate || 0);

    const key = `${vatType}_${vatRate}`;

    if (!vatGroupMap.has(key)) {
      vatGroupMap.set(key, {
        vat_type: vatType,
        vat_rate: vatRate,
        subtotal: 0,
        vat_amount: 0,
        total: 0,
      });
    }

    const group = vatGroupMap.get(key);

    group.subtotal += Number(calculated.amountBeforeVat || 0);

    group.vat_amount += Number(calculated.vatAmount || 0);

    group.total += Number(calculated.amountAfterVat || 0);
  });

  const vatGroups = Array.from(vatGroupMap.values());

  // ============================================================
  // RENDER ITEM
  // ============================================================

  const renderItem = (item, stt, key) => {
    const calculated = calculateSettlementItemValues(
      item,
      formData.vat_type,
      formData.vat_rate,
      "quantity_actual",
    );

    const displayAmount =
      calculated.vatType === "INCLUDED"
        ? calculated.amountAfterVat
        : calculated.amountBeforeVat;

    return (
      <tr key={key}>
        <td>{stt}</td>

        <td className="settlement-preview-content-cell">
          <div>{item.item_name || ""}</div>

          {item.extra_note && (
            <div className="settlement-preview-item-note">
              {item.extra_note}
            </div>
          )}
        </td>

        <td>{item.unit || ""}</td>

        <td>{Number(item.quantity_actual || 0).toLocaleString("vi-VN")}</td>

        <td className="settlement-total-value">
          {formatCurrency(item.unit_price)}
        </td>

        {showVatColumn && (
          <td className="settlement-preview-vat-column">
            {calculated.vatType === "NO_VAT"
              ? "—"
              : `${Number(calculated.vatRate || 0)}%`}
          </td>
        )}

        <td className="settlement-total-value">
          {formatCurrency(displayAmount)}
        </td>
      </tr>
    );
  };

  return (
    <>
      <table className="settlement-preview-table settlement-preview-detail-table">
        <thead>
          <tr>
            <th style={{ width: "7%" }}>STT</th>

            <th>Nội dung công việc</th>

            <th>ĐVT</th>

            <th>Số lượng</th>

            <th>
              <div>Đơn giá</div>

              <div className="settlement-preview-unit-price-note">
                {formData.vat_type === "INCLUDED"
                  ? "(đã gồm VAT)"
                  : formData.vat_type === "EXCLUDED"
                    ? "(chưa VAT)"
                    : "(không VAT)"}
              </div>
            </th>

            {showVatColumn && <th style={{ width: "7%" }}>VAT</th>}

            <th>
              <div>Thành tiền</div>

              <div className="settlement-preview-unit-price-note">
                {formData.vat_type === "INCLUDED"
                  ? "(đã gồm VAT)"
                  : formData.vat_type === "EXCLUDED"
                    ? "(chưa VAT)"
                    : "(không VAT)"}
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          {/* ===================================================
              I. NỘI DUNG THEO HỢP ĐỒNG
              Chỉ hiện khi có phát sinh
          =================================================== */}

          {hasExtra && (
            <tr className="settlement-preview-group-row">
              <td colSpan={tableColumnCount}>I. NỘI DUNG THEO HỢP ĐỒNG</td>
            </tr>
          )}

          {contractItems.map((item, index) =>
            renderItem(
              item,
              index + 1,
              item.settlement_item_id || `contract-${index}`,
            ),
          )}

          {/* ===================================================
              II. HẠNG MỤC PHÁT SINH
          =================================================== */}

          {hasExtra && (
            <>
              <tr className="settlement-preview-group-row settlement-preview-extra-group">
                <td colSpan={tableColumnCount}>II. HẠNG MỤC PHÁT SINH</td>
              </tr>

              {extraItems.map((item, index) =>
                renderItem(
                  item,
                  contractItems.length + index + 1,
                  item.settlement_item_id || `extra-${index}`,
                ),
              )}
            </>
          )}

          {/* ===================================================
              NO VAT
          =================================================== */}

          {formData.vat_type === "NO_VAT" && (
            <tr className="settlement-preview-grand-total">
              <td colSpan={summaryColSpan} className="settlement-total-label">
                TỔNG CỘNG THANH TOÁN:
              </td>

              <td className="settlement-total-value">
                {formatCurrency(totalAmount)}
              </td>
            </tr>
          )}

          {/* ===================================================
              EXCLUDED
          =================================================== */}

          {formData.vat_type === "EXCLUDED" && (
            <>
              <tr className="settlement-preview-summary-row">
                <td colSpan={summaryColSpan} className="settlement-total-label">
                  Tổng tiền trước VAT:
                </td>

                <td className="settlement-total-value">
                  {formatCurrency(subtotal)}
                </td>
              </tr>

              {vatGroups
                .filter(
                  (group) =>
                    group.vat_type === "EXCLUDED" &&
                    Number(group.vat_rate || 0) > 0 &&
                    Number(group.vat_amount || 0) > 0,
                )
                .sort(
                  (a, b) => Number(a.vat_rate || 0) - Number(b.vat_rate || 0),
                )
                .map((group) => (
                  <tr
                    key={`vat-${group.vat_rate}`}
                    className="settlement-preview-summary-row"
                  >
                    <td
                      colSpan={summaryColSpan}
                      className="settlement-total-label"
                    >
                      Thuế GTGT ({Number(group.vat_rate || 0)}
                      %):
                    </td>

                    <td className="settlement-total-value">
                      {formatCurrency(group.vat_amount)}
                    </td>
                  </tr>
                ))}

              <tr className="settlement-preview-grand-total">
                <td colSpan={summaryColSpan} className="settlement-total-label">
                  TỔNG CỘNG THANH TOÁN:
                </td>

                <td className="settlement-total-value">
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </>
          )}

          {/* ===================================================
              INCLUDED
          =================================================== */}

          {formData.vat_type === "INCLUDED" && (
            <tr className="settlement-preview-grand-total">
              <td colSpan={summaryColSpan} className="settlement-total-label">
                TỔNG CỘNG THANH TOÁN:
                <div className="settlement-preview-included-note">
                  (Đã bao gồm VAT)
                </div>
              </td>

              <td className="settlement-total-value">
                {formatCurrency(totalAmount)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="settlement-preview-paragraph">
        <strong>Bằng chữ:</strong> {numberToVietnamese(totalAmount)}
      </p>
    </>
  );
};

const SettlementPreview = ({
  settlement,
  formData,
  priceItems = [],
  contractAmount,
  acceptanceList = [],
}) => {
  // ============================================================
  // BASIC
  // ============================================================

  const contractTotal =
    Number(settlement?.contract_value || 0) ||
    Number(contractAmount?.totalAmount || 0);

  const title =
    settlement?.document_type === "ACCEPTANCE"
      ? "BIÊN BẢN NGHIỆM THU HỢP ĐỒNG"
      : settlement?.document_type === "LIQUIDATION"
        ? "BIÊN BẢN THANH LÝ HỢP ĐỒNG"
        : "BIÊN BẢN NGHIỆM THU VÀ THANH LÝ HỢP ĐỒNG";

  // ============================================================
  // HELPERS
  // ============================================================

  const removeRepresentativePrefix = (name = "") => {
    return name
      .replace(/^\s*\((ông|bà)\)\s*/i, "")
      .replace(/^\s*(ông|bà)\s+/i, "")
      .trim();
  };

  const formatCompanyName = (text = "") => {
    const keepUppercase = [
      "TNHH",
      "TM",
      "DV",
      "CP",
      "MTV",
      "TMCP",
      "TMDV",
      "DL",
    ];

    return String(text || "")
      .trim()
      .toLocaleLowerCase("vi-VN")
      .split(/\s+/)
      .map((word) => {
        const upperWord = word.toLocaleUpperCase("vi-VN");

        if (keepUppercase.includes(upperWord)) {
          return upperWord;
        }

        return word.charAt(0).toLocaleUpperCase("vi-VN") + word.slice(1);
      })
      .join(" ");
  };

  const normalizeBoolean = (value) => {
    return value === true || value === 1 || value === "1" || value === "true";
  };

  // ============================================================
  // GIÁ TRỊ THEO HỢP ĐỒNG
  // ============================================================

  const contractPreviewValues = calculateAcceptanceValues(
    (priceItems || []).map((item) => ({
      ...item,

      quantity_contract: Number(item.quantity || 0),
    })),

    formData.vat_type,

    formData.vat_rate,

    "quantity_contract",
  );

  // ============================================================
  // NGHIỆM THU
  // ============================================================

  const acceptanceItems =
    settlement?.document_type === "ACCEPTANCE" ? settlement?.items || [] : [];

  const acceptanceContractItems = acceptanceItems.filter(
    (item) => !normalizeBoolean(item.is_extra),
  );

  const acceptanceExtraItems = acceptanceItems.filter((item) =>
    normalizeBoolean(item.is_extra),
  );

  const hasAcceptanceExtra = acceptanceExtraItems.length > 0;

  /*
   * RULE:
   *
   * Không phát sinh:
   * => không hiện cột VAT, dù hợp đồng có VAT.
   *
   * Có phát sinh + hợp đồng có VAT:
   * => hiện cột VAT để phân biệt 0 / 8 / 10.
   */
  const showAcceptanceVatColumn =
    hasAcceptanceExtra && formData.vat_type !== "NO_VAT";

  const acceptanceTableColumnCount = showAcceptanceVatColumn ? 7 : 6;

  const acceptanceSummaryColSpan = showAcceptanceVatColumn ? 6 : 5;

  // ============================================================
  // TÍNH NGHIỆM THU THEO VAT TỪNG ITEM
  // ============================================================

  const acceptanceVatGroupMap = new Map();

  let acceptanceSubtotal = 0;
  let acceptanceVatAmount = 0;
  let acceptanceTotal = 0;

  acceptanceItems.forEach((item) => {
    const calculated = calculateSettlementItemValues(
      item,

      formData.vat_type,

      formData.vat_rate,

      "quantity_actual",
    );

    acceptanceSubtotal += Number(calculated.amountBeforeVat || 0);

    acceptanceVatAmount += Number(calculated.vatAmount || 0);

    acceptanceTotal += Number(calculated.amountAfterVat || 0);

    const vatType = calculated.vatType;

    const vatRate = Number(calculated.vatRate || 0);

    const key = `${vatType}_${vatRate}`;

    if (!acceptanceVatGroupMap.has(key)) {
      acceptanceVatGroupMap.set(key, {
        vat_type: vatType,
        vat_rate: vatRate,
        subtotal: 0,
        vat_amount: 0,
        total: 0,
      });
    }

    const group = acceptanceVatGroupMap.get(key);

    group.subtotal += Number(calculated.amountBeforeVat || 0);

    group.vat_amount += Number(calculated.vatAmount || 0);

    group.total += Number(calculated.amountAfterVat || 0);
  });

  const acceptanceVatGroups = Array.from(acceptanceVatGroupMap.values());

  // ============================================================
  // THANH LÝ
  // ============================================================

  /*
   * QUAN TRỌNG:
   *
   * SettlementPreview KHÔNG dùng liquidationForm.
   *
   * Dữ liệu xem thanh lý phải lấy từ:
   *
   * settlement.items
   */
  // ============================================================
  // THANH LÝ - GỘP CÁC HẠNG MỤC GIỐNG NHAU
  // ============================================================

  const rawLiquidationItems =
    settlement?.document_type === "LIQUIDATION" ? settlement?.items || [] : [];

  const liquidationItemMap = new Map();

  rawLiquidationItems.forEach((item) => {
    const quantity = Number(item.quantity_actual || 0);

    const unitPrice = Number(item.unit_price || 0);

    const vatType = normalizeSettlementVatType(
      item.vat_type,
      formData.vat_type,
    );

    const vatRate =
      vatType === "NO_VAT"
        ? 0
        : Number(
            item.vat_rate !== undefined && item.vat_rate !== null
              ? item.vat_rate
              : formData.vat_rate,
          ) || 0;

    const isExtra =
      item.is_extra === true ||
      item.is_extra === 1 ||
      item.is_extra === "1" ||
      item.is_extra === "true";

    const actualAmount =
      item.actual_amount !== null && item.actual_amount !== undefined
        ? Number(item.actual_amount || 0)
        : quantity * unitPrice;

    const itemVatAmount = Number(item.vat_amount || 0);

    let amountAfterVat = Number(item.amount_after_vat || 0);

    if (!amountAfterVat) {
      amountAfterVat =
        vatType === "EXCLUDED" ? actualAmount + itemVatAmount : actualAmount;
    }

    /*
     * CHỈ GỘP KHI:
     *
     * - cùng contract_item_id
     * - cùng nội dung
     * - cùng đơn vị
     * - cùng đơn giá
     * - cùng VAT type
     * - cùng VAT rate
     * - cùng trạng thái hợp đồng / phát sinh
     */
    const normalizedItemName = String(item.item_name || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    const normalizedUnit = String(item.unit || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    const key = [
      isExtra ? "EXTRA" : "CONTRACT",

      normalizedItemName,

      normalizedUnit,

      unitPrice,

      vatType,

      vatRate,
    ].join("|");

    if (!liquidationItemMap.has(key)) {
      liquidationItemMap.set(key, {
        ...item,

        quantity_actual: 0,

        actual_amount: 0,

        vat_type: vatType,

        vat_rate: vatRate,

        vat_amount: 0,

        amount_after_vat: 0,

        is_extra: isExtra,
      });
    }

    const current = liquidationItemMap.get(key);

    // =========================================================
    // CỘNG DỒN CÁC ĐỢT NGHIỆM THU
    // =========================================================

    current.quantity_actual += quantity;

    current.actual_amount += actualAmount;

    current.vat_amount += itemVatAmount;

    current.amount_after_vat += amountAfterVat;

    // giữ ghi chú phát sinh nếu có
    if (!current.extra_note && item.extra_note) {
      current.extra_note = item.extra_note;
    }

    /*
     * sort_order nhỏ nhất được ưu tiên,
     * để thứ tự bảng không bị nhảy.
     */
    current.sort_order = Math.min(
      Number(current.sort_order || 9999),
      Number(item.sort_order || 9999),
    );
  });

  // ============================================================
  // DANH SÁCH SAU KHI GỘP
  // ============================================================

  const liquidationItems = Array.from(liquidationItemMap.values()).sort(
    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
  );

  const liquidationContractItems = liquidationItems.filter(
    (item) => !normalizeBoolean(item.is_extra),
  );

  const liquidationExtraItems = liquidationItems.filter((item) =>
    normalizeBoolean(item.is_extra),
  );

  const hasLiquidationExtra = liquidationExtraItems.length > 0;

  /*
   * Giống nghiệm thu:
   *
   * Không phát sinh => không cần cột VAT.
   *
   * Có phát sinh + có VAT => hiện VAT từng dòng.
   */
  const showLiquidationVatColumn =
    hasLiquidationExtra && formData.vat_type !== "NO_VAT";

  const liquidationTableColumnCount = showLiquidationVatColumn ? 7 : 6;

  const liquidationSummaryColSpan = showLiquidationVatColumn ? 6 : 5;

  // ============================================================
  // TÍNH GIÁ TRỊ THANH LÝ THEO TỪNG ITEM
  // ============================================================

  let liquidationSubtotal = 0;

  let liquidationVatAmount = 0;

  let liquidationTotal = 0;

  const liquidationVatGroupMap = new Map();

  liquidationItems.forEach((item) => {
    const quantity = Number(item.quantity_actual || 0);

    const unitPrice = Number(item.unit_price || 0);

    const vatType = normalizeSettlementVatType(
      item.vat_type,

      formData.vat_type,
    );

    const vatRate =
      vatType === "NO_VAT"
        ? 0
        : Number(
            item.vat_rate !== undefined && item.vat_rate !== null
              ? item.vat_rate
              : formData.vat_rate,
          ) || 0;

    /*
     * DB mới:
     *
     * actual_amount
     * = giá trị trước VAT.
     */
    const amountBeforeVat =
      item.actual_amount !== null && item.actual_amount !== undefined
        ? Number(item.actual_amount || 0)
        : quantity * unitPrice;

    /*
     * VAT đã lưu trên item.
     */
    let itemVatAmount = Number(item.vat_amount || 0);

    /*
     * Fallback cho dữ liệu cũ.
     */
    if (vatType === "EXCLUDED" && itemVatAmount === 0 && vatRate > 0) {
      itemVatAmount = amountBeforeVat * (vatRate / 100);
    }

    /*
     * Thành tiền sau VAT.
     */
    let amountAfterVat = Number(item.amount_after_vat || 0);

    if (!amountAfterVat) {
      if (vatType === "EXCLUDED") {
        amountAfterVat = amountBeforeVat + itemVatAmount;
      } else {
        /*
         * INCLUDED / NO_VAT
         */
        amountAfterVat = amountBeforeVat;
      }
    }

    liquidationSubtotal += amountBeforeVat;

    liquidationVatAmount += itemVatAmount;

    liquidationTotal += amountAfterVat;

    const key = `${vatType}_${vatRate}`;

    if (!liquidationVatGroupMap.has(key)) {
      liquidationVatGroupMap.set(key, {
        vat_type: vatType,

        vat_rate: vatRate,

        subtotal: 0,

        vat_amount: 0,

        total: 0,
      });
    }

    const group = liquidationVatGroupMap.get(key);

    group.subtotal += amountBeforeVat;

    group.vat_amount += itemVatAmount;

    group.total += amountAfterVat;
  });

  /*
   * Với dữ liệu thanh lý mới,
   * actual_value BE lưu chính là tổng cuối.
   *
   * Tuy nhiên chỉ fallback settlement.actual_value
   * nếu không tính được từ items.
   */
  if (liquidationTotal <= 0 && Number(settlement?.actual_value || 0) > 0) {
    liquidationTotal = Number(settlement.actual_value || 0);
  }

  if (liquidationSubtotal <= 0 && Number(settlement?.subtotal || 0) > 0) {
    liquidationSubtotal = Number(settlement.subtotal || 0);
  }

  if (liquidationVatAmount <= 0 && Number(settlement?.vat_amount || 0) > 0) {
    liquidationVatAmount = Number(settlement.vat_amount || 0);
  }

  const liquidationVatGroups = Array.from(liquidationVatGroupMap.values());

  // ============================================================
  // CĂN CỨ CÁC BIÊN BẢN NGHIỆM THU
  // ============================================================

  const liquidationAcceptanceBases = (acceptanceList || [])
    .filter(
      (item) =>
        item.document_type === "ACCEPTANCE" && Number(item.status) === 1,
    )
    .slice()
    .sort((a, b) => {
      const batchA = Number(a.batch_no || 0);

      const batchB = Number(b.batch_no || 0);

      if (batchA !== batchB) {
        return batchA - batchB;
      }

      return new Date(a.document_date || 0) - new Date(b.document_date || 0);
    });

  // ============================================================
  // PARTY BLOCK
  // ============================================================

  // ============================================================
  // ITEMS DÙNG CHO BẢNG THANH LÝ
  // Lấy từ các biên bản nghiệm thu
  // ============================================================

  const renderParties = () => (
    <>
      {/* BÊN A */}

      <div className="settlement-preview-party">
        <h3>BÊN A: {formData.customer_name}</h3>

        <div className="settlement-info-row">
          <span className="settlement-info-label">Địa chỉ</span>

          <span>:</span>

          <span>{formData.customer_address || ""}</span>
        </div>

        <div className="settlement-info-row">
          <span className="settlement-info-label">Điện thoại</span>

          <span>:</span>

          <span>{formData.customer_phone || ""}</span>
        </div>

        <div className="settlement-info-row">
          <span className="settlement-info-label">Mã số thuế</span>

          <span>:</span>

          <span>{formData.customer_tax_code || ""}</span>
        </div>

        {formData.customer_budget_code && (
          <div className="settlement-info-row">
            <span className="settlement-info-label">Mã QHNS</span>

            <span>:</span>

            <span>{formData.customer_budget_code}</span>
          </div>
        )}

        <div className="settlement-info-row">
          <span className="settlement-info-label">Tài khoản</span>

          <span>:</span>

          <span>{formData.customer_bank_account || ""}</span>
        </div>

        <div className="settlement-info-row">
          <span className="settlement-info-label">Đại diện</span>

          <span>:</span>

          <span>
            {formData.customer_rep_name || ""}

            {formData.customer_rep_title
              ? ` - Chức vụ: ${formData.customer_rep_title}`
              : ""}
          </span>
        </div>

        {formData.customer_rep_note && (
          <div className="settlement-rep-note">
            {formData.customer_rep_note}
          </div>
        )}
      </div>

      {/* BÊN B */}

      <div className="settlement-preview-party">
        <h3>BÊN B: {formData.company_name}</h3>

        <div className="settlement-info-row">
          <span className="settlement-info-label">Địa chỉ</span>

          <span>:</span>

          <span>{formData.company_address || ""}</span>
        </div>

        {formData.company_contact_address && (
          <div className="settlement-info-row">
            <span className="settlement-info-label">Liên hệ</span>

            <span>:</span>

            <span>{formData.company_contact_address}</span>
          </div>
        )}

        <div className="settlement-info-row">
          <span className="settlement-info-label">Điện thoại</span>

          <span>:</span>

          <span>{formData.company_phone || ""}</span>
        </div>

        <div className="settlement-info-row">
          <span className="settlement-info-label">Mã số thuế</span>

          <span>:</span>

          <span>{formData.company_tax_code || ""}</span>
        </div>

        <div className="settlement-info-row">
          <span className="settlement-info-label">Tài khoản</span>

          <span>:</span>

          <span>{formData.company_bank_account || ""}</span>
        </div>

        <div className="settlement-info-row">
          <span className="settlement-info-label">Đại diện</span>

          <span>:</span>

          <span>
            {formData.company_rep_name || ""}

            {formData.company_rep_title
              ? ` - Chức vụ: ${formData.company_rep_title}`
              : ""}
          </span>
        </div>

        {formData.company_rep_note && (
          <div className="settlement-rep-note">{formData.company_rep_note}</div>
        )}
      </div>
    </>
  );

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <div className="settlement-preview-paper">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="settlement-preview-header">
        <h4>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>

        <p>Độc lập - Tự do - Hạnh phúc</p>

        <div className="settlement-preview-line" />

        <h2>
          {settlement.document_type === "ACCEPTANCE" && settlement.batch_no
            ? `BIÊN BẢN NGHIỆM THU HỢP ĐỒNG ĐỢT ${String(
                settlement.batch_no,
              ).padStart(2, "0")}`
            : title}
        </h2>

        {settlement.document_no && <p>Số: {settlement.document_no}</p>}
      </div>

      {/* ========================================================
          BIÊN BẢN THANH LÝ
      ======================================================== */}

      {settlement.document_type === "LIQUIDATION" && (
        <>
          {/* ==================================================
              CĂN CỨ
          ================================================== */}

          <p className="settlement-preview-paragraph settlement-legal-basis">
            Căn cứ Hợp đồng số <strong>{formData.contract_code}</strong> giữa{" "}
            {formatCompanyName(formData.customer_name)} và{" "}
            {formatCompanyName(formData.company_name)} về việc “
            {formData.contract_name || ""}”
          </p>

          {liquidationAcceptanceBases.map((item, index) => {
            const batchNo = item.batch_no
              ? String(item.batch_no).padStart(2, "0")
              : String(index + 1).padStart(2, "0");

            const hasMultiple = liquidationAcceptanceBases.length > 1;

            return (
              <p
                key={item.settlement_id || index}
                className="settlement-preview-paragraph settlement-legal-basis"
              >
                Căn cứ Biên bản nghiệm thu{" "}
                {hasMultiple && (
                  <>
                    đợt <strong>{batchNo}</strong>{" "}
                  </>
                )}
                số <strong>{item.document_no || ""}</strong> giữa{" "}
                {formatCompanyName(formData.customer_name)} và{" "}
                {formatCompanyName(formData.company_name)}.
              </p>
            );
          })}

          <p className="settlement-preview-paragraph">
            Hôm nay, ngày{" "}
            <strong>{formatDate(settlement.document_date)}</strong>, chúng tôi
            gồm:
          </p>

          {renderParties()}

          <p className="settlement-preview-paragraph">
            Sau khi đối chiếu khối lượng dịch vụ đã thực hiện và nghiệm thu, hai
            bên thống nhất thanh lý Hợp đồng số{" "}
            <strong>{formData.contract_code}</strong> với các nội dung sau:
          </p>

          {/* ==================================================
              ĐIỀU 1
          ================================================== */}

          <h3 className="settlement-preview-section-title">
            ĐIỀU 1: HÀNG HÓA/DỊCH VỤ
          </h3>

          <p className="settlement-preview-paragraph">
            Bên B đã thực hiện “{formData.contract_name || ""}” cho Bên A đúng
            yêu cầu, thời gian và tiến độ như trong Hợp đồng số:{" "}
            <strong>{formData.contract_code || ""}</strong>, chi tiết như sau:
          </p>

          {/* <SettlementActualValueTable
            items={liquidationAcceptanceItems}
            formData={formData}
          /> */}
          <table className="settlement-preview-table settlement-preview-detail-table">
            <thead>
              <tr>
                <th style={{ width: "7%" }}>STT</th>
                <th>Nội dung công việc</th>
                <th>ĐVT</th>
                <th>Số lượng</th>

                <th>
                  <div>Đơn giá</div>

                  <div className="settlement-preview-unit-price-note">
                    {formData.vat_type === "INCLUDED"
                      ? "(đã gồm VAT)"
                      : formData.vat_type === "EXCLUDED"
                        ? "(chưa VAT)"
                        : "(không VAT)"}
                  </div>
                </th>

                {showLiquidationVatColumn && (
                  <th style={{ width: "8%" }}>VAT</th>
                )}

                <th>
                  <div>Thành tiền</div>

                  <div className="settlement-preview-unit-price-note">
                    {formData.vat_type === "INCLUDED"
                      ? "(đã gồm VAT)"
                      : formData.vat_type === "EXCLUDED"
                        ? "(chưa VAT)"
                        : "(không VAT)"}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {hasLiquidationExtra && (
                <tr className="settlement-preview-group-row">
                  <td colSpan={liquidationTableColumnCount}>
                    I. NỘI DUNG THEO HỢP ĐỒNG
                  </td>
                </tr>
              )}

              {liquidationContractItems.map((item, index) => {
                const calculated = calculateSettlementItemValues(
                  item,
                  formData.vat_type,
                  formData.vat_rate,
                  "quantity_actual",
                );

                const displayAmount =
                  calculated.vatType === "INCLUDED"
                    ? calculated.amountAfterVat
                    : calculated.amountBeforeVat;

                return (
                  <tr key={item.settlement_item_id || `liq-contract-${index}`}>
                    <td>{index + 1}</td>

                    <td className="settlement-preview-content-cell">
                      {item.item_name || ""}
                    </td>

                    <td>{item.unit || ""}</td>

                    <td>
                      {Number(item.quantity_actual || 0).toLocaleString(
                        "vi-VN",
                      )}
                    </td>

                    <td className="settlement-total-value settlement-item-value">
                      {formatCurrency(item.unit_price)}
                    </td>

                    {showLiquidationVatColumn && (
                      <td className="settlement-preview-vat-column settlement-item-value">
                        {Number(calculated.vatRate || 0)}%
                      </td>
                    )}

                    <td className="settlement-total-value settlement-item-value">
                      {formatCurrency(displayAmount)}
                    </td>
                  </tr>
                );
              })}

              {hasLiquidationExtra && (
                <>
                  <tr className="settlement-preview-group-row settlement-preview-extra-group">
                    <td colSpan={liquidationTableColumnCount}>
                      II. HẠNG MỤC PHÁT SINH
                    </td>
                  </tr>

                  {liquidationExtraItems.map((item, extraIndex) => {
                    const calculated = calculateSettlementItemValues(
                      item,
                      formData.vat_type,
                      formData.vat_rate,
                      "quantity_actual",
                    );

                    const displayAmount =
                      calculated.vatType === "INCLUDED"
                        ? calculated.amountAfterVat
                        : calculated.amountBeforeVat;

                    return (
                      <tr
                        key={
                          item.settlement_item_id || `liq-extra-${extraIndex}`
                        }
                        className="settlement-preview-extra-item"
                      >
                        <td>
                          {liquidationContractItems.length + extraIndex + 1}
                        </td>

                        <td className="settlement-preview-content-cell">
                          <div>{item.item_name || ""}</div>

                          {item.extra_note && (
                            <div className="settlement-preview-item-note">
                              {item.extra_note}
                            </div>
                          )}
                        </td>

                        <td>{item.unit || ""}</td>

                        <td>
                          {Number(item.quantity_actual || 0).toLocaleString(
                            "vi-VN",
                          )}
                        </td>

                        <td className="settlement-total-value">
                          {formatCurrency(item.unit_price)}
                        </td>

                        {showLiquidationVatColumn && (
                          <td className="settlement-preview-vat-column">
                            {Number(calculated.vatRate || 0)}%
                          </td>
                        )}

                        <td className="settlement-total-value">
                          {formatCurrency(displayAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
              {/* =====================================================
    TỔNG TIỀN - NO VAT
===================================================== */}

              {formData.vat_type === "NO_VAT" && (
                <tr className="settlement-preview-grand-total">
                  <td
                    colSpan={liquidationSummaryColSpan}
                    className="settlement-total-label"
                  >
                    TỔNG CỘNG THANH TOÁN:
                  </td>

                  <td className="settlement-total-value">
                    {formatCurrency(liquidationTotal)}
                  </td>
                </tr>
              )}

              {/* =====================================================
    TỔNG TIỀN - EXCLUDED
    ĐƠN GIÁ CHƯA VAT
===================================================== */}

              {formData.vat_type === "EXCLUDED" && (
                <>
                  {/* Tổng trước VAT */}

                  <tr className="settlement-preview-summary-row">
                    <td
                      colSpan={liquidationSummaryColSpan}
                      className="settlement-total-label"
                    >
                      Tổng tiền trước VAT:
                    </td>

                    <td className="settlement-total-value">
                      {formatCurrency(liquidationSubtotal)}
                    </td>
                  </tr>

                  {/* VAT 8%, 10%... */}

                  {(liquidationVatGroups || [])
                    .filter(
                      (group) =>
                        group.vat_type === "EXCLUDED" &&
                        Number(group.vat_rate || 0) > 0 &&
                        Number(group.vat_amount || 0) > 0,
                    )
                    .sort(
                      (a, b) =>
                        Number(a.vat_rate || 0) - Number(b.vat_rate || 0),
                    )
                    .map((group) => (
                      <tr
                        key={`liquidation-vat-${group.vat_rate}`}
                        className="settlement-preview-summary-row"
                      >
                        <td
                          colSpan={liquidationSummaryColSpan}
                          className="settlement-total-label"
                        >
                          Thuế GTGT ({Number(group.vat_rate || 0)}%):
                        </td>

                        <td className="settlement-total-value">
                          {formatCurrency(group.vat_amount)}
                        </td>
                      </tr>
                    ))}

                  {/* Tổng sau VAT */}

                  <tr className="settlement-preview-grand-total">
                    <td
                      colSpan={liquidationSummaryColSpan}
                      className="settlement-total-label"
                    >
                      TỔNG CỘNG THANH TOÁN:
                    </td>

                    <td className="settlement-total-value">
                      {formatCurrency(liquidationTotal)}
                    </td>
                  </tr>
                </>
              )}

              {/* =====================================================
    TỔNG TIỀN - INCLUDED
    ĐƠN GIÁ ĐÃ BAO GỒM VAT
===================================================== */}

              {formData.vat_type === "INCLUDED" && (
                <tr className="settlement-preview-grand-total">
                  <td
                    colSpan={liquidationSummaryColSpan}
                    className="settlement-total-label"
                  >
                    TỔNG CỘNG THANH TOÁN:
                    <div className="settlement-preview-included-note">
                      (Đã bao gồm VAT)
                    </div>
                  </td>

                  <td className="settlement-total-value">
                    {formatCurrency(liquidationTotal)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* ==================================================
              ĐIỀU 2
          ================================================== */}

          <h3 className="settlement-preview-section-title">
            ĐIỀU 2: GIÁ TRỊ THANH TOÁN THEO THỰC TẾ VÀ CÁC ĐIỀU KHOẢN KHÁC:
          </h3>

          <p className="settlement-preview-paragraph">
            - Tổng trị giá hợp đồng:{" "}
            <strong>{formatCurrency(contractTotal)} VNĐ./.</strong> (Số tiền
            bằng chữ: {numberToVietnamese(contractTotal)})
          </p>

          <p className="settlement-preview-paragraph">
            - Tổng trị quyết toán:{" "}
            <strong>{formatCurrency(liquidationTotal)} VNĐ./.</strong> (Số tiền
            bằng chữ: {numberToVietnamese(liquidationTotal)})
          </p>

          <p className="settlement-preview-paragraph">
            - Bên A đã thanh toán cho Bên B số tiền theo hợp đồng là:{" "}
            <strong>
              {formatCurrency(Number(settlement.paid_amount || 0))} VNĐ./.
            </strong>{" "}
            (Số tiền bằng chữ:{" "}
            {numberToVietnamese(Number(settlement.paid_amount || 0))})
          </p>

          <p className="settlement-preview-paragraph">
            - Số tiền Bên A còn phải thanh toán:{" "}
            <strong>
              {formatCurrency(Number(settlement.remaining_amount || 0))} VNĐ./.
            </strong>{" "}
            (Số tiền bằng chữ:{" "}
            {numberToVietnamese(Number(settlement.remaining_amount || 0))})
          </p>

          <p className="settlement-preview-paragraph">
            - Hai bên xác nhận hoàn thành đầy đủ các quyền và nghĩa vụ theo Hợp
            đồng số: <strong>{formData.contract_code || ""}</strong> và thống
            nhất thanh lý Hợp đồng kể từ ngày ký Biên bản này.
          </p>

          <p className="settlement-preview-paragraph">
            - Biên bản này được lập thành 04 (bốn) bản, Bên A giữ 02 (hai) bản,
            Bên B giữ 02 (hai) bản và có giá trị pháp lý ngang nhau./.
          </p>
        </>
      )}

      {/* ========================================================
          BIÊN BẢN NGHIỆM THU
      ======================================================== */}

      {settlement.document_type === "ACCEPTANCE" && (
        <>
          {/* ==================================================
              CĂN CỨ
          ================================================== */}

          <p className="settlement-preview-paragraph">
            Căn cứ Hợp đồng số <strong>{formData.contract_code}</strong> giữa{" "}
            {formatCompanyName(formData.customer_name)} và{" "}
            {formatCompanyName(formData.company_name)} về việc{" "}
            {formData.contract_name || "................................"};
          </p>

          <p className="settlement-preview-paragraph">
            Căn cứ tình hình thực hiện Hợp đồng và kết quả cung cấp dịch vụ
            {settlement.batch_no
              ? ` Đợt ${String(settlement.batch_no).padStart(2, "0")}`
              : ""}
            {settlement.service_from_date && settlement.service_to_date
              ? ` từ ngày ${formatDate(
                  settlement.service_from_date,
                )} đến ngày ${formatDate(settlement.service_to_date)}`
              : ""}
            ;
          </p>

          <p className="settlement-preview-paragraph">
            Hôm nay, ngày{" "}
            <strong>{formatDate(settlement.document_date)}</strong>, đại diện
            hai bên gồm có:
          </p>

          {renderParties()}

          <p className="settlement-preview-paragraph">
            Hai bên cùng tiến hành nghiệm thu việc thực hiện Hợp đồng số{" "}
            <strong>{formData.contract_code}</strong>
            {settlement.batch_no
              ? ` - Đợt ${String(settlement.batch_no).padStart(2, "0")}`
              : ""}
            , với nội dung như sau:
          </p>

          {/* ==================================================
              1. GIÁ TRỊ THEO HỢP ĐỒNG
          ================================================== */}

          <h3 className="settlement-preview-section-title">
            1. Giá trị theo hợp đồng
          </h3>

          <table className="settlement-preview-table">
            <thead>
              <tr>
                <th>STT</th>

                <th>Nội dung</th>

                <th>ĐVT</th>

                <th>Số lượng</th>

                <th>
                  <div>Đơn giá</div>

                  <div className="settlement-preview-unit-price-note">
                    {formData.vat_type === "INCLUDED"
                      ? "(đã gồm VAT)"
                      : formData.vat_type === "EXCLUDED"
                        ? "(chưa VAT)"
                        : "(không VAT)"}
                  </div>
                </th>

                <th>
                  <div>Thành tiền</div>

                  <div className="settlement-preview-unit-price-note">
                    {formData.vat_type === "INCLUDED"
                      ? "(đã gồm VAT)"
                      : formData.vat_type === "EXCLUDED"
                        ? "(chưa VAT)"
                        : "(không VAT)"}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {(priceItems || []).map((item, index) => (
                <tr key={item.price_id || index}>
                  <td>{index + 1}</td>

                  <td>{item.item_name || ""}</td>

                  <td>{item.unit || ""}</td>

                  <td>{Number(item.quantity || 0).toLocaleString("vi-VN")}</td>

                  <td>{formatCurrency(item.unit_price)}</td>

                  <td>
                    {formatCurrency(
                      Number(item.amount || 0) ||
                        Number(item.quantity || 0) *
                          Number(item.unit_price || 0),
                    )}
                  </td>
                </tr>
              ))}

              {formData.vat_type === "EXCLUDED" && (
                <>
                  <tr className="settlement-preview-total">
                    <td colSpan={5} className="settlement-total-label">
                      Tổng tiền trước VAT
                    </td>

                    <td className="settlement-total-value">
                      {formatCurrency(contractPreviewValues.serviceTotal)}
                    </td>
                  </tr>

                  <tr className="settlement-preview-total">
                    <td colSpan={5} className="settlement-total-label">
                      Thuế GTGT ({formData.vat_rate}
                      %)
                    </td>

                    <td className="settlement-total-value">
                      {formatCurrency(contractPreviewValues.vatAmount)}
                    </td>
                  </tr>

                  <tr className="settlement-preview-total">
                    <td colSpan={5} className="settlement-total-label">
                      Tổng giá trị sau VAT
                    </td>

                    <td className="settlement-total-value">
                      {formatCurrency(contractPreviewValues.totalAmount)}
                    </td>
                  </tr>
                </>
              )}

              {formData.vat_type === "INCLUDED" && (
                <tr className="settlement-preview-total">
                  <td colSpan={5} className="settlement-total-label">
                    Tổng giá trị hợp đồng
                  </td>

                  <td className="settlement-total-value">
                    {formatCurrency(contractPreviewValues.totalAmount)}
                  </td>
                </tr>
              )}

              {formData.vat_type === "NO_VAT" && (
                <tr className="settlement-preview-total">
                  <td colSpan={5} className="settlement-total-label">
                    Tổng giá trị hợp đồng
                  </td>

                  <td className="settlement-total-value">
                    {formatCurrency(contractPreviewValues.totalAmount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <p className="settlement-preview-paragraph">
            <strong>Bằng chữ:</strong>{" "}
            {numberToVietnamese(contractPreviewValues.totalAmount)}
          </p>

          {/* ==================================================
              2. GIÁ TRỊ THỰC TẾ NGHIỆM THU
          ================================================== */}

          <h3 className="settlement-preview-section-title">
            2. Giá trị thực tế nghiệm thu
          </h3>

          <SettlementActualValueTable
            items={settlement?.items || []}
            formData={formData}
          />

          {/* ==================================================
              ĐÁNH GIÁ
          ================================================== */}

          <p className="settlement-preview-paragraph">
            <strong>3. Đánh giá chất lượng công việc:</strong>{" "}
            {settlement.quality_rating || "Tốt"}
          </p>

          <p className="settlement-preview-paragraph">
            <strong>4. Ý kiến đánh giá khác:</strong>{" "}
            {settlement.other_comment || "Không"}
          </p>

          <p className="settlement-preview-paragraph">
            Biên bản được lập thành 04 bản, Bên A giữ 02 bản, Bên B giữ 02 bản
            và có giá trị pháp lý như nhau./.
          </p>
        </>
      )}

      {/* ========================================================
          NGHIỆM THU + THANH LÝ
          Tạm giữ dạng tổng quát
      ======================================================== */}

      {settlement.document_type === "ACCEPTANCE_LIQUIDATION" && (
        <>
          <p className="settlement-preview-paragraph">
            Căn cứ Hợp đồng số <strong>{formData.contract_code}</strong> giữa{" "}
            {formatCompanyName(formData.customer_name)} và{" "}
            {formatCompanyName(formData.company_name)}.
          </p>

          <p className="settlement-preview-paragraph">
            Hôm nay, ngày{" "}
            <strong>{formatDate(settlement.document_date)}</strong>, đại diện
            hai bên gồm có:
          </p>

          {renderParties()}

          <h3 className="settlement-preview-section-title">
            NỘI DUNG NGHIỆM THU VÀ THANH LÝ
          </h3>

          <p className="settlement-preview-paragraph">
            Tổng giá trị thực hiện:{" "}
            <strong>
              {formatCurrency(Number(settlement.actual_value || 0))} VNĐ
            </strong>
          </p>

          <p className="settlement-preview-paragraph">
            Bằng chữ: {numberToVietnamese(Number(settlement.actual_value || 0))}
          </p>
        </>
      )}

      {/* ========================================================
          CHỮ KÝ
      ======================================================== */}

      <div className="settlement-signature-grid">
        <div>
          <strong>ĐẠI DIỆN BÊN A</strong>

          <p className="settlement-signature-title">
            {formData.customer_rep_title}
          </p>

          <div className="settlement-signature-space" />

          <strong>
            {removeRepresentativePrefix(formData.customer_rep_name)}
          </strong>
        </div>

        <div>
          <strong>ĐẠI DIỆN BÊN B</strong>

          <p className="settlement-signature-title">
            {formData.company_rep_title}
          </p>

          <div className="settlement-signature-space" />

          <strong>
            {removeRepresentativePrefix(formData.company_rep_name)}
          </strong>
        </div>
      </div>
    </div>
  );
};
