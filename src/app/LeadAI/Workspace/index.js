import React, { useEffect, useMemo, useState } from "react";

import { Button, Spinner } from "react-bootstrap";

import {
  FaBuilding,
  FaChartBar,
  FaGlobe,
  FaInbox,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaSearch,
  FaSyncAlt,
  FaUserPlus,
  FaUsers,
  FaCloudDownloadAlt,
} from "react-icons/fa";

import APIToken from "../../../config/APIToken";
import MyCompanies from "./components/MyCompanies";
import DataPullModal from "./components/DataPullModal";
import LeadReport from "./components/LeadReport";

import "./index.css";

// ==========================================================
// COMPONENT
// ==========================================================

const Workspace = () => {
  // ========================================================
  // STATE - MAIN TAB
  // ========================================================
  const userId = Number(localStorage.getItem("userId"));

  const canPullAIData = userId === 1001;

  const [activeTab, setActiveTab] = useState("MY_COMPANIES");

  const [myCompanyTotal, setMyCompanyTotal] = useState(0);

  const [showDataPull, setShowDataPull] = useState(false);

  // ========================================================
  // STATE - WORKSPACE
  // ========================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [claimingId, setClaimingId] = useState(null);

  const [companies, setCompanies] = useState([]);

  const [page, setPage] = useState(1);

  const [limit] = useState(20);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // ========================================================
  // STATE - FILTER
  // ========================================================

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [provinceInput, setProvinceInput] = useState("");

  const [province, setProvince] = useState("");

  const [districtInput, setDistrictInput] = useState("");

  const [district, setDistrict] = useState("");

  // ========================================================
  // LOAD WORKSPACE
  // ========================================================

  useEffect(() => {
    fetchCompanies();
  }, [page, search, province, district]);

  // ========================================================
  // FETCH COMPANIES
  // ========================================================

  const fetchCompanies = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await APIToken.get("/lead-ai/workspace", {
        params: {
          page,
          limit,

          search: search || undefined,

          province: province || undefined,

          district: district || undefined,
        },
      });

      const companyData = response?.data?.data || [];

      const paginationData = response?.data?.pagination || {
        page: 1,
        limit,
        total: 0,
        totalPages: 1,
      };

      setCompanies(companyData);

      setPagination(paginationData);
    } catch (error) {
      console.error("fetch Workspace error:", error);

      alert(
        error?.response?.data?.message || "Không thể tải kho dữ liệu công ty.",
      );
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };

  // ========================================================
  // SEARCH
  // ========================================================

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);

    setSearch(searchInput.trim());

    setProvince(provinceInput.trim());

    setDistrict(districtInput.trim());
  };

  // ========================================================
  // RESET FILTER
  // ========================================================

  const handleResetFilter = () => {
    setSearchInput("");

    setProvinceInput("");

    setDistrictInput("");

    setSearch("");

    setProvince("");

    setDistrict("");

    setPage(1);
  };

  // ========================================================
  // CLAIM COMPANY
  // ========================================================

  const handleClaimCompany = async (company) => {
    if (!company?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn nhận công ty này?\n\n${
        company.name || "Công ty"
      }\n${company.formatted_address || ""}`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setClaimingId(company.id);

      await APIToken.post(`/lead-ai/workspace/${company.id}/claim`);

      /**
       * Xóa ngay khỏi giao diện
       */
      setCompanies((current) =>
        current.filter((item) => Number(item.id) !== Number(company.id)),
      );

      setPagination((current) => ({
        ...current,

        total: Math.max(0, Number(current.total || 0) - 1),
      }));

      alert("Nhận công ty thành công.");

      /**
       * Đồng bộ lại dữ liệu server
       */
      await fetchCompanies(true);
    } catch (error) {
      console.error("claim company error:", error);

      alert(error?.response?.data?.message || "Không thể nhận công ty.");

      /**
       * Nếu công ty vừa bị người khác nhận
       */
      if (error?.response?.status === 409) {
        await fetchCompanies(true);
      }
    } finally {
      setClaimingId(null);
    }
  };

  // ========================================================
  // STATS
  // ========================================================

  const stats = useMemo(() => {
    const hasPhone = companies.filter((item) => Boolean(item.phone)).length;

    const hasWebsite = companies.filter((item) => Boolean(item.website)).length;

    return {
      total: Number(pagination.total || 0),

      current: companies.length,

      hasPhone,

      hasWebsite,
    };
  }, [companies, pagination.total]);

  // ========================================================
  // DISPLAY LOCATION
  // ========================================================

  const displayLocation = (company) => {
    const parts = [company.district, company.province].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(", ");
    }

    return "-";
  };

  // ========================================================
  // TAB CHANGE
  // ========================================================

  const handleChangeTab = (tab) => {
    setActiveTab(tab);
  };

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="lead-workspace-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="lead-workspace-header">
        <div>
          <div className="lead-workspace-eyebrow">VIỆT NAM TOUR · LEAD AI</div>

          <h2>
            <FaUsers />
            Quản lý khách hàng doanh nghiệp
          </h2>

          <p>Tìm kiếm, nhận và chăm sóc dữ liệu khách hàng tiềm năng.</p>
        </div>

        <div className="lead-workspace-header-actions">
          {activeTab === "WORKSPACE" && (
            <Button
              className="lead-workspace-refresh-secondary-btn"
              onClick={() => fetchCompanies(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FaSyncAlt />
              )}
              Làm mới
            </Button>
          )}
          {canPullAIData && (
            <Button
              className="lead-workspace-pull-data-btn"
              onClick={() => setShowDataPull(true)}
            >
              <FaCloudDownloadAlt />
              KÉO DATA AI
            </Button>
          )}
        </div>
      </div>

      {/* ==================================================
          MAIN MENU
      ================================================== */}

      <div className="lead-workspace-main-tabs">
        <button
          type="button"
          className={activeTab === "MY_COMPANIES" ? "active" : ""}
          onClick={() => handleChangeTab("MY_COMPANIES")}
        >
          <FaBuilding />
          Công ty của tôi
          {myCompanyTotal > 0 && (
            <span className="lead-workspace-main-tab-count">
              {myCompanyTotal}
            </span>
          )}
        </button>

        <button
          type="button"
          className={activeTab === "WORKSPACE" ? "active" : ""}
          onClick={() => handleChangeTab("WORKSPACE")}
        >
          <FaUsers />
          Workspace
          {pagination.total > 0 && (
            <span className="lead-workspace-main-tab-count">
              {pagination.total}
            </span>
          )}
        </button>

        <button
          type="button"
          className={activeTab === "REPORT" ? "active" : ""}
          onClick={() => handleChangeTab("REPORT")}
        >
          <FaChartBar />
          Báo cáo
        </button>
      </div>

      {/* ==================================================
          WORKSPACE TAB
      ================================================== */}

      {activeTab === "WORKSPACE" && (
        <>
          {/* ==============================================
              LOADING
          ============================================== */}

          {loading ? (
            <div className="lead-workspace-loading">
              <Spinner animation="border" />

              <div>Đang tải kho dữ liệu công ty...</div>
            </div>
          ) : (
            <>
              {/* ==========================================
                  SUMMARY
              ========================================== */}

              <div className="lead-workspace-summary">
                <SummaryCard
                  icon={<FaBuilding />}
                  label="Kho khả dụng"
                  value={stats.total}
                />

                <SummaryCard
                  icon={<FaInbox />}
                  label="Đang hiển thị"
                  value={stats.current}
                  type="current"
                />

                <SummaryCard
                  icon={<FaPhoneAlt />}
                  label="Có số điện thoại"
                  value={stats.hasPhone}
                  type="phone"
                />

                <SummaryCard
                  icon={<FaGlobe />}
                  label="Có website"
                  value={stats.hasWebsite}
                  type="website"
                />
              </div>

              {/* ==========================================
                  FILTER
              ========================================== */}

              <div className="lead-workspace-filter-card">
                <form
                  className="lead-workspace-filter-form"
                  onSubmit={handleSearch}
                >
                  <div className="lead-workspace-search">
                    <FaSearch />

                    <input
                      type="text"
                      placeholder="Tìm tên công ty, địa chỉ, số điện thoại..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>

                  <div className="lead-workspace-filter-input">
                    <FaMapMarkerAlt />

                    <input
                      type="text"
                      placeholder="Tỉnh / thành"
                      value={provinceInput}
                      onChange={(e) => setProvinceInput(e.target.value)}
                    />
                  </div>

                  <div className="lead-workspace-filter-input">
                    <FaMapMarkerAlt />

                    <input
                      type="text"
                      placeholder="Quận / huyện"
                      value={districtInput}
                      onChange={(e) => setDistrictInput(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="lead-workspace-search-btn">
                    <FaSearch />
                    Tìm kiếm
                  </Button>

                  <Button
                    type="button"
                    className="lead-workspace-reset-btn"
                    onClick={handleResetFilter}
                  >
                    Xóa lọc
                  </Button>
                </form>
              </div>

              {/* ==========================================
                  CONTENT
              ========================================== */}

              <div className="lead-workspace-content-card">
                {/* ========================================
                    SECTION TITLE
                ======================================== */}

                <div className="lead-workspace-section-title">
                  <div>
                    <h4>Danh sách công ty chưa có người nhận</h4>

                    <p>
                      Có <strong>{pagination.total}</strong> công ty đang khả
                      dụng trong Workspace.
                    </p>
                  </div>

                  <div className="lead-workspace-page-info">
                    Trang <strong>{pagination.page}</strong>/
                    <strong>{Math.max(pagination.totalPages || 1, 1)}</strong>
                  </div>
                </div>

                {/* ========================================
                    EMPTY
                ======================================== */}

                {companies.length === 0 ? (
                  <div className="lead-workspace-empty">
                    <FaBuilding />

                    <h4>Không có công ty phù hợp</h4>

                    <p>
                      Không còn công ty khả dụng hoặc không có dữ liệu phù hợp
                      với bộ lọc.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* ====================================
                        DESKTOP TABLE
                    ==================================== */}

                    <div className="lead-workspace-table-wrapper">
                      <table className="lead-workspace-table">
                        <thead>
                          <tr>
                            <th>Công ty</th>

                            <th>Địa chỉ</th>

                            <th>Khu vực</th>

                            <th>Liên hệ</th>

                            <th>Website</th>

                            <th className="text-center">Điểm match</th>

                            <th className="text-center">Thao tác</th>
                          </tr>
                        </thead>

                        <tbody>
                          {companies.map((company) => (
                            <tr key={company.id}>
                              {/* ======================
                                  COMPANY
                              ====================== */}

                              <td>
                                <div className="lead-workspace-company">
                                  <div className="lead-workspace-company-icon">
                                    <FaBuilding />
                                  </div>

                                  <div>
                                    <strong>{company.name || "-"}</strong>

                                    <span>ID #{company.id}</span>
                                  </div>
                                </div>
                              </td>

                              {/* ======================
                                  ADDRESS
                              ====================== */}

                              <td>
                                <div className="lead-workspace-address">
                                  <FaMapMarkerAlt />

                                  <span>
                                    {company.formatted_address || "-"}
                                  </span>
                                </div>
                              </td>

                              {/* ======================
                                  LOCATION
                              ====================== */}

                              <td>
                                <div className="lead-workspace-location">
                                  <strong>{displayLocation(company)}</strong>

                                  {company.commune && (
                                    <span>{company.commune}</span>
                                  )}
                                </div>
                              </td>

                              {/* ======================
                                  PHONE
                              ====================== */}

                              <td>
                                {company.phone ? (
                                  <a
                                    className="lead-workspace-phone"
                                    href={`tel:${company.phone}`}
                                  >
                                    <FaPhoneAlt />

                                    {company.phone}
                                  </a>
                                ) : (
                                  <span className="lead-workspace-muted">
                                    Chưa có
                                  </span>
                                )}
                              </td>

                              {/* ======================
                                  WEBSITE
                              ====================== */}

                              <td>
                                {company.website ? (
                                  <a
                                    className="lead-workspace-website"
                                    href={company.website}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <FaGlobe />
                                    Website
                                  </a>
                                ) : (
                                  <span className="lead-workspace-muted">
                                    Chưa có
                                  </span>
                                )}
                              </td>

                              {/* ======================
                                  MATCH
                              ====================== */}

                              <td className="text-center">
                                <span className="lead-workspace-match">
                                  {Number(company.match_score || 0)}%
                                </span>
                              </td>

                              {/* ======================
                                  ACTION
                              ====================== */}

                              <td className="text-center">
                                <Button
                                  className="lead-workspace-claim-btn"
                                  disabled={claimingId === company.id}
                                  onClick={() => handleClaimCompany(company)}
                                >
                                  {claimingId === company.id ? (
                                    <Spinner animation="border" size="sm" />
                                  ) : (
                                    <FaUserPlus />
                                  )}
                                  Nhận công ty
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ====================================
                        MOBILE
                    ==================================== */}

                    <div className="lead-workspace-mobile-list">
                      {companies.map((company) => (
                        <div
                          className="lead-workspace-mobile-card"
                          key={company.id}
                        >
                          <div className="lead-workspace-mobile-top">
                            <div className="lead-workspace-company">
                              <div className="lead-workspace-company-icon">
                                <FaBuilding />
                              </div>

                              <div>
                                <strong>{company.name || "-"}</strong>

                                <span>ID #{company.id}</span>
                              </div>
                            </div>

                            <span className="lead-workspace-match">
                              {Number(company.match_score || 0)}%
                            </span>
                          </div>

                          <div className="lead-workspace-mobile-address">
                            <FaMapMarkerAlt />

                            <span>{company.formatted_address || "-"}</span>
                          </div>

                          <div className="lead-workspace-mobile-grid">
                            <div>
                              <span>Khu vực</span>

                              <strong>{displayLocation(company)}</strong>
                            </div>

                            <div>
                              <span>Điện thoại</span>

                              <strong>{company.phone || "Chưa có"}</strong>
                            </div>
                          </div>

                          {company.website && (
                            <a
                              className="lead-workspace-mobile-website"
                              href={company.website}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FaGlobe />
                              Mở website công ty
                            </a>
                          )}

                          <Button
                            className="lead-workspace-mobile-claim-btn"
                            disabled={claimingId === company.id}
                            onClick={() => handleClaimCompany(company)}
                          >
                            {claimingId === company.id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <FaUserPlus />
                            )}
                            Nhận công ty
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* ====================================
                        PAGINATION
                    ==================================== */}

                    <div className="lead-workspace-pagination">
                      <div>
                        Hiển thị <strong>{companies.length}</strong> /
                        <strong>{pagination.total}</strong> công ty
                      </div>

                      <div className="lead-workspace-pagination-actions">
                        <Button
                          disabled={page <= 1}
                          onClick={() =>
                            setPage((current) => Math.max(1, current - 1))
                          }
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
            </>
          )}
        </>
      )}

      {/* ==================================================
          MY COMPANIES TAB
      ================================================== */}

      {activeTab === "MY_COMPANIES" && (
        <MyCompanies onTotalChange={setMyCompanyTotal} />
      )}

      {/* ==================================================
          REPORT TAB
      ================================================== */}
      {activeTab === "REPORT" && <LeadReport />}

      {/* ==================================================
          DATA PULL MODAL
      ================================================== */}

      {canPullAIData && (
        <DataPullModal
          show={showDataPull}
          onHide={() => setShowDataPull(false)}
          onCompleted={async () => {
            await fetchCompanies(true);
          }}
        />
      )}
    </div>
  );
};

// ==========================================================
// SUMMARY CARD
// ==========================================================

const SummaryCard = ({ icon, label, value, type = "" }) => {
  return (
    <div
      className={`lead-workspace-summary-card ${type ? `summary-${type}` : ""}`}
    >
      <div className="lead-workspace-summary-icon">{icon}</div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </div>
  );
};

export default Workspace;
