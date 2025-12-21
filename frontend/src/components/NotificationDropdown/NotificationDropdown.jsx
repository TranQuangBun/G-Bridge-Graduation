import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NotificationDropdown.module.css";
import notificationService from "../../services/notificationService";
import { ROUTES } from "../../constants";
import { useLanguage } from "../../translet/LanguageContext";
import { FaBell } from "react-icons/fa";

const NotificationDropdown = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const dropdownRef = useRef(null);

  // Helper function to translate notification content
  const translateNotification = (notification) => {
    const { title, message, metadata } = notification;

    // Check if this is an organization notification that needs translation
    if (metadata?.type === "organization_approved") {
      const orgName =
        metadata.organizationName || title.match(/"([^"]+)"/)?.[1] || "";
      return {
        title: t(
          "dashboard.notifications.organizationApproved.title",
          "Organization Approved"
        ),
        message: t(
          "dashboard.notifications.organizationApproved.message",
          `Your organization "${orgName}" has been approved successfully.`
        ).replace("{{name}}", orgName),
      };
    }

    if (metadata?.type === "organization_rejected") {
      const orgName =
        metadata.organizationName || title.match(/"([^"]+)"/)?.[1] || "";
      const reason = metadata.reason || "";
      const translationKey = reason
        ? "dashboard.notifications.organizationRejected.messageWithReason"
        : "dashboard.notifications.organizationRejected.message";
      const fallback = reason
        ? `Your organization "${orgName}" has been rejected. Reason: ${reason}`
        : `Your organization "${orgName}" has been rejected.`;

      return {
        title: t(
          "dashboard.notifications.organizationRejected.title",
          "Organization Rejected"
        ),
        message: t(translationKey, fallback)
          .replace("{{name}}", orgName)
          .replace("{{reason}}", reason),
      };
    }

    // Return original for other notification types
    return { title, message };
  };

  // Fetch unread count on mount and periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationService.getMyNotifications({
          limit: 100, // Get enough to count all unread
        });
        const data = response?.data?.notifications || [];
        const count = data.filter((n) => !n.isRead).length;
        setUnreadCount(count);
      } catch (err) {
        console.error("Failed to fetch unread count:", err);
      }
    };

    // Fetch immediately on mount
    fetchUnreadCount();

    // Poll every 30 seconds to keep badge updated
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void fetchNotifications();
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getMyNotifications({
        limit: 8,
      });
      const data = response?.data?.notifications || [];
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await notificationService.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate(`${ROUTES.DASHBOARD}?section=notifications`);
  };

  return (
    <div className={styles.dropdownWrapper} ref={dropdownRef}>
      <button
        className={styles.notificationBtn}
        title={t("dashboard.notifications.title") || t("common.notifications")}
        onClick={handleToggle}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className={styles.notificationBadge}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdownPanel}>
          <div className={styles.dropdownHeader}>
            <h4>
              {t("dashboard.notifications.title") ||
                t("common.notifications") ||
                "Notifications"}
            </h4>
            <button onClick={handleViewAll}>
              {t("dashboard.notifications.viewAll") || "View all"}
            </button>
          </div>
          <div className={styles.dropdownContent}>
            {loading ? (
              <div className={styles.dropdownEmpty}>
                {t("common.loading") || "Loading..."}
              </div>
            ) : error ? (
              <div className={styles.dropdownEmpty}>{error}</div>
            ) : notifications.length === 0 ? (
              <div className={styles.dropdownEmpty}>
                {t("dashboard.notifications.empty") || "You're all caught up!"}
              </div>
            ) : (
              notifications.map((notification) => {
                const { title, message } = translateNotification(notification);
                return (
                  <button
                    key={notification.id}
                    className={`${styles.dropdownItem} ${
                      !notification.isRead ? styles.unread : ""
                    }`}
                    onClick={() => {
                      setIsOpen(false);
                      setSelectedNotification(notification);
                      setShowModal(true);
                      if (!notification.isRead) {
                        handleMarkNotificationRead(notification.id);
                      }
                    }}
                    title={`${title}${message ? "\n" + message : ""}`}
                  >
                    <div className={styles.itemTitle}>{title}</div>
                    {message && <p className={styles.itemMessage}>{message}</p>}
                  </button>
                );
              })
            )}
          </div>
          {notifications.length > 0 && (
            <div className={styles.dropdownFooter}>
              <button onClick={handleViewAll}>
                {t("dashboard.notifications.viewAll") || "View all"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notification Detail Modal */}
      {showModal && selectedNotification && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div
            className={styles.notificationModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.modalIcon}>
                  {selectedNotification.type?.includes("approved") ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : selectedNotification.type?.includes("rejected") ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div className={styles.modalHeaderText}>
                  <h3>{translateNotification(selectedNotification).title}</h3>
                  <span className={styles.modalType}>
                    {selectedNotification.type?.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalInfo}>
                <div className={styles.modalInfoItem}>
                  <span className={styles.modalLabel}>
                    {t("notificationsPage.time") || "Time"}:
                  </span>
                  <span className={styles.modalValue}>
                    {new Date(selectedNotification.createdAt).toLocaleString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
                <div className={styles.modalInfoItem}>
                  <span className={styles.modalLabel}>
                    {t("notificationsPage.status") || "Status"}:
                  </span>
                  <span
                    className={`${styles.modalValue} ${
                      selectedNotification.isRead
                        ? styles.statusRead
                        : styles.statusUnread
                    }`}
                  >
                    {selectedNotification.isRead
                      ? t("notificationsPage.read") || "Read"
                      : t("notificationsPage.unread") || "Unread"}
                  </span>
                </div>
              </div>

              {selectedNotification.message && (
                <div className={styles.modalMessage}>
                  <h4>{t("notificationsPage.message") || "Message"}</h4>
                  <p>{translateNotification(selectedNotification).message}</p>
                </div>
              )}

              {selectedNotification.metadata &&
                (() => {
                  // Filter out technical fields that users don't need to see
                  const filteredMetadata = Object.entries(
                    selectedNotification.metadata
                  ).filter(([key]) => {
                    // Hide these technical fields
                    const hiddenFields = [
                      "type",
                      "certificationId",
                      "organizationId",
                      "userId",
                      "jobId",
                    ];
                    return !hiddenFields.includes(key);
                  });

                  // Only show metadata section if there are meaningful fields
                  if (filteredMetadata.length === 0) return null;

                  return (
                    <div className={styles.modalMetadata}>
                      <h4>
                        {t("notificationsPage.details") || "Additional Details"}
                      </h4>
                      <div className={styles.metadataGrid}>
                        {filteredMetadata.map(([key, value]) => (
                          <div key={key} className={styles.metadataItem}>
                            <span className={styles.metadataKey}>
                              {key.replace(/([A-Z])/g, " $1").trim()}:
                            </span>
                            <span className={styles.metadataValue}>
                              {typeof value === "object"
                                ? JSON.stringify(value, null, 2)
                                : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.modalActionBtn}
                onClick={() => setShowModal(false)}
              >
                {t("common.close") || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
