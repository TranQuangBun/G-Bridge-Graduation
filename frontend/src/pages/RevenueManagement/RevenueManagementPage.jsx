import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import commonStyles from "../../styles/adminCommon.module.css";
import { FaSpinner, FaDollarSign, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";

const RevenueManagementPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [revenueStats, setRevenueStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
    paymentGateway: "",
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      window.location.href = ROUTES.DASHBOARD;
    }
  }, [isAuthenticated, authLoading, user]);

  const fetchRevenueStats = useCallback(async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await adminService.getRevenueStats(params);
      if (response.success && response.data) {
        setRevenueStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching revenue stats:", error);
    }
  }, [filters.startDate, filters.endDate]);

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;
      if (filters.paymentGateway) params.paymentGateway = filters.paymentGateway;

      const response = await adminService.getAllPayments(params);
      if (response.success) {
        const paymentsData = Array.isArray(response.data) ? response.data : (response.data?.payments || []);
        const paginationData = response.pagination || response.data?.pagination;
        setPayments(paymentsData);
        if (paginationData) {
          setPagination((prev) => paginationData || prev);
        }
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchRevenueStats();
      fetchPayments();
    }
  }, [isAuthenticated, user, fetchRevenueStats, fetchPayments]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const formatCurrency = (amount, currency = "VND") => {
    if (!amount) return "0";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { label: "Thành công", className: commonStyles.adminBadgeSuccess },
      pending: { label: "Đang chờ", className: commonStyles.adminBadgePending },
      failed: { label: "Thất bại", className: commonStyles.adminBadgeDanger },
    };
    const statusInfo = statusMap[status] || { label: status, className: commonStyles.adminBadgeDefault };
    return <span className={statusInfo.className}>{statusInfo.label}</span>;
  };

  const getGatewayLabel = (gateway) => {
    const gatewayMap = {
      vnpay: "VNPay",
      momo: "MoMo",
      paypal: "PayPal",
    };
    return gatewayMap[gateway] || gateway;
  };

  return (
    <AdminLayout>
      <div className={commonStyles.adminContainer}>
        {/* Revenue Stats */}
        {revenueStats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem", flexShrink: 0 }}>
            <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #10b981, #34d399)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FaDollarSign style={{ color: "white", fontSize: "1.5rem" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Tổng doanh thu</h3>
                  <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
                    {formatCurrency(revenueStats.totalRevenue, "VND")}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #3b82f6, #60a5fa)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FaCheckCircle style={{ color: "white", fontSize: "1.5rem" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Thành công</h3>
                  <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
                    {revenueStats.statistics?.completedPayments || 0}
                  </p>
                  {revenueStats.statistics?.successRate && (
                    <small style={{ color: "#64748b", fontSize: "0.75rem", display: "block", marginTop: "0.25rem" }}>
                      Tỷ lệ: {revenueStats.statistics.successRate}%
                    </small>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #f59e0b, #fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FaClock style={{ color: "white", fontSize: "1.5rem" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Đang chờ</h3>
                  <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
                    {revenueStats.statistics?.pendingPayments || 0}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #ef4444, #f87171)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FaTimesCircle style={{ color: "white", fontSize: "1.5rem" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Thất bại</h3>
                  <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
                    {revenueStats.statistics?.failedPayments || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={commonStyles.adminFilters}>
          <div className={commonStyles.adminFilterGroup}>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className={commonStyles.adminFilterSelect}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="completed">Thành công</option>
              <option value="pending">Đang chờ</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>
          <div className={commonStyles.adminFilterGroup}>
            <select
              value={filters.paymentGateway}
              onChange={(e) => handleFilterChange("paymentGateway", e.target.value)}
              className={commonStyles.adminFilterSelect}
            >
              <option value="">Tất cả cổng thanh toán</option>
              <option value="vnpay">VNPay</option>
              <option value="momo">MoMo</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
          <div className={commonStyles.adminFilterGroup}>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className={commonStyles.adminFilterInput}
              placeholder="Từ ngày"
            />
          </div>
          <div className={commonStyles.adminFilterGroup}>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className={commonStyles.adminFilterInput}
              placeholder="Đến ngày"
            />
          </div>
        </div>

        {/* Payments Table */}
        {paymentsLoading ? (
          <div className={commonStyles.adminLoading}>
            <FaSpinner className={commonStyles.adminSpinner} />
            <p>Đang tải...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className={commonStyles.adminEmpty}>
            <p>Không có giao dịch nào</p>
          </div>
        ) : (
          <>
            <div className={commonStyles.adminTableContainer}>
              <table className={commonStyles.adminTable}>
                <thead>
                  <tr>
                    <th>Thứ tự</th>
                    <th>Người dùng</th>
                    <th>Số tiền</th>
                    <th>Cổng thanh toán</th>
                    <th>Trạng thái</th>
                    <th>Ngày gửi</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr key={payment.id}>
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                      <td>
                        <div>
                          <strong>{payment.user?.fullName || payment.userId}</strong>
                          {payment.user?.email && (
                            <div style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                              {payment.user.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{formatCurrency(payment.amount, payment.currency)}</td>
                      <td>{getGatewayLabel(payment.paymentGateway)}</td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td>{formatDate(payment.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className={commonStyles.adminPagination}>
                <button
                  className={commonStyles.adminPaginationButton}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                >
                  Trước
                </button>
                <span className={commonStyles.adminPaginationInfo}>
                  Trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.total})
                </span>
                <button
                  className={commonStyles.adminPaginationButton}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default RevenueManagementPage;
