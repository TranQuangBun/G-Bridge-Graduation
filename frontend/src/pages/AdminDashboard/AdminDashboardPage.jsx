import React, { useState, useEffect } from "react";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./AdminDashboardPage.module.css";
import {
  FaUsers,
  FaCertificate,
  FaBuilding,
  FaClock,
  FaSpinner,
  FaCheckCircle,
  FaBriefcase,
} from "react-icons/fa";

const AdminDashboardPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      window.location.href = ROUTES.DASHBOARD;
    }
  }, [isAuthenticated, authLoading, user]);

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
          <div className={styles.loading}>
            <FaSpinner className={styles.spinner} />
            <p>Đang tải dữ liệu...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.statsGrid}>
          {/* Users Stats */}
          <div className={`${styles.statCard} ${styles.statCardUsers}`}>
            <div className={styles.statIconWrapper}>
              <FaUsers className={styles.statIcon} />
            </div>
            <div className={styles.statContent}>
              <h3 className={styles.statTitle}>Tổng người dùng</h3>
              <p className={styles.statValue}>{stats.users?.total || 0}</p>
              <div className={styles.statDetails}>
                <span className={styles.statDetailItem}>
                  <span className={styles.statDetailLabel}>Phiên dịch viên:</span>
                  <span className={styles.statDetailValue}>{stats.users?.interpreters || 0}</span>
                </span>
                <span className={styles.statDetailItem}>
                  <span className={styles.statDetailLabel}>Khách hàng:</span>
                  <span className={styles.statDetailValue}>{stats.users?.clients || 0}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className={`${styles.statCard} ${styles.statCardPending}`}>
            <div className={styles.statIconWrapper}>
              <FaClock className={styles.statIcon} />
            </div>
            <div className={styles.statContent}>
              <h3 className={styles.statTitle}>Chờ duyệt</h3>
              <p className={styles.statValue}>{stats.pendingApprovals?.total || 0}</p>
              <div className={styles.statDetails}>
                <span className={styles.statDetailItem}>
                  <span className={styles.statDetailLabel}>Chứng chỉ:</span>
                  <span className={styles.statDetailValue}>{stats.pendingApprovals?.certifications || 0}</span>
                </span>
                <span className={styles.statDetailItem}>
                  <span className={styles.statDetailLabel}>Tổ chức:</span>
                  <span className={styles.statDetailValue}>{stats.pendingApprovals?.organizations || 0}</span>
                </span>
                <span className={styles.statDetailItem}>
                  <span className={styles.statDetailLabel}>Công việc:</span>
                  <span className={styles.statDetailValue}>{stats.pendingApprovals?.jobs || 0}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Total Certifications */}
          <div className={`${styles.statCard} ${styles.statCardCertificates}`}>
            <div className={styles.statIconWrapper}>
              <FaCertificate className={styles.statIcon} />
            </div>
            <div className={styles.statContent}>
              <h3 className={styles.statTitle}>Tổng chứng chỉ</h3>
              <p className={styles.statValue}>{stats.total?.certifications || 0}</p>
              <div className={styles.statDetails}>
                <span className={styles.statDetailItem}>
                  <span className={styles.statDetailLabel}>Đã duyệt:</span>
                  <span className={styles.statDetailValue}>
                    <FaCheckCircle style={{ color: "#10b981", marginRight: "4px" }} />
                    {stats.total?.certifications - (stats.pendingApprovals?.certifications || 0) || 0}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Total Organizations */}
          <div className={`${styles.statCard} ${styles.statCardOrganizations}`}>
            <div className={styles.statIconWrapper}>
              <FaBuilding className={styles.statIcon} />
            </div>
            <div className={styles.statContent}>
              <h3 className={styles.statTitle}>Tổng tổ chức</h3>
              <p className={styles.statValue}>{stats.total?.organizations || 0}</p>
              <div className={styles.statDetails}>
                <span className={styles.statDetailItem}>
                  <span className={styles.statDetailLabel}>Đã duyệt:</span>
                  <span className={styles.statDetailValue}>
                    <FaCheckCircle style={{ color: "#10b981", marginRight: "4px" }} />
                    {stats.total?.organizations - (stats.pendingApprovals?.organizations || 0) || 0}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Total Jobs */}
          {stats.total?.jobs !== undefined && (
            <div className={`${styles.statCard} ${styles.statCardJobs}`}>
              <div className={styles.statIconWrapper}>
                <FaBriefcase className={styles.statIcon} />
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statTitle}>Tổng công việc</h3>
                <p className={styles.statValue}>{stats.total?.jobs || 0}</p>
                <div className={styles.statDetails}>
                  <span className={styles.statDetailItem}>
                    <span className={styles.statDetailLabel}>Đã duyệt:</span>
                    <span className={styles.statDetailValue}>
                      <FaCheckCircle style={{ color: "#10b981", marginRight: "4px" }} />
                      {stats.total?.jobs - (stats.pendingApprovals?.jobs || 0) || 0}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;

