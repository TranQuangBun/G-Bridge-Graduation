import React, { useState } from "react";
import styles from "./DashboardPage.module.css";
import { MainLayout } from "../../layouts";

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
  { id: "overview", icon: "📊", label: "Overview", active: true },
  { id: "applications", icon: "📋", label: "My Applications", active: false },
  { id: "favorites", icon: "❤️", label: "Saved Jobs", active: false },
  { id: "alerts", icon: "🔔", label: "Job Alerts", active: false },
  { id: "profile", icon: "👤", label: "Profile", active: false },
  { id: "settings", icon: "⚙️", label: "Settings", active: false },
];

function DashboardPage() {
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

  return (
    <MainLayout>
      <div className={styles.dashboardRoot}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Dashboard</h2>
          </div>
          <nav className={styles.sidebarNav}>
            {SIDEBAR_MENU.map((item) => (
              <button
                key={item.id}
                className={`${styles.menuItem} ${
                  activeMenu === item.id ? styles.menuItemActive : ""
                }`}
                onClick={() => setActiveMenu(item.id)}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Header */}
          <header className={styles.contentHeader}>
            <h1 className={styles.greeting}>Welcome back, {userName}!</h1>
            <p className={styles.subGreeting}>
              Here's what's happening with your job search today.
            </p>
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
                  <div className={styles.statLabel}>Applied Jobs</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>❤️</div>
                <div className={styles.statInfo}>
                  <div className={styles.statNumber}>
                    {MOCK_STATS.favoriteJobs}
                  </div>
                  <div className={styles.statLabel}>Favorite Jobs</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🔔</div>
                <div className={styles.statInfo}>
                  <div className={styles.statNumber}>
                    {MOCK_STATS.jobAlerts}
                  </div>
                  <div className={styles.statLabel}>Job Alerts</div>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Jobs */}
          <section className={styles.recentJobsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recently Applied</h2>
              <button className={styles.viewAllBtn}>View all</button>
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
                    <span className={styles.dateLabel}>Date Applied</span>
                    <span className={styles.dateValue}>
                      {formatDate(job.dateApplied)}
                    </span>
                  </div>

                  {/* Status Column */}
                  <div className={styles.statusColumn}>
                    <span className={styles.statusLabel}>Status</span>
                    <div
                      className={`${styles.statusBadge} ${getStatusClass(
                        job.status
                      )}`}
                    >
                      <span className={styles.statusIcon}>●</span>
                      <span className={styles.statusText}>{job.status}</span>
                    </div>
                  </div>

                  {/* Action Column */}
                  <div className={styles.actionColumn}>
                    <button className={styles.viewDetailsBtn}>
                      View Details
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
