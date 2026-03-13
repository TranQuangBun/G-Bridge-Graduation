import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../translet/LanguageContext";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./AdminPaymentRecoveryPage.module.css";
import {
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaRedo,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";

const AdminPaymentRecoveryPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [restoreReason, setRestoreReason] = useState("");
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      window.location.href = ROUTES.DASHBOARD;
    }
  }, [isAuthenticated, authLoading, user]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getProblematicPayments({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.success) {
        setPayments(response.data || []);
        setPagination(response.pagination || pagination);
      }
    } catch (error) {
      console.error("Error fetching problematic payments:", error);
      toast.error(error.message || t("admin.paymentRecovery.messages.loadError") || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, t]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchPayments();
    }
  }, [isAuthenticated, user, fetchPayments]);

  const handleRestore = (payment) => {
    setSelectedPayment(payment);
    setShowRestoreModal(true);
    setRestoreReason("");
  };

  const confirmRestore = async () => {
    if (!selectedPayment) return;

    setRestoring(selectedPayment.id);
    try {
      const response = await adminService.restorePayment(
        selectedPayment.id,
        restoreReason
      );
      if (response.success) {
        toast.success(t("admin.paymentRecovery.messages.restoreSuccess") || "Payment restored successfully!");
        setShowRestoreModal(false);
        setSelectedPayment(null);
        setRestoreReason("");
        fetchPayments(); // Refresh list
      }
    } catch (error) {
      console.error("Error restoring payment:", error);
      toast.error(error.message || t("admin.paymentRecovery.messages.restoreError") || "Failed to restore payment");
    } finally {
      setRestoring(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle className={styles.statusIconSuccess} />;
      case "processing":
        return <FaClock className={styles.statusIconProcessing} />;
      case "failed":
        return <FaTimesCircle className={styles.statusIconFailed} />;
      default:
        return <FaExclamationTriangle className={styles.statusIconWarning} />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return t("admin.paymentRecovery.status.completed") || "Completed";
      case "processing":
        return t("admin.paymentRecovery.status.processing") || "Processing";
      case "failed":
        return t("admin.paymentRecovery.status.failed") || "Failed";
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("common.notAvailable") || "N/A";
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount, currency = "VND") => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (loading && payments.length === 0) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.loading}>
            <FaSpinner className={styles.spinner} />
            <p>{t("admin.paymentRecovery.loading") || "Đang tải dữ liệu..."}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t("admin.paymentRecovery.title") || "Khôi phục thanh toán"}</h1>
          <p className={styles.subtitle}>
            {t("admin.paymentRecovery.subtitle") || "Quản lý các thanh toán có vấn đề (processing/failed) và khôi phục gói cho user"}
          </p>
        </div>

        {payments.length === 0 ? (
          <div className={styles.emptyState}>
            <FaCheckCircle className={styles.emptyIcon} />
            <p>{t("admin.paymentRecovery.noPayments") || "Không có thanh toán nào cần khôi phục"}</p>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("admin.paymentRecovery.tableHeaders.id") || "ID"}</th>
                    <th>{t("admin.paymentRecovery.tableHeaders.user") || "User"}</th>
                    <th>{t("admin.paymentRecovery.tableHeaders.plan") || "Plan"}</th>
                    <th>{t("admin.paymentRecovery.tableHeaders.amount") || "Amount"}</th>
                    <th>{t("admin.paymentRecovery.tableHeaders.gateway") || "Gateway"}</th>
                    <th>{t("admin.paymentRecovery.tableHeaders.status") || "Status"}</th>
                    <th>{t("admin.paymentRecovery.tableHeaders.orderId") || "Order ID"}</th>
                    <th>{t("admin.paymentRecovery.tableHeaders.createdAt") || "Created At"}</th>
                    <th>{t("admin.paymentRecovery.tableHeaders.actions") || "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.id}</td>
                      <td>
                        {payment.user?.fullName || payment.user?.email || `${t("admin.paymentRecovery.tableHeaders.user") || "User"} #${payment.userId}`}
                      </td>
                      <td>{payment.plan?.name || `${t("admin.paymentRecovery.tableHeaders.plan") || "Plan"} #${payment.planId}`}</td>
                      <td>{formatCurrency(payment.amount, payment.currency)}</td>
                      <td>{payment.paymentGateway?.toUpperCase() || (t("common.notAvailable") || "N/A")}</td>
                      <td>
                        <div className={styles.statusCell}>
                          {getStatusIcon(payment.status)}
                          <span>{getStatusLabel(payment.status)}</span>
                        </div>
                      </td>
                      <td className={styles.orderIdCell}>{payment.orderId}</td>
                      <td>{formatDate(payment.createdAt)}</td>
                      <td>
                        <button
                          className={styles.restoreBtn}
                          onClick={() => handleRestore(payment)}
                          disabled={restoring === payment.id || payment.status === "completed"}
                        >
                          {restoring === payment.id ? (
                            <FaSpinner className={styles.spinner} />
                          ) : (
                            <FaRedo />
                          )}
                          <span>{t("admin.paymentRecovery.restore") || "Khôi phục"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                >
                  {t("admin.paymentRecovery.pagination.previous") || "Previous"}
                </button>
                <span>
                  {t("admin.paymentRecovery.pagination.page") || "Page"} {pagination.page} {t("admin.paymentRecovery.pagination.of") || "of"} {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page === pagination.totalPages}
                >
                  {t("admin.paymentRecovery.pagination.next") || "Next"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Restore Modal */}
        {showRestoreModal && selectedPayment && (
          <div className={styles.modalOverlay} onClick={() => setShowRestoreModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{t("admin.paymentRecovery.modal.title") || "Khôi phục thanh toán"}</h2>
                <button
                  className={styles.modalClose}
                  onClick={() => setShowRestoreModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>
                  {t("admin.paymentRecovery.modal.confirmMessage") || "Bạn có chắc chắn muốn khôi phục thanh toán này và tạo subscription cho user?"}
                </p>
                <div className={styles.paymentInfo}>
                  <p>
                    <strong>{t("admin.paymentRecovery.modal.paymentId") || "Payment ID"}:</strong> {selectedPayment.id}
                  </p>
                  <p>
                    <strong>{t("admin.paymentRecovery.modal.user") || "User"}:</strong> {selectedPayment.user?.fullName || selectedPayment.user?.email}
                  </p>
                  <p>
                    <strong>{t("admin.paymentRecovery.modal.plan") || "Plan"}:</strong> {selectedPayment.plan?.name}
                  </p>
                  <p>
                    <strong>{t("admin.paymentRecovery.modal.amount") || "Amount"}:</strong> {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </p>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="reason">{t("admin.paymentRecovery.modal.reasonLabel") || "Lý do khôi phục (tùy chọn)"}:</label>
                  <textarea
                    id="reason"
                    value={restoreReason}
                    onChange={(e) => setRestoreReason(e.target.value)}
                    placeholder={t("admin.paymentRecovery.modal.reasonPlaceholder") || "Nhập lý do khôi phục..."}
                    rows="3"
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowRestoreModal(false)}
                >
                  {t("admin.paymentRecovery.modal.cancel") || "Hủy"}
                </button>
                <button
                  className={styles.confirmBtn}
                  onClick={confirmRestore}
                  disabled={restoring}
                >
                  {restoring ? (
                    <>
                      <FaSpinner className={styles.spinner} />
                      {t("admin.paymentRecovery.modal.processing") || "Đang xử lý..."}
                    </>
                  ) : (
                    t("admin.paymentRecovery.modal.confirm") || "Xác nhận khôi phục"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentRecoveryPage;

