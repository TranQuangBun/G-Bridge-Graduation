import React, { useState, useEffect } from "react";
import styles from "./DashboardPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import jobService from "../../services/jobService.js";
import notificationService from "../../services/notificationService.js";
import paymentService from "../../services/paymentService.js";
import { 
  FaChartBar, 
  FaClipboardList, 
  FaHeart, 
  FaBell, 
  FaUser, 
  FaCog, 
  FaFileAlt, 
  FaMagic, 
  FaGem, 
  FaStar, 
  FaRocket, 
  FaMapMarkerAlt, 
  FaDollarSign,
  FaBuilding,
  FaChartLine,
  FaBriefcase,
  FaEnvelope
} from "react-icons/fa";

// Sidebar menu for Interpreter role
const INTERPRETER_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: true },
  { id: "applications", icon: FaClipboardList, labelKey: "applications", active: false },
  { id: "favorites", icon: FaHeart, labelKey: "favorites", active: false },
  { id: "alerts", icon: FaBell, labelKey: "alerts", active: false },
  { id: "notifications", icon: FaEnvelope, labelKey: "notifications", active: false },
  { id: "profile", icon: FaUser, labelKey: "profile", active: false },
  { id: "settings", icon: FaCog, labelKey: "settings", active: false },
];

// Sidebar menu for Client/Company role
const CLIENT_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: true },
  { id: "myJobs", icon: FaBriefcase, labelKey: "myJobs", active: false },
  { id: "jobApplications", icon: FaClipboardList, labelKey: "jobApplications", active: false },
  { id: "notifications", icon: FaEnvelope, labelKey: "notifications", active: false },
  { id: "profile", icon: FaUser, labelKey: "profile", active: false },
  { id: "settings", icon: FaCog, labelKey: "settings", active: false },
];

function DashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeMenu, setActiveMenu] = useState("overview");
  
  // Get sidebar menu based on user role
  const SIDEBAR_MENU = user?.role === "client" ? CLIENT_SIDEBAR_MENU : INTERPRETER_SIDEBAR_MENU;
  
  // Stats for Interpreter role
  const [interpreterStats, setInterpreterStats] = useState({
    appliedJobs: 0,
    favoriteJobs: 0,
    jobAlerts: 0,
  });
  
  // Stats for Client role
  const [clientStats, setClientStats] = useState({
    postedJobs: 0,
    receivedApplications: 0,
    activeJobs: 0,
  });
  
  const stats = user?.role === "client" ? clientStats : interpreterStats;
  const [recentJobs, setRecentJobs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [markingAllNotifications, setMarkingAllNotifications] = useState(false);
  const [updatingNotificationId, setUpdatingNotificationId] = useState(null);
  const [notificationsPagination, setNotificationsPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Redirect to login if not authenticated
  useEffect(() => {
    // Đợi cho loading xong trước khi redirect
    if (!loading && !isAuthenticated) {
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, loading, navigate]);

  // Check for tab query parameter and set active menu
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "notifications") {
      setActiveMenu("notifications");
      // Remove the query parameter after setting the menu
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch subscription status and update countdown
  useEffect(() => {
    if (!isAuthenticated || loading) return;

    const fetchSubscription = async () => {
      try {
        setSubscriptionLoading(true);
        const response = await paymentService.getSubscriptionStatus();
        if (response.success && response.data) {
          setSubscription(response.data);
        } else {
          setSubscription(null);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setSubscription(null);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscription();
  }, [isAuthenticated, loading]);

  // Update countdown timer
  useEffect(() => {
    if (!subscription || !subscription.endDate) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const endDate = new Date(subscription.endDate).getTime();
      const distance = endDate - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [subscription]);

  // Fetch dashboard data
  useEffect(() => {
    if (!isAuthenticated || loading) return;

    const fetchDashboardData = async () => {
      try {
        setDataLoading(true);
        setNotificationsLoading(true);
        const notificationsLimit = activeMenu === "notifications" ? 10 : 5;
        const notificationsFilter = activeMenu === "notifications" && showUnreadOnly ? false : undefined;
        
        const [applicationsResponse, savedJobsResponse, notificationsResponse] =
          await Promise.all([
            jobService.getMyApplications(),
            jobService.getSavedJobs(),
            notificationService.getMyNotifications({ 
              limit: notificationsLimit,
              isRead: notificationsFilter,
            }),
          ]);

        // Calculate stats
        const appliedCount = applicationsResponse?.data?.applications?.length || 0;
        const savedCount = savedJobsResponse?.data?.savedJobs?.length || 0;

        if (user?.role === "client") {
          // For client: fetch posted jobs and applications
          // TODO: Implement API calls for client stats
          setClientStats({
            postedJobs: 0, // TODO: Fetch from API
            receivedApplications: 0, // TODO: Fetch from API
            activeJobs: 0, // TODO: Fetch from API
          });
        } else {
          // For interpreter: use existing stats
          setInterpreterStats({
            appliedJobs: appliedCount,
            favoriteJobs: savedCount,
            jobAlerts: 5, // TODO: Implement job alerts API
          });
        }

        // Get recent applications (latest 3)
        if (applicationsResponse?.data?.applications) {
          const recentApplications = applicationsResponse.data.applications
            .slice(0, 3)
            .map((app) => ({
              id: app.id,
              company: app.job?.organization?.name || "Company",
              logo: app.job?.organization?.logo || FaBuilding,
              position: app.job?.title || "Position",
              jobType: app.job?.workingMode?.name || "Full-time",
              workType: app.job?.workingMode?.name || "Remote",
              location: app.job?.province || app.job?.address || "Location TBD",
              salary:
                app.job?.minSalary && app.job?.maxSalary
                  ? `$${app.job.minSalary}-${app.job.maxSalary}`
                  : app.job?.minSalary
                  ? `$${app.job.minSalary}+`
                  : "Negotiable",
              dateApplied: app.createdAt || new Date().toISOString(),
              status: app.status || "pending",
            }));
          setRecentJobs(recentApplications);
        } else {
          setRecentJobs([]);
        }

        if (notificationsResponse?.data) {
          setNotifications(notificationsResponse.data.notifications || []);
          if (notificationsResponse.data.pagination) {
            setNotificationsPagination(notificationsResponse.data.pagination);
          }
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Keep default values on error
      } finally {
        setDataLoading(false);
        setNotificationsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, loading, user?.role, activeMenu, showUnreadOnly]);

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  // Get user's full name or email
  const userName = user?.fullName || user?.email?.split("@")[0] || "User";

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return styles.statusActive;
      case "under review":
        return styles.statusReview;
      case "shortlisted":
        return styles.statusShortlisted;
      default:
        return styles.statusDefault;
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNotificationTypeLabel = (type) => {
    if (!type) return "";
    const normalized = type.toLowerCase();
    switch (normalized) {
      case "job_application_submitted":
        return (
          t("dashboard.notifications.types.jobApplicationSubmitted") ||
          "Job application"
        );
      case "job_application_status":
        return (
          t("dashboard.notifications.types.jobApplicationStatus") ||
          "Application updated"
        );
      case "booking_request_created":
        return (
          t("dashboard.notifications.types.bookingRequestCreated") ||
          "Booking request"
        );
      case "booking_status_updated":
        return (
          t("dashboard.notifications.types.bookingStatusUpdated") ||
          "Booking update"
        );
      case "payment_success":
        return (
          t("dashboard.notifications.types.paymentSuccess") ||
          "Payment success"
        );
      case "subscription_expiring":
        return (
          t("dashboard.notifications.types.subscriptionExpiring") ||
          "Subscription reminder"
        );
      default:
        return normalized.replace(/_/g, " ");
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      setUpdatingNotificationId(notificationId);
      await notificationService.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setUpdatingNotificationId(null);
    }
  };

  const handleMarkAllNotifications = async () => {
    try {
      setMarkingAllNotifications(true);
      await notificationService.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setMarkingAllNotifications(false);
    }
  };

  const handleLoadMoreNotifications = async () => {
    if (notificationsPagination.page >= notificationsPagination.totalPages) return;
    const nextPage = notificationsPagination.page + 1;
    try {
      const response = await notificationService.getMyNotifications({
        page: nextPage,
        limit: 10,
        isRead: showUnreadOnly ? false : undefined,
      });
      const data = response?.data;
      if (data) {
        setNotifications((prev) => [...prev, ...(data.notifications || [])]);
        if (data.pagination) {
          setNotificationsPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error("Failed to load more notifications:", error);
    }
  };

  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return t("dashboard.recentJobs.statusActive");
      case "under review":
        return t("dashboard.recentJobs.statusReview");
      case "shortlisted":
        return t("dashboard.recentJobs.statusShortlisted");
      default:
        return status;
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <MainLayout>
        <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.dashboardRoot}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>{t("dashboard.pageTitle")}</h2>
          </div>
          <nav className={styles.sidebarNav}>
            {SIDEBAR_MENU.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={`${styles.menuItem} ${
                    activeMenu === item.id ? styles.menuItemActive : ""
                  }`}
                  onClick={() => {
                    setActiveMenu(item.id);
                    if (item.id === "applications") {
                      navigate(ROUTES.MY_APPLICATIONS);
                    } else if (item.id === "favorites") {
                      navigate(ROUTES.SAVED_JOBS);
                    } else if (item.id === "myJobs") {
                      navigate(ROUTES.MY_JOBS); // For client: navigate to job management page
                    } else if (item.id === "jobApplications") {
                      navigate(ROUTES.MY_APPLICATIONS); // For client: shows applications to their posted jobs
                    } else if (item.id === "alerts") {
                      navigate(ROUTES.JOB_ALERTS);
                    } else if (item.id === "profile") {
                      navigate(ROUTES.PROFILE);
                    } else if (item.id === "settings") {
                      navigate(ROUTES.SETTINGS);
                    }
                  }}
                >
                  <span className={styles.menuIcon}>
                    <IconComponent />
                  </span>
                  <span className={styles.menuLabel}>
                    {t(`dashboard.navigation.${item.labelKey}`)}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Header */}
          <header className={styles.contentHeader}>
            <h1 className={styles.greeting}>
              {activeMenu === "notifications"
                ? t("notificationsPage.title") || "Notifications"
                : `${t("dashboard.welcomeBack")}, ${userName}!`}
            </h1>
            <p className={styles.subGreeting}>
              {activeMenu === "notifications"
                ? t("notificationsPage.subtitle") ||
                  "Stay on top of applications, bookings and payments."
                : t("dashboard.todayActivity")}
            </p>
          </header>

          {/* Notifications Center - Full View */}
          {activeMenu === "notifications" ? (
            <section className={styles.notificationsCenterSection}>
              <div className={styles.notificationsCenterHeader}>
                <div className={styles.notificationsCenterActions}>
                  <button
                    className={`${styles.filterBtn} ${
                      showUnreadOnly ? styles.filterBtnActive : ""
                    }`}
                    onClick={() => setShowUnreadOnly((prev) => !prev)}
                  >
                    {showUnreadOnly
                      ? t("notificationsPage.showAll") || "Show all"
                      : t("notificationsPage.showUnread") || "Unread only"}
                    {showUnreadOnly && unreadNotifications.length > 0 && (
                      <span className={styles.unreadCount}>
                        ({unreadNotifications.length})
                      </span>
                    )}
                  </button>
                  {notifications.length > 0 && unreadNotifications.length > 0 && (
                    <button
                      className={styles.markAllBtn}
                      onClick={handleMarkAllNotifications}
                      disabled={markingAllNotifications}
                    >
                      {markingAllNotifications
                        ? t("common.loading") || "Loading..."
                        : t("notificationsPage.markAll") || "Mark all as read"}
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.notificationsCenterPanel}>
                {notificationsLoading ? (
                  <div className={styles.notificationsEmpty}>
                    {t("common.loading") || "Loading..."}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className={styles.notificationsEmpty}>
                    <span className={styles.emptyIcon}>🎉</span>
                    <h3>
                      {t("notificationsPage.emptyTitle") ||
                        "You're all caught up!"}
                    </h3>
                    <p>
                      {t("notificationsPage.emptyMessage") ||
                        "Check back later for updates on your jobs, bookings and payments."}
                    </p>
                  </div>
                ) : (
                  <div className={styles.notificationsCenterList}>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`${styles.notificationCenterItem} ${
                          !notification.isRead ? styles.notificationUnread : ""
                        }`}
                      >
                        <div className={styles.notificationCenterBody}>
                          <div className={styles.notificationCenterHeading}>
                            <span className={styles.notificationCenterType}>
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
                          <h3 className={styles.notificationCenterTitle}>
                            {notification.title}
                          </h3>
                          {notification.message && (
                            <p className={styles.notificationCenterMessage}>
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
                            disabled={updatingNotificationId === notification.id}
                          >
                            {updatingNotificationId === notification.id
                              ? t("common.loading") || "Loading..."
                              : t("notificationsPage.markRead") ||
                                "Mark as read"}
                          </button>
                        )}
                      </div>
                    ))}
                    {notificationsPagination.page <
                      notificationsPagination.totalPages && (
                      <button
                        className={styles.loadMoreBtn}
                        onClick={handleLoadMoreNotifications}
                      >
                        {t("notificationsPage.loadMore") || "Load more"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          ) : (
            <>
              {/* Summary Stats */}
          <section className={styles.summarySection}>
            <div className={styles.statsGrid}>
              {user?.role === "client" ? (
                <>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <FaBriefcase />
                    </div>
                    <div className={styles.statInfo}>
                      <div className={styles.statNumber}>
                        {dataLoading ? "..." : stats.postedJobs}
                      </div>
                      <div className={styles.statLabel}>
                        {t("dashboard.stats.postedJobs")}
                      </div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <FaClipboardList />
                    </div>
                    <div className={styles.statInfo}>
                      <div className={styles.statNumber}>
                        {dataLoading ? "..." : stats.receivedApplications}
                      </div>
                      <div className={styles.statLabel}>
                        {t("dashboard.stats.receivedApplications")}
                      </div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <FaFileAlt />
                    </div>
                    <div className={styles.statInfo}>
                      <div className={styles.statNumber}>
                        {dataLoading ? "..." : stats.activeJobs}
                      </div>
                      <div className={styles.statLabel}>
                        {t("dashboard.stats.activeJobs")}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <FaFileAlt />
                    </div>
                    <div className={styles.statInfo}>
                      <div className={styles.statNumber}>
                        {dataLoading ? "..." : stats.appliedJobs}
                      </div>
                      <div className={styles.statLabel}>
                        {t("dashboard.stats.appliedJobs")}
                      </div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <FaHeart />
                    </div>
                    <div className={styles.statInfo}>
                      <div className={styles.statNumber}>
                        {dataLoading ? "..." : stats.favoriteJobs}
                      </div>
                      <div className={styles.statLabel}>
                        {t("dashboard.stats.favoriteJobs")}
                      </div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <FaBell />
                    </div>
                    <div className={styles.statInfo}>
                      <div className={styles.statNumber}>
                        {dataLoading ? "..." : stats.jobAlerts}
                      </div>
                      <div className={styles.statLabel}>
                        {t("dashboard.stats.jobAlerts")}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Subscription Status */}
          {subscriptionLoading ? (
            <section className={styles.subscriptionSection}>
              <div className={styles.subscriptionCard}>
                <div style={{ padding: "20px", textAlign: "center" }}>
                  {t("common.loading") || "Loading..."}
                </div>
              </div>
            </section>
          ) : subscription && subscription.status === "active" ? (
            <section className={styles.subscriptionSection}>
              <div className={styles.subscriptionCard}>
                <div className={styles.subscriptionHeader}>
                  <div className={styles.subscriptionIcon}>
                    <FaStar />
                  </div>
                  <div className={styles.subscriptionInfo}>
                    <h3 className={styles.subscriptionTitle}>
                      {t("dashboard.subscription.active") || "Active Subscription"}
                    </h3>
                    <p className={styles.subscriptionPlan}>
                      {subscription.plan?.name || "Premium Plan"}
                    </p>
                  </div>
                </div>
                <div className={styles.subscriptionCountdown}>
                  <p className={styles.countdownLabel}>
                    {t("dashboard.subscription.expiresIn") || "Expires in:"}
                  </p>
                  <div className={styles.countdownGrid}>
                    <div className={styles.countdownItem}>
                      <span className={styles.countdownValue}>{countdown.days}</span>
                      <span className={styles.countdownUnit}>
                        {t("dashboard.subscription.days") || "Days"}
                      </span>
                    </div>
                    <div className={styles.countdownItem}>
                      <span className={styles.countdownValue}>{countdown.hours}</span>
                      <span className={styles.countdownUnit}>
                        {t("dashboard.subscription.hours") || "Hours"}
                      </span>
                    </div>
                    <div className={styles.countdownItem}>
                      <span className={styles.countdownValue}>{countdown.minutes}</span>
                      <span className={styles.countdownUnit}>
                        {t("dashboard.subscription.minutes") || "Minutes"}
                      </span>
                    </div>
                    <div className={styles.countdownItem}>
                      <span className={styles.countdownValue}>{countdown.seconds}</span>
                      <span className={styles.countdownUnit}>
                        {t("dashboard.subscription.seconds") || "Seconds"}
                      </span>
                    </div>
                  </div>
                  <p className={styles.subscriptionExpiry}>
                    {t("dashboard.subscription.expiresOn") || "Expires on:"}{" "}
                    {new Date(subscription.endDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className={styles.upgradeBtn}
                  onClick={() => navigate(ROUTES.PRICING)}
                >
                  {t("dashboard.subscription.upgrade") || "Upgrade Plan"}
                </button>
              </div>
            </section>
          ) : (
            <section className={styles.subscriptionSection}>
              <div className={styles.subscriptionCard}>
                <div className={styles.subscriptionHeader}>
                  <div className={styles.subscriptionIcon}>
                    <FaGem />
                  </div>
                  <div className={styles.subscriptionInfo}>
                    <h3 className={styles.subscriptionTitle}>
                      {t("dashboard.subscription.noSubscription") || "No Active Subscription"}
                    </h3>
                    <p className={styles.subscriptionPlan}>
                      {t("dashboard.subscription.upgradeMessage") || "Upgrade to unlock premium features"}
                    </p>
                  </div>
                </div>
                <div className={styles.premiumFeatures}>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}>
                      <FaMagic />
                    </span>
                    <span className={styles.featureText}>Unlimited job applications</span>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}>
                      <FaRocket />
                    </span>
                    <span className={styles.featureText}>Priority in search results</span>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}>
                      <FaChartLine />
                    </span>
                    <span className={styles.featureText}>Advanced analytics</span>
                  </div>
                </div>
                <button
                  className={styles.upgradeBtn}
                  onClick={() => navigate(ROUTES.PRICING)}
                >
                  {t("dashboard.subscription.viewPlans") || "View Plans"}
                </button>
              </div>
            </section>
          )}

          {/* Recent Jobs */}
          <section className={styles.recentJobsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {t("dashboard.recentJobs.title")}
              </h2>
              <button
                className={styles.viewAllBtn}
                onClick={() => navigate(ROUTES.MY_APPLICATIONS)}
              >
                {t("dashboard.recentJobs.viewAll")}
              </button>
            </div>

            <div className={styles.jobsList}>
              {dataLoading ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  {t("common.loading") || "Loading..."}
                </div>
              ) : recentJobs.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  {t("dashboard.recentJobs.noApplications") || "No applications yet"}
                </div>
              ) : (
                recentJobs.map((job) => (
                <div key={job.id} className={styles.jobCard}>
                  {/* Job Info Column */}
                  <div className={styles.jobInfo}>
                    <div className={styles.jobHeader}>
                      <div className={styles.companyLogo}>
                        {typeof job.logo === "string" ? (
                          job.logo
                        ) : (
                          job.logo ? <job.logo /> : <FaBuilding />
                        )}
                      </div>
                      <div className={styles.jobDetails}>
                        <h3 className={styles.jobTitle}>{job.position}</h3>
                        <p className={styles.companyName}>{job.company}</p>
                        <div className={styles.jobTags}>
                          <span className={styles.tag}>{job.workType}</span>
                          <span className={styles.tag}>{job.jobType}</span>
                        </div>
                        <div className={styles.jobMeta}>
                          <span className={styles.location}>
                            <FaMapMarkerAlt /> {job.location}
                          </span>
                          <span className={styles.salary}><FaDollarSign /> {job.salary}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date Applied Column */}
                  <div className={styles.dateColumn}>
                    <span className={styles.dateLabel}>
                      {t("dashboard.recentJobs.dateApplied")}
                    </span>
                    <span className={styles.dateValue}>
                      {formatDate(job.dateApplied)}
                    </span>
                  </div>

                  {/* Status Column */}
                  <div className={styles.statusColumn}>
                    <span className={styles.statusLabel}>
                      {t("dashboard.recentJobs.status")}
                    </span>
                    <div
                      className={`${styles.statusBadge} ${getStatusClass(
                        job.status
                      )}`}
                    >
                      <span className={styles.statusIcon}>●</span>
                      <span className={styles.statusText}>
                        {getStatusText(job.status)}
                      </span>
                    </div>
                  </div>

                  {/* Action Column */}
                  <div className={styles.actionColumn}>
                    <button className={styles.viewDetailsBtn}>
                      {t("dashboard.recentJobs.viewDetails")}
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>
          </section>

          {/* Notifications */}
          <section className={styles.notificationsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {t("dashboard.notifications.title") ||
                  t("common.notifications") ||
                  "Notifications"}
              </h2>
              <div className={styles.notificationHeaderActions}>
                {unreadNotifications.length > 0 && (
                  <button
                    className={styles.markAllBtn}
                    onClick={handleMarkAllNotifications}
                    disabled={markingAllNotifications}
                  >
                    {markingAllNotifications
                      ? t("common.loading") || "Loading..."
                      : t("dashboard.notifications.markAll") ||
                        "Mark all as read"}
                  </button>
                )}
              </div>
            </div>

            <div className={styles.notificationsList}>
              {notificationsLoading ? (
                <div className={styles.notificationsEmpty}>
                  {t("common.loading") || "Loading..."}
                </div>
              ) : notifications.length === 0 ? (
                <div className={styles.notificationsEmpty}>
                  {t("dashboard.notifications.empty") ||
                    "You're all caught up!"}
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${styles.notificationCard} ${
                      !notification.isRead ? styles.notificationUnread : ""
                    }`}
                  >
                    <div className={styles.notificationContent}>
                      <div className={styles.notificationTitleRow}>
                        {!notification.isRead && (
                          <span className={styles.unreadDot} />
                        )}
                        <h3 className={styles.notificationTitle}>
                          {notification.title}
                        </h3>
                      </div>
                      {notification.message && (
                        <p className={styles.notificationMessage}>
                          {notification.message}
                        </p>
                      )}
                      <div className={styles.notificationMeta}>
                        <span>{formatDateTime(notification.createdAt)}</span>
                        {notification.metadata?.status && (
                          <span className={styles.notificationTag}>
                            {notification.metadata.status}
                          </span>
                        )}
                        {notification.type && (
                          <span className={styles.notificationType}>
                            {getNotificationTypeLabel(notification.type)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <button
                        className={styles.markReadBtn}
                        onClick={() =>
                          handleMarkNotificationRead(notification.id)
                        }
                        disabled={updatingNotificationId === notification.id}
                      >
                        {updatingNotificationId === notification.id
                          ? t("common.loading") || "Loading..."
                          : t("dashboard.notifications.markRead") ||
                            "Mark as read"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
            </>
          )}
        </main>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;
