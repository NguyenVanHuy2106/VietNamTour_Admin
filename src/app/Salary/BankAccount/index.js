import React, { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";

import {
  FaBuilding,
  FaCheckCircle,
  FaCreditCard,
  FaEdit,
  FaExclamationTriangle,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaTrashAlt,
  FaUniversity,
  FaUser,
} from "react-icons/fa";

import APIToken from "../../../config/APIToken";

import "./index.css";

const BankAccount = () => {
  // ==========================================================
  // DATA
  // ==========================================================

  const [users, setUsers] = useState([]);

  const [banks, setBanks] = useState([]);

  const [bankAccounts, setBankAccounts] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState("");

  const [existingAccount, setExistingAccount] = useState(null);

  // ==========================================================
  // MODAL
  // ==========================================================

  const [showAccountModal, setShowAccountModal] = useState(false);

  const [modalMode, setModalMode] = useState("CREATE");

  // ==========================================================
  // LOADING
  // ==========================================================

  const [pageLoading, setPageLoading] = useState(true);

  const [usersLoading, setUsersLoading] = useState(false);

  const [banksLoading, setBanksLoading] = useState(false);

  const [accountsLoading, setAccountsLoading] = useState(false);

  const [accountLoading, setAccountLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [accountSearch, setAccountSearch] = useState("");

  const [bankSearch, setBankSearch] = useState("");

  const [showBankList, setShowBankList] = useState(false);

  // ==========================================================
  // FORM
  // ==========================================================

  const initialForm = {
    bank_bin: "",
    bank_code: "",
    bank_name: "",
    bank_short_name: "",
    account_number: "",
    account_name: "",
  };

  const [form, setForm] = useState(initialForm);

  // ==========================================================
  // USER HELPERS
  // ==========================================================

  const getUserRawName = (user) => {
    return user?.name || user?.full_name || user?.username || "Nhân viên";
  };

  const getUserName = (user) => {
    const userId = user?.user_id || "---";

    return `${userId} - ${getUserRawName(user)}`;
  };

  const getUserPosition = (user) => {
    return user?.position || user?.role_name || user?.role || "Nhân viên";
  };

  const getUserById = (userId) => {
    return (
      users.find((user) => Number(user.user_id) === Number(userId)) || null
    );
  };

  // ==========================================================
  // SELECTED USER
  // ==========================================================

  const selectedUser = useMemo(() => {
    if (!selectedUserId) {
      return null;
    }

    return (
      users.find((item) => Number(item.user_id) === Number(selectedUserId)) ||
      null
    );
  }, [users, selectedUserId]);

  // ==========================================================
  // SELECTED BANK
  // ==========================================================

  const selectedBank = useMemo(() => {
    if (!form.bank_bin) {
      return null;
    }

    return (
      banks.find((item) => String(item.bin) === String(form.bank_bin)) || null
    );
  }, [banks, form.bank_bin]);

  // ==========================================================
  // FILTER BANK
  // ==========================================================

  const filteredBanks = useMemo(() => {
    const keyword = bankSearch.trim().toLowerCase();

    if (!keyword) {
      return banks;
    }

    return banks.filter((bank) => {
      const name = String(bank.name || "").toLowerCase();

      const shortName = String(bank.shortName || "").toLowerCase();

      const code = String(bank.code || "").toLowerCase();

      const bin = String(bank.bin || "").toLowerCase();

      return (
        name.includes(keyword) ||
        shortName.includes(keyword) ||
        code.includes(keyword) ||
        bin.includes(keyword)
      );
    });
  }, [banks, bankSearch]);

  // ==========================================================
  // FILTER ACCOUNT
  // ==========================================================

  const filteredBankAccounts = useMemo(() => {
    const keyword = accountSearch.trim().toLowerCase();

    if (!keyword) {
      return bankAccounts;
    }

    return bankAccounts.filter((account) => {
      const user = users.find(
        (item) => Number(item.user_id) === Number(account.user_id),
      );

      const employeeName = String(getUserRawName(user)).toLowerCase();

      const employeeId = String(account.user_id || "").toLowerCase();

      const bankName = String(account.bank_name || "").toLowerCase();

      const bankShortName = String(account.bank_short_name || "").toLowerCase();

      const bankCode = String(account.bank_code || "").toLowerCase();

      const accountNumber = String(account.account_number || "").toLowerCase();

      const accountName = String(account.account_name || "").toLowerCase();

      return (
        employeeName.includes(keyword) ||
        employeeId.includes(keyword) ||
        bankName.includes(keyword) ||
        bankShortName.includes(keyword) ||
        bankCode.includes(keyword) ||
        accountNumber.includes(keyword) ||
        accountName.includes(keyword)
      );
    });
  }, [accountSearch, bankAccounts, users]);

  // ==========================================================
  // RESET
  // ==========================================================

  const resetForm = () => {
    setSelectedUserId("");

    setExistingAccount(null);

    setForm(initialForm);

    setBankSearch("");

    setShowBankList(false);
  };

  // ==========================================================
  // FETCH USERS
  // ==========================================================

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);

      const res = await APIToken.get("/user/get");

      const responseData = res?.data?.data;

      const list = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.data)
          ? responseData.data
          : [];

      setUsers(list);
    } catch (error) {
      console.error("Fetch users error:", error);

      setUsers([]);

      alert(
        error?.response?.data?.message || "Không thể lấy danh sách nhân viên.",
      );
    } finally {
      setUsersLoading(false);
    }
  };

  // ==========================================================
  // FETCH BANKS
  // ==========================================================

  const fetchBanks = async () => {
    try {
      setBanksLoading(true);

      const res = await APIToken.get("/salary/banks");

      setBanks(res?.data?.data || []);
    } catch (error) {
      console.error("Fetch banks error:", error);

      setBanks([]);

      alert(
        error?.response?.data?.message || "Không thể lấy danh sách ngân hàng.",
      );
    } finally {
      setBanksLoading(false);
    }
  };

  // ==========================================================
  // FETCH ALL ACCOUNTS
  // ==========================================================

  const fetchAllBankAccounts = async () => {
    try {
      setAccountsLoading(true);

      const res = await APIToken.get("/salary/bank-accounts");

      setBankAccounts(res?.data?.data || []);
    } catch (error) {
      console.error("Fetch all bank accounts error:", error);

      setBankAccounts([]);

      alert(
        error?.response?.data?.message ||
          "Không thể lấy danh sách tài khoản ngân hàng.",
      );
    } finally {
      setAccountsLoading(false);
    }
  };

  // ==========================================================
  // FETCH ACCOUNT BY USER
  // ==========================================================

  const fetchBankAccount = async (userId) => {
    if (!userId) {
      setExistingAccount(null);

      setForm(initialForm);

      setBankSearch("");

      return;
    }

    try {
      setAccountLoading(true);

      const res = await APIToken.get(`/salary/bank-account/${userId}`);

      const account = res?.data?.data || null;

      setExistingAccount(account);

      if (!account) {
        setForm(initialForm);

        setBankSearch("");

        return;
      }

      setForm({
        bank_bin: String(account.bank_bin || ""),

        bank_code: account.bank_code || "",

        bank_name: account.bank_name || "",

        bank_short_name: account.bank_short_name || "",

        account_number: account.account_number || "",

        account_name: account.account_name || "",
      });

      setBankSearch(account.bank_short_name || account.bank_name || "");
    } catch (error) {
      console.error("Fetch account error:", error);

      setExistingAccount(null);

      setForm(initialForm);

      setBankSearch("");
    } finally {
      setAccountLoading(false);
    }
  };

  // ==========================================================
  // INIT
  // ==========================================================

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setPageLoading(true);

        await Promise.all([fetchUsers(), fetchBanks(), fetchAllBankAccounts()]);
      } finally {
        setPageLoading(false);
      }
    };

    loadInitial();
  }, []);

  // ==========================================================
  // OPEN CREATE
  // ==========================================================

  const handleOpenCreateModal = () => {
    setModalMode("CREATE");

    resetForm();

    setShowAccountModal(true);
  };

  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  const handleOpenEditModal = (account) => {
    setModalMode("EDIT");

    setSelectedUserId(String(account.user_id));

    setExistingAccount(account);

    setForm({
      bank_bin: String(account.bank_bin || ""),

      bank_code: account.bank_code || "",

      bank_name: account.bank_name || "",

      bank_short_name: account.bank_short_name || "",

      account_number: account.account_number || "",

      account_name: account.account_name || "",
    });

    setBankSearch(account.bank_short_name || account.bank_name || "");

    setShowBankList(false);

    setShowAccountModal(true);
  };

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setShowAccountModal(false);

    resetForm();
  };

  // ==========================================================
  // SELECT USER
  // ==========================================================

  const handleSelectUser = async (e) => {
    const userId = e.target.value;

    setSelectedUserId(userId);

    setExistingAccount(null);

    setForm(initialForm);

    setBankSearch("");

    setShowBankList(false);

    if (userId) {
      await fetchBankAccount(userId);
    }
  };

  // ==========================================================
  // SELECT BANK
  // ==========================================================

  const handleSelectBank = (bank) => {
    setForm((prev) => ({
      ...prev,

      bank_bin: String(bank.bin || ""),

      bank_code: bank.code || "",

      bank_name: bank.name || "",

      bank_short_name: bank.shortName || "",
    }));

    setBankSearch(bank.shortName || bank.name || "");

    setShowBankList(false);
  };

  // ==========================================================
  // ACCOUNT NUMBER
  // ==========================================================

  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,

      account_number: value,
    }));
  };

  // ==========================================================
  // ACCOUNT NAME
  // ==========================================================

  const handleAccountNameChange = (e) => {
    setForm((prev) => ({
      ...prev,

      account_name: e.target.value.toUpperCase(),
    }));
  };

  // ==========================================================
  // VALIDATE
  // ==========================================================

  const validateForm = () => {
    if (!selectedUserId) {
      alert("Vui lòng chọn nhân viên.");

      return false;
    }

    if (!form.bank_bin) {
      alert("Vui lòng chọn ngân hàng.");

      return false;
    }

    if (!form.account_number) {
      alert("Vui lòng nhập số tài khoản.");

      return false;
    }

    if (form.account_number.length < 6) {
      alert("Số tài khoản không hợp lệ.");

      return false;
    }

    if (!form.account_name.trim()) {
      alert("Vui lòng nhập tên chủ tài khoản.");

      return false;
    }

    return true;
  };

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const employeeName = getUserName(selectedUser);

    const confirmed = window.confirm(
      `${
        modalMode === "EDIT"
          ? "Xác nhận cập nhật tài khoản?"
          : "Xác nhận lưu tài khoản?"
      }\n\n` +
        `Nhân viên: ${employeeName}\n` +
        `Ngân hàng: ${form.bank_short_name || form.bank_name}\n` +
        `Số tài khoản: ${form.account_number}\n` +
        `Chủ tài khoản: ${form.account_name}`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      const res = await APIToken.post("/salary/bank-account/save", {
        user_id: Number(selectedUserId),

        bank_bin: form.bank_bin,

        bank_code: form.bank_code,

        bank_name: form.bank_name,

        bank_short_name: form.bank_short_name,

        account_number: form.account_number,

        account_name: form.account_name.trim().toUpperCase(),
      });

      alert(res?.data?.message || "Lưu tài khoản ngân hàng thành công.");

      await fetchAllBankAccounts();

      setShowAccountModal(false);

      resetForm();
    } catch (error) {
      console.error("Save bank account error:", error);

      alert(
        error?.response?.data?.message || "Không thể lưu tài khoản ngân hàng.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDeleteAccount = async (account) => {
    const user = getUserById(account.user_id);

    const confirmed = window.confirm(
      `Xác nhận xoá tài khoản nhận lương?\n\n` +
        `Nhân viên: ${getUserName(user)}\n` +
        `Ngân hàng: ${account.bank_short_name || account.bank_name}\n` +
        `Số tài khoản: ${account.account_number}\n\n` +
        `Sau khi xoá, nhân viên sẽ không thể tạo VietQR nhận lương cho đến khi khai báo lại.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(account.user_bank_account_id);

      const res = await APIToken.delete(
        `/salary/bank-account/delete/${account.user_bank_account_id}`,
      );

      alert(res?.data?.message || "Đã xoá tài khoản nhận lương.");

      await fetchAllBankAccounts();
    } catch (error) {
      console.error("Delete bank account error:", error);

      alert(
        error?.response?.data?.message || "Không thể xoá tài khoản ngân hàng.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================================
  // PAGE LOADING
  // ==========================================================

  if (pageLoading) {
    return (
      <Container fluid className="bank-account-page">
        <div className="bank-account-loading">
          <Spinner animation="border" />

          <span>Đang tải dữ liệu...</span>
        </div>
      </Container>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <Container fluid className="bank-account-page">
        {/* HEADER */}

        <div className="bank-account-page-header">
          <div className="bank-account-header-icon">
            <FaBuilding />
          </div>

          <div>
            <h4>Quản lý tài khoản nhận lương</h4>

            <p>
              Quản lý tài khoản ngân hàng dùng để thanh toán lương cho nhân viên
            </p>
          </div>
        </div>

        <Row className="justify-content-center">
          <Col xl={11} lg={12} md={12}>
            {/* INFO */}

            <Alert variant="primary" className="bank-account-info-alert">
              <FaShieldAlt />

              <div>
                <strong>Thông tin tài khoản nhận lương</strong>

                <span>
                  Hệ thống chỉ lưu ngân hàng, số tài khoản và tên chủ tài khoản.
                  Không lưu mật khẩu, OTP hoặc thông tin đăng nhập ngân hàng.
                </span>
              </div>
            </Alert>

            {/* MANAGEMENT */}

            <Card className="bank-management-card border-0">
              <Card.Body>
                <div className="bank-management-header">
                  <div>
                    <h5>Danh sách tài khoản nhận lương</h5>

                    <p>
                      Theo dõi và quản lý tài khoản ngân hàng của toàn bộ nhân
                      viên
                    </p>
                  </div>

                  <div className="bank-management-header-actions">
                    <Badge bg="primary" className="bank-total-badge">
                      {bankAccounts.length} tài khoản
                    </Badge>

                    <Button
                      type="button"
                      className="bank-add-btn"
                      onClick={handleOpenCreateModal}
                    >
                      <FaPlus />
                      Thêm tài khoản
                    </Button>
                  </div>
                </div>

                {/* SEARCH */}

                <div className="bank-management-search">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>

                    <Form.Control
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      placeholder="Tìm theo ID, tên nhân viên, ngân hàng, số tài khoản, chủ tài khoản..."
                    />
                  </InputGroup>
                </div>

                {/* TABLE */}

                <div className="bank-management-table-wrap">
                  <table className="bank-management-table">
                    <thead>
                      <tr>
                        <th>ID</th>

                        <th>Nhân viên</th>

                        <th>Ngân hàng</th>

                        <th>Số tài khoản</th>

                        <th>Chủ tài khoản</th>

                        <th className="text-center">Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {accountsLoading ? (
                        <tr>
                          <td colSpan="6" className="bank-management-empty">
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                            Đang tải danh sách...
                          </td>
                        </tr>
                      ) : filteredBankAccounts.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="bank-management-empty">
                            Chưa có tài khoản nhận lương.
                          </td>
                        </tr>
                      ) : (
                        filteredBankAccounts.map((account) => {
                          const user = getUserById(account.user_id);

                          return (
                            <tr key={account.user_bank_account_id}>
                              <td>
                                <span className="bank-user-id">
                                  {account.user_id}
                                </span>
                              </td>

                              <td>
                                <div className="bank-table-user">
                                  <div className="bank-table-avatar">
                                    {String(getUserRawName(user))
                                      .trim()
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>

                                  <div className="bank-table-user-info">
                                    <strong>{getUserRawName(user)}</strong>

                                    <span>{getUserPosition(user)}</span>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <div className="bank-table-bank">
                                  <strong>
                                    {account.bank_short_name ||
                                      account.bank_code ||
                                      account.bank_name}
                                  </strong>

                                  <span>{account.bank_name}</span>
                                </div>
                              </td>

                              <td>
                                <strong className="bank-table-account-number">
                                  {account.account_number}
                                </strong>
                              </td>

                              <td>
                                <span className="bank-table-account-name">
                                  {account.account_name}
                                </span>
                              </td>

                              <td>
                                <div className="bank-table-actions">
                                  <Button
                                    type="button"
                                    className="bank-edit-btn"
                                    onClick={() => handleOpenEditModal(account)}
                                  >
                                    <FaEdit />
                                    Sửa
                                  </Button>

                                  <Button
                                    type="button"
                                    className="bank-delete-btn"
                                    disabled={
                                      deletingId ===
                                      account.user_bank_account_id
                                    }
                                    onClick={() => handleDeleteAccount(account)}
                                  >
                                    {deletingId ===
                                    account.user_bank_account_id ? (
                                      <Spinner animation="border" size="sm" />
                                    ) : (
                                      <FaTrashAlt />
                                    )}
                                    Xóa
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>

            <div className="bank-account-bottom-notice">
              <FaExclamationTriangle />

              <span>
                Tài khoản ngân hàng được lưu tại đây sẽ được sử dụng khi tạo
                VietQR thanh toán lương cho nhân viên.
              </span>
            </div>
          </Col>
        </Row>
      </Container>

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      <Modal
        show={showAccountModal}
        onHide={handleCloseModal}
        centered
        size="lg"
        backdrop="static"
        keyboard={!saving}
        className="bank-account-modal"
      >
        <Modal.Header
          closeButton={!saving}
          className="bank-account-modal-header"
        >
          <div className="bank-account-modal-title-wrap">
            <div className="bank-account-modal-icon">
              <FaUniversity />
            </div>

            <div>
              <Modal.Title>
                {modalMode === "EDIT"
                  ? "Cập nhật tài khoản nhận lương"
                  : "Khai báo tài khoản nhận lương"}
              </Modal.Title>

              <p>
                {modalMode === "EDIT"
                  ? "Điều chỉnh thông tin tài khoản ngân hàng của nhân viên"
                  : "Khai báo tài khoản ngân hàng dùng để thanh toán lương"}
              </p>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="bank-account-modal-body">
          {/* EMPLOYEE */}

          <div className="bank-modal-section">
            <div className="bank-modal-section-title">
              <div className="bank-modal-section-icon">
                <FaUser />
              </div>

              <div>
                <strong>Thông tin nhân viên</strong>

                <span>Chọn nhân viên nhận lương</span>
              </div>
            </div>

            <Form.Group>
              <Form.Label className="bank-account-label">
                Nhân viên
                <span className="text-danger ms-1">*</span>
              </Form.Label>

              <Form.Select
                className="employee-bank-select"
                value={selectedUserId}
                disabled={usersLoading || saving || modalMode === "EDIT"}
                onChange={handleSelectUser}
              >
                <option value="">-- Chọn nhân viên --</option>

                {users.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {getUserName(user)}
                    {" - "}
                    {getUserPosition(user)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {accountLoading && (
              <div className="bank-modal-account-loading">
                <Spinner animation="border" size="sm" />
                Đang tải tài khoản...
              </div>
            )}

            {selectedUser && !accountLoading && (
              <div className="bank-modal-employee">
                <div className="bank-modal-avatar">
                  {String(getUserRawName(selectedUser))
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="bank-modal-employee-info">
                  <strong>{getUserRawName(selectedUser)}</strong>

                  <span>
                    ID: {selectedUser.user_id}
                    {" • "}
                    {getUserPosition(selectedUser)}
                  </span>
                </div>

                {existingAccount && (
                  <Badge bg="success" className="bank-modal-existing-badge">
                    <FaCheckCircle />
                    Đã có tài khoản
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* BANK */}

          <div className="bank-modal-section">
            <div className="bank-modal-section-title">
              <div className="bank-modal-section-icon">
                <FaUniversity />
              </div>

              <div>
                <strong>Thông tin ngân hàng</strong>

                <span>Nhập chính xác tài khoản nhận lương của nhân viên</span>
              </div>
            </div>

            <Row className="g-3">
              {/* BANK */}

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="bank-account-label">
                    Ngân hàng
                    <span className="text-danger ms-1">*</span>
                  </Form.Label>

                  <div className="bank-select-wrapper">
                    <InputGroup className="bank-search-input">
                      <InputGroup.Text>
                        {selectedBank?.logo ? (
                          <img
                            src={selectedBank.logo}
                            alt=""
                            className="bank-input-logo"
                          />
                        ) : (
                          <FaSearch />
                        )}
                      </InputGroup.Text>

                      <Form.Control
                        value={bankSearch}
                        placeholder={
                          banksLoading
                            ? "Đang tải ngân hàng..."
                            : "Tìm MB Bank, ACB, Vietcombank..."
                        }
                        disabled={banksLoading || saving}
                        onFocus={() => setShowBankList(true)}
                        onChange={(e) => {
                          setBankSearch(e.target.value);

                          setShowBankList(true);

                          if (form.bank_bin) {
                            setForm((prev) => ({
                              ...prev,

                              bank_bin: "",

                              bank_code: "",

                              bank_name: "",

                              bank_short_name: "",
                            }));
                          }
                        }}
                      />
                    </InputGroup>

                    {showBankList && (
                      <div className="bank-select-dropdown">
                        {filteredBanks.length === 0 ? (
                          <div className="bank-select-empty">
                            Không tìm thấy ngân hàng.
                          </div>
                        ) : (
                          filteredBanks.map((bank) => (
                            <button
                              type="button"
                              key={bank.id || bank.bin}
                              className="bank-select-item"
                              onClick={() => handleSelectBank(bank)}
                            >
                              <div className="bank-select-logo">
                                {bank.logo ? (
                                  <img
                                    src={bank.logo}
                                    alt={bank.shortName || bank.code}
                                  />
                                ) : (
                                  <FaUniversity />
                                )}
                              </div>

                              <div className="bank-select-info">
                                <strong>{bank.shortName || bank.code}</strong>

                                <span>{bank.name}</span>
                              </div>

                              <small>BIN {bank.bin}</small>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </Form.Group>
              </Col>

              {/* NUMBER */}

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="bank-account-label">
                    Số tài khoản
                    <span className="text-danger ms-1">*</span>
                  </Form.Label>

                  <InputGroup className="bank-account-input">
                    <InputGroup.Text>
                      <FaCreditCard />
                    </InputGroup.Text>

                    <Form.Control
                      type="text"
                      inputMode="numeric"
                      value={form.account_number}
                      maxLength={19}
                      disabled={saving}
                      placeholder="Nhập số tài khoản"
                      onChange={handleAccountNumberChange}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              {/* NAME */}

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="bank-account-label">
                    Tên chủ tài khoản
                    <span className="text-danger ms-1">*</span>
                  </Form.Label>

                  <InputGroup className="bank-account-input">
                    <InputGroup.Text>
                      <FaUser />
                    </InputGroup.Text>

                    <Form.Control
                      value={form.account_name}
                      maxLength={150}
                      disabled={saving}
                      placeholder="VD: NGUYEN VAN HUY"
                      onChange={handleAccountNameChange}
                    />
                  </InputGroup>

                  <Form.Text className="account-name-helper">
                    Nhập đúng tên chủ tài khoản theo thông tin ngân hàng.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* BANK PREVIEW */}

            {selectedBank && (
              <div className="bank-modal-bank-preview">
                <div className="bank-modal-bank-logo">
                  {selectedBank.logo ? (
                    <img src={selectedBank.logo} alt={selectedBank.shortName} />
                  ) : (
                    <FaUniversity />
                  )}
                </div>

                <div className="bank-modal-bank-info">
                  <strong>{selectedBank.shortName || selectedBank.code}</strong>

                  <span>{selectedBank.name}</span>
                </div>

                <small>BIN: {selectedBank.bin}</small>
              </div>
            )}
          </div>

          {/* WARNING */}

          <div className="bank-account-manual-warning">
            <FaExclamationTriangle />

            <span>
              Hệ thống không tự động xác minh tên chủ tài khoản. Vui lòng kiểm
              tra chính xác ngân hàng, số tài khoản và tên chủ tài khoản trước
              khi lưu.
            </span>
          </div>
        </Modal.Body>

        <Modal.Footer className="bank-account-modal-footer">
          <Button
            type="button"
            className="bank-modal-cancel-btn"
            disabled={saving}
            onClick={handleCloseModal}
          >
            Hủy
          </Button>

          <Button
            type="button"
            className="bank-modal-save-btn"
            disabled={
              saving ||
              accountLoading ||
              !selectedUserId ||
              !form.bank_bin ||
              !form.account_number ||
              !form.account_name.trim()
            }
            onClick={handleSave}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" />
                Đang lưu...
              </>
            ) : (
              <>
                <FaCheckCircle />

                {modalMode === "EDIT" ? "Cập nhật tài khoản" : "Lưu tài khoản"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BankAccount;
