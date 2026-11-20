import React from "react";
import QuotationRequestsAdmin from "./QuotationRequestsAdmin";
import QuotationRequestsTeam from "./QuotationRequestsTeam";

// Phân tuyến giao diện. Quyền nghiệp vụ bắt buộc xác nhận tại Backend.
export default function QuotationRequests() {
  const role = String(localStorage.getItem("role") || "")
    .trim()
    .toLowerCase();
  return role === "admin" ? (
    <QuotationRequestsAdmin />
  ) : (
    <QuotationRequestsTeam />
  );
}
