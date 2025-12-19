import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./AdminDashboardPage.module.css";

const AdminDashboardPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchStats();
    }
  }, [isAuthenticated, user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await adminService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
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
          <h1>Bảng điều khiển Admin</h1>
          <p>Quản lý hệ thống G-Bridge</p>
        </div>

        <div className={styles.statsGrid}>
          {/* Users Stats */}
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <h3>Tổng người dùng</h3>
              <p className={styles.statValue}>{stats.users?.total || 0}</p>
              <div className={styles.statDetails}>
                <span>Phiên dịch viên: {stats.users?.interpreters || 0}</span>
                <span>Khách hàng: {stats.users?.clients || 0}</span>
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statContent}>
              <h3>Chờ duyệt</h3>
              <p className={styles.statValue}>{stats.pendingApprovals?.total || 0}</p>
              <div className={styles.statDetails}>
                <span>Chứng chỉ: {stats.pendingApprovals?.certifications || 0}</span>
                <span>Tổ chức: {stats.pendingApprovals?.organizations || 0}</span>
              </div>
            </div>
          </div>

          {/* Total Certifications */}
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📜</div>
            <div className={styles.statContent}>
              <h3>Tổng chứng chỉ</h3>
              <p className={styles.statValue}>{stats.total?.certifications || 0}</p>
            </div>
          </div>

          {/* Total Organizations */}
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏢</div>
            <div className={styles.statContent}>
              <h3>Tổng tổ chức</h3>
              <p className={styles.statValue}>{stats.total?.organizations || 0}</p>
            </div>
          </div>
        </div>

        <div className={styles.quickActions}>
          <h2>Thao tác nhanh</h2>
          <div className={styles.actionsGrid}>
            <button
              className={styles.actionButton}
              onClick={() => navigate("/admin/certifications")}
            >
              <span className={styles.actionIcon}>✓</span>
              <span>Duyệt chứng chỉ</span>
              {stats.pendingApprovals?.certifications > 0 && (
                <span className={styles.badge}>
                  {stats.pendingApprovals.certifications}
                </span>
              )}
            </button>
            <button
              className={styles.actionButton}
              onClick={() => navigate("/admin/organizations")}
            >
              <span className={styles.actionIcon}>🏢</span>
              <span>Duyệt tổ chức</span>
              {stats.pendingApprovals?.organizations > 0 && (
                <span className={styles.badge}>
                  {stats.pendingApprovals.organizations}
                </span>
              )}
            </button>
            <button
              className={styles.actionButton}
              onClick={() => navigate("/admin/notifications")}
            >
              <span className={styles.actionIcon}>📢</span>
              <span>Tạo thông báo hệ thống</span>
            </button>
            <button
              className={styles.actionButton}
              onClick={() => navigate(ROUTES.ADMIN_USERS)}
            >
              <span className={styles.actionIcon}>👥</span>
              <span>Quản lý tài khoản</span>
            </button>
            <button
              className={styles.actionButton}
              onClick={() => navigate(ROUTES.ADMIN_REVENUE)}
            >
              <span className={styles.actionIcon}>💰</span>
              <span>Quản lý doanh thu</span>
            </button>
            <button
              className={styles.actionButton}
              onClick={() => navigate(ROUTES.ADMIN_JOB_MODERATION)}
            >
              <span className={styles.actionIcon}>💼</span>
              <span>Duyệt công việc</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;

