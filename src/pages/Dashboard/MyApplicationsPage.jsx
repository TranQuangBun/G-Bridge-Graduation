import React, { useState } from "react";
import styles from "./MyApplicationsPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";

// Extended mock data for applications
const MOCK_APPLICATIONS = [
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
    description:
      "Lead simultaneous interpretation for international conferences, business summits, and diplomatic events.",
    requirements: [
      "5+ years of conference interpretation experience",
      "Certified interpretation credentials",
      "Fluency in English and Vietnamese",
    ],
    applicationStatus: "submitted",
    lastUpdate: "2025-09-12",
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
    description:
      "Provide interpretation services for Japanese patients in Vietnamese hospitals and medical facilities.",
    requirements: [
      "Medical interpretation certification",
      "3+ years healthcare experience",
      "Fluency in Japanese and Vietnamese",
    ],
    applicationStatus: "under_review",
    lastUpdate: "2025-09-09",
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
    description:
      "Translate technical documentation and provide interpretation for software development teams.",
    requirements: [
      "Technical background preferred",
      "EN-VI fluency",
      "Software documentation experience",
    ],
    applicationStatus: "shortlisted",
    lastUpdate: "2025-09-07",
  },
  {
    id: 4,
    company: "JusticeWords",
    logo: "⚖️",
    position: "Legal Court Interpreter",
    jobType: "Part-time",
    workType: "On-site",
    location: "Da Nang",
    salary: "$150-250/day",
    dateApplied: "2025-09-03",
    status: "Rejected",
    description:
      "Certified court interpreter for legal proceedings, depositions, and legal consultations.",
    requirements: [
      "Court interpreter certification",
      "Legal terminology expertise",
      "5+ years legal interpretation",
    ],
    applicationStatus: "rejected",
    lastUpdate: "2025-09-06",
  },
  {
    id: 5,
    company: "VirtualLink",
    logo: "🌐",
    position: "Remote Business Interpreter",
    jobType: "Freelance",
    workType: "Remote",
    location: "Remote",
    salary: "$80-120/hour",
    dateApplied: "2025-09-01",
    status: "Interview Scheduled",
    description:
      "Provide remote interpretation for business meetings, negotiations, and client calls via video platforms.",
    requirements: [
      "Business interpretation experience",
      "Reliable internet connection",
      "Professional home office setup",
    ],
    applicationStatus: "interview",
    lastUpdate: "2025-09-04",
  },
  {
    id: 6,
    company: "EduBridge International",
    logo: "🎓",
    position: "Educational Campus Interpreter",
    jobType: "Part-time",
    workType: "On-site",
    location: "Hanoi",
    salary: "$60-90/hour",
    dateApplied: "2025-08-28",
    status: "Active",
    description:
      "Assist international students with academic interpretation, orientation, and campus life support.",
    requirements: [
      "Education background preferred",
      "Student-friendly approach",
      "Cultural sensitivity",
    ],
    applicationStatus: "submitted",
    lastUpdate: "2025-08-30",
  },
];

const SIDEBAR_MENU = [
  { id: "overview", icon: "📊", labelKey: "overview", active: false },
  { id: "applications", icon: "📋", labelKey: "applications", active: true },
  { id: "favorites", icon: "❤️", labelKey: "favorites", active: false },
  { id: "alerts", icon: "🔔", labelKey: "alerts", active: false },
  { id: "profile", icon: "👤", labelKey: "profile", active: false },
  { id: "settings", icon: "⚙️", labelKey: "settings", active: false },
];

function MyApplicationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("dateApplied");

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
      case "interview scheduled":
        return styles.statusInterview;
      case "rejected":
        return styles.statusRejected;
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
      case "interview scheduled":
        return t("applications.statusInterview");
      case "rejected":
        return t("applications.statusRejected");
      default:
        return status;
    }
  };

  const filteredApplications = MOCK_APPLICATIONS.filter((app) => {
    if (filterStatus === "all") return true;
    return app.status.toLowerCase().replace(/\s+/g, "_") === filterStatus;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (sortBy === "dateApplied") {
      return new Date(b.dateApplied) - new Date(a.dateApplied);
    }
    if (sortBy === "company") {
      return a.company.localeCompare(b.company);
    }
    if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  return (
    <MainLayout>
      <div className={styles.applicationsRoot}>
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
                  item.active ? styles.menuItemActive : ""
                }`}
                onClick={() => {
                  if (item.id === "overview") {
                    navigate(ROUTES.DASHBOARD);
                  }
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
            <h1 className={styles.pageTitle}>{t("applications.title")}</h1>
            <p className={styles.pageSubtitle}>{t("applications.subtitle")}</p>
          </header>

          {/* Filters and Controls */}
          <section className={styles.controlsSection}>
            <div className={styles.filtersContainer}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  {t("applications.filterByStatus")}
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">{t("applications.allStatuses")}</option>
                  <option value="active">
                    {t("dashboard.recentJobs.statusActive")}
                  </option>
                  <option value="under_review">
                    {t("dashboard.recentJobs.statusReview")}
                  </option>
                  <option value="shortlisted">
                    {t("dashboard.recentJobs.statusShortlisted")}
                  </option>
                  <option value="interview_scheduled">
                    {t("applications.statusInterview")}
                  </option>
                  <option value="rejected">
                    {t("applications.statusRejected")}
                  </option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  {t("applications.sortBy")}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="dateApplied">
                    {t("applications.sortByDate")}
                  </option>
                  <option value="company">
                    {t("applications.sortByCompany")}
                  </option>
                  <option value="status">
                    {t("applications.sortByStatus")}
                  </option>
                </select>
              </div>
            </div>
            <div className={styles.statsInfo}>
              <span className={styles.totalApplications}>
                {t("applications.totalApplications")}:{" "}
                <strong>{sortedApplications.length}</strong>
              </span>
            </div>
          </section>

          {/* Applications List */}
          <section className={styles.applicationsSection}>
            <div className={styles.applicationsList}>
              {sortedApplications.map((application) => (
                <div key={application.id} className={styles.applicationCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.companyInfo}>
                      <div className={styles.companyLogo}>
                        {application.logo}
                      </div>
                      <div className={styles.jobDetails}>
                        <h3 className={styles.jobTitle}>
                          {application.position}
                        </h3>
                        <p className={styles.companyName}>
                          {application.company}
                        </p>
                        <div className={styles.jobTags}>
                          <span className={styles.tag}>
                            {application.workType}
                          </span>
                          <span className={styles.tag}>
                            {application.jobType}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.statusContainer}>
                      <div
                        className={`${styles.statusBadge} ${getStatusClass(
                          application.status
                        )}`}
                      >
                        <span className={styles.statusIcon}>●</span>
                        <span className={styles.statusText}>
                          {getStatusText(application.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <p className={styles.jobDescription}>
                      {application.description}
                    </p>
                    <div className={styles.jobMeta}>
                      <span className={styles.location}>
                        📍 {application.location}
                      </span>
                      <span className={styles.salary}>
                        💰 {application.salary}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.applicationInfo}>
                      <span className={styles.dateApplied}>
                        {t("dashboard.recentJobs.dateApplied")}:{" "}
                        {formatDate(application.dateApplied)}
                      </span>
                      <span className={styles.lastUpdate}>
                        {t("applications.lastUpdate")}:{" "}
                        {formatDate(application.lastUpdate)}
                      </span>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.viewDetailsBtn}
                        onClick={() => setSelectedApplication(application)}
                      >
                        {t("dashboard.recentJobs.viewDetails")}
                      </button>
                      <button className={styles.withdrawBtn}>
                        {t("applications.withdraw")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Application Details Modal */}
        {selectedApplication && (
          <div
            className={styles.modalOverlay}
            onClick={() => setSelectedApplication(null)}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedApplication(null)}
              >
                ×
              </button>

              <div className={styles.modalHeader}>
                <div className={styles.modalCompanyInfo}>
                  <div className={styles.modalLogo}>
                    {selectedApplication.logo}
                  </div>
                  <div>
                    <h2 className={styles.modalJobTitle}>
                      {selectedApplication.position}
                    </h2>
                    <p className={styles.modalCompanyName}>
                      {selectedApplication.company}
                    </p>
                  </div>
                </div>
                <div
                  className={`${styles.modalStatusBadge} ${getStatusClass(
                    selectedApplication.status
                  )}`}
                >
                  {getStatusText(selectedApplication.status)}
                </div>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalSection}>
                  <h3>{t("applications.jobDescription")}</h3>
                  <p>{selectedApplication.description}</p>
                </div>

                <div className={styles.modalSection}>
                  <h3>{t("applications.requirements")}</h3>
                  <ul>
                    {selectedApplication.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.modalSection}>
                  <h3>{t("applications.jobDetails")}</h3>
                  <div className={styles.modalDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>
                        {t("applications.location")}:
                      </span>
                      <span>{selectedApplication.location}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>
                        {t("applications.salary")}:
                      </span>
                      <span>{selectedApplication.salary}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>
                        {t("applications.jobType")}:
                      </span>
                      <span>{selectedApplication.jobType}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>
                        {t("applications.workType")}:
                      </span>
                      <span>{selectedApplication.workType}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.modalSection}>
                  <h3>{t("applications.applicationTimeline")}</h3>
                  <div className={styles.timeline}>
                    <div className={styles.timelineItem}>
                      <span className={styles.timelineDate}>
                        {formatDate(selectedApplication.dateApplied)}
                      </span>
                      <span className={styles.timelineEvent}>
                        {t("applications.applicationSubmitted")}
                      </span>
                    </div>
                    <div className={styles.timelineItem}>
                      <span className={styles.timelineDate}>
                        {formatDate(selectedApplication.lastUpdate)}
                      </span>
                      <span className={styles.timelineEvent}>
                        {t("applications.statusUpdated")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button className={styles.withdrawModalBtn}>
                  {t("applications.withdraw")}
                </button>
                <button className={styles.contactBtn}>
                  {t("applications.contactEmployer")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default MyApplicationsPage;
