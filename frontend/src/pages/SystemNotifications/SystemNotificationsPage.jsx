import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./SystemNotificationsPage.module.css";

const SystemNotificationsPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    recipientIds: "",
    sendToAll: true,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        ...(formData.sendToAll
          ? {}
          : {
              recipientIds: formData.recipientIds
                .split(",")
                .map((id) => parseInt(id.trim()))
                .filter((id) => !isNaN(id)),
            }),
      };

      const response = await adminService.createSystemNotification(payload);
      if (response.success) {
        setSuccess(true);
        setFormData({
          title: "",
          message: "",
          recipientIds: "",
          sendToAll: true,
        });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error creating system notification:", error);
      alert(error.message || "Không thể tạo thông báo hệ thống");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Tạo thông báo hệ thống</h1>
          <p>Gửi thông báo đến người dùng</p>
        </div>

        {success && (
          <div className={styles.successMessage}>
            Thông báo đã được gửi thành công!
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Tiêu đề *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Nhập tiêu đề thông báo"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message">Nội dung *</label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={6}
              placeholder="Nhập nội dung thông báo"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.sendToAll}
                onChange={(e) =>
                  setFormData({ ...formData, sendToAll: e.target.checked })
                }
              />
              <span>Gửi đến tất cả người dùng</span>
            </label>
          </div>

          {!formData.sendToAll && (
            <div className={styles.formGroup}>
              <label htmlFor="recipientIds">
                ID người nhận (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                id="recipientIds"
                value={formData.recipientIds}
                onChange={(e) =>
                  setFormData({ ...formData, recipientIds: e.target.value })
                }
                placeholder="Ví dụ: 1, 2, 3"
              />
              <small className={styles.helpText}>
                Nhập ID của người dùng, phân cách bằng dấu phẩy
              </small>
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => navigate("/admin/dashboard")}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !formData.title || !formData.message}
            >
              {loading ? "Đang gửi..." : "Gửi thông báo"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SystemNotificationsPage;

