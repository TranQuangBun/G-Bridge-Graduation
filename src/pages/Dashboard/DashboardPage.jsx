import React, { useState, useEffect } from "react";
import styles from "./DashboardPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { DashboardSidebar } from "../../components";

// Mock data for dashboard stats (will be replaced with real API data later)
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

function DashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, subscription, isAuthenticated, loading } = useAuth();
  const [activeMenu, setActiveMenu] = useState("overview");

  // Redirect to login if not authenticated
  useEffect(() => {
    // Đợi cho loading xong trước khi redirect
    if (!loading && !isAuthenticated) {
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, loading, navigate]);

  // Get user's full name or email
  const userName = user?.fullName || user?.email?.split("@")[0] || "User";

  // Calculate subscription days remaining
  const getSubscriptionInfo = () => {
    if (!subscription || !subscription.endDate) {
      return null;
    }

    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    return {
      planName: subscription.displayName || subscription.planKey || "Free",
      endDate: endDate,
      daysRemaining: daysRemaining,
      isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
      isExpired: daysRemaining <= 0,
    };
  };

  const subscriptionInfo = getSubscriptionInfo();

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
        <DashboardSidebar
          activeMenu={activeMenu}
          onMenuChange={setActiveMenu}
        />

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Header */}
          <header className={styles.contentHeader}>
            <h1 className={styles.greeting}>
              {t("dashboard.welcomeBack")}, {userName}!
            </h1>
            <p className={styles.subGreeting}>{t("dashboard.todayActivity")}</p>
          </header>

          {/* Subscription Section */}
          {subscriptionInfo && (
            <section className={styles.subscriptionSection}>
              <div
                className={`${styles.subscriptionCard} ${
                  subscriptionInfo.isExpiringSoon
                    ? styles.expiringSoon
                    : subscriptionInfo.isExpired
                    ? styles.expired
                    : ""
                }`}
              >
                <div className={styles.subscriptionHeader}>
                  <div className={styles.subscriptionIcon}>
                    <span role="img" aria-label="subscription">
                      {subscriptionInfo.isExpired
                        ? "⚠️"
                        : subscriptionInfo.isExpiringSoon
                        ? "⏰"
                        : "💎"}
                    </span>
                  </div>
                  <div className={styles.subscriptionInfo}>
                    <h3 className={styles.subscriptionTitle}>
                      {subscriptionInfo.planName}
                    </h3>
                    <p className={styles.subscriptionStatus}>
                      {subscriptionInfo.isExpired
                        ? "Your subscription has expired"
                        : subscriptionInfo.isExpiringSoon
                        ? `Expiring soon - ${
                            subscriptionInfo.daysRemaining
                          } day${
                            subscriptionInfo.daysRemaining !== 1 ? "s" : ""
                          } remaining`
                        : `Active - ${subscriptionInfo.daysRemaining} days remaining`}
                    </p>
                  </div>
                  {(subscriptionInfo.isExpired ||
                    subscriptionInfo.isExpiringSoon) && (
                    <button
                      className={styles.renewBtn}
                      onClick={() => navigate(ROUTES.PRICING)}
                    >
                      {subscriptionInfo.isExpired ? "Renew Now" : "Extend Plan"}
                    </button>
                  )}
                </div>
                <div className={styles.subscriptionDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Valid Until</span>
                    <span className={styles.detailValue}>
                      {subscriptionInfo.endDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Days Remaining</span>
                    <span className={styles.detailValue}>
                      {subscriptionInfo.daysRemaining} days
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status</span>
                    <span className={styles.detailValue}>
                      {subscriptionInfo.isExpired
                        ? "Expired"
                        : subscriptionInfo.isExpiringSoon
                        ? "Expiring Soon"
                        : "Active"}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

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
