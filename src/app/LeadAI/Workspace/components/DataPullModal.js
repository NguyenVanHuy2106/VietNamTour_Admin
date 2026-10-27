import React, { useEffect, useRef, useState } from "react";

import { Button, Modal, ProgressBar, Spinner } from "react-bootstrap";

import {
  FaCheckCircle,
  FaCloudDownloadAlt,
  FaDatabase,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaRobot,
  FaSearch,
} from "react-icons/fa";

import APIToken from "../../../../config/APIToken";

// ==========================================================
// CONFIG
// ==========================================================

const TARGET_COMPANIES = 30;

// ==========================================================
// DEFAULT STATUS
// ==========================================================

const DEFAULT_STATUS = {
  running: false,

  stage: "IDLE",

  startedAt: null,

  finishedAt: null,

  here: {
    requested: TARGET_COMPANIES,

    found: 0,

    inserted: 0,

    filtered: 0,

    duplicates: 0,
  },

  goong: {
    requested: TARGET_COMPANIES,

    checked: 0,

    inserted: 0,

    rejected: 0,

    duplicates: 0,

    skipped: 0,

    errors: 0,
  },

  error: null,
};

// ==========================================================
// COMPONENT
// ==========================================================

const DataPullModal = ({ show, onHide, onCompleted }) => {
  // ========================================================
  // STATE
  // ========================================================

  const [pipeline, setPipeline] = useState(DEFAULT_STATUS);

  const [loading, setLoading] = useState(false);

  const [starting, setStarting] = useState(false);

  const pollingRef = useRef(null);

  const completedRef = useRef(false);

  // ========================================================
  // STOP POLLING
  // ========================================================

  const stopPolling = () => {
    if (!pollingRef.current) {
      return;
    }

    clearInterval(pollingRef.current);

    pollingRef.current = null;
  };

  // ========================================================
  // FETCH STATUS
  // ========================================================

  const fetchStatus = async () => {
    try {
      const response = await APIToken.get("/lead-ai/discovery/status");

      const data = response?.data?.data;

      if (!data) {
        return;
      }

      setPipeline((current) => ({
        ...current,

        ...data,

        here: {
          ...current.here,

          ...(data.here || {}),
        },

        goong: {
          ...current.goong,

          ...(data.goong || {}),
        },
      }));

      // ==================================================
      // RUNNING
      // ==================================================

      if (data.running) {
        completedRef.current = false;

        startPolling();

        return;
      }

      // ==================================================
      // COMPLETED
      // ==================================================

      if (data.stage === "COMPLETED" && !completedRef.current) {
        completedRef.current = true;

        stopPolling();

        if (typeof onCompleted === "function") {
          await onCompleted(data);
        }
      }

      // ==================================================
      // ERROR
      // ==================================================

      if (data.stage === "ERROR") {
        stopPolling();
      }
    } catch (error) {
      console.error("fetch Lead AI status error:", error);
    }
  };

  // ========================================================
  // START POLLING
  // ========================================================

  const startPolling = () => {
    if (pollingRef.current) {
      return;
    }

    pollingRef.current = setInterval(() => {
      fetchStatus();
    }, 2500);
  };

  // ========================================================
  // OPEN MODAL
  // ========================================================

  useEffect(() => {
    if (!show) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        await fetchStatus();
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      stopPolling();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // ========================================================
  // UNMOUNT
  // ========================================================

  useEffect(() => {
    return () => {
      stopPolling();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================================================
  // START PIPELINE
  // ========================================================

  const handleStart = async () => {
    if (starting || pipeline.running) {
      return;
    }

    const confirmed = window.confirm(
      `Bắt đầu kéo tối đa ${TARGET_COMPANIES} công ty mới?\n\nHệ thống sẽ chạy HERE trước, sau đó tự động kiểm tra bằng Goong.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setStarting(true);

      completedRef.current = false;

      // ==================================================
      // START PIPELINE
      //
      // Backend đang mặc định limit = 30.
      // Có thể gửi limit để đồng bộ rõ ràng.
      // ==================================================

      await APIToken.post("/lead-ai/discovery/manual", {
        limit: TARGET_COMPANIES,
      });

      await fetchStatus();

      startPolling();
    } catch (error) {
      console.error("start Lead AI pipeline error:", error);

      alert(error?.response?.data?.message || "Không thể bắt đầu kéo dữ liệu.");
    } finally {
      setStarting(false);
    }
  };

  // ========================================================
  // FORMAT DATE TIME
  // ========================================================

  const formatDateTime = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("vi-VN");
  };

  // ========================================================
  // STAGE
  // ========================================================

  const getStageInfo = () => {
    if (pipeline.stage === "HERE") {
      return {
        label: "Đang tìm công ty bằng HERE",

        icon: <FaMapMarkerAlt />,

        className: "running",
      };
    }

    if (pipeline.stage === "GOONG") {
      return {
        label: "Đang kiểm tra dữ liệu bằng Goong",

        icon: <FaSearch />,

        className: "running",
      };
    }

    if (pipeline.stage === "COMPLETED") {
      return {
        label: "Hoàn tất",

        icon: <FaCheckCircle />,

        className: "completed",
      };
    }

    if (pipeline.stage === "ERROR") {
      return {
        label: "Có lỗi xảy ra",

        icon: <FaExclamationTriangle />,

        className: "error",
      };
    }

    return {
      label: "Sẵn sàng",

      icon: <FaDatabase />,

      className: "idle",
    };
  };

  const stageInfo = getStageInfo();

  // ========================================================
  // HERE REQUESTED
  // ========================================================

  const hereRequested = Number(pipeline.here?.requested || TARGET_COMPANIES);

  // ========================================================
  // GOONG REQUESTED
  // ========================================================

  const goongRequested = Number(pipeline.goong?.requested || TARGET_COMPANIES);

  // ========================================================
  // HERE PROGRESS
  //
  // HERE = số công ty MỚI insert / mục tiêu.
  // ========================================================

  const hereProgress = hereRequested
    ? Math.min(
        100,

        Math.round(
          (Number(pipeline.here?.inserted || 0) / hereRequested) * 100,
        ),
      )
    : 0;

  // ========================================================
  // GOONG PROGRESS
  //
  // Goong phải tính theo CHECKED,
  // không tính theo INSERTED.
  //
  // Vì ví dụ:
  // checked = 30
  // inserted = 12
  //
  // thì Goong vẫn đã xử lý xong 30/30.
  // ========================================================

  const goongProgress = goongRequested
    ? Math.min(
        100,

        Math.round(
          (Number(pipeline.goong?.checked || 0) / goongRequested) * 100,
        ),
      )
    : 0;

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <Modal
      show={show}
      onHide={() => {
        if (pipeline.running) {
          return;
        }

        onHide();
      }}
      size="xl"
      centered
      dialogClassName="lead-data-modal"
      backdrop={pipeline.running ? "static" : true}
      keyboard={!pipeline.running}
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <Modal.Header closeButton={!pipeline.running}>
        <Modal.Title>
          <FaRobot />
          Kéo dữ liệu AI
        </Modal.Title>
      </Modal.Header>

      {/* ==================================================
          BODY
      ================================================== */}

      <Modal.Body>
        {loading ? (
          <div className="lead-data-loading">
            <Spinner animation="border" />

            <span>Đang kiểm tra hệ thống...</span>
          </div>
        ) : (
          <>
            {/* ==========================================
                STATUS
            ========================================== */}

            <div className={`lead-data-status ${stageInfo.className}`}>
              <div className="lead-data-status-icon">
                {pipeline.running ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  stageInfo.icon
                )}
              </div>

              <div>
                <span>Trạng thái hệ thống</span>

                <strong>{stageInfo.label}</strong>
              </div>
            </div>

            {/* ==========================================
                HERE + GOONG
            ========================================== */}

            <div className="lead-data-agents-grid">
              {/* ========================================
                  HERE
              ======================================== */}

              <div className="lead-data-agent-card here-card">
                <div className="lead-data-agent-header">
                  <div className="lead-data-agent-title">
                    <div className="lead-data-agent-number">1</div>

                    <div>
                      <strong>HERE Discovery</strong>

                      <span>
                        Tìm tối đa {TARGET_COMPANIES} công ty mới từ bản đồ
                      </span>
                    </div>
                  </div>

                  <span className="lead-data-agent-value">
                    {pipeline.here?.inserted || 0}/{hereRequested}
                  </span>
                </div>

                <ProgressBar
                  now={hereProgress}
                  className="lead-data-progress"
                />

                <div className="lead-data-stats">
                  <DataStat
                    label="Tìm thấy"
                    value={pipeline.here?.found || 0}
                  />

                  <DataStat
                    label="Đã thêm"
                    value={pipeline.here?.inserted || 0}
                    type="success"
                  />

                  <DataStat
                    label="Đã lọc"
                    value={pipeline.here?.filtered || 0}
                  />

                  <DataStat
                    label="Trùng"
                    value={pipeline.here?.duplicates || 0}
                  />
                </div>
              </div>

              {/* ========================================
                  GOONG
              ======================================== */}

              <div className="lead-data-agent-card goong-card">
                <div className="lead-data-agent-header">
                  <div className="lead-data-agent-title">
                    <div className="lead-data-agent-number goong">2</div>

                    <div>
                      <strong>Goong Verify</strong>

                      <span>Kiểm tra và tạo lead sạch</span>
                    </div>
                  </div>

                  <span className="lead-data-agent-value goong-value">
                    {pipeline.goong?.checked || 0}/{goongRequested}
                  </span>
                </div>

                <ProgressBar
                  now={goongProgress}
                  className="lead-data-progress goong"
                />

                <div className="lead-data-stats">
                  <DataStat
                    label="Đã kiểm tra"
                    value={pipeline.goong?.checked || 0}
                  />

                  <DataStat
                    label="Lead đạt"
                    value={pipeline.goong?.inserted || 0}
                    type="success"
                  />

                  <DataStat
                    label="Loại"
                    value={pipeline.goong?.rejected || 0}
                    type="warning"
                  />

                  <DataStat
                    label="Trùng"
                    value={pipeline.goong?.duplicates || 0}
                  />

                  <DataStat
                    label="Bỏ qua"
                    value={pipeline.goong?.skipped || 0}
                  />

                  <DataStat
                    label="Lỗi"
                    value={pipeline.goong?.errors || 0}
                    type="error"
                  />
                </div>
              </div>
            </div>

            {/* ==========================================
                META
            ========================================== */}

            <div className="lead-data-meta">
              <div>
                <span>Bắt đầu</span>

                <strong>{formatDateTime(pipeline.startedAt)}</strong>
              </div>

              <div>
                <span>Hoàn tất</span>

                <strong>{formatDateTime(pipeline.finishedAt)}</strong>
              </div>
            </div>

            {/* ==========================================
                ERROR
            ========================================== */}

            {pipeline.error && (
              <div className="lead-data-error">
                <FaExclamationTriangle />

                <div>
                  <strong>Pipeline có lỗi</strong>

                  <span>{pipeline.error}</span>
                </div>
              </div>
            )}
          </>
        )}
      </Modal.Body>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <Modal.Footer>
        {!pipeline.running && (
          <Button variant="secondary" onClick={onHide}>
            Đóng
          </Button>
        )}

        <Button
          className="lead-data-start-btn"
          onClick={handleStart}
          disabled={starting || pipeline.running}
        >
          {starting || pipeline.running ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <FaCloudDownloadAlt />
          )}

          {pipeline.running
            ? "Đang kéo dữ liệu..."
            : `KÉO ${TARGET_COMPANIES} CÔNG TY`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// ==========================================================
// DATA STAT
// ==========================================================

const DataStat = ({ label, value, type = "" }) => {
  return (
    <div className="lead-data-stat">
      <span>{label}</span>

      <strong className={type ? `stat-${type}` : ""}>{value}</strong>
    </div>
  );
};

export default DataPullModal;
