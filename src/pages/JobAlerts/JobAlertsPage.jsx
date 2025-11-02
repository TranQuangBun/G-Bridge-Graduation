import React, { useState } from "react";
import styles from "./JobAlertsPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";

// Mock data for job alerts
const MOCK_JOB_ALERTS = [
  {
    id: 1,
    type: "job_match",
    title: "New Job Match Found",
    message:
      "A new interpreter position at GlobalSpeak matches your profile and preferences.",
    jobTitle: "Senior English-Vietnamese Conference Interpreter",
    company: "GlobalSpeak",
    location: "Ho Chi Minh City",
    salary: "$2,500-3,500",
    timestamp: "2025-09-17T10:30:00Z",
    isRead: false,
    priority: "high",
    actionUrl: "/jobs/1",
    icon: "🎯",
  },
  {
    id: 2,
    type: "application_update",
    title: "Application Status Updated",
    message:
      "Your application for Medical Interpreter position has been reviewed.",
    jobTitle: "Medical Interpreter - Vietnamese",
    company: "MedLingua",
    status: "Interview Scheduled",
    timestamp: "2025-09-17T09:15:00Z",
    isRead: false,
    priority: "high",
    actionUrl: "/dashboard/applications",
    icon: "📋",
  },
  {
    id: 3,
    type: "new_job",
    title: "New Job Posted",
    message:
      "A new legal interpreter position has been posted in your preferred location.",
    jobTitle: "Legal Document Translator",
    company: "LegalLingo",
    location: "District 3, Ho Chi Minh City",
    timestamp: "2025-09-17T08:45:00Z",
    isRead: true,
    priority: "medium",
    actionUrl: "/jobs/3",
    icon: "💼",
  },
  {
    id: 4,
    type: "deadline_reminder",
    title: "Application Deadline Reminder",
    message:
      "Your application for Technical Translator position expires in 2 days.",
    jobTitle: "Technical Document Translator",
    company: "TechTranslate",
    deadline: "2025-09-19",
    timestamp: "2025-09-17T07:20:00Z",
    isRead: true,
    priority: "medium",
    actionUrl: "/dashboard/applications",
    icon: "⏰",
  },
  {
    id: 5,
    type: "profile_view",
    title: "Profile Viewed by Employer",
    message:
      "EduBridge has viewed your profile and may be interested in your services.",
    company: "EduBridge",
    timestamp: "2025-09-16T16:30:00Z",
    isRead: true,
    priority: "low",
    actionUrl: "/profile",
    icon: "👁️",
  },
  {
    id: 6,
    type: "system",
    title: "Profile Completion Reminder",
    message:
      "Complete your profile to get 50% more job matches. Add your certifications and work experience.",
    timestamp: "2025-09-16T14:00:00Z",
    isRead: false,
    priority: "low",
    actionUrl: "/profile",
    icon: "📝",
  },
  {
    id: 7,
    type: "job_recommendation",
    title: "Weekly Job Recommendations",
    message:
      "We found 5 new interpreter positions that match your skills and preferences.",
    count: 5,
    timestamp: "2025-09-16T10:00:00Z",
    isRead: true,
    priority: "low",
    actionUrl: "/find-job",
    icon: "💡",
  },
  {
    id: 8,
    type: "skill_verification",
    title: "Skill Verification Required",
    message:
      "Please verify your Japanese language proficiency to unlock premium job opportunities.",
    skill: "Japanese Language",
    timestamp: "2025-09-15T11:30:00Z",
    isRead: false,
    priority: "medium",
    actionUrl: "/profile",
    icon: "🏆",
  },
];

function JobAlertsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState("alerts");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alerts, setAlerts] = useState(MOCK_JOB_ALERTS);

  // Check if user is company/client role
  const isCompany = user?.role === "client" || user?.role === "company";

  const SIDEBAR_MENU = [
    { id: "overview", icon: "📊", labelKey: "overview", active: false },
    {
      id: "applications",
      icon: "📋",
      label: isCompany ? "Job Applications" : null,
      labelKey: isCompany ? null : "applications",
      active: false,
    },
    {
      id: "favorites",
      icon: "❤️",
      label: isCompany ? "Saved Interpreters" : "Saved Jobs",
      active: false,
    },
    { id: "alerts", icon: "🔔", labelKey: "alerts", active: true },
    {
      id: "profile",
      icon: isCompany ? "🏢" : "👤",
      label: isCompany ? "Company Profile" : null,
      labelKey: isCompany ? null : "profile",
      active: false,
    },
    { id: "settings", icon: "⚙️", labelKey: "settings", active: false },
  ];

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return t("jobAlerts.timeAgo.justNow");
    } else if (diffInHours < 24) {
      return t("jobAlerts.timeAgo.hoursAgo").replace("{{hours}}", diffInHours);
    } else if (diffInHours < 48) {
      return t("jobAlerts.timeAgo.yesterday");
    } else {
      const days = Math.floor(diffInHours / 24);
      return t("jobAlerts.timeAgo.daysAgo").replace("{{days}}", days);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "high":
        return styles.priorityHigh;
      case "medium":
        return styles.priorityMedium;
      case "low":
        return styles.priorityLow;
      default:
        return styles.priorityDefault;
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case "job_match":
        return styles.typeJobMatch;
      case "application_update":
        return styles.typeApplicationUpdate;
      case "new_job":
        return styles.typeNewJob;
      case "deadline_reminder":
        return styles.typeDeadlineReminder;
      case "profile_view":
        return styles.typeProfileView;
      case "system":
        return styles.typeSystem;
      case "job_recommendation":
        return styles.typeJobRecommendation;
      case "skill_verification":
        return styles.typeSkillVerification;
      default:
        return styles.typeDefault;
    }
  };

  const filteredAlerts = alerts.filter(
    (alert) => selectedType === "all" || alert.type === selectedType
  );

  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  const handleMarkAsRead = (alertId) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setAlerts(alerts.map((alert) => ({ ...alert, isRead: true })));
  };

  const handleDeleteAlert = (alertId) => {
    setAlerts(alerts.filter((alert) => alert.id !== alertId));
  };

  const handleClearAll = () => {
    setAlerts([]);
  };

  const handleAlertClick = (alert) => {
    if (!alert.isRead) {
      handleMarkAsRead(alert.id);
    }

    if (alert.actionUrl) {
      navigate(alert.actionUrl);
    } else {
      setSelectedAlert(alert);
    }
  };

  const closeModal = () => {
    setSelectedAlert(null);
  };

  return (
    <MainLayout>
      <div className={styles.dashboardRoot}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>{t("dashboard.pageTitle")}</h2>
          </div>
          <nav className={styles.sidebarNav}>
            {SIDEBAR_MENU.map((item) => (
              <button
                key={item.id}
                className={`${styles.menuItem} ${
                  activeMenu === item.id ? styles.menuItemActive : ""
                }`}
                onClick={() => {
                  setActiveMenu(item.id);
                  if (item.id === "overview") {
                    navigate(ROUTES.DASHBOARD);
                  } else if (item.id === "applications") {
                    navigate(ROUTES.MY_APPLICATIONS);
                  } else if (item.id === "favorites") {
                    navigate(ROUTES.SAVED_JOBS);
                  } else if (item.id === "profile") {
                    // Redirect to Company Profile for clients, regular Profile for interpreters
                    if (isCompany) {
                      navigate(ROUTES.COMPANY_PROFILE);
                    } else {
                      navigate(ROUTES.PROFILE);
                    }
                  }
                }}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>
                  {item.label || t(`dashboard.navigation.${item.labelKey}`)}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Header */}
          <header className={styles.contentHeader}>
            <div className={styles.headerContent}>
              <div>
                <h1 className={styles.pageTitle}>{t("jobAlerts.pageTitle")}</h1>
                <p className={styles.pageSubtitle}>{t("jobAlerts.subtitle")}</p>
              </div>
              <div className={styles.headerActions}>
                {unreadCount > 0 && (
                  <button
                    className={styles.markAllBtn}
                    onClick={handleMarkAllAsRead}
                  >
                    {t("jobAlerts.markAllAsRead")}
                  </button>
                )}
                <button className={styles.clearAllBtn} onClick={handleClearAll}>
                  {t("jobAlerts.deleteAll")}
                </button>
              </div>
            </div>
          </header>

          {/* Controls */}
          <section className={styles.controlsSection}>
            <div className={styles.controls}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  {t("jobAlerts.filterByType")}:
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">{t("jobAlerts.types.all")}</option>
                  <option value="job_match">
                    {t("jobAlerts.alertTypes.job_match")}
                  </option>
                  <option value="application_update">
                    {t("jobAlerts.alertTypes.application_update")}
                  </option>
                  <option value="new_job">
                    {t("jobAlerts.alertTypes.new_job")}
                  </option>
                  <option value="deadline_reminder">
                    {t("jobAlerts.alertTypes.deadline_reminder")}
                  </option>
                  <option value="profile_view">
                    {t("jobAlerts.alertTypes.profile_view")}
                  </option>
                  <option value="system">
                    {t("jobAlerts.alertTypes.system")}
                  </option>
                  <option value="job_recommendation">
                    {t("jobAlerts.alertTypes.job_recommendation")}
                  </option>
                  <option value="skill_verification">
                    {t("jobAlerts.alertTypes.skill_verification")}
                  </option>
                </select>
              </div>

              <div className={styles.statsInfo}>
                <span className={styles.totalCount}>
                  {filteredAlerts.length} {t("jobAlerts.totalAlerts")}
                </span>
                {unreadCount > 0 && (
                  <span className={styles.unreadCount}>
                    {unreadCount} {t("jobAlerts.unreadAlerts")}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Alerts List */}
          <section className={styles.alertsSection}>
            {filteredAlerts.length > 0 ? (
              <div className={styles.alertsList}>
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`${styles.alertCard} ${
                      !alert.isRead ? styles.unread : ""
                    } ${getPriorityClass(alert.priority)} ${getTypeClass(
                      alert.type
                    )}`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className={styles.alertContent}>
                      <div className={styles.alertHeader}>
                        <div className={styles.alertIcon}>{alert.icon}</div>
                        <div className={styles.alertInfo}>
                          <h3 className={styles.alertTitle}>{alert.title}</h3>
                          <p className={styles.alertMessage}>{alert.message}</p>
                        </div>
                        <div className={styles.alertMeta}>
                          <span className={styles.alertTime}>
                            {formatTimestamp(alert.timestamp)}
                          </span>
                          {!alert.isRead && (
                            <span className={styles.unreadDot}></span>
                          )}
                        </div>
                      </div>

                      {/* Additional Alert Details */}
                      {alert.jobTitle && (
                        <div className={styles.alertDetails}>
                          <div className={styles.jobInfo}>
                            <strong>{alert.jobTitle}</strong>
                            {alert.company && <span> - {alert.company}</span>}
                            {alert.location && <span> • {alert.location}</span>}
                            {alert.salary && <span> • {alert.salary}</span>}
                          </div>
                        </div>
                      )}

                      {alert.status && (
                        <div className={styles.statusInfo}>
                          <span className={styles.statusLabel}>
                            {t("jobAlerts.status")}:
                          </span>
                          <span className={styles.statusValue}>
                            {alert.status}
                          </span>
                        </div>
                      )}

                      {alert.deadline && (
                        <div className={styles.deadlineInfo}>
                          <span className={styles.deadlineLabel}>
                            {t("jobAlerts.deadline")}:
                          </span>
                          <span className={styles.deadlineValue}>
                            {new Date(alert.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={styles.alertActions}>
                      {!alert.isRead && (
                        <button
                          className={styles.markReadBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(alert.id);
                          }}
                        >
                          {t("jobAlerts.markAsRead")}
                        </button>
                      )}
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAlert(alert.id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🔔</span>
                <h3>{t("jobAlerts.noAlerts")}</h3>
                <p>{t("jobAlerts.noAlertsDesc")}</p>
                <button
                  className={styles.findJobsBtn}
                  onClick={() => navigate(ROUTES.FIND_JOB)}
                >
                  {t("jobAlerts.findJobs")}
                </button>
              </div>
            )}
          </section>
        </main>

        {/* Alert Details Modal */}
        {selectedAlert && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalTitleSection}>
                  <span className={styles.modalIcon}>{selectedAlert.icon}</span>
                  <h2>{selectedAlert.title}</h2>
                </div>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <p className={styles.modalMessage}>{selectedAlert.message}</p>

                {selectedAlert.jobTitle && (
                  <div className={styles.modalJobInfo}>
                    <h4>{t("jobAlerts.modal.jobDetails")}</h4>
                    <div className={styles.jobDetails}>
                      <div>
                        <strong>{t("jobAlerts.modal.position")}:</strong>{" "}
                        {selectedAlert.jobTitle}
                      </div>
                      {selectedAlert.company && (
                        <div>
                          <strong>{t("jobAlerts.modal.company")}:</strong>{" "}
                          {selectedAlert.company}
                        </div>
                      )}
                      {selectedAlert.location && (
                        <div>
                          <strong>{t("jobAlerts.modal.location")}:</strong>{" "}
                          {selectedAlert.location}
                        </div>
                      )}
                      {selectedAlert.salary && (
                        <div>
                          <strong>{t("jobAlerts.modal.salary")}:</strong>{" "}
                          {selectedAlert.salary}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={styles.modalTimestamp}>
                  <small>
                    {t("jobAlerts.modal.receivedAt")}:{" "}
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </small>
                </div>
              </div>

              <div className={styles.modalActions}>
                {selectedAlert.actionUrl && (
                  <button
                    className={styles.actionBtn}
                    onClick={() => {
                      navigate(selectedAlert.actionUrl);
                      closeModal();
                    }}
                  >
                    {t("jobAlerts.modal.viewDetails")}
                  </button>
                )}
                <button className={styles.dismissBtn} onClick={closeModal}>
                  {t("jobAlerts.modal.dismiss")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default JobAlertsPage;
