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
  const dropdownRef = useRef(null);

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
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`${styles.dropdownItem} ${
                    !notification.isRead ? styles.unread : ""
                  }`}
                  onClick={() => {
                    handleMarkNotificationRead(notification.id);
                    handleViewAll();
                  }}
                >
                  <div className={styles.itemTitle}>{notification.title}</div>
                  {notification.message && (
                    <p className={styles.itemMessage}>{notification.message}</p>
                  )}
                </button>
              ))
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
    </div>
  );
};

export default NotificationDropdown;
