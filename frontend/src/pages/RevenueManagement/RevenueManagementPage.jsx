import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./RevenueManagementPage.module.css";

const RevenueManagementPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [revenueStats, setRevenueStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
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
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const fetchRevenueStats = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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
        // sendPaginated returns: { success: true, message, data: payments[], pagination: {...} }
        // So data is the payments array directly, not an object with payments property
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

  const getStatusLabel = (status) => {
    const statusMap = {
      completed: { label: "Thành công", className: styles.statusSuccess },
      pending: { label: "Đang chờ", className: styles.statusPending },
      failed: { label: "Thất bại", className: styles.statusFailed },
    };
    return statusMap[status] || { label: status, className: styles.statusDefault };
  };

  const getGatewayLabel = (gateway) => {
    const gatewayMap = {
      vnpay: "VNPay",
      momo: "MoMo",
      paypal: "PayPal",
    };
    return gatewayMap[gateway] || gateway;
  };

  if (loading && !revenueStats) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.loading}>Đang tải...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Quản lý doanh thu</h1>
          <p>Thống kê và quản lý doanh thu hệ thống</p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Từ ngày:</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Đến ngày:</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Trạng thái:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Tất cả</option>
              <option value="completed">Thành công</option>
              <option value="pending">Đang chờ</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Cổng thanh toán:</label>
            <select
              value={filters.paymentGateway}
              onChange={(e) => handleFilterChange("paymentGateway", e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Tất cả</option>
              <option value="vnpay">VNPay</option>
              <option value="momo">MoMo</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
        </div>

        {/* Revenue Stats */}
        {revenueStats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>💰</div>
              <div className={styles.statContent}>
                <h3>Tổng doanh thu</h3>
                <p className={styles.statValue}>
                  {formatCurrency(revenueStats.totalRevenue, "VND")}
                </p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}></div>
              <div className={styles.statContent}>
                <h3>Giao dịch thành công</h3>
                <p className={styles.statValue}>
                  {revenueStats.statistics?.completedPayments || 0}
                </p>
                <div className={styles.statDetails}>
                  <span>
                    Tỷ lệ thành công: {revenueStats.statistics?.successRate || 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}></div>
              <div className={styles.statContent}>
                <h3>Đang chờ</h3>
                <p className={styles.statValue}>
                  {revenueStats.statistics?.pendingPayments || 0}
                </p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}></div>
              <div className={styles.statContent}>
                <h3>Thất bại</h3>
                <p className={styles.statValue}>
                  {revenueStats.statistics?.failedPayments || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Revenue by Gateway */}
        {revenueStats?.revenueByGateway && revenueStats.revenueByGateway.length > 0 && (
          <div className={styles.section}>
            <h2>Doanh thu theo cổng thanh toán</h2>
            <div className={styles.gatewayStats}>
              {revenueStats.revenueByGateway.map((item) => (
                <div key={item.gateway} className={styles.gatewayCard}>
                  <h3>{getGatewayLabel(item.gateway)}</h3>
                  <p className={styles.gatewayAmount}>
                    {formatCurrency(item.total, "VND")}
                  </p>
                  <p className={styles.gatewayCount}>{item.count} giao dịch</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payments Table */}
        <div className={styles.section}>
          <h2>Danh sách giao dịch</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người dùng</th>
                  <th>Số tiền</th>
                  <th>Cổng thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {paymentsLoading ? (
                  <tr>
                    <td colSpan="6" className={styles.loading}>
                      Đang tải...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.noData}>
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => {
                    const statusInfo = getStatusLabel(payment.status);
                    return (
                      <tr key={payment.id}>
                        <td>{payment.id}</td>
                        <td>
                          {payment.user?.fullName || payment.userId}
                          <br />
                          <small style={{ color: "#666" }}>{payment.user?.email}</small>
                        </td>
                        <td>{formatCurrency(payment.amount, payment.currency)}</td>
                        <td>{getGatewayLabel(payment.paymentGateway)}</td>
                        <td>
                          <span className={statusInfo.className}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td>
                          {new Date(payment.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
                }
                disabled={pagination.page === 1}
                className={styles.pageButton}
              >
                Trước
              </button>
              <span className={styles.pageInfo}>
                Trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.total})
              </span>
              <button
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    page: Math.min(p.totalPages, p.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.totalPages}
                className={styles.pageButton}
              >
                Sau
              </button>
            </div>
          )}
        </div>

        <div className={styles.backButton}>
          <button onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)} className={styles.backBtn}>
            ← Quay lại Dashboard
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RevenueManagementPage;

