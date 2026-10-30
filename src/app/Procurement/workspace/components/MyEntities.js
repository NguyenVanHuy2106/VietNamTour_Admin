import React, { useEffect, useState } from "react";

import { Button, Spinner } from "react-bootstrap";

import {
  FaBuilding,
  FaCalendarAlt,
  FaEdit,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaRedo,
  FaSearch,
} from "react-icons/fa";

import APIToken from "../../../../config/APIToken";

import ProcurementCareModal from "./ProcurementCareModal";

const MyEntities = ({ refreshKey, onTotalChange }) => {
  const [loading, setLoading] = useState(true);

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

  const [statusInput, setStatusInput] = useState("");

  const [status, setStatus] = useState("");

  // ========================================================
  // CARE MODAL
  // ========================================================

  const [selectedEntity, setSelectedEntity] = useState(null);

  const [showCareModal, setShowCareModal] = useState(false);

  // ========================================================
  // LOAD
  // ========================================================

  useEffect(() => {
    fetchMyEntities();
  }, [page, search, status, refreshKey]);

  // ========================================================
  // FETCH
  // ========================================================

  const fetchMyEntities = async () => {
    try {
      setLoading(true);

      const response = await APIToken.get("/procurement/my-entities", {
        params: {
          page,
          limit,

          keyword: search || undefined,

          care_status: status || undefined,
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
      console.error("fetch my procurement entities:", error);

      alert(error?.response?.data?.message || "Không thể tải dữ liệu của tôi.");
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

    setStatus(statusInput);
  };

  const handleReset = () => {
    setSearchInput("");
    setSearch("");

    setStatusInput("");
    setStatus("");

    setPage(1);
  };

  // ========================================================
  // OPEN CARE
  // ========================================================

  const handleOpenCare = (entity) => {
    setSelectedEntity(entity);

    setShowCareModal(true);
  };

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="procurement-workspace-loading">
        <Spinner animation="border" />

        <div>Đang tải dữ liệu của tôi...</div>
      </div>
    );
  }

  return (
    <>
      <div className="procurement-workspace-filter-card">
        <form className="procurement-my-filter-form" onSubmit={handleSearch}>
          <div className="procurement-workspace-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Tìm tên đơn vị, mã định danh, số điện thoại..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>

            <option value="NEW">Mới nhận</option>

            <option value="CONTACTING">Đang liên hệ</option>

            <option value="CONTACTED">Đã liên hệ</option>

            <option value="INTERESTED">Có quan tâm</option>

            <option value="FOLLOW_UP">Cần theo dõi</option>

            <option value="SUCCESS">Thành công</option>

            <option value="NOT_INTERESTED">Không quan tâm</option>
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

      <div className="procurement-workspace-content-card">
        <div className="procurement-workspace-section-title">
          <div>
            <h4>Danh sách đơn vị của tôi</h4>

            <p>
              Có <strong>{pagination.total}</strong> đơn vị đang được bạn chăm
              sóc.
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

            <h4>Chưa có đơn vị</h4>

            <p>Hãy vào Kho dữ liệu chung để nhận thông tin.</p>
          </div>
        ) : (
          <>
            <div className="procurement-workspace-table-wrapper">
              <table className="procurement-workspace-table">
                <thead>
                  <tr>
                    <th>Đơn vị</th>

                    <th>Người đại diện</th>

                    <th>Điện thoại</th>

                    <th>Trạng thái</th>

                    <th>Chăm sóc tiếp theo</th>

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

                            <span>{entity.org_code}</span>
                          </div>
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

                      <td>
                        <CareStatus value={entity.care_status} />
                      </td>

                      <td>
                        <div className="procurement-workspace-followup">
                          <FaCalendarAlt />

                          {formatDate(entity.next_follow_up_at)}
                        </div>
                      </td>

                      <td className="text-center">
                        <Button
                          className="procurement-workspace-care-btn"
                          onClick={() => handleOpenCare(entity)}
                        >
                          <FaEdit />
                          Chăm sóc
                        </Button>
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
      </div>

      <ProcurementCareModal
        show={showCareModal}
        entity={selectedEntity}
        onHide={() => {
          setShowCareModal(false);
          setSelectedEntity(null);
        }}
        onSaved={async () => {
          setShowCareModal(false);

          setSelectedEntity(null);

          await fetchMyEntities();
        }}
      />
    </>
  );
};

const CareStatus = ({ value }) => {
  const statusMap = {
    NEW: "Mới nhận",
    CONTACTING: "Đang liên hệ",
    CONTACTED: "Đã liên hệ",
    INTERESTED: "Có quan tâm",
    FOLLOW_UP: "Cần theo dõi",
    SUCCESS: "Thành công",
    NOT_INTERESTED: "Không quan tâm",
  };

  const status = value || "NEW";

  return (
    <span
      className={`procurement-status procurement-status-${status.toLowerCase()}`}
    >
      {statusMap[status] || status}
    </span>
  );
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default MyEntities;
