import React, { useEffect, useMemo, useState } from "react";

import { Button, Modal, Spinner } from "react-bootstrap";

import {
  FaArchive,
  FaBolt,
  FaCalendarAlt,
  FaCheckCircle,
  FaCloudDownloadAlt,
  FaDatabase,
  FaExternalLinkAlt,
  FaFileAlt,
  FaFilter,
  FaGlobe,
  FaInbox,
  FaInfoCircle,
  FaRedo,
  FaRobot,
  FaSearch,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";

import APIToken from "../../config/APIToken";

import "./index.css";

// ==========================================================
// DEFAULT PAGINATION
// ==========================================================

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

// ==========================================================
// DEFAULT STATS
// ==========================================================

const DEFAULT_STATS = {
  total: 0,
  new: 0,
  discovered: 0,
  unassigned: 0,
  assigned: 0,
  categories: {},
  sourceTypes: {},
};

// ==========================================================
// DEFAULT FILTER OPTIONS
// ==========================================================

const DEFAULT_FILTER_OPTIONS = {
  categories: [],
  statuses: [],
  sourceTypes: [],
};

// ==========================================================
// COMPONENT
// ==========================================================

const Tender = () => {
  // ========================================================
  // DATA
  // ========================================================

  const [items, setItems] = useState([]);

  const [stats, setStats] = useState(DEFAULT_STATS);

  const [filterOptions, setFilterOptions] = useState(DEFAULT_FILTER_OPTIONS);

  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  // ========================================================
  // LOADING
  // ========================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [searchingTender, setSearchingTender] = useState(false);

  const [detailLoading, setDetailLoading] = useState(false);

  // ========================================================
  // PAGE
  // ========================================================

  const [page, setPage] = useState(1);

  const limit = 10;

  // ========================================================
  // FILTER INPUT
  // ========================================================

  const [keywordInput, setKeywordInput] = useState("");

  const [categoryInput, setCategoryInput] = useState("ALL");

  const [statusInput, setStatusInput] = useState("ALL");

  const [sourceTypeInput, setSourceTypeInput] = useState("ALL");

  const [dateFromInput, setDateFromInput] = useState("");

  const [dateToInput, setDateToInput] = useState("");

  // ========================================================
  // APPLIED FILTER
  // ========================================================

  const [filters, setFilters] = useState({
    keyword: "",

    category: "ALL",

    status: "ALL",

    source_type: "ALL",

    date_from: "",

    date_to: "",
  });

  // ========================================================
  // DETAIL
  // ========================================================

  const [showDetail, setShowDetail] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  // ========================================================
  // SEARCH MODAL
  // ========================================================

  const [showSearchModal, setShowSearchModal] = useState(false);

  const [searchConfig, setSearchConfig] = useState({
    timeFilter: "qdr:d",

    pages: 1,

    concurrency: 4,
  });

  const [lastSearchResult, setLastSearchResult] = useState(null);

  // ========================================================
  // FORMAT DATE
  // ========================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    try {
      return new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",

        month: "2-digit",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",
      });
    } catch (_) {
      return value;
    }
  };

  // ========================================================
  // STATUS LABEL
  // ========================================================

  const getStatusLabel = (status) => {
    switch (status) {
      case "NEW":
        return "Mới";

      case "DISCOVERED":
        return "Phát hiện";

      default:
        return status || "-";
    }
  };

  // ========================================================
  // CATEGORY LABEL
  // ========================================================

  const getCategoryLabel = (category) => {
    switch (category) {
      case "TOUR":
        return "Tour";

      case "THAM_QUAN":
        return "Tham quan";

      case "NGHI_DUONG":
        return "Nghỉ dưỡng";

      case "EMPLOYEE_TRAVEL":
        return "Du lịch CBNV";

      case "TEAM_BUILDING":
        return "Team Building";

      case "VE_NGUON":
        return "Về nguồn";

      default:
        return category || "-";
    }
  };

  // ========================================================
  // FETCH ITEMS
  // ========================================================

  const fetchItems = async ({ isRefresh = false } = {}) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      const response = await APIToken.get("/tender/items", {
        params: {
          page,

          limit,

          keyword: filters.keyword || undefined,

          category: filters.category !== "ALL" ? filters.category : undefined,

          status: filters.status !== "ALL" ? filters.status : undefined,

          source_type:
            filters.source_type !== "ALL" ? filters.source_type : undefined,

          date_from: filters.date_from || undefined,

          date_to: filters.date_to || undefined,

          sort_by: "first_seen_at",

          sort_order: "DESC",
        },
      });

      const rows = response?.data?.data || [];

      const pageData = response?.data?.pagination || DEFAULT_PAGINATION;

      setItems(Array.isArray(rows) ? rows : []);

      setPagination({
        ...DEFAULT_PAGINATION,

        ...pageData,
      });
    } catch (error) {
      console.error("fetch Tender items error:", error);

      alert(
        error?.response?.data?.message || "Không thể tải danh sách Tender.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  // ========================================================
  // FETCH STATS
  // ========================================================

  const fetchStats = async () => {
    try {
      const response = await APIToken.get("/tender/stats");

      setStats({
        ...DEFAULT_STATS,

        ...(response?.data?.data || {}),
      });
    } catch (error) {
      console.error("fetch Tender stats error:", error);
    }
  };

  // ========================================================
  // FETCH FILTER OPTIONS
  // ========================================================

  const fetchFilterOptions = async () => {
    try {
      const response = await APIToken.get("/tender/filter-options");

      setFilterOptions({
        ...DEFAULT_FILTER_OPTIONS,

        ...(response?.data?.data || {}),
      });
    } catch (error) {
      console.error("fetch Tender filters error:", error);
    }
  };

  // ========================================================
  // LOAD ALL
  // ========================================================

  const loadAll = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      await Promise.all([fetchItems(), fetchStats(), fetchFilterOptions()]);
    } catch (error) {
      console.error("load Tender error:", error);
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };

  // ========================================================
  // FIRST LOAD
  // ========================================================

  useEffect(() => {
    loadAll();
  }, []);

  // ========================================================
  // PAGE / FILTER CHANGE
  // ========================================================

  useEffect(() => {
    if (loading) {
      return;
    }

    fetchItems();
  }, [page, filters]);

  // ========================================================
  // SEARCH FILTER
  // ========================================================

  const handleFilter = (event) => {
    event.preventDefault();

    setPage(1);

    setFilters({
      keyword: keywordInput.trim(),

      category: categoryInput,

      status: statusInput,

      source_type: sourceTypeInput,

      date_from: dateFromInput,

      date_to: dateToInput,
    });
  };

  // ========================================================
  // RESET FILTER
  // ========================================================

  const handleResetFilter = () => {
    setKeywordInput("");

    setCategoryInput("ALL");

    setStatusInput("ALL");

    setSourceTypeInput("ALL");

    setDateFromInput("");

    setDateToInput("");

    setPage(1);

    setFilters({
      keyword: "",

      category: "ALL",

      status: "ALL",

      source_type: "ALL",

      date_from: "",

      date_to: "",
    });
  };

  // ========================================================
  // OPEN DETAIL
  // ========================================================

  const handleOpenDetail = async (item) => {
    if (!item?.id) {
      return;
    }

    try {
      setSelectedItem(item);

      setShowDetail(true);

      setDetailLoading(true);

      const response = await APIToken.get(`/tender/items/${item.id}`);

      setSelectedItem(response?.data?.data || item);
    } catch (error) {
      console.error("Tender detail error:", error);

      alert(error?.response?.data?.message || "Không thể tải chi tiết Tender.");
    } finally {
      setDetailLoading(false);
    }
  };

  // ========================================================
  // MANUAL TENDER SEARCH
  // ========================================================

  const handleSearchTender = async () => {
    try {
      setSearchingTender(true);

      setLastSearchResult(null);

      const response = await APIToken.post("/tender/search", {
        timeFilter: searchConfig.timeFilter,

        pages: Number(searchConfig.pages),

        concurrency: Number(searchConfig.concurrency),
      });

      const result = response?.data || {};

      setLastSearchResult(result);

      await Promise.all([fetchStats(), fetchFilterOptions()]);

      setPage(1);

      await fetchItems({
        isRefresh: true,
      });
    } catch (error) {
      console.error("Tender search error:", error);

      alert(error?.response?.data?.message || "Không thể lấy dữ liệu Tender.");
    } finally {
      setSearchingTender(false);
    }
  };

  // ========================================================
  // SEARCH RESULT SUMMARY
  // ========================================================

  const searchSummary = lastSearchResult?.summary || {};

  // ========================================================
  // CATEGORY SUMMARY
  // ========================================================

  const categorySummary = useMemo(() => {
    return Object.entries(stats.categories || {})
      .map(([key, value]) => ({
        key,

        label: getCategoryLabel(key),

        value: Number(value || 0),
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats.categories]);

  // ========================================================
  // LOADING SCREEN
  // ========================================================

  if (loading) {
    return (
      <div className="tender-loading">
        <Spinner animation="border" />

        <span>Đang tải dữ liệu Tender...</span>
      </div>
    );
  }

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="tender-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="tender-header">
        <div>
          <div className="tender-eyebrow">VIỆT NAM TOUR · LEAD AI</div>

          <h2>
            <FaRobot />
            Tender Watcher
          </h2>

          <p>
            Theo dõi thông báo mời báo giá, mời chào giá, mời thầu và nhu cầu
            dịch vụ du lịch từ các đơn vị trên toàn quốc.
          </p>
        </div>

        <div className="tender-header-actions">
          <Button
            className="tender-refresh-btn"
            disabled={refreshing}
            onClick={() => loadAll(true)}
          >
            {refreshing ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <FaSyncAlt />
            )}
            Làm mới
          </Button>

          <Button
            className="tender-pull-btn"
            disabled={searchingTender}
            onClick={() => setShowSearchModal(true)}
          >
            <FaCloudDownloadAlt />
            LẤY DỮ LIỆU
          </Button>
        </div>
      </div>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="tender-summary">
        <SummaryCard
          icon={<FaDatabase />}
          label="Tổng Tender"
          value={stats.total || 0}
        />

        <SummaryCard
          icon={<FaBolt />}
          label="Tender mới"
          value={stats.new || 0}
          type="new"
        />

        <SummaryCard
          icon={<FaSearch />}
          label="Đã phát hiện"
          value={stats.discovered || 0}
          type="discovered"
        />

        <SummaryCard
          icon={<FaInbox />}
          label="Chưa xử lý"
          value={stats.unassigned || 0}
          type="unassigned"
        />
      </div>

      {/* ==================================================
          CATEGORY QUICK STATS
      ================================================== */}

      {categorySummary.length > 0 && (
        <div className="tender-category-strip">
          {categorySummary.map((item) => (
            <div className="tender-category-chip" key={item.key}>
              <span>{item.label}</span>

              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      )}

      {/* ==================================================
          FILTER
      ================================================== */}

      <div className="tender-filter-card">
        <div className="tender-filter-title">
          <FaFilter />

          <span>Bộ lọc dữ liệu</span>
        </div>

        <form className="tender-filter-form" onSubmit={handleFilter}>
          <div className="tender-search-box">
            <FaSearch />

            <input
              type="text"
              placeholder="Tìm tiêu đề, đơn vị, domain..."
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
            />
          </div>

          <select
            value={categoryInput}
            onChange={(event) => setCategoryInput(event.target.value)}
          >
            <option value="ALL">Tất cả loại</option>

            {filterOptions.categories.map((item) => (
              <option value={item} key={item}>
                {getCategoryLabel(item)}
              </option>
            ))}
          </select>

          <select
            value={statusInput}
            onChange={(event) => setStatusInput(event.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>

            {filterOptions.statuses.map((item) => (
              <option value={item} key={item}>
                {getStatusLabel(item)}
              </option>
            ))}
          </select>

          <select
            value={sourceTypeInput}
            onChange={(event) => setSourceTypeInput(event.target.value)}
          >
            <option value="ALL">Tất cả nguồn</option>

            {filterOptions.sourceTypes.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>

          <div className="tender-date-input">
            <FaCalendarAlt />

            <input
              type="date"
              value={dateFromInput}
              onChange={(event) => setDateFromInput(event.target.value)}
            />
          </div>

          <div className="tender-date-input">
            <FaCalendarAlt />

            <input
              type="date"
              value={dateToInput}
              onChange={(event) => setDateToInput(event.target.value)}
            />
          </div>

          <Button type="submit" className="tender-filter-btn">
            <FaSearch />
            Tìm kiếm
          </Button>

          <Button
            type="button"
            className="tender-reset-btn"
            onClick={handleResetFilter}
          >
            <FaRedo />
            Xóa lọc
          </Button>
        </form>
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="tender-content-card">
        <div className="tender-section-title">
          <div>
            <h4>Danh sách cơ hội Tender</h4>

            <p>
              Tìm thấy <strong>{pagination.total}</strong> cơ hội phù hợp.
            </p>
          </div>

          <div className="tender-page-info">
            Trang <strong>{pagination.page || page}</strong>/
            <strong>{Math.max(pagination.totalPages || 1, 1)}</strong>
          </div>
        </div>

        {/* ================================================
            EMPTY
        ================================================ */}

        {items.length === 0 ? (
          <div className="tender-empty">
            <FaArchive />

            <h4>Chưa có Tender phù hợp</h4>

            <p>
              Hãy thay đổi bộ lọc hoặc bấm “Lấy dữ liệu” để hệ thống tìm cơ hội
              mới.
            </p>
          </div>
        ) : (
          <>
            {/* ============================================
                DESKTOP TABLE
            ============================================ */}

            <div className="tender-table-wrapper">
              <table className="tender-table">
                <thead>
                  <tr>
                    <th>Tender</th>

                    <th>Đơn vị / nguồn</th>

                    <th>Loại</th>

                    <th>Trạng thái</th>

                    <th className="text-center">Điểm</th>

                    <th>Phát hiện</th>

                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      {/* TENDER */}

                      <td>
                        <div className="tender-name-cell">
                          <div className="tender-name-icon">
                            <FaFileAlt />
                          </div>

                          <div>
                            <strong>{item.title || "-"}</strong>

                            <span>ID #{item.id}</span>

                            {item.snippet && <p>{item.snippet}</p>}
                          </div>
                        </div>
                      </td>

                      {/* SOURCE */}

                      <td>
                        <div className="tender-source-cell">
                          <strong>
                            {item.organization_name || item.domain || "-"}
                          </strong>

                          <span>
                            <FaGlobe />

                            {item.domain}
                          </span>
                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td>
                        <span className="tender-category-badge">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`tender-status tender-status-${String(
                            item.status || "",
                          ).toLowerCase()}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </td>

                      {/* SCORE */}

                      <td className="text-center">
                        <span className="tender-score">
                          {Number(item.relevance_score || 0)}
                        </span>
                      </td>

                      {/* DATE */}

                      <td>
                        <div className="tender-date-cell">
                          <FaCalendarAlt />

                          <span>{formatDate(item.first_seen_at)}</span>
                        </div>
                      </td>

                      {/* ACTION */}

                      <td className="text-center">
                        <div className="tender-actions">
                          <Button
                            className="tender-detail-btn"
                            onClick={() => handleOpenDetail(item)}
                          >
                            <FaInfoCircle />
                            Chi tiết
                          </Button>

                          {item.canonical_url && (
                            <a
                              className="tender-open-btn"
                              href={item.canonical_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Mở nguồn"
                            >
                              <FaExternalLinkAlt />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ============================================
                MOBILE
            ============================================ */}

            <div className="tender-mobile-list">
              {items.map((item) => (
                <div className="tender-mobile-card" key={item.id}>
                  <div className="tender-mobile-top">
                    <span
                      className={`tender-status tender-status-${String(
                        item.status || "",
                      ).toLowerCase()}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>

                    <span className="tender-score">
                      {Number(item.relevance_score || 0)}
                    </span>
                  </div>

                  <h4>{item.title || "-"}</h4>

                  <div className="tender-mobile-domain">
                    <FaGlobe />

                    {item.domain || "-"}
                  </div>

                  <div className="tender-mobile-grid">
                    <div>
                      <span>Loại</span>

                      <strong>{getCategoryLabel(item.category)}</strong>
                    </div>

                    <div>
                      <span>Phát hiện</span>

                      <strong>{formatDate(item.first_seen_at)}</strong>
                    </div>
                  </div>

                  <div className="tender-mobile-actions">
                    <Button onClick={() => handleOpenDetail(item)}>
                      <FaInfoCircle />
                      Chi tiết
                    </Button>

                    {item.canonical_url && (
                      <a
                        href={item.canonical_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FaExternalLinkAlt />
                        Mở nguồn
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ============================================
                PAGINATION
            ============================================ */}

            <div className="tender-pagination">
              <div>
                Hiển thị <strong>{items.length}</strong> /{" "}
                <strong>{pagination.total}</strong> Tender
              </div>

              <div className="tender-pagination-actions">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Trước
                </Button>

                <span>
                  {page} / {Math.max(pagination.totalPages || 1, 1)}
                </span>

                <Button
                  disabled={page >= Number(pagination.totalPages || 1)}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ==================================================
          SEARCH MODAL
      ================================================== */}

      <Modal
        show={showSearchModal}
        onHide={() => {
          if (!searchingTender) {
            setShowSearchModal(false);
          }
        }}
        centered
        size="lg"
        className="tender-modal"
      >
        <Modal.Header>
          <Modal.Title>
            <FaRobot />
            Lấy dữ liệu Tender
          </Modal.Title>

          {!searchingTender && (
            <button
              type="button"
              className="tender-modal-close"
              onClick={() => setShowSearchModal(false)}
            >
              <FaTimes />
            </button>
          )}
        </Modal.Header>

        <Modal.Body>
          <div className="tender-search-modal-intro">
            <div>
              <FaCloudDownloadAlt />
            </div>

            <div>
              <strong>Tender Watcher</strong>

              <p>
                Hệ thống sẽ tìm các thông báo mời báo giá, mời chào giá, mời
                thầu và nhu cầu dịch vụ du lịch mới.
              </p>
            </div>
          </div>

          <div className="tender-search-config">
            <div>
              <label>Khoảng thời gian</label>

              <select
                disabled={searchingTender}
                value={searchConfig.timeFilter}
                onChange={(event) =>
                  setSearchConfig((current) => ({
                    ...current,

                    timeFilter: event.target.value,
                  }))
                }
              >
                <option value="qdr:d">24 giờ gần nhất</option>

                <option value="qdr:w">7 ngày gần nhất</option>

                <option value="qdr:m">1 tháng gần nhất</option>

                <option value="qdr:m3">3 tháng gần nhất</option>

                <option value="qdr:y">1 năm gần nhất</option>
              </select>
            </div>

            <div>
              <label>Số trang / query</label>

              <select
                disabled={searchingTender}
                value={searchConfig.pages}
                onChange={(event) =>
                  setSearchConfig((current) => ({
                    ...current,

                    pages: Number(event.target.value),
                  }))
                }
              >
                <option value={1}>1 trang</option>

                <option value={2}>2 trang</option>
              </select>
            </div>

            <div>
              <label>Luồng xử lý</label>

              <select
                disabled={searchingTender}
                value={searchConfig.concurrency}
                onChange={(event) =>
                  setSearchConfig((current) => ({
                    ...current,

                    concurrency: Number(event.target.value),
                  }))
                }
              >
                <option value={2}>2</option>

                <option value={4}>4</option>

                <option value={6}>6</option>
              </select>
            </div>
          </div>

          {searchingTender && (
            <div className="tender-search-running">
              <Spinner animation="border" />

              <div>
                <strong>Đang tìm dữ liệu...</strong>

                <span>
                  Hệ thống đang chạy các query Tender và lọc dữ liệu phù hợp.
                </span>
              </div>
            </div>
          )}

          {!searchingTender && lastSearchResult && (
            <div className="tender-search-result">
              <div className="tender-search-success">
                <FaCheckCircle />

                <div>
                  <strong>Hoàn tất lấy dữ liệu</strong>

                  <span>Dữ liệu mới đã được đồng bộ vào hệ thống.</span>
                </div>
              </div>

              <div className="tender-search-result-grid">
                <ResultItem
                  label="Kết quả"
                  value={searchSummary.totalResultCount || 0}
                />

                <ResultItem
                  label="Mới"
                  value={searchSummary.totalNewCount || 0}
                />

                <ResultItem
                  label="Phát hiện"
                  value={searchSummary.totalDiscoveredCount || 0}
                />

                <ResultItem
                  label="Đã nhận"
                  value={searchSummary.totalAcceptedCount || 0}
                />

                <ResultItem
                  label="Trùng"
                  value={searchSummary.totalDuplicateCount || 0}
                />

                <ResultItem
                  label="Bỏ qua"
                  value={searchSummary.totalSkippedCount || 0}
                />
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            className="tender-modal-cancel-btn"
            disabled={searchingTender}
            onClick={() => setShowSearchModal(false)}
          >
            Đóng
          </Button>

          <Button
            className="tender-modal-run-btn"
            disabled={searchingTender}
            onClick={handleSearchTender}
          >
            {searchingTender ? (
              <>
                <Spinner animation="border" size="sm" />
                Đang lấy...
              </>
            ) : (
              <>
                <FaCloudDownloadAlt />
                Lấy dữ liệu ngay
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
        className="tender-modal"
      >
        <Modal.Header>
          <Modal.Title>
            <FaFileAlt />
            Chi tiết Tender
          </Modal.Title>

          <button
            type="button"
            className="tender-modal-close"
            onClick={() => setShowDetail(false)}
          >
            <FaTimes />
          </button>
        </Modal.Header>

        <Modal.Body>
          {detailLoading ? (
            <div className="tender-detail-loading">
              <Spinner animation="border" />

              <span>Đang tải chi tiết...</span>
            </div>
          ) : selectedItem ? (
            <div className="tender-detail">
              <div className="tender-detail-title">
                <div>
                  <FaFileAlt />
                </div>

                <div>
                  <h4>{selectedItem.title || "-"}</h4>

                  <div className="tender-detail-badges">
                    <span
                      className={`tender-status tender-status-${String(
                        selectedItem.status || "",
                      ).toLowerCase()}`}
                    >
                      {getStatusLabel(selectedItem.status)}
                    </span>

                    <span className="tender-category-badge">
                      {getCategoryLabel(selectedItem.category)}
                    </span>

                    <span className="tender-score">
                      {Number(selectedItem.relevance_score || 0)} điểm
                    </span>
                  </div>
                </div>
              </div>

              <div className="tender-detail-grid">
                <DetailItem
                  label="Đơn vị"
                  value={selectedItem.organization_name || "-"}
                />

                <DetailItem label="Domain" value={selectedItem.domain || "-"} />

                <DetailItem
                  label="Nguồn"
                  value={selectedItem.source_type || "-"}
                />

                <DetailItem
                  label="Query"
                  value={selectedItem.serp_query_key || "-"}
                />

                <DetailItem
                  label="Ngày phát hiện"
                  value={formatDate(selectedItem.first_seen_at)}
                />

                <DetailItem
                  label="Lần cuối thấy"
                  value={formatDate(selectedItem.last_seen_at)}
                />
              </div>

              {selectedItem.snippet && (
                <div className="tender-detail-snippet">
                  <span>Mô tả</span>

                  <p>{selectedItem.snippet}</p>
                </div>
              )}

              {selectedItem.canonical_url && (
                <a
                  className="tender-detail-source-btn"
                  href={selectedItem.canonical_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaExternalLinkAlt />
                  Mở thông báo gốc
                </a>
              )}
            </div>
          ) : null}
        </Modal.Body>
      </Modal>
    </div>
  );
};

// ==========================================================
// SUMMARY CARD
// ==========================================================

const SummaryCard = ({ icon, label, value, type = "" }) => {
  return (
    <div className={`tender-summary-card ${type ? `summary-${type}` : ""}`}>
      <div className="tender-summary-icon">{icon}</div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </div>
  );
};

// ==========================================================
// DETAIL ITEM
// ==========================================================

const DetailItem = ({ label, value }) => {
  return (
    <div className="tender-detail-item">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
};

// ==========================================================
// RESULT ITEM
// ==========================================================

const ResultItem = ({ label, value }) => {
  return (
    <div className="tender-result-item">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
};

export default Tender;
