import React, { useState } from "react";
import styles from "./DashboardPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";

// Mock data for dashboard
const MOCK_STATS = {
  appliedJobs: 12,
  favoriteJobs: 8,
  jobAlerts: 5,
};

const MOCK_RECENT_JOBS = [
  {
    id: 1,
    company: "GlobalSpeak",
    logo: "🏢",
    position: "Senior English-Vietnamese Conference Interpreter",
    jobType: "Full-time",
    workType: "Remote",
    location: "Ho Chi Minh City",
    salary: "$2,500-3,500",
    dateApplied: "2025-09-10",
    status: "Active",
  },
  {
    id: 2,
    company: "MedLingua",
    logo: "🏥",
    position: "Medical Interpreter (Japanese-Vietnamese)",
    jobType: "Contract",
    workType: "On-site",
    location: "Hanoi",
    salary: "$1,800-2,200",
    dateApplied: "2025-09-08",
    status: "Under Review",
  },
  {
    id: 3,
    company: "TechTranslate",
    logo: "💻",
    position: "Technical Translator & Interpreter",
    jobType: "Part-time",
    workType: "Hybrid",
    location: "Da Nang",
    salary: "$1,500-2,000",
    dateApplied: "2025-09-05",
    status: "Shortlisted",
  },
];

const SIDEBAR_MENU = [
  { id: "overview", icon: "📊", labelKey: "overview", active: true },
  { id: "applications", icon: "📋", labelKey: "applications", active: false },
  { id: "favorites", icon: "❤️", labelKey: "favorites", active: false },
  { id: "alerts", icon: "🔔", labelKey: "alerts", active: false },
  { id: "profile", icon: "👤", labelKey: "profile", active: false },
  { id: "settings", icon: "⚙️", labelKey: "settings", active: false },
];

function DashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("overview");
  const [userName] = useState("John Doe"); // Mock user name

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
                  if (item.id === "applications") {
                    navigate(ROUTES.MY_APPLICATIONS);
                  } else if (item.id === "profile") {
                    navigate(ROUTES.PROFILE);
                  }
                  // Add other navigation logic for other menu items when implemented
                }}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>
                  {t(`dashboard.navigation.${item.labelKey}`)}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Header */}
          <header className={styles.contentHeader}>
            <h1 className={styles.greeting}>
              {t("dashboard.welcomeBack")}, {userName}!
            </h1>
            <p className={styles.subGreeting}>{t("dashboard.todayActivity")}</p>
          </header>

          {/* Summary Stats */}
          <section className={styles.summarySection}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📝</div>
                <div className={styles.statInfo}>
                  <div className={styles.statNumber}>
                    {MOCK_STATS.appliedJobs}
                  </div>
                  <div className={styles.statLabel}>
                    {t("dashboard.stats.appliedJobs")}
                  </div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>❤️</div>
                <div className={styles.statInfo}>
                  <div className={styles.statNumber}>
                    {MOCK_STATS.favoriteJobs}
                  </div>
                  <div className={styles.statLabel}>
                    {t("dashboard.stats.favoriteJobs")}
                  </div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🔔</div>
                <div className={styles.statInfo}>
                  <div className={styles.statNumber}>
                    {MOCK_STATS.jobAlerts}
                  </div>
                  <div className={styles.statLabel}>
                    {t("dashboard.stats.jobAlerts")}
                  </div>
                </div>
              </div>
            </div>
          </section>

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
              {MOCK_RECENT_JOBS.map((job) => (
                <div key={job.id} className={styles.jobCard}>
                  {/* Job Info Column */}
                  <div className={styles.jobInfo}>
                    <div className={styles.jobHeader}>
                      <div className={styles.companyLogo}>{job.logo}</div>
                      <div className={styles.jobDetails}>
                        <h3 className={styles.jobTitle}>{job.position}</h3>
                        <p className={styles.companyName}>{job.company}</p>
                        <div className={styles.jobTags}>
                          <span className={styles.tag}>{job.workType}</span>
                          <span className={styles.tag}>{job.jobType}</span>
                        </div>
                        <div className={styles.jobMeta}>
                          <span className={styles.location}>
                            📍 {job.location}
                          </span>
                          <span className={styles.salary}>💰 {job.salary}</span>
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
              ))}
            </div>
          </section>
        </main>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;
