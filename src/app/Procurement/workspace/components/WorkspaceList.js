import React, { useEffect, useMemo, useState } from "react";

import { Button, Spinner } from "react-bootstrap";
import {
  FaBuilding,
  FaEdit,
  FaInbox,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaRedo,
  FaSearch,
  FaTrash,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";

import APIToken from "../../../../config/APIToken";
import EntityEditModal from "./EntityEditModal";

const WorkspaceList = ({ refreshKey, onTotalChange, onClaimCompleted }) => {
  const userId = localStorage.getItem("userId");

  const role = localStorage.getItem("role");

  const isAdmin = role === "admin";
  const [loading, setLoading] = useState(true);

  const [claimingId, setClaimingId] = useState(null);

  const [entities, setEntities] = useState([]);

  const [page, setPage] = useState(1);

  const [limit] = useState(10);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // ========================================================
  // FILTER
  // ========================================================

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [provinceCodeInput, setProvinceCodeInput] = useState("");

  const [provinceCode, setProvinceCode] = useState("");

  const [hasPhoneInput, setHasPhoneInput] = useState("");

  const [hasPhone, setHasPhone] = useState("");

  const [selectedEntity, setSelectedEntity] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const handleEdit = (entity) => {
    setSelectedEntity(entity);

    setShowEditModal(true);
  };
  // ========================================================
  // DELETE
  // ========================================================

  const handleDelete = async (entity) => {
    if (!entity?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn XOÁ dữ liệu này?\n\n${entity.organization_name || "Đơn vị"}\n${entity.org_code || ""}\n\nDữ liệu sau khi xoá sẽ không còn trong hệ thống.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(entity.id);

      await APIToken.delete(`/procurement/entities/${entity.id}`);

      setEntities((current) =>
        current.filter((item) => Number(item.id) !== Number(entity.id)),
      );

      setPagination((current) => ({
        ...current,

        total: Math.max(0, Number(current.total || 0) - 1),
      }));

      alert("Đã xoá dữ liệu.");

      await fetchEntities();
    } catch (error) {
      console.error("delete procurement entity error:", error);

      alert(error?.response?.data?.message || "Không thể xoá dữ liệu.");
    } finally {
      setDeletingId(null);
    }
  };
  // ========================================================
  // LOAD
  // ========================================================

  useEffect(() => {
    fetchEntities();
  }, [page, search, provinceCode, hasPhone, refreshKey]);

  // ========================================================
  // FETCH
  // ========================================================

  const fetchEntities = async () => {
    try {
      setLoading(true);

      const response = await APIToken.get("/procurement/entities", {
        params: {
          page,
          limit,

          keyword: search || undefined,

          province_code: provinceCode || undefined,

          has_phone: hasPhone || undefined,

          unassigned_only: 1,
        },
      });

      const data = response?.data?.data || [];

      const paginationData = response?.data?.pagination || {
        page: 1,
        limit,
        total: 0,
        totalPages: 1,
      };

      setEntities(data);

      setPagination(paginationData);

      if (onTotalChange) {
        onTotalChange(Number(paginationData.total || 0));
      }
    } catch (error) {
      console.error("fetch procurement workspace error:", error);

      alert(error?.response?.data?.message || "Không thể tải kho dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // SEARCH
  // ========================================================

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);

    setSearch(searchInput.trim());

    setProvinceCode(provinceCodeInput.trim());

    setHasPhone(hasPhoneInput);
  };

  // ========================================================
  // RESET
  // ========================================================

  const handleReset = () => {
    setSearchInput("");
    setSearch("");

    setProvinceCodeInput("");
    setProvinceCode("");

    setHasPhoneInput("");
    setHasPhone("");

    setPage(1);
  };

  // ========================================================
  // CLAIM
  // ========================================================

  const handleClaim = async (entity) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn nhận đơn vị này?\n\n${
        entity.organization_name || "Đơn vị"
      }\n${entity.phone || ""}`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setClaimingId(entity.id);

      await APIToken.post(`/procurement/entities/${entity.id}/claim`);

      setEntities((current) =>
        current.filter((item) => Number(item.id) !== Number(entity.id)),
      );

      setPagination((current) => ({
        ...current,

        total: Math.max(0, Number(current.total || 0) - 1),
      }));

      alert("Nhận thông tin thành công.");

      await fetchEntities();

      if (onClaimCompleted) {
        onClaimCompleted();
      }
    } catch (error) {
      console.error("claim procurement error:", error);

      alert(error?.response?.data?.message || "Không thể nhận thông tin.");

      if (error?.response?.status === 409) {
        await fetchEntities();
      }
    } finally {
      setClaimingId(null);
    }
  };

  // ========================================================
  // STATS
  // ========================================================

  const stats = useMemo(
    () => ({
      total: Number(pagination.total || 0),

      current: entities.length,

      hasPhone: entities.filter((item) => Boolean(item.phone)).length,

      hasRepresentative: entities.filter((item) =>
        Boolean(item.representative_name),
      ).length,
    }),
    [entities, pagination.total],
  );

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="procurement-workspace-loading">
        <Spinner animation="border" />

        <div>Đang tải kho dữ liệu...</div>
      </div>
    );
  }

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <>
      {/* SUMMARY */}

      <div className="procurement-workspace-summary">
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
          icon={<FaUser />}
          label="Có người đại diện"
          value={stats.hasRepresentative}
          type="representative"
        />
      </div>

      {/* FILTER */}

      <div className="procurement-workspace-filter-card">
        <form
          className="procurement-workspace-filter-form"
          onSubmit={handleSearch}
        >
          <div className="procurement-workspace-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Tìm tên đơn vị, mã định danh, địa chỉ, người đại diện..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="procurement-workspace-filter-input">
            <FaMapMarkerAlt />

            <input
              type="text"
              placeholder="Mã tỉnh"
              value={provinceCodeInput}
              onChange={(e) => setProvinceCodeInput(e.target.value)}
            />
          </div>

          <select
            value={hasPhoneInput}
            onChange={(e) => setHasPhoneInput(e.target.value)}
          >
            <option value="">Tất cả SĐT</option>

            <option value="1">Có số điện thoại</option>

            <option value="0">Chưa có SĐT</option>
          </select>

          <Button type="submit" className="procurement-workspace-search-btn">
            <FaSearch />
            Tìm kiếm
          </Button>

          <Button
            type="button"
            className="procurement-workspace-reset-btn"
            onClick={handleReset}
          >
            <FaRedo />
            Xóa lọc
          </Button>
        </form>
      </div>

      {/* CONTENT */}

      <div className="procurement-workspace-content-card">
        <div className="procurement-workspace-section-title">
          <div>
            <h4>Danh sách đơn vị chưa có người nhận</h4>

            <p>
              Có <strong>{pagination.total}</strong> đơn vị đang khả dụng.
            </p>
          </div>

          <div className="procurement-workspace-page-info">
            Trang <strong>{pagination.page}</strong>/
            <strong>{Math.max(pagination.totalPages || 1, 1)}</strong>
          </div>
        </div>

        {entities.length === 0 ? (
          <div className="procurement-workspace-empty">
            <FaBuilding />

            <h4>Không có dữ liệu</h4>

            <p>Không còn đơn vị khả dụng hoặc không phù hợp bộ lọc.</p>
          </div>
        ) : (
          <>
            <div className="procurement-workspace-table-wrapper">
              <table className="procurement-workspace-table">
                <thead>
                  <tr>
                    <th>Đơn vị</th>

                    <th>Địa chỉ</th>

                    <th>Người đại diện</th>

                    <th>Điện thoại</th>

                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {entities.map((entity) => (
                    <tr key={entity.id}>
                      <td>
                        <div className="procurement-workspace-company">
                          <div className="procurement-workspace-company-icon">
                            <FaBuilding />
                          </div>

                          <div>
                            <strong>{entity.organization_name || "-"}</strong>

                            <span>{entity.org_code || "-"}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="procurement-workspace-address">
                          <FaMapMarkerAlt />

                          <span>{entity.address || "-"}</span>
                        </div>
                      </td>

                      <td>
                        <div className="procurement-workspace-person">
                          <strong>
                            {entity.representative_name || "Chưa có"}
                          </strong>

                          <span>
                            {entity.representative_position ||
                              "Chưa có chức vụ"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {entity.phone ? (
                          <a
                            className="procurement-workspace-phone"
                            href={`tel:${entity.phone}`}
                          >
                            <FaPhoneAlt />

                            {entity.phone}
                          </a>
                        ) : (
                          <span className="procurement-workspace-muted">
                            Chưa có
                          </span>
                        )}
                      </td>

                      <td className="text-center">
                        <div className="procurement-workspace-actions">
                          {isAdmin && (
                            <Button
                              className="procurement-workspace-edit-btn"
                              onClick={() => handleEdit(entity)}
                            >
                              <FaEdit />
                              Sửa
                            </Button>
                          )}

                          {isAdmin && (
                            <Button
                              className="procurement-workspace-delete-btn"
                              disabled={deletingId === entity.id}
                              onClick={() => handleDelete(entity)}
                            >
                              {deletingId === entity.id ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <FaTrash />
                              )}
                              Xoá
                            </Button>
                          )}

                          <Button
                            className="procurement-workspace-claim-btn"
                            disabled={claimingId === entity.id}
                            onClick={() => handleClaim(entity)}
                          >
                            {claimingId === entity.id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <FaUserPlus />
                            )}
                            Nhận
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="procurement-workspace-pagination">
              <div>
                Hiển thị <strong>{entities.length}</strong> /{" "}
                <strong>{pagination.total}</strong> đơn vị
              </div>

              <div className="procurement-workspace-pagination-actions">
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
        <EntityEditModal
          show={showEditModal}
          entity={selectedEntity}
          onHide={() => {
            setShowEditModal(false);

            setSelectedEntity(null);
          }}
          onSaved={async () => {
            setShowEditModal(false);

            setSelectedEntity(null);

            await fetchEntities();
          }}
        />
      </div>
    </>
  );
};

// ==========================================================
// SUMMARY
// ==========================================================

const SummaryCard = ({ icon, label, value, type = "" }) => (
  <div
    className={`procurement-workspace-summary-card ${
      type ? `summary-${type}` : ""
    }`}
  >
    <div className="procurement-workspace-summary-icon">{icon}</div>

    <div>
      <span>{label}</span>

      <strong>{value || 0}</strong>
    </div>
  </div>
);

export default WorkspaceList;
