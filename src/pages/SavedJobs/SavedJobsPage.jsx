import React, { useState } from "react";
import styles from "./SavedJobsPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";

// Mock data for saved jobs
const MOCK_SAVED_JOBS = [
  {
    id: 1,
    company: "GlobalSpeak",
    logo: "🏢",
    position: "Senior English-Vietnamese Conference Interpreter",
    jobType: "Full-time",
    workType: "Remote",
    location: "Ho Chi Minh City",
    salary: "$2,500-3,500",
    dateSaved: "2025-09-15",
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
    dateSaved: "2025-09-14",
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
    company: "TechTranslate",
    logo: "💻",
    position: "Technical Document Translator",
    jobType: "Full-time",
    workType: "Hybrid",
    location: "Hanoi",
    salary: "$2,000-2,800",
    dateSaved: "2025-09-12",
    description:
      "Translate technical documentation, software interfaces, and user manuals for technology companies.",
    requirements: [
      "Technical translation experience",
      "Software localization knowledge",
      "CAT tools proficiency",
    ],
  },
  {
    id: 4,
    company: "LegalLingo",
    logo: "⚖️",
    position: "Legal Interpreter",
    jobType: "Part-time",
    workType: "On-site",
    location: "District 3, Ho Chi Minh City",
    salary: "$40-50/hour",
    dateSaved: "2025-09-10",
    description:
      "Provide interpretation services for legal proceedings, client meetings, and document review sessions.",
    requirements: [
      "Legal interpreting certification",
      "Court interpreting experience",
      "Confidentiality protocols knowledge",
    ],
  },
  {
    id: 5,
    company: "EduBridge",
    logo: "🎓",
    position: "Educational Content Translator",
    jobType: "Contract",
    workType: "Remote",
    location: "Remote",
    salary: "$30-40/hour",
    dateSaved: "2025-09-08",
    description:
      "Translate educational materials and online courses from English to Vietnamese for K-12 students.",
    requirements: [
      "Education background preferred",
      "Translation experience",
      "Understanding of pedagogical concepts",
    ],
  },
  {
    id: 6,
    company: "BusinessLang",
    logo: "💼",
    position: "Business Meeting Interpreter",
    jobType: "Freelance",
    workType: "On-site",
    location: "Various locations",
    salary: "$50-70/hour",
    dateSaved: "2025-09-05",
    description:
      "Provide professional interpretation services for business meetings, negotiations, and corporate events.",
    requirements: [
      "Business interpretation experience",
      "Professional appearance",
      "Flexible schedule",
    ],
  },
];

function SavedJobsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState("favorites");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedJobs, setSavedJobs] = useState(MOCK_SAVED_JOBS);

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
      active: true,
    },
    { id: "alerts", icon: "🔔", labelKey: "alerts", active: false },
    {
      id: "profile",
      icon: isCompany ? "🏢" : "👤",
      label: isCompany ? "Company Profile" : null,
      labelKey: isCompany ? null : "profile",
      active: false,
    },
    { id: "settings", icon: "⚙️", labelKey: "settings", active: false },
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const sortedJobs = savedJobs.sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.dateSaved) - new Date(a.dateSaved);
    } else if (sortBy === "oldest") {
      return new Date(a.dateSaved) - new Date(b.dateSaved);
    } else if (sortBy === "company") {
      return a.company.localeCompare(b.company);
    }
    return 0;
  });

  const handleViewDetails = (job) => {
    setSelectedJob(job);
  };

  const handleUnsaveJob = (jobId) => {
    setSavedJobs(savedJobs.filter((job) => job.id !== jobId));
  };

  const closeModal = () => {
    setSelectedJob(null);
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
                  } else if (item.id === "applications") {
                    navigate(ROUTES.MY_APPLICATIONS);
                  } else if (item.id === "alerts") {
                    navigate(ROUTES.JOB_ALERTS);
                  } else if (item.id === "profile") {
                    // Redirect to Company Profile for clients, regular Profile for interpreters
                    if (isCompany) {
                      navigate(ROUTES.COMPANY_PROFILE);
                    } else {
                      navigate(ROUTES.PROFILE);
                    }
                  }
                  // Add other navigation logic for other menu items when implemented
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
            <h1 className={styles.pageTitle}>{t("savedJobs.pageTitle")}</h1>
            <p className={styles.pageSubtitle}>{t("savedJobs.subtitle")}</p>
          </header>

          {/* Controls */}
          <section className={styles.controlsSection}>
            <div className={styles.controls}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  {t("savedJobs.sortBy")}:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="newest">{t("savedJobs.sort.newest")}</option>
                  <option value="oldest">{t("savedJobs.sort.oldest")}</option>
                  <option value="company">{t("savedJobs.sort.company")}</option>
                </select>
              </div>

              <div className={styles.resultsCount}>
                {sortedJobs.length} {t("savedJobs.resultsCount")}
              </div>
            </div>
          </section>

          {/* Saved Jobs List */}
          <section className={styles.jobsSection}>
            <div className={styles.jobsGrid}>
              {sortedJobs.map((job) => (
                <div key={job.id} className={styles.jobCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.companyInfo}>
                      <span className={styles.companyLogo}>{job.logo}</span>
                      <div>
                        <h3 className={styles.companyName}>{job.company}</h3>
                        <h4 className={styles.position}>{job.position}</h4>
                      </div>
                    </div>
                    <button
                      className={styles.unsaveBtn}
                      onClick={() => handleUnsaveJob(job.id)}
                      title={t("savedJobs.unsave")}
                    >
                      ❤️
                    </button>
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.jobDetails}>
                      <span className={styles.jobType}>{job.jobType}</span>
                      <span className={styles.workType}>{job.workType}</span>
                      <span className={styles.location}>{job.location}</span>
                    </div>
                    <div className={styles.salary}>{job.salary}</div>
                    <div className={styles.dateSaved}>
                      {t("savedJobs.savedOn")}: {formatDate(job.dateSaved)}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      className={styles.viewDetailsBtn}
                      onClick={() => handleViewDetails(job)}
                    >
                      {t("savedJobs.viewDetails")}
                    </button>
                    <button className={styles.applyBtn}>
                      {t("savedJobs.apply")}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {sortedJobs.length === 0 && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>❤️</span>
                <h3>{t("savedJobs.noSavedJobs")}</h3>
                <p>{t("savedJobs.noSavedJobsDesc")}</p>
                <button
                  className={styles.findJobsBtn}
                  onClick={() => navigate(ROUTES.FIND_JOB)}
                >
                  {t("savedJobs.findJobs")}
                </button>
              </div>
            )}
          </section>
        </main>

        {/* Job Details Modal */}
        {selectedJob && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{selectedJob.position}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.companySection}>
                  <span className={styles.modalCompanyLogo}>
                    {selectedJob.logo}
                  </span>
                  <div>
                    <h3>{selectedJob.company}</h3>
                    <p className={styles.modalLocation}>
                      {selectedJob.location}
                    </p>
                  </div>
                </div>

                <div className={styles.modalDetails}>
                  <div className={styles.detailGroup}>
                    <strong>{t("savedJobs.modal.jobType")}:</strong>
                    <span>{selectedJob.jobType}</span>
                  </div>
                  <div className={styles.detailGroup}>
                    <strong>{t("savedJobs.modal.workType")}:</strong>
                    <span>{selectedJob.workType}</span>
                  </div>
                  <div className={styles.detailGroup}>
                    <strong>{t("savedJobs.modal.salary")}:</strong>
                    <span>{selectedJob.salary}</span>
                  </div>
                  <div className={styles.detailGroup}>
                    <strong>{t("savedJobs.modal.savedOn")}:</strong>
                    <span>{formatDate(selectedJob.dateSaved)}</span>
                  </div>
                </div>

                <div className={styles.descriptionSection}>
                  <h4>{t("savedJobs.modal.description")}</h4>
                  <p>{selectedJob.description}</p>
                </div>

                <div className={styles.requirementsSection}>
                  <h4>{t("savedJobs.modal.requirements")}</h4>
                  <ul>
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.applyModalBtn}>
                  {t("savedJobs.modal.apply")}
                </button>
                <button
                  className={styles.unsaveModalBtn}
                  onClick={() => {
                    handleUnsaveJob(selectedJob.id);
                    closeModal();
                  }}
                >
                  {t("savedJobs.modal.unsave")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default SavedJobsPage;
