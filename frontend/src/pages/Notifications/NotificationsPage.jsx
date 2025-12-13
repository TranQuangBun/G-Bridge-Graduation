import React, { useEffect, useState, useCallback } from "react";
import styles from "./NotificationsPage.module.css";
import { MainLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useLanguage } from "../../translet/LanguageContext";
import notificationService from "../../services/notificationService";

const NotificationsPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, loading, navigate]);

  const fetchNotifications = useCallback(
    async ({ page, append }) => {
      try {
        if (!append) {
          setPageLoading(true);
        }
        const response = await notificationService.getMyNotifications({
          page,
          limit: 10,
          isRead: showUnreadOnly ? false : undefined,
        });
        const data = response?.data;
        if (data) {
          setNotifications((prev) =>
            append
              ? [...prev, ...(data.notifications || [])]
              : data.notifications || []
          );
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setPageLoading(false);
      }
    },
    [showUnreadOnly]
  );

  useEffect(() => {
    if (!isAuthenticated || loading) return;
    void fetchNotifications({ page: 1, append: false });
  }, [isAuthenticated, loading, showUnreadOnly, fetchNotifications]);

  const handleLoadMore = () => {
    if (pagination.page >= pagination.totalPages) return;
    const nextPage = pagination.page + 1;
    setPagination((prev) => ({ ...prev, page: nextPage }));
    void fetchNotifications({ page: nextPage, append: true });
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      setMarkingId(id);
      await notificationService.markNotificationRead(id);
      setNotifications((prev) => {
        // If showing unread only, remove the notification from list
        if (showUnreadOnly) {
          return prev.filter((notification) => notification.id !== id);
        }
        // Otherwise just mark as read
        return prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        );
      });
    } catch (error) {
      console.error("Failed to mark notification read:", error);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAll = async () => {
    try {
      setMarkingAll(true);
      await notificationService.markAllNotificationsRead();
      // If showing unread only, clear all notifications
      if (showUnreadOnly) {
        setNotifications([]);
      } else {
        // Otherwise mark all as read
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true }))
        );
      }
    } catch (error) {
      console.error("Failed to mark all notifications read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filter notifications based on showUnreadOnly
  const displayedNotifications = showUnreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.pageEyebrow}>
              {t("notificationsPage.eyebrow") || "Center"}
            </p>
            <h1 className={styles.pageTitle}>
              {t("notificationsPage.title") || "Notifications"}
            </h1>
            <p className={styles.pageSubtitle}>
              {t("notificationsPage.subtitle") ||
                "Stay on top of applications, bookings and payments."}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={`${styles.filterBtn} ${
                showUnreadOnly ? styles.filterBtnActive : ""
              }`}
              onClick={() => setShowUnreadOnly((prev) => !prev)}
            >
              {showUnreadOnly
                ? t("notificationsPage.showAll") || "Show all"
                : t("notificationsPage.showUnread") || "Unread only"}
              {showUnreadOnly && unreadCount > 0 && (
                <span className={styles.unreadCount}>({unreadCount})</span>
              )}
            </button>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                className={styles.markAllBtn}
                onClick={handleMarkAll}
                disabled={markingAll}
              >
                {markingAll
                  ? t("common.loading") || "Loading..."
                  : t("notificationsPage.markAll") || "Mark all as read"}
              </button>
            )}
          </div>
        </header>

        <section className={styles.notificationsPanel}>
          {pageLoading ? (
            <div className={styles.emptyState}>
              {t("common.loading") || "Loading..."}
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🎉</span>
              <h3>
                {t("notificationsPage.emptyTitle") || "You're all caught up!"}
              </h3>
              <p>
                {t("notificationsPage.emptyMessage") ||
                  "Check back later for updates on your jobs, bookings and payments."}
              </p>
            </div>
          ) : (
            <div className={styles.notificationsList}>
              {displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${
                    !notification.isRead ? styles.notificationUnread : ""
                  }`}
                >
                  <div className={styles.notificationBody}>
                    <div className={styles.notificationHeading}>
                      <span className={styles.notificationType}>
                        {notification.type?.replace(/_/g, " ")}
                      </span>
                      <time>
                        {new Date(notification.createdAt).toLocaleString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </time>
                    </div>
                    <h3 className={styles.notificationTitle}>
                      {notification.title}
                    </h3>
                    {notification.message && (
                      <p className={styles.notificationMessage}>
                        {notification.message}
                      </p>
                    )}
                  </div>
                  {!notification.isRead && (
                    <button
                      className={styles.markReadBtn}
                      onClick={() =>
                        handleMarkNotificationRead(notification.id)
                      }
                      disabled={markingId === notification.id}
                    >
                      {markingId === notification.id
                        ? t("common.loading") || "Loading..."
                        : t("notificationsPage.markRead") || "Mark as read"}
                    </button>
                  )}
                </div>
              ))}
              {pagination.page < pagination.totalPages && (
                <button className={styles.loadMoreBtn} onClick={handleLoadMore}>
                  {t("notificationsPage.loadMore") || "Load more"}
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default NotificationsPage;
