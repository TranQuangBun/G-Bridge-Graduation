import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBookmark,
  FaMapMarkerAlt,
  FaBriefcase,
  FaDollarSign,
  FaClock,
  FaFilter,
  FaSortAmountDown,
  FaRegBookmark,
  FaEye,
  FaChartBar,
  FaClipboardList,
  FaUser,
  FaCog,
  FaEnvelope,
} from "react-icons/fa";
import { MainLayout } from "../../../layouts";
import { useLanguage } from "../../../translet/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { ROUTES } from "../../../constants";
import savedJobService from "../../../services/savedJobService";
import styles from "./SavedJobs.module.css";

// Sidebar menu for Interpreter role
const INTERPRETER_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
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
    active: true,
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
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
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

const SavedJobs = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeMenu, setActiveMenu] = useState("savedJobs");

  // Get sidebar menu based on user role
  const SIDEBAR_MENU =
    user?.role === "client" ? CLIENT_SIDEBAR_MENU : INTERPRETER_SIDEBAR_MENU;

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const result = await savedJobService.getAllSavedJobs();

      if (result.success) {
        setSavedJobs(result.data || []);
      } else {
        console.error("Failed to fetch saved jobs:", result.message);
        setSavedJobs([]);
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      setSavedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveJob = async (jobId, e) => {
    e.stopPropagation();
    try {
      const result = await savedJobService.unsaveJob(jobId);

      if (result.success) {
        setSavedJobs(savedJobs.filter((job) => job.id !== jobId));
      } else {
        console.error("Failed to unsave job:", result.message);
      }
    } catch (error) {
      console.error("Error unsaving job:", error);
    }
  };

  const handleJobClick = (jobId) => {
    navigate(`/job/${jobId}`);
  };

  // Memoize filtered and sorted jobs - must be called before any early returns
  const filteredJobs = useMemo(() => {
    let filtered = [...savedJobs];

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((job) => {
        const jobStatus = job.status || job.job?.status || job.statusOpenStop || job.job?.statusOpenStop;
        if (filterStatus === "active") {
          return jobStatus === "open" || jobStatus === "active";
        } else if (filterStatus === "closed") {
          return jobStatus === "closed" || jobStatus === "inactive";
        }
        return true;
      });
    }

    // Apply sorting
    if (sortBy === "newest") {
      filtered.sort((a, b) => {
        const dateA = new Date(a.saved_at || a.savedDate || a.createdAt || 0);
        const dateB = new Date(b.saved_at || b.savedDate || b.createdAt || 0);
        return dateB - dateA;
      });
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => {
        const dateA = new Date(a.saved_at || a.savedDate || a.createdAt || 0);
        const dateB = new Date(b.saved_at || b.savedDate || b.createdAt || 0);
        return dateA - dateB;
      });
    } else if (sortBy === "salary_high") {
      filtered.sort((a, b) => {
        // Try multiple possible salary fields
        const salaryA = parseInt(
          (a.pay_rate || a.salary || a.job?.maxSalary || a.maxSalary || "0")
            .toString()
            .replace(/[^0-9]/g, "") || "0"
        );
        const salaryB = parseInt(
          (b.pay_rate || b.salary || b.job?.maxSalary || b.maxSalary || "0")
            .toString()
            .replace(/[^0-9]/g, "") || "0"
        );
        return salaryB - salaryA;
      });
    }

    return filtered;
  }, [savedJobs, filterStatus, sortBy]);

  if (loading) {
    return (
      <MainLayout>
        <div className={styles.dashboardRoot}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2 className={styles.sidebarTitle}>
                {t("dashboard.pageTitle")}
              </h2>
            </div>
          </aside>
          <main className={styles.mainContent}>
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>{t("common.loading") || "Loading..."}</p>
            </div>
          </main>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
                    if (item.id === "overview") {
                      navigate(ROUTES.DASHBOARD);
                    } else if (item.id === "applications") {
                      navigate(ROUTES.MY_APPLICATIONS);
                    } else if (item.id === "savedJobs") {
                      // Stay on current page
                      setActiveMenu(item.id);
                    } else if (item.id === "myJobs") {
                      navigate(ROUTES.MY_JOBS);
                    } else if (item.id === "jobApplications") {
                      navigate(ROUTES.MY_APPLICATIONS);
                    } else if (item.id === "savedInterpreters") {
                      navigate(ROUTES.SAVED_INTERPRETERS);
                    } else if (item.id === "notifications") {
                      navigate(ROUTES.DASHBOARD + "?tab=notifications");
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
            <h1 className={styles.pageTitle}>
              {t("savedJobs.pageTitle") || "Saved Jobs"}
            </h1>
            <p className={styles.pageSubtitle}>
              {t("savedJobs.subtitle") ||
                "Your bookmarked job opportunities in one place"}
            </p>
          </header>

          {/* Filter Section */}
          <div className={styles.filterSection}>
            <div className={styles.filterContainer}>
              <div className={styles.filterGroup}>
                <FaFilter className={styles.filterIcon} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">
                    {t("savedJobs.filters.all") || "All Jobs"}
                  </option>
                  <option value="active">
                    {t("savedJobs.filters.active") || "Active"}
                  </option>
                  <option value="closed">
                    {t("savedJobs.filters.closed") || "Closed"}
                  </option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <FaSortAmountDown className={styles.filterIcon} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="newest">
                    {t("savedJobs.sort.newest") || "Newest First"}
                  </option>
                  <option value="oldest">
                    {t("savedJobs.sort.oldest") || "Oldest First"}
                  </option>
                  <option value="salary_high">
                    {t("savedJobs.sort.salaryHigh") || "Highest Salary"}
                  </option>
                </select>
              </div>
            </div>

            <div className={styles.resultsCount}>
              {filteredJobs.length}{" "}
              {t("savedJobs.resultsCount") || "saved jobs"}
            </div>
          </div>

          {/* Content */}
          <div className={styles.contentContainer}>
            {filteredJobs.length === 0 ? (
              // Empty State
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <FaRegBookmark />
                </div>
                <h2 className={styles.emptyTitle}>
                  {t("savedJobs.empty.title") || "No saved jobs yet"}
                </h2>
                <p className={styles.emptyDescription}>
                  {t("savedJobs.empty.description") ||
                    "Start saving jobs you're interested in to view them here"}
                </p>
                <button
                  className={styles.exploreButton}
                  onClick={() => navigate("/find-job")}
                >
                  {t("savedJobs.empty.exploreButton") || "Find Jobs"}
                </button>
              </div>
            ) : (
              // Jobs Grid
              <div className={styles.jobsGrid}>
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className={styles.jobCard}
                    onClick={() => handleJobClick(job.id)}
                  >
                    {/* Card Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.companyLogo}>
                        <FaBriefcase />
                      </div>
                      <button
                        className={styles.unsaveButton}
                        onClick={(e) => handleUnsaveJob(job.id, e)}
                        title={t("savedJobs.unsave") || "Remove from saved"}
                      >
                        <FaBookmark />
                      </button>
                    </div>

                    {/* Job Info */}
                    <div className={styles.jobInfo}>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <p className={styles.companyName}>
                        {job.company_name || job.organization?.name}
                      </p>
                    </div>

                    {/* Job Details */}
                    <div className={styles.jobDetails}>
                      {job.location && (
                        <div className={styles.detailItem}>
                          <FaMapMarkerAlt className={styles.detailIcon} />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.pay_rate && (
                        <div className={styles.detailItem}>
                          <FaDollarSign className={styles.detailIcon} />
                          <span>{job.pay_rate}</span>
                        </div>
                      )}
                      {job.job_type && (
                        <div className={styles.detailItem}>
                          <FaClock className={styles.detailIcon} />
                          <span>{job.job_type}</span>
                        </div>
                      )}
                    </div>

                    {/* Languages */}
                    {job.languages && job.languages.length > 0 && (
                      <div className={styles.languageTags}>
                        {job.languages.slice(0, 3).map((lang, index) => (
                          <span key={index} className={styles.languageTag}>
                            {lang.name || lang}
                          </span>
                        ))}
                        {job.languages.length > 3 && (
                          <span className={styles.languageTag}>
                            +{job.languages.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className={styles.cardFooter}>
                      <span className={styles.savedDate}>
                        {t("savedJobs.savedOn") || "Saved"}{" "}
                        {new Date(job.saved_at).toLocaleDateString()}
                      </span>
                      <button
                        className={styles.viewButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJobClick(job.id);
                        }}
                      >
                        <FaEye />
                        {t("savedJobs.viewDetails") || "View Details"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export default SavedJobs;
