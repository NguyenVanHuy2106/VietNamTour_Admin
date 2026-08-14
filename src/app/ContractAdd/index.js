import React, { useEffect, useMemo, useState } from "react";
import { numberToVietnamese } from "../../components/NumberToVietnamese";
import { DEFAULT_CONTRACT_ARTICLES } from "../../components/ContractArticleDefaults";

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

import {
  BsEye,
  BsFileEarmarkWord,
  BsPlus,
  BsSave,
  BsTrash,
} from "react-icons/bs";

import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import "./index.css";

const ContractCreate = () => {
  const userId = localStorage.getItem("userId");

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [showPreview, setShowPreview] = useState(false);
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [formData, setFormData] = useState({
    contract_code: "2655/VNT-TSA2026",
    contract_name:
      "Tổ chức gói thầu tham quan nghỉ dưỡng cho viên chức, người lao động của Bệnh viện Đa khoa Khánh Hội năm 2026",

    contract_type: 1,
    template_id: "",

    signed_date: "2026-07-30",
    signed_place: "Bệnh viện Đa khoa Khánh Hội",

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

    company_name: "CÔNG TY TNHH THƯƠNG MẠI DU LỊCH VÀ SỰ KIỆN VIỆT NAM",
    company_address:
      "57 Đường N12, Khu nhà ở thấp tầng Ba Son, Khu phố 11, Phường Long Phước, Thành phố Hồ Chí Minh",
    company_phone: "0373.954.963",
    company_tax_code: "0318789883",
    company_bank_account: "1102649999 – Vietcombank – Chi nhánh Tân Định",
    company_rep_name: "(Ông) NGUYỄN VĂN TÈO",
    company_rep_title: "Giám đốc",
    company_rep_note: "",

    work_content:
      "Bên A giao và Bên B nhận thực hiện dịch vụ tổ chức chương trình tham quan, du lịch cho người lao động {{customer_name}} tại Vũng Tàu theo các nội dung, điều kiện và thỏa thuận được quy định trong Hợp đồng này và các tài liệu kèm theo (nếu có).",
    service_content:
      "Bên B có trách nhiệm cung cấp đầy đủ các dịch vụ theo yêu cầu của gói thầu, bao gồm nhưng không giới hạn: vận chuyển, lưu trú, ăn uống, tham quan, bảo hiểm du lịch, hướng dẫn viên, tổ chức chương trình tập thể và các dịch vụ khác theo nội dung đã cam kết.",

    tour_program:
      "Chương trình tham quan do Bên B xây dựng và được Bên A chấp thuận bằng văn bản là một bộ phận không tách rời của Hợp đồng này. Trường hợp cần điều chỉnh chương trình, lịch trình hoặc tiêu chuẩn dịch vụ, hai bên phải thống nhất bằng văn bản hoặc phụ lục hợp đồng trước khi thực hiện, trừ trường hợp bất khả kháng hoặc nhằm bảo đảm an toàn cho đoàn khách.",

    priority_documents:
      "1. Phụ lục hợp đồng được ký kết sau cùng;\n2. Hợp đồng và các sửa đổi, bổ sung hợp đồng;\n3. Các tài liệu khác có liên quan.",

    extra_volume:
      "Đối với đối tượng khác tham gia chương trình ngoài phạm vi gói thầu, việc thực hiện dịch vụ và thanh toán được thực hiện theo phụ lục hợp đồng hoặc thỏa thuận riêng giữa các bên. Các khoản chi phí phát sinh ngoài phạm vi hợp đồng chỉ được thanh toán khi được Bên A chấp thuận và thực hiện theo quy định tại Điều 6 của Hợp đồng này.",

    vat_type: "INCLUDED",
    vat_rate: 8,
    vat_amount: 0,
    contract_value: 0,
    total_amount: 0,
    amount_in_words: "",

    is_advance: true,
    advance_calc_type: "PERCENT",
    advance_percent: 30,
    advance_date: 15,
    advance_amount: 0,
    advance_due_date: "",
    status: "DRAFT",
    note: "",
    article_4: DEFAULT_CONTRACT_ARTICLES.article_4,
    article_5: DEFAULT_CONTRACT_ARTICLES.article_5,
    article_6: DEFAULT_CONTRACT_ARTICLES.article_6,
    article_7: DEFAULT_CONTRACT_ARTICLES.article_7,
    article_8: DEFAULT_CONTRACT_ARTICLES.article_8,
    article_9: DEFAULT_CONTRACT_ARTICLES.article_9,
    article_10: DEFAULT_CONTRACT_ARTICLES.article_10,
    article_11: DEFAULT_CONTRACT_ARTICLES.article_11,
    legal_bases: [
      {
        id: 1,
        content:
          "Căn cứ vào Bộ luật Dân sự số 91/2015/QH13 của Quốc Hội Nước Cộng Hoà Xã Hội Chủ Nghĩa Việt Nam thông qua  ngày 24/11/2015 có hiệu lực thi hành ngày 01/01/2017",
      },
      {
        id: 2,
        content:
          "Căn cứ vào Luật Thương mại số 36/2005/QH11 của Quốc Hội Nước Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam thông qua ngày 14/06/2005 có hiệu lực thi hành từ ngày 01/01/2006; ",
      },
      {
        id: 3,
        content:
          "Căn cứ vào Luật Du Lịch số 09/2017/QH14 được Quốc Hội Nước Cộng Hoà Xã Hội Chủ Nghĩa Việt Nam thông qua ngày 19/06/2017 có hiệu lực thi hành ngày 01/01/2018;",
      },
      {
        id: 4,
        content: "Căn cứ vào nhu cầu và khả năng cung ứng của hai Bên;",
      },
    ],
    payment_content:
      "Bên A thanh toán cho Bên B bằng hình thức chuyển khoản theo thông tin tài khoản được quy định tại Hợp đồng.",

    payment_schedule_content:
      "Bên A thanh toán phần giá trị còn lại của Hợp đồng sau khi Bên B hoàn thành đầy đủ các nội dung công việc và cung cấp đầy đủ hồ sơ, chứng từ thanh toán theo thỏa thuận.",
  });

  const [departures, setDepartures] = useState([
    {
      departure_name: "Đợt 01",
      start_date: "2026-08-08",
      end_date: "2026-08-09",
    },
  ]);

  const [priceItems, setPriceItems] = useState([
    {
      item_name: "",
      quantity: 0,
      unit: "",
      unit_price: 0,
      amount: 0,

      vat_type: "INCLUDED",
      // INCLUDED: Đơn giá đã có VAT
      // EXCLUDED: Đơn giá chưa VAT
      // NO_VAT: Không tính VAT

      vat_rate: 8,
    },
  ]);

  useEffect(() => {
    getCustomers();
    getTemplates();
  }, []);

  useEffect(() => {
    calculateContractAmount();
  }, [
    formData.quantity,
    formData.unit_price,
    formData.vat_rate,
    formData.vat_type,
  ]);

  useEffect(() => {
    calculateAdvanceAmount();
  }, [
    formData.is_advance,
    formData.advance_calc_type,
    formData.advance_percent,
    formData.advance_date,
    formData.total_amount,
  ]);
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      work_content: generateWorkContent(),
    }));
  }, [formData.customer_name]);

  const contractAmount = useMemo(() => {
    // Luôn tính lại từ số lượng và đơn giá,
    // không phụ thuộc item.amount để tránh dữ liệu cũ.
    const lineTotal = priceItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;

      return sum + quantity * unitPrice;
    }, 0);

    const vatRate = Number(formData.vat_rate) || 0;

    let contractValue = lineTotal;
    let vatAmount = 0;
    let totalAmount = lineTotal;

    switch (formData.vat_type) {
      case "EXCLUDED":
        // Đơn giá chưa VAT, cộng VAT thêm
        vatAmount = lineTotal * (vatRate / 100);
        totalAmount = lineTotal + vatAmount;
        break;

      case "INCLUDED":
        // Đơn giá đã bao gồm VAT
        // Không tách ngược giá trước VAT
        vatAmount = 0;
        totalAmount = lineTotal;
        break;

      case "NO_VAT":
        // Hợp đồng không tính VAT
        vatAmount = 0;
        totalAmount = lineTotal;
        break;

      default:
        vatAmount = 0;
        totalAmount = lineTotal;
        break;
    }

    return {
      lineTotal: Math.round(lineTotal),
      contractValue: Math.round(contractValue),
      vatAmount: Math.round(vatAmount),
      totalAmount: Math.round(totalAmount),
    };
  }, [priceItems, formData.vat_type, formData.vat_rate]);

  const calculateContractAmount = () => {
    const quantity = Number(formData.quantity || 0);
    const unitPrice = Number(formData.unit_price || 0);
    const vatRate = Number(formData.vat_rate || 0);

    const lineAmount = quantity * unitPrice;

    let contractValue = 0;
    let vatAmount = 0;
    let totalAmount = 0;

    switch (formData.vat_type) {
      case "INCLUDED":
        // Đơn giá đã bao gồm VAT
        totalAmount = lineAmount;

        contractValue =
          vatRate > 0 ? totalAmount / (1 + vatRate / 100) : totalAmount;

        vatAmount = totalAmount - contractValue;
        break;

      case "EXCLUDED":
        // Đơn giá chưa VAT, cộng VAT thêm
        contractValue = lineAmount;
        vatAmount = contractValue * (vatRate / 100);
        totalAmount = contractValue + vatAmount;
        break;

      case "NO_VAT":
        // Hợp đồng không bao gồm VAT
        contractValue = lineAmount;
        vatAmount = 0;
        totalAmount = contractValue;
        break;

      default:
        break;
    }

    setFormData((previous) => ({
      ...previous,
      contract_value: Math.round(contractValue),
      vat_amount: Math.round(vatAmount),
      total_amount: Math.round(totalAmount),
    }));
  };

  const calculatedAdvanceAmount = useMemo(() => {
    const totalAmount = Number(contractAmount?.totalAmount || 0);
    const advancePercent = Number(formData.advance_percent || 0);

    if (formData.advance_calc_type !== "PERCENT") {
      return Number(formData.advance_amount || 0);
    }

    return Math.round((totalAmount * advancePercent) / 100);
  }, [
    contractAmount?.totalAmount,
    formData.advance_calc_type,
    formData.advance_percent,
    formData.advance_amount,
    formData.advance_date,
  ]);

  const remainingAmount =
    Number(contractAmount?.totalAmount || 0) -
    Number(calculatedAdvanceAmount || 0);

  useEffect(() => {
    if (formData.advance_calc_type !== "PERCENT") {
      return;
    }

    const totalAmount = Number(contractAmount.totalAmount || 0);
    const advancePercent = Number(formData.advance_percent || 0);

    const advanceAmount = Math.round((totalAmount * advancePercent) / 100);

    setFormData((prev) => ({
      ...prev,
      advance_amount: advanceAmount,
    }));
  }, [
    contractAmount.totalAmount,
    formData.advance_calc_type,
    formData.advance_percent,
    formData.advance_date,
  ]);

  const getCustomers = async () => {
    try {
      const response = await API.get("/customers/get");
      setCustomers(response?.data?.data || []);
    } catch (error) {
      console.error("Không tải được khách hàng:", error);
    }
  };

  const getTemplates = async () => {
    try {
      const response = await API.get("/contract-templates/get");
      setTemplates(response?.data?.data || []);
    } catch (error) {
      console.error("Không tải được mẫu hợp đồng:", error);
    }
  };

  const calculateContractValue = (
    vatType = formData.vat_type,
    vatRateValue = formData.vat_rate,
    items = priceItems,
  ) => {
    const lineTotal = items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);

      return sum + quantity * unitPrice;
    }, 0);

    const vatRate = Number(vatRateValue || 0);

    let contractValue = lineTotal;
    let vatAmount = 0;
    let totalAmount = lineTotal;

    if (vatType === "EXCLUDED") {
      // Đơn giá chưa VAT, cộng VAT thêm
      vatAmount = lineTotal * (vatRate / 100);
      totalAmount = lineTotal + vatAmount;
    }

    if (vatType === "INCLUDED") {
      // Đơn giá đã gồm VAT, không tách ngược VAT
      vatAmount = 0;
      totalAmount = lineTotal;
    }

    if (vatType === "NO_VAT") {
      // Hợp đồng không tính VAT
      vatAmount = 0;
      totalAmount = lineTotal;
    }

    return {
      contract_value: Math.round(contractValue),
      vat_amount: Math.round(vatAmount),
      total_amount: Math.round(totalAmount),
    };
  };

  const calculateAdvanceAmount = () => {
    if (!formData.is_advance) {
      setFormData((previous) => ({
        ...previous,
        advance_amount: 0,
      }));

      return;
    }

    if (formData.advance_calc_type === "PERCENT") {
      const amount =
        Number(formData.total_amount || 0) *
        (Number(formData.advance_percent || 0) / 100);

      setFormData((previous) => ({
        ...previous,
        advance_amount: Math.round(amount),
      }));
    }
  };

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

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleVatTypeChange = (event) => {
    const newVatType = event.target.value;

    setFormData((previous) => ({
      ...previous,
      vat_type: newVatType,
    }));
  };
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
  };
  const handleCustomerChange = (event) => {
    const selectedCustomerId = event.target.value;

    const selectedCustomer = customers.find(
      (item) => String(item.customer_id) === String(selectedCustomerId),
    );

    if (!selectedCustomer) {
      setFormData((previous) => ({
        ...previous,
        customer_id: "",
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      customer_id: selectedCustomer.customer_id,
      customer_name: selectedCustomer.customer_name || "",
      customer_address: selectedCustomer.address || "",
      customer_phone: selectedCustomer.phone || "",
      customer_tax_code: selectedCustomer.tax_code || "",
      customer_budget_code: selectedCustomer.budget_code || "",
      customer_bank_account: selectedCustomer.bank_account || "",
    }));
  };

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
    setDepartures((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );
  };

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
          (Number(updatedItem.quantity) || 0) *
          (Number(updatedItem.unit_price) || 0);

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
        vat_type: "INCLUDED",
        vat_rate: 8,
      },
    ]);
  };

  const removePriceItem = (index) => {
    setPriceItems((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const validateForm = () => {
    if (!formData.contract_code.trim()) {
      alert("Vui lòng nhập số hợp đồng");
      return false;
    }

    if (!formData.contract_name.trim()) {
      alert("Vui lòng nhập tên hợp đồng");
      return false;
    }

    if (!formData.customer_id && !formData.customer_name) {
      alert("Vui lòng chọn Bên A");
      return false;
    }

    if (priceItems.length === 0) {
      alert("Hợp đồng phải có ít nhất một dòng bảng giá");
      return false;
    }

    return true;
  };
  const handleCustomerInput = (e) => {
    const value = e.target.value;

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
  const generateWorkContent = () => {
    return `Bên A giao và Bên B nhận thực hiện dịch vụ tổ chức chương trình tham quan, du lịch cho người lao động ${
      formData.customer_name || ""
    } tại Vũng Tàu theo các nội dung, điều kiện và thỏa thuận được quy định trong Hợp đồng này và các tài liệu kèm theo (nếu có).`;
  };
  const buildPayload = (status) => {
    return {
      contract_code: formData.contract_code,
      contract_name: formData.contract_name,
      contract_type: Number(formData.contract_type),
      template_id: formData.template_id || null,

      customer_id: formData.customer_id || null,

      signed_date: formData.signed_date,
      signed_place: formData.signed_place,

      contract_value: Number(formData.contract_value),
      vat_rate: Number(formData.vat_rate),
      vat_amount: Number(formData.vat_amount),
      total_amount: Number(formData.total_amount),
      amount_in_words: formData.amount_in_words,

      status,
      created_by: userId,
      note: formData.note,

      customer_profile: {
        company_name: formData.customer_name,
        tax_code: formData.customer_tax_code,
        budget_code: formData.customer_budget_code,
        address: formData.customer_address,
        phone: formData.customer_phone,
        bank_account: formData.customer_bank_account,
      },

      company_profile: {
        company_name: formData.company_name,
        tax_code: formData.company_tax_code,
        address: formData.company_address,
        phone: formData.company_phone,
        bank_account: formData.company_bank_account,
      },

      representatives: [
        {
          rep_type: "CUSTOMER",
          rep_name: formData.customer_rep_name,
          rep_title: formData.customer_rep_title,
        },
        {
          rep_type: "COMPANY",
          rep_name: formData.company_rep_name,
          rep_title: formData.company_rep_title,
        },
      ],

      contract_content: {
        work_content: formData.work_content,
        service_content: formData.service_content,
        tour_program: formData.tour_program,
        priority_documents: formData.priority_documents,
        extra_volume: formData.extra_volume,
      },

      departures,

      price_items: priceItems.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        amount: Number(item.amount),
      })),

      advance: {
        is_advance: formData.is_advance,
        calc_type: formData.advance_calc_type,
        advance_percent: Number(formData.advance_percent || 0),
        advance_amount: Number(formData.advance_amount || 0),
        advance_date: formData.advance_date || null,
      },
    };
  };
  const renderTemplate = (text) =>
    text.replaceAll("{{customer_name}}", formData.customer_name || "");

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload = buildPayload("DRAFT");

      const response = await APIToken.post("/contracts/add", payload);

      if (response.status === 200 || response.status === 201) {
        setAlertMessage("Lưu nháp hợp đồng thành công");
        setSuccessAlertOpen(true);
      }
    } catch (error) {
      console.error("Lỗi lưu hợp đồng:", error);
      alert(error?.response?.data?.message || "Không thể lưu hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload = buildPayload("ACTIVE");

      const response = await APIToken.post("/contracts/add", payload);

      if (response.status === 200 || response.status === 201) {
        setAlertMessage("Tạo và phát hành hợp đồng thành công");

        setSuccessAlertOpen(true);

        setTimeout(() => {
          window.location.href = "/contracts";
        }, 1000);
      }
    } catch (error) {
      console.error("Lỗi tạo hợp đồng:", error);

      alert(error?.response?.data?.message || "Không thể tạo hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  const formattedTotalAmount = useMemo(() => {
    return new Intl.NumberFormat("vi-VN").format(
      Number(formData.total_amount || 0),
    );
  }, [formData.total_amount]);

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

  const getSignedDateText = () => {
    if (!formData.signed_date) {
      return "Hôm nay, ngày ..... tháng ..... năm ..........";
    }

    const date = new Date(`${formData.signed_date}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return `Hôm nay, ngày ${formData.signed_date}`;
    }

    return `Hôm nay, ngày ${String(date.getDate()).padStart(2, "0")} tháng ${String(
      date.getMonth() + 1,
    ).padStart(2, "0")} năm ${date.getFullYear()}`;
  };

  const remainingPaymentAmount = Math.max(
    Number(contractAmount.totalAmount || 0) -
      Number(formData.advance_amount || 0),
    0,
  );
  return (
    <div className="contract-create-container">
      <div className="contract-breadcrumb">
        <span>Hợp đồng</span>
        <span>/</span>
        <strong>Thêm mới hợp đồng</strong>
      </div>

      <div className="contract-page-header">
        <div>
          <h2>Thêm mới Hợp đồng</h2>
          <p>Tạo hợp đồng dịch vụ du lịch lữ hành</p>
        </div>

        <div className="contract-header-actions">
          <Button
            variant="light"
            className="contract-btn-outline"
            onClick={handleSaveDraft}
            disabled={loading}
          >
            <BsSave />
            Lưu nháp
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
            onClick={handleSaveAndCreate}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : <BsFileEarmarkWord />}
            Lưu và tạo hợp đồng
          </Button>
        </div>
      </div>

      <div className="contract-document">
        <section className="contract-national-header">
          <h5>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h5>
          <p>Độc lập – Tự do – Hạnh phúc</p>

          <h1>HỢP ĐỒNG DỊCH VỤ</h1>

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

          <div className="contract-code-row">
            <span>Số:</span>

            <Form.Control
              name="contract_code"
              value={formData.contract_code}
              onChange={handleChange}
            />
          </div>
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
                      handleLegalBasisChange(index, e.target.value)
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

        <section className="contract-party-grid">
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
                placeholder="Nhập số điện thoại..."
              />
            </ContractInput>

            <ContractInput label="Mã số thuế">
              <Form.Control
                name="customer_tax_code"
                value={formData.customer_tax_code}
                onChange={handleChange}
                placeholder="Nhập mã số thuế..."
              />
            </ContractInput>

            <ContractInput label="Mã QHNS">
              <Form.Control
                name="customer_budget_code"
                value={formData.customer_budget_code}
                onChange={handleChange}
                placeholder="Nhập mã QHNS..."
              />
            </ContractInput>

            <ContractInput label="Tài khoản">
              <Form.Control
                name="customer_bank_account"
                value={formData.customer_bank_account}
                onChange={handleChange}
                placeholder="Nhập thông tin tài khoản..."
              />
            </ContractInput>

            <Row className="g-2">
              <Col md={7}>
                <ContractInput label="Đại diện" required>
                  <Form.Control
                    name="customer_rep_name"
                    value={formData.customer_rep_name}
                    onChange={handleChange}
                    placeholder="Nhập thông tin người đại diện..."
                  />
                </ContractInput>
              </Col>

              <Col md={5}>
                <ContractInput label="Chức vụ" required>
                  <Form.Control
                    name="customer_rep_title"
                    value={formData.customer_rep_title}
                    onChange={handleChange}
                    placeholder="Nhập chức vụ..."
                  />
                </ContractInput>
              </Col>
            </Row>
            <ContractInput label="Ghi chú">
              <Form.Control
                name="customer_rep_note"
                value={formData.customer_rep_note}
                onChange={handleChange}
                placeholder="Nhập ghi chú..."
              />
            </ContractInput>
          </div>

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

            <ContractInput label="Điện thoại" required>
              <Form.Control
                name="company_phone"
                value={formData.company_phone}
                onChange={handleChange}
              />
            </ContractInput>

            <ContractInput label="Mã số thuế" required>
              <Form.Control
                name="company_tax_code"
                value={formData.company_tax_code}
                onChange={handleChange}
              />
            </ContractInput>

            <ContractInput label="Tài khoản NH" required>
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
            <ContractInput label="Ghi chú" required>
              <Form.Control
                name="company_rep_note"
                value={formData.company_rep_note}
                onChange={handleChange}
                placeholder="Nhập ghi chú..."
              />
            </ContractInput>
          </div>
        </section>

        <Accordion
          defaultActiveKey={["0", "1", "2"]}
          alwaysOpen
          className="contract-accordion"
        >
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
                  rows={3}
                  name="tour_program"
                  value={formData.tour_program}
                  onChange={handleChange}
                />
              </ContractClause>

              <ContractClause title="1.3. Thời gian thực hiện">
                <div className="contract-departure-list">
                  {departures.map((item, index) => (
                    <div className="contract-departure-row" key={index}>
                      {departures.length > 1 && (
                        <span className="contract-departure-label">
                          Đợt {String(index + 1).padStart(2, "0")}
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
                  rows={3}
                  name="extra_volume"
                  value={formData.extra_volume}
                  onChange={handleChange}
                />
              </ContractClause>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="1">
            <Accordion.Header>
              Điều 2. Giá hợp đồng, giá dịch vụ và giá trị thanh toán
            </Accordion.Header>

            <Accordion.Body>
              <h4 className="contract-subsection-title">
                2.1. Giá trị hợp đồng
              </h4>
              <div className="contract-vat-setting">
                <span className="contract-vat-setting-label">
                  Cách tính VAT:
                </span>

                <Form.Check
                  type="radio"
                  id="vat-type-included"
                  name="vat_type"
                  value="INCLUDED"
                  label="Đơn giá đã bao gồm VAT"
                  checked={formData.vat_type === "INCLUDED"}
                  onChange={handleVatTypeChange}
                />

                <Form.Check
                  type="radio"
                  id="vat-type-excluded"
                  name="vat_type"
                  value="EXCLUDED"
                  label="Đơn giá chưa VAT, cộng VAT thêm"
                  checked={formData.vat_type === "EXCLUDED"}
                  onChange={handleVatTypeChange}
                />

                <Form.Check
                  type="radio"
                  id="vat-type-no-vat"
                  name="vat_type"
                  value="NO_VAT"
                  label="Hợp đồng không tính VAT"
                  checked={formData.vat_type === "NO_VAT"}
                  onChange={handleVatTypeChange}
                />
              </div>

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
                      <tr key={index}>
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
                            placeholder="Nhập thông tin hạng mục..."
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
                          {new Intl.NumberFormat("vi-VN").format(item.amount)}
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
            </Accordion.Body>
          </Accordion.Item>

          {/* <Accordion.Item eventKey="2">
            <Accordion.Header>
              Điều 3. Phương thức và tiến độ thanh toán
            </Accordion.Header>

            <Accordion.Body>
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
                        value={
                          formData.advance_calc_type === "PERCENT"
                            ? Number(calculatedAdvanceAmount).toLocaleString(
                                "vi-VN",
                              )
                            : Number(
                                formData.advance_amount || 0,
                              ).toLocaleString("vi-VN")
                        }
                        onChange={handleChange}
                        readOnly={formData.advance_calc_type === "PERCENT"}
                      />
                    </ContractInput>
                  </Col>
                  <Col md={3}>
                    <ContractInput label="Hạn tạm ứng">
                      <Form.Control
                        type="number"
                        name="advance_date"
                        value={formData.advance_date}
                        onChange={handleChange}
                        min={0}
                        max={100}
                      />
                    </ContractInput>{" "}
                  </Col>
                </Row>
              )}
            </Accordion.Body>
          </Accordion.Item> */}
          <Accordion.Item eventKey="2">
            <Accordion.Header>
              Điều 3. Phương thức và tiến độ thanh toán
            </Accordion.Header>

            <Accordion.Body>
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
                          value={
                            formData.advance_calc_type === "PERCENT"
                              ? Number(
                                  calculatedAdvanceAmount || 0,
                                ).toLocaleString("vi-VN")
                              : Number(
                                  formData.advance_amount || 0,
                                ).toLocaleString("vi-VN")
                          }
                          onChange={(e) => {
                            // Chỉ giữ lại số
                            const rawValue = e.target.value.replace(/\D/g, "");

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
                      <ContractInput label="Hạn tạm ứng">
                        <Form.Control
                          type="number"
                          name="advance_date"
                          value={formData.advance_date}
                          onChange={handleChange}
                          min={0}
                        />
                      </ContractInput>
                    </Col>
                  </Row>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  3.3. Tiến độ thanh toán
                </Form.Label>

                <div className="payment-preview-box">
                  {formData.is_advance && (
                    <p className="payment-preview-text">
                      <strong>a) Tạm ứng hợp đồng:</strong> Bên A tạm ứng cho
                      Bên B{" "}
                      {formData.advance_calc_type === "PERCENT"
                        ? `${formData.advance_percent || 0}% giá trị hợp đồng`
                        : `số tiền ${Number(
                            formData.advance_amount || 0,
                          ).toLocaleString("vi-VN")} đồng`}
                      , tương đương số tiền{" "}
                      <strong>
                        {Number(calculatedAdvanceAmount || 0).toLocaleString(
                          "vi-VN",
                        )}{" "}
                        đồng
                      </strong>{" "}
                      (Bằng chữ:{" "}
                      {numberToVietnamese(calculatedAdvanceAmount || 0)} đồng)
                      sau khi ký kết hợp đồng theo thời hạn hai bên thống nhất.
                    </p>
                  )}

                  <p className="payment-preview-text">
                    <strong>
                      {formData.is_advance ? "b)" : "a)"} Thanh toán giá trị còn
                      lại:
                    </strong>{" "}
                    Bên A thanh toán cho Bên B số tiền còn lại
                    {formData.is_advance
                      ? " sau khi trừ giá trị đã tạm ứng"
                      : ""}{" "}
                    và các khoản chi phí phát sinh (nếu có), trong vòng{" "}
                    <strong>{formData.advance_date || 15} ngày</strong> sau khi
                    Bên B hoàn thành dịch vụ và cung cấp đầy đủ hồ sơ thanh toán
                    hợp lệ.
                  </p>
                </div>
              </Form.Group>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="3">
            <Accordion.Header>
              Điều 4. Quyền và trách nhiệm của Bên A
            </Accordion.Header>

            <Accordion.Body>
              <Form.Control
                as="textarea"
                rows={18}
                name="article_4"
                value={formData.article_4}
                onChange={handleChange}
              />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="4">
            <Accordion.Header>
              Điều 5. Quyền và trách nhiệm của Bên B
            </Accordion.Header>

            <Accordion.Body>
              <Form.Control
                as="textarea"
                rows={20}
                name="article_5"
                value={formData.article_5}
                onChange={handleChange}
              />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="5">
            <Accordion.Header>
              Điều 6. Quản lý, xác nhận và thanh toán chi phí phát sinh
            </Accordion.Header>

            <Accordion.Body>
              <Form.Control
                as="textarea"
                rows={16}
                name="article_6"
                value={formData.article_6}
                onChange={handleChange}
              />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="6">
            <Accordion.Header>Điều 7. Sự kiện bất khả kháng</Accordion.Header>

            <Accordion.Body>
              <Form.Control
                as="textarea"
                rows={16}
                name="article_7"
                value={formData.article_7}
                onChange={handleChange}
              />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="7">
            <Accordion.Header>
              Điều 8. Phạt vi phạm hợp đồng và bồi thường thiệt hại
            </Accordion.Header>

            <Accordion.Body>
              <Form.Control
                as="textarea"
                rows={18}
                name="article_8"
                value={formData.article_8}
                onChange={handleChange}
              />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="8">
            <Accordion.Header>
              Điều 9. Luật áp dụng và giải quyết tranh chấp
            </Accordion.Header>

            <Accordion.Body>
              <Form.Control
                as="textarea"
                rows={16}
                name="article_9"
                value={formData.article_9}
                onChange={handleChange}
              />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="9">
            <Accordion.Header>
              Điều 10. Bảo mật thông tin và dữ liệu cá nhân
            </Accordion.Header>

            <Accordion.Body>
              <Form.Control
                as="textarea"
                rows={14}
                name="article_10"
                value={formData.article_10}
                onChange={handleChange}
              />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="10">
            <Accordion.Header>Điều 11. Điều khoản chung</Accordion.Header>

            <Accordion.Body>
              <Form.Control
                as="textarea"
                rows={12}
                name="article_11"
                value={formData.article_11}
                onChange={handleChange}
              />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>

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
            remainingPaymentAmount={remainingPaymentAmount}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getSignedDateText={getSignedDateText}
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
const ContractPreview = ({
  formData,
  departures,
  priceItems,
  contractAmount,
  remainingPaymentAmount,
  formatCurrency,
  formatDate,
  getSignedDateText,
}) => {
  const totalAmountInWords = numberToVietnamese(
    contractAmount.totalAmount || 0,
  );

  const advanceAmountInWords = numberToVietnamese(formData.advance_amount || 0);

  const departureText = departures
    .filter((item) => item.start_date || item.end_date)
    .map((item) => {
      const name = item.departure_name ? `${item.departure_name}: ` : "";

      return `${name}Từ ngày ${formatDate(
        item.start_date,
      )} đến ngày ${formatDate(item.end_date)}`;
    });

  const renderTextLines = (content) => {
    if (!content) {
      return null;
    }

    return content.split("\n").map((line, index) => (
      <p key={`${line}-${index}`} className="preview-paragraph">
        {line || "\u00A0"}
      </p>
    ));
  };

  const renderArticleContent = (content) => {
    if (!content || !content.trim()) {
      return (
        <p className="preview-empty-content">Chưa có nội dung điều khoản.</p>
      );
    }

    return content.split("\n").map((line, index) => {
      const value = line.trim();

      if (!value) {
        return <div key={`empty-${index}`} className="preview-empty-line" />;
      }

      // Tiêu đề khoản: 4.1., 4.2., 10.1...
      const clauseMatch = value.match(/^(\d+\.\d+\.)\s*(.*)$/);

      if (clauseMatch) {
        return (
          <h3 key={`clause-${index}`} className="preview-clause-title">
            {clauseMatch[1]} {clauseMatch[2]}
          </h3>
        );
      }

      // Mục chữ cái: a), b), c), d), đ)...
      const letterMatch = value.match(/^([a-zA-ZđĐ]\))\s*(.*)$/);

      if (letterMatch) {
        const marker = letterMatch[1];
        const itemText = letterMatch[2];

        /*
         * Nhận diện phần tiêu đề nằm trước dấu :
         * Ví dụ:
         * a) Tạm ứng hợp đồng: Bên A...
         */
        const boldTitles = [
          "Tạm ứng hợp đồng:",
          "Thanh toán giá trị còn lại:",
          "Hồ sơ thanh toán gồm:",
        ];

        const matchedTitle = boldTitles.find((title) =>
          itemText.startsWith(title),
        );

        if (matchedTitle) {
          const description = itemText.slice(matchedTitle.length);

          return (
            <p key={`letter-${index}`} className="preview-letter-paragraph">
              <strong>
                {marker} {matchedTitle}
              </strong>

              {description}
            </p>
          );
        }

        return (
          <p key={`letter-${index}`} className="preview-letter-paragraph">
            {marker} {itemText}
          </p>
        );
      }

      // Gạch đầu dòng
      const bulletMatch = value.match(/^([-–•])\s*(.*)$/);

      if (bulletMatch) {
        return (
          <p key={`bullet-${index}`} className="preview-bullet-paragraph">
            {bulletMatch[1]} {bulletMatch[2]}
          </p>
        );
      }

      // Danh sách số 1., 2., 3...
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

  return (
    <div className="contract-preview-wrapper">
      <div className="contract-preview-paper">
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

        <section className="preview-legal-basis">
          <div className="preview-legal-bases">
            {formData.legal_bases.map((item, index) => (
              <p key={item.id || index} className="preview-paragraph">
                {item.content}
              </p>
            ))}
          </div>
        </section>

        <section className="preview-party-section">
          <h2 className="preview-party-title">
            BÊN A: {formData.customer_name || "CHƯA NHẬP TÊN BÊN A"}
          </h2>

          <div className="preview-info-row">
            <span className="preview-info-label">Địa chỉ</span>
            <span>:</span>
            <span>
              {formData.customer_address || "................................"}
            </span>
          </div>

          <div className="preview-info-row">
            <span className="preview-info-label">Điện thoại</span>
            <span>:</span>
            <span>
              {formData.customer_phone || "................................"}
            </span>
          </div>

          <div className="preview-info-row">
            <span className="preview-info-label">Mã số thuế</span>
            <span>:</span>
            <span>
              {formData.customer_tax_code || "................................"}
            </span>
          </div>

          {formData.customer_budget_code && (
            <div className="preview-info-row">
              <span className="preview-info-label">Mã QHNS</span>
              <span>:</span>
              <span>{formData.customer_budget_code}</span>
            </div>
          )}

          <div className="preview-info-row">
            <span className="preview-info-label">Tài khoản</span>
            <span>:</span>
            <span>
              {formData.customer_bank_account ||
                "................................"}
            </span>
          </div>

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

        <section className="preview-party-section">
          <h2 className="preview-party-title">
            BÊN B: {formData.company_name || "CHƯA NHẬP TÊN BÊN B"}
          </h2>

          <div className="preview-info-row">
            <span className="preview-info-label">Địa chỉ</span>
            <span>:</span>
            <span>{formData.company_address}</span>
          </div>

          <div className="preview-info-row">
            <span className="preview-info-label">Điện thoại</span>
            <span>:</span>
            <span>{formData.company_phone}</span>
          </div>

          <div className="preview-info-row">
            <span className="preview-info-label">Mã số thuế</span>
            <span>:</span>
            <span>{formData.company_tax_code}</span>
          </div>

          <div className="preview-info-row">
            <span className="preview-info-label">Tài khoản</span>
            <span>:</span>
            <span>{formData.company_bank_account}</span>
          </div>

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

        <p className="preview-introduction">
          Các bên cùng nhau thỏa thuận ký kết Hợp đồng dịch vụ du lịch lữ hành
          (“Hợp đồng”) với các điều khoản và điều kiện sau:
        </p>

        <section className="preview-article">
          <h2>ĐIỀU 1. NỘI DUNG HỢP ĐỒNG</h2>

          <h3>1.1. Nội dung công việc</h3>

          {renderTextLines(formData.work_content)}
          {renderTextLines(formData.service_content)}

          <h3>1.2. Chương trình tham quan</h3>

          {renderTextLines(formData.tour_program)}

          <h3>1.3. Thời gian thực hiện</h3>

          {departures.map((item, index) => (
            <div key={index} className="preview-departure">
              {departures.length > 1 && (
                <>
                  <strong>
                    Đợt {String(index + 1).padStart(2, "0")}:
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
                  <tr key={index}>
                    <td>{index + 1}</td>

                    <td className="preview-table-text">
                      {item.item_name || "Chưa nhập hạng mục"}
                    </td>

                    <td>
                      {new Intl.NumberFormat("vi-VN").format(
                        Number(item.quantity || 0),
                      )}
                    </td>

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
            <strong>Bằng chữ:</strong> {totalAmountInWords || "Không đồng"}.
          </p>

          <p className="preview-paragraph">
            Giá hợp đồng{" "}
            {formData.vat_type === "NO_VAT" ? "chưa bao gồm" : "đã bao gồm"}{" "}
            thuế giá trị gia tăng (VAT), các loại thuế, phí, lệ phí và toàn bộ
            chi phí cần thiết để thực hiện đầy đủ các nội dung công việc theo
            Hợp đồng.
          </p>

          <h3>2.2. Giá trị thanh toán</h3>

          <p className="preview-paragraph">
            Giá trị thanh toán thực tế được xác định trên cơ sở khối lượng dịch
            vụ thực tế đã thực hiện, số lượng người tham gia thực tế, các khối
            lượng phát sinh được chấp thuận và các khoản giảm trừ theo thỏa
            thuận của các bên.
          </p>
        </section>

        <section className="preview-article">
          <h2>ĐIỀU 3. PHƯƠNG THỨC VÀ TIẾN ĐỘ THANH TOÁN</h2>

          <h3>3.1. Đồng tiền thanh toán</h3>

          <p className="preview-paragraph">
            Đồng tiền sử dụng trong thanh toán là Việt Nam đồng (VNĐ).
          </p>

          <h3>3.2. Phương thức thanh toán</h3>

          <p className="preview-paragraph">
            Bên A thực hiện thanh toán bằng hình thức chuyển khoản vào tài khoản
            của Bên B theo thông tin sau:
          </p>

          <p className="preview-paragraph preview-indent">
            – Tên tài khoản:{" "}
            {formData.vat_type === "NO_VAT"
              ? (formData.company_rep_name || "")
                  .replace(/^\((Ông|Bà)\)\s*/i, "")
                  .replace(/^(Ông|Bà)[\s.:]*/i, "")
                  .trim()
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
                <strong>{formatCurrency(formData.advance_amount)} đồng</strong>{" "}
                (Bằng chữ: {advanceAmountInWords} đồng)
                {formData.advance_due_date
                  ? `, thời hạn tạm ứng đến ngày ${formatDate(
                      formData.advance_due_date,
                    )}.`
                  : " sau khi ký kết hợp đồng theo thời hạn hai bên thống nhất."}
              </p>

              <p className="preview-paragraph">
                <strong>b) Thanh toán giá trị còn lại:</strong> Bên A thanh toán
                cho Bên B số tiền còn lại sau khi trừ giá trị đã tạm ứng, dự
                kiến là{" "}
                <strong>{formatCurrency(remainingPaymentAmount)} đồng</strong>{" "}
                và các khoản chi phí phát sinh (nếu có), trong vòng{" "}
                <strong>{formData.advance_date} ngày</strong> sau khi Bên B hoàn
                thành dịch vụ và cung cấp đầy đủ hồ sơ thanh toán hợp lệ.
              </p>
            </>
          ) : (
            <p className="preview-paragraph">
              Bên A thanh toán cho Bên B 100% giá trị thanh toán sau khi Bên B
              hoàn thành dịch vụ, hai bên nghiệm thu và Bên B cung cấp đầy đủ hồ
              sơ thanh toán hợp lệ.
            </p>
          )}

          <p className="preview-paragraph">
            <strong>c) Hồ sơ thanh toán gồm:</strong>
          </p>

          <p className="preview-paragraph preview-indent">
            – Văn bản đề nghị thanh toán của Bên B;
          </p>

          <p className="preview-paragraph preview-indent">
            – Hóa đơn giá trị gia tăng hợp pháp;
          </p>

          <p className="preview-paragraph preview-indent">
            – Biên bản nghiệm thu và thanh lý hợp đồng;
          </p>

          <p className="preview-paragraph preview-indent">
            – Biên bản xác nhận khối lượng phát sinh, nếu có;
          </p>

          <p className="preview-paragraph preview-indent">
            – Các tài liệu khác theo thỏa thuận của hai bên.
          </p>
        </section>

        <section className="preview-article">
          <h2>ĐIỀU 4. QUYỀN VÀ TRÁCH NHIỆM CỦA BÊN A</h2>
          {renderArticleContent(formData.article_4)}
        </section>

        <section className="preview-article">
          <h2>ĐIỀU 5. QUYỀN VÀ TRÁCH NHIỆM CỦA BÊN B</h2>
          {renderArticleContent(formData.article_5)}
        </section>

        <section className="preview-article">
          <h2>ĐIỀU 6. QUẢN LÝ, XÁC NHẬN VÀ THANH TOÁN CHI PHÍ PHÁT SINH</h2>
          {renderArticleContent(formData.article_6)}
        </section>

        <section className="preview-article">
          <h2>ĐIỀU 7. SỰ KIỆN BẤT KHẢ KHÁNG</h2>
          {renderArticleContent(formData.article_7)}
        </section>

        <section className="preview-article">
          <h2>ĐIỀU 8. PHẠT VI PHẠM HỢP ĐỒNG VÀ BỒI THƯỜNG THIỆT HẠI</h2>
          {renderArticleContent(formData.article_8)}
        </section>

        <section className="preview-article">
          <h2>ĐIỀU 9. LUẬT ÁP DỤNG VÀ GIẢI QUYẾT TRANH CHẤP</h2>
          {renderArticleContent(formData.article_9)}
        </section>

        <section className="preview-article">
          <h2>ĐIỀU 10. BẢO MẬT THÔNG TIN VÀ DỮ LIỆU CÁ NHÂN</h2>
          {renderArticleContent(formData.article_10)}
        </section>

        <section className="preview-article">
          <h2>ĐIỀU 11. ĐIỀU KHOẢN CHUNG</h2>
          {renderArticleContent(formData.article_11)}
        </section>

        <section className="preview-signature-section">
          <div className="preview-signature-box">
            <p className="preview-signature-title">ĐẠI DIỆN BÊN A</p>

            <p className="preview-signature-position">
              {formData.customer_rep_title || "CHỨC VỤ"}
            </p>

            <div className="preview-signature-space" />

            <p className="preview-signature-name">
              {(formData.customer_rep_name || "")
                .replace(/^\((Ông|Bà)\)\s*/i, "")
                .replace(/^(Ông|Bà)[\s.:]*/i, "")
                .trim()}
            </p>
          </div>

          <div className="preview-signature-box">
            <p className="preview-signature-title">ĐẠI DIỆN BÊN B</p>

            <p className="preview-signature-position">
              {formData.company_rep_title || "GIÁM ĐỐC"}
            </p>

            <div className="preview-signature-space" />

            <p className="preview-signature-name">
              {(formData.company_rep_name || "")
                .replace(/^\((Ông|Bà)\)\s*/i, "")
                .replace(/^(Ông|Bà)[\s.:]*/i, "")
                .trim()}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

const ContractInput = ({ label, required = false, children }) => {
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

const ContractClause = ({ title, children }) => {
  return (
    <div className="contract-clause">
      <h4>{title}</h4>
      {children}
    </div>
  );
};

const FixedClause = ({ eventKey, title }) => {
  return (
    <Accordion.Item eventKey={eventKey}>
      <Accordion.Header>{title}</Accordion.Header>

      <Accordion.Body>
        <div className="contract-fixed-notice">
          Nội dung điều khoản được lấy từ mẫu hợp đồng đã chọn. Người dùng không
          cần nhập lại tại đây.
        </div>
      </Accordion.Body>
    </Accordion.Item>
  );
};

export default ContractCreate;
