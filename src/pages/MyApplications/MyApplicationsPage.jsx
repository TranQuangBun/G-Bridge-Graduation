import React, { useState } from "react";
import styles from "./MyApplicationsPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";

// Mock data for applications
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
    dateApplied: "2025-01-10",
    status: "Under Review",
    description:
      "Leading global language services company seeking experienced interpreter for high-level conferences and business meetings.",
    requirements: [
      "5+ years conference interpreting experience",
      "Professional certification",
      "Fluent English and Vietnamese",
    ],
  },
  {
    id: 2,
    company: "MedLingua",
    logo: "🏥",
    position: "Medical Interpreter - Vietnamese",
    jobType: "Part-time",
    workType: "On-site",
    location: "District 1, Ho Chi Minh City",
    salary: "$25-35/hour",
    dateApplied: "2025-01-08",
    status: "Shortlisted",
    description:
      "Healthcare interpretation services for Vietnamese-speaking patients in medical settings.",
    requirements: [
      "Medical terminology knowledge",
      "Healthcare interpreting certification",
      "Compassionate communication skills",
    ],
  },
  {
    id: 3,
    company: "EduBridge",
    logo: "🎓",
    position: "Educational Content Translator",
    jobType: "Contract",
    workType: "Remote",
    location: "Remote",
    salary: "$30-40/hour",
    dateApplied: "2025-01-05",
    status: "Rejected",
    description:
      "Translate educational materials and online courses from English to Vietnamese for K-12 students.",
    requirements: [
      "Education background preferred",
      "Translation experience",
      "Understanding of pedagogical concepts",
    ],
  },
  {
    id: 4,
    company: "TechTranslate",
    logo: "💻",
    position: "Technical Document Translator",
    jobType: "Full-time",
    workType: "Hybrid",
    location: "Hanoi",
    salary: "$2,000-2,800",
    dateApplied: "2025-01-03",
    status: "Interview Scheduled",
    description:
      "Translate technical documentation, software interfaces, and user manuals for technology companies.",
    requirements: [
      "Technical translation experience",
      "Software localization knowledge",
      "CAT tools proficiency",
    ],
  },
  {
    id: 5,
    company: "LegalLingo",
    logo: "⚖️",
    position: "Legal Interpreter",
    jobType: "Part-time",
    workType: "On-site",
    location: "District 3, Ho Chi Minh City",
    salary: "$40-50/hour",
    dateApplied: "2025-01-01",
    status: "Active",
    description:
      "Provide interpretation services for legal proceedings, client meetings, and document review sessions.",
    requirements: [
      "Legal interpreting certification",
      "Court interpreting experience",
      "Confidentiality protocols knowledge",
    ],
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
  const [activeMenu, setActiveMenu] = useState("applications");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedApplication, setSelectedApplication] = useState(null);

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
        return t("applications.status.active");
      case "under review":
        return t("applications.status.underReview");
      case "shortlisted":
        return t("applications.status.shortlisted");
      case "interview scheduled":
        return t("applications.status.interviewScheduled");
      case "rejected":
        return t("applications.status.rejected");
      default:
        return status;
    }
  };

  const filteredApplications = MOCK_APPLICATIONS.filter(
    (app) =>
      selectedStatus === "all" || app.status.toLowerCase() === selectedStatus
  ).sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.dateApplied) - new Date(a.dateApplied);
    } else if (sortBy === "oldest") {
      return new Date(a.dateApplied) - new Date(b.dateApplied);
    } else if (sortBy === "company") {
      return a.company.localeCompare(b.company);
    }
    return 0;
  });

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
  };

  const closeModal = () => {
    setSelectedApplication(null);
  };

  return (
    <MainLayout>
      <div className={styles.dashboardRoot}>
        {/* Sidebar - Using exact same structure as DashboardPage */}
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
            <h1 className={styles.pageTitle}>{t("applications.pageTitle")}</h1>
            <p className={styles.pageSubtitle}>{t("applications.subtitle")}</p>
          </header>

          {/* Controls */}
          <section className={styles.controlsSection}>
            <div className={styles.controls}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  {t("applications.filterByStatus")}:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">{t("applications.status.all")}</option>
                  <option value="active">
                    {t("applications.status.active")}
                  </option>
                  <option value="under review">
                    {t("applications.status.underReview")}
                  </option>
                  <option value="shortlisted">
                    {t("applications.status.shortlisted")}
                  </option>
                  <option value="interview scheduled">
                    {t("applications.status.interviewScheduled")}
                  </option>
                  <option value="rejected">
                    {t("applications.status.rejected")}
                  </option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  {t("applications.sortBy")}:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="newest">
                    {t("applications.sort.newest")}
                  </option>
                  <option value="oldest">
                    {t("applications.sort.oldest")}
                  </option>
                  <option value="company">
                    {t("applications.sort.company")}
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* Applications List */}
          <section className={styles.applicationsSection}>
            <div className={styles.applicationsGrid}>
              {filteredApplications.map((application) => (
                <div key={application.id} className={styles.applicationCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.companyInfo}>
                      <span className={styles.companyLogo}>
                        {application.logo}
                      </span>
                      <div>
                        <h3 className={styles.companyName}>
                          {application.company}
                        </h3>
                        <h4 className={styles.position}>
                          {application.position}
                        </h4>
                      </div>
                    </div>
                    <span
                      className={`${styles.status} ${getStatusClass(
                        application.status
                      )}`}
                    >
                      {getStatusText(application.status)}
                    </span>
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.jobDetails}>
                      <span className={styles.jobType}>
                        {application.jobType}
                      </span>
                      <span className={styles.workType}>
                        {application.workType}
                      </span>
                      <span className={styles.location}>
                        {application.location}
                      </span>
                    </div>
                    <div className={styles.salary}>{application.salary}</div>
                    <div className={styles.dateApplied}>
                      {t("applications.appliedOn")}:{" "}
                      {formatDate(application.dateApplied)}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      className={styles.viewDetailsBtn}
                      onClick={() => handleViewDetails(application)}
                    >
                      {t("applications.viewDetails")}
                    </button>
                    <button className={styles.withdrawBtn}>
                      {t("applications.withdraw")}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredApplications.length === 0 && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📋</span>
                <h3>{t("applications.noApplications")}</h3>
                <p>{t("applications.noApplicationsDesc")}</p>
                <button
                  className={styles.findJobsBtn}
                  onClick={() => navigate(ROUTES.FIND_JOB)}
                >
                  {t("applications.findJobs")}
                </button>
              </div>
            )}
          </section>
        </main>

        {/* Application Details Modal */}
        {selectedApplication && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{selectedApplication.position}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.companySection}>
                  <span className={styles.modalCompanyLogo}>
                    {selectedApplication.logo}
                  </span>
                  <div>
                    <h3>{selectedApplication.company}</h3>
                    <p className={styles.modalLocation}>
                      {selectedApplication.location}
                    </p>
                  </div>
                </div>

                <div className={styles.modalDetails}>
                  <div className={styles.detailGroup}>
                    <strong>{t("applications.modal.jobType")}:</strong>
                    <span>{selectedApplication.jobType}</span>
                  </div>
                  <div className={styles.detailGroup}>
                    <strong>{t("applications.modal.workType")}:</strong>
                    <span>{selectedApplication.workType}</span>
                  </div>
                  <div className={styles.detailGroup}>
                    <strong>{t("applications.modal.salary")}:</strong>
                    <span>{selectedApplication.salary}</span>
                  </div>
                  <div className={styles.detailGroup}>
                    <strong>{t("applications.modal.appliedOn")}:</strong>
                    <span>{formatDate(selectedApplication.dateApplied)}</span>
                  </div>
                  <div className={styles.detailGroup}>
                    <strong>{t("applications.modal.status")}:</strong>
                    <span
                      className={`${styles.modalStatus} ${getStatusClass(
                        selectedApplication.status
                      )}`}
                    >
                      {getStatusText(selectedApplication.status)}
                    </span>
                  </div>
                </div>

                <div className={styles.descriptionSection}>
                  <h4>{t("applications.modal.description")}</h4>
                  <p>{selectedApplication.description}</p>
                </div>

                <div className={styles.requirementsSection}>
                  <h4>{t("applications.modal.requirements")}</h4>
                  <ul>
                    {selectedApplication.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.contactBtn}>
                  {t("applications.modal.contactCompany")}
                </button>
                <button className={styles.withdrawModalBtn}>
                  {t("applications.modal.withdraw")}
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
