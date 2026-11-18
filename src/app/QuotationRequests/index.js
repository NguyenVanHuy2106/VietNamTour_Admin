import React from "react";

import QuotationRequestsAdmin from "./QuotationRequestsAdmin";
import QuotationRequestsTeam from "./QuotationRequestsTeam";

// ==========================================================
// VIET NAM TOUR ERP
// QUOTATION REQUEST - ROLE ROUTER
//
// admin: giao diện quản trị hiện tại
// role khác: giao diện nhân viên nhóm kinh doanh
//
// Quyền thực tế được kiểm tra ở Backend bằng JWT.
// ==========================================================

export default function QuotationRequests() {
  const role = String(localStorage.getItem("role") || "")
    .trim()
    .toLowerCase();

  if (role === "admin") {
    return <QuotationRequestsAdmin />;
  }

  return <QuotationRequestsTeam />;
}
