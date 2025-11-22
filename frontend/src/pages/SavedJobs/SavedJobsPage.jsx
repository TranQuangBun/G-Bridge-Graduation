import React, { useState, useEffect } from "react";
import styles from "./SavedJobsPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import jobService from "../../services/jobService.js";
import { 
  FaBuilding, 
  FaBriefcase,
  FaChartBar,
  FaClipboardList,
  FaHeart,
  FaBell,
  FaUser,
  FaCog,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle
} from "react-icons/fa";

// Unused mock data - kept for reference
/* const MOCK_SAVED_JOBS = [
  {
    id: 1,
    company: "GlobalSpeak",
    logo: FaBuilding,
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
    logo: FaHospital,
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
    logo: FaLaptop,
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
    logo: FaBalanceScale,
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
    logo: FaGraduationCap,
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
    logo: FaBriefcase,
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
]; */

// Sidebar menu for Interpreter role
const INTERPRETER_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  { id: "applications", icon: FaClipboardList, labelKey: "applications", active: false },
  { id: "favorites", icon: FaHeart, labelKey: "favorites", active: true },
  { id: "alerts", icon: FaBell, labelKey: "alerts", active: false },
  { id: "profile", icon: FaUser, labelKey: "profile", active: false },
  { id: "settings", icon: FaCog, labelKey: "settings", active: false },
];

// Sidebar menu for Client/Company role (SavedJobs not available for clients)
const CLIENT_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  { id: "myJobs", icon: FaBriefcase, labelKey: "myJobs", active: false },
  { id: "jobApplications", icon: FaClipboardList, labelKey: "jobApplications", active: false },
  { id: "profile", icon: FaUser, labelKey: "profile", active: false },
  { id: "settings", icon: FaCog, labelKey: "settings", active: false },
];

function SavedJobsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState("favorites");
  
  // Get sidebar menu based on user role
  const SIDEBAR_MENU = user?.role === "client" ? CLIENT_SIDEBAR_MENU : INTERPRETER_SIDEBAR_MENU;
  
  // Redirect client users away from SavedJobs page
  useEffect(() => {
    if (user?.role === "client") {
      navigate(ROUTES.DASHBOARD);
    }
  }, [user, navigate]);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  // const [loading, setLoading] = useState(true); // Reserved for future use
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "error",
  });

  // Notification functions
  function showNotification(message, type = "error") {
    setNotification({
      show: true,
      message,
      type,
    });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  }

  function hideNotification() {
    setNotification((prev) => ({ ...prev, show: false }));
  }

  // Fetch saved jobs from API
  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        // setLoading(true); // Reserved for future use
        const response = await jobService.getSavedJobs();
        
        console.log("Saved jobs response:", response);
        
        // Handle different response formats
        // sendPaginated returns: { success: true, data: [...], pagination: {...} }
        // So savedJobs array is directly in response.data
        const savedJobsData = response.data || [];
        
        if (response && (response.success !== false) && Array.isArray(savedJobsData)) {
          const transformedJobs = savedJobsData.map((saved) => ({
            id: saved.job?.id || saved.id,
            company: saved.job?.organization?.name || "Company",
            logo: saved.job?.organization?.logo || FaBuilding,
            position: saved.job?.title || "Position",
            jobType: saved.job?.workingMode?.name || "Full-time",
            workType: saved.job?.workingMode?.name || "Remote",
            location: saved.job?.province || saved.job?.address || "Location TBD",
            salary:
              saved.job?.minSalary && saved.job?.maxSalary
                ? `$${saved.job.minSalary}-${saved.job.maxSalary}`
                : saved.job?.minSalary
                ? `$${saved.job.minSalary}+`
                : "Negotiable",
            dateSaved: saved.savedDate || saved.createdAt || saved.dateSaved || new Date().toISOString(),
            description: saved.job?.descriptions || saved.description || "",
            requirements: saved.job?.requiredLanguages?.map((rl) => rl.language?.name || "") || saved.requirements || [],
          }));
          
          setSavedJobs(transformedJobs);
        } else {
          // No saved jobs or empty response
          setSavedJobs([]);
        }
      } catch (error) {
        console.error("Error fetching saved jobs:", error);
        // Don't use mock data, show empty state instead
        setSavedJobs([]);
        showNotification(
          t("savedJobs.errors.fetchFailed") || "Không thể tải danh sách việc làm đã lưu. Vui lòng thử lại sau.",
          "error"
        );
      } finally {
        // setLoading(false); // Reserved for future use
      }
    };

    fetchSavedJobs();
  }, [t]);

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
      {/* Notification */}
      {notification.show && (
        <div className={styles.notificationOverlay}>
          <div
            className={`${styles.notification} ${
              styles[notification.type]
            }`}
          >
            <div className={styles.notificationContent}>
              <div className={styles.notificationIcon}>
                {notification.type === "error" && <FaExclamationTriangle />}
                {notification.type === "success" && <FaCheckCircle />}
                {notification.type === "warning" && <FaBell />}
                {notification.type === "info" && <FaInfoCircle />}
              </div>
              <div className={styles.notificationMessage}>
                {notification.message}
              </div>
              <button onClick={hideNotification} className={styles.notificationClose}>
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={styles.dashboardRoot}>
        {/* Sidebar - Using exact same structure as DashboardPage */}
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
                    if (item.id === "overview") {
                      navigate(ROUTES.DASHBOARD);
                    } else if (item.id === "applications") {
                      navigate(ROUTES.MY_APPLICATIONS);
                    } else if (item.id === "favorites") {
                      navigate(ROUTES.SAVED_JOBS);
                    } else if (item.id === "myJobs") {
                      navigate(ROUTES.MY_JOBS);
                    } else if (item.id === "jobApplications") {
                      navigate(ROUTES.MY_APPLICATIONS);
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
                      <span className={styles.companyLogo}>
                        {typeof job.logo === "string" ? (
                          job.logo
                        ) : job.logo ? (
                          <job.logo />
                        ) : (
                          <FaBuilding />
                        )}
                      </span>
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
