import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";

import { Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";

import { BsEye } from "react-icons/bs";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import { numberToVietnamese } from "../NumberToVietnamese";

import "./index.css";

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0));

// ============================================================
// FORMAT DATE
// ============================================================

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const raw = String(value).substring(0, 10);

  const [year, month, day] = raw.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

const getTodayDate = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

// ============================================================
// FORMAT DATE LONG
// ============================================================

const formatVietnameseLongDate = (value) => {
  if (!value) {
    return "Ngày ..... tháng ..... năm ........";
  }

  const raw = String(value).substring(0, 10);

  const [year, month, day] = raw.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `Ngày ${day} tháng ${month} năm ${year}`;
};

// ============================================================
// REMOVE ÔNG / BÀ
// ============================================================

const removePersonTitle = (name) =>
  String(name || "")
    .replace(/^\s*\(?\s*(ông|bà)\s*\)?\s*/i, "")
    .trim();

// ============================================================
// EMPTY FORM
// ============================================================

const createEmptyForm = ({
  customerName = "",
  customerBudgetCode = "",
  contractValue = 0,
} = {}) => ({
  acceptance_settlement_id: "",

  document_no: "",

  document_date: getTodayDate(),

  budget_unit_name: customerName,

  budget_unit_code: customerBudgetCode,

  funding_source_code: "",

  national_program_code: "",

  contract_value: Number(contractValue || 0),

  // ==========================================================
  // MỤC 7
  // ==========================================================

  previous_accumulated_payment: 0,

  previous_advance_payment: 0,

  previous_direct_payment: 0,

  // ==========================================================
  // MỤC 8
  // ==========================================================

  previous_advance_balance: 0,

  // ==========================================================
  // MỤC 9
  // ==========================================================

  current_requested_payment: 0,

  current_advance_payment: 0,

  current_direct_payment: 0,

  amount_in_words: "",

  note: "",

  items: [],
});

// ============================================================
// COMPONENT
// ============================================================

