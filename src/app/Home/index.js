import React from "react";

import {
  Users,
  DollarSign,
  Calendar,
  Clock,
  FileDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import "./index.css";

// ============================================================
// REVENUE DATA
// ============================================================

const revenueData = [
  {
    month: "T1",
    tour: 4000,
    hotel: 2400,
  },
  {
    month: "T2",
    tour: 3000,
    hotel: 1398,
  },
  {
    month: "T3",
    tour: 5000,
    hotel: 9800,
  },
  {
    month: "T4",
    tour: 2780,
    hotel: 3908,
  },
  {
    month: "T5",
    tour: 4890,
    hotel: 4800,
  },
  {
    month: "T6",
    tour: 6390,
    hotel: 3800,
  },
];

// ============================================================
// RECENT BOOKINGS
// ============================================================

const recentBookings = [
  {
    id: "#BK001",
    customer: "Nguyễn Văn A",
    tour: "Hạ Long Bay 2N1Đ",
    date: "20/05/2024",
    status: "Hoàn tất",
    amount: "3.500.000đ",
  },
  {
    id: "#BK002",
    customer: "Trần Thị B",
    tour: "Đà Lạt Mộng Mơ",
    date: "21/05/2024",
    status: "Chờ thanh toán",
    amount: "2.200.000đ",
  },
  {
    id: "#BK003",
    customer: "Lê Văn C",
    tour: "Phú Quốc Sun Set",
    date: "22/05/2024",
    status: "Đã hủy",
    amount: "4.800.000đ",
  },
  {
    id: "#BK004",
    customer: "Phạm Minh D",
    tour: "Sapa Tuyết Trắng",
    date: "22/05/2024",
    status: "Hoàn tất",
    amount: "5.100.000đ",
  },
];

// ============================================================
// HOME
// ============================================================

const Home = () => {
  return (
    <div className="home-container">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="home-header">
        <div className="home-header-info">
          <h1>Dashboard Quản Trị</h1>

          <p>Chào mừng trở lại! Đây là tình hình kinh doanh hôm nay.</p>
        </div>

        <button type="button" className="home-report-btn">
          <FileDown size={17} />

          <span>Xuất báo cáo</span>
        </button>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="home-stat-grid">
        <StatCard
          icon={<DollarSign size={23} />}
          title="Tổng doanh thu"
          value="1.280.000.000đ"
          trend="+12.5%"
          type="blue"
        />

        <StatCard
          icon={<Calendar size={23} />}
          title="Đơn hàng mới"
          value="156"
          trend="+8.2%"
          type="green"
        />

        <StatCard
          icon={<Users size={23} />}
          title="Khách hàng"
          value="3.420"
          trend="+15%"
          type="cyan"
        />

        <StatCard
          icon={<Clock size={23} />}
          title="Tour đang chờ"
          value="18"
          trend="Cần xử lý"
          type="yellow"
          warning
        />
      </div>

      {/* =====================================================
          CHART + OPERATION
      ===================================================== */}

      <div className="home-analysis-grid">
        {/* CHART */}

        <div className="home-card home-chart-card">
          <div className="home-card-header">
            <div>
              <h3>Phân tích doanh thu</h3>

              <p>Doanh thu Tour và dịch vụ khách sạn</p>
            </div>

            <div className="home-chart-legend">
              <span>
                <i className="tour" />
                Tour
              </span>

              <span>
                <i className="hotel" />
                Khách sạn
              </span>
            </div>
          </div>

          <div className="home-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{
                  top: 10,
                  right: 5,
                  left: -20,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="colorTour" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2879ff" stopOpacity={0.2} />

                    <stop offset="95%" stopColor="#2879ff" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#edf1f6"
                />

                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 11,
                    fill: "#8292a7",
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "#8292a7",
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="tour"
                  stroke="#2879ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTour)"
                  name="Tour"
                />

                <Area
                  type="monotone"
                  dataKey="hotel"
                  stroke="#1fbd83"
                  strokeWidth={2}
                  fillOpacity={0}
                  name="Khách sạn"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OPERATION */}

        <div className="home-card">
          <div className="home-card-header">
            <div>
              <h3>Trạng thái vận hành</h3>

              <p>Tổng quan hiệu suất hiện tại</p>
            </div>
          </div>

          <div className="home-progress-list">
            <ProgressItem label="Tỷ lệ lấp đầy Tour" percent={85} type="blue" />

            <ProgressItem label="Phản hồi tích cực" percent={92} type="green" />

            <ProgressItem
              label="Hoàn tất thanh toán"
              percent={70}
              type="yellow"
            />

            <ProgressItem label="Tỷ lệ hủy tour" percent={5} type="red" />
          </div>

          <div className="home-operation-summary">
            <div>
              <CheckCircle2 size={18} />

              <span>Hoạt động ổn định</span>
            </div>

            <strong>92%</strong>
          </div>
        </div>
      </div>

      {/* =====================================================
          RECENT BOOKINGS
      ===================================================== */}

      <div className="home-card home-bookings-card">
        <div className="home-card-header home-booking-header">
          <div>
            <h3>Đặt Tour gần đây</h3>

            <p>Các đơn hàng mới nhất</p>
          </div>

          <button type="button" className="home-view-all">
            Xem tất cả
          </button>
        </div>

        <div className="home-table-wrap">
          <table className="home-table">
            <thead>
              <tr>
                <th>Mã đơn</th>

                <th>Khách hàng</th>

                <th>Tên Tour</th>

                <th>Ngày đặt</th>

                <th>Số tiền</th>

                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td data-label="Mã đơn">
                    <strong className="home-booking-code">{booking.id}</strong>
                  </td>

                  <td data-label="Khách hàng">
                    <strong>{booking.customer}</strong>
                  </td>

                  <td data-label="Tên Tour">{booking.tour}</td>

                  <td data-label="Ngày đặt">{booking.date}</td>

                  <td data-label="Số tiền">
                    <strong>{booking.amount}</strong>
                  </td>

                  <td data-label="Trạng thái">
                    <StatusBadge status={booking.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({ icon, title, value, trend, type, warning = false }) => {
  return (
    <div className={`home-stat-card ${type}`}>
      <div className="home-stat-content">
        <div className="home-stat-title">{title}</div>

        <div className="home-stat-value">{value}</div>

        <div className={`home-stat-trend ${warning ? "warning" : ""}`}>
          {warning ? <AlertTriangle size={13} /> : <TrendingUp size={13} />}

          <span>{trend}</span>
        </div>
      </div>

      <div className="home-stat-icon">{icon}</div>
    </div>
  );
};

// ============================================================
// PROGRESS
// ============================================================

const ProgressItem = ({ label, percent, type }) => {
  return (
    <div className="home-progress-item">
      <div className="home-progress-info">
        <span>{label}</span>

        <strong>{percent}%</strong>
      </div>

      <div className="home-progress-track">
        <div
          className={`home-progress-bar ${type}`}
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
};

// ============================================================
// STATUS BADGE
// ============================================================

const StatusBadge = ({ status }) => {
  let className = "cancelled";

  if (status === "Hoàn tất") {
    className = "completed";
  }

  if (status === "Chờ thanh toán") {
    className = "pending";
  }

  return <span className={`home-status ${className}`}>{status}</span>;
};

export default Home;
