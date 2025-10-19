import React, { useState, useEffect } from "react";
import styles from "./DashboardPage.module.css";
import { MainLayout } from "../../layouts";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";

const SIDEBAR_MENU = [
  { id: "overview", icon: "📊", label: "Overview", active: false },
  { id: "applications", icon: "📋", label: "My Applications", active: false },
  { id: "favorites", icon: "❤️", label: "Saved Jobs", active: true },
  { id: "alerts", icon: "🔔", label: "Job Alerts", active: false },
  { id: "profile", icon: "👤", label: "Profile", active: false },
  { id: "settings", icon: "⚙️", label: "Settings", active: false },
];

function SavedJobsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState("favorites");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    fetchSavedJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
      navigate(ROUTES.PROFILE);
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
            <h1 className={styles.greeting}>Saved Jobs</h1>
            <p className={styles.subGreeting}>
              Manage your saved job opportunities
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
          {!error && savedJobs.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <h3>No Saved Jobs Yet</h3>
              <p>Start saving jobs you're interested in to view them here</p>
              <button onClick={() => navigate(ROUTES.FIND_JOB)}>
                Browse Jobs
              </button>
            </div>
          )}

          {/* Jobs List */}
          {!error && savedJobs.length > 0 && (
            <section className={styles.recentJobsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  All Saved Jobs ({savedJobs.length})
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
                            navigate(`${ROUTES.FIND_JOB}/${job.id}`)
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
