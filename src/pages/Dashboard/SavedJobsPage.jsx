import React, { useState, useEffect } from "react";
import styles from "./DashboardPage.module.css";
import { MainLayout } from "../../layouts";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../translet/LanguageContext";
import interpreterService from "../../services/interpreterService";

function SavedJobsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedInterpreters, setSavedInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState("favorites");

  // Check if user is company role
  const isCompany = user?.role === "client" || user?.role === "company";

  // Specialization keys (language-independent)
  const SPECIALIZATION_KEYS = [
    "medical",
    "legal",
    "business",
    "technical",
    "conference",
    "community",
    "education",
    "government",
    "tourism",
    "media",
    "pharmaceutical",
    "engineering",
    "realEstate",
    "immigration",
    "courtroom",
    "telecommunications",
    "aviation",
    "manufacturing",
    "insurance",
    "scientific",
  ];

  // Get translated label from key
  const getSpecializationLabel = (keyOrLabel) => {
    const options = t("profile.professional.specializationOptions");
    // Check if it's a key
    if (SPECIALIZATION_KEYS.includes(keyOrLabel)) {
      return options[keyOrLabel];
    }
    // Otherwise return as is (custom specialization)
    return keyOrLabel;
  };

  // Dynamic sidebar menu based on role
  const SIDEBAR_MENU = [
    { id: "overview", icon: "📊", label: "Overview", active: false },
    {
      id: "applications",
      icon: "📋",
      label: isCompany ? "Job Applications" : "My Applications",
      active: false,
    },
    {
      id: "favorites",
      icon: "❤️",
      label: isCompany ? "Saved Interpreters" : "Saved Jobs",
      active: true,
    },
    { id: "alerts", icon: "🔔", label: "Job Alerts", active: false },
    {
      id: "profile",
      icon: isCompany ? "🏢" : "👤",
      label: isCompany ? "Company Profile" : "Profile",
      active: false,
    },
    { id: "settings", icon: "⚙️", label: "Settings", active: false },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }

    // Fetch saved jobs OR saved interpreters based on role
    if (isCompany) {
      fetchSavedInterpreters();
    } else {
      fetchSavedJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isCompany]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch(`/api/jobs/saved/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch saved jobs");
      }

      const data = await response.json();

      // API returns: { success: true, data: { savedJobs: [...], pagination: {...} } }
      const jobsArray = data.data?.savedJobs || [];

      setSavedJobs(jobsArray);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching saved jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedInterpreters = async () => {
    try {
      setLoading(true);
      const response = await interpreterService.getSavedInterpreters(1, 100);

      // API returns: { success: true, data: { savedInterpreters: [...], pagination: {...} } }
      const interpretersArray = response.data?.savedInterpreters || [];

      setSavedInterpreters(interpretersArray);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching saved interpreters:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJob = async (jobId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/jobs/${jobId}/save`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to remove job");
      }

      // Refresh the list
      fetchSavedJobs();
    } catch (err) {
      console.error("Error removing job:", err);
      alert("Failed to remove job. Please try again.");
    }
  };

  const handleRemoveInterpreter = async (interpreterId) => {
    try {
      const response = await interpreterService.toggleSaveInterpreter(
        interpreterId
      );

      if (response.success) {
        // Refresh the list
        fetchSavedInterpreters();
      }
    } catch (err) {
      console.error("Error removing interpreter:", err);
      alert("Failed to remove interpreter. Please try again.");
    }
  };

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    if (menuId === "overview") {
      navigate(ROUTES.DASHBOARD);
    } else if (menuId === "applications") {
      navigate(ROUTES.MY_APPLICATIONS);
    } else if (menuId === "favorites") {
      navigate(ROUTES.SAVED_JOBS);
    } else if (menuId === "alerts") {
      navigate(ROUTES.JOB_ALERTS);
    } else if (menuId === "profile") {
      // Redirect to Company Profile for clients, regular Profile for interpreters
      if (isCompany) {
        navigate(ROUTES.COMPANY_PROFILE);
      } else {
        navigate(ROUTES.PROFILE);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
            <h2 className={styles.sidebarTitle}>Dashboard</h2>
          </div>
          <nav className={styles.sidebarNav}>
            {SIDEBAR_MENU.map((item) => (
              <button
                key={item.id}
                className={`${styles.menuItem} ${
                  activeMenu === item.id ? styles.menuItemActive : ""
                }`}
                onClick={() => handleMenuClick(item.id)}
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
            <h1 className={styles.greeting}>
              {isCompany ? "Saved Interpreters" : "Saved Jobs"}
            </h1>
            <p className={styles.subGreeting}>
              {isCompany
                ? "Manage your saved interpreter profiles"
                : "Manage your saved job opportunities"}
            </p>
          </header>

          {/* Error State */}
          {error && (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <p style={{ color: "red" }}>{error}</p>
              <button onClick={fetchSavedJobs}>Try Again</button>
            </div>
          )}

          {/* Empty State */}
          {!error &&
            (isCompany
              ? savedInterpreters.length === 0
              : savedJobs.length === 0) && (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <h3>
                  {isCompany
                    ? "No Saved Interpreters Yet"
                    : "No Saved Jobs Yet"}
                </h3>
                <p>
                  {isCompany
                    ? "Start saving interpreters you're interested in to view them here"
                    : "Start saving jobs you're interested in to view them here"}
                </p>
                <button
                  onClick={() =>
                    navigate(
                      isCompany ? ROUTES.FIND_INTERPRETER : ROUTES.FIND_JOB
                    )
                  }
                >
                  {isCompany ? "Browse Interpreters" : "Browse Jobs"}
                </button>
              </div>
            )}

          {/* Saved Interpreters List (for Company) */}
          {!error && isCompany && savedInterpreters.length > 0 && (
            <section className={styles.recentJobsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  All Saved Interpreters ({savedInterpreters.length})
                </h2>
              </div>

              <div className={styles.jobsList}>
                {savedInterpreters.map((interpreter) => {
                  const profile = interpreter.interpreterProfile || {};
                  const experience = Number(profile.experience) || 0;
                  const hourlyRate = Number(profile.hourlyRate) || 0;
                  const rating = Number(profile.rating) || 0;
                  const totalReviews = Number(profile.totalReviews) || 0;

                  let specializations = [];
                  try {
                    if (profile.specializations) {
                      const parsed = JSON.parse(profile.specializations);
                      // Ensure it's always an array
                      specializations = Array.isArray(parsed) ? parsed : [];
                    }
                  } catch (e) {
                    console.error("Error parsing specializations:", e);
                    specializations = [];
                  }

                  return (
                    <div key={interpreter.id} className={styles.jobCard}>
                      {/* Interpreter Info Column */}
                      <div className={styles.jobInfo}>
                        <div className={styles.jobHeader}>
                          <div className={styles.companyLogo}>
                            {interpreter.avatar ? (
                              <img
                                src={`http://localhost:4000${interpreter.avatar}`}
                                alt={interpreter.fullName}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  borderRadius: "50%",
                                }}
                              />
                            ) : (
                              interpreter.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className={styles.jobDetails}>
                            <h3 className={styles.jobTitle}>
                              {interpreter.fullName}
                            </h3>
                            <p className={styles.companyName}>
                              ⭐ {rating.toFixed(1)} ({totalReviews} reviews)
                            </p>
                            <div className={styles.jobTags}>
                              {Array.isArray(specializations) &&
                              specializations.length > 0 ? (
                                specializations.slice(0, 3).map((spec, idx) => (
                                  <span key={idx} className={styles.tag}>
                                    {getSpecializationLabel(spec)}
                                  </span>
                                ))
                              ) : (
                                <span className={styles.tag}>
                                  No specializations
                                </span>
                              )}
                            </div>
                            <div className={styles.jobMeta}>
                              <span className={styles.location}>
                                💼 {experience} years experience
                              </span>
                              <span className={styles.salary}>
                                💰 ${hourlyRate.toFixed(2)}/hr
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date Saved Column */}
                      <div className={styles.dateColumn}>
                        <span className={styles.dateLabel}>Date Saved</span>
                        <span className={styles.dateValue}>
                          {formatDate(interpreter.savedAt)}
                        </span>
                      </div>

                      {/* Status Column */}
                      <div className={styles.statusColumn}>
                        <span className={styles.statusLabel}>Status</span>
                        <div
                          className={`${styles.statusBadge} ${styles.statusActive}`}
                        >
                          <span className={styles.statusIcon}>●</span>
                          <span className={styles.statusText}>Saved</span>
                        </div>
                      </div>

                      {/* Action Column */}
                      <div className={styles.actionColumn}>
                        <button
                          className={styles.viewDetailsBtn}
                          onClick={() =>
                            navigate(
                              `${ROUTES.FIND_INTERPRETER}?interpreterId=${interpreter.id}`
                            )
                          }
                        >
                          View Profile
                        </button>
                        <button
                          className={styles.viewDetailsBtn}
                          style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                          }}
                          onClick={() =>
                            handleRemoveInterpreter(interpreter.id)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Saved Jobs List (for Interpreter) */}
          {!error && !isCompany && savedJobs.length > 0 && (
            <section className={styles.recentJobsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  {isCompany
                    ? `All Saved Interpreters (${savedJobs.length})`
                    : `All Saved Jobs (${savedJobs.length})`}
                </h2>
              </div>

              <div className={styles.jobsList}>
                {savedJobs.map((savedJob) => {
                  const job = savedJob.job;
                  if (!job) return null; // Skip if job is null/undefined

                  // Extract data from associations
                  const companyName =
                    job.organization?.name || "Unknown Company";
                  const companyLogo = job.organization?.logo;
                  const workingMode = job.workingMode?.name || "N/A";
                  const location = job.province || job.address || "Unknown";
                  const salary =
                    job.minSalary && job.maxSalary
                      ? `$${job.minSalary} - $${job.maxSalary}`
                      : job.salaryType === "NEGOTIABLE"
                      ? "Negotiable"
                      : "N/A";
                  const domains = job.domains || [];

                  return (
                    <div key={savedJob.id} className={styles.jobCard}>
                      {/* Job Info Column */}
                      <div className={styles.jobInfo}>
                        <div className={styles.jobHeader}>
                          <div className={styles.companyLogo}>
                            {companyLogo ? (
                              <img src={companyLogo} alt={companyName} />
                            ) : (
                              companyName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className={styles.jobDetails}>
                            <h3 className={styles.jobTitle}>{job.title}</h3>
                            <p className={styles.companyName}>{companyName}</p>
                            <div className={styles.jobTags}>
                              <span className={styles.tag}>{workingMode}</span>
                              {domains.slice(0, 2).map((domain, idx) => (
                                <span key={idx} className={styles.tag}>
                                  {domain.name}
                                </span>
                              ))}
                            </div>
                            <div className={styles.jobMeta}>
                              <span className={styles.location}>
                                📍 {location}
                              </span>
                              <span className={styles.salary}>💰 {salary}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date Saved Column */}
                      <div className={styles.dateColumn}>
                        <span className={styles.dateLabel}>Date Saved</span>
                        <span className={styles.dateValue}>
                          {formatDate(savedJob.savedDate || savedJob.createdAt)}
                        </span>
                      </div>

                      {/* Status Column */}
                      <div className={styles.statusColumn}>
                        <span className={styles.statusLabel}>Status</span>
                        <div
                          className={`${styles.statusBadge} ${styles.statusActive}`}
                        >
                          <span className={styles.statusIcon}>●</span>
                          <span className={styles.statusText}>Saved</span>
                        </div>
                      </div>

                      {/* Action Column */}
                      <div className={styles.actionColumn}>
                        <button
                          className={styles.viewDetailsBtn}
                          onClick={() =>
                            navigate(`${ROUTES.FIND_JOB}?jobId=${job.id}`)
                          }
                        >
                          View Details
                        </button>
                        <button
                          className={styles.viewDetailsBtn}
                          style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                          }}
                          onClick={() => handleRemoveJob(job.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>
    </MainLayout>
  );
}

export default SavedJobsPage;
