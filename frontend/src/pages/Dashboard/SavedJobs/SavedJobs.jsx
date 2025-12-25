import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBookmark,
  FaMapMarkerAlt,
  FaBriefcase,
  FaDollarSign,
  FaClock,
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
import { useSubscription } from "../../../hooks/useSubscription";
import { ROUTES } from "../../../constants";
import savedJobService from "../../../services/savedJobService";
import interpreterService from "../../../services/interpreterService.js";
import aiMatchingService from "../../../services/aiMatchingService.js";
import toastService from "../../../services/toastService";
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
  const { hasActiveSubscription } = useSubscription();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeMenu, setActiveMenu] = useState("savedJobs");
  const [viewMode, setViewMode] = useState("all"); // "all" | "ai"
  const [aiRankedJobs, setAiRankedJobs] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [hasFetchedAI, setHasFetchedAI] = useState(false);

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
        // Update savedJobs
        setSavedJobs((prev) => prev.filter((job) => {
          const jobIdToCheck = job.id || job.job?.id;
          return jobIdToCheck !== jobId;
        }));
        // Also remove from AI ranked jobs if present
        setAiRankedJobs((prev) => prev.filter(({ job }) => {
          const jobData = job.job || job;
          return jobData.id !== jobId;
        }));
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

  // Fetch AI ranked jobs - only 10 newest saved jobs
  const fetchAIRankedJobs = useCallback(async () => {
    if (!user?.id || user?.role !== "interpreter") {
      console.log("Cannot fetch AI: user not interpreter or no user id");
      return;
    }

    // Check subscription requirement
    if (!hasActiveSubscription) {
      console.log("Cannot fetch AI: subscription required");
      toastService.error("Vui lòng đăng ký gói để sử dụng tính năng AI");
      setViewMode("all");
      navigate(ROUTES.PRICING);
      return;
    }
    
    console.log("Fetching AI ranked jobs, savedJobs count:", savedJobs.length);
    setLoadingAI(true);
    try {
      // Extract job data first
      const allJobs = savedJobs.map((savedJob) => {
        const jobData = savedJob.job || savedJob;
        return jobData;
      }).filter((job) => job && job.id);

      if (allJobs.length === 0) {
        console.log("No saved jobs found");
        setAiRankedJobs([]);
        setHasFetchedAI(true);
        setLoadingAI(false);
        return;
      }

      // Sort jobs by newest first (createdAt or createdDate of the job)
      const sortedJobs = [...allJobs].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.createdDate || 0);
        const dateB = new Date(b.createdAt || b.createdDate || 0);
        return dateB - dateA; // Newest first
      });

      // Take top 10 newest jobs only
      const jobs = sortedJobs.slice(0, 10);
      console.log("Newest 10 jobs:", jobs.length);
      
      console.log("Extracted jobs:", jobs.length, jobs);

      if (jobs.length === 0) {
        console.log("No valid jobs extracted");
        setAiRankedJobs([]);
        setHasFetchedAI(true);
        setLoadingAI(false);
        return;
      }

      const interpreterRes = await interpreterService.getInterpreterById(user.id);
      const interpreter = interpreterRes?.data || interpreterRes;
      
      if (!interpreter) {
        throw new Error("Interpreter not found");
      }

      const profileId = interpreter?.interpreterProfile?.id || interpreter?.profile?.id || user.id;
      const jobIds = jobs.map((job) => job.id);
      
      console.log("Calling AI service with jobIds:", jobIds, "profileId:", profileId);
      const batchRes = await aiMatchingService.batchScoreSuitability(jobIds, profileId);
      console.log("AI service response:", batchRes);
      
      if (batchRes.success && batchRes.data?.job_scores) {
        const scoreMap = new Map();
        batchRes.data.job_scores.forEach((item) => {
          scoreMap.set(item.job_id, item.suitability_score);
        });
        
        const matches = jobs
          .map((job) => ({
            job,
            suitability_score: scoreMap.get(job.id),
          }))
          .filter((match) => match.suitability_score) // Only include jobs with scores
          .sort((a, b) => {
            // Sort by score from high to low
              return b.suitability_score.overall_score - a.suitability_score.overall_score;
          });
        
        console.log("AI ranked matches:", matches.length);
        setAiRankedJobs(matches);
      } else {
        // If AI fails, still show jobs without scores
        console.log("AI service failed or no scores, showing jobs without scores");
        setAiRankedJobs(jobs.map((job) => ({ job, suitability_score: null })));
      }
      setHasFetchedAI(true);
    } catch (err) {
      console.error("Error fetching AI ranked jobs:", err);
      // On error, still try to show jobs without scores
      try {
        const sortedByDate = [...savedJobs].sort((a, b) => {
          const dateA = new Date(a.saved_at || a.savedDate || a.createdAt || 0);
          const dateB = new Date(b.saved_at || b.savedDate || b.createdAt || 0);
          return dateB - dateA;
        });
        const newest10Jobs = sortedByDate.slice(0, 10);
        const jobs = newest10Jobs.map((savedJob) => {
          const jobData = savedJob.job || savedJob;
          return jobData;
        }).filter((job) => job && job.id);
        setAiRankedJobs(jobs.map((job) => ({ job, suitability_score: null })));
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
        setAiRankedJobs([]);
      }
    } finally {
      setLoadingAI(false);
    }
  }, [user?.id, user?.role, savedJobs, hasActiveSubscription, navigate]);

  // Fetch AI ranked jobs when viewMode changes to ai - only fetch if not already fetched
  useEffect(() => {
    if (user?.role === "interpreter" && viewMode === "ai" && savedJobs.length > 0 && !hasFetchedAI) {
      fetchAIRankedJobs();
    }
  }, [viewMode, user?.role, savedJobs.length, hasFetchedAI, fetchAIRankedJobs]);

  // Memoize filtered and sorted jobs - must be called before any early returns
  const filteredJobs = useMemo(() => {
    let filtered = [...savedJobs];
    console.log("Filtering jobs - savedJobs count:", savedJobs.length, "filterStatus:", filterStatus);

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((savedJob) => {
        // Extract job data
        const job = savedJob.job || savedJob;
        const jobStatus = job.status || savedJob.status || job.statusOpenStop || savedJob.statusOpenStop;
        
        console.log("Checking job:", job.id || savedJob.id, "status:", jobStatus, "filterStatus:", filterStatus);
        
        if (filterStatus === "active") {
          const matches = jobStatus === "open" || jobStatus === "active";
          console.log("Active filter - matches:", matches);
          return matches;
        } else if (filterStatus === "closed") {
          const matches = jobStatus === "closed" || jobStatus === "inactive";
          console.log("Closed filter - matches:", matches);
          return matches;
        }
        return true;
      });
      console.log("After status filter:", filtered.length);
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
        // Extract job data for salary comparison
        const jobA = a.job || a;
        const jobB = b.job || b;
        
        // Try multiple possible salary fields
        const salaryA = parseInt(
          (jobA.pay_rate || jobA.salary || jobA.maxSalary || a.pay_rate || a.salary || a.maxSalary || "0")
            .toString()
            .replace(/[^0-9]/g, "") || "0"
        );
        const salaryB = parseInt(
          (jobB.pay_rate || jobB.salary || jobB.maxSalary || b.pay_rate || b.salary || b.maxSalary || "0")
            .toString()
            .replace(/[^0-9]/g, "") || "0"
        );
        return salaryB - salaryA;
      });
    }

    console.log("Final filtered jobs count:", filtered.length);
    return filtered;
  }, [savedJobs, filterStatus, sortBy]);

  // Memoize filtered and sorted AI ranked jobs
  const filteredAiRankedJobs = useMemo(() => {
    let filtered = [...aiRankedJobs];
    console.log("Filtering AI ranked jobs - aiRankedJobs count:", aiRankedJobs.length, "filterStatus:", filterStatus);

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(({ job }) => {
        // Extract job data - handle both nested and flat structures
        const jobData = job.job || job;
        // Check multiple possible status fields (same as filteredJobs)
        const jobStatus = jobData.status || job.status || jobData.statusOpenStop || job.statusOpenStop;
        
        console.log("Checking AI job:", jobData.id, "status:", jobStatus, "filterStatus:", filterStatus);
        
        if (filterStatus === "active") {
          const matches = jobStatus === "open" || jobStatus === "active";
          console.log("Active filter - matches:", matches);
          return matches;
        } else if (filterStatus === "closed") {
          const matches = jobStatus === "closed" || jobStatus === "inactive" || jobStatus === "stop";
          console.log("Closed filter - matches:", matches);
          return matches;
        }
        return true;
      });
      console.log("After status filter (AI):", filtered.length);
    }

    // Apply sorting
    if (sortBy === "newest") {
      filtered.sort((a, b) => {
        const jobA = a.job.job || a.job;
        const jobB = b.job.job || b.job;
        // Find original savedJob for date
        const savedJobA = savedJobs.find((sj) => {
          const sjJob = sj.job || sj;
          return (sjJob.id || sj.id) === (jobA.id || a.job.id);
        });
        const savedJobB = savedJobs.find((sj) => {
          const sjJob = sj.job || sj;
          return (sjJob.id || sj.id) === (jobB.id || b.job.id);
        });
        const dateA = new Date(savedJobA?.saved_at || savedJobA?.savedDate || savedJobA?.createdAt || jobA.createdAt || 0);
        const dateB = new Date(savedJobB?.saved_at || savedJobB?.savedDate || savedJobB?.createdAt || jobB.createdAt || 0);
        return dateB - dateA;
      });
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => {
        const jobA = a.job.job || a.job;
        const jobB = b.job.job || b.job;
        const savedJobA = savedJobs.find((sj) => {
          const sjJob = sj.job || sj;
          return (sjJob.id || sj.id) === (jobA.id || a.job.id);
        });
        const savedJobB = savedJobs.find((sj) => {
          const sjJob = sj.job || sj;
          return (sjJob.id || sj.id) === (jobB.id || b.job.id);
        });
        const dateA = new Date(savedJobA?.saved_at || savedJobA?.savedDate || savedJobA?.createdAt || jobA.createdAt || 0);
        const dateB = new Date(savedJobB?.saved_at || savedJobB?.savedDate || savedJobB?.createdAt || jobB.createdAt || 0);
        return dateA - dateB;
      });
    } else if (sortBy === "salary_high") {
      filtered.sort((a, b) => {
        const jobA = a.job.job || a.job;
        const jobB = b.job.job || b.job;
        
        const salaryA = parseInt(
          (jobA.pay_rate || jobA.salary || jobA.maxSalary || "0")
            .toString()
            .replace(/[^0-9]/g, "") || "0"
        );
        const salaryB = parseInt(
          (jobB.pay_rate || jobB.salary || jobB.maxSalary || "0")
            .toString()
            .replace(/[^0-9]/g, "") || "0"
        );
        return salaryB - salaryA;
      });
    }

    console.log("Final filtered AI ranked jobs count:", filtered.length);
    return filtered;
  }, [aiRankedJobs, filterStatus, sortBy, savedJobs]);

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

          {/* Controls and View Mode Toggle - Combined for compact layout */}
          <section className={styles.controlsSection}>
            <div className={styles.controlsWrapper}>
              {/* View Mode Toggle - Only for interpreter */}
              {user?.role === "interpreter" && savedJobs.length > 0 && (
                <div className={styles.viewModeToggle}>
                  <button
                    className={`${styles.viewModeButton} ${
                      viewMode === "all" ? styles.active : ""
                    }`}
                    onClick={() => setViewMode("all")}
                  >
                    {t("savedJobs.viewMode.all") || "All"}
                  </button>
                  <button
                    className={`${styles.viewModeButton} ${
                      viewMode === "ai" ? styles.active : ""
                    } ${!hasActiveSubscription ? styles.disabled : ""}`}
                    onClick={() => {
                      // Check subscription requirement
                      if (!hasActiveSubscription) {
                        toastService.error("Vui lòng đăng ký gói để sử dụng tính năng AI");
                        navigate(ROUTES.PRICING);
                        return;
                      }
                      setViewMode("ai");
                    }}
                    disabled={!hasActiveSubscription}
                    title={!hasActiveSubscription ? "Đăng ký gói để sử dụng tính năng AI" : ""}
                  >
                    {t("savedJobs.viewMode.ai") || "AI Ranked"}
                  </button>
                </div>
              )}

              {/* Filters */}
              <div className={styles.controls}>
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
          </section>

          {/* Content */}
          <div className={styles.contentContainer}>
            {/* AI Ranked Jobs - Only for interpreter when viewMode is ai */}
            {user?.role === "interpreter" && viewMode === "ai" ? (
              loadingAI ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>{t("savedJobs.ai.loading") || "AI is analyzing your saved jobs..."}</p>
                </div>
              ) : filteredAiRankedJobs.length > 0 ? (
                <div className={styles.jobsGrid}>
                  {filteredAiRankedJobs.map(({ job, suitability_score }) => {
                    // Extract job data - handle both nested and flat structures
                    const jobData = job.job || job;
                    const jobId = jobData.id || job.id;
                    
                    // Find original savedJob to get saved_at date
                    const originalSavedJob = savedJobs.find((sj) => {
                      const sjJob = sj.job || sj;
                      return (sjJob.id || sj.id) === jobId;
                    });
                    
                    return (
                      <div
                        key={jobId}
                        className={styles.jobCard}
                        onClick={() => handleJobClick(jobId)}
                      >
                        {/* Card Header */}
                        <div className={styles.cardHeader}>
                          <div className={styles.companyLogo}>
                            <FaBriefcase />
                          </div>
                          <div className={styles.cardHeaderRight}>
                            {suitability_score && (
                              <div className={styles.scoreBadge}>
                                {Math.round(suitability_score.overall_score)}%
                              </div>
                            )}
                            <button
                              className={styles.unsaveButton}
                              onClick={(e) => handleUnsaveJob(jobId, e)}
                              title={t("savedJobs.unsave") || "Remove from saved"}
                            >
                              <FaBookmark />
                            </button>
                          </div>
                        </div>

                        {/* Job Info */}
                        <div className={styles.jobInfo}>
                          <h3 className={styles.jobTitle}>{jobData.title}</h3>
                          <p className={styles.companyName}>
                            {jobData.company_name || jobData.organization?.name}
                          </p>
                        </div>

                        {/* Job Details */}
                        <div className={styles.jobDetails}>
                          {(jobData.location || jobData.province || jobData.address) && (
                            <div className={styles.detailItem}>
                              <FaMapMarkerAlt className={styles.detailIcon} />
                              <span>{jobData.location || jobData.province || jobData.address}</span>
                            </div>
                          )}
                          {(jobData.pay_rate || (jobData.minSalary && jobData.maxSalary)) && (
                            <div className={styles.detailItem}>
                              <FaDollarSign className={styles.detailIcon} />
                              <span>
                                {jobData.pay_rate || 
                                 (jobData.minSalary && jobData.maxSalary 
                                   ? `$${jobData.minSalary}-${jobData.maxSalary}`
                                   : jobData.minSalary 
                                   ? `$${jobData.minSalary}+`
                                   : "Negotiable")}
                              </span>
                            </div>
                          )}
                          {(jobData.job_type || jobData.workingMode?.name) && (
                            <div className={styles.detailItem}>
                              <FaClock className={styles.detailIcon} />
                              <span>{jobData.job_type || jobData.workingMode?.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Languages */}
                        {(jobData.languages || jobData.requiredLanguages) && (jobData.languages?.length > 0 || jobData.requiredLanguages?.length > 0) && (
                          <div className={styles.languageTags}>
                            {(jobData.languages || jobData.requiredLanguages).slice(0, 3).map((lang, index) => (
                              <span key={index} className={styles.languageTag}>
                                {lang.name || lang.language?.name || lang}
                              </span>
                            ))}
                            {(jobData.languages || jobData.requiredLanguages).length > 3 && (
                              <span className={styles.languageTag}>
                                +{(jobData.languages || jobData.requiredLanguages).length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Card Footer */}
                        <div className={styles.cardFooter}>
                          <span className={styles.savedDate}>
                            {t("savedJobs.savedOn") || "Saved"}{" "}
                            {new Date(
                              originalSavedJob?.saved_at || 
                              originalSavedJob?.savedDate || 
                              originalSavedJob?.createdAt || 
                              jobData.saved_at || 
                              jobData.createdAt
                            ).toLocaleDateString()}
                          </span>
                          <button
                            className={styles.viewButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJobClick(jobId);
                            }}
                          >
                            <FaEye />
                            {t("savedJobs.viewDetails") || "View Details"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <FaRegBookmark />
                  </div>
                  <h2 className={styles.emptyTitle}>
                    {filterStatus !== "all" 
                      ? t("savedJobs.empty.filteredNoJobs") || "No jobs match your filter"
                      : t("savedJobs.ai.noJobs") || "No AI ranked jobs found"}
                  </h2>
                  <p className={styles.emptyDescription}>
                    {filterStatus !== "all"
                      ? t("savedJobs.empty.filteredNoJobsDesc") || "Try changing your filter settings"
                      : t("savedJobs.ai.noJobsDesc") || "Try saving more jobs to get AI recommendations"}
                  </p>
                </div>
              )
            ) : filteredJobs.length === 0 ? (
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
                {filteredJobs.map((savedJob) => {
                  // Extract job data - handle both nested and flat structures
                  const job = savedJob.job || savedJob;
                  const jobId = job.id || savedJob.id;
                  
                  return (
                  <div
                    key={jobId}
                    className={styles.jobCard}
                    onClick={() => handleJobClick(jobId)}
                  >
                    {/* Card Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.companyLogo}>
                        <FaBriefcase />
                      </div>
                      <button
                        className={styles.unsaveButton}
                        onClick={(e) => handleUnsaveJob(jobId, e)}
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
                      {(job.location || job.province || job.address) && (
                        <div className={styles.detailItem}>
                          <FaMapMarkerAlt className={styles.detailIcon} />
                          <span>{job.location || job.province || job.address}</span>
                        </div>
                      )}
                      {(job.pay_rate || (job.minSalary && job.maxSalary)) && (
                        <div className={styles.detailItem}>
                          <FaDollarSign className={styles.detailIcon} />
                          <span>
                            {job.pay_rate || 
                             (job.minSalary && job.maxSalary 
                               ? `$${job.minSalary}-${job.maxSalary}`
                               : job.minSalary 
                               ? `$${job.minSalary}+`
                               : "Negotiable")}
                          </span>
                        </div>
                      )}
                      {(job.job_type || job.workingMode?.name) && (
                        <div className={styles.detailItem}>
                          <FaClock className={styles.detailIcon} />
                          <span>{job.job_type || job.workingMode?.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Languages */}
                    {(job.languages || job.requiredLanguages) && (job.languages?.length > 0 || job.requiredLanguages?.length > 0) && (
                      <div className={styles.languageTags}>
                        {(job.languages || job.requiredLanguages).slice(0, 3).map((lang, index) => (
                          <span key={index} className={styles.languageTag}>
                            {lang.name || lang.language?.name || lang}
                          </span>
                        ))}
                        {(job.languages || job.requiredLanguages).length > 3 && (
                          <span className={styles.languageTag}>
                            +{(job.languages || job.requiredLanguages).length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className={styles.cardFooter}>
                      <span className={styles.savedDate}>
                        {t("savedJobs.savedOn") || "Saved"}{" "}
                        {new Date(savedJob.saved_at || savedJob.savedDate || savedJob.createdAt || job.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        className={styles.viewButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJobClick(jobId);
                        }}
                      >
                        <FaEye />
                        {t("savedJobs.viewDetails") || "View Details"}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export default SavedJobs;
