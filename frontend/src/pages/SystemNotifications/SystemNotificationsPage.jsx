import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import alertService from "../../services/alertService";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, convertToRaw } from "draft-js";
import draftToHtml from "draftjs-to-html";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import styles from "./SystemNotificationsPage.module.css";
import commonStyles from "../../styles/adminCommon.module.css";
import { FaSpinner, FaPlus, FaBell } from "react-icons/fa";

const SystemNotificationsPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    recipientEmails: "",
    sendToAll: true,
  });
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      window.location.href = ROUTES.DASHBOARD;
    }
  }, [isAuthenticated, authLoading, user]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getSystemNotifications({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.success) {
        const notificationsData = Array.isArray(response.data)
          ? response.data
          : response.data?.notifications || [];
        const paginationData = response.pagination || response.data?.pagination;
        setNotifications(notificationsData);
        if (paginationData) {
          setPagination((prev) => paginationData || prev);
        }
      }
    } catch (error) {
      console.error("Error fetching system notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchNotifications();
    }
  }, [isAuthenticated, user, fetchNotifications]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    const messageText = htmlContent.replace(/<[^>]*>/g, "").trim();
    if (!messageText) {
      await alertService.error("Nội dung thông báo không được để trống");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        title: formData.title,
        message: htmlContent,
        ...(formData.sendToAll
          ? {}
          : {
              recipientEmails: formData.recipientEmails
                .split(",")
                .map((email) => email.trim())
                .filter((email) => email.length > 0),
            }),
      };

      const response = await adminService.createSystemNotification(payload);
      if (response.success) {
        await alertService.success(`Thông báo đã được gửi đến ${response.data?.count || 0} người dùng`);
        setShowModal(false);
        setFormData({
          title: "",
          message: "",
          recipientEmails: "",
          sendToAll: true,
        });
        setEditorState(EditorState.createEmpty());
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error creating system notification:", error);
      await alertService.error(error.message || "Không thể tạo thông báo");
    } finally {
      setSubmitting(false);
    }
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

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").substring(0, 100);
  };

  return (
    <AdminLayout>
      <div className={commonStyles.adminContainer}>
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "flex-start" }}>
          <button
            className={`${commonStyles.adminButton} ${commonStyles.adminButtonPrimary}`}
            onClick={() => setShowModal(true)}
          >
            <FaPlus style={{ marginRight: "8px" }} />
            Tạo thông báo
          </button>
        </div>

        {loading ? (
          <div className={commonStyles.adminLoading}>
            <FaSpinner className={commonStyles.adminSpinner} />
            <p>Đang tải...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={commonStyles.adminEmpty}>
            <FaBell style={{ fontSize: "3rem", color: "#cbd5e1", marginBottom: "1rem" }} />
            <p>Chưa có thông báo hệ thống nào</p>
          </div>
        ) : (
          <div className={commonStyles.adminTableContainer}>
            <table className={commonStyles.adminTable}>
              <thead>
                <tr>
                  <th>Thứ tự</th>
                  <th>Tiêu đề</th>
                  <th>Nội dung</th>
                  <th>Số người nhận</th>
                  <th>Ngày gửi</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif, index) => (
                  <tr key={notif.id}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>
                      <strong>{notif.title}</strong>
                    </td>
                    <td>
                      <div
                        style={{
                          maxWidth: "400px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={stripHtml(notif.message)}
                      >
                        {stripHtml(notif.message)}
                        {stripHtml(notif.message).length >= 100 && "..."}
                      </div>
                    </td>
                    <td>{notif.recipientCount || 0}</td>
                    <td>{formatDate(notif.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Notification Modal */}
        {showModal && (
          <div
            className={commonStyles.adminModalOverlay}
            onClick={() => setShowModal(false)}
          >
            <div
              className={commonStyles.adminModal}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "800px", maxHeight: "90vh" }}
            >
              <div className={commonStyles.adminModalHeader}>
                <h3>Tạo thông báo hệ thống</h3>
                <button
                  className={commonStyles.adminModalCloseBtn}
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      title: "",
                      message: "",
                      recipientEmails: "",
                      sendToAll: true,
                    });
                    setEditorState(EditorState.createEmpty());
                  }}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className={commonStyles.adminModalBody} style={{ maxHeight: "calc(90vh - 200px)", overflowY: "auto" }}>
                  <div className={styles.formGroup}>
                    <label className={commonStyles.adminFilterLabel} style={{ display: "block", marginBottom: "0.5rem" }}>
                      Tiêu đề <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={commonStyles.adminFilterInput}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Nhập tiêu đề thông báo"
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={commonStyles.adminFilterLabel} style={{ display: "block", marginBottom: "0.5rem" }}>
                      Nội dung <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <div className={styles.editorWrapper}>
                      <Editor
                        editorState={editorState}
                        onEditorStateChange={setEditorState}
                        placeholder="Nhập nội dung thông báo..."
                        toolbar={{
                          options: [
                            "inline",
                            "blockType",
                            "fontSize",
                            "list",
                            "textAlign",
                            "colorPicker",
                            "link",
                            "remove",
                            "history",
                          ],
                          inline: {
                            options: ["bold", "italic", "underline"],
                          },
                          blockType: {
                            options: ["Normal", "H1", "H2", "H3", "Blockquote"],
                          },
                          fontSize: {
                            options: [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96],
                          },
                          list: {
                            options: ["unordered", "ordered"],
                          },
                          textAlign: {
                            options: ["left", "center", "right", "justify"],
                          },
                        }}
                        editorClassName={styles.editor}
                      />
                    </div>
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
                      <label className={commonStyles.adminFilterLabel} style={{ display: "block", marginBottom: "0.5rem" }}>
                        Email người nhận (phân cách bằng dấu phẩy)
                      </label>
                      <input
                        type="email"
                        className={commonStyles.adminFilterInput}
                        value={formData.recipientEmails}
                        onChange={(e) =>
                          setFormData({ ...formData, recipientEmails: e.target.value })
                        }
                        placeholder="Ví dụ: user1@example.com, user2@example.com"
                        style={{ width: "100%" }}
                        multiple
                      />
                      <small className={styles.helpText}>
                        Nhập email đăng ký của người dùng, phân cách bằng dấu phẩy
                      </small>
                    </div>
                  )}
                </div>
                <div className={commonStyles.adminModalActions}>
                  <button
                    type="button"
                    className={`${commonStyles.adminButton} ${commonStyles.adminButtonSecondary}`}
                    onClick={() => {
                      setShowModal(false);
                      setFormData({
                        title: "",
                        message: "",
                        recipientIds: "",
                        sendToAll: true,
                      });
                      setEditorState(EditorState.createEmpty());
                    }}
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className={`${commonStyles.adminButton} ${commonStyles.adminButtonPrimary}`}
                    disabled={
                      submitting ||
                      !formData.title ||
                      !draftToHtml(convertToRaw(editorState.getCurrentContent()))
                        .replace(/<[^>]*>/g, "")
                        .trim()
                    }
                  >
                    {submitting ? "Đang gửi..." : "Gửi thông báo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SystemNotificationsPage;
