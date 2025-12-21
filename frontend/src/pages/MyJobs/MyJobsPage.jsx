import React, { useState, useEffect } from "react";
import styles from "./MyJobsPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import jobService from "../../services/jobService.js";
import {
  FaChartBar,
  FaClipboardList,
  FaBriefcase,
  FaUser,
  FaCog,
  FaBuilding,
  FaMapMarkerAlt,
  FaDollarSign,
  FaCalendar,
  FaEye,
  FaEdit,
  FaEnvelope,
  FaBookmark,
  FaTimes,
} from "react-icons/fa";

// Sidebar menu for Client/Company role
const CLIENT_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  { id: "myJobs", icon: FaBriefcase, labelKey: "myJobs", active: true },
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

function MyJobsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeMenu, setActiveMenu] = useState("myJobs");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedReviewStatus, setSelectedReviewStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [jobToClose, setJobToClose] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  // Redirect if not client
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "client")) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  // Fetch jobs from API
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "client" || authLoading) return;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        const filters = {
          page: pagination.page,
          limit: pagination.limit,
        };

        if (selectedStatus !== "all") {
          filters.status = selectedStatus;
        }

        if (selectedReviewStatus !== "all") {
          filters.reviewStatus = selectedReviewStatus;
        }

        const response = await jobService.getMyJobs(filters);

        const jobsData = Array.isArray(response.data)
          ? response.data
          : response.data?.jobs || [];

        if (response && response.success !== false) {
          const transformedJobs = jobsData.map((job) => ({
            id: job.id,
            title: job.title || "Untitled Job",
            organization: job.organization?.name || "Organization",
            logo: job.organization?.logo || FaBuilding,
            workingMode: job.workingMode?.name || "Full-time",
            location: job.province || job.address || "Location TBD",
            salary:
              job.minSalary && job.maxSalary
                ? `$${job.minSalary}-${job.maxSalary}`
                : job.minSalary
                ? `$${job.minSalary}+`
                : "Negotiable",
            createdAt:
              job.createdDate || job.createdAt || new Date().toISOString(),
            status: job.statusOpenStop || "open",
            reviewStatus: job.reviewStatus || "pending",
            expirationDate: job.expirationDate || null,
            description: job.descriptions || "",
            quantity: job.quantity || 1,
          }));

          setJobs(transformedJobs);

          if (response.pagination) {
            setPagination({
              page: response.pagination.page || pagination.page,
              limit: response.pagination.limit || pagination.limit,
              total: response.pagination.total || 0,
              totalPages: response.pagination.totalPages || 1,
            });
          }
        } else {
          setJobs([]);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [
    isAuthenticated,
    user,
    authLoading,
    pagination.page,
    pagination.limit,
    selectedStatus,
    selectedReviewStatus,
  ]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return styles.statusOpen;
      case "closed":
        return styles.statusClosed;
      case "expired":
        return styles.statusExpired;
      default:
        return styles.statusDefault;
    }
  };

  const getReviewStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return styles.reviewApproved;
      case "rejected":
        return styles.reviewRejected;
      case "pending":
        return styles.reviewPending;
      default:
        return styles.reviewPending;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return t("myJobs.status.open") || "Open";
      case "closed":
        return t("myJobs.status.closed") || "Closed";
      case "expired":
        return t("myJobs.status.expired") || "Expired";
      default:
        return status || "Unknown";
    }
  };

  const getReviewStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return t("myJobs.reviewStatus.approved") || "Approved";
      case "rejected":
        return t("myJobs.reviewStatus.rejected") || "Rejected";
      case "pending":
        return t("myJobs.reviewStatus.pending") || "Pending Review";
      default:
        return t("myJobs.reviewStatus.pending") || "Pending Review";
    }
  };

  const filteredJobs = jobs.sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const handleViewJob = (jobId) => {
    navigate(`/job/${jobId}`);
  };

  const handleEditJob = (jobId) => {
    // Navigate to edit job page or show edit modal
    navigate(`${ROUTES.POST_JOB}?edit=${jobId}`);
  };

  const handleCloseJob = (jobId, jobTitle) => {
    setJobToClose({ id: jobId, title: jobTitle });
    setShowCloseModal(true);
  };

  const confirmCloseJob = async () => {
    if (!jobToClose) return;

    try {
      setShowCloseModal(false);
      await jobService.closeJob(jobToClose.id);

      // Refresh jobs list
      const filters = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (selectedStatus !== "all") {
        filters.status = selectedStatus;
      }

      if (selectedReviewStatus !== "all") {
        filters.reviewStatus = selectedReviewStatus;
      }

      const response = await jobService.getMyJobs(filters);
      const jobsData = Array.isArray(response.data)
        ? response.data
        : response.data?.jobs || [];

      if (response && response.success !== false) {
        const transformedJobs = jobsData.map((job) => ({
          id: job.id,
          title: job.title || "Untitled Job",
          organization: job.organization?.name || "Organization",
          logo: job.organization?.logo || FaBuilding,
          workingMode: job.workingMode?.name || "Full-time",
          location: job.province || job.address || "Location TBD",
          salary:
            job.minSalary && job.maxSalary
              ? `$${job.minSalary}-${job.maxSalary}`
              : job.minSalary
              ? `$${job.minSalary}+`
              : "Negotiable",
          createdAt:
            job.createdDate || job.createdAt || new Date().toISOString(),
          status: job.statusOpenStop || "open",
          reviewStatus: job.reviewStatus || "pending",
          expirationDate: job.expirationDate || null,
          description: job.descriptions || "",
          quantity: job.quantity || 1,
        }));

        setJobs(transformedJobs);
      }
      setJobToClose(null);
    } catch (error) {
      console.error("Error closing job:", error);
      alert(error.message || "Failed to close job");
      setJobToClose(null);
    }
  };

  return (
    <MainLayout>
      <div className={styles.dashboardRoot}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>{t("dashboard.pageTitle")}</h2>
          </div>
          <nav className={styles.sidebarNav}>
            {CLIENT_SIDEBAR_MENU.map((item) => {
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
                    } else if (item.id === "myJobs") {
                      // Stay on current page
                    } else if (item.id === "jobApplications") {
                      navigate(ROUTES.MY_APPLICATIONS);
                    } else if (item.id === "savedInterpreters") {
                      navigate(ROUTES.SAVED_INTERPRETERS);
                    } else if (item.id === "notifications") {
                      navigate(ROUTES.DASHBOARD + "?section=notifications");
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
              {t("dashboard.navigation.myJobs") || "My Jobs"}
            </h1>
            <p className={styles.pageSubtitle}>
              {t("myJobs.subtitle") || "Manage your posted jobs"}
            </p>
          </header>

          {/* Controls */}
          <section className={styles.controlsSection}>
            <div className={styles.controls}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={styles.filterSelect}
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Review Status:</label>
                <select
                  value={selectedReviewStatus}
                  onChange={(e) => {
                    setSelectedReviewStatus(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={styles.filterSelect}
                >
                  <option value="all">All Reviews</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Sort By:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>
          </section>

          {/* Jobs List */}
          <section className={styles.jobsSection}>
            {loading ? (
              <div className={styles.loadingState}>
                <p>{t("common.loading") || "Loading..."}</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>💼</span>
                <h3>No Jobs Posted</h3>
                <p>
                  You haven't posted any jobs yet. Start by posting your first
                  job!
                </p>
              </div>
            ) : (
              <>
                <div className={styles.jobsGrid}>
                  {filteredJobs.map((job) => (
                    <div key={job.id} className={styles.jobCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.jobTitleRow}>
                          <h3 className={styles.jobTitle}>{job.title}</h3>
                          <div className={styles.statusBadges}>
                            <span
                              className={`${
                                styles.statusBadge
                              } ${getStatusClass(job.status)}`}
                            >
                              {getStatusText(job.status)}
                            </span>
                            <span
                              className={`${
                                styles.reviewBadge
                              } ${getReviewStatusClass(job.reviewStatus)}`}
                            >
                              {getReviewStatusText(job.reviewStatus)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.cardContent}>
                        <div className={styles.jobDetails}>
                          <span className={styles.jobDetail}>
                            <FaBuilding /> {job.organization}
                          </span>
                          <span className={styles.jobDetail}>
                            <FaMapMarkerAlt /> {job.location}
                          </span>
                          <span className={styles.jobDetail}>
                            {job.workingMode}
                          </span>
                          <span className={styles.jobDetail}>
                            <FaDollarSign /> {job.salary}
                          </span>
                        </div>
                        {job.description && (
                          <p className={styles.jobDescription}>
                            {job.description.substring(0, 150)}
                            {job.description.length > 150 ? "..." : ""}
                          </p>
                        )}
                        <div className={styles.jobMeta}>
                          <span className={styles.metaItem}>
                            <FaCalendar /> {t("myJobs.posted") || "Posted"}:{" "}
                            {formatDate(job.createdAt)}
                          </span>
                          {job.expirationDate && (
                            <span className={styles.metaItem}>
                              <FaCalendar /> {t("myJobs.expires") || "Expires"}:{" "}
                              {formatDate(job.expirationDate)}
                            </span>
                          )}
                          <span className={styles.metaItem}>
                            {t("myJobs.quantity") || "Quantity"}: {job.quantity}
                          </span>
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          className={styles.viewBtn}
                          onClick={() => handleViewJob(job.id)}
                        >
                          <FaEye /> {t("myJobs.buttons.view") || "View"}
                        </button>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleEditJob(job.id)}
                        >
                          <FaEdit /> {t("myJobs.buttons.edit") || "Edit"}
                        </button>
                        {job.status === "open" && (
                          <button
                            className={styles.closeBtn}
                            onClick={() => handleCloseJob(job.id, job.title)}
                          >
                            <FaTimes /> {t("myJobs.buttons.close") || "Close"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.paginationBtn}
                      disabled={pagination.page === 1}
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                    >
                      Previous
                    </button>
                    <span className={styles.paginationInfo}>
                      Page {pagination.page} of {pagination.totalPages} (
                      {pagination.total} total)
                    </span>
                    <button
                      className={styles.paginationBtn}
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        {/* Close Job Confirmation Modal */}
        {showCloseModal && jobToClose && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowCloseModal(false)}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>
                  {t("myJobs.closeModal.title") || "Xác nhận đóng công việc"}
                </h3>
              </div>
              <div className={styles.modalBody}>
                <p>
                  {t("myJobs.closeModal.message") ||
                    "Bạn có chắc chắn muốn đóng công việc"}{" "}
                  <strong>"{jobToClose.title}"</strong>?
                </p>
                <p className={styles.modalWarning}>
                  {t("myJobs.closeModal.warning") ||
                    "Sau khi đóng, công việc sẽ không còn nhận đơn ứng tuyển mới."}
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.modalCancelBtn}
                  onClick={() => {
                    setShowCloseModal(false);
                    setJobToClose(null);
                  }}
                >
                  {t("common.cancel") || "Hủy"}
                </button>
                <button
                  className={styles.modalConfirmBtn}
                  onClick={confirmCloseJob}
                >
                  {t("myJobs.closeModal.confirm") || "Đóng công việc"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default MyJobsPage;
