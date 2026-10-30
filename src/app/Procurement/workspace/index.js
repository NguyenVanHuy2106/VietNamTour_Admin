import React, { useEffect, useState } from "react";

import { Button, Spinner } from "react-bootstrap";

import {
  FaBuilding,
  FaChartBar,
  FaCloudUploadAlt,
  FaDatabase,
  FaSyncAlt,
  FaUsers,
} from "react-icons/fa";

import APIToken from "../../../config/APIToken";

import MyEntities from "./components/MyEntities";
import WorkspaceList from "./components/WorkspaceList";
import DataImportModal from "./components/DataImportModal";
import ProcurementReport from "./components/ProcurementReport";

import "./index.css";

// ==========================================================
// COMPONENT
// ==========================================================

const ProcurementWorkspace = () => {
  // ========================================================
  // MAIN TAB
  // ========================================================

  const role = localStorage.getItem("role");

  const isAdmin = role === "admin";
  const [activeTab, setActiveTab] = useState("MY_ENTITIES");

  const [myEntityTotal, setMyEntityTotal] = useState(0);

  const [workspaceTotal, setWorkspaceTotal] = useState(0);

  // ========================================================
  // IMPORT
  // ========================================================

  const [showImport, setShowImport] = useState(false);

  // ========================================================
  // REFRESH SIGNAL
  // ========================================================

  const [refreshKey, setRefreshKey] = useState(0);

  const [refreshing, setRefreshing] = useState(false);

  // ========================================================
  // REFRESH
  // ========================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      setRefreshKey((current) => current + 1);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 400);
    }
  };

  // ========================================================
  // IMPORT COMPLETED
  // ========================================================

  const handleImportCompleted = async () => {
    setRefreshKey((current) => current + 1);
  };

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="procurement-workspace-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="procurement-workspace-header">
        <div>
          <div className="procurement-workspace-eyebrow">
            VIỆT NAM TOUR · PROCUREMENT DATA
          </div>

          <h2>
            <FaDatabase />
            Kho dữ liệu Mua sắm công
          </h2>

          <p>
            Nhận thông tin đơn vị, quản lý đầu mối liên hệ và theo dõi quá trình
            chăm sóc.
          </p>
        </div>

        <div className="procurement-workspace-header-actions">
          <Button
            className="procurement-workspace-refresh-secondary-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <FaSyncAlt />
            )}
            Làm mới
          </Button>

          {isAdmin && (
            <Button
              className="procurement-workspace-import-btn"
              onClick={() => setShowImport(true)}
            >
              <FaCloudUploadAlt />
              IMPORT DỮ LIỆU
            </Button>
          )}
        </div>
      </div>

      {/* ==================================================
          MAIN TABS
      ================================================== */}

      <div className="procurement-workspace-main-tabs">
        <button
          type="button"
          className={activeTab === "MY_ENTITIES" ? "active" : ""}
          onClick={() => setActiveTab("MY_ENTITIES")}
        >
          <FaBuilding />
          Công ty của tôi
          {myEntityTotal > 0 && (
            <span className="procurement-workspace-main-tab-count">
              {myEntityTotal}
            </span>
          )}
        </button>

        <button
          type="button"
          className={activeTab === "WORKSPACE" ? "active" : ""}
          onClick={() => setActiveTab("WORKSPACE")}
        >
          <FaUsers />
          Kho dữ liệu chung
          {workspaceTotal > 0 && (
            <span className="procurement-workspace-main-tab-count">
              {workspaceTotal}
            </span>
          )}
        </button>

        <button
          type="button"
          className={activeTab === "REPORT" ? "active" : ""}
          onClick={() => setActiveTab("REPORT")}
        >
          <FaChartBar />
          Báo cáo
        </button>
      </div>

      {/* ==================================================
          MY ENTITIES
      ================================================== */}

      {activeTab === "MY_ENTITIES" && (
        <MyEntities
          refreshKey={refreshKey}
          onTotalChange={setMyEntityTotal}
          onWorkspaceChange={() => setRefreshKey((current) => current + 1)}
        />
      )}

      {/* ==================================================
          WORKSPACE
      ================================================== */}

      {activeTab === "WORKSPACE" && (
        <WorkspaceList
          refreshKey={refreshKey}
          onTotalChange={setWorkspaceTotal}
          onClaimCompleted={() => {
            setRefreshKey((current) => current + 1);
          }}
        />
      )}

      {/* ==================================================
          REPORT
      ================================================== */}

      {activeTab === "REPORT" && <ProcurementReport refreshKey={refreshKey} />}

      {/* ==================================================
          IMPORT MODAL
      ================================================== */}

      <DataImportModal
        show={showImport}
        onHide={() => setShowImport(false)}
        onCompleted={handleImportCompleted}
      />
    </div>
  );
};

export default ProcurementWorkspace;
