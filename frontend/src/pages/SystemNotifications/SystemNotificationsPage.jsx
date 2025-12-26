import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../translet/LanguageContext";
import alertService from "../../services/alertService";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, convertToRaw } from "draft-js";
import draftToHtml from "draftjs-to-html";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import styles from "./SystemNotificationsPage.module.css";
import commonStyles from "../../styles/adminCommon.module.css";
import { FaSpinner, FaPlus, FaBell, FaCopy } from "react-icons/fa";

const SystemNotificationsPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
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
  const [search, setSearch] = useState("");
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [recipientFilter, setRecipientFilter] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      window.location.href = ROUTES.DASHBOARD;
    }
  }, [isAuthenticated, authLoading, user]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await adminService.getSystemNotifications(params);
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
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      const timeoutId = setTimeout(
        () => {
          fetchNotifications();
        },
        search ? 500 : 0
      );
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, user, fetchNotifications, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    const messageText = htmlContent.replace(/<[^>]*>/g, "").trim();
    if (!messageText) {
      await alertService.error(t("admin.systemNotifications.contentEmpty") || "Nội dung thông báo không được để trống");
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
        const count = response.data?.count || 0;
        await alertService.success(
          (t("admin.systemNotifications.sendSuccess") || "Thông báo đã được gửi đến {count} người dùng").replace("{count}", count)
        );
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
      await alertService.error(error.message || t("admin.systemNotifications.createFailed") || "Không thể tạo thông báo");
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

  const getPlainText = (html) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleCopyContent = async (content) => {
    try {
      const textContent = getPlainText(content);
      await navigator.clipboard.writeText(textContent);
      await alertService.success(t("admin.systemNotifications.contentCopied") || "Đã sao chép nội dung");
    } catch (error) {
      console.error("Failed to copy content:", error);
      await alertService.error(t("admin.systemNotifications.copyFailed") || "Không thể sao chép nội dung");
    }
  };

  return (
    <AdminLayout>
      <div className={commonStyles.adminContainer}>
        <div className={commonStyles.adminFilters} style={{ marginBottom: "1.5rem" }}>
          <div className={commonStyles.adminFilterGroup} style={{ flex: 1, minWidth: "300px" }}>
            <input
              type="text"
              className={commonStyles.adminFilterInput}
              placeholder={t("admin.systemNotifications.searchPlaceholder") || "Tìm kiếm theo tiêu đề hoặc nội dung..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          <div className={commonStyles.adminFilterGroup}>
            <button
              className={`${commonStyles.adminButton} ${commonStyles.adminButtonPrimary}`}
              onClick={() => setShowModal(true)}
            >
              <FaPlus style={{ marginRight: "8px" }} />
              {t("admin.systemNotifications.createNotification") || "Tạo thông báo"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className={commonStyles.adminLoading}>
            <FaSpinner className={commonStyles.adminSpinner} />
            <p>{t("admin.systemNotifications.loading") || "Đang tải..."}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={commonStyles.adminEmpty}>
            <FaBell style={{ fontSize: "3rem", color: "#cbd5e1", marginBottom: "1rem" }} />
            <p>{t("admin.systemNotifications.noNotifications") || "Chưa có thông báo hệ thống nào"}</p>
          </div>
        ) : (
          <div className={commonStyles.adminTableContainer}>
            <table className={commonStyles.adminTable}>
              <thead>
                <tr>
                  <th>{t("admin.systemNotifications.order") || "Thứ tự"}</th>
                  <th>{t("admin.systemNotifications.title") || "Tiêu đề"}</th>
                  <th>{t("admin.systemNotifications.content") || "Nội dung"}</th>
                  <th>{t("admin.systemNotifications.recipients") || "Số người nhận"}</th>
                  <th>{t("admin.systemNotifications.sentDate") || "Ngày gửi"}</th>
                  <th></th>
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
                    <td style={{ textAlign: "right" }}>
                      <button
                        className={`${commonStyles.adminButton} ${commonStyles.adminButtonSecondary}`}
                        onClick={() => {
                          setSelectedNotification(notif);
                          setShowRecipientsModal(true);
                        }}
                        style={{ fontSize: "0.875rem", padding: "0.5rem 1rem", whiteSpace: "nowrap" }}
                      >
                        {t("admin.systemNotifications.viewRecipients") || "Xem người nhận"}
                      </button>
                    </td>
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
                <h3>{t("admin.systemNotifications.createTitle") || "Tạo thông báo hệ thống"}</h3>
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
                      {t("admin.systemNotifications.titleLabel") || "Tiêu đề"} <span style={{ color: "#ef4444" }}>{t("admin.systemNotifications.titleRequired") || "*"}</span>
                    </label>
                    <input
                      type="text"
                      className={commonStyles.adminFilterInput}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder={t("admin.systemNotifications.titlePlaceholder") || "Nhập tiêu đề thông báo"}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={commonStyles.adminFilterLabel} style={{ display: "block", marginBottom: "0.5rem" }}>
                      {t("admin.systemNotifications.contentLabel") || "Nội dung"} <span style={{ color: "#ef4444" }}>{t("admin.systemNotifications.contentRequired") || "*"}</span>
                    </label>
                    <div className={styles.editorWrapper}>
                      <Editor
                        editorState={editorState}
                        onEditorStateChange={setEditorState}
                        placeholder={t("admin.systemNotifications.contentPlaceholder") || "Nhập nội dung thông báo..."}
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
                      <span>{t("admin.systemNotifications.sendToAll") || "Gửi đến tất cả người dùng"}</span>
                    </label>
                  </div>

                  {!formData.sendToAll && (
                    <div className={styles.formGroup}>
                      <label className={commonStyles.adminFilterLabel} style={{ display: "block", marginBottom: "0.5rem" }}>
                        {t("admin.systemNotifications.recipientEmailsLabel") || "Email người nhận (phân cách bằng dấu phẩy)"}
                      </label>
                      <input
                        type="email"
                        className={commonStyles.adminFilterInput}
                        value={formData.recipientEmails}
                        onChange={(e) =>
                          setFormData({ ...formData, recipientEmails: e.target.value })
                        }
                        placeholder={t("admin.systemNotifications.recipientEmailsPlaceholder") || "Ví dụ: user1@example.com, user2@example.com"}
                        style={{ width: "100%" }}
                        multiple
                      />
                      <small className={styles.helpText}>
                        {t("admin.systemNotifications.recipientEmailsHelp") || "Nhập email đăng ký của người dùng, phân cách bằng dấu phẩy"}
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
                    {t("admin.systemNotifications.cancel") || "Hủy"}
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
                    {submitting ? (t("admin.systemNotifications.submitting") || "Đang gửi...") : (t("admin.systemNotifications.submit") || "Gửi thông báo")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Recipients Modal */}
        {showRecipientsModal && selectedNotification && (
          <div
            className={commonStyles.adminModalOverlay}
            onClick={() => {
              setShowRecipientsModal(false);
              setSelectedNotification(null);
              setRecipientFilter("");
            }}
          >
            <div
              className={commonStyles.adminModal}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "600px", maxHeight: "80vh" }}
            >
              <div className={commonStyles.adminModalHeader}>
                <h3>{t("admin.systemNotifications.recipientsList") || "Danh sách người nhận"}</h3>
                <button
                  className={commonStyles.adminModalCloseBtn}
                  onClick={() => {
                    setShowRecipientsModal(false);
                    setSelectedNotification(null);
                    setRecipientFilter("");
                  }}
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.adminModalBody} style={{ maxHeight: "calc(80vh - 150px)", overflowY: "auto" }}>
                <div className={commonStyles.adminModalSection}>
                  <h3 style={{ marginBottom: "1rem", color: "#0f172a", fontSize: "1.125rem", fontWeight: 600 }}>
                    {t("admin.systemNotifications.notificationDetails") || "Chi tiết thông báo"}
                  </h3>
                  <div style={{ marginBottom: "1rem", padding: "1rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                    <div style={{ marginBottom: "0.75rem", color: "#374151" }}>
                      <strong style={{ color: "#64748b", display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
                        {t("admin.systemNotifications.title") || "Tiêu đề"}
                      </strong>
                      <span style={{ color: "#0f172a", fontWeight: 600, fontSize: "1rem" }}>{selectedNotification.title}</span>
                    </div>
                    <div style={{ marginBottom: "0.75rem", color: "#374151" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <strong style={{ color: "#64748b", fontSize: "0.875rem" }}>
                          {t("admin.systemNotifications.content") || "Nội dung"}
                        </strong>
                        <button
                          onClick={() => handleCopyContent(selectedNotification.message || "")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.375rem 0.75rem",
                            background: "#f3f4f6",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            color: "#374151",
                            fontSize: "0.875rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.borderColor = "#9ca3af";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#f3f4f6";
                            e.currentTarget.style.borderColor = "#d1d5db";
                          }}
                        >
                          <FaCopy size={14} />
                          <span>{t("admin.systemNotifications.copyContent") || "Sao chép"}</span>
                        </button>
                      </div>
                      <div
                        style={{
                          marginTop: "0.5rem",
                          padding: "0.75rem",
                          background: "#ffffff",
                          borderRadius: "6px",
                          border: "1px solid #e5e7eb",
                          color: "#374151",
                          lineHeight: "1.6",
                          maxHeight: "200px",
                          overflowY: "auto",
                        }}
                        dangerouslySetInnerHTML={{ __html: selectedNotification.message || "" }}
                      />
                    </div>
                  </div>
                </div>
                <div className={commonStyles.adminModalSection}>
                  <h3 style={{ marginBottom: "1rem", color: "#0f172a", fontSize: "1.125rem" }}>
                    {t("admin.systemNotifications.recipientsList") || "Danh sách người nhận"}
                  </h3>
                  {selectedNotification.recipients && selectedNotification.recipients.length > 0 ? (
                    <>
                      <div style={{ marginBottom: "1rem" }}>
                        <input
                          type="text"
                          className={commonStyles.adminFilterInput}
                          placeholder={t("admin.systemNotifications.filterRecipients") || "Lọc theo tên hoặc email..."}
                          value={recipientFilter}
                          onChange={(e) => setRecipientFilter(e.target.value)}
                        />
                      </div>
                      {(() => {
                        const filteredRecipients = selectedNotification.recipients.filter((recipient) => {
                          if (!recipientFilter) return true;
                          const searchTerm = recipientFilter.toLowerCase();
                          const name = (recipient.name || "").toLowerCase();
                          const email = (recipient.email || "").toLowerCase();
                          return name.includes(searchTerm) || email.includes(searchTerm);
                        });

                        return filteredRecipients.length > 0 ? (
                          <div className={commonStyles.adminTableContainer}>
                            <table className={commonStyles.adminTable}>
                              <thead>
                                <tr>
                                  <th style={{ width: "80px" }}>{t("admin.systemNotifications.order") || "Thứ tự"}</th>
                                  <th>{t("admin.systemNotifications.recipientName") || "Tên"}</th>
                                  <th>{t("admin.systemNotifications.recipientEmail") || "Email"}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredRecipients.map((recipient, idx) => (
                                  <tr key={recipient.id || idx}>
                                    <td>{idx + 1}</td>
                                    <td>{recipient.name || "N/A"}</td>
                                    <td>{recipient.email || "N/A"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className={commonStyles.adminEmpty}>
                            <p>{t("admin.systemNotifications.noRecipientsFound") || "Không tìm thấy người nhận"}</p>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className={commonStyles.adminEmpty}>
                      <p>{t("admin.systemNotifications.noRecipients") || "Không có người nhận"}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className={commonStyles.adminModalActions}>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonSecondary}`}
                  onClick={() => {
                    setShowRecipientsModal(false);
                    setSelectedNotification(null);
                    setRecipientFilter("");
                  }}
                >
                  {t("admin.systemNotifications.close") || "Đóng"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SystemNotificationsPage;
