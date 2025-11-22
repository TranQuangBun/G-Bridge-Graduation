import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import jobService from "../../services/jobService";
import { ROUTES } from "../../constants";
import styles from "./AdminJobModerationPage.module.css";

const AdminJobModerationPage = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending, approved, rejected, all
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filter !== "all" && { reviewStatus: filter }),
      };
      const response = await jobService.getJobs(params);
      if (response.success && response.data?.jobs) {
        setJobs(response.data.jobs);
        setPagination((prev) => response.data.pagination || prev);
      }
    } catch (error) {
      console.error("Error fetching jobs for moderation:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.page, pagination.limit]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchJobs();
    }
  }, [filter, pagination.page, isAuthenticated, user, fetchJobs]);

  const handleApprove = async (jobId) => {
    setProcessing(jobId);
    try {
      await jobService.approveJob(jobId, reviewNotes);
      await fetchJobs();
      setShowModal(false);
      setSelectedJob(null);
      setReviewNotes("");
    } catch (error) {
      console.error("Error approving job:", error);
      alert(error.message || "Failed to approve job");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (jobId) => {
    if (!reviewNotes.trim()) {
      alert(t("adminModeration.reviewNotesRequired") || "Review notes are required for rejection");
      return;
    }
    setProcessing(jobId);
    try {
      await jobService.rejectJob(jobId, reviewNotes);
      await fetchJobs();
      setShowModal(false);
      setSelectedJob(null);
      setReviewNotes("");
    } catch (error) {
      console.error("Error rejecting job:", error);
      alert(error.message || "Failed to reject job");
    } finally {
      setProcessing(null);
    }
  };

  const openModal = (job) => {
    setSelectedJob(job);
    setReviewNotes(job.reviewNotes || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedJob(null);
    setReviewNotes("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getReviewStatusBadge = (status) => {
    const statusMap = {
      pending: { label: t("adminModeration.status.pending") || "Pending", className: styles.statusPending },
      approved: { label: t("adminModeration.status.approved") || "Approved", className: styles.statusApproved },
      rejected: { label: t("adminModeration.status.rejected") || "Rejected", className: styles.statusRejected },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span className={`${styles.statusBadge} ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className={styles.loading}>{t("common.loading")}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.moderationPage}>
        <header className={styles.pageHeader}>
          <h1>{t("adminModeration.title") || "Job Moderation"}</h1>
          <p className={styles.subtitle}>
            {t("adminModeration.subtitle") || "Review and approve or reject job postings"}
          </p>
        </header>

        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === "pending" ? styles.active : ""}`}
            onClick={() => {
              setFilter("pending");
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            {t("adminModeration.filters.pending") || "Pending"} (
            {jobs.filter((j) => j.reviewStatus === "pending").length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "approved" ? styles.active : ""}`}
            onClick={() => {
              setFilter("approved");
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            {t("adminModeration.filters.approved") || "Approved"} (
            {jobs.filter((j) => j.reviewStatus === "approved").length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "rejected" ? styles.active : ""}`}
            onClick={() => {
              setFilter("rejected");
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            {t("adminModeration.filters.rejected") || "Rejected"} (
            {jobs.filter((j) => j.reviewStatus === "rejected").length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
            onClick={() => {
              setFilter("all");
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            {t("adminModeration.filters.all") || "All"}
          </button>
        </div>

        <div className={styles.jobsList}>
          {loading ? (
            <div className={styles.loading}>{t("common.loading")}</div>
          ) : jobs.length === 0 ? (
            <div className={styles.emptyState}>
              {t("adminModeration.noJobs") || "No jobs found"}
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobHeader}>
                  <div className={styles.jobTitleSection}>
                    <h3 className={styles.jobTitle}>{job.title}</h3>
                    <div className={styles.jobMeta}>
                      <span className={styles.company}>
                        {job.organization?.name || "Unknown Company"}
                      </span>
                      <span className={styles.separator}>•</span>
                      <span className={styles.location}>
                        {job.province || job.address || "Location TBD"}
                      </span>
                      <span className={styles.separator}>•</span>
                      <span className={styles.date}>
                        {formatDate(job.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.jobActions}>
                    {getReviewStatusBadge(job.reviewStatus)}
                    <button
                      className={styles.viewBtn}
                      onClick={() => openModal(job)}
                    >
                      {t("adminModeration.viewDetails") || "View Details"}
                    </button>
                  </div>
                </div>
                <div className={styles.jobPreview}>
                  <p className={styles.jobDescription}>
                    {job.descriptions?.substring(0, 200) || "No description available"}
                    {job.descriptions?.length > 200 ? "..." : ""}
                  </p>
                  {job.reviewNotes && (
                    <div className={styles.reviewNotes}>
                      <strong>{t("adminModeration.reviewNotes") || "Review Notes"}:</strong>{" "}
                      {job.reviewNotes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              {t("common.previous") || "Previous"}
            </button>
            <span className={styles.pageInfo}>
              {t("common.page") || "Page"} {pagination.page} {t("common.of") || "of"}{" "}
              {pagination.totalPages}
            </span>
            <button
              className={styles.pageBtn}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              {t("common.next") || "Next"}
            </button>
          </div>
        )}

        {/* Review Modal */}
        {showModal && selectedJob && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{selectedJob.title}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalSection}>
                  <h3>{t("adminModeration.jobDetails") || "Job Details"}</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <strong>{t("adminModeration.company") || "Company"}:</strong>
                      <span>{selectedJob.organization?.name || "Unknown"}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>{t("adminModeration.location") || "Location"}:</strong>
                      <span>{selectedJob.province || selectedJob.address || "TBD"}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>{t("adminModeration.salary") || "Salary"}:</strong>
                      <span>
                        {selectedJob.minSalary && selectedJob.maxSalary
                          ? `$${selectedJob.minSalary} - $${selectedJob.maxSalary}`
                          : selectedJob.minSalary
                          ? `$${selectedJob.minSalary}+`
                          : "Negotiable"}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>{t("adminModeration.statusLabel") || "Status"}:</strong>
                      {getReviewStatusBadge(selectedJob.reviewStatus)}
                    </div>
                    <div className={styles.detailItem}>
                      <strong>{t("adminModeration.createdAt") || "Created"}:</strong>
                      <span>{formatDate(selectedJob.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.modalSection}>
                  <h3>{t("adminModeration.description") || "Description"}</h3>
                  <p className={styles.descriptionText}>
                    {selectedJob.descriptions || "No description provided"}
                  </p>
                </div>

                {selectedJob.reviewNotes && (
                  <div className={styles.modalSection}>
                    <h3>{t("adminModeration.previousNotes") || "Previous Review Notes"}</h3>
                    <p className={styles.notesText}>{selectedJob.reviewNotes}</p>
                  </div>
                )}

                <div className={styles.modalSection}>
                  <h3>{t("adminModeration.reviewNotes") || "Review Notes"}</h3>
                  <textarea
                    className={styles.notesTextarea}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={t("adminModeration.notesPlaceholder") || "Add review notes (required for rejection)..."}
                    rows={4}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelBtn}
                  onClick={closeModal}
                  disabled={processing === selectedJob.id}
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                {selectedJob.reviewStatus !== "approved" && (
                  <button
                    className={styles.approveBtn}
                    onClick={() => handleApprove(selectedJob.id)}
                    disabled={processing === selectedJob.id}
                  >
                    {processing === selectedJob.id
                      ? t("common.loading") || "Loading..."
                      : t("adminModeration.approve") || "Approve"}
                  </button>
                )}
                {selectedJob.reviewStatus !== "rejected" && (
                  <button
                    className={styles.rejectBtn}
                    onClick={() => handleReject(selectedJob.id)}
                    disabled={processing === selectedJob.id}
                  >
                    {processing === selectedJob.id
                      ? t("common.loading") || "Loading..."
                      : t("adminModeration.reject") || "Reject"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminJobModerationPage;

