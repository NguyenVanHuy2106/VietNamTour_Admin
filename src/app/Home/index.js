import React from "react";
import {
  Users,
  Map,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// Dữ liệu biểu đồ doanh thu chi tiết
const revenueData = [
  { month: "Tháng 1", tour: 4000, hotel: 2400 },
  { month: "Tháng 2", tour: 3000, hotel: 1398 },
  { month: "Tháng 3", tour: 5000, hotel: 9800 },
  { month: "Tháng 4", tour: 2780, hotel: 3908 },
  { month: "Tháng 5", tour: 4890, hotel: 4800 },
  { month: "Tháng 6", tour: 6390, hotel: 3800 },
];

// Dữ liệu bảng đơn hàng gần đây
const recentBookings = [
  {
    id: "#BK001",
    customer: "Nguyễn Văn A",
    tour: "Hạ Long Bay 2N1Đ",
    date: "2024-05-20",
    status: "Hoàn tất",
    amount: "3.500.000đ",
  },
  {
    id: "#BK002",
    customer: "Trần Thị B",
    tour: "Đà Lạt Mộng Mơ",
    date: "2024-05-21",
    status: "Chờ thanh toán",
    amount: "2.200.000đ",
  },
  {
    id: "#BK003",
    customer: "Lê Văn C",
    tour: "Phú Quốc Sun Set",
    date: "2024-05-22",
    status: "Đã hủy",
    amount: "4.800.000đ",
  },
  {
    id: "#BK004",
    customer: "Phạm Minh D",
    tour: "Sapa Tuyết Trắng",
    date: "2024-05-22",
    status: "Hoàn tất",
    amount: "5.100.000đ",
  },
];

const Home = () => {
  return (
    <div
      style={{
        padding: "25px",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#1a3353" }}>Dashboard Quản Trị</h2>
          <p style={{ color: "#6c757d", margin: "5px 0 0 0" }}>
            Chào mừng trở lại! Đây là tình hình kinh doanh hôm nay.
          </p>
        </div>
        <button style={btnPrimaryStyle}>Xuất báo cáo PDF</button>
      </div>

      {/* --- 1. Thẻ thống kê (Stat Cards) --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <StatCard
          icon={<DollarSign size={20} />}
          title="Tổng doanh thu"
          value="1.280.000.000đ"
          color="#4e73df"
          trend="+12.5%"
        />
        <StatCard
          icon={<Calendar size={20} />}
          title="Đơn hàng mới"
          value="156"
          color="#1cc88a"
          trend="+8.2%"
        />
        <StatCard
          icon={<Users size={20} />}
          title="Khách hàng"
          value="3,420"
          color="#36b9cc"
          trend="+15%"
        />
        <StatCard
          icon={<Clock size={20} />}
          title="Tour đang chờ"
          value="18"
          color="#f6c23e"
          trend="Cần xử lý"
        />
      </div>

      {/* --- 2. Biểu đồ & Phân tích --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "25px",
          marginBottom: "30px",
        }}
      >
        <div style={cardStyle}>
          <h4 style={{ marginBottom: "20px" }}>
            Phân tích Doanh thu & Dịch vụ
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorTour" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4e73df" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#4e73df" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="tour"
                stroke="#4e73df"
                fillOpacity={1}
                fill="url(#colorTour)"
                name="Tour du lịch"
              />
              <Area
                type="monotone"
                dataKey="hotel"
                stroke="#1cc88a"
                fillOpacity={0}
                name="Đặt khách sạn"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <h4 style={{ marginBottom: "20px" }}>Trạng thái vận hành</h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <ProgressItem
              label="Tỷ lệ lấp đầy Tour"
              percent={85}
              color="#4e73df"
            />
            <ProgressItem
              label="Phản hồi tích cực"
              percent={92}
              color="#1cc88a"
            />
            <ProgressItem
              label="Hoàn tất thanh toán"
              percent={70}
              color="#f6c23e"
            />
            <ProgressItem label="Tỷ lệ hủy tour" percent={5} color="#e74a3b" />
          </div>
        </div>
      </div>

      {/* --- 3. Bảng dữ liệu chi tiết --- */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h4 style={{ margin: 0 }}>Danh sách đặt Tour gần đây</h4>
          <span
            style={{ color: "#4e73df", cursor: "pointer", fontSize: "14px" }}
          >
            Xem tất cả
          </span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                textAlign: "left",
                borderBottom: "2px solid #f1f1f1",
                color: "#858796",
              }}
            >
              <th style={thStyle}>Mã Đơn</th>
              <th style={thStyle}>Khách Hàng</th>
              <th style={thStyle}>Tên Tour</th>
              <th style={thStyle}>Ngày Đặt</th>
              <th style={thStyle}>Số Tiền</th>
              <th style={thStyle}>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {recentBookings.map((b, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f1f1f1" }}>
                <td style={tdStyle}>{b.id}</td>
                <td style={{ ...tdStyle, fontWeight: "bold" }}>{b.customer}</td>
                <td style={tdStyle}>{b.tour}</td>
                <td style={tdStyle}>{b.date}</td>
                <td style={tdStyle}>{b.amount}</td>
                <td style={tdStyle}>
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Hợp phần giao diện phụ ---

const StatCard = ({ icon, title, value, color, trend }) => (
  <div
    style={{
      ...cardStyle,
      borderLeft: `5px solid ${color}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "bold",
          color: color,
          textTransform: "uppercase",
          marginBottom: "5px",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#5a5c69" }}>
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "#1cc88a", marginTop: "5px" }}>
        {trend}
      </div>
    </div>
    <div style={{ color: "#dddfeb" }}>{icon}</div>
  </div>
);

const ProgressItem = ({ label, percent, color }) => (
  <div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "13px",
        marginBottom: "5px",
      }}
    >
      <span>{label}</span>
      <span>{percent}%</span>
    </div>
    <div
      style={{
        height: "8px",
        backgroundColor: "#eaecf4",
        borderRadius: "10px",
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: "10px",
        }}
      ></div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const getStyle = () => {
    if (status === "Hoàn tất") return { bg: "#d1e7dd", text: "#0f5132" };
    if (status === "Chờ thanh toán") return { bg: "#fff3cd", text: "#856404" };
    return { bg: "#f8d7da", text: "#842029" };
  };
  const style = getStyle();
  return (
    <span
      style={{
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {status}
    </span>
  );
};

// --- CSS Objects ---
const cardStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.1)",
  border: "1px solid #e3e6f0",
};

const thStyle = { padding: "12px 8px", fontSize: "14px" };
const tdStyle = { padding: "12px 8px", fontSize: "14px", color: "#5a5c69" };
const btnPrimaryStyle = {
  backgroundColor: "#4e73df",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "5px",
  cursor: "pointer",
};

export default Home;