const ContractForm08a = forwardRef(
  (
    {
      contractId,

      contract,

      formData,

      settlements = [],

      form08as = [],

      payments = [],

      contractValue = 0,

      onChanged,

      showToast,
    },
    ref,
  ) => {
    // ======================================================
    // STATE
    // ======================================================

    let userId = localStorage.getItem("userId");
    const [showModal, setShowModal] = useState(false);

    const [showPreview, setShowPreview] = useState(false);

    const [loading, setLoading] = useState(false);

    const [acceptanceLoading, setAcceptanceLoading] = useState(false);

    const [saving, setSaving] = useState(false);

    const [selectedForm08a, setSelectedForm08a] = useState(null);

    const [previewData, setPreviewData] = useState(null);

    const [form08a, setForm08a] = useState(() =>
      createEmptyForm({
        customerName: formData?.customer_name,

        customerBudgetCode: formData?.customer_budget_code,

        contractValue,
      }),
    );

    // ======================================================
    // DANH SÁCH BIÊN BẢN NGHIỆM THU
    // ======================================================

    const acceptances = useMemo(() => {
      return (settlements || [])
        .filter(
          (item) =>
            item.document_type === "ACCEPTANCE" && Number(item.status) === 1,
        )
        .sort((a, b) => Number(a.batch_no || 0) - Number(b.batch_no || 0));
    }, [settlements]);

    // ======================================================
    // TỔNG GIÁ TRỊ HẠNG MỤC ĐANG CHỌN
    // ======================================================

    const itemsTotal = useMemo(() => {
      return (form08a.items || []).reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );
    }, [form08a.items]);

    // ======================================================
    // TỔNG TIỀN TẠM ỨNG BAN ĐẦU
    // ======================================================

    const totalAdvancePaid = useMemo(() => {
      return (payments || []).reduce((sum, payment) => {
        if (Number(payment.status) !== 1) {
          return sum;
        }

        if (payment.payment_type === "ADVANCE") {
          return sum + Number(payment.amount || 0);
        }

        /*
         * QUAN TRỌNG:
         * Không trừ REFUND_ADVANCE ở đây.
         *
         * Phần đã thu hồi tạm ứng được tính từ
         * current_advance_payment của các Mẫu 08A trước.
         *
         * Nếu vừa trừ REFUND_ADVANCE ở payments,
         * vừa trừ previousAdvancePayment ở dưới
         * thì sẽ bị trừ 2 lần.
         */

        return sum;
      }, 0);
    }, [payments]);

    // ======================================================
    // TÍNH THÔNG TIN CÁC KỲ TRƯỚC
    // ======================================================

    const calculatePrevious08aValues = (currentAcceptanceId = null) => {
      let previousForms = [...(form08as || [])];

      // ==================================================
      // NẾU ĐANG TẠO THEO MỘT ĐỢT NGHIỆM THU
      // → CHỈ LẤY CÁC 08A CỦA ĐỢT TRƯỚC
      // ==================================================

      if (currentAcceptanceId) {
        const currentAcceptance = acceptances.find(
          (item) => Number(item.settlement_id) === Number(currentAcceptanceId),
        );

        if (
          currentAcceptance?.batch_no !== null &&
          currentAcceptance?.batch_no !== undefined
        ) {
          previousForms = previousForms.filter((form) => {
            const acceptance = acceptances.find(
              (item) =>
                Number(item.settlement_id) ===
                Number(form.acceptance_settlement_id),
            );

            if (!acceptance) {
              return false;
            }

            return (
              Number(acceptance.batch_no || 0) <
              Number(currentAcceptance.batch_no || 0)
            );
          });
        }
      }

      // ==================================================
      // KHI EDIT
      // → KHÔNG TÍNH CHÍNH MẪU ĐANG EDIT VÀO KỲ TRƯỚC
      // ==================================================

      if (selectedForm08a?.form_08a_id) {
        previousForms = previousForms.filter(
          (item) =>
            Number(item.form_08a_id) !== Number(selectedForm08a.form_08a_id),
        );
      }

      // ==================================================
      // MỤC 7
      //
      // THANH TOÁN TẠM ỨNG CÁC KỲ TRƯỚC
      // ==================================================

      const previousAdvancePayment = previousForms.reduce(
        (sum, item) => sum + Number(item.current_advance_payment || 0),
        0,
      );

      // ==================================================
      // THANH TOÁN TRỰC TIẾP CÁC KỲ TRƯỚC
      // ==================================================

      const previousDirectPayment = previousForms.reduce(
        (sum, item) => sum + Number(item.current_direct_payment || 0),
        0,
      );

      // ==================================================
      // LŨY KẾ THANH TOÁN
      //
      // = TẠM ỨNG + TRỰC TIẾP
      // ==================================================

      const previousAccumulatedPayment =
        Number(previousAdvancePayment || 0) +
        Number(previousDirectPayment || 0);

      // ==================================================
      // MỤC 8
      //
      // SỐ DƯ TẠM ỨNG
      //
      // = TỔNG TẠM ỨNG BAN ĐẦU
      // - TỔNG ĐÃ THU HỒI QUA CÁC MẪU 08A TRƯỚC
      // ==================================================

      const previousAdvanceBalance = Math.max(
        Number(totalAdvancePaid || 0) - Number(previousAdvancePayment || 0),
        0,
      );

      return {
        previous_accumulated_payment: previousAccumulatedPayment,

        previous_advance_payment: previousAdvancePayment,

        previous_direct_payment: previousDirectPayment,

        previous_advance_balance: previousAdvanceBalance,
      };
    };

    // ======================================================
    // RESET FORM
    // ======================================================

    const resetForm = () => {
      setSelectedForm08a(null);

      setForm08a(
        createEmptyForm({
          customerName: formData?.customer_name || "",

          customerBudgetCode: formData?.customer_budget_code || "",

          contractValue,
        }),
      );
    };

    // ======================================================
    // OPEN CREATE
    // ======================================================

    const openCreate = () => {
      setSelectedForm08a(null);

      const previous = calculatePrevious08aValues();

      setForm08a({
        ...createEmptyForm({
          customerName: formData?.customer_name || "",

          customerBudgetCode: formData?.customer_budget_code || "",

          contractValue,
        }),

        // ================================================
        // MỤC 7
        // ================================================

        previous_accumulated_payment: previous.previous_accumulated_payment,

        previous_advance_payment: previous.previous_advance_payment,

        previous_direct_payment: previous.previous_direct_payment,

        // ================================================
        // MỤC 8
        // ================================================

        previous_advance_balance: previous.previous_advance_balance,
      });

      setShowModal(true);
    };

    // ======================================================
    // EXPOSE
    // ======================================================

    useImperativeHandle(ref, () => ({
      openCreate,

      openEdit: handleEdit,

      openPreview: handlePreview,

      deleteForm: handleDelete,
    }));

    // ======================================================
    // CHANGE
    // ======================================================

    const handleChange = (field, value) => {
      setForm08a((prev) => ({
        ...prev,

        [field]: value,
      }));
    };

    // ======================================================
    // SELECT ACCEPTANCE
    // ======================================================

    const handleAcceptanceChange = async (settlementId) => {
      if (!settlementId) {
        setForm08a((prev) => ({
          ...prev,

          acceptance_settlement_id: "",

          items: [],

          current_requested_payment: 0,

          current_advance_payment: 0,

          current_direct_payment: 0,

          amount_in_words: "",
        }));

        return;
      }

      try {
        setAcceptanceLoading(true);

        const response = await API.get(
          `/contracts/${contractId}/documents/${settlementId}`,
        );

        const acceptance = response?.data?.data;

        if (!acceptance) {
          alert("Không tìm thấy biên bản nghiệm thu");

          return;
        }

        if (acceptance.document_type !== "ACCEPTANCE") {
          alert("Hồ sơ được chọn không phải biên bản nghiệm thu");

          return;
        }

        // =================================================
        // MAP ITEM NGHIỆM THU → 08A
        // =================================================

        const mappedItems = (acceptance.items || [])
          .filter((item) => Number(item.quantity_actual || 0) !== 0)
          .map((item, index) => {
            const quantity = Number(item.quantity_actual || 0);

            const unitPrice = Number(item.unit_price || 0);

            return {
              settlement_item_id: item.settlement_item_id || null,

              item_name: item.item_name || "",

              unit: item.unit || "",

              quantity,

              unit_price: unitPrice,

              amount: Math.round(quantity * unitPrice),

              sort_order: index + 1,
            };
          });

        // =================================================
        // TỔNG GIÁ TRỊ NGHIỆM THU KỲ NÀY
        // =================================================

        const currentTotal = mappedItems.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0,
        );

        // =================================================
        // THÔNG TIN KỲ TRƯỚC
        // =================================================

        const previous = calculatePrevious08aValues(settlementId);

        // =================================================
        // MỤC 7
        //
        // LŨY KẾ =
        // TẠM ỨNG + TRỰC TIẾP
        // =================================================

        const previousAccumulatedPayment =
          Number(previous.previous_advance_payment || 0) +
          Number(previous.previous_direct_payment || 0);

        // =================================================
        // MỤC 9
        //
        // SỐ ĐỀ NGHỊ THANH TOÁN KỲ NÀY
        //
        // = GIÁ TRỊ NGHIỆM THU RIÊNG CỦA KỲ NÀY
        //
        // KHÔNG TRỪ MỤC 7
        // =================================================

        const requestedPayment = Math.max(Number(currentTotal || 0), 0);

        // =================================================
        // THU HỒI TẠM ỨNG KỲ NÀY
        //
        // KHÔNG TỰ ĐỘNG THU HỒI HẾT SỐ DƯ
        //
        // NGƯỜI DÙNG NHẬP THEO HỢP ĐỒNG
        // VD: 45.000.000
        // =================================================

        const currentAdvancePayment = 0;

        const currentDirectPayment = requestedPayment;

        // =================================================
        // SET FORM
        // =================================================

        setForm08a((prev) => ({
          ...prev,

          acceptance_settlement_id: settlementId,

          document_date: prev.document_date || acceptance.document_date || "",

          items: mappedItems,

          // =============================================
          // MỤC 7
          // =============================================

          previous_accumulated_payment: previousAccumulatedPayment,

          previous_advance_payment: previous.previous_advance_payment,

          previous_direct_payment: previous.previous_direct_payment,

          // =============================================
          // MỤC 8
          // =============================================

          previous_advance_balance: previous.previous_advance_balance,

          // =============================================
          // MỤC 9
          // =============================================

          current_requested_payment: requestedPayment,

          current_advance_payment: currentAdvancePayment,

          current_direct_payment: currentDirectPayment,

          amount_in_words: numberToVietnamese(requestedPayment),
        }));
      } catch (error) {
        console.error("handleAcceptanceChange error:", error);

        console.error("Backend:", error?.response?.data);

        alert(
          error?.response?.data?.message || "Không thể tải biên bản nghiệm thu",
        );
      } finally {
        setAcceptanceLoading(false);
      }
    };

    // ======================================================
    // ITEM CHANGE
    // ======================================================

    const handleItemChange = (index, field, value) => {
      setForm08a((prev) => {
        const items = [...(prev.items || [])];

        if (!items[index]) {
          return prev;
        }

        items[index] = {
          ...items[index],

          [field]:
            field === "quantity" || field === "unit_price"
              ? Number(value || 0)
              : value,
        };

        // ==============================================
        // THÀNH TIỀN ITEM
        // ==============================================

        items[index].amount = Math.round(
          Number(items[index].quantity || 0) *
            Number(items[index].unit_price || 0),
        );

        // ==============================================
        // TỔNG GIÁ TRỊ NGHIỆM THU KỲ NÀY
        // ==============================================

        const total = items.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0,
        );

        // ==============================================
        // MỤC 7
        // ==============================================

        const previousAccumulatedPayment =
          Number(prev.previous_advance_payment || 0) +
          Number(prev.previous_direct_payment || 0);

        // ==============================================
        // MỤC 9
        //
        // = GIÁ TRỊ NGHIỆM THU RIÊNG KỲ NÀY
        // ==============================================

        const requestedPayment = Math.max(Number(total || 0), 0);

        // ==============================================
        // GIỮ SỐ THU HỒI TẠM ỨNG ĐANG NHẬP
        //
        // NHƯNG KHÔNG VƯỢT:
        // 1. SỐ ĐỀ NGHỊ KỲ NÀY
        // 2. SỐ DƯ TẠM ỨNG
        // ==============================================

        const currentAdvancePayment = Math.min(
          Number(prev.current_advance_payment || 0),

          requestedPayment,

          Math.max(Number(prev.previous_advance_balance || 0), 0),
        );

        const currentDirectPayment = Math.max(
          requestedPayment - currentAdvancePayment,
          0,
        );

        return {
          ...prev,

          items,

          previous_accumulated_payment: previousAccumulatedPayment,

          current_requested_payment: requestedPayment,

          current_advance_payment: currentAdvancePayment,

          current_direct_payment: currentDirectPayment,

          amount_in_words: numberToVietnamese(requestedPayment),
        };
      });
    };

    // ======================================================
    // CHANGE THANH TOÁN TẠM ỨNG KỲ NÀY
    // ======================================================

    const handleCurrentAdvanceChange = (value) => {
      const advance = Math.max(Number(value || 0), 0);

      setForm08a((prev) => {
        const requested = Number(prev.current_requested_payment || 0);

        const previousAdvanceBalance = Math.max(
          Number(prev.previous_advance_balance || 0),
          0,
        );

        // ==============================================
        // KHÔNG CHO THU HỒI TẠM ỨNG VƯỢT:
        //
        // 1. SỐ ĐỀ NGHỊ THANH TOÁN KỲ NÀY
        // 2. SỐ DƯ TẠM ỨNG
        // ==============================================

        const safeAdvance = Math.min(
          advance,

          requested,

          previousAdvanceBalance,
        );

        // ==============================================
        // THANH TOÁN TRỰC TIẾP
        //
        // = MỤC 9 - THU HỒI TẠM ỨNG
        // ==============================================

        const direct = Math.max(requested - safeAdvance, 0);

        return {
          ...prev,

          current_advance_payment: safeAdvance,

          current_direct_payment: direct,
        };
      });
    };

    // ======================================================
    // SAVE
    // ======================================================

    const handleSave = async () => {
      // ==================================================
      // VALIDATE
      // ==================================================

      if (!form08a.document_date) {
        alert("Vui lòng chọn ngày lập mẫu 08A");

        return;
      }

      if (!form08a.acceptance_settlement_id) {
        alert("Vui lòng chọn biên bản nghiệm thu");

        return;
      }

      if (!(form08a.items || []).length) {
        alert("Mẫu 08A chưa có hạng mục");

        return;
      }

      if (!String(form08a.budget_unit_name || "").trim()) {
        alert("Vui lòng nhập đơn vị sử dụng ngân sách");

        return;
      }

      try {
        setSaving(true);

        // =================================================
        // TỔNG GIÁ TRỊ NGHIỆM THU KỲ NÀY
        // =================================================

        const completedValue = (form08a.items || []).reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0,
        );

        // =================================================
        // MỤC 7
        // =================================================

        const previousAdvancePayment = Number(
          form08a.previous_advance_payment || 0,
        );

        const previousDirectPayment = Number(
          form08a.previous_direct_payment || 0,
        );

        const previousAccumulatedPayment =
          previousAdvancePayment + previousDirectPayment;

        // =================================================
        // MỤC 9
        //
        // = GIÁ TRỊ NGHIỆM THU RIÊNG KỲ NÀY
        //
        // KHÔNG TRỪ MỤC 7
        // =================================================

        const currentRequestedPayment = Math.max(
          Number(completedValue || 0),

          0,
        );

        // =================================================
        // THU HỒI TẠM ỨNG KỲ NÀY
        // =================================================

        const currentAdvancePayment = Math.min(
          Number(form08a.current_advance_payment || 0),

          currentRequestedPayment,

          Math.max(Number(form08a.previous_advance_balance || 0), 0),
        );

        // =================================================
        // THANH TOÁN TRỰC TIẾP
        // =================================================

        const currentDirectPayment = Math.max(
          currentRequestedPayment - currentAdvancePayment,

          0,
        );

        // =================================================
        // PAYLOAD
        // =================================================

        const payload = {
          acceptance_settlement_id: Number(form08a.acceptance_settlement_id),

          document_no: String(form08a.document_no || "").trim() || null,

          document_date: form08a.document_date,

          budget_unit_name: String(form08a.budget_unit_name || "").trim(),

          budget_unit_code:
            String(form08a.budget_unit_code || "").trim() || null,

          funding_source_code:
            String(form08a.funding_source_code || "").trim() || null,

          national_program_code:
            String(form08a.national_program_code || "").trim() || null,

          contract_value: Number(form08a.contract_value || contractValue || 0),

          // ===============================================
          // MỤC 7
          // ===============================================

          previous_accumulated_payment: previousAccumulatedPayment,

          previous_advance_payment: previousAdvancePayment,

          previous_direct_payment: previousDirectPayment,

          // ===============================================
          // MỤC 8
          // ===============================================

          previous_advance_balance: Number(
            form08a.previous_advance_balance || 0,
          ),

          // ===============================================
          // MỤC 9
          // ===============================================

          current_requested_payment: currentRequestedPayment,

          current_advance_payment: currentAdvancePayment,

          current_direct_payment: currentDirectPayment,

          amount_in_words: numberToVietnamese(currentRequestedPayment),

          note: form08a.note || null,

          created_by: userId,

          items: (form08a.items || []).map((item, index) => ({
            settlement_item_id: item.settlement_item_id || null,

            item_name: String(item.item_name || "").trim(),

            unit: String(item.unit || "").trim() || null,

            quantity: Number(item.quantity || 0),

            unit_price: Number(item.unit_price || 0),

            amount: Math.round(
              Number(item.quantity || 0) * Number(item.unit_price || 0),
            ),

            sort_order: index + 1,
          })),
        };

        // =================================================
        // UPDATE
        // =================================================

        if (selectedForm08a?.form_08a_id) {
          await APIToken.put(
            `/contracts/${contractId}/form-08a/${selectedForm08a.form_08a_id}`,
            payload,
          );

          showToast?.("Cập nhật Mẫu 08A thành công");
        }

        // =================================================
        // CREATE
        // =================================================
        else {
          await APIToken.post(`/contracts/${contractId}/form-08a`, payload);

          showToast?.("Tạo Mẫu 08A thành công");
        }

        setShowModal(false);

        resetForm();

        await onChanged?.();
      } catch (error) {
        console.error("handleSaveForm08a error:", error);

        console.error("Backend:", error?.response?.data);

        alert(error?.response?.data?.message || "Không thể lưu Mẫu 08A");
      } finally {
        setSaving(false);
      }
    };

    // ======================================================
    // EDIT
    // ======================================================

    async function handleEdit(form08aId) {
      try {
        setLoading(true);

        const response = await API.get(
          `/contracts/${contractId}/form-08a/${form08aId}`,
        );

        const data = response?.data?.data;

        if (!data) {
          alert("Không tìm thấy Mẫu 08A");

          return;
        }

        setSelectedForm08a(data);

        // ==================================================
        // KHÔI PHỤC FORM
        // ==================================================

        setForm08a({
          acceptance_settlement_id: data.acceptance_settlement_id || "",

          document_no: data.document_no || "",

          document_date: String(data.document_date || "").substring(0, 10),

          budget_unit_name: data.budget_unit_name || "",

          budget_unit_code: data.budget_unit_code || "",

          funding_source_code: data.funding_source_code || "",

          national_program_code: data.national_program_code || "",

          contract_value: Number(data.contract_value || 0),

          // ================================================
          // MỤC 7
          // ================================================

          previous_accumulated_payment: Number(
            data.previous_accumulated_payment || 0,
          ),

          previous_advance_payment: Number(data.previous_advance_payment || 0),

          previous_direct_payment: Number(data.previous_direct_payment || 0),

          // ================================================
          // MỤC 8
          // ================================================

          previous_advance_balance: Number(data.previous_advance_balance || 0),

          // ================================================
          // MỤC 9
          // ================================================

          current_requested_payment: Number(
            data.current_requested_payment || 0,
          ),

          current_advance_payment: Number(data.current_advance_payment || 0),

          current_direct_payment: Number(data.current_direct_payment || 0),

          amount_in_words:
            data.amount_in_words ||
            numberToVietnamese(Number(data.current_requested_payment || 0)),

          note: data.note || "",

          items: (data.items || []).map((item, index) => ({
            settlement_item_id: item.settlement_item_id || null,

            item_name: item.item_name || "",

            unit: item.unit || "",

            quantity: Number(item.quantity || 0),

            unit_price: Number(item.unit_price || 0),

            amount: Number(item.amount || 0),

            sort_order: item.sort_order || index + 1,
          })),
        });

        setShowModal(true);
      } catch (error) {
        console.error("handleEditForm08a error:", error);

        alert(error?.response?.data?.message || "Không thể tải Mẫu 08A");
      } finally {
        setLoading(false);
      }
    }

    // ======================================================
    // PREVIEW
    // ======================================================

    async function handlePreview(form08aId) {
      try {
        setLoading(true);

        const response = await API.get(
          `/contracts/${contractId}/form-08a/${form08aId}`,
        );

        const data = response?.data?.data;

        if (!data) {
          return;
        }

        setPreviewData(data);

        setShowPreview(true);
      } catch (error) {
        console.error("handlePreviewForm08a error:", error);

        alert("Không thể tải Mẫu 08A");
      } finally {
        setLoading(false);
      }
    }

    // ======================================================
    // DELETE
    // ======================================================

    async function handleDelete(form08aId) {
      const confirmed = window.confirm(
        "Bạn có chắc chắn muốn xóa Mẫu 08A này không?",
      );

      if (!confirmed) {
        return;
      }

      try {
        await APIToken.delete(`/contracts/${contractId}/form-08a/${form08aId}`);

        showToast?.("Xóa Mẫu 08A thành công");

        await onChanged?.();
      } catch (error) {
        console.error("deleteForm08a error:", error);

        alert(error?.response?.data?.message || "Không thể xóa Mẫu 08A");
      }
    }

    // ======================================================
    // ACCEPTANCE ĐANG CHỌN
    // ======================================================

    const selectedAcceptance = acceptances.find(
      (item) =>
        Number(item.settlement_id) === Number(form08a.acceptance_settlement_id),
    );

    // ======================================================
    // RENDER
    // ======================================================

    return (
      <>
        {/* ==================================================
              CREATE / EDIT
          ================================================== */}

        <Modal
          show={showModal}
          onHide={() => {
            if (saving) {
              return;
            }

            setShowModal(false);

            resetForm();
          }}
          size="xl"
          centered
          backdrop="static"
          dialogClassName="form08a-modal"
        >
          <Modal.Header closeButton={!saving}>
            <Modal.Title>
              {selectedForm08a ? "Chỉnh sửa Mẫu số 08A" : "Tạo Mẫu số 08A"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {loading ? (
              <div className="form08a-loading">
                <Spinner animation="border" size="sm" />

                <span>Đang tải dữ liệu...</span>
              </div>
            ) : (
              <>
                {/* ==========================================
                      THÔNG TIN MẪU 08A
                  ========================================== */}

                <div className="form08a-form-section">
                  <div className="form08a-section-title">Thông tin Mẫu 08A</div>

                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>
                          Biên bản nghiệm thu{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>

                        <Form.Select
                          value={form08a.acceptance_settlement_id}
                          disabled={
                            acceptanceLoading || Boolean(selectedForm08a)
                          }
                          onChange={(e) =>
                            handleAcceptanceChange(e.target.value)
                          }
                        >
                          <option value="">
                            -- Chọn biên bản nghiệm thu --
                          </option>

                          {acceptances.map((item) => (
                            <option
                              key={item.settlement_id}
                              value={item.settlement_id}
                            >
                              {item.batch_no
                                ? `Đợt ${String(item.batch_no).padStart(
                                    2,
                                    "0",
                                  )} - `
                                : ""}

                              {item.document_no || "Chưa có số"}

                              {item.document_date
                                ? ` - ${formatDate(item.document_date)}`
                                : ""}
                            </option>
                          ))}
                        </Form.Select>

                        {acceptanceLoading && (
                          <div className="form08a-field-loading">
                            <Spinner animation="border" size="sm" />
                            Đang lấy dữ liệu nghiệm thu...
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Số Mẫu 08A</Form.Label>

                        <Form.Control
                          value={form08a.document_no}
                          onChange={(e) =>
                            handleChange("document_no", e.target.value)
                          }
                          placeholder="Ví dụ: 01/08A/VNT-TSA2026"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>
                          Ngày lập <span className="text-danger">*</span>
                        </Form.Label>

                        <Form.Control
                          type="date"
                          value={form08a.document_date}
                          onChange={(e) =>
                            handleChange("document_date", e.target.value)
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* ==========================================
                      NGÂN SÁCH
                  ========================================== */}

                <div className="form08a-form-section">
                  <div className="form08a-section-title">
                    Thông tin đơn vị sử dụng ngân sách
                  </div>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Đơn vị sử dụng ngân sách</Form.Label>

                        <Form.Control
                          value={form08a.budget_unit_name}
                          onChange={(e) =>
                            handleChange("budget_unit_name", e.target.value)
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Mã đơn vị</Form.Label>

                        <Form.Control
                          value={form08a.budget_unit_code}
                          onChange={(e) =>
                            handleChange("budget_unit_code", e.target.value)
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Mã nguồn</Form.Label>

                        <Form.Control
                          value={form08a.funding_source_code}
                          onChange={(e) =>
                            handleChange("funding_source_code", e.target.value)
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Mã CTMTQG, Dự án ODA</Form.Label>

                        <Form.Control
                          value={form08a.national_program_code}
                          onChange={(e) =>
                            handleChange(
                              "national_program_code",
                              e.target.value,
                            )
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Giá trị hợp đồng</Form.Label>

                        <div className="form08a-readonly-money">
                          {formatCurrency(
                            form08a.contract_value || contractValue,
                          )}{" "}
                          đ
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* ==========================================
                      ITEMS
                  ========================================== */}

                <div className="form08a-form-section">
                  <div className="form08a-section-title">
                    Khối lượng công việc hoàn thành
                  </div>

                  {!form08a.items.length ? (
                    <div className="form08a-empty-items">
                      Chọn biên bản nghiệm thu để lấy hạng mục.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="form08a-edit-table">
                        <thead>
                          <tr>
                            <th
                              style={{
                                width: "55px",
                              }}
                            >
                              STT
                            </th>

                            <th>Nội dung công việc</th>

                            <th
                              style={{
                                width: "100px",
                              }}
                            >
                              Đơn vị
                            </th>

                            <th
                              style={{
                                width: "110px",
                              }}
                            >
                              Số lượng
                            </th>

                            <th
                              style={{
                                width: "150px",
                              }}
                            >
                              Đơn giá
                            </th>

                            <th
                              style={{
                                width: "160px",
                              }}
                            >
                              Thành tiền
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {form08a.items.map((item, index) => (
                            <tr key={index}>
                              <td className="text-center">{index + 1}</td>

                              <td>
                                <Form.Control
                                  value={item.item_name}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "item_name",
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <Form.Control
                                  value={item.unit}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "unit",
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "quantity",
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  value={item.unit_price}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "unit_price",
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>

                              <td className="form08a-edit-money">
                                {formatCurrency(item.amount)} đ
                              </td>
                            </tr>
                          ))}

                          <tr className="form08a-total-row">
                            <td colSpan={5}>Tổng số</td>

                            <td>{formatCurrency(itemsTotal)} đ</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ==========================================
                      MỤC 7 - 8 - 9
                  ========================================== */}

                <div className="form08a-form-section">
                  <div className="form08a-section-title">
                    Thông tin thanh toán
                  </div>

                  <Row className="g-3">
                    {/* ======================================
                          MỤC 7
                      ====================================== */}

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>
                          Lũy kế thanh toán đến cuối kỳ trước
                        </Form.Label>

                        <div className="form08a-readonly-money">
                          {formatCurrency(form08a.previous_accumulated_payment)}{" "}
                          đ
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Thanh toán tạm ứng kỳ trước</Form.Label>

                        <Form.Control
                          type="number"
                          min="0"
                          value={form08a.previous_advance_payment}
                          onChange={(e) => {
                            const advance = Math.max(
                              Number(e.target.value || 0),
                              0,
                            );

                            setForm08a((prev) => {
                              const direct = Math.max(
                                Number(prev.previous_direct_payment || 0),
                                0,
                              );

                              const accumulated = advance + direct;

                              const requested = Math.max(itemsTotal, 0);

                              const currentAdvance = Math.min(
                                Number(prev.current_advance_payment || 0),

                                requested,

                                Math.max(
                                  Number(prev.previous_advance_balance || 0),
                                  0,
                                ),
                              );

                              return {
                                ...prev,

                                previous_advance_payment: advance,

                                previous_accumulated_payment: accumulated,

                                current_requested_payment: requested,

                                current_advance_payment: currentAdvance,

                                current_direct_payment: Math.max(
                                  requested - currentAdvance,
                                  0,
                                ),

                                amount_in_words: numberToVietnamese(requested),
                              };
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Thanh toán trực tiếp kỳ trước</Form.Label>

                        <Form.Control
                          type="number"
                          min="0"
                          value={form08a.previous_direct_payment}
                          onChange={(e) => {
                            const direct = Math.max(
                              Number(e.target.value || 0),
                              0,
                            );

                            setForm08a((prev) => {
                              const advance = Math.max(
                                Number(prev.previous_advance_payment || 0),
                                0,
                              );

                              const accumulated = advance + direct;

                              const requested = Math.max(itemsTotal, 0);

                              const currentAdvance = Math.min(
                                Number(prev.current_advance_payment || 0),

                                requested,

                                Math.max(
                                  Number(prev.previous_advance_balance || 0),
                                  0,
                                ),
                              );

                              return {
                                ...prev,

                                previous_direct_payment: direct,

                                previous_accumulated_payment: accumulated,

                                current_requested_payment: requested,

                                current_advance_payment: currentAdvance,

                                current_direct_payment: Math.max(
                                  requested - currentAdvance,
                                  0,
                                ),

                                amount_in_words: numberToVietnamese(requested),
                              };
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>

                    {/* ======================================
                          MỤC 8
                      ====================================== */}

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Số dư tạm ứng đến cuối kỳ trước</Form.Label>

                        <Form.Control
                          type="number"
                          min="0"
                          value={form08a.previous_advance_balance}
                          onChange={(e) => {
                            const balance = Math.max(
                              Number(e.target.value || 0),
                              0,
                            );

                            setForm08a((prev) => {
                              const requested = Math.max(
                                Number(prev.current_requested_payment || 0),
                                0,
                              );

                              const currentAdvance = Math.min(
                                Number(prev.current_advance_payment || 0),

                                requested,

                                balance,
                              );

                              return {
                                ...prev,

                                previous_advance_balance: balance,

                                current_advance_payment: currentAdvance,

                                current_direct_payment: Math.max(
                                  requested - currentAdvance,
                                  0,
                                ),
                              };
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>

                    {/* ======================================
                          MỤC 9
                      ====================================== */}

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Số đề nghị thanh toán kỳ này</Form.Label>

                        <div className="form08a-readonly-money primary">
                          {formatCurrency(form08a.current_requested_payment)} đ
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Thanh toán tạm ứng kỳ này</Form.Label>

                        <Form.Control
                          type="number"
                          min="0"
                          max={Math.min(
                            Number(form08a.current_requested_payment || 0),

                            Number(form08a.previous_advance_balance || 0),
                          )}
                          value={form08a.current_advance_payment}
                          onChange={(e) =>
                            handleCurrentAdvanceChange(e.target.value)
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Thanh toán trực tiếp kỳ này</Form.Label>

                        <div className="form08a-readonly-money">
                          {formatCurrency(form08a.current_direct_payment)} đ
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={8}>
                      <Form.Group>
                        <Form.Label>Bằng chữ</Form.Label>

                        <Form.Control
                          value={numberToVietnamese(
                            form08a.current_requested_payment,
                          )}
                          readOnly
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Ghi chú</Form.Label>

                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={form08a.note}
                          onChange={(e) => handleChange("note", e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setShowModal(false);

                resetForm();
              }}
            >
              Hủy
            </Button>

            <Button
              variant="outline-primary"
              disabled={saving || !form08a.items.length}
              onClick={() => {
                setPreviewData({
                  ...form08a,

                  items: form08a.items,

                  acceptanceSettlement: selectedAcceptance,
                });

                setShowPreview(true);
              }}
            >
              <BsEye className="me-1" />
              Xem trước
            </Button>

            <Button
              variant="primary"
              disabled={saving || acceptanceLoading}
              onClick={handleSave}
            >
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang lưu...
                </>
              ) : selectedForm08a ? (
                "Cập nhật Mẫu 08A"
              ) : (
                "Tạo Mẫu 08A"
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* ==================================================
              PREVIEW
          ================================================== */}

        <Modal
          show={showPreview}
          onHide={() => {
            setShowPreview(false);

            setPreviewData(null);
          }}
          size="xl"
          centered
          dialogClassName="form08a-preview-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>Xem trước Mẫu số 08A</Modal.Title>
          </Modal.Header>

          <Modal.Body className="form08a-preview-background">
            {previewData && (
              <Form08aPreview
                data={previewData}
                contract={contract}
                formData={formData}
                acceptances={acceptances}
              />
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowPreview(false);

                setPreviewData(null);
              }}
            >
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>

        {loading && !showModal && !showPreview && (
          <div className="form08a-global-loading">
            <Spinner animation="border" />
          </div>
        )}
      </>
    );
  },
);

// ============================================================
// PREVIEW
// ============================================================

const Form08aPreview = ({ data, contract, formData, acceptances }) => {
  // ==========================================================
  // ACCEPTANCE
  // ==========================================================

  const acceptance =
    data.acceptanceSettlement ||
    acceptances.find(
      (item) =>
        Number(item.settlement_id) === Number(data.acceptance_settlement_id),
    );

  // ==========================================================
  // TỔNG GIÁ TRỊ NGHIỆM THU KỲ NÀY
  // ==========================================================

  const total = (data.items || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  // ==========================================================
  // MỤC 7
  // ==========================================================

  const previousAdvancePayment = Number(data.previous_advance_payment || 0);

  const previousDirectPayment = Number(data.previous_direct_payment || 0);

  const previousAccumulatedPayment =
    previousAdvancePayment + previousDirectPayment;

  // ==========================================================
  // MỤC 9
  //
  // SỐ ĐỀ NGHỊ =
  // GIÁ TRỊ NGHIỆM THU RIÊNG CỦA KỲ NÀY
  // ==========================================================

  const currentRequestedPayment = Math.max(total, 0);

  // ==========================================================
  // THU HỒI TẠM ỨNG KỲ NÀY
  // ==========================================================

  const currentAdvancePayment = Math.min(
    Number(data.current_advance_payment || 0),

    currentRequestedPayment,

    Math.max(Number(data.previous_advance_balance || 0), 0),
  );

  // ==========================================================
  // THANH TOÁN TRỰC TIẾP
  // ==========================================================

  const currentDirectPayment = Math.max(
    currentRequestedPayment - currentAdvancePayment,

    0,
  );

  // ==========================================================
  // PARTY
  // ==========================================================

  const customerName = data.budget_unit_name || formData?.customer_name || "";

  const companyName =
    formData?.company_name ||
    "CÔNG TY TNHH THƯƠNG MẠI DU LỊCH VÀ SỰ KIỆN VIỆT NAM";

  const contractCode = formData?.contract_code || contract?.contract_code || "";

  const contractTotal = Number(
    data.contract_value || formData?.total_amount || 0,
  );

  // ==========================================================
  // NUMBER LINE
  // ==========================================================

  const NumberedLine = ({ number, children, className = "" }) => (
    <div className={`form08a-numbered-line ${className}`}>
      <div className="form08a-number">{number}.</div>

      <div className="form08a-numbered-content">{children}</div>
    </div>
  );

  return (
    <div className="form08a-paper">
      {/* ======================================================
          TEMPLATE CODE
      ====================================================== */}

      <div className="form08a-template-code">
        <div className="form08a-template-name">Mẫu số 08a</div>

        <div>Mã hiệu: {data.template_code || "………….."}</div>

        <div>Số: {data.document_no || "…………"}</div>
      </div>

      {/* ======================================================
          TITLE
      ====================================================== */}

      <div className="form08a-main-title">
        BẢNG XÁC ĐỊNH GIÁ TRỊ KHỐI LƯỢNG CÔNG VIỆC HOÀN THÀNH
      </div>

      <div className="form08a-title-line">
        -----------------------------------------------
      </div>

      {/* ======================================================
          1
      ====================================================== */}

      <NumberedLine number="1">
        Đơn vị sử dụng ngân sách: <strong>{customerName}</strong>
      </NumberedLine>

      {/* ======================================================
          2
      ====================================================== */}

      <NumberedLine number="2">
        <div className="form08a-code-row">
          <div>Mã đơn vị: {data.budget_unit_code || ""}</div>

          <div>Mã nguồn: {data.funding_source_code || ""}</div>
        </div>
      </NumberedLine>

      {/* ======================================================
          3
      ====================================================== */}

      <NumberedLine number="3">
        Mã CTMTQG, Dự án ODA: {data.national_program_code || ""}
      </NumberedLine>

      {/* ======================================================
          4
      ====================================================== */}

      <NumberedLine number="4">
        <div>
          Căn cứ Hợp đồng dịch vụ số <strong>{contractCode}</strong> giữa{" "}
          {customerName} và {companyName}, giá trị hợp đồng đã ký:{" "}
          <strong>{formatCurrency(contractTotal)} vnđ</strong>{" "}
          <em>(Bằng chữ: {numberToVietnamese(contractTotal)}).</em>
        </div>
      </NumberedLine>

      {/* ======================================================
          5
      ====================================================== */}

      <NumberedLine number="5">
        Căn cứ Biên bản nghiệm thu{" "}
        {acceptance?.document_date
          ? formatVietnameseLongDate(acceptance.document_date)
          : ""}{" "}
        giữa {customerName} và {companyName}:
      </NumberedLine>

      {/* ======================================================
          ĐƠN VỊ
      ====================================================== */}

      <div className="form08a-unit">
        <em>Đơn vị: Đồng</em>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <table className="form08a-preview-table">
        <thead>
          <tr>
            <th className="col-stt">STT</th>

            <th className="col-content">Nội dung công việc</th>

            <th className="col-unit">
              Đơn vị
              <br />
              tính
            </th>

            <th className="col-quantity">
              Số
              <br />
              lượng
            </th>

            <th className="col-price">Đơn giá</th>

            <th className="col-amount">Thành tiền</th>
          </tr>

          <tr className="form08a-column-number">
            <td>(1)</td>

            <td>(2)</td>

            <td>(3)</td>

            <td>(4)</td>

            <td>(5)</td>

            <td>(6)</td>
          </tr>
        </thead>

        <tbody>
          {(data.items || []).map((item, index) => (
            <tr key={index}>
              <td className="form08a-center">{index + 1}</td>

              <td className="form08a-item-name">{item.item_name}</td>

              <td className="form08a-center">{item.unit}</td>

              <td className="form08a-center">
                {formatCurrency(item.quantity)}
              </td>

              <td className="form08a-money">
                {formatCurrency(item.unit_price)}
              </td>

              <td className="form08a-money">{formatCurrency(item.amount)}</td>
            </tr>
          ))}

          <tr className="form08a-preview-total">
            <td colSpan={5}>Tổng số</td>

            <td className="form08a-money">{formatCurrency(total)}</td>
          </tr>
        </tbody>
      </table>

      {/* ======================================================
          MỤC 7
      ====================================================== */}

      <NumberedLine number="7" className="form08a-after-table">
        Lũy kế thanh toán khối lượng hoàn thành đến cuối kỳ trước:{" "}
        <strong>{formatCurrency(previousAccumulatedPayment)} đồng</strong>.
      </NumberedLine>

      <div className="form08a-payment-sub-line">
        <div>
          - Thanh toán tạm ứng:{" "}
          <strong>{formatCurrency(previousAdvancePayment)} đồng.</strong>
        </div>

        <div>
          - Thanh toán trực tiếp:{" "}
          <strong>{formatCurrency(previousDirectPayment)} đồng.</strong>
        </div>
      </div>

      {/* ======================================================
          MỤC 8
      ====================================================== */}

      <NumberedLine number="8">
        Số dư tạm ứng đến cuối kỳ trước:{" "}
        <strong>{formatCurrency(data.previous_advance_balance)} đồng</strong>.
      </NumberedLine>

      {/* ======================================================
          MỤC 9
      ====================================================== */}

      <NumberedLine number="9">
        <div>
          Số đề nghị thanh toán kỳ này:{" "}
          <strong>{formatCurrency(currentRequestedPayment)} đồng</strong>{" "}
          <em>
            (Bằng chữ: {numberToVietnamese(currentRequestedPayment)}
            ).
          </em>
        </div>
      </NumberedLine>

      <div className="form08a-payment-sub-line">
        <div>
          - Thanh toán tạm ứng:{" "}
          <strong>{formatCurrency(currentAdvancePayment)} đồng.</strong>
        </div>

        <div>
          - Thanh toán trực tiếp:{" "}
          <strong>{formatCurrency(currentDirectPayment)} đồng.</strong>
        </div>
      </div>

      {/* ======================================================
          SIGNATURE
      ====================================================== */}

      <div className="form08a-signature-block">
        {/* LEFT */}

        <div className="form08a-sign-side">
          <div className="form08a-sign-heading">
            <div>ĐẠI DIỆN NHÀ CUNG CẤP</div>

            <div>HÀNG HÓA, DỊCH VỤ</div>
          </div>

          <div className="form08a-sign-position">
            {formData?.company_rep_title || "GIÁM ĐỐC"}
          </div>

          <div className="form08a-sign-person">
            {removePersonTitle(formData?.company_rep_name)}
          </div>
        </div>

        {/* RIGHT */}

        <div className="form08a-sign-side">
          <div className="form08a-sign-date">
            <em>{formatVietnameseLongDate(data.document_date)}</em>
          </div>

          <div className="form08a-sign-heading">
            <div>ĐẠI DIỆN ĐƠN VỊ SỬ DỤNG NGÂN SÁCH</div>
          </div>

          <div className="form08a-sign-position">
            {formData?.customer_rep_title || "GIÁM ĐỐC"}
          </div>

          <div className="form08a-sign-person">
            {removePersonTitle(formData?.customer_rep_name)}
          </div>
        </div>
      </div>
    </div>
  );
};

ContractForm08a.displayName = "ContractForm08a";

export default ContractForm08a;
