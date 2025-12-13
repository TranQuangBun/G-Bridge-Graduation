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
  FaEnvelope,
  FaHeart,
  FaReply,
  FaBookmark,
  FaCamera,
  FaGlobe,
  FaMoon,
  FaBell,
  FaLock,
  FaHistory,
  FaTrash,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { toast } from "react-toastify";

// Sidebar menu for Interpreter role
const INTERPRETER_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: true },
  {
    id: "applications",
    icon: FaClipboardList,
    labelKey: "applications",
    active: false,
  },
  {
    id: "savedJobs",
    icon: FaBookmark,
    labelKey: "savedJobs",
    active: false,
  },
  {
    id: "notifications",
    icon: FaEnvelope,
    labelKey: "notifications",
    active: false,
  },
  { id: "profile", icon: FaUser, labelKey: "profile", active: false },
  { id: "settings", icon: FaCog, labelKey: "settings", active: false },
];

// Sidebar menu for Client/Company role
const CLIENT_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: true },
  { id: "myJobs", icon: FaBriefcase, labelKey: "myJobs", active: false },
  {
    id: "jobApplications",
    icon: FaClipboardList,
    labelKey: "jobApplications",
    active: false,
  },
  {
    id: "savedInterpreters",
    icon: FaBookmark,
    labelKey: "savedInterpreters",
    active: false,
  },
  {
    id: "notifications",
    icon: FaEnvelope,
    labelKey: "notifications",
    active: false,
  },
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
  const SIDEBAR_MENU =
    user?.role === "client" ? CLIENT_SIDEBAR_MENU : INTERPRETER_SIDEBAR_MENU;

  // Stats for Interpreter role
  const [interpreterStats, setInterpreterStats] = useState({
    appliedJobs: 0,
    savedJobs: 0,
    repliedJobs: 0,
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
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationsPagination, setNotificationsPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Settings state
  const [settingsData, setSettingsData] = useState({
    avatar: null,
    name: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "interpreter",
  });
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [themeMode, setThemeMode] = useState("light");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

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
    } else if (tab === "settings") {
      setActiveMenu("settings");
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
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
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
        const notificationsFilter =
          activeMenu === "notifications" && showUnreadOnly ? false : undefined;

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
        const appliedCount =
          applicationsResponse?.data?.applications?.length || 0;
        const savedCount = savedJobsResponse?.data?.savedJobs?.length || 0;

        // Count replied jobs (applications with status other than pending)
        const repliedCount =
          applicationsResponse?.data?.applications?.filter(
            (app) => app.status && app.status.toLowerCase() !== "pending"
          ).length || 0;
        if (user?.role === "client") {
          // For client: fetch posted jobs and applications
          try {
            const jobsData = await jobService.getClientJobs();
            const jobs = jobsData.data || [];
            const activeJobs = jobs.filter(
              (job) => job.status === "active"
            ).length;

            setClientStats({
              postedJobs: jobs.length,
              activeJobs: activeJobs,
              receivedApplications: jobs.reduce(
                (sum, job) => sum + (job.applicationCount || 0),
                0
              ),
            });
          } catch (error) {
            console.error("Error fetching client stats:", error);
            setClientStats({
              postedJobs: 0,
              receivedApplications: 0,
              activeJobs: 0,
            });
          }
        } else {
          // For interpreter: use existing stats
          setInterpreterStats({
            appliedJobs: appliedCount,
            savedJobs: savedCount,
            repliedJobs: repliedCount,
          });
        }

        // Get recent applications (latest 3)
        if (user?.role === "client") {
          // For client: get received applications from their posted jobs
          try {
            const jobsData = await jobService.getClientJobs();
            const jobs = jobsData.data || [];
            const allApplications = [];

            // Fetch applications for each job
            for (const job of jobs.slice(0, 5)) {
              // Limit to first 5 jobs for performance
              try {
                const applicationsData = await jobService.getJobApplications(
                  job.id
                );
                if (applicationsData?.data) {
                  const jobApps = applicationsData.data.map((app) => ({
                    ...app,
                    jobTitle: job.title,
                    jobId: job.id,
                  }));
                  allApplications.push(...jobApps);
                }
              } catch (error) {
                console.error(
                  `Error fetching applications for job ${job.id}:`,
                  error
                );
              }
            }

            // Sort by createdAt and get latest 3
            const recentApplications = allApplications
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 3)
              .map((app) => ({
                id: app.id,
                company:
                  app.interpreterProfile?.user?.fullName ||
                  app.interpreterProfile?.user?.email?.split("@")[0] ||
                  "Interpreter",
                logo: FaBuilding,
                position: app.jobTitle || "Job",
                jobType: "Application",
                workType: app.status || "pending",
                location:
                  app.interpreterProfile?.user?.address || "Location TBD",
                salary: "-",
                dateApplied: app.createdAt || new Date().toISOString(),
                status: app.status || "pending",
              }));
            setRecentJobs(recentApplications);
          } catch (error) {
            console.error("Error fetching client applications:", error);
            setRecentJobs([]);
          }
        } else if (applicationsResponse?.data?.applications) {
          // For interpreter: get their applied jobs
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
          t("dashboard.notifications.types.paymentSuccess") || "Payment success"
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
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
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

  const handleOpenNotificationModal = async (notification) => {
    setSelectedNotification(notification);
    setShowNotificationModal(true);

    // Mark as read if not already
    if (!notification.isRead) {
      await handleMarkNotificationRead(notification.id);
    }
  };

  const handleLoadMoreNotifications = async () => {
    if (notificationsPagination.page >= notificationsPagination.totalPages)
      return;
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
                    } else if (item.id === "savedJobs") {
                      navigate(ROUTES.SAVED_JOBS);
                    } else if (item.id === "myJobs") {
                      navigate(ROUTES.MY_JOBS); // For client: navigate to job management page
                    } else if (item.id === "jobApplications") {
                      navigate(ROUTES.MY_APPLICATIONS); // For client: shows applications to their posted jobs
                    } else if (item.id === "savedInterpreters") {
                      navigate(ROUTES.SAVED_INTERPRETERS);
                    } else if (item.id === "notifications") {
                      // Stay on dashboard and show notifications section
                      setSearchParams({ tab: "notifications" });
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
                  {notifications.length > 0 &&
                    unreadNotifications.length > 0 && (
                      <button
                        className={styles.markAllBtn}
                        onClick={handleMarkAllNotifications}
                        disabled={markingAllNotifications}
                      >
                        {markingAllNotifications
                          ? t("common.loading") || "Loading..."
                          : t("notificationsPage.markAll") ||
                            "Mark all as read"}
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
                        onClick={() =>
                          handleOpenNotificationModal(notification)
                        }
                        style={{ cursor: "pointer" }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkNotificationRead(notification.id);
                            }}
                            disabled={
                              updatingNotificationId === notification.id
                            }
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
                            {dataLoading ? "..." : stats.savedJobs}
                          </div>
                          <div className={styles.statLabel}>
                            {t("dashboard.stats.savedJobs")}
                          </div>
                        </div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statIcon}>
                          <FaReply />
                        </div>
                        <div className={styles.statInfo}>
                          <div className={styles.statNumber}>
                            {dataLoading ? "..." : stats.repliedJobs}
                          </div>
                          <div className={styles.statLabel}>
                            {t("dashboard.stats.repliedJobs")}
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
                          {t("dashboard.subscription.active") ||
                            "Active Subscription"}
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
                          <span className={styles.countdownValue}>
                            {countdown.days}
                          </span>
                          <span className={styles.countdownUnit}>
                            {t("dashboard.subscription.days") || "Days"}
                          </span>
                        </div>
                        <div className={styles.countdownItem}>
                          <span className={styles.countdownValue}>
                            {countdown.hours}
                          </span>
                          <span className={styles.countdownUnit}>
                            {t("dashboard.subscription.hours") || "Hours"}
                          </span>
                        </div>
                        <div className={styles.countdownItem}>
                          <span className={styles.countdownValue}>
                            {countdown.minutes}
                          </span>
                          <span className={styles.countdownUnit}>
                            {t("dashboard.subscription.minutes") || "Minutes"}
                          </span>
                        </div>
                        <div className={styles.countdownItem}>
                          <span className={styles.countdownValue}>
                            {countdown.seconds}
                          </span>
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
                          {t("dashboard.subscription.noSubscription") ||
                            "No Active Subscription"}
                        </h3>
                        <p className={styles.subscriptionPlan}>
                          {t("dashboard.subscription.upgradeMessage") ||
                            "Upgrade to unlock premium features"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.premiumFeatures}>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>
                          <FaMagic />
                        </span>
                        <span className={styles.featureText}>
                          {t(
                            "dashboard.premiumFeatures.unlimitedApplications"
                          ) || "Unlimited job applications"}
                        </span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>
                          <FaRocket />
                        </span>
                        <span className={styles.featureText}>
                          {t("dashboard.premiumFeatures.prioritySearch") ||
                            "Priority in search results"}
                        </span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>
                          <FaChartLine />
                        </span>
                        <span className={styles.featureText}>
                          {t("dashboard.premiumFeatures.advancedAnalytics") ||
                            "Advanced analytics"}
                        </span>
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

              {/* Recent Jobs and Notifications - Side by Side */}
              <div className={styles.twoColumnSection}>
                {/* Recent Jobs/Applications */}
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
                        {t("dashboard.recentJobs.noApplications") ||
                          "No applications yet"}
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
                                ) : job.logo ? (
                                  <job.logo />
                                ) : (
                                  <FaBuilding />
                                )}
                              </div>
                              <div className={styles.jobDetails}>
                                <h3 className={styles.jobTitle}>
                                  {job.position}
                                </h3>
                                <p className={styles.companyName}>
                                  {job.company}
                                </p>
                                <div className={styles.jobTags}>
                                  <span className={styles.tag}>
                                    {job.workType}
                                  </span>
                                  <span className={styles.tag}>
                                    {job.jobType}
                                  </span>
                                </div>
                                <div className={styles.jobMeta}>
                                  <span className={styles.location}>
                                    <FaMapMarkerAlt /> {job.location}
                                  </span>
                                  <span className={styles.salary}>
                                    <FaDollarSign /> {job.salary}
                                  </span>
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
                              className={`${
                                styles.statusBadge
                              } ${getStatusClass(job.status)}`}
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
              </div>
            </>
          )}
        </main>

        {/* Notification Detail Modal */}
        {showNotificationModal && selectedNotification && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowNotificationModal(false)}
          >
            <div
              className={styles.notificationDetailModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.notificationModalHeader}>
                <div className={styles.notificationModalHeaderLeft}>
                  <div className={styles.notificationModalIcon}>
                    {selectedNotification.type?.includes("approved") ? (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : selectedNotification.type?.includes("rejected") ? (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
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
                  <div className={styles.notificationModalHeaderText}>
                    <h3>{selectedNotification.title}</h3>
                    <span className={styles.notificationModalType}>
                      {selectedNotification.type?.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setShowNotificationModal(false)}
                >
                  ×
                </button>
              </div>

              <div className={styles.notificationModalBody}>
                <div className={styles.notificationModalInfo}>
                  <div className={styles.notificationModalInfoItem}>
                    <span className={styles.notificationModalLabel}>
                      {t("notificationsPage.time") || "Time"}:
                    </span>
                    <span className={styles.notificationModalValue}>
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
                  <div className={styles.notificationModalInfoItem}>
                    <span className={styles.notificationModalLabel}>
                      {t("notificationsPage.status") || "Status"}:
                    </span>
                    <span
                      className={`${styles.notificationModalValue} ${
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
                  <div className={styles.notificationModalMessage}>
                    <h4>{t("notificationsPage.message") || "Message"}</h4>
                    <p>{selectedNotification.message}</p>
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
                      <div className={styles.notificationModalMetadata}>
                        <h4>
                          {t("notificationsPage.details") ||
                            "Additional Details"}
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

              <div className={styles.notificationModalFooter}>
                <button
                  className={styles.modalActionBtn}
                  onClick={() => setShowNotificationModal(false)}
                >
                  {t("common.close") || "Close"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default DashboardPage;
