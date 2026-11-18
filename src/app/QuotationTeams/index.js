import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Button,
  Form,
  Modal,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";

import {
  FaBuilding,
  FaUsers,
  FaPlus,
  FaSyncAlt,
  FaUserPlus,
  FaUserMinus,
  FaExchangeAlt,
  FaHistory,
  FaEdit,
  FaEye,
  FaBan,
  FaCheckCircle,
  FaSearch,
  FaChevronDown,
  FaTimes,
  FaCrown,
  FaUserShield,
} from "react-icons/fa";

import { BsCaretLeft, BsCaretRight } from "react-icons/bs";

import APIToken from "../../config/APIToken";

import "./index.css";

// ==========================================================
// CONFIG
// ==========================================================

const API_PREFIX = "/quotationTeam";

// Đổi endpoint này nếu API danh sách nhân viên ERP khác.
const USER_LIST_API = "/user/get";

const ITEMS_PER_PAGE = 10;

const EMPTY_TEAM = {
  team_code: "",
  team_name: "",
  description: "",
  status: 1,
};

const EMPTY_ASSIGN = {
  user_id: "",
  team_id: "",
  reason: "",
};

// ==========================================================
// HELPERS
// ==========================================================

const getCurrentUserId = () => {
  const raw = localStorage.getItem("userId");
  const id = Number(raw);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Có lỗi xảy ra. Vui lòng thử lại.";

const unwrapList = (response) => {
  const root = response?.data;
  const data = root?.data ?? root;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const ensureSuccess = (response) => {
  if (response?.data?.success === false) {
    throw new Error(response.data.message || "Thao tác thất bại.");
  }

  return response;
};

const normalizeUsers = (list) => {
  const map = new Map();

  list.forEach((item) => {
    const id = item.user_id ?? item.userid ?? item.userId ?? item.id;

    if (id == null || id === "") return;

    const name =
      item.full_name ||
      item.fullname ||
      item.fullName ||
      item.employee_name ||
      item.username ||
      item.name ||
      [item.last_name, item.first_name].filter(Boolean).join(" ") ||
      `Nhân viên #${id}`;

    map.set(String(id), {
      ...item,
      user_id: id,
      full_name: name,
      email: item.email || "",
    });
  });

  return [...map.values()].sort((a, b) =>
    a.full_name.localeCompare(b.full_name, "vi"),
  );
};

const normalizeSearch = (text) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const matches = (keyword, ...values) =>
  !normalizeSearch(keyword) ||
  normalizeSearch(values.join(" ")).includes(normalizeSearch(keyword));

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getActionName = (action) => {
  if (action === "ADD") return "Thêm vào nhóm";
  if (action === "TRANSFER") return "Chuyển nhóm";
  if (action === "REMOVE") return "Xóa khỏi nhóm";
  return action || "—";
};

// ==========================================================
// SEARCHABLE EMPLOYEE DROPDOWN
//
// Không có search riêng bên ngoài.
// Bấm dropdown -> nhập ngay -> lọc theo từng ký tự.
// Hỗ trợ ArrowUp, ArrowDown, Enter, Escape.
// ==========================================================

const EmployeeSelect = ({
  users,
  members,
  value,
  onChange,
  disabled = false,
}) => {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);

  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const memberMap = useMemo(
    () => new Map(members.map((item) => [String(item.user_id), item])),
    [members],
  );

  const selected = users.find((user) => String(user.user_id) === String(value));

  const selectedName =
    selected?.full_name || (value ? `Nhân viên #${value}` : "");

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      matches(keyword, user.full_name, user.user_id, user.email),
    );
  }, [users, keyword]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setKeyword("");
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  const openDropdown = () => {
    if (disabled) return;

    setOpen(true);
    setKeyword("");
    setActiveIndex(0);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const chooseUser = (user) => {
    onChange(String(user.user_id));
    setKeyword("");
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (!open) {
      if (event.key === "Enter" || event.key === "ArrowDown") {
        event.preventDefault();
        openDropdown();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((current) =>
        Math.min(current + 1, filteredUsers.length - 1),
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const user = filteredUsers[activeIndex];

      if (user) chooseUser(user);
    }

    if (event.key === "Escape") {
      setOpen(false);
      setKeyword("");
    }
  };

  useEffect(() => {
    if (open) {
      itemRefs.current[activeIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [activeIndex, open]);

  return (
    <div
      className={`qteam-employee-select ${open ? "is-open" : ""}`}
      ref={wrapperRef}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`qteam-select-control ${disabled ? "is-disabled" : ""}`}
        onClick={openDropdown}
      >
        {open ? (
          <input
            ref={inputRef}
            value={keyword}
            placeholder="Gõ tên hoặc mã nhân viên..."
            onChange={(event) => {
              setKeyword(event.target.value);
              setActiveIndex(0);
            }}
            onClick={(event) => event.stopPropagation()}
          />
        ) : (
          <span
            className={
              selectedName ? "qteam-selected-text" : "qteam-placeholder"
            }
          >
            {selectedName || "Chọn nhân viên..."}
          </span>
        )}

        <FaChevronDown />
      </div>

      {open && (
        <div className="qteam-select-dropdown">
          <div className="qteam-select-meta">
            {filteredUsers.length} nhân viên phù hợp
          </div>

          <div className="qteam-select-options" role="listbox">
            {filteredUsers.length === 0 ? (
              <div className="qteam-select-empty">Không tìm thấy nhân viên</div>
            ) : (
              filteredUsers.map((user, index) => {
                const member = memberMap.get(String(user.user_id));

                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={String(value) === String(user.user_id)}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    key={user.user_id}
                    className={`qteam-select-option ${
                      activeIndex === index ? "highlighted" : ""
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      chooseUser(user);
                    }}
                  >
                    <span className="qteam-avatar">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>

                    <span className="qteam-option-info">
                      <strong>{user.full_name}</strong>

                      <small>
                        NV #{user.user_id}
                        {member
                          ? ` · ${member.team_name}`
                          : " · Chưa phân nhóm"}
                      </small>
                    </span>

                    {String(value) === String(user.user_id) && (
                      <FaCheckCircle className="qteam-option-check" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================================
// MAIN COMPONENT
// ==========================================================

const QuotationTeams = () => {
  // --------------------------------------------------------
  // DATA
  // --------------------------------------------------------

  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [adminByTeam, setAdminByTeam] = useState({});
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);

  // --------------------------------------------------------
  // LOADING
  // --------------------------------------------------------

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [error, setError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [historyError, setHistoryError] = useState("");

  // --------------------------------------------------------
  // NAVIGATION / FILTERS
  // --------------------------------------------------------

  const [activeTab, setActiveTab] = useState("teams");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  // --------------------------------------------------------
  // TEAM FORM
  // --------------------------------------------------------

  const [showTeamModal, setShowTeamModal] = useState(false);

  const [editTeam, setEditTeam] = useState(null);

  const [teamForm, setTeamForm] = useState({
    ...EMPTY_TEAM,
  });

  const [teamError, setTeamError] = useState("");

  // --------------------------------------------------------
  // ASSIGN FORM
  // --------------------------------------------------------

  const [showAssignModal, setShowAssignModal] = useState(false);

  const [assignForm, setAssignForm] = useState({
    ...EMPTY_ASSIGN,
  });

  const [assignError, setAssignError] = useState("");

  // Chỉ bổ sung nghiệp vụ Admin nhóm; luồng phân nhóm cũ giữ nguyên.
  const [assignAsAdmin, setAssignAsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminTeam, setAdminTeam] = useState(null);
  const [adminTargetId, setAdminTargetId] = useState("");
  const [adminRoleError, setAdminRoleError] = useState("");

  // --------------------------------------------------------
  // DETAIL / CONFIRM
  // --------------------------------------------------------

  const [detailTeam, setDetailTeam] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [confirm, setConfirm] = useState(null);
  const [confirmError, setConfirmError] = useState("");

  // --------------------------------------------------------
  // TOAST
  // --------------------------------------------------------

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const notify = useCallback((message, type = "success") => {
    setToast({
      show: true,
      type,
      message,
    });
  }, []);

  // ========================================================
  // USER MAPS
  // ========================================================

  const userMap = useMemo(
    () => new Map(users.map((user) => [String(user.user_id), user])),
    [users],
  );

  const memberMap = useMemo(
    () => new Map(members.map((member) => [String(member.user_id), member])),
    [members],
  );

  const teamMap = useMemo(
    () => new Map(teams.map((team) => [String(team.team_id), team])),
    [teams],
  );

  const userName = useCallback(
    (userId) => {
      if (userId == null) return "—";

      return userMap.get(String(userId))?.full_name || `NV #${userId}`;
    },
    [userMap],
  );

  // ========================================================
  // ADMIN NHÓM - CHỈ CHỨC NĂNG BỔ SUNG
  // ========================================================

  const getAdminId = (teamId) => adminByTeam[String(teamId)] || null;

  const isTeamAdmin = (member) =>
    String(getAdminId(member.team_id) ?? "") === String(member.user_id);

  const openAdminModal = (team, preferredUserId = null) => {
    setAdminTeam(team);
    setAdminTargetId(
      preferredUserId == null
        ? getAdminId(team.team_id) || ""
        : String(preferredUserId),
    );
    setAdminRoleError("");
    setShowAdminModal(true);
  };

  const saveAdminRole = async () => {
    if (saving || !adminTeam) return;

    const actorId = getCurrentUserId();
    if (!actorId) {
      setAdminRoleError("Không tìm thấy userId đăng nhập.");
      return;
    }

    const oldAdmin = getAdminId(adminTeam.team_id);
    const newAdmin = adminTargetId || null;
    if ((oldAdmin || null) === newAdmin) {
      setAdminRoleError("Bạn chưa thay đổi Admin của nhóm.");
      return;
    }

    // Chỉ cho phép chọn người đang thuộc đúng nhóm.
    if (
      newAdmin !== null &&
      !members.some(
        (member) =>
          String(member.team_id) === String(adminTeam.team_id) &&
          String(member.user_id) === newAdmin,
      )
    ) {
      setAdminRoleError("Người được chọn chưa thuộc nhóm kinh doanh này.");
      return;
    }

    try {
      setSaving(true);
      setAdminRoleError("");
      const response = ensureSuccess(
        await APIToken.put(`${API_PREFIX}/${adminTeam.team_id}/admin`, {
          user_id: newAdmin === null ? null : Number(newAdmin),
          performed_by: actorId,
        }),
      );
      setShowAdminModal(false);
      notify(response.data?.message || "Đã cập nhật Admin nhóm.");
      await getData(true);
    } catch (err) {
      setAdminRoleError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // GET DATA
  // ========================================================

  const getData = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");
      setUsersError("");

      const [teamsResult, membersResult, usersResult] =
        await Promise.allSettled([
          APIToken.get(API_PREFIX),
          APIToken.get(`${API_PREFIX}/members`),
          APIToken.get(USER_LIST_API),
        ]);

      if (teamsResult.status === "rejected") {
        throw teamsResult.reason;
      }

      if (membersResult.status === "rejected") {
        throw membersResult.reason;
      }

      ensureSuccess(teamsResult.value);
      ensureSuccess(membersResult.value);

      const teamRows = unwrapList(teamsResult.value);
      const memberRows = unwrapList(membersResult.value);
      setTeams(teamRows);
      setMembers(memberRows);

      // API riêng để xác định Admin thật, kể cả khi /members chưa trả role.
      const adminResults = await Promise.allSettled(
        teamRows.map((team) =>
          APIToken.get(`${API_PREFIX}/${team.team_id}/admin`),
        ),
      );
      const nextAdmins = {};
      adminResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const admin = result.value?.data?.data?.admin;
          if (admin?.user_id != null) {
            nextAdmins[String(teamRows[index].team_id)] = String(admin.user_id);
          }
        }
      });
      // Nếu API Admin chưa trả dữ liệu, tận dụng role từ danh sách thành viên.
      memberRows.forEach((member) => {
        if (
          String(member.role || "").toUpperCase() === "ADMIN" &&
          !nextAdmins[String(member.team_id)]
        ) {
          nextAdmins[String(member.team_id)] = String(member.user_id);
        }
      });
      setAdminByTeam(nextAdmins);

      if (usersResult.status === "fulfilled") {
        try {
          ensureSuccess(usersResult.value);

          const list = normalizeUsers(unwrapList(usersResult.value));

          setUsers(list);

          if (!list.length) {
            setUsersError("Chưa tải được danh sách nhân viên ERP.");
          }
        } catch (err) {
          setUsers([]);
          setUsersError(getErrorMessage(err));
        }
      } else {
        setUsers([]);
        setUsersError(`Không thể tải nhân viên từ ${USER_LIST_API}.`);
      }
    } catch (err) {
      console.error("QuotationTeams getData:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const getHistory = useCallback(async (requestedPage = 1) => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const response = ensureSuccess(
        await APIToken.get(`${API_PREFIX}/history`, {
          params: {
            page: requestedPage,
            limit: ITEMS_PER_PAGE,
          },
        }),
      );

      const rows = unwrapList(response);

      setHistory(rows);
      setHistoryTotal(Number(response.data?.pagination?.total ?? rows.length));
    } catch (err) {
      setHistory([]);
      setHistoryError(getErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);

  useEffect(() => {
    if (activeTab === "history") {
      getHistory(historyPage);
    }
  }, [activeTab, historyPage, getHistory]);

  const handleRefresh = async () => {
    await getData(true);

    if (activeTab === "history") {
      await getHistory(historyPage);
    }
  };

  // ========================================================
  // STATISTICS
  // ========================================================

  const stats = useMemo(() => {
    const assignedIds = new Set(members.map((item) => String(item.user_id)));

    return {
      teams: teams.length,

      active: teams.filter((team) => Number(team.status) === 1).length,

      members: members.length,

      unassigned: users.filter((user) => !assignedIds.has(String(user.user_id)))
        .length,
    };
  }, [teams, members, users]);

  // ========================================================
  // SEARCH / FILTER
  // ========================================================

  const filteredTeams = useMemo(
    () =>
      teams.filter((team) => {
        if (statusFilter !== "all" && String(team.status) !== statusFilter) {
          return false;
        }

        return matches(
          search,
          team.team_code,
          team.team_name,
          team.description,
        );
      }),
    [teams, statusFilter, search],
  );

  const filteredMembers = useMemo(
    () =>
      members.filter((member) => {
        if (teamFilter !== "all" && String(member.team_id) !== teamFilter) {
          return false;
        }

        return matches(
          search,
          member.user_id,
          userName(member.user_id),
          member.team_code,
          member.team_name,
        );
      }),
    [members, teamFilter, search, userName],
  );

  const filteredData = activeTab === "teams" ? filteredTeams : filteredMembers;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
  );

  const safePage = Math.min(page, totalPages);

  const currentItems = filteredData.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const historyPages = Math.max(1, Math.ceil(historyTotal / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, statusFilter, teamFilter]);

  // ========================================================
  // TEAM MODAL
  // ========================================================

  const openAddTeam = () => {
    setEditTeam(null);
    setTeamForm({ ...EMPTY_TEAM });
    setTeamError("");
    setShowTeamModal(true);
  };

  const openEditTeam = (team) => {
    setEditTeam(team);

    setTeamForm({
      team_code: team.team_code || "",
      team_name: team.team_name || "",
      description: team.description || "",
      status: Number(team.status),
    });

    setTeamError("");
    setShowTeamModal(true);
  };

  const saveTeam = async () => {
    if (saving) return;

    const actorId = getCurrentUserId();

    if (!actorId) {
      setTeamError(
        "Không tìm thấy userId trong localStorage. Vui lòng đăng nhập lại.",
      );
      return;
    }

    const team_code = teamForm.team_code.trim().toUpperCase();

    const team_name = teamForm.team_name.trim();
    const description = teamForm.description.trim();

    if (!/^[A-Z0-9_-]{2,30}$/.test(team_code)) {
      setTeamError("Mã nhóm từ 2–30 ký tự, chỉ gồm chữ in hoa, số, _ hoặc -.");
      return;
    }

    if (!team_name || team_name.length > 150) {
      setTeamError("Tên nhóm phải từ 1–150 ký tự.");
      return;
    }

    try {
      setSaving(true);
      setTeamError("");

      const payload = {
        team_code,
        team_name,
        description,
        status: Number(teamForm.status),
      };

      const response = editTeam
        ? await APIToken.put(`${API_PREFIX}/${editTeam.team_id}`, {
            ...payload,
            updated_by: actorId,
          })
        : await APIToken.post(API_PREFIX, {
            ...payload,
            created_by: actorId,
          });

      ensureSuccess(response);

      setShowTeamModal(false);

      notify(response.data?.message || "Lưu nhóm kinh doanh thành công.");

      await getData(true);
    } catch (err) {
      setTeamError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // DETAIL TEAM
  // ========================================================

  const openDetail = async (team) => {
    setDetailTeam({
      ...team,
      members: members.filter(
        (m) => String(m.team_id) === String(team.team_id),
      ),
    });

    setShowDetail(true);
    setDetailLoading(true);

    try {
      const response = ensureSuccess(
        await APIToken.get(`${API_PREFIX}/${team.team_id}`),
      );

      if (response.data?.data) {
        setDetailTeam(response.data.data);
      }
    } catch (err) {
      notify(getErrorMessage(err), "danger");
    } finally {
      setDetailLoading(false);
    }
  };

  // ========================================================
  // ASSIGN / TRANSFER
  // ========================================================

  const openAssign = (teamId = null, userId = null) => {
    setAssignForm({
      user_id: userId == null ? "" : String(userId),

      team_id: teamId == null ? "" : String(teamId),

      reason: "",
    });

    setAssignAsAdmin(false);
    setAssignError("");
    setShowAssignModal(true);
  };

  const selectedMember = assignForm.user_id
    ? memberMap.get(String(assignForm.user_id))
    : null;

  const destination = assignForm.team_id
    ? teamMap.get(String(assignForm.team_id))
    : null;

  const isTransfer = Boolean(
    selectedMember &&
    destination &&
    String(selectedMember.team_id) !== String(destination.team_id),
  );

  const executeAssignment = async (payload) => {
    const actorId = getCurrentUserId();

    if (!actorId) {
      const msg = "Không tìm thấy userId đăng nhập.";

      if (confirm?.type === "transfer") {
        setConfirmError(msg);
      } else {
        setAssignError(msg);
      }
      return;
    }

    try {
      setSaving(true);

      const response = ensureSuccess(
        await APIToken.post(`${API_PREFIX}/assign`, {
          user_id: Number(payload.user_id),
          team_id: Number(payload.team_id),
          reason: payload.reason.trim(),

          // Người thực hiện lấy từ localStorage.
          performed_by: actorId,
        }),
      );

      // Giữ nguyên API phân nhóm hiện có. Chỉ gọi thêm API Admin
      // khi người dùng chủ động chọn "Bổ nhiệm Admin".
      if (payload.assignAsAdmin) {
        try {
          ensureSuccess(
            await APIToken.put(
              `${API_PREFIX}/${Number(payload.team_id)}/admin`,
              {
                user_id: Number(payload.user_id),
                performed_by: actorId,
              },
            ),
          );
          notify("Đã phân nhóm và bổ nhiệm Admin thành công.");
        } catch (adminErr) {
          // Thành viên đã được phân nhóm; không tuyên bố toàn bộ đã thành công.
          notify(
            `Đã phân nhóm nhưng chưa bổ nhiệm Admin: ${getErrorMessage(adminErr)}`,
            "danger",
          );
        }
      } else {
        notify(response.data?.message || "Phân nhóm nhân viên thành công.");
      }

      setShowAssignModal(false);
      setConfirm(null);

      await getData(true);

      setHistoryPage(1);
      if (activeTab === "history") {
        await getHistory(1);
      }
    } catch (err) {
      const message = getErrorMessage(err);

      if (confirm?.type === "transfer") {
        setConfirmError(message);
      } else {
        setAssignError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const saveAssignment = () => {
    if (!assignForm.user_id) {
      setAssignError("Vui lòng chọn nhân viên.");
      return;
    }

    if (!assignForm.team_id) {
      setAssignError("Vui lòng chọn nhóm kinh doanh.");
      return;
    }

    if (
      selectedMember &&
      String(selectedMember.team_id) === String(assignForm.team_id)
    ) {
      setAssignError("Nhân viên đã thuộc nhóm này.");
      return;
    }

    if (!destination || Number(destination.status) !== 1) {
      setAssignError("Nhóm không tồn tại hoặc đã ngừng hoạt động.");
      return;
    }

    if (isTransfer) {
      setConfirmError("");
      setShowAssignModal(false);

      setConfirm({
        type: "transfer",
        payload: { ...assignForm, assignAsAdmin },
        title: "Xác nhận chuyển nhóm",
        message:
          `Chuyển ${userName(assignForm.user_id)} ` +
          `từ "${selectedMember.team_name}" ` +
          `sang "${destination.team_name}"?`,
      });

      return;
    }

    executeAssignment({ ...assignForm, assignAsAdmin });
  };

  // ========================================================
  // REMOVE / STATUS CONFIRM
  // ========================================================

  const requestRemove = (member) => {
    setConfirmError("");

    setConfirm({
      type: "remove",
      member,
      reason: "",
      title: "Xóa nhân viên khỏi nhóm?",
      message:
        `Xóa ${userName(member.user_id)} khỏi ` +
        `"${member.team_name}"? Tài khoản ERP vẫn được giữ.`,
    });
  };

  const requestToggleStatus = (team) => {
    const status = Number(team.status) === 1 ? 0 : 1;

    setConfirmError("");

    setConfirm({
      type: "status",
      team,
      status,
      title: status === 0 ? "Ngừng hoạt động nhóm?" : "Kích hoạt nhóm?",
      message: `Bạn muốn ${
        status === 0 ? "ngừng hoạt động" : "kích hoạt"
      } "${team.team_name}"?`,
    });
  };

  const executeConfirm = async () => {
    if (!confirm || saving) return;

    if (confirm.type === "transfer") {
      await executeAssignment(confirm.payload);
      return;
    }

    const actorId = getCurrentUserId();

    if (!actorId) {
      setConfirmError("Không tìm thấy userId đăng nhập.");
      return;
    }

    try {
      setSaving(true);
      setConfirmError("");

      let response;

      if (confirm.type === "remove") {
        response = await APIToken.delete(
          `${API_PREFIX}/members/${confirm.member.user_id}`,
          {
            data: {
              reason: confirm.reason || "",
              performed_by: actorId,
            },
          },
        );
      }

      if (confirm.type === "status") {
        const team = confirm.team;

        response = await APIToken.put(`${API_PREFIX}/${team.team_id}`, {
          team_code: team.team_code,
          team_name: team.team_name,
          description: team.description || "",
          status: confirm.status,
          updated_by: actorId,
        });
      }

      ensureSuccess(response);

      notify(response?.data?.message || "Thao tác thành công.");

      setConfirm(null);
      await getData(true);

      if (activeTab === "history") {
        await getHistory(1);
      }
    } catch (err) {
      setConfirmError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const closeConfirm = () => {
    if (saving) return;

    if (confirm?.type === "transfer") {
      setShowAssignModal(true);
    }

    setConfirm(null);
    setConfirmError("");
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
    setStatusFilter("all");
    setTeamFilter("all");
  };

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="qteam-page">
      {/* HEADER */}

      <div className="qteam-header">
        <div>
          <div className="qteam-eyebrow">VIỆT NAM TOUR · KHAI BÁO</div>

          <h2>
            <FaUsers />
            Quản lý nhóm kinh doanh
          </h2>

          <p>Quản lý nhóm, phân công nhân viên và lịch sử điều chuyển.</p>
        </div>

        <div className="qteam-header-actions">
          <button
            type="button"
            className="qteam-btn-secondary"
            disabled={refreshing}
            onClick={handleRefresh}
          >
            {refreshing ? (
              <Spinner size="sm" animation="border" />
            ) : (
              <FaSyncAlt />
            )}
            Làm mới
          </button>

          {activeTab !== "history" && (
            <Button
              className="qteam-btn-primary"
              onClick={activeTab === "teams" ? openAddTeam : () => openAssign()}
            >
              <FaPlus />
              {activeTab === "teams" ? "Thêm nhóm" : "Thêm thành viên"}
            </Button>
          )}
        </div>
      </div>

      {/* STATS */}

      <div className="qteam-stats">
        <div className="qteam-stat">
          <span className="qteam-stat-icon blue">
            <FaBuilding />
          </span>

          <div>
            <span>Tổng số nhóm</span>
            <strong>{stats.teams}</strong>
          </div>
        </div>

        <div className="qteam-stat">
          <span className="qteam-stat-icon green">
            <FaCheckCircle />
          </span>

          <div>
            <span>Nhóm hoạt động</span>
            <strong>{stats.active}</strong>
          </div>
        </div>

        <div className="qteam-stat">
          <span className="qteam-stat-icon purple">
            <FaUsers />
          </span>

          <div>
            <span>Đã phân nhóm</span>
            <strong>{stats.members}</strong>
          </div>
        </div>

        <div className="qteam-stat">
          <span className="qteam-stat-icon orange">
            <FaUserPlus />
          </span>

          <div>
            <span>Chưa phân nhóm</span>
            <strong>{usersError ? "—" : stats.unassigned}</strong>
          </div>
        </div>
      </div>

      {/* TABS */}

      <div className="qteam-tabs">
        <button
          type="button"
          className={activeTab === "teams" ? "active" : ""}
          onClick={() => switchTab("teams")}
        >
          <FaBuilding />
          Nhóm kinh doanh
        </button>

        <button
          type="button"
          className={activeTab === "members" ? "active" : ""}
          onClick={() => switchTab("members")}
        >
          <FaUsers />
          Thành viên
        </button>

        <button
          type="button"
          className={activeTab === "history" ? "active" : ""}
          onClick={() => switchTab("history")}
        >
          <FaHistory />
          Lịch sử chuyển nhóm
        </button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {usersError && <Alert variant="warning">{usersError}</Alert>}

      {/* TOOLBAR */}

      {activeTab !== "history" && (
        <div className="qteam-toolbar">
          <div className="qteam-toolbar-info">
            <strong>
              {activeTab === "teams"
                ? "Danh sách nhóm kinh doanh"
                : "Danh sách thành viên"}
            </strong>

            <span>
              Có <b>{filteredData.length}</b> kết quả
            </span>
          </div>

          <div className="qteam-toolbar-actions">
            {activeTab === "teams" ? (
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="1">Đang hoạt động</option>
                <option value="0">Ngừng hoạt động</option>
              </Form.Select>
            ) : (
              <Form.Select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="all">Tất cả nhóm</option>

                {teams.map((team) => (
                  <option key={team.team_id} value={team.team_id}>
                    {team.team_name}
                  </option>
                ))}
              </Form.Select>
            )}

            <div className="qteam-search">
              <FaSearch />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === "teams"
                    ? "Tìm mã, tên nhóm..."
                    : "Tìm nhân viên..."
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}

      <div className="qteam-content-card">
        {loading ? (
          <div className="qteam-loading">
            <Spinner animation="border" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : activeTab === "teams" ? (
          currentItems.length === 0 ? (
            <div className="qteam-empty">
              <FaBuilding />
              <h4>Chưa có nhóm kinh doanh</h4>
              <p>Không tìm thấy dữ liệu phù hợp.</p>
            </div>
          ) : (
            <div className="qteam-table-wrapper">
              <table className="qteam-table">
                <thead>
                  <tr>
                    <th>Mã nhóm</th>
                    <th>Tên nhóm</th>
                    <th>Mô tả</th>
                    <th className="text-center">Thành viên</th>
                    <th className="text-center">Trạng thái</th>
                    <th className="text-center">Tác vụ</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((team) => (
                    <tr key={team.team_id}>
                      <td>
                        <span className="qteam-code">{team.team_code}</span>
                      </td>

                      <td>
                        <div className="qteam-name">
                          <span className="qteam-name-icon">
                            <FaBuilding />
                          </span>

                          <div>
                            <strong>{team.team_name}</strong>
                            <small>ID #{team.team_id}</small>
                            <small className="qteam-admin-line">
                              <FaCrown />{" "}
                              {getAdminId(team.team_id)
                                ? `Admin: ${userName(getAdminId(team.team_id))}`
                                : "Chưa có Admin nhóm"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="qteam-desc">
                          {team.description || "Chưa có mô tả"}
                        </div>
                      </td>

                      <td className="text-center">
                        <button
                          type="button"
                          className="qteam-count"
                          onClick={() => openDetail(team)}
                        >
                          <FaUsers />
                          {team.member_count || 0}
                        </button>
                      </td>

                      <td className="text-center">
                        <span
                          className={`qteam-status ${
                            Number(team.status) === 1 ? "active" : "inactive"
                          }`}
                        >
                          <i />
                          {Number(team.status) === 1
                            ? "Hoạt động"
                            : "Ngừng hoạt động"}
                        </span>
                      </td>

                      <td>
                        <div className="qteam-actions">
                          <button
                            type="button"
                            className="qteam-action view"
                            title="Chi tiết nhóm"
                            onClick={() => openDetail(team)}
                          >
                            <FaEye />
                          </button>

                          <button
                            type="button"
                            className="qteam-action add"
                            title="Thêm thành viên"
                            disabled={Number(team.status) !== 1}
                            onClick={() => openAssign(team.team_id)}
                          >
                            <FaUserPlus />
                          </button>

                          <button
                            type="button"
                            className="qteam-action admin"
                            title="Quản lý Admin nhóm"
                            onClick={() => openAdminModal(team)}
                          >
                            <FaUserShield />
                          </button>

                          <button
                            type="button"
                            className="qteam-action edit"
                            title="Sửa nhóm"
                            onClick={() => openEditTeam(team)}
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className={`qteam-action ${
                              Number(team.status) === 1 ? "danger" : "add"
                            }`}
                            title="Đổi trạng thái"
                            onClick={() => requestToggleStatus(team)}
                          >
                            {Number(team.status) === 1 ? (
                              <FaBan />
                            ) : (
                              <FaCheckCircle />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === "members" ? (
          currentItems.length === 0 ? (
            <div className="qteam-empty">
              <FaUsers />
              <h4>Chưa có thành viên</h4>
              <p>Không có nhân viên phù hợp.</p>
            </div>
          ) : (
            <div className="qteam-table-wrapper">
              <table className="qteam-table">
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Mã NV</th>
                    <th>Nhóm hiện tại</th>
                    <th>Vai trò</th>
                    <th>Ngày vào nhóm</th>
                    <th>Người phân công</th>
                    <th className="text-center">Tác vụ</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((member) => (
                    <tr key={member.user_id}>
                      <td>
                        <div className="qteam-name">
                          <span className="qteam-avatar">
                            {userName(member.user_id).charAt(0).toUpperCase()}
                          </span>

                          <div>
                            <strong>{userName(member.user_id)}</strong>

                            <small>
                              {userMap.get(String(member.user_id))?.email ||
                                "Nhân viên ERP"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="qteam-code">#{member.user_id}</span>
                      </td>

                      <td>
                        <span className="qteam-team-pill">
                          <FaBuilding />
                          {member.team_name}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`qteam-role-badge ${isTeamAdmin(member) ? "admin" : "member"}`}
                        >
                          {isTeamAdmin(member) && <FaCrown />}
                          {isTeamAdmin(member) ? "Admin nhóm" : "Thành viên"}
                        </span>
                      </td>

                      <td>{formatDate(member.joined_at)}</td>

                      <td>{userName(member.assigned_by)}</td>

                      <td>
                        <div className="qteam-actions">
                          <button
                            type="button"
                            className="qteam-action admin"
                            title="Bổ nhiệm hoặc thay đổi Admin nhóm"
                            onClick={() =>
                              openAdminModal(
                                teamMap.get(String(member.team_id)) || {
                                  team_id: member.team_id,
                                  team_name: member.team_name,
                                },
                                member.user_id,
                              )
                            }
                          >
                            <FaUserShield />
                          </button>
                          <button
                            type="button"
                            className="qteam-action edit"
                            title="Chuyển nhóm"
                            onClick={() => openAssign(null, member.user_id)}
                          >
                            <FaExchangeAlt />
                          </button>

                          <button
                            type="button"
                            className="qteam-action danger"
                            title="Xóa khỏi nhóm"
                            onClick={() => requestRemove(member)}
                          >
                            <FaUserMinus />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <>
            {historyError && (
              <Alert variant="danger" className="m-3">
                {historyError}
              </Alert>
            )}

            {historyLoading ? (
              <div className="qteam-loading">
                <Spinner animation="border" />
                <span>Đang tải lịch sử...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="qteam-empty">
                <FaHistory />
                <h4>Chưa có lịch sử</h4>
                <p>Thao tác phân nhóm sẽ được ghi nhận tại đây.</p>
              </div>
            ) : (
              <div className="qteam-table-wrapper">
                <table className="qteam-table">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Nhân viên</th>
                      <th>Hành động</th>
                      <th>Nhóm cũ</th>
                      <th>Nhóm mới</th>
                      <th>Lý do</th>
                      <th>Người thực hiện</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((item) => (
                      <tr key={item.transfer_id}>
                        <td>{formatDate(item.created_at)}</td>

                        <td>
                          <strong>{userName(item.user_id)}</strong>

                          <div className="qteam-muted">#{item.user_id}</div>
                        </td>

                        <td>
                          <span
                            className={`qteam-history-action ${String(
                              item.action || "",
                            ).toLowerCase()}`}
                          >
                            {getActionName(item.action)}
                          </span>
                        </td>

                        <td>{item.from_team_name || "—"}</td>

                        <td>{item.to_team_name || "—"}</td>

                        <td>{item.reason || "—"}</td>

                        <td>{userName(item.performed_by)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* PAGINATION */}

        {!loading &&
          (activeTab === "history"
            ? historyTotal > 0
            : filteredData.length > 0) && (
            <div className="qteam-pagination">
              <span>
                {activeTab === "history"
                  ? `Tổng ${historyTotal} lịch sử`
                  : `Hiển thị ${
                      (safePage - 1) * ITEMS_PER_PAGE + 1
                    } – ${Math.min(
                      safePage * ITEMS_PER_PAGE,
                      filteredData.length,
                    )} / ${filteredData.length}`}
              </span>

              <div className="qteam-pagination-controls">
                <button
                  type="button"
                  disabled={
                    activeTab === "history" ? historyPage <= 1 : safePage <= 1
                  }
                  onClick={() => {
                    if (activeTab === "history") {
                      setHistoryPage((p) => Math.max(1, p - 1));
                    } else {
                      setPage((p) => Math.max(1, p - 1));
                    }
                  }}
                >
                  <BsCaretLeft />
                </button>

                <span>
                  Trang{" "}
                  <b>{activeTab === "history" ? historyPage : safePage}</b>
                  {" / "}
                  <b>{activeTab === "history" ? historyPages : totalPages}</b>
                </span>

                <button
                  type="button"
                  disabled={
                    activeTab === "history"
                      ? historyPage >= historyPages
                      : safePage >= totalPages
                  }
                  onClick={() => {
                    if (activeTab === "history") {
                      setHistoryPage((p) => Math.min(historyPages, p + 1));
                    } else {
                      setPage((p) => Math.min(totalPages, p + 1));
                    }
                  }}
                >
                  <BsCaretRight />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ==================================================
          TEAM FORM MODAL
      ================================================== */}

      <Modal
        show={showTeamModal}
        onHide={() => !saving && setShowTeamModal(false)}
        centered
        backdrop={saving ? "static" : true}
        keyboard={!saving}
        dialogClassName="qteam-form-modal"
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>
            <span className="qteam-modal-icon">
              {editTeam ? <FaEdit /> : <FaPlus />}
            </span>

            <div>
              <strong>
                {editTeam
                  ? "Cập nhật nhóm kinh doanh"
                  : "Khai báo nhóm kinh doanh"}
              </strong>
              <small>Quản lý danh mục nhóm Việt Nam Tour</small>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {teamError && <Alert variant="danger">{teamError}</Alert>}

          <Form.Group className="qteam-form-group">
            <Form.Label>
              Mã nhóm <em>*</em>
            </Form.Label>

            <Form.Control
              autoFocus
              maxLength={30}
              value={teamForm.team_code}
              placeholder="Ví dụ: SALE01"
              onChange={(e) =>
                setTeamForm((prev) => ({
                  ...prev,
                  team_code: e.target.value.toUpperCase(),
                }))
              }
            />
          </Form.Group>

          <Form.Group className="qteam-form-group">
            <Form.Label>
              Tên nhóm <em>*</em>
            </Form.Label>

            <Form.Control
              maxLength={150}
              value={teamForm.team_name}
              placeholder="Ví dụ: Nhóm kinh doanh 1"
              onChange={(e) =>
                setTeamForm((prev) => ({
                  ...prev,
                  team_name: e.target.value,
                }))
              }
            />
          </Form.Group>

          <Form.Group className="qteam-form-group">
            <Form.Label>Mô tả</Form.Label>

            <Form.Control
              as="textarea"
              rows={3}
              maxLength={2000}
              value={teamForm.description}
              placeholder="Mô tả vai trò của nhóm..."
              onChange={(e) =>
                setTeamForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </Form.Group>

          <Form.Group className="qteam-form-group">
            <Form.Label>Trạng thái</Form.Label>

            <div className="qteam-status-box">
              <div>
                <strong>
                  {Number(teamForm.status) === 1
                    ? "Đang hoạt động"
                    : "Ngừng hoạt động"}
                </strong>

                <small>Nhóm đang hoạt động mới được thêm thành viên.</small>
              </div>

              <Form.Check
                type="switch"
                checked={Number(teamForm.status) === 1}
                disabled={!editTeam}
                onChange={(e) =>
                  setTeamForm((prev) => ({
                    ...prev,
                    status: e.target.checked ? 1 : 0,
                  }))
                }
              />
            </div>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            className="qteam-modal-cancel"
            disabled={saving}
            onClick={() => setShowTeamModal(false)}
          >
            Hủy
          </Button>

          <Button
            className="qteam-modal-save"
            disabled={saving}
            onClick={saveTeam}
          >
            {saving ? (
              <>
                <Spinner size="sm" animation="border" />
                Đang lưu...
              </>
            ) : (
              <>
                {editTeam ? <FaEdit /> : <FaPlus />}
                {editTeam ? "Cập nhật" : "Thêm nhóm"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ==================================================
          ASSIGN MODAL
      ================================================== */}

      <Modal
        show={showAssignModal}
        onHide={() => !saving && setShowAssignModal(false)}
        centered
        backdrop={saving ? "static" : true}
        keyboard={!saving}
        dialogClassName="qteam-form-modal qteam-assign-modal"
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>
            <span className="qteam-modal-icon">
              <FaUserPlus />
            </span>

            <div>
              <strong>Phân nhóm nhân viên</strong>
              <small>Chọn nhân viên bằng danh sách tìm kiếm.</small>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {assignError && <Alert variant="danger">{assignError}</Alert>}

          <Form.Group className="qteam-form-group">
            <Form.Label>
              Chọn nhân viên <em>*</em>
            </Form.Label>

            <EmployeeSelect
              users={users}
              members={members}
              value={assignForm.user_id}
              disabled={saving || Boolean(usersError)}
              onChange={(user_id) => {
                setAssignForm((prev) => ({
                  ...prev,
                  user_id,
                }));
                setAssignError("");
              }}
            />

            <div className="qteam-hint">
              Bấm để mở danh sách và gõ tên trực tiếp, ví dụ: H → Ha → Han.
            </div>
          </Form.Group>

          {selectedMember && (
            <div className="qteam-current-team">
              <FaBuilding />
              <div>
                <strong>Nhóm hiện tại</strong>
                <span>{selectedMember.team_name}</span>
              </div>
            </div>
          )}

          <Form.Group className="qteam-form-group">
            <Form.Label>
              Nhóm kinh doanh <em>*</em>
            </Form.Label>

            <Form.Select
              value={assignForm.team_id}
              onChange={(e) =>
                setAssignForm((prev) => ({
                  ...prev,
                  team_id: e.target.value,
                }))
              }
            >
              <option value="">-- Chọn nhóm kinh doanh --</option>

              {teams
                .filter((team) => Number(team.status) === 1)
                .map((team) => (
                  <option key={team.team_id} value={team.team_id}>
                    {team.team_code} — {team.team_name}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="qteam-form-group qteam-admin-choice">
            <Form.Check
              type="checkbox"
              id="qteam-assign-as-admin"
              label="Bổ nhiệm nhân viên này làm Admin nhóm"
              checked={assignAsAdmin}
              disabled={saving}
              onChange={(e) => setAssignAsAdmin(e.target.checked)}
            />
            <small>
              Không chọn: nhân viên là thành viên thường.
              {destination &&
                getAdminId(destination.team_id) &&
                assignAsAdmin && (
                  <>
                    {" "}
                    Nhóm đang có Admin là{" "}
                    <b>{userName(getAdminId(destination.team_id))}</b>; quyền
                    Admin sẽ được chuyển sang nhân viên này.
                  </>
                )}
            </small>
          </Form.Group>

          <Form.Group className="qteam-form-group">
            <Form.Label>Lý do phân công / chuyển nhóm</Form.Label>

            <Form.Control
              as="textarea"
              rows={3}
              maxLength={2000}
              value={assignForm.reason}
              placeholder="Nhập lý do nếu có..."
              onChange={(e) =>
                setAssignForm((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
            />
          </Form.Group>

          {isTransfer && (
            <Alert variant="warning">
              <FaExchangeAlt className="me-2" />
              Nhân viên đang thuộc nhóm khác. Thao tác này sẽ ghi lịch sử chuyển
              nhóm.
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            className="qteam-modal-cancel"
            disabled={saving}
            onClick={() => setShowAssignModal(false)}
          >
            Hủy
          </Button>

          <Button
            className="qteam-modal-save"
            disabled={saving || Boolean(usersError)}
            onClick={saveAssignment}
          >
            {saving ? (
              <>
                <Spinner size="sm" animation="border" />
                Đang xử lý...
              </>
            ) : (
              <>
                {isTransfer ? <FaExchangeAlt /> : <FaUserPlus />}
                {isTransfer ? "Chuyển nhóm" : "Thêm thành viên"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ==================================================
          DETAIL MODAL
      ================================================== */}

      <Modal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        centered
        size="lg"
        dialogClassName="qteam-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaBuilding className="me-2" />
            Chi tiết nhóm kinh doanh
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {detailLoading ? (
            <div className="qteam-loading">
              <Spinner animation="border" />
            </div>
          ) : detailTeam ? (
            <>
              <div className="qteam-detail-header">
                <span className="qteam-code">{detailTeam.team_code}</span>

                <h4>{detailTeam.team_name}</h4>

                <p>{detailTeam.description || "Chưa có mô tả"}</p>
                <div className="qteam-admin-detail">
                  <FaCrown />
                  {getAdminId(detailTeam.team_id)
                    ? `Admin nhóm: ${userName(getAdminId(detailTeam.team_id))}`
                    : "Nhóm chưa có Admin"}
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetail(false);
                      openAdminModal(detailTeam);
                    }}
                  >
                    Quản lý quyền
                  </button>
                </div>
              </div>

              <div className="qteam-detail-title">
                <strong>Thành viên ({detailTeam.members?.length || 0})</strong>

                {Number(detailTeam.status) === 1 && (
                  <Button
                    size="sm"
                    className="qteam-btn-primary"
                    onClick={() => {
                      setShowDetail(false);
                      openAssign(detailTeam.team_id);
                    }}
                  >
                    <FaUserPlus />
                    Thêm nhân viên
                  </Button>
                )}
              </div>

              {(detailTeam.members || []).length === 0 ? (
                <div className="qteam-detail-empty">
                  Nhóm chưa có thành viên.
                </div>
              ) : (
                <div className="qteam-detail-list">
                  {detailTeam.members.map((member) => (
                    <div key={member.user_id} className="qteam-detail-member">
                      <span className="qteam-avatar">
                        {userName(member.user_id).charAt(0).toUpperCase()}
                      </span>

                      <div>
                        <strong>{userName(member.user_id)}</strong>

                        <small>
                          NV #{member.user_id} · {formatDate(member.joined_at)}
                        </small>
                        <span
                          className={`qteam-role-badge ${isTeamAdmin(member) ? "admin" : "member"}`}
                        >
                          {isTeamAdmin(member) && <FaCrown />}
                          {isTeamAdmin(member) ? "Admin nhóm" : "Thành viên"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="qteam-action edit"
                        title="Chuyển nhóm"
                        onClick={() => {
                          setShowDetail(false);
                          openAssign(null, member.user_id);
                        }}
                      >
                        <FaExchangeAlt />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </Modal.Body>

        <Modal.Footer>
          <Button
            className="qteam-modal-cancel"
            onClick={() => setShowDetail(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ==================================================
          ADMIN NHÓM MODAL - BỔ SUNG, KHÔNG THAY ĐỔI MODAL CŨ
      ================================================== */}

      <Modal
        show={showAdminModal}
        onHide={() => !saving && setShowAdminModal(false)}
        centered
        backdrop={saving ? "static" : true}
        keyboard={!saving}
        dialogClassName="qteam-form-modal"
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>
            <span className="qteam-modal-icon">
              <FaUserShield />
            </span>
            <div>
              <strong>Quản lý Admin nhóm</strong>
              <small>Bổ nhiệm, chuyển hoặc thu hồi quyền Admin</small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {adminRoleError && <Alert variant="danger">{adminRoleError}</Alert>}
          <div className="qteam-admin-current">
            <strong>{adminTeam?.team_name || "Nhóm kinh doanh"}</strong>
            <span>
              Admin hiện tại:{" "}
              {adminTeam && getAdminId(adminTeam.team_id)
                ? userName(getAdminId(adminTeam.team_id))
                : "Chưa có Admin"}
            </span>
          </div>
          <Form.Group className="qteam-form-group">
            <Form.Label>Chọn Admin nhóm</Form.Label>
            <Form.Select
              value={adminTargetId}
              disabled={saving}
              onChange={(event) => {
                setAdminTargetId(event.target.value);
                setAdminRoleError("");
              }}
            >
              <option value="">Không có Admin (thu hồi quyền)</option>
              {members
                .filter((m) => String(m.team_id) === String(adminTeam?.team_id))
                .map((m) => (
                  <option key={m.user_id} value={String(m.user_id)}>
                    {userName(m.user_id)} — NV #{m.user_id}
                  </option>
                ))}
            </Form.Select>
            <div className="qteam-hint">
              Mỗi nhóm tối đa 1 Admin. Chọn nhân viên khác để chuyển quyền, hoặc
              chọn Không có Admin để thu hồi quyền.
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="qteam-modal-cancel"
            disabled={saving}
            onClick={() => setShowAdminModal(false)}
          >
            Hủy
          </Button>
          <Button
            className="qteam-modal-save"
            disabled={saving}
            onClick={saveAdminRole}
          >
            {saving ? (
              <>
                <Spinner size="sm" animation="border" /> Đang lưu...
              </>
            ) : (
              <>
                <FaUserShield /> Lưu quyền Admin
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ==================================================
          CONFIRM MODAL
      ================================================== */}

      <Modal
        show={Boolean(confirm)}
        onHide={closeConfirm}
        centered
        backdrop={saving ? "static" : true}
        keyboard={!saving}
        dialogClassName="qteam-confirm-modal"
      >
        <Modal.Body>
          <div className="qteam-confirm-content">
            <span className="qteam-confirm-icon">
              {confirm?.type === "remove" ? <FaUserMinus /> : <FaExchangeAlt />}
            </span>

            <h4>{confirm?.title}</h4>
            <p>{confirm?.message}</p>

            {confirmError && <Alert variant="danger">{confirmError}</Alert>}

            {confirm?.type === "remove" && (
              <Form.Control
                as="textarea"
                rows={2}
                value={confirm.reason || ""}
                placeholder="Lý do xóa khỏi nhóm..."
                onChange={(e) =>
                  setConfirm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
              />
            )}

            <div className="qteam-confirm-actions">
              <Button
                className="qteam-modal-cancel"
                disabled={saving}
                onClick={closeConfirm}
              >
                Hủy
              </Button>

              <Button
                className={
                  confirm?.type === "remove"
                    ? "qteam-btn-danger"
                    : "qteam-modal-save"
                }
                disabled={saving}
                onClick={executeConfirm}
              >
                {saving ? (
                  <>
                    <Spinner size="sm" animation="border" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận"
                )}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* TOAST */}

      <ToastContainer position="top-end" className="p-3 qteam-toast-container">
        <Toast
          show={toast.show}
          bg={toast.type}
          delay={3500}
          autohide
          onClose={() =>
            setToast((prev) => ({
              ...prev,
              show: false,
            }))
          }
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default QuotationTeams;
